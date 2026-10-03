import type { BarrierThresholds, Severity } from './types';

/** Missing measurement is unknown, never ok. Above the profile max is a blocker. */
export function evaluateKerbHeight(
  heightMillimetres: number | null,
  thresholds: BarrierThresholds,
): Severity {
  if (heightMillimetres === null) return 'unknown';
  if (heightMillimetres <= thresholds.maxKerbMillimetres) return 'ok';
  return 'blocker';
}

/**
 * Steps that exist are a barrier for strict profiles. A ramp downgrades that
 * to a warning. Unknown step count stays unknown even if a ramp tag exists.
 * A missing ramp tag does not erase the steps.
 */
export function evaluateSteps(
  input: { stepCount: number | null; ramp: boolean | null },
  thresholds: BarrierThresholds,
): Severity {
  if (input.stepCount === null) return 'unknown';
  if (input.stepCount <= 0) return 'ok';
  const treatment =
    thresholds.stepsTreatment ?? (thresholds.stepsAreBlocker ? 'blocker' : 'warning');
  if (treatment === 'allowed') return 'ok';
  if (input.ramp === true) return 'warning';
  const blockedRoads = (thresholds.blockedRoadTypes ?? thresholds.blockedSurfaces ?? []).map((s) =>
    s.trim().toLowerCase(),
  );
  if (blockedRoads.includes('steps')) return 'blocker';
  if (treatment === 'blocker') return 'blocker';
  return 'warning';
}

export function evaluateWidth(metres: number | null, thresholds: BarrierThresholds): Severity {
  if (metres === null) return 'unknown';
  if (metres >= thresholds.minWidthMetres) return 'ok';
  return 'blocker';
}

export function evaluateIncline(percent: number | null, thresholds: BarrierThresholds): Severity {
  if (percent === null) return 'unknown';
  if (Math.abs(percent) <= thresholds.maxInclinePercent) return 'ok';
  return 'blocker';
}

/**
 * A surface explicitly blocked by profile is a blocker.
 * A surface value in the allowed list is ok.
 * A surface value outside the profile list is a warning.
 * A missing surface is unknown. The allowed list is city config, not an OSM verdict.
 */
export function evaluateSurface(surface: string | null, thresholds: BarrierThresholds): Severity {
  if (surface === null || surface.trim() === '') return 'unknown';
  const norm = surface.trim().toLowerCase();
  const blocked = (thresholds.blockedRoadTypes ?? thresholds.blockedSurfaces ?? []).map((s) =>
    s.trim().toLowerCase(),
  );
  if (blocked.includes(norm)) return 'blocker';
  const allowed = thresholds.allowedSurfaces.map((s) => s.trim().toLowerCase());
  if (allowed.includes(norm)) return 'ok';
  return 'warning';
}
