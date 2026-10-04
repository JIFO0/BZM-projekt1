import { coverageStat, longestUnknownStretchMetres, totalUnknownStretchMetres } from './coverage';

describe('coverage', () => {
  it('does not treat an empty sample as full coverage', () => {
    expect(coverageStat('kerb', 0, 0).ratio).toBeNull();
  });

  it('computes a ratio and the longest stretch without data', () => {
    expect(coverageStat('kerb', 3, 7).ratio).toBeCloseTo(3 / 7);
    const sampleSegments = [
      { lengthMetres: 40, known: true },
      { lengthMetres: 100, known: false },
      { lengthMetres: 20, known: false },
      { lengthMetres: 10, known: true },
      { lengthMetres: 50, known: false },
    ];
    expect(longestUnknownStretchMetres(sampleSegments)).toBe(120);
    expect(totalUnknownStretchMetres(sampleSegments)).toBe(170);
  });
});
