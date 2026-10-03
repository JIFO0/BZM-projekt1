import { DEMO_SNAPSHOT } from '@krakow-bez-barier/core';
import { buildKrakowOverpassQuery, validateSnapshotData } from './cli';

describe('Demo Snapshot Validation', () => {
  test('validates bundled snapshot without errors and confirms DANE PRZYKŁADOWE', () => {
    const res = validateSnapshotData(DEMO_SNAPSHOT);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
    expect(res.totalFacts).toBeGreaterThan(5);
    expect(res.conflictsFound).toBeGreaterThanOrEqual(1); // Contains simulation for R7
  });

  test('builds Kraków Overpass QL harvest query for municipal public buildings', () => {
    const generalQuery = buildKrakowOverpassQuery();
    expect(generalQuery).toContain('area["name"="Kraków"]');
    expect(generalQuery).toContain('wheelchair');

    const cultureQuery = buildKrakowOverpassQuery('culture');
    expect(cultureQuery).toContain('museum|theatre');

    const officeQuery = buildKrakowOverpassQuery('office');
    expect(officeQuery).toContain('townhall');
  });
});
