import type { Fact, FactStatus } from './types';

export type DateLabelKind = 'confirmed' | 'osm_last_edit' | 'retrieved' | 'missing';

export interface DateLabel {
  kind: DateLabelKind;
  at?: string;
}

/** Whole months from earlier to later. Invalid dates return null. */
export function monthsBetween(earlierIso: string, later: Date): number | null {
  const earlier = new Date(earlierIso);
  if (Number.isNaN(earlier.getTime()) || Number.isNaN(later.getTime())) return null;
  const months =
    (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 +
    (later.getUTCMonth() - earlier.getUTCMonth());
  if (later.getUTCDate() < earlier.getUTCDate()) return months - 1;
  return months;
}

/**
 * A missing date is not stale and not fresh. Callers must keep the fact unknown
 * rather than treating "no date" as recently confirmed.
 */
export function isStale(iso: string | undefined, now: Date, thresholdMonths: number): boolean {
  if (!iso) return false;
  const months = monthsBetween(iso, now);
  if (months === null) return false;
  return months >= thresholdMonths;
}

/**
 * OSM community data becomes `verified` only from a check-date style tag inside
 * the staleness window. `lastEditedAt` is an edit, not a confirmation.
 */
export function statusFromOsmTags(input: {
  conflicting: boolean;
  checkDate?: string;
  now: Date;
  stalenessMonths: number;
}): FactStatus {
  if (input.conflicting) return 'conflicting';
  if (!input.checkDate) return 'community';
  const months = monthsBetween(input.checkDate, input.now);
  if (months === null) return 'community';
  if (months < input.stalenessMonths) return 'verified';
  return 'community';
}

/** Prefer a confirmation date. An OSM edit is labelled as an edit, never as a check. */
export function dateLabel(
  fact: Pick<Fact, 'lastConfirmedAt' | 'lastEditedAt' | 'retrievedAt'>,
): DateLabel {
  if (fact.lastConfirmedAt) return { kind: 'confirmed', at: fact.lastConfirmedAt };
  if (fact.lastEditedAt) return { kind: 'osm_last_edit', at: fact.lastEditedAt };
  if (fact.retrievedAt) return { kind: 'retrieved', at: fact.retrievedAt };
  return { kind: 'missing' };
}
