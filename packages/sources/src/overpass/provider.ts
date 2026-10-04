import {
  findNearestPointOnRoute,
  OSM_ATTRIBUTION,
  OSM_ODBL_URL,
  statusFromOsmTags,
  type AccessibilityBundle,
  type AccessibilityDataSource,
  type Fact,
  type GeometryQuery,
  type PlaceQuery,
  type SourceDescriptor,
  type SubjectType,
} from '@krakow-bez-barier/core';

import { failureFromHttp, failureFromUnknown, parseJsonBody } from '../mapy/http';
import { OVERPASS_INTERPRETER, overpassHeaders } from './policy';

/** Accessibility points on a walked line: kerbs, crossings, steps, footways. */
export function buildRouteAccessibilityQuery(bboxStr: string): string {
  return `[out:json][timeout:25];
(
  node["kerb"](${bboxStr});
  node["kerb:height"](${bboxStr});
  node["kerb:left"](${bboxStr});
  node["kerb:right"](${bboxStr});
  node["barrier"="kerb"](${bboxStr});
  node["highway"="crossing"](${bboxStr});
  node["highway"="steps"](${bboxStr});
  node["highway"="elevator"](${bboxStr});
  node["ramp"](${bboxStr});
  way["highway"="steps"](${bboxStr});
  way["highway"="footway"](${bboxStr});
  way["highway"="path"](${bboxStr});
  way["highway"="pedestrian"](${bboxStr});
  way["highway"="crossing"](${bboxStr});
  way["highway"="corridor"](${bboxStr});
  way["footway"="sidewalk"](${bboxStr});
  way["footway"="crossing"](${bboxStr});
  way["kerb"](${bboxStr});
  way["kerb:height"](${bboxStr});
  way["highway"="elevator"](${bboxStr});
);
out geom tags;`;
}

/** Smaller retry when the full pedestrian query does not return. */
export function buildRouteKerbQuery(bboxStr: string): string {
  return `[out:json][timeout:12];
(
  node["kerb"](${bboxStr});
  node["kerb:height"](${bboxStr});
  node["kerb:left"](${bboxStr});
  node["kerb:right"](${bboxStr});
  node["barrier"="kerb"](${bboxStr});
  node["highway"="crossing"](${bboxStr});
  node["highway"="steps"](${bboxStr});
  way["highway"="steps"](${bboxStr});
  way["highway"="crossing"](${bboxStr});
);
out geom tags;`;
}

function pointOnRoute(
  element: { lat?: number; lon?: number; center?: { lat?: number; lon?: number }; geometry?: Array<{ lat?: number; lon?: number }> },
  route: Array<[number, number]> | undefined,
  corridorMetres: number,
): { lat: number; lon: number } | null {
  const candidates: Array<{ lat: number; lon: number }> = [];
  if (Array.isArray(element.geometry)) {
    const step = Math.max(1, Math.floor(element.geometry.length / 30));
    for (let i = 0; i < element.geometry.length; i += step) {
      const point = element.geometry[i];
      if (typeof point?.lat === 'number' && typeof point?.lon === 'number') {
        candidates.push({ lat: point.lat, lon: point.lon });
      }
    }
  }
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    candidates.push({ lat: element.lat, lon: element.lon });
  } else if (typeof element.center?.lat === 'number' && typeof element.center?.lon === 'number') {
    candidates.push({ lat: element.center.lat, lon: element.center.lon });
  }
  if (!route || route.length === 0) return candidates[0] ?? null;

  let best: { lat: number; lon: number } | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const nearest = findNearestPointOnRoute(route, candidate);
    if (nearest && nearest.distanceToLineMetres < bestDistance) {
      bestDistance = nearest.distanceToLineMetres;
      best = nearest.closestPoint;
    }
  }
  if (!best || bestDistance > corridorMetres) return null;
  return best;
}

export interface OverpassProviderOptions {
  endpoint?: string;
  userAgent?: string;
  stalenessMonths?: number;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export class OsmOverpassProvider implements AccessibilityDataSource {
  private readonly endpoint: string;
  private readonly userAgent: string;
  private readonly stalenessMonths: number;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: OverpassProviderOptions = {}) {
    this.endpoint = options.endpoint ?? OVERPASS_INTERPRETER;
    this.userAgent =
      options.userAgent ?? 'KrakowBezBarier/0.1 (HackYeah 2026 prototype; contact@example.com)';
    this.stalenessMonths = options.stalenessMonths ?? 24;
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 4000;
  }

  describe(): SourceDescriptor {
    return {
      name: OSM_ATTRIBUTION.name,
      url: OSM_ATTRIBUTION.url,
      licence: `${OSM_ATTRIBUTION.licence} (${OSM_ODBL_URL})`,
      attribution: OSM_ATTRIBUTION.attribution,
      updateFrequency: 'community real-time',
    };
  }

  async fetchAroundGeometry(query: GeometryQuery): Promise<AccessibilityBundle> {
    if (query.coordinates.length === 0) {
      return { facts: [], retrievedAt: new Date().toISOString() };
    }

    const radiusMetres = Math.max(query.corridorMetres, 20);
    const bufferDeg = Math.max(0.0004, (radiusMetres * 1.4) / 111000);
    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of query.coordinates) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    const bboxStr = `${(minLat - bufferDeg).toFixed(6)},${(minLon - bufferDeg).toFixed(6)},${(maxLat + bufferDeg).toFixed(6)},${(maxLon + bufferDeg).toFixed(6)}`;
    const corridor = Math.max(query.corridorMetres, 35);
    // Pedestrian features and measured kerbs only. A blanket `way["surface"]`
    // query covers every carriageway in the box and Overpass times out, which
    // used to drop every kerb and crossing on the route.
    try {
      return await this.executeQuery(
        buildRouteAccessibilityQuery(bboxStr),
        25000,
        query.coordinates,
        corridor,
      );
    } catch {
      return this.executeQuery(buildRouteKerbQuery(bboxStr), 12000, query.coordinates, corridor);
    }
  }

  async fetchPlace(query: PlaceQuery): Promise<AccessibilityBundle> {
    const lat = query.position.lat;
    const lon = query.position.lon;
    const radius = Math.max(20, Math.min(query.maxDistanceMetres, 100));

    const ql = `[out:json][timeout:15];
(
  node(around:${radius},${lat},${lon})["wheelchair"];
  way(around:${radius},${lat},${lon})["wheelchair"];
  node(around:${radius},${lat},${lon})["toilets:wheelchair"];
  way(around:${radius},${lat},${lon})["toilets:wheelchair"];
  node(around:${radius},${lat},${lon})["entrance"];
  node(around:${radius},${lat},${lon})["highway"="elevator"];
  way(around:${radius},${lat},${lon})["highway"="elevator"];
  node(around:${radius},${lat},${lon})["ramp"];
  way(around:${radius},${lat},${lon})["ramp"];
);
out center tags qt;`;

    return this.executeQuery(ql);
  }

  private async executeQuery(
    ql: string,
    timeoutMs = this.timeoutMs,
    route?: Array<[number, number]>,
    corridorMetres = 35,
  ): Promise<AccessibilityBundle> {
    const retrievedAt = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          ...overpassHeaders(this.userAgent),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(ql)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw failureFromHttp('OpenStreetMap (Overpass)', response.status);
      }

      const text = await response.text();
      const data = parseJsonBody('OpenStreetMap (Overpass)', text) as any;
      const elements = data?.elements ?? [];

      const facts: Fact[] = [];
      const now = new Date();

      for (const el of elements) {
        const id = `${el.type}/${el.id}`;
        const tags = el.tags || {};
        const placed = pointOnRoute(el, route, corridorMetres);
        if (route && !placed) continue;
        const lat = placed?.lat ?? el.lat ?? el.center?.lat;
        const lon = placed?.lon ?? el.lon ?? el.center?.lon;

        if (typeof lat !== 'number' || typeof lon !== 'number') continue;

        const checkDate =
          tags['check_date:wheelchair'] ||
          tags['check_date'] ||
          tags['survey:date'] ||
          tags['lastcheck'];

        const subjectType: SubjectType = tags.entrance
          ? 'entrance'
          : tags.highway === 'crossing'
            ? 'crossing'
            : tags.wheelchair && el.type === 'way'
              ? 'place'
              : 'segment';

        const lastEditedAt = el.timestamp ? String(el.timestamp) : undefined;

        // Steps
        if (tags.highway === 'steps') {
          const stepCount = tags.step_count ? `${tags.step_count} stopni` : 'schody';
          const rampInfo = tags.ramp === 'yes' || tags['ramp:stroller'] === 'yes' ? ', rampa=tak' : '';
          facts.push({
            id: `${id}-steps`,
            subject: { type: subjectType, ref: id, lat, lon },
            criterion: 'steps',
            value: `${stepCount}${rampInfo}`,
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
              objectVersion: el.version ? String(el.version) : undefined,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Kerb. Prefer a measured height (OSM unit: metres) over a qualitative tag.
        const kerbHeight =
          tags['kerb:height'] ||
          tags['kerb:height:left'] ||
          tags['kerb:height:right'];
        const sideMeasured = [tags['kerb:left'], tags['kerb:right']].find((v) => v && /\d/.test(v));
        const qualitative = tags.kerb || tags['kerb:left'] || tags['kerb:right'];
        if (kerbHeight || sideMeasured || qualitative || tags.barrier === 'kerb') {
          const measured = kerbHeight || sideMeasured;
          const kerbVal = measured || qualitative || 'obecny';
          const unit = measured && !/[a-z]/i.test(measured) ? 'm' : undefined;
          facts.push({
            id: `${id}-kerb`,
            subject: { type: 'crossing', ref: id, lat, lon },
            criterion: 'kerb',
            value: String(kerbVal),
            ...(unit ? { unit } : {}),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Crossing
        if (tags.highway === 'crossing') {
          const parts: string[] = [];
          if (tags.crossing) parts.push(tags.crossing);
          if (tags.crossing_ref) parts.push(tags.crossing_ref);
          if (tags.traffic_signals === 'yes') parts.push('sygnalizacja');
          if (tags.tactile_paving === 'yes') parts.push('pasy dotykowe');
          facts.push({
            id: `${id}-crossing`,
            subject: { type: 'crossing', ref: id, lat, lon },
            criterion: 'crossing',
            value: parts.length > 0 ? parts.join(', ') : 'przejście dla pieszych',
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Surface
        if (tags.surface) {
          facts.push({
            id: `${id}-surface`,
            subject: { type: 'segment', ref: id, lat, lon },
            criterion: 'surface',
            value: String(tags.surface),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        if (tags.width || tags.est_width || tags.maxwidth) {
          const widthVal = tags.width || tags.est_width || tags.maxwidth;
          facts.push({
            id: `${id}-width`,
            subject: { type: 'segment', ref: id, lat, lon },
            criterion: 'width',
            value: String(widthVal),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Incline
        if (tags.incline) {
          facts.push({
            id: `${id}-incline`,
            subject: { type: 'segment', ref: id, lat, lon },
            criterion: 'incline',
            value: String(tags.incline),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Wheelchair tag
        if (tags.wheelchair) {
          facts.push({
            id: `${id}-wheelchair`,
            subject: { type: subjectType, ref: id, lat, lon },
            criterion: 'wheelchair',
            value: String(tags.wheelchair),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Toilets
        if (tags['toilets:wheelchair']) {
          facts.push({
            id: `${id}-toilet`,
            subject: { type: 'place', ref: id, lat, lon },
            criterion: 'toilets:wheelchair',
            value: String(tags['toilets:wheelchair']),
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }

        // Elevator
        if (tags.highway === 'elevator' || tags.elevator === 'yes') {
          facts.push({
            id: `${id}-elevator`,
            subject: { type: subjectType, ref: id, lat, lon },
            criterion: 'elevator',
            value: 'winda obecna',
            status: statusFromOsmTags({
              conflicting: false,
              checkDate,
              now,
              stalenessMonths: this.stalenessMonths,
            }),
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
              licence: 'ODbL',
              objectId: id,
            },
            retrievedAt,
            lastEditedAt,
            lastConfirmedAt: checkDate,
          });
        }
      }

      return { facts, retrievedAt };
    } catch (err) {
      throw failureFromUnknown('OpenStreetMap (Overpass)', err);
    }
  }
}
