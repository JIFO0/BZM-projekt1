import {
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

export interface OverpassProviderOptions {
  endpoint?: string;
  userAgent?: string;
  stalenessMonths?: number;
  fetchFn?: typeof fetch;
}

export class OsmOverpassProvider implements AccessibilityDataSource {
  private readonly endpoint: string;
  private readonly userAgent: string;
  private readonly stalenessMonths: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: OverpassProviderOptions = {}) {
    this.endpoint = options.endpoint ?? OVERPASS_INTERPRETER;
    this.userAgent =
      options.userAgent ?? 'KrakowBezBarier/0.1 (HackYeah 2026 prototype; contact@example.com)';
    this.stalenessMonths = options.stalenessMonths ?? 24;
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
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

    // Compute bounding box around the coordinates with corridor buffer (in degrees ~0.001 deg ≈ 110m)
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

    const bufferDeg = Math.max(0.0005, (query.corridorMetres * 1.5) / 111000);
    const south = (minLat - bufferDeg).toFixed(6);
    const west = (minLon - bufferDeg).toFixed(6);
    const north = (maxLat + bufferDeg).toFixed(6);
    const east = (maxLon + bufferDeg).toFixed(6);

    const bboxStr = `${south},${west},${north},${east}`;

    // Overpass QL query targeted specifically at barriers & mobility tags
    const ql = `[out:json][timeout:25];
(
  node["highway"="steps"](${bboxStr});
  way["highway"="steps"](${bboxStr});
  node["kerb"](${bboxStr});
  node["barrier"="kerb"](${bboxStr});
  node["highway"="crossing"](${bboxStr});
  way["highway"="crossing"](${bboxStr});
  way["surface"](${bboxStr});
  way["incline"](${bboxStr});
  way["width"](${bboxStr});
  node["wheelchair"](${bboxStr});
  way["wheelchair"](${bboxStr});
  node["highway"="elevator"](${bboxStr});
  way["highway"="elevator"](${bboxStr});
  node["ramp"](${bboxStr});
  way["ramp"](${bboxStr});
);
out center tags qt;`;

    return this.executeQuery(ql);
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

  private async executeQuery(ql: string): Promise<AccessibilityBundle> {
    const retrievedAt = new Date().toISOString();
    try {
      const response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          ...overpassHeaders(this.userAgent),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(ql)}`,
      });

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
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;

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

        // Kerb
        if (tags.kerb || tags.barrier === 'kerb') {
          const kerbVal = tags.kerb || tags['kerb:height'] || 'obecny';
          facts.push({
            id: `${id}-kerb`,
            subject: { type: 'crossing', ref: id, lat, lon },
            criterion: 'kerb',
            value: kerbVal,
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
