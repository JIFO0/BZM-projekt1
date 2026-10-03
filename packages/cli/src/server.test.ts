import http from 'node:http';
import { createServer } from './server';

describe('Server component', () => {
  let server: http.Server;
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

  test('responds with 200 status code and OK body', (done) => {
    http.get(`http://127.0.0.1:${port}/`, (res) => {
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
});
