export const FACT_STATUSES = [
  'verified',
  'community',
  'reported',
  'inferred',
  'unknown',
  'conflicting',
] as const;

export type FactStatus = (typeof FACT_STATUSES)[number];

export const SEVERITIES = ['blocker', 'warning', 'info', 'ok', 'unknown'] as const;

export type Severity = (typeof SEVERITIES)[number];

export const PROFILE_IDS = ['wheelchair', 'stroller', 'custom'] as const;

export type ProfileId = (typeof PROFILE_IDS)[number];

export const SUBJECT_TYPES = ['place', 'segment', 'crossing', 'entrance'] as const;

export type SubjectType = (typeof SUBJECT_TYPES)[number];

export interface FactSource {
  name: string;
  url: string;
  licence: string;
  objectId?: string;
  objectVersion?: string;
}

export interface FactSubject {
  type: SubjectType;
  ref: string;
  lat: number;
  lon: number;
}

/**
 * One piece of evidence. Status is never implied by a missing field:
 * unknown stays unknown, and OSM is community unless a recent check date exists.
 */
export interface Fact {
  id: string;
  subject: FactSubject;
  criterion: string;
  value: string;
  unit?: string;
  status: FactStatus;
  source: FactSource;
  retrievedAt: string;
  lastEditedAt?: string;
  lastConfirmedAt?: string;
  matchConfidence?: number;
}

export interface BarrierThresholds {
  maxKerbMillimetres: number;
  minWidthMetres: number;
  maxInclinePercent: number;
  stepsAreBlocker: boolean;
  allowedSurfaces: string[];
  blockedRoadTypes?: string[];
  blockedSurfaces?: string[];
}

export interface LonLat {
  lon: number;
  lat: number;
}

export interface SourceDescriptor {
  name: string;
  url: string;
  licence: string;
  attribution: string;
  updateFrequency: string;
}
