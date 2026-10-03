import {
  MAPY_ATTRIBUTION,
  type GeocodingProvider,
  type PlaceHit,
  type RouteRequest,
  type RoutingProvider,
  type SourceDescriptor,
  type WalkingRoute,
} from '@krakow-bez-barier/core';

import { buildGeocodeUrl, buildSuggestUrl } from './geocode';
import { failureFromHttp, failureFromUnknown, mapyAuthHeaders, parseJsonBody } from './http';
import { buildFootRouteUrl } from './routing';

export interface MapyProviderOptions {
  apiKey: string;
  apiBase?: string;
  fetchFn?: typeof fetch;
}

export class MapyRoutingProvider implements RoutingProvider {
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: MapyProviderOptions) {
    this.apiKey = options.apiKey;
    this.apiBase = options.apiBase ?? 'https://api.mapy.com';
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  describe(): SourceDescriptor {
    return {
      name: MAPY_ATTRIBUTION.name,
      url: 'https://developer.mapy.com',
      licence: MAPY_ATTRIBUTION.licence,
      attribution: MAPY_ATTRIBUTION.attribution,
      updateFrequency: 'continuous',
    };
  }

  async route(request: RouteRequest): Promise<WalkingRoute> {
    const url = buildFootRouteUrl({
      apiBase: this.apiBase,
      start: request.start,
      end: request.end,
      waypoints: request.waypoints,
      lang: 'pl',
    });

    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: mapyAuthHeaders(this.apiKey),
      });

      if (!response.ok) {
        throw failureFromHttp('Mapy.com', response.status);
      }

      const text = await response.text();
      const data = parseJsonBody('Mapy.com', text) as any;

      // Extract geometry from GeoJSON format
      let coordinates: Array<[number, number]> = [];
      if (Array.isArray(data?.geometry?.geometry?.coordinates)) {
        coordinates = data.geometry.geometry.coordinates;
      } else if (Array.isArray(data?.geometry?.coordinates)) {
        coordinates = data.geometry.coordinates;
      } else if (Array.isArray(data?.features?.[0]?.geometry?.coordinates)) {
        coordinates = data.features[0].geometry.coordinates;
      } else if (Array.isArray(data?.routes?.[0]?.geometry?.coordinates)) {
        coordinates = data.routes[0].geometry.coordinates;
      }

      const lengthMetres =
        data?.length ??
        data?.properties?.length ??
        data?.geometry?.properties?.length ??
        data?.features?.[0]?.properties?.length ??
        data?.routes?.[0]?.length ??
        0;

      const durationSeconds =
        data?.duration ??
        data?.properties?.duration ??
        data?.geometry?.properties?.duration ??
        data?.features?.[0]?.properties?.duration ??
        data?.routes?.[0]?.duration ??
        0;

      return {
        provider: 'Mapy.com',
        lengthMetres: Math.round(lengthMetres),
        durationSeconds: Math.round(durationSeconds),
        coordinates,
        retrievedAt: new Date().toISOString(),
      };
    } catch (err) {
      throw failureFromUnknown('Mapy.com', err);
    }
  }
}

export class MapyGeocodingProvider implements GeocodingProvider {
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: MapyProviderOptions) {
    this.apiKey = options.apiKey;
    this.apiBase = options.apiBase ?? 'https://api.mapy.com';
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  describe(): SourceDescriptor {
    return {
      name: MAPY_ATTRIBUTION.name,
      url: 'https://developer.mapy.com',
      licence: MAPY_ATTRIBUTION.licence,
      attribution: MAPY_ATTRIBUTION.attribution,
      updateFrequency: 'continuous',
    };
  }

  async suggest(query: string, lang: string): Promise<PlaceHit[]> {
    if (!query.trim()) return [];

    const url = buildSuggestUrl(this.apiBase, query, lang === 'en' ? 'en' : 'pl');
    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: mapyAuthHeaders(this.apiKey),
      });

      if (!response.ok) {
        throw failureFromHttp('Mapy.com', response.status);
      }

      const text = await response.text();
      const data = parseJsonBody('Mapy.com', text) as any;
      const items = data?.result ?? data?.items ?? [];

      return items.map((item: any, idx: number) => ({
        id: item.id ? String(item.id) : `suggest-${idx}`,
        name: item.name ?? item.title ?? query,
        label: item.label ?? item.location ?? item.name ?? query,
        position: {
          lon: item.position?.lon ?? item.lon ?? 0,
          lat: item.position?.lat ?? item.lat ?? 0,
        },
        kind: item.type ?? item.category ?? 'place',
      }));
    } catch (err) {
      throw failureFromUnknown('Mapy.com', err);
    }
  }

  async geocode(query: string, lang: string): Promise<PlaceHit[]> {
    if (!query.trim()) return [];

    const url = buildGeocodeUrl(this.apiBase, query, lang === 'en' ? 'en' : 'pl');
    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: mapyAuthHeaders(this.apiKey),
      });

      if (!response.ok) {
        throw failureFromHttp('Mapy.com', response.status);
      }

      const text = await response.text();
      const data = parseJsonBody('Mapy.com', text) as any;
      const items = data?.items ?? data?.result ?? [];

      return items.map((item: any, idx: number) => ({
        id: item.id ? String(item.id) : `geocode-${idx}`,
        name: item.name ?? item.title ?? query,
        label: item.label ?? item.location ?? item.name ?? query,
        position: {
          lon: item.position?.lon ?? item.lon ?? 0,
          lat: item.position?.lat ?? item.lat ?? 0,
        },
        kind: item.type ?? item.category ?? 'place',
      }));
    } catch (err) {
      throw failureFromUnknown('Mapy.com', err);
    }
  }
}
