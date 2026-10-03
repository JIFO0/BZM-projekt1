import {
  isBarrierFreeDetourUnreasonable,
  maxOffsetFromPolylineMetres,
} from '@krakow-bez-barier/core';
import { buildCustomModel } from './custom-model';
import { parseGraphHopperResponse } from './mapper';
import type {
  AccessibleRouteResult,
  GraphHopperRequestBody,
  GraphHopperRouteQuery,
  RoutingWeightMode,
} from './types';

/** Prefer snapping onto a sidewalk instead of the carriageway centreline. */
const SIDEWALK_SNAP_PREVENTIONS = [
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'unclassified',
];

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
  options?: { includeSlope?: boolean; mode?: RoutingWeightMode; snapToSidewalk?: boolean },
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
    custom_model: buildCustomModel(query.thresholds, {
      includeSlope: options?.includeSlope,
      mode: options?.mode ?? query.mode ?? 'strict',
    }),
    ...(options?.snapToSidewalk === false ? {} : { snap_preventions: SIDEWALK_SNAP_PREVENTIONS }),
  };
}

/**
 * Fetches an accessible walking route from GraphHopper.
 */
async function readErrorDetail(response: Response): Promise<string> {
  try {
    const errJson = (await response.json()) as { message?: string; hints?: Array<{ message?: string }> };
    return errJson.message || errJson.hints?.[0]?.message || '';
  } catch {
    return '';
  }
}

export async function fetchGraphHopperRoute(
  query: GraphHopperRouteQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<AccessibleRouteResult> {
  const url = buildGraphHopperUrl(query.apiBase);
  let includeSlope = true;
  let snapToSidewalk = true;
  let response: Response | null = null;
  let errorDetail = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    const body = buildGraphHopperRequestBody(query, {
      includeSlope,
      snapToSidewalk,
      mode: query.mode,
    });
    try {
      response = await fetchImpl(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Nie udało się połączyć z silnikiem GraphHopper (${url.origin}): ${message}`);
    }

    if (response.ok) break;

    errorDetail = await readErrorDetail(response);
    const slopeMissing = includeSlope && /slope/i.test(errorDetail);
    const snapBlocked =
      snapToSidewalk && /snap|cannot find|not found|connection between|sequence of points/i.test(errorDetail);
    if (slopeMissing) {
      includeSlope = false;
      continue;
    }
    if (snapBlocked) {
      snapToSidewalk = false;
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    throw new Error(
      `Błąd wyznaczania trasy w GraphHopper (${response?.status ?? 0}): ${errorDetail || response?.statusText || 'brak odpowiedzi'}`,
    );
  }

  const json = (await response.json()) as unknown;
  return parseGraphHopperResponse(json, query.thresholds);
}

export interface DetourAwareRoute {
  result: AccessibleRouteResult;
  /** True when the practical walk is shown because the barrier-free line is unreasonable. */
  colorBySurface: boolean;
}

/**
 * Asks GraphHopper for a barrier-free walk and for the practical sidewalk walk.
 * The practical line is returned, with surface spans, only when the barrier-free
 * alternative adds about ten kilometres or swings a few kilometres off to the side.
 */
export async function fetchRouteRespectingDetour(
  query: GraphHopperRouteQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<DetourAwareRoute> {
  const [strictSettled, practicalSettled] = await Promise.allSettled([
    fetchGraphHopperRoute({ ...query, mode: 'strict' }, fetchImpl),
    fetchGraphHopperRoute({ ...query, mode: 'practical' }, fetchImpl),
  ]);

  const strict = strictSettled.status === 'fulfilled' ? strictSettled.value : null;
  const practical = practicalSettled.status === 'fulfilled' ? practicalSettled.value : null;

  if (!strict && !practical) {
    const reason = strictSettled.status === 'rejected' ? strictSettled.reason : new Error('Brak trasy');
    throw reason instanceof Error ? reason : new Error(String(reason));
  }
  if (!practical) return { result: strict!, colorBySurface: false };
  if (!strict) return { result: practical, colorBySurface: true };

  const unreasonable = isBarrierFreeDetourUnreasonable({
    practicalMetres: practical.distanceMeters,
    barrierFreeMetres: strict.distanceMeters,
    maxLateralMetres: maxOffsetFromPolylineMetres(
      strict.geometry.coordinates,
      practical.geometry.coordinates,
    ),
  });

  if (unreasonable) return { result: practical, colorBySurface: true };
  return { result: strict, colorBySurface: false };
}
