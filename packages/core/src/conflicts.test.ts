import { findConflicts } from './conflicts';
import type { Fact } from './types';

function fact(partial: Pick<Fact, 'id' | 'criterion' | 'value' | 'subject'>): Fact {
  return {
    ...partial,
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://www.openstreetmap.org/copyright',
      licence: 'ODbL',
      objectId: partial.id,
    },
    retrievedAt: '2026-10-03T12:00:00.000Z',
  };
}

describe('conflict detection', () => {
  it('keeps both values when a building and its entrance disagree', () => {
    const conflicts = findConflicts([
      fact({
        id: 'way/1',
        criterion: 'wheelchair',
        value: 'yes',
        subject: { type: 'place', ref: 'amenity:1', lat: 50.06, lon: 19.94 },
      }),
      fact({
        id: 'node/2',
        criterion: 'wheelchair',
        value: 'no',
        subject: { type: 'entrance', ref: 'amenity:1', lat: 50.06, lon: 19.94 },
      }),
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.facts.map((item) => item.value).sort()).toEqual(['no', 'yes']);
    expect(conflicts[0]?.facts.every((item) => item.status === 'conflicting')).toBe(true);
  });

  it('does not invent a conflict when the values match', () => {
    const subject = { type: 'crossing' as const, ref: 'node/9', lat: 50.06, lon: 19.94 };
    expect(
      findConflicts([
        fact({ id: 'a', criterion: 'kerb', value: 'lowered', subject }),
        fact({ id: 'b', criterion: 'kerb', value: 'lowered', subject }),
      ]),
    ).toEqual([]);
  });
});
