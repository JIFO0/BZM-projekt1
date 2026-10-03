import { readFileSync } from 'node:fs';
import path from 'node:path';

import { validateFact } from './validate-fact';

const schema = JSON.parse(
  readFileSync(path.join(__dirname, '../../../schemas/fact.schema.json'), 'utf8'),
) as { required: string[] };

const valid = {
  id: 'node/1',
  subject: { type: 'crossing', ref: 'node/1', lat: 50.0614, lon: 19.9372 },
  criterion: 'kerb',
  value: 'lowered',
  status: 'community',
  source: {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/node/1',
    licence: 'ODbL',
  },
  retrievedAt: '2026-10-03T12:00:00.000Z',
};

describe('fact schema validation', () => {
  it('accepts a complete fact', () => {
    const result = validateFact(valid);
    expect(result.ok).toBe(true);
  });

  it('rejects each field the JSON schema marks as required when it is missing', () => {
    expect(schema.required).toEqual(
      expect.arrayContaining(['id', 'subject', 'criterion', 'value', 'status', 'source', 'retrievedAt']),
    );
    for (const field of schema.required) {
      const broken: Record<string, unknown> = { ...valid };
      delete broken[field];
      expect(validateFact(broken).ok).toBe(false);
    }
  });

  it('rejects an invented status and a latitude outside range', () => {
    expect(validateFact({ ...valid, status: 'accessible' }).ok).toBe(false);
    expect(
      validateFact({
        ...valid,
        subject: { ...valid.subject, lat: 120 },
      }).ok,
    ).toBe(false);
  });
});
