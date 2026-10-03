import { DEMO_SNAPSHOT } from '@krakow-bez-barier/core';
import { validateSnapshotData } from './cli';

describe('Demo Snapshot Validation', () => {
  test('validates bundled snapshot without errors and confirms DANE PRZYKŁADOWE', () => {
    const res = validateSnapshotData(DEMO_SNAPSHOT);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
    expect(res.totalFacts).toBeGreaterThan(5);
    expect(res.conflictsFound).toBeGreaterThanOrEqual(1); // Contains simulation for R7
  });
});
