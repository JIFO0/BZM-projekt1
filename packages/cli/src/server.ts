import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve, createAdaptorServer, type ServerType } from '@hono/node-server';
import {
  type ReportsRepository,
  MemoryReportsRepository,
  type PlacesRegistry,
  defaultPlacesRegistry,
} from './storage';
import { createHazardsRouter, createCommentsRouter } from './routes';
import { getTilesDirectory, getTileUrl } from './tiles';

export interface AppOptions {
  repo?: ReportsRepository;
  placesRegistry?: PlacesRegistry;
  seedInitialData?: boolean;
}

export interface ServerOptions extends AppOptions {
  port?: number;
  host?: string;
  handleSignals?: boolean;
}

const uploadedFilesCache = new Map<string, { buffer: Buffer; mime: string }>();

function getUploadsDirectory(): string {
  const dir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Non-fatal
  }
  return dir;
}

/**
 * Creates and configures the Hono application instance with tiles, reports and comments routes.
 */
export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();

  // Enable CORS for all routes
  app.use('*', cors());

  // Health check / status route
  app.get('/status', (c) => {
    return c.text('OK\n');
  });

  // Local Geoportal WMTS tile cache endpoint
  // Matches: /tiles/geoportal/:z/:row/:col or /tiles/geoportal/:z/:row/:col.png
  app.get('/tiles/geoportal/:z/:row/:col', async (c) => {
    const z = parseInt(c.req.param('z'), 10);
    const row = parseInt(c.req.param('row'), 10);
    const colStr = c.req.param('col').replace(/\.png$/i, '');
    const col = parseInt(colStr, 10);

    if (isNaN(z) || isNaN(row) || isNaN(col)) {
      return c.text('Nieprawidłowe parametry kafelka', 400);
    }

    const tilesDir = getTilesDirectory();
    const localTilePath = path.join(tilesDir, String(z), String(row), `${col}.png`);

    if (fs.existsSync(localTilePath) && fs.statSync(localTilePath).size > 100) {
      const data = fs.readFileSync(localTilePath);
      return new Response(data, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Tile-Cache': 'HIT',
        },
      });
    }

    // Proxy from Geoportal and write-through cache to local storage
    const remoteUrl = getTileUrl(z, row, col);
    try {
      const res = await fetch(remoteUrl);
      if (!res.ok) {
        return c.text(`Remote tile error: ${res.status}`, res.status as any);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        fs.mkdirSync(path.dirname(localTilePath), { recursive: true });
        fs.writeFileSync(localTilePath, buffer);
      } catch {
        // Non-fatal if write fails
      }

      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Tile-Cache': 'MISS',
        },
      });
    } catch (err: any) {
      return c.text(`Nie udało się pobrać kafelka: ${err.message}`, 502);
    }
  });

  // Photo Upload Endpoint (/api/upload)
  app.post('/api/upload', async (c) => {
    try {
      const contentType = c.req.header('content-type') || '';
      let buffer: Buffer | null = null;
      let mimeType = 'image/jpeg';
      let originalName = 'photo.jpg';

      if (contentType.includes('application/json')) {
        const body = await c.req.json();
        const imageStr = body.image || body.photo || body.data;
        if (!imageStr || typeof imageStr !== 'string') {
          return c.json({ error: "Missing 'image' base64 data in body." }, 400);
        }
        if (imageStr.startsWith('data:')) {
          const match = imageStr.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1]!;
            buffer = Buffer.from(match[2]!, 'base64');
          } else {
            buffer = Buffer.from(imageStr, 'base64');
          }
        } else {
          buffer = Buffer.from(imageStr, 'base64');
        }
        if (body.filename) originalName = body.filename;
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        const file = (formData.get('file') || formData.get('photo') || formData.get('image')) as File | null;
        if (!file) {
          return c.json({ error: "No file provided in form field 'file' or 'photo'." }, 400);
        }
        mimeType = file.type || 'image/jpeg';
        originalName = file.name || 'photo.jpg';
        const arrBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrBuf);
      } else {
        const arrBuf = await c.req.arrayBuffer();
        buffer = Buffer.from(arrBuf);
        mimeType = contentType || 'image/jpeg';
      }

      if (!buffer || buffer.length === 0) {
        return c.json({ error: 'Empty file payload.' }, 400);
      }

      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const filename = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Save in memory cache
      uploadedFilesCache.set(filename, { buffer, mime: mimeType });

      // Save to disk
      try {
        const uploadsDir = getUploadsDirectory();
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      } catch {
        // Fall back gracefully to memory cache
      }

      const relativeUrl = `/uploads/${filename}`;
      return c.json(
        {
          success: true,
          filename,
          url: relativeUrl,
          size: buffer.length,
          mimeType,
        },
        201
      );
    } catch (err: any) {
      return c.json({ error: `Upload error: ${err.message}` }, 500);
    }
  });

  // Serve Uploaded Photos (/uploads/:filename and /api/uploads/:filename)
  const serveUpload = (c: any) => {
    const filename = path.basename(c.req.param('filename'));
    const cached = uploadedFilesCache.get(filename);
    if (cached) {
      return new Response(cached.buffer, {
        headers: {
          'Content-Type': cached.mime,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const uploadsDir = getUploadsDirectory();
    const diskPath = path.join(uploadsDir, filename);
    if (fs.existsSync(diskPath)) {
      const data = fs.readFileSync(diskPath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return new Response(data, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return c.text('Not found', 404);
  };

  app.get('/uploads/:filename', serveUpload);
  app.get('/api/uploads/:filename', serveUpload);

  const placesRegistry = options.placesRegistry ?? defaultPlacesRegistry;
  const repo = options.repo ?? new MemoryReportsRepository(placesRegistry);

  if (options.seedInitialData && typeof (repo as any).seedDefaultHazards === 'function') {
    (repo as any).seedDefaultHazards();
  }

  // Mount public endpoints (/api/...)
  app.route('/api/hazards', createHazardsRouter({ repo, isAdmin: false }));
  app.route('/api/places', createCommentsRouter({ repo, placesRegistry, isAdmin: false }));

  // Mount administrative endpoints (/admin/...)
  app.route('/admin/hazards', createHazardsRouter({ repo, isAdmin: true }));
  app.route('/admin/places', createCommentsRouter({ repo, placesRegistry, isAdmin: true }));

  return app;
}

/**
 * Creates a Node.js HTTP server instance adapted from the Hono app.
 */
export function createServer(app: Hono = createApp()): ServerType {
  return createAdaptorServer({ fetch: app.fetch });
}

/**
 * Starts the HTTP server on the configured port and host.
 */
export function startServer(options: ServerOptions = {}, app?: Hono): ServerType {
  const finalApp = app ?? createApp({ seedInitialData: true, ...options });
  const port = options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const host = options.host ?? (process.env.HOST || '0.0.0.0');

  const server = serve(
    {
      fetch: finalApp.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log('--- Kraków bez barier: Serwer uruchomiony (Hono) ---');
      console.log(`Nasłuchiwanie na http://${host === '0.0.0.0' ? 'localhost' : host}:${info.port}`);
      console.log('Status endpoint: GET /status');
      console.log('Tile proxy:      GET /tiles/geoportal/:z/:row/:col[.png]');
      console.log('Photo upload:    POST /api/upload');
      console.log('Public API:      /api/hazards, /api/places');
      console.log('Admin API:       /admin/hazards, /admin/places');
    }
  );

  if (options.handleSignals !== false) {
    const handleShutdown = () => {
      console.log('\nZamykanie serwera...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  }

  return server;
}
