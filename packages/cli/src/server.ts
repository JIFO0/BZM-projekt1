import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve, createAdaptorServer, type ServerType } from '@hono/node-server';

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
