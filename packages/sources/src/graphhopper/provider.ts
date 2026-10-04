import type {
  BarrierThresholds,
  Fact,
  ProfileId,
  RouteRequest,
  RoutingProvider,
  SourceDescriptor,
  WalkingRoute,
} from '@krakow-bez-barier/core';
import { fetchGraphHopperRoute, fetchRouteRespectingDetour } from './client';
import { factsFromAccessibleRoute } from './mapper';
import type { AccessibleRouteResult } from './types';

const DEFAULT_PROFILE_THRESHOLDS: Record<ProfileId, BarrierThresholds> = {
  wheelchair: {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
    blockedRoadTypes: ['cobblestone', 'sand'],
    blockedSurfaces: ['cobblestone', 'sand'],
  },
  custom: {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: false,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
    blockedRoadTypes: [],
    blockedSurfaces: [],
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
    this.apiBase =
      options?.apiBase ||
      process.env.EXPO_PUBLIC_GRAPHHOPPER_URL ||
      'http://hopper.accessible.krakow.local';
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
      request.thresholds ||
      this.thresholds ||
      DEFAULT_PROFILE_THRESHOLDS[request.profileId] ||
      DEFAULT_PROFILE_THRESHOLDS.wheelchair;

    const planned = await fetchRouteRespectingDetour(
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
      lengthMetres: planned.result.distanceMeters,
      durationSeconds: planned.result.timeSeconds,
      coordinates: planned.result.geometry.coordinates,
      retrievedAt: new Date().toISOString(),
      surfaceSpans: planned.colorBySurface ? planned.result.surfaceSpans ?? [] : undefined,
    };
  }

  /**
   * Barrier-light walk (without a wild detour) and the plain fastest foot walk.
   * Failing segments are attached as surface spans so the map can paint them orange.
   */
  async routePair(request: RouteRequest): Promise<{
    accessible: WalkingRoute;
    fastest: WalkingRoute;
    accessibleFacts: Fact[];
    fastestFacts: Fact[];
  }> {
    const profileThresholds =
      request.thresholds ||
      this.thresholds ||
      DEFAULT_PROFILE_THRESHOLDS[request.profileId] ||
      DEFAULT_PROFILE_THRESHOLDS.wheelchair;

    const planned = await fetchRouteRespectingDetour(
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

    const retrievedAt = new Date().toISOString();
    return {
      accessible: {
        provider: 'graphhopper',
        lengthMetres: planned.result.distanceMeters,
        durationSeconds: planned.result.timeSeconds,
        coordinates: planned.result.geometry.coordinates,
        retrievedAt,
        surfaceSpans: planned.colorBySurface ? planned.result.surfaceSpans ?? [] : undefined,
      },
      fastest: {
        provider: 'graphhopper',
        lengthMetres: planned.fastest.distanceMeters,
        durationSeconds: planned.fastest.timeSeconds,
        coordinates: planned.fastest.geometry.coordinates,
        retrievedAt,
        surfaceSpans: planned.fastest.surfaceSpans ?? [],
      },
      accessibleFacts: factsFromAccessibleRoute(planned.result, retrievedAt),
      fastestFacts: factsFromAccessibleRoute(planned.fastest, retrievedAt),
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
