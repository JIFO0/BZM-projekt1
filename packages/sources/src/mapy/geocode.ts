/**
 * Geocoding paths from OpenAPI:
 * https://api.mapy.com/v1/docs/geocode/openapi.json
 * GET /v1/geocode, GET /v1/suggest, GET /v1/rgeocode.
 * The key stays in the header. locality can be a country code; "pl" biases search.
 */
export function buildSuggestUrl(apiBase: string, query: string, lang: 'pl' | 'en'): URL {
  const url = new URL('/v1/suggest', apiBase);
  url.searchParams.set('query', query.slice(0, 150));
  url.searchParams.set('lang', lang);
  url.searchParams.set('limit', '8');
  url.searchParams.set('locality', 'pl');
  return url;
}

export function buildGeocodeUrl(apiBase: string, query: string, lang: 'pl' | 'en'): URL {
  const url = new URL('/v1/geocode', apiBase);
  url.searchParams.set('query', query.slice(0, 150));
  url.searchParams.set('lang', lang);
  url.searchParams.set('limit', '5');
  url.searchParams.set('locality', 'pl');
  return url;
}
