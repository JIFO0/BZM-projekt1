import {
  haversineDistanceMetres,
  type RouteRequest,
  type RoutingProvider,
  type SourceDescriptor,
  type WalkingRoute,
} from '@krakow-bez-barier/core';

export interface OsmRoutingProviderOptions {
  osrmEndpoint?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export class OsmRoutingProvider implements RoutingProvider {
  private readonly osrmEndpoint: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: OsmRoutingProviderOptions = {}) {
    this.osrmEndpoint = options.osrmEndpoint || 'https://router.project-osrm.org';
    this.fetchFn = options.fetchFn || globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  describe(): SourceDescriptor {
    return {
      name: 'OpenStreetMap Routing (OSRM Foot)',
      url: this.osrmEndpoint,
      licence: 'Open Database License (ODbL 1.0)',
      attribution: '© OpenStreetMap contributors, OSRM Project',
      updateFrequency: 'continuous',
    };
  }

  async route(request: RouteRequest): Promise<WalkingRoute> {
    const { start, end } = request;
    const url = `${this.osrmEndpoint}/route/v1/foot/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'KrakowBezBarier/0.1 (HackYeah 2026 prototype; contact@example.com)',
        },
        signal: controller.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const routeData = data.routes?.[0];
        if (routeData && Array.isArray(routeData.geometry?.coordinates)) {
          return {
            provider: 'osm-osrm',
            lengthMetres: Math.round(routeData.distance),
            durationSeconds: Math.round(routeData.duration),
            coordinates: routeData.geometry.coordinates,
            retrievedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // If OSRM fails or times out, fallback to direct interpolated line below
    } finally {
      clearTimeout(timer);
    }

    // Direct geometric interpolation connecting start and end
    const dist = haversineDistanceMetres(start, end);
    const steps = 8;
    const coordinates: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      coordinates.push([
        Number((start.lon + (end.lon - start.lon) * t).toFixed(6)),
        Number((start.lat + (end.lat - start.lat) * t).toFixed(6)),
      ]);
    }

    return {
      provider: 'osm-direct',
      lengthMetres: Math.round(dist),
      durationSeconds: Math.round(dist / 1.2), // average walking speed 1.2 m/s
      coordinates,
      retrievedAt: new Date().toISOString(),
    };
  }
}
