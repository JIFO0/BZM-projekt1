import http from 'node:http';

export interface ServerOptions {
  port?: number;
  host?: string;
  handleSignals?: boolean;
}

/**
 * Creates the HTTP request listener and server instance.
 * Responds with a basic OK message.
 */
export function createServer(): http.Server {
  const server = http.createServer((req, res) => {
    // Basic CORS support for client development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK\n');
  });

  return server;
}

/**
 * Starts the HTTP server on the configured port and host.
 */
export function startServer(options: ServerOptions = {}): http.Server {
  const port = options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const host = options.host ?? (process.env.HOST || '0.0.0.0');
  const server = createServer();

  server.listen(port, host, () => {
    console.log('--- Kraków bez barier: Serwer uruchomiony ---');
    console.log(`Nasłuchiwanie na http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log('Odpowiedź testowa: OK');
  });

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
