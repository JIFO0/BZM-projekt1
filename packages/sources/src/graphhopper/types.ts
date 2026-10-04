import type {
  BarrierThresholds,
  FactSource,
  FactStatus,
  LonLat,
  RouteSurfaceSpan,
  Severity,
} from '@krakow-bez-barier/core';

/**
 * `strict` forbids mapped barriers.
 * `practical` keeps the sidewalk walk when a barrier-free detour is unreasonable.
 * `fast` is the plain foot profile: the fastest pedestrian line, with no barrier weights.
 */
export type RoutingWeightMode = 'strict' | 'practical' | 'fast';

export interface GraphHopperRouteQuery {
  apiBase: string;
  start: LonLat;
  end: LonLat;
  waypoints?: LonLat[];
  thresholds: BarrierThresholds;
  lang?: 'pl' | 'en';
  mode?: RoutingWeightMode;
}

export interface GraphHopperCustomModelStatement {
  if: string;
  multiply_by?: string;
  limit_to?: string;
}

export interface GraphHopperCustomModel {
  distance_influence?: number;
  heading_penalty?: number;
  speed?: GraphHopperCustomModelStatement[];
  priority?: GraphHopperCustomModelStatement[];
  areas?: Record<string, unknown>;
}

export interface GraphHopperRequestBody {
  points: [number, number][];
  profile: string;
  'ch.disable': boolean;
  points_encoded: boolean;
  locale?: string;
  details?: string[];
  custom_model?: GraphHopperCustomModel;
  /** Road classes GraphHopper must not snap the waypoints onto. */
  snap_preventions?: string[];
}

export interface GraphHopperInstruction {
  distance: number;
  heading?: number;
  sign: number;
  interval: [number, number];
  text: string;
  time: number;
  street_name: string;
}

export interface GraphHopperPath {
  distance: number;
  weight: number;
  time: number;
  bbox: [number, number, number, number];
  points: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  instructions: GraphHopperInstruction[];
  details?: Record<string, Array<[number, number, string | number | null]>>;
  ascend?: number;
  descend?: number;
  snapped_waypoints?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface GraphHopperResponse {
  hints?: Record<string, unknown>;
  info?: {
    copyrights: string[];
    took: number;
  };
  paths?: GraphHopperPath[];
  message?: string;
}

export interface RouteManeuver {
  id: string;
  text: string;
  streetName: string;
  distanceMeters: number;
  timeSeconds: number;
  sign: number;
  startIndex: number;
  endIndex: number;
}

export interface AccessibleSegment {
  index: number;
  startIndex: number;
  endIndex: number;
  coordinates: [number, number][];
  distanceMeters: number;
  surface: string | null;
  surfaceStatus: FactStatus;
  surfaceSeverity: Severity;
  smoothness: string | null;
  roadClass: string | null;
  footway: string | null;
  maxWidth: number | null;
  widthStatus: FactStatus;
  widthSeverity: Severity;
  hasSteps: boolean;
  stepsSeverity: Severity;
  isKnown: boolean;
}

export type BarrierType = 'steps' | 'surface' | 'width' | 'kerb' | 'incline' | 'unknown_data';

export interface RouteBarrier {
  id: string;
  type: BarrierType;
  severity: Severity;
  status: FactStatus;
  criterion: string;
  value: string;
  message: string;
  lat: number;
  lon: number;
  distanceFromStartMeters: number;
  source: FactSource;
}

export interface RouteAccessibilitySummary {
  blockerCount: number;
  warningCount: number;
  unknownCount: number;
  okCount: number;
  overallStatus: 'accessible' | 'warning' | 'inaccessible' | 'unknown_data';
  coverageRatio: number | null;
  honestyNote: string;
}

export interface AccessibleRouteResult {
  distanceMeters: number;
  timeSeconds: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  bbox: [number, number, number, number];
  instructions: RouteManeuver[];
  segments: AccessibleSegment[];
  barriers: RouteBarrier[];
  summary: RouteAccessibilitySummary;
  source: FactSource;
  /** Surface colouring of the geometry. Unknown surfaces use tone `ok`. */
  surfaceSpans?: RouteSurfaceSpan[];
}
