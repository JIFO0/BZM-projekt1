import { FACT_STATUSES, SUBJECT_TYPES, type Fact, type FactStatus, type SubjectType } from './types';

export type FactValidation = { ok: true; value: Fact } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isoDate(value: unknown, field: string, errors: string[], required: boolean): string | undefined {
  if (value === undefined) {
    if (required) errors.push(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    errors.push(`${field} must be an ISO date string`);
    return undefined;
  }
  return value;
}

/** Rejects malformed facts. Does not turn unknown into ok. */
export function validateFact(input: unknown): FactValidation {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['Fact must be an object'] };

  if (typeof input.id !== 'string' || input.id.trim() === '') errors.push('id is required');
  if (typeof input.criterion !== 'string' || input.criterion.trim() === '') {
    errors.push('criterion is required');
  }
  if (typeof input.value !== 'string') errors.push('value is required');
  if (typeof input.status !== 'string' || !FACT_STATUSES.includes(input.status as FactStatus)) {
    errors.push('status is invalid');
  }

  const subject = input.subject;
  if (!isRecord(subject)) {
    errors.push('subject is required');
  } else {
    if (typeof subject.type !== 'string' || !SUBJECT_TYPES.includes(subject.type as SubjectType)) {
      errors.push('subject.type is invalid');
    }
    if (typeof subject.ref !== 'string' || subject.ref.trim() === '') errors.push('subject.ref is required');
    if (typeof subject.lat !== 'number' || subject.lat < -90 || subject.lat > 90) {
      errors.push('subject.lat is invalid');
    }
    if (typeof subject.lon !== 'number' || subject.lon < -180 || subject.lon > 180) {
      errors.push('subject.lon is invalid');
    }
  }

  const source = input.source;
  if (!isRecord(source)) {
    errors.push('source is required');
  } else {
    for (const key of ['name', 'url', 'licence'] as const) {
      if (typeof source[key] !== 'string' || source[key].trim() === '') {
        errors.push(`source.${key} is required`);
      }
    }
  }

  const retrievedAt = isoDate(input.retrievedAt, 'retrievedAt', errors, true);
  const lastEditedAt = isoDate(input.lastEditedAt, 'lastEditedAt', errors, false);
  const lastConfirmedAt = isoDate(input.lastConfirmedAt, 'lastConfirmedAt', errors, false);

  if (input.matchConfidence !== undefined) {
    if (
      typeof input.matchConfidence !== 'number' ||
      input.matchConfidence < 0 ||
      input.matchConfidence > 1
    ) {
      errors.push('matchConfidence must be between 0 and 1');
    }
  }
  if (input.unit !== undefined && typeof input.unit !== 'string') errors.push('unit must be a string');

  if (errors.length > 0 || !isRecord(subject) || !isRecord(source) || !retrievedAt) {
    return { ok: false, errors };
  }

  const fact: Fact = {
    id: input.id as string,
    subject: {
      type: subject.type as SubjectType,
      ref: subject.ref as string,
      lat: subject.lat as number,
      lon: subject.lon as number,
    },
    criterion: input.criterion as string,
    value: input.value as string,
    status: input.status as FactStatus,
    source: {
      name: source.name as string,
      url: source.url as string,
      licence: source.licence as string,
      ...(typeof source.objectId === 'string' ? { objectId: source.objectId } : {}),
      ...(typeof source.objectVersion === 'string' ? { objectVersion: source.objectVersion } : {}),
    },
    retrievedAt,
    ...(lastEditedAt ? { lastEditedAt } : {}),
    ...(lastConfirmedAt ? { lastConfirmedAt } : {}),
    ...(typeof input.unit === 'string' ? { unit: input.unit } : {}),
    ...(typeof input.matchConfidence === 'number' ? { matchConfidence: input.matchConfidence } : {}),
  };

  return { ok: true, value: fact };
}
