import type {
  BarrierThresholds,
  ProfileId,
  RouteRequest,
  RoutingProvider,
  SourceDescriptor,
  WalkingRoute,
} from '@krakow-bez-barier/core';
import { fetchGraphHopperRoute } from './client';
import type { AccessibleRouteResult } from './types';

const DEFAULT_PROFILE_THRESHOLDS: Record<ProfileId, BarrierThresholds> = {
  wheelchair: {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
  },
  stroller: {
    maxKerbMillimetres: 60,
    minWidthMetres: 0.75,
    maxInclinePercent: 8,
    stepsAreBlocker: false,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted', 'fine_gravel'],
  },
  custom: {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
  },
};

export interface GraphHopperProviderOptions {
  apiBase?: string;
  fetchFn?: typeof fetch;
  thresholds?: BarrierThresholds;
}

export class GraphHopperRoutingProvider implements RoutingProvider {
  private readonly apiBase: string;
  private readonly fetchFn: typeof fetch;
  private readonly thresholds?: BarrierThresholds;

  constructor(options?: GraphHopperProviderOptions) {
    this.apiBase = options?.apiBase || process.env.EXPO_PUBLIC_GRAPHHOPPER_URL || 'http://localhost:8989';
    this.fetchFn = options?.fetchFn || globalThis.fetch.bind(globalThis);
    this.thresholds = options?.thresholds;
  }

  describe(): SourceDescriptor {
    return {
      name: 'GraphHopper (Self-Hosted Routing)',
      url: this.apiBase,
      licence: 'Apache 2.0 / OpenStreetMap ODbL',
      attribution: '© OpenStreetMap contributors, GraphHopper engine',
      updateFrequency: 'continuous',
    };
  }

  async route(request: RouteRequest): Promise<WalkingRoute> {
    const profileThresholds =
      this.thresholds || DEFAULT_PROFILE_THRESHOLDS[request.profileId] || DEFAULT_PROFILE_THRESHOLDS.wheelchair;

    const result = await fetchGraphHopperRoute(
      {
        apiBase: this.apiBase,
        start: request.start,
        end: request.end,
        waypoints: request.waypoints,
        thresholds: profileThresholds,
        lang: 'pl',
      },
      this.fetchFn,
    );

    return {
      provider: 'graphhopper',
      lengthMetres: result.distanceMeters,
      durationSeconds: result.timeSeconds,
      coordinates: result.geometry.coordinates,
      retrievedAt: new Date().toISOString(),
    };
  }

  async routeDetailed(
    request: RouteRequest,
    customThresholds?: BarrierThresholds,
  ): Promise<AccessibleRouteResult> {
    const profileThresholds =
      customThresholds ||
      this.thresholds ||
      DEFAULT_PROFILE_THRESHOLDS[request.profileId] ||
      DEFAULT_PROFILE_THRESHOLDS.wheelchair;

    return fetchGraphHopperRoute(
      {
        apiBase: this.apiBase,
        start: request.start,
        end: request.end,
        waypoints: request.waypoints,
        thresholds: profileThresholds,
        lang: 'pl',
      },
      this.fetchFn,
    );
  }
}
