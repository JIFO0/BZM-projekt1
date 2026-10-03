import type { LonLat } from './types';

const EARTH_RADIUS_METRES = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine formula to compute great-circle distance between two points in metres. */
export function haversineDistanceMetres(a: LonLat, b: LonLat): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);

  const h = sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METRES * c;
}

/** Calculate length of a polyline given as [lon, lat] coordinates in metres. */
export function polylineLengthMetres(coordinates: Array<[number, number]>): number {
  let length = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    if (p1 && p2) {
      length += haversineDistanceMetres({ lon: p1[0], lat: p1[1] }, { lon: p2[0], lat: p2[1] });
    }
  }
  return length;
}

export interface NearestRoutePoint {
  distanceToLineMetres: number;
  distanceFromStartMetres: number;
  closestPoint: LonLat;
  segmentIndex: number;
}

/**
 * Find the closest point on a polyline to a given target point.
 * Uses flat-earth equirectangular projection for local segment distance (accurate enough for < 100m corridors).
 */
export function findNearestPointOnRoute(
  routeCoords: Array<[number, number]>,
  target: LonLat,
): NearestRoutePoint | null {
  if (routeCoords.length === 0) return null;
  if (routeCoords.length === 1) {
    const p = routeCoords[0]!;
    const dist = haversineDistanceMetres({ lon: p[0], lat: p[1] }, target);
    return {
      distanceToLineMetres: dist,
      distanceFromStartMetres: 0,
      closestPoint: { lon: p[0], lat: p[1] },
      segmentIndex: 0,
    };
  }

  let minDistanceToLine = Infinity;
  let distanceFromStartAtMin = 0;
  let closestPoint: LonLat = { lon: routeCoords[0]![0], lat: routeCoords[0]![1] };
  let bestSegmentIndex = 0;

  let cumulativeDistance = 0;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const startCoord = routeCoords[i]!;
    const endCoord = routeCoords[i + 1]!;
    const segStart: LonLat = { lon: startCoord[0], lat: startCoord[1] };
    const segEnd: LonLat = { lon: endCoord[0], lat: endCoord[1] };
    const segLength = haversineDistanceMetres(segStart, segEnd);

    // Vector projection in local meters approximation
    const midLat = toRadians((segStart.lat + segEnd.lat) / 2);
    const mPerDegLat = 111132.95;
    const mPerDegLon = 111412.84 * Math.cos(midLat);

    const dx = (segEnd.lon - segStart.lon) * mPerDegLon;
    const dy = (segEnd.lat - segStart.lat) * mPerDegLat;
    const px = (target.lon - segStart.lon) * mPerDegLon;
    const py = (target.lat - segStart.lat) * mPerDegLat;

    const segLenSq = dx * dx + dy * dy;
    let t = segLenSq > 0 ? (px * dx + py * dy) / segLenSq : 0;
    t = Math.max(0, Math.min(1, t));

    const projLon = segStart.lon + (segEnd.lon - segStart.lon) * t;
    const projLat = segStart.lat + (segEnd.lat - segStart.lat) * t;
    const projPoint: LonLat = { lon: projLon, lat: projLat };

    const distToProj = haversineDistanceMetres(target, projPoint);

    if (distToProj < minDistanceToLine) {
      minDistanceToLine = distToProj;
      distanceFromStartAtMin = cumulativeDistance + segLength * t;
      closestPoint = projPoint;
      bestSegmentIndex = i;
    }

    cumulativeDistance += segLength;
  }

  return {
    distanceToLineMetres: minDistanceToLine,
    distanceFromStartMetres: Math.round(distanceFromStartAtMin),
    closestPoint,
    segmentIndex: bestSegmentIndex,
  };
}
