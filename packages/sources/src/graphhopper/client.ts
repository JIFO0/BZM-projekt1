import { buildCustomModel } from './custom-model';
import { parseGraphHopperResponse } from './mapper';
import type { AccessibleRouteResult, GraphHopperRequestBody, GraphHopperRouteQuery } from './types';

/**
 * Builds the HTTP URL for a GraphHopper route query.
 */
export function buildGraphHopperUrl(apiBase: string): URL {
  const normalized = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  return new URL(`${normalized}/route`);
}

/**
 * Builds the POST request payload for GraphHopper with custom model weights.
 */
export function buildGraphHopperRequestBody(
  query: GraphHopperRouteQuery,
  options?: { includeSlope?: boolean },
): GraphHopperRequestBody {
  const points: [number, number][] = [
    [query.start.lon, query.start.lat],
    ...(query.waypoints || []).map((wp): [number, number] => [wp.lon, wp.lat]),
    [query.end.lon, query.end.lat],
  ];

  return {
    points,
    profile: 'foot',
    'ch.disable': true,
    points_encoded: false,
    locale: query.lang || 'pl',
    details: ['surface', 'smoothness', 'max_width', 'footway', 'road_class'],
    custom_model: buildCustomModel(query.thresholds, options),
  };
}

/**
 * Fetches an accessible walking route from GraphHopper.
 */
export async function fetchGraphHopperRoute(
  query: GraphHopperRouteQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<AccessibleRouteResult> {
  const url = buildGraphHopperUrl(query.apiBase);

  const postRoute = async (includeSlope: boolean): Promise<Response> => {
    const body = buildGraphHopperRequestBody(query, { includeSlope });
    return fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  let response: Response;
  try {
    response = await postRoute(true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Nie udało się połączyć z silnikiem GraphHopper (${url.origin}): ${message}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = (await response.json()) as { message?: string; hints?: Array<{ message?: string }> };
      errorDetail = errJson.message || errJson.hints?.[0]?.message || '';
    } catch {
      // response wasn't JSON
    }
    const slopeMissing = /slope/i.test(errorDetail);
    if (slopeMissing) {
      try {
        response = await postRoute(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Nie udało się połączyć z silnikiem GraphHopper (${url.origin}): ${message}`);
      }
      if (response.ok) {
        const json = (await response.json()) as unknown;
        return parseGraphHopperResponse(json, query.thresholds);
      }
      try {
        const errJson = (await response.json()) as { message?: string; hints?: Array<{ message?: string }> };
        errorDetail = errJson.message || errJson.hints?.[0]?.message || errorDetail;
      } catch {
        // response wasn't JSON
      }
    }
    throw new Error(
      `Błąd wyznaczania trasy w GraphHopper (${response.status}): ${errorDetail || response.statusText}`,
    );
  }

  const json = (await response.json()) as unknown;
  return parseGraphHopperResponse(json, query.thresholds);
}
