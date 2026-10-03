import { SourceFailure } from '@krakow-bez-barier/core';
import { failureFromHttp, failureFromUnknown, parseJsonBody } from './http';
import { MapyRoutingProvider } from './provider';

describe('Adapter Failure Handling (T7)', () => {
  test('maps HTTP 429 to rate_limited SourceFailure', () => {
    const failure = failureFromHttp('Mapy.com', 429);
    expect(failure).toBeInstanceOf(SourceFailure);
    expect(failure.kind).toBe('rate_limited');
    expect(failure.httpStatus).toBe(429);
    expect(failure.message).toContain('HTTP 429');
  });

  test('maps HTTP 401 to unauthorized SourceFailure', () => {
    const failure = failureFromHttp('Mapy.com', 401);
    expect(failure.kind).toBe('unauthorized');
    expect(failure.httpStatus).toBe(401);
  });

  test('maps HTTP 503 to server SourceFailure', () => {
    const failure = failureFromHttp('OpenStreetMap (Overpass)', 503);
    expect(failure.kind).toBe('server');
    expect(failure.httpStatus).toBe(503);
  });

  test('parses invalid JSON as malformed SourceFailure', () => {
    expect(() => parseJsonBody('Mapy.com', '<html<body>Error</body></html>')).toThrow(
      SourceFailure,
    );
    try {
      parseJsonBody('Mapy.com', 'bad json');
    } catch (err: any) {
      expect(err.kind).toBe('malformed');
    }
  });

  test('handles network abort or timeout as timeout SourceFailure', () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    const failure = failureFromUnknown('OpenStreetMap', abortErr);
    expect(failure.kind).toBe('timeout');
  });

  test('MapyRoutingProvider rejects empty API key with unauthorized SourceFailure', async () => {
    const provider = new MapyRoutingProvider({ apiKey: '' });
    await expect(
      provider.route({
        start: { lon: 19.93, lat: 50.06 },
        end: { lon: 19.94, lat: 50.05 },
        profileId: 'wheelchair',
      }),
    ).rejects.toThrow(SourceFailure);
  });
});
