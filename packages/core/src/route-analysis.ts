import type { CityConfig } from './city-config';
import { coverageStat, longestUnknownStretchMetres, totalUnknownStretchMetres, type CoverageStat } from './coverage';
import { findNearestPointOnRoute, haversineDistanceMetres, polylineLengthMetres } from './geometry';
import {
  evaluateIncline,
  evaluateKerbHeight,
  evaluateSteps,
  evaluateSurface,
  evaluateWidth,
} from './profile';
import type { RouteFinding, RouteReport } from './report';
import type { BarrierThresholds, Fact, ProfileId, Severity } from './types';

export interface RouteAnalysisInput {
  routeId: string;
  profileId: ProfileId;
  routeCoordinates: Array<[number, number]>;
  facts: Fact[];
  config: CityConfig;
  thresholds?: BarrierThresholds;
  isSample?: boolean;
}

/**
 * OSM `kerb:height` is in metres (0.03 = 30 mm). Explicit mm/cm/m tokens win.
 * A bare decimal below 3 is metres. A larger bare number is millimetres.
 * Qualitative tags (lowered, raised) do not invent a height such as 10 mm.
 */
export function parseKerbHeightMillimetres(value: string, unit?: string): number | null {
  const raw = value.trim().toLowerCase().replace(',', '.');
  if (!raw || raw === 'brak pomiaru' || raw === 'obecny' || raw === 'yes' || raw === 'unknown') {
    return null;
  }
  if (raw === 'flush' || raw === 'kerb=flush') return 0;

  const mmToken = raw.match(/(\d+(?:\.\d+)?)\s*mm\b/);
  if (mmToken) return parseFloat(mmToken[1]!);
  const cmToken = raw.match(/(\d+(?:\.\d+)?)\s*cm\b/);
  if (cmToken) return parseFloat(cmToken[1]!) * 10;
  const metreToken = raw.match(/(\d+(?:\.\d+)?)\s*m\b/);
  if (metreToken) return parseFloat(metreToken[1]!) * 1000;

  const numMatch = raw.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;
  const num = parseFloat(numMatch[1]!);
  if (!Number.isFinite(num)) return null;

  const u = (unit ?? '').trim().toLowerCase();
  if (u === 'mm' || u === 'millimetre' || u === 'millimetres') return num;
  if (u === 'cm') return num * 10;
  if (u === 'm' || u === 'meter' || u === 'metre' || u === 'metres') return num * 1000;
  if (num < 3) return num * 1000;
  return num;
}

function parseWidthMetres(value: string): number | null {
  const raw = value.trim().toLowerCase().replace(',', '.');
  const cm = raw.match(/(\d+(?:\.\d+)?)\s*cm\b/);
  if (cm) return parseFloat(cm[1]!) / 100;
  const mm = raw.match(/(\d+(?:\.\d+)?)\s*mm\b/);
  if (mm) return parseFloat(mm[1]!) / 1000;
  const metres = raw.match(/(\d+(?:\.\d+)?)\s*m\b/);
  if (metres) return parseFloat(metres[1]!);
  const numMatch = raw.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;
  const num = parseFloat(numMatch[1]!);
  if (!Number.isFinite(num)) return null;
  if (num > 15) return num / 100;
  return num;
}

/** Determine finding type and evaluate severity based on fact criterion and value. */
export function evaluateFactSeverity(
  fact: Fact,
  thresholds: BarrierThresholds,
): { severity: Severity; type: string; evidence: string } {
  const crit = fact.criterion.toLowerCase();
  const val = fact.value.toLowerCase();

  if (crit === 'steps' || crit === 'highway:steps') {
    const stepCountMatch = fact.value.match(/(\d+)/);
    const stepCount = stepCountMatch ? parseInt(stepCountMatch[1]!, 10) : null;
    const hasRamp = val.includes('ramp=yes') || val.includes('podjazd: tak');
    const severity = evaluateSteps({ stepCount: stepCount ?? 1, ramp: hasRamp }, thresholds);
    const evidence = stepCount
      ? `Schody: ${stepCount} stopni${hasRamp ? ', z podjazdem/rampą' : ', brak podjazdu'}`
      : `Schody na trasie${hasRamp ? ', podjazd obecny' : ''}`;
    return { severity, type: 'steps', evidence };
  }

  if (crit === 'kerb' || crit === 'kerb:height' || crit.startsWith('kerb:')) {
    const qualitative = val.replace(/^kerb=/, '').trim();
    if (qualitative === 'raised' || qualitative === 'lowered' || qualitative === 'rolled') {
      const assumed = qualitative === 'raised' ? 100 : 30;
      const severity = evaluateKerbHeight(assumed, thresholds);
      const label = qualitative === 'raised' ? 'podniesiony' : 'obniżony';
      return {
        severity,
        type: 'kerb',
        evidence: `Krawężnik ${label} bez pomiaru OSM — szacunek ${assumed} mm, porównywany z limitem profilu ${thresholds.maxKerbMillimetres} mm.`,
      };
    }
    const mm = parseKerbHeightMillimetres(fact.value, fact.unit);
    const severity = evaluateKerbHeight(mm, thresholds);
    const evidence =
      mm !== null
        ? `Wysokość krawężnika: ${Math.round(mm)} mm (limit profilu: ${thresholds.maxKerbMillimetres} mm)`
        : `Krawężnik: wartość "${fact.value}" — brak wysokości, więc nie podstawiamy 10 mm. Limit profilu: ${thresholds.maxKerbMillimetres} mm`;
    return { severity, type: 'kerb', evidence };
  }

  if (crit === 'incline') {
    const incMatch = fact.value.match(/(-?\d+(\.\d+)?)/);
    const percent = incMatch ? parseFloat(incMatch[1]!) : null;
    const severity = evaluateIncline(percent, thresholds);
    const evidence =
      percent !== null
        ? `Nachylenie: ${percent}% (maksimum profilu: ${thresholds.maxInclinePercent}%)`
        : `Nachylenie: wartość "${fact.value}"`;
    return { severity, type: 'incline', evidence };
  }

  if (crit === 'surface') {
    const severity = evaluateSurface(val, thresholds);
    const isBlocked = severity === 'blocker';
    const isAllowed = thresholds.allowedSurfaces.some((s) => s.toLowerCase() === val);
    const evidence = isBlocked
      ? `Zablokowana nawierzchnia: ${val}`
      : isAllowed
      ? `Nawierzchnia dopuszczalna: ${val}`
      : `Nawierzchnia utrudniająca poruszanie się: ${val}`;
    return { severity, type: 'surface', evidence };
  }

  if (crit === 'width') {
    const metres = parseWidthMetres(fact.value);
    const severity = evaluateWidth(metres, thresholds);
    const evidence =
      metres !== null
        ? `Szerokość przejścia: ${metres} m (wymagane min: ${thresholds.minWidthMetres} m)`
        : `Szerokość: "${fact.value}"`;
    return { severity, type: 'width', evidence };
  }

  if (crit === 'crossing' || crit === 'highway:crossing') {
    const hasSignals = val.includes('traffic_signals') || val.includes('sygnalizacja');
    const hasTactile = val.includes('tactile_paving=yes') || val.includes('pasy dotykowe');
    return {
      severity: 'info',
      type: 'crossing',
      evidence: `Przejście dla pieszych${hasSignals ? ' z sygnalizacją' : ''}${
        hasTactile ? ', pasy dotykowe' : ''
      }`,
    };
  }

  if (crit === 'wheelchair' || crit === 'entrance:wheelchair') {
    const token = val.trim().split(/[\s(,;]/)[0] ?? '';
    if (token === 'no') {
      const treatment = thresholds.stepsTreatment ?? (thresholds.stepsAreBlocker ? 'blocker' : 'warning');
      const isBlocker = treatment === 'blocker';
      return {
        severity: isBlocker ? 'blocker' : 'warning',
        type: 'wheelchair',
        evidence: isBlocker
          ? 'Niedostępne dla wózka'
          : 'Ograniczenie dostępności dla wózka',
      };
    }
    if (token === 'limited') {
      return {
        severity: 'warning',
        type: 'wheelchair',
        evidence: 'Ograniczona dostępność dla wózka',
      };
    }
    if (token === 'yes' || token === 'designated') {
      return {
        severity: 'ok',
        type: 'wheelchair',
        evidence: 'Dostępne dla wózka',
      };
    }
  }

  if (crit === 'toilets:wheelchair' && /^(yes|designated)\b/.test(val.trim())) {
    return {
      severity: 'ok',
      type: 'toilets:wheelchair',
      evidence: 'Toaleta przystosowana dla wózka',
    };
  }

  if (crit === 'elevator' || crit === 'highway:elevator') {
    return {
      severity: 'ok',
      type: 'elevator',
      evidence: `Winda dostępna przy trasie`,
    };
  }

  if (crit === 'ramp') {
    return {
      severity: 'ok',
      type: 'ramp',
      evidence: `Rampa / pochylnia dostępna`,
    };
  }

  // Fallback for general wheelchair tags or unknown criteria
  if (fact.status === 'unknown') {
    return {
      severity: 'unknown',
      type: crit,
      evidence: `Brak szczegółowych danych o parametrze: ${crit}`,
    };
  }

  return {
    severity: fact.status === 'conflicting' ? 'warning' : 'info',
    type: crit,
    evidence: `${crit}: ${fact.value}`,
  };
}

/**
 * Pure deterministic route analysis algorithm.
 * Evaluates OSM facts along the route geometry, sorts findings in route order,
 * computes criteria coverage and the longest stretch without data.
 */
export function analyzeRoute(input: RouteAnalysisInput): RouteReport {
  const { routeId, profileId, routeCoordinates, facts, config, isSample = false } = input;
  const thresholds = input.thresholds ?? config.profiles[profileId] ?? config.profiles.wheelchair;
  const corridorMeters = config.corridorMeters;

  const totalLengthMetres = Math.round(polylineLengthMetres(routeCoordinates));

  // 1. Match facts to route corridor
  const findings: RouteFinding[] = [];
  const matchedFactsByCriterion = new Map<string, Fact[]>();

  for (const fact of facts) {
    const projection = findNearestPointOnRoute(routeCoordinates, {
      lat: fact.subject.lat,
      lon: fact.subject.lon,
    });

    if (!projection) continue;
    if (projection.distanceToLineMetres > corridorMeters) {
      continue; // Outside route corridor buffer
    }

    const { severity, type } = evaluateFactSeverity(fact, thresholds);

    findings.push({
      id: `finding-${fact.id}`,
      distanceFromStartMetres: projection.distanceFromStartMetres,
      type,
      severity,
      fact,
    });

    const crit = fact.criterion.toLowerCase();
    const existing = matchedFactsByCriterion.get(crit) ?? [];
    existing.push(fact);
    matchedFactsByCriterion.set(crit, existing);
  }

  // 2. Sort findings in route order (by distance from start ascending)
  findings.sort((a, b) => a.distanceFromStartMetres - b.distanceFromStartMetres);

  // 3. Compute coverage per criterion (surface, kerb, crossing, incline)
  // Divide route into ~20m sample segments to evaluate coverage along geometry
  const segmentStepMeters = 20;
  const numSampleSegments = Math.max(1, Math.round(totalLengthMetres / segmentStepMeters));
  const segmentCoverage: Array<{ lengthMetres: number; known: boolean }> = [];

  for (let s = 0; s < numSampleSegments; s++) {
    const segStartDist = s * segmentStepMeters;
    const segEndDist = Math.min(totalLengthMetres, (s + 1) * segmentStepMeters);
    const segLen = Math.max(0, segEndDist - segStartDist);

    // Is there any known fact within this segment?
    const hasKnownFact = findings.some(
      (f) =>
        f.distanceFromStartMetres >= segStartDist &&
        f.distanceFromStartMetres <= segEndDist &&
        f.fact.status !== 'unknown',
    );

    segmentCoverage.push({
      lengthMetres: segLen,
      known: hasKnownFact,
    });
  }

  const longestUnknown = longestUnknownStretchMetres(segmentCoverage);
  const totalUnknown = totalUnknownStretchMetres(segmentCoverage);

  // Compute specific coverage metrics
  const coverageStats: CoverageStat[] = [];

  // Kerb coverage at crossings
  const crossingFindings = findings.filter((f) => f.type === 'crossing');
  const kerbFindings = findings.filter((f) => f.type === 'kerb');
  const totalCrossings = Math.max(crossingFindings.length, kerbFindings.length);
  const knownKerbs = kerbFindings.filter((f) => f.fact.status !== 'unknown').length;
  coverageStats.push(coverageStat('krawężniki na przejściach', knownKerbs, totalCrossings));

  // Surface coverage
  const surfaceFindings = findings.filter((f) => f.type === 'surface');
  const knownSurfaces = surfaceFindings.filter((f) => f.fact.status !== 'unknown').length;
  coverageStats.push(coverageStat('dane o nawierzchni', knownSurfaces, Math.max(surfaceFindings.length, 1)));

  // Steps / barriers coverage
  const stepFindings = findings.filter((f) => f.type === 'steps');
  const knownSteps = stepFindings.filter((f) => f.fact.status !== 'unknown').length;
  coverageStats.push(coverageStat('stopnie i schody', knownSteps, Math.max(stepFindings.length, 1)));

  // Source names
  const sourceNameSet = new Set<string>();
  for (const f of findings) {
    if (f.fact.source?.name) sourceNameSet.add(f.fact.source.name);
  }
  if (sourceNameSet.size === 0) {
    sourceNameSet.add('OpenStreetMap');
  }

  return {
    routeId,
    profileId,
    lengthMetres: totalLengthMetres,
    findings,
    coverage: coverageStats,
    longestUnknownStretchMetres: longestUnknown,
    totalUnknownStretchMetres: totalUnknown,
    generatedAt: new Date().toISOString(),
    sourceNames: Array.from(sourceNameSet),
    isSample,
  };
}
