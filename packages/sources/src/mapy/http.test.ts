import { SourceFailure } from '@krakow-bez-barier/core';

import { buildFootRouteUrl } from './routing';
import { buildSuggestUrl } from './geocode';
import { failureFromHttp, failureFromUnknown, mapyAuthHeaders, parseJsonBody } from './http';

describe('Mapy.com client edges', () => {
  it('keeps the API key out of the route and suggest URLs', () => {
    const route = buildFootRouteUrl({
      apiBase: 'https://api.mapy.com',
      start: { lon: 19.937, lat: 50.061 },
      end: { lon: 19.935, lat: 50.054 },
      lang: 'pl',
    });
    const suggest = buildSuggestUrl('https://api.mapy.com', 'Wawel', 'pl');
    expect(route.searchParams.get('routeType')).toBe('foot_fast');
    expect(route.searchParams.get('start')).toBe('19.937,50.061');
    expect(route.toString()).not.toContain('apikey');
    expect(suggest.toString()).not.toContain('apikey');
    expect(mapyAuthHeaders('secret-key')['X-Mapy-Api-Key']).toBe('secret-key');
  });

  it('maps timeout, 429 and malformed JSON to typed failures', () => {
    expect(failureFromHttp('Mapy.com', 429).kind).toBe('rate_limited');
    expect(failureFromHttp('Mapy.com', 401).kind).toBe('unauthorized');
    expect(failureFromHttp('Overpass', 503).kind).toBe('server');
    expect(() => parseJsonBody('Overpass', '{')).toThrow(SourceFailure);
    try {
      parseJsonBody('Overpass', '{');
    } catch (error) {
      expect(error).toBeInstanceOf(SourceFailure);
      expect((error as SourceFailure).kind).toBe('malformed');
    }
    const timeout = failureFromUnknown('Overpass', Object.assign(new Error('aborted'), { name: 'AbortError' }));
    expect(timeout.kind).toBe('timeout');
  });
});
