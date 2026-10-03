import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve, createAdaptorServer, type ServerType } from '@hono/node-server';

import fs from 'fs';
import path from 'path';
import { getTilesDirectory, getTileUrl } from './tiles';

export interface ServerOptions {
  port?: number;
  host?: string;
  handleSignals?: boolean;
}

/**
 * Creates and configures the Hono application instance.
 */
export function createApp(): Hono {
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
export function startServer(options: ServerOptions = {}, app: Hono = createApp()): ServerType {
  const port = options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const host = options.host ?? (process.env.HOST || '0.0.0.0');

  const server = serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log('--- Kraków bez barier: Serwer uruchomiony (Hono) ---');
      console.log(`Nasłuchiwanie na http://${host === '0.0.0.0' ? 'localhost' : host}:${info.port}`);
      console.log('Status endpoint: GET /status');
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
