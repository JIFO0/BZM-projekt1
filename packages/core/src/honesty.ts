import type { FactStatus, Severity } from './types';

/**
 * Unknown, conflicting and user-reported facts must never be presented as
 * "no problem" / accessible. A caller that passes severity "ok" with status
 * "unknown" is still refused.
 */
export function mayPresentAsNoProblem(status: FactStatus, severity: Severity): boolean {
  if (status === 'unknown' || status === 'conflicting' || status === 'reported') {
    return false;
  }
  if (severity === 'unknown' || severity === 'blocker' || severity === 'warning') {
    return false;
  }
  return severity === 'ok' || severity === 'info';
}

/**
 * The sentence "Nie znaleziono przeszkód w dostępnych danych" is allowed only
 * when coverage is known, high enough, and no barrier was found.
 */
export function noBarrierSentenceAllowed(input: {
  barrierCount: number;
  coverageRatio: number | null;
  minCoverage: number;
}): boolean {
  if (input.barrierCount !== 0) return false;
  if (input.coverageRatio === null) return false;
  if (input.coverageRatio < input.minCoverage) return false;
  return true;
}
