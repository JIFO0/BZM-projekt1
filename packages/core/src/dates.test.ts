import { dateLabel, isStale, statusFromOsmTags } from './dates';

const now = new Date('2026-10-03T12:00:00.000Z');

describe('staleness and date labels', () => {
  it('does not treat a missing date as fresh or stale', () => {
    expect(isStale(undefined, now, 24)).toBe(false);
  });

  it('flags a check date older than the city threshold', () => {
    expect(isStale('2024-09-01', now, 24)).toBe(true);
    expect(isStale('2025-11-01', now, 24)).toBe(false);
  });

  it('never labels OSM verified from an edit date alone', () => {
    expect(
      statusFromOsmTags({
        conflicting: false,
        now,
        stalenessMonths: 24,
      }),
    ).toBe('community');
  });

  it('labels OSM verified only when check_date is inside the threshold', () => {
    expect(
      statusFromOsmTags({
        conflicting: false,
        checkDate: '2026-01-15',
        now,
        stalenessMonths: 24,
      }),
    ).toBe('verified');
    expect(
      statusFromOsmTags({
        conflicting: false,
        checkDate: '2020-01-15',
        now,
        stalenessMonths: 24,
      }),
    ).toBe('community');
  });

  it('prefers a confirmation and otherwise calls an OSM edit an edit', () => {
    expect(
      dateLabel({
        lastConfirmedAt: '2026-02-01',
        lastEditedAt: '2024-03-01',
        retrievedAt: '2026-10-03',
      }).kind,
    ).toBe('confirmed');
    expect(
      dateLabel({
        lastEditedAt: '2024-03-01',
        retrievedAt: '2026-10-03',
      }).kind,
    ).toBe('osm_last_edit');
  });
});
