import type { CoverageStat } from './coverage';
import type { Fact, ProfileId, Severity } from './types';

export interface RouteFinding {
  id: string;
  distanceFromStartMetres: number;
  type: string;
  severity: Severity;
  fact: Fact;
}

/**
 * Full route analysis result. Built later by pure functions over fixtures.
 * The summary must use counts and coverage, never a single accessible/not label.
 */
export interface RouteReport {
  routeId: string;
  profileId: ProfileId;
  lengthMetres: number;
  findings: RouteFinding[];
  coverage: CoverageStat[];
  longestUnknownStretchMetres: number;
  generatedAt: string;
  sourceNames: string[];
  isSample: boolean;
}
