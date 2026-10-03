import { SourceFailure, type SourceFailureKind } from '@krakow-bez-barier/core';

/**
 * Auth is the X-Mapy-Api-Key header, not the query string.
 * OpenAPI securitySchemes.headerApiKey, routing spec 2.1.14:
 * https://api.mapy.com/v1/docs/routing/openapi.json
 */
export function mapyAuthHeaders(apiKey: string): Record<string, string> {
  if (!apiKey.trim()) {
    throw new SourceFailure('Mapy.com', 'unauthorized', 401, 'Mapy.com API key is missing');
  }
  return {
    Accept: 'application/json',
    'X-Mapy-Api-Key': apiKey,
  };
}

/**
 * Maps HTTP statuses we have seen documented.
 * Routing OpenAPI lists 401, 403, 404 and 422.
 * 429 is handled because the same spec states a rate limit (30 requests/second
 * on routing) and clients must not present a rate limit as an empty route.
 * 5xx is documented on reverse geocode and treated the same for every Mapy call.
 */
export function failureFromHttp(sourceName: string, status: number): SourceFailure {
  const kind = kindForStatus(status);
  return new SourceFailure(sourceName, kind, status, `${sourceName} returned HTTP ${status}`);
}

function kindForStatus(status: number): SourceFailureKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unavailable';
}

export function parseJsonBody(sourceName: string, text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SourceFailure(sourceName, 'malformed', undefined, `${sourceName} returned malformed JSON`);
  }
}

export function failureFromUnknown(sourceName: string, error: unknown): SourceFailure {
  if (error instanceof SourceFailure) return error;
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return new SourceFailure(sourceName, 'timeout', undefined, `${sourceName} request timed out`);
  }
  return new SourceFailure(sourceName, 'unavailable', undefined, `${sourceName} request failed`);
}
