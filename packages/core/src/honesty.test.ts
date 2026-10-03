import { mayPresentAsNoProblem, noBarrierSentenceAllowed } from './honesty';

describe('unknown is never presented as ok', () => {
  it('refuses unknown status even if a caller passes severity ok', () => {
    expect(mayPresentAsNoProblem('unknown', 'ok')).toBe(false);
    expect(mayPresentAsNoProblem('unknown', 'unknown')).toBe(false);
    expect(mayPresentAsNoProblem('conflicting', 'ok')).toBe(false);
    expect(mayPresentAsNoProblem('reported', 'ok')).toBe(false);
  });

  it('refuses a known source when the measurement itself is unknown', () => {
    expect(mayPresentAsNoProblem('community', 'unknown')).toBe(false);
    expect(mayPresentAsNoProblem('verified', 'blocker')).toBe(false);
  });

  it('allows a no-problem reading only with evidence and a calm severity', () => {
    expect(mayPresentAsNoProblem('verified', 'ok')).toBe(true);
    expect(mayPresentAsNoProblem('community', 'info')).toBe(true);
  });

  it('blocks the no-barrier sentence when coverage is missing or low', () => {
    expect(
      noBarrierSentenceAllowed({ barrierCount: 0, coverageRatio: null, minCoverage: 0.8 }),
    ).toBe(false);
    expect(
      noBarrierSentenceAllowed({ barrierCount: 0, coverageRatio: 0.62, minCoverage: 0.8 }),
    ).toBe(false);
    expect(
      noBarrierSentenceAllowed({ barrierCount: 2, coverageRatio: 1, minCoverage: 0.8 }),
    ).toBe(false);
    expect(
      noBarrierSentenceAllowed({ barrierCount: 0, coverageRatio: 0.9, minCoverage: 0.8 }),
    ).toBe(true);
  });
});
