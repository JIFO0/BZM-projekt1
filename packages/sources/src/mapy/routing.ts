import type { LonLat } from '@krakow-bez-barier/core';

export interface FootRouteQuery {
  apiBase: string;
  start: LonLat;
  end: LonLat;
  waypoints?: LonLat[];
  lang: 'pl' | 'en';
}

/**
 * Walking route only. Mapy.com RouteType enum (OpenAPI 2.1.14) is
 * car_fast, car_fast_traffic, car_short, foot_fast, foot_hiking, bike_road, bike_mountain.
 * There is no wheelchair or stroller profile. Alternatives are not a parameter;
 * up to 15 waypoints are supported.
 * https://api.mapy.com/v1/docs/routing/openapi.json
 * https://developer.mapy.com/rest-api-mapy-cz/function/routing/
 *
 * Coordinates are longitude, latitude. The API key is intentionally absent.
 */
export function buildFootRouteUrl(query: FootRouteQuery): URL {
  const url = new URL('/v1/routing/route', query.apiBase);
  url.searchParams.set('start', pair(query.start));
  url.searchParams.set('end', pair(query.end));
  url.searchParams.set('routeType', 'foot_fast');
  url.searchParams.set('format', 'geojson');
  url.searchParams.set('lang', query.lang);
  if (query.waypoints && query.waypoints.length > 0) {
    if (query.waypoints.length > 15) {
      throw new Error('Mapy.com routing accepts at most 15 waypoints');
    }
    url.searchParams.set('waypoints', query.waypoints.map(pair).join(';'));
  }
  return url;
}

function pair(point: LonLat): string {
  return `${point.lon},${point.lat}`;
}
