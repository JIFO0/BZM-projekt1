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

export interface AppOptions {
  repo?: ReportsRepository;
  placesRegistry?: PlacesRegistry;
}

export interface ServerOptions extends AppOptions {
  port?: number;
  host?: string;
  handleSignals?: boolean;
}

/**
 * Creates and configures the Hono application instance with reports and comments routes.
 */
export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();

  // Enable CORS for all routes
  app.use('*', cors());

  // Health check / status route
  app.get('/status', (c) => {
    return c.text('OK\n');
  });

  const placesRegistry = options.placesRegistry ?? defaultPlacesRegistry;
  const repo = options.repo ?? new MemoryReportsRepository(placesRegistry);

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
  const finalApp = app ?? createApp(options);
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
      console.log('Public API:  /api/hazards, /api/places');
      console.log('Admin API:   /admin/hazards, /admin/places');
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
