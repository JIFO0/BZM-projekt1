import {
  formatCoordinates,
  haversineDistanceMetres,
  isValidCoordinate,
  parseCoordinates,
  polylineLengthMetres,
} from './geometry';

describe('geometry utilities', () => {
  test('haversineDistanceMetres calculates distance between two points', () => {
    // Rynek to Wawel is approx 800-900m
    const rynek = { lon: 19.9373, lat: 50.0619 };
    const wawel = { lon: 19.9354, lat: 50.0544 };
    const dist = haversineDistanceMetres(rynek, wawel);
    expect(dist).toBeGreaterThan(800);
    expect(dist).toBeLessThan(900);
  });

  test('polylineLengthMetres calculates total line length', () => {
    const coords: Array<[number, number]> = [
      [19.9373, 50.0619],
      [19.9360, 50.0580],
      [19.9354, 50.0544],
    ];
    const len = polylineLengthMetres(coords);
    expect(len).toBeGreaterThan(800);
  });

  test('isValidCoordinate validates geographic bounds', () => {
    expect(isValidCoordinate(50.0619, 19.9373)).toBe(true);
    expect(isValidCoordinate(91, 10)).toBe(false);
    expect(isValidCoordinate(-91, 10)).toBe(false);
    expect(isValidCoordinate(50, 181)).toBe(false);
    expect(isValidCoordinate(50, -181)).toBe(false);
    expect(isValidCoordinate(NaN, 10)).toBe(false);
  });

  test('formatCoordinates formats to fixed decimals', () => {
    expect(formatCoordinates({ lat: 50.06194, lon: 19.93731 })).toBe('50.06194, 19.93731');
    expect(formatCoordinates({ lat: 50.06194, lon: 19.93731 }, 2)).toBe('50.06, 19.94');
  });

  describe('parseCoordinates', () => {
    test('parses comma-separated lat, lon', () => {
      const res = parseCoordinates('50.0619, 19.9373');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('parses comma-separated with comma decimals', () => {
      const res = parseCoordinates('50,0619; 19,9373');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('parses space-separated coordinates', () => {
      const res = parseCoordinates('50.0619 19.9373');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('parses labeled format (lat/lon)', () => {
      const res = parseCoordinates('lat: 50.0619, lon: 19.9373');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('parses Polish labeled format (szer/dł)', () => {
      const res = parseCoordinates('szerokość: 50.0619, długość: 19.9373');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('parses cardinal notation', () => {
      const res = parseCoordinates('50.0619 N, 19.9373 E');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('detects swapped order in Poland context (lon, lat)', () => {
      const res = parseCoordinates('19.9373, 50.0619');
      expect(res).not.toBeNull();
      expect(res?.lat).toBeCloseTo(50.0619);
      expect(res?.lon).toBeCloseTo(19.9373);
    });

    test('returns null for non-coordinates', () => {
      expect(parseCoordinates('Rynek Główny')).toBeNull();
      expect(parseCoordinates('')).toBeNull();
      expect(parseCoordinates('abc, def')).toBeNull();
    });
  });
});
