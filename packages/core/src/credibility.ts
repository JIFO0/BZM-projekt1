import type { FactStatus } from './types';

/**
 * Higher score means stronger evidence. A single resident report stays at the
 * bottom and must not be read as proof that a barrier exists or does not.
 *
 * Corroborated reports outrank every provider: 5+ other reports, or 3+ other
 * reports when at least one photo is attached.
 * OSM edit timestamps are not confirmation dates. `verified` on OSM requires
 * an audit tag (`check_date`, `survey:date`).
 */
export const REPORT_CORROBORATION_MIN = 5;
export const REPORT_CORROBORATION_MIN_WITH_PHOTO = 3;

export const CREDIBILITY_RANKS = [
  'corroborated',
  'osm_verified',
  'official_city',
  'msip_zdmk',
  'wawel',
  'field_audit',
  'osm_community',
  'geoportal',
  'partial_report',
  'conflicting',
  'unspecified',
  'single_report',
  'unknown',
] as const;

export type CredibilityRank = (typeof CREDIBILITY_RANKS)[number];

export interface CredibilityAssessment {
  rank: CredibilityRank;
  /** 0–100. Higher is more trustworthy. */
  score: number;
}

export const CREDIBILITY_LADDER: readonly CredibilityAssessment[] = [
  { rank: 'corroborated', score: 100 },
  { rank: 'osm_verified', score: 90 },
  { rank: 'official_city', score: 80 },
  { rank: 'msip_zdmk', score: 75 },
  { rank: 'wawel', score: 70 },
  { rank: 'field_audit', score: 65 },
  { rank: 'osm_community', score: 60 },
  { rank: 'geoportal', score: 40 },
  { rank: 'partial_report', score: 25 },
  { rank: 'conflicting', score: 20 },
  { rank: 'unspecified', score: 15 },
  { rank: 'single_report', score: 10 },
  { rank: 'unknown', score: 0 },
];

const BY_RANK: Record<CredibilityRank, CredibilityAssessment> = Object.fromEntries(
  CREDIBILITY_LADDER.map((row) => [row.rank, row]),
) as Record<CredibilityRank, CredibilityAssessment>;

function rank(id: CredibilityRank): CredibilityAssessment {
  return BY_RANK[id];
}

export function reportsAreCorroborated(supportCount: number, photoCount: number): boolean {
  const support = Math.max(0, supportCount);
  const photos = Math.max(0, photoCount);
  if (support >= REPORT_CORROBORATION_MIN) return true;
  if (support >= REPORT_CORROBORATION_MIN_WITH_PHOTO && photos > 0) return true;
  return false;
}

/**
 * `supportCount` is other reports agreeing with the claim, not the original.
 * `photoCount` includes the original report and later validations.
 */
export function credibilityFromReports(input: {
  supportCount: number;
  photoCount: number;
}): CredibilityAssessment {
  const support = Math.max(0, input.supportCount);
  if (reportsAreCorroborated(support, input.photoCount)) return rank('corroborated');
  if (support === 0) return rank('single_report');
  return rank('partial_report');
}

export interface SourceCredibilityInput {
  name?: string;
  licence?: string;
  status?: FactStatus;
  /** True when OSM carries check_date / survey:date inside the freshness window. */
  hasAuditDate?: boolean;
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Provider order after corroborated reports: verified OSM, city declarations,
 * MSIP/ZDMK, Wawel, curated field audits, unverified OSM, then the BDOT10k
 * basemap. The basemap is topography, not a field check of a barrier.
 */
export function credibilityFromSource(input: SourceCredibilityInput): CredibilityAssessment {
  if (input.status === 'reported') return rank('single_report');
  if (input.status === 'unknown') return rank('unknown');
  if (input.status === 'conflicting') return rank('conflicting');

  const name = (input.name ?? '').toLowerCase();
  const licence = (input.licence ?? '').toLowerCase();
  const blob = `${name} ${licence}`;

  if (!name.trim()) return rank('unspecified');

  if (includesAny(blob, ['geoportal', 'bdot', 'gugik'])) return rank('geoportal');
  if (blob.includes('wawel')) return rank('wawel');
  if (includesAny(blob, ['zdmk', 'msip'])) return rank('msip_zdmk');
  if (includesAny(blob, ['bip', 'krakow.pl', 'deklaracj'])) return rank('official_city');
  if (includesAny(blob, ['umk', 'ztp', 'mpk', 'audyt dostępności', 'audyt teren'])) {
    return rank('field_audit');
  }

  const isOsm = includesAny(blob, ['openstreetmap', 'overpass']) || /\bosm\b/.test(blob);
  if (isOsm) {
    if (input.status === 'verified' || input.hasAuditDate) return rank('osm_verified');
    return rank('osm_community');
  }

  if (input.status === 'verified') return rank('field_audit');
  return rank('unspecified');
}

/**
 * Short credit appended only when the visible source line would otherwise
 * omit the owner. Returns null when the name or licence already carries it.
 */
export function conciseSourceCredit(input: { name?: string; licence?: string }): string | null {
  const name = input.name ?? '';
  const licence = input.licence ?? '';
  const blob = `${name} ${licence}`.toLowerCase();
  if (!name.trim() && !licence.trim()) return 'źródło niepodane';

  const isOsm =
    blob.includes('openstreetmap') || blob.includes('overpass') || /\bosm\b/.test(blob);
  if (isOsm && !blob.includes('contributor')) return '© OSM contributors';

  const isGeoportal = blob.includes('geoportal') || blob.includes('bdot') || blob.includes('gugik');
  if (isGeoportal && !blob.includes('gugik') && !blob.includes('geodez')) return '© GUGiK';

  const isCity = includesAny(blob, ['umk', 'zdmk', 'msip', 'wawel', 'bip', 'ztp', 'mpk', 'krakow.pl']);
  const hasPublicLicence =
    blob.includes('informacja publiczna') ||
    blob.includes('public domain') ||
    blob.includes('ustawa');
  if (isCity && !hasPublicLicence) return 'informacja publiczna';

  return null;
}
