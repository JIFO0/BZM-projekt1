import http from 'node:http';
import { createServer } from './server';
import type { ServerType } from '@hono/node-server';

describe('Server component', () => {
  let server: ServerType;
  let port: number;

  beforeAll((done) => {
    server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        port = address.port;
        done();
      } else {
        done(new Error('Failed to obtain server port'));
      }
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('responds with 200 status code and OK body on GET /status', (done) => {
    http.get(`http://127.0.0.1:${port}/status`, (res) => {
      expect(res.statusCode).toBe(200);
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        expect(body.trim()).toBe('OK');
        done();
      });
    }).on('error', (err) => {
      done(err);
    });
  });

  test('responds with 404 for unhandled routes like GET /', (done) => {
    http.get(`http://127.0.0.1:${port}/`, (res) => {
      expect(res.statusCode).toBe(404);
      done();
    }).on('error', (err) => {
      done(err);
    });
  });

  test('validates parameters on GET /tiles/geoportal/:z/:row/:col', (done) => {
    http.get(`http://127.0.0.1:${port}/tiles/geoportal/abc/xyz/def`, (res) => {
      expect(res.statusCode).toBe(400);
      done();
    }).on('error', (err) => {
      done(err);
    });
  });

  test('returns single standard CORS header Access-Control-Allow-Origin: *', (done) => {
    http.get(`http://127.0.0.1:${port}/status`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      done();
    }).on('error', (err) => {
      done(err);
    });
  });
});
