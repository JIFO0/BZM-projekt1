import type { BarrierThresholds, ProfileId } from './types';

export interface CityBBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  note: string;
}

export interface CityConfig {
  id: string;
  displayName: string;
  defaultLanguage: 'pl' | 'en';
  languages: Array<'pl' | 'en'>;
  teamId: string | null;
  demoArea: { label: string; provisional: boolean };
  bbox: CityBBox;
  stalenessMonths: number;
  corridorMeters: number;
  placeMatchMaxMetres: number;
  minCoverageForNoBarrierWording: number;
  adapters: {
    routing: string;
    geocoding: string;
    accessibility: string;
    tiles: string;
  };
  profiles: Record<ProfileId, BarrierThresholds>;
  overpass: { endpoint: string; userAgent: string };
  mapy: {
    apiBase: string;
    routeType: 'foot_fast';
    geometryFormat: 'geojson';
    language: 'pl' | 'en';
    tileMapset: 'basic' | 'outdoor' | 'aerial' | 'names-overlay' | 'winter';
  };
  graphhopper?: {
    apiBase: string;
  };
  apiBase: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`City config field ${key} must be a non-empty string`);
  }
  return value;
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`City config field ${key} must be a finite number`);
  }
  return value;
}

function readThresholds(value: unknown, profile: ProfileId): BarrierThresholds {
  if (!isRecord(value)) throw new Error(`Profile ${profile} is missing`);
  const surfaces = value.allowedSurfaces;
  if (!Array.isArray(surfaces) || surfaces.some((item) => typeof item !== 'string')) {
    throw new Error(`Profile ${profile} allowedSurfaces must be a string array`);
  }
  if (typeof value.stepsAreBlocker !== 'boolean') {
    throw new Error(`Profile ${profile} stepsAreBlocker must be boolean`);
  }
  const rawBlocked = Array.isArray(value.blockedRoadTypes)
    ? value.blockedRoadTypes
    : Array.isArray(value.blockedSurfaces)
      ? value.blockedSurfaces
      : [];
  const blockedRoadTypes = rawBlocked.filter((item): item is string => typeof item === 'string');

  return {
    maxKerbMillimetres: readNumber(value, 'maxKerbMillimetres'),
    minWidthMetres: readNumber(value, 'minWidthMetres'),
    maxInclinePercent: readNumber(value, 'maxInclinePercent'),
    stepsAreBlocker: value.stepsAreBlocker,
    allowedSurfaces: surfaces,
    blockedRoadTypes,
    blockedSurfaces: blockedRoadTypes,
  };
}

const TILE_MAPSETS = ['basic', 'outdoor', 'aerial', 'names-overlay', 'winter'] as const;
type TileMapset = (typeof TILE_MAPSETS)[number];

function isTileMapset(value: unknown): value is TileMapset {
  return typeof value === 'string' && (TILE_MAPSETS as readonly string[]).includes(value);
}

export function parseCityConfig(input: unknown): CityConfig {
  if (!isRecord(input)) throw new Error('City config must be an object');
  const demoArea = input.demoArea;
  const bbox = input.bbox;
  const adapters = input.adapters;
  const profiles = input.profiles;
  const overpass = input.overpass;
  const mapy = input.mapy;
  if (!isRecord(demoArea) || !isRecord(bbox) || !isRecord(adapters)) {
    throw new Error('City config is missing demoArea, bbox or adapters');
  }
  if (!isRecord(profiles) || !isRecord(overpass) || !isRecord(mapy)) {
    throw new Error('City config is missing profiles, overpass or mapy');
  }
  if (typeof demoArea.provisional !== 'boolean') {
    throw new Error('demoArea.provisional must be boolean');
  }
  const teamId = input.teamId;
  if (teamId !== null && typeof teamId !== 'string') {
    throw new Error('teamId must be a string or null');
  }
  const routeType = mapy.routeType;
  if (routeType !== 'foot_fast') {
    throw new Error('mapy.routeType must be foot_fast');
  }
  const geometryFormat = mapy.geometryFormat;
  if (geometryFormat !== 'geojson') {
    throw new Error('mapy.geometryFormat must be geojson');
  }
  if (!isTileMapset(mapy.tileMapset)) {
    throw new Error('mapy.tileMapset is not a documented Mapy.com mapset');
  }
  const tileMapset = mapy.tileMapset;
  const language = mapy.language;
  if (language !== 'pl' && language !== 'en') {
    throw new Error('mapy.language must be pl or en');
  }
  const defaultLanguage = input.defaultLanguage;
  if (defaultLanguage !== 'pl' && defaultLanguage !== 'en') {
    throw new Error('defaultLanguage must be pl or en');
  }

  return {
    id: readString(input, 'id'),
    displayName: readString(input, 'displayName'),
    defaultLanguage,
    languages: ['pl', 'en'],
    teamId,
    demoArea: { label: readString(demoArea, 'label'), provisional: demoArea.provisional },
    bbox: {
      minLon: readNumber(bbox, 'minLon'),
      minLat: readNumber(bbox, 'minLat'),
      maxLon: readNumber(bbox, 'maxLon'),
      maxLat: readNumber(bbox, 'maxLat'),
      note: readString(bbox, 'note'),
    },
    stalenessMonths: readNumber(input, 'stalenessMonths'),
    corridorMeters: readNumber(input, 'corridorMeters'),
    placeMatchMaxMetres: readNumber(input, 'placeMatchMaxMetres'),
    minCoverageForNoBarrierWording: readNumber(input, 'minCoverageForNoBarrierWording'),
    adapters: {
      routing: readString(adapters, 'routing'),
      geocoding: readString(adapters, 'geocoding'),
      accessibility: readString(adapters, 'accessibility'),
      tiles: readString(adapters, 'tiles'),
    },
    profiles: {
      wheelchair: readThresholds(profiles.wheelchair, 'wheelchair'),
      stroller: readThresholds(profiles.stroller, 'stroller'),
      custom: readThresholds(profiles.custom, 'custom'),
    },
    overpass: {
      endpoint: readString(overpass, 'endpoint'),
      userAgent: readString(overpass, 'userAgent'),
    },
    mapy: {
      apiBase: readString(mapy, 'apiBase'),
      routeType,
      geometryFormat,
      language,
      tileMapset,
    },
    graphhopper: isRecord(input.graphhopper)
      ? { apiBase: readString(input.graphhopper, 'apiBase') }
      : undefined,
    apiBase: readString(input, 'apiBase'),
  };
}
