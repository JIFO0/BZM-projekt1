import {
  evaluateSurface,
  noBarrierSentenceAllowed,
  evaluateWidth,
  type BarrierThresholds,
  type FactSource,
  type FactStatus,
  type RouteSurfaceSpan,
  type Severity,
} from '@krakow-bez-barier/core';
import type {
  AccessibleRouteResult,
  AccessibleSegment,
  GraphHopperPath,
  GraphHopperResponse,
  RouteAccessibilitySummary,
  RouteBarrier,
  RouteManeuver,
} from './types';

const OSM_SOURCE: FactSource = {
  name: 'OpenStreetMap',
  url: 'https://www.openstreetmap.org',
  licence: 'ODbL 1.0',
};

/**
 * Calculates distance in meters between two [lon, lat] points using the Haversine formula.
 */
export function distanceBetween(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function surfaceTone(
  raw: string | number | null | undefined,
  thresholds: BarrierThresholds,
): RouteSurfaceSpan['tone'] {
  if (raw == null || raw === 'missing' || String(raw).trim() === '') return 'ok';
  const severity = evaluateSurface(String(raw), thresholds);
  return severity === 'warning' || severity === 'blocker' ? 'other' : 'ok';
}

const BAD_SMOOTHNESS = new Set(['bad', 'very_bad', 'horrible', 'very_horrible', 'impassable']);

/**
 * A geometry index fails the profile when a mapped surface, steps, width or
 * smoothness is a warning or a blocker. Missing tags stay `ok` (drawn blue):
 * lack of data is not painted as a barrier.
 */
function expectationTone(
  details: Record<string, Array<[number, number, string | number | null]>> | undefined,
  index: number,
  thresholds: BarrierThresholds,
): RouteSurfaceSpan['tone'] {
  if (surfaceTone(findDetailValue<string>(details, 'surface', index), thresholds) === 'other') {
    return 'other';
  }

  const road = findDetailValue<string>(details, 'road_class', index);
  if (road && String(road).toLowerCase() === 'steps') {
    const treatment =
      thresholds.stepsTreatment ?? (thresholds.stepsAreBlocker ? 'blocker' : 'warning');
    if (treatment !== 'allowed') return 'other';
  }

  const widthRaw = findDetailValue<number | string>(details, 'max_width', index);
  const width =
    widthRaw == null || widthRaw === 'missing' || String(widthRaw).trim() === ''
      ? null
      : Number(widthRaw);
  if (
    width !== null &&
    Number.isFinite(width) &&
    thresholds.minWidthMetres > 0 &&
    evaluateWidth(width, thresholds) === 'blocker'
  ) {
    return 'other';
  }

  const smoothness = findDetailValue<string>(details, 'smoothness', index);
  if (smoothness && BAD_SMOOTHNESS.has(String(smoothness).toLowerCase())) return 'other';

  return 'ok';
}

/**
 * Splits the route geometry where the profile is or is not met.
 * Unmapped attributes stay `ok` (drawn blue). A segment that fails the
 * profile is `other` (drawn orange).
 */
export function buildSurfaceSpans(
  coordinates: [number, number][],
  details: Record<string, Array<[number, number, string | number | null]>> | undefined,
  thresholds: BarrierThresholds,
): RouteSurfaceSpan[] {
  if (coordinates.length < 2) return [];

  const spans: RouteSurfaceSpan[] = [];
  for (let index = 0; index < coordinates.length - 1; index++) {
    const tone = expectationTone(details, index, thresholds);
    const slice: [number, number][] = [coordinates[index]!, coordinates[index + 1]!];
    const previous = spans[spans.length - 1];
    if (previous && previous.tone === tone) {
      previous.coordinates.push(slice[1]!);
    } else {
      spans.push({ coordinates: slice, tone });
    }
  }
  return spans;
}

function findDetailValue<T>(
  details: Record<string, Array<[number, number, string | number | null]>> | undefined,
  key: string,
  index: number,
): T | null {
  if (!details || !details[key]) return null;
  const intervals = details[key];
  for (const [start, end, val] of intervals) {
    if (index >= start && index < end) {
      return val === 'missing' ? null : (val as unknown as T);
    }
  }
  return null;
}

export function mapGraphHopperPathToResult(
  path: GraphHopperPath,
  thresholds: BarrierThresholds,
  minCoverageThreshold = 0.8,
): AccessibleRouteResult {
  const coordinates = path.points.coordinates;
  const details = path.details || {};

  // 1. Map instructions to Maneuvers
  const instructions: RouteManeuver[] = (path.instructions || []).map((inst, idx) => ({
    id: `maneuver-${idx}`,
    text: inst.text,
    streetName: inst.street_name || '',
    distanceMeters: Math.round(inst.distance * 10) / 10,
    timeSeconds: Math.round(inst.time / 1000),
    sign: inst.sign,
    startIndex: inst.interval[0],
    endIndex: inst.interval[1],
  }));

  // 2. Precompute cumulative distances along the line
  const pointDistances: number[] = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const dist = distanceBetween(coordinates[i - 1], coordinates[i]);
    pointDistances.push(pointDistances[i - 1] + dist);
  }

  // 3. Build segments based on instructions (or consecutive points)
  const segments: AccessibleSegment[] = [];
  const barriers: RouteBarrier[] = [];

  let coveredDistanceMeters = 0;
  let blockerCount = 0;
  let warningCount = 0;
  let unknownCount = 0;
  let okCount = 0;

  const segmentIntervals: Array<[number, number]> = [];
  if (instructions.length > 0) {
    for (const inst of instructions) {
      if (inst.startIndex < inst.endIndex) {
        segmentIntervals.push([inst.startIndex, inst.endIndex]);
      }
    }
  } else if (coordinates.length > 1) {
    segmentIntervals.push([0, coordinates.length - 1]);
  }

  for (let segIdx = 0; segIdx < segmentIntervals.length; segIdx++) {
    const [startIdx, endIdx] = segmentIntervals[segIdx];
    const segCoords = coordinates.slice(startIdx, endIdx + 1);
    const segDist = Math.max(0, pointDistances[endIdx] - pointDistances[startIdx]);
    const midIdx = Math.floor((startIdx + endIdx) / 2);

    const surfaceRaw = findDetailValue<string>(details, 'surface', midIdx);
    const smoothness = findDetailValue<string>(details, 'smoothness', midIdx);
    const roadClass = findDetailValue<string>(details, 'road_class', midIdx);
    const footway = findDetailValue<string>(details, 'footway', midIdx);
    const maxWidth = findDetailValue<number>(details, 'max_width', midIdx);

    // Surface analysis
    const surface = surfaceRaw && surfaceRaw !== 'missing' ? surfaceRaw.toLowerCase() : null;
    const surfaceStatus: FactStatus = surface ? 'community' : 'unknown';
    const surfaceSeverity: Severity = evaluateSurface(surface, thresholds);

    // Width analysis
    const widthStatus: FactStatus = maxWidth !== null ? 'community' : 'unknown';
    const widthSeverity: Severity = evaluateWidth(maxWidth, thresholds);

    // Steps analysis
    const hasSteps = roadClass === 'steps';
    const stepsTreatment =
      thresholds.stepsTreatment ?? (thresholds.stepsAreBlocker ? 'blocker' : 'warning');
    const stepsSeverity: Severity = hasSteps
      ? stepsTreatment === 'allowed'
        ? 'ok'
        : stepsTreatment === 'blocker'
        ? 'blocker'
        : 'warning'
      : 'ok';

    const hasKnownData = surface !== null || maxWidth !== null || smoothness !== null || hasSteps;
    if (hasKnownData) {
      coveredDistanceMeters += segDist;
    }

    // Segment severity aggregation
    if (stepsSeverity === 'blocker' || widthSeverity === 'blocker' || surfaceSeverity === 'blocker') {
      blockerCount++;
    } else if (
      surfaceSeverity === 'warning' ||
      stepsSeverity === 'warning' ||
      widthSeverity === 'warning' ||
      (smoothness && ['bad', 'very_bad', 'horrible', 'impassable'].includes(smoothness.toLowerCase()))
    ) {
      warningCount++;
    } else if (!hasKnownData) {
      unknownCount++;
    } else {
      okCount++;
    }

    segments.push({
      index: segIdx,
      startIndex: startIdx,
      endIndex: endIdx,
      coordinates: segCoords,
      distanceMeters: Math.round(segDist * 10) / 10,
      surface,
      surfaceStatus,
      surfaceSeverity,
      smoothness,
      roadClass,
      footway,
      maxWidth,
      widthStatus,
      widthSeverity,
      hasSteps,
      stepsSeverity,
      isKnown: hasKnownData,
    });

    // Check for barrier triggers to present in the barrier list
    const centerCoord = coordinates[midIdx] || coordinates[0];
    const distFromStart = Math.round(pointDistances[midIdx]);

    if (hasSteps && stepsSeverity !== 'ok') {
      barriers.push({
        id: `barrier-steps-${segIdx}`,
        type: 'steps',
        severity: stepsSeverity,
        status: 'community',
        criterion: 'Schody',
        value: 'Schody piesze (highway=steps)',
        message: stepsSeverity === 'blocker'
          ? 'Schody stanowią blokadę dla wybranego profilu wózka'
          : 'Schody na trasie – zalecana ostrożność',
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    }

    const surfacePlMap: Record<string, string> = {
      cobblestone: 'kocie łby / bruk',
      sett: 'kostka kamienna',
      paving_stones: 'kostka brukowa',
      asphalt: 'asfalt',
      concrete: 'beton',
      gravel: 'żwir',
      compacted: 'ubity żwir',
      fine_gravel: 'drobny żwir',
      sand: 'piasek',
      dirt: 'grunt / ziemia',
      earth: 'ziemia',
      ground: 'grunt',
      grass: 'trawa',
      unpaved: 'nieutwardzona',
      wood: 'drewno',
      steps: 'schody',
    };
    const surfacePl = surface ? surfacePlMap[surface.toLowerCase()] || surface : '';

    if (surfaceSeverity === 'blocker' && surface) {
      barriers.push({
        id: `barrier-surface-${segIdx}`,
        type: 'surface',
        severity: 'blocker',
        status: 'community',
        criterion: 'Nawierzchnia',
        value: surfacePlMap[surface.toLowerCase()] || surface,
        message: `Zablokowana nawierzchnia (${surfacePl}) – droga zablokowana dla wybranego profilu`,
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    } else if (surfaceSeverity === 'warning' && surface) {
      barriers.push({
        id: `barrier-surface-${segIdx}`,
        type: 'surface',
        severity: 'warning',
        status: 'community',
        criterion: 'Nawierzchnia',
        value: surfacePlMap[surface.toLowerCase()] || surface,
        message: `Nawierzchnia: ${surfacePl} nie znajduje się na liście zalecanych dla profilu`,
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    }

    if (widthSeverity === 'blocker' && maxWidth !== null) {
      barriers.push({
        id: `barrier-width-${segIdx}`,
        type: 'width',
        severity: 'blocker',
        status: 'community',
        criterion: 'Szerokość przejścia',
        value: `${maxWidth} m`,
        message: `Szerokość przejścia (${maxWidth} m) jest mniejsza niż wymagane minimum (${thresholds.minWidthMetres} m)`,
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    }

    if (smoothness && ['bad', 'very_bad', 'horrible', 'impassable'].includes(smoothness.toLowerCase())) {
      barriers.push({
        id: `barrier-smoothness-${segIdx}`,
        type: 'surface',
        severity: 'warning',
        status: 'community',
        criterion: 'Gładkość nawierzchni',
        value: smoothness,
        message: `Nawierzchnia o niskiej gładkości (${smoothness}) może sprawiać trudności w poruszaniu`,
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    }

    // Honesty requirement: unmapped sections flagged transparently
    if (!hasKnownData) {
      barriers.push({
        id: `barrier-unknown-${segIdx}`,
        type: 'unknown_data',
        severity: 'unknown',
        status: 'unknown',
        criterion: 'Brak danych w OSM',
        value: 'Brak informacji',
        message: 'Brak danych o krawężnikach i nawierzchni na tym odcinku. Brak informacji nie gwarantuje dostępności.',
        lat: centerCoord[1],
        lon: centerCoord[0],
        distanceFromStartMeters: distFromStart,
        source: OSM_SOURCE,
      });
    }
  }

  // Total route metrics
  const totalDist = path.distance || pointDistances[pointDistances.length - 1] || 0;
  const coverageRatio = totalDist > 0 ? Math.min(1, coveredDistanceMeters / totalDist) : null;

  let overallStatus: RouteAccessibilitySummary['overallStatus'] = 'accessible';
  if (blockerCount > 0) {
    overallStatus = 'inaccessible';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  } else if (coverageRatio !== null && coverageRatio < 0.5) {
    overallStatus = 'unknown_data';
  }

  const noBarrierSentenceValid = noBarrierSentenceAllowed({
    barrierCount: blockerCount + warningCount,
    coverageRatio,
    minCoverage: minCoverageThreshold,
  });

  const honestyNote = noBarrierSentenceValid
    ? 'Nie znaleziono przeszkód w dostępnych danych.'
    : 'Część trasy nie ma danych o krawężnikach lub nawierzchni w OSM. Brak informacji nie gwarantuje pełnej dostępności.';

  return {
    distanceMeters: Math.round(totalDist * 10) / 10,
    timeSeconds: Math.round((path.time || 0) / 1000),
    geometry: path.points,
    bbox: path.bbox,
    instructions,
    segments,
    barriers,
    summary: {
      blockerCount,
      warningCount,
      unknownCount,
      okCount,
      overallStatus,
      coverageRatio: coverageRatio !== null ? Math.round(coverageRatio * 100) / 100 : null,
      honestyNote,
    },
    source: OSM_SOURCE,
    surfaceSpans: buildSurfaceSpans(coordinates, details, thresholds),
  };
}

export function parseGraphHopperResponse(
  json: unknown,
  thresholds: BarrierThresholds,
  minCoverageThreshold = 0.8,
): AccessibleRouteResult {
  const data = json as GraphHopperResponse;
  if (!data || !Array.isArray(data.paths) || data.paths.length === 0) {
    throw new Error(data?.message || 'Nie znaleziono trasy w GraphHopper');
  }
  return mapGraphHopperPathToResult(data.paths[0], thresholds, minCoverageThreshold);
}
