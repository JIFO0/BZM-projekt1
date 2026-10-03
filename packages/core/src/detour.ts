/**
 * Decides when a barrier-free walk is no longer a reasonable alternative
 * to the practical sidewalk route.
 *
 * A detour of a few kilometres that stays in the same corridor is still
 * worth taking. "Poza rozsądkiem" means either:
 * - about a dozen extra kilometres (`extraMetres`), or
 * - several kilometres extra while the barrier-free line leaves the
 *   practical corridor by a couple of kilometres ("w inną stronę").
 */
export const BARRIER_FREE_DETOUR_LIMITS = {
  extraMetres: 10_000,
  lateralMetres: 2_500,
  lateralExtraMetres: 3_000,
} as const;

export function isBarrierFreeDetourUnreasonable(input: {
  practicalMetres: number;
  barrierFreeMetres: number;
  maxLateralMetres: number;
}): boolean {
  const extra = input.barrierFreeMetres - input.practicalMetres;
  if (extra >= BARRIER_FREE_DETOUR_LIMITS.extraMetres) return true;
  if (
    input.maxLateralMetres >= BARRIER_FREE_DETOUR_LIMITS.lateralMetres &&
    extra >= BARRIER_FREE_DETOUR_LIMITS.lateralExtraMetres
  ) {
    return true;
  }
  return false;
}
