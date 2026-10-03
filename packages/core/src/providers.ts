import type { SourceFailure } from './errors';
import type { Fact, LonLat, ProfileId, SourceDescriptor } from './types';
import type { RouteReport } from './report';

export interface RouteRequest {
  start: LonLat;
  end: LonLat;
  waypoints?: LonLat[];
  profileId: ProfileId;
}

/** A walking route from a routing provider. Not an accessibility verdict. */
export interface WalkingRoute {
  provider: string;
  lengthMetres: number;
  durationSeconds: number;
  /** GeoJSON LineString coordinates: [lon, lat]. */
  coordinates: Array<[number, number]>;
  retrievedAt: string;
}

export interface PlaceHit {
  id: string;
  name: string;
  label: string;
  position: LonLat;
  kind: string;
}

export interface RoutingProvider {
  describe(): SourceDescriptor;
  route(request: RouteRequest): Promise<WalkingRoute>;
}

export interface GeocodingProvider {
  describe(): SourceDescriptor;
  suggest(query: string, lang: string): Promise<PlaceHit[]>;
  geocode(query: string, lang: string): Promise<PlaceHit[]>;
}

export interface GeometryQuery {
  coordinates: Array<[number, number]>;
  corridorMetres: number;
}

export interface PlaceQuery {
  name: string;
  position: LonLat;
  maxDistanceMetres: number;
}

export interface AccessibilityBundle {
  facts: Fact[];
  retrievedAt: string;
  /** Set when the source answered but matching was not confident. */
  matchConfidence?: number;
}

export interface AccessibilityDataSource {
  describe(): SourceDescriptor;
  fetchAroundGeometry(query: GeometryQuery): Promise<AccessibilityBundle>;
  fetchPlace(query: PlaceQuery): Promise<AccessibilityBundle>;
}

export interface TileProvider {
  describe(): SourceDescriptor;
  /** Mapset id from city config. The tile URL template comes from the provider, not the UI. */
  mapset(): string;
}

export interface RouteAnalysis {
  analyze(route: WalkingRoute, facts: Fact[], profileId: ProfileId): RouteReport;
}

export function isSourceFailure(error: unknown): error is SourceFailure {
  return error instanceof Error && error.name === 'SourceFailure';
}
