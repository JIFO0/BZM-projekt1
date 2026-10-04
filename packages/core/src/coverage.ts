export interface CoverageStat {
  criterion: string;
  known: number;
  total: number;
  /** Null when there is nothing to measure. Null is not 100% coverage. */
  ratio: number | null;
}

export function coverageRatio(known: number, total: number): number | null {
  if (total <= 0) return null;
  if (known < 0 || known > total) {
    throw new Error('known count must be between 0 and total');
  }
  return known / total;
}

export function coverageStat(criterion: string, known: number, total: number): CoverageStat {
  return { criterion, known, total, ratio: coverageRatio(known, total) };
}

/** Longest consecutive run of segments that have no data for the criterion. */
export function longestUnknownStretchMetres(
  segments: Array<{ lengthMetres: number; known: boolean }>,
): number {
  let best = 0;
  let run = 0;
  for (const segment of segments) {
    if (segment.lengthMetres < 0) {
      throw new Error('segment length must be >= 0');
    }
    if (segment.known) {
      best = Math.max(best, run);
      run = 0;
    } else {
      run += segment.lengthMetres;
    }
  }
  return Math.max(best, run);
}

/** Total cumulative length of all segments that have no data for the criterion. */
export function totalUnknownStretchMetres(
  segments: Array<{ lengthMetres: number; known: boolean }>,
): number {
  let total = 0;
  for (const segment of segments) {
    if (segment.lengthMetres < 0) {
      throw new Error('segment length must be >= 0');
    }
    if (!segment.known) {
      total += segment.lengthMetres;
    }
  }
  return Math.round(total);
}

