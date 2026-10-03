import { parseCityConfig } from './city-config';
import { analyzeRoute, evaluateFactSeverity } from './route-analysis';
import type { Fact } from './types';

const MOCK_CONFIG = parseCityConfig({
  id: 'krakow',
  displayName: 'Kraków',
  defaultLanguage: 'pl',
  languages: ['pl', 'en'],
  teamId: null,
  demoArea: { label: 'Rynek', provisional: true },
  bbox: { minLon: 19.9, minLat: 50.0, maxLon: 20.0, maxLat: 50.1, note: 'test' },
  stalenessMonths: 24,
  corridorMeters: 20,
  placeMatchMaxMetres: 40,
  minCoverageForNoBarrierWording: 0.8,
  adapters: { routing: 'mapy', geocoding: 'mapy', accessibility: 'osm', tiles: 'mapy' },
  profiles: {
    wheelchair: {
      maxKerbMillimetres: 30,
      minWidthMetres: 0.9,
      maxInclinePercent: 6,
      stepsAreBlocker: true,
      allowedSurfaces: ['asphalt', 'paving_stones', 'concrete'],
      blockedRoadTypes: ['cobblestone', 'sand'],
    },
    custom: {
      maxKerbMillimetres: 30,
      minWidthMetres: 0.9,
      maxInclinePercent: 6,
      stepsAreBlocker: false,
      allowedSurfaces: ['asphalt'],
      blockedRoadTypes: [],
    },
  },
  overpass: { endpoint: 'https://overpass-api.de/api/interpreter', userAgent: 'test/1.0' },
  mapy: {
    apiBase: 'https://api.mapy.com',
    routeType: 'foot_fast',
    geometryFormat: 'geojson',
    language: 'pl',
    tileMapset: 'basic',
  },
  apiBase: 'https://localhost:3000',
});

describe('Route Analysis (T5)', () => {
  // Simple straight line route in Kraków (Rynek -> Grodzka)
  // ~200 meters from lat 50.0619, lon 19.9373 to lat 50.0601, lon 19.9375
  const samplePolyline: Array<[number, number]> = [
    [19.9373, 50.0619],
    [19.9374, 50.0610],
    [19.9375, 50.0601],
  ];

  const stepFactWithoutRamp: Fact = {
    id: 'node/101',
    subject: { type: 'segment', ref: 'node/101', lat: 50.0612, lon: 19.9374 },
    criterion: 'steps',
    value: '12 stopni, ramp=no',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  const stepFactWithRamp: Fact = {
    id: 'node/102',
    subject: { type: 'segment', ref: 'node/102', lat: 50.0612, lon: 19.9374 },
    criterion: 'steps',
    value: '8 stopni, ramp=yes',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  const kerbFactHigh: Fact = {
    id: 'node/103',
    subject: { type: 'crossing', ref: 'node/103', lat: 50.0605, lon: 19.9375 },
    criterion: 'kerb',
    value: '120 mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  const missingKerbFact: Fact = {
    id: 'node/104',
    subject: { type: 'crossing', ref: 'node/104', lat: 50.0604, lon: 19.9375 },
    criterion: 'kerb',
    value: 'brak pomiaru',
    status: 'unknown',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  test('step detected is blocker for wheelchair, but downgraded to warning with ramp', () => {
    const sevWithoutRamp = evaluateFactSeverity(
      stepFactWithoutRamp,
      MOCK_CONFIG.profiles.wheelchair,
    );
    expect(sevWithoutRamp.severity).toBe('blocker');

    const sevWithRamp = evaluateFactSeverity(stepFactWithRamp, MOCK_CONFIG.profiles.wheelchair);
    expect(sevWithRamp.severity).toBe('warning');
  });

  test('high kerb is blocker for wheelchair (120mm > 30mm)', () => {
    const sevWheelchair = evaluateFactSeverity(kerbFactHigh, MOCK_CONFIG.profiles.wheelchair);
    expect(sevWheelchair.severity).toBe('blocker');
    expect(sevWheelchair.evidence).toContain('120 mm');
    expect(sevWheelchair.evidence).toContain('30 mm');
  });

  test('explicit 10 mm kerb is 10 millimetres and follows the profile limit', () => {
    const lowKerb: Fact = { ...kerbFactHigh, value: '10 mm' };
    expect(evaluateFactSeverity(lowKerb, MOCK_CONFIG.profiles.wheelchair).severity).toBe('ok');
    expect(
      evaluateFactSeverity(lowKerb, { ...MOCK_CONFIG.profiles.wheelchair, maxKerbMillimetres: 5 })
        .severity,
    ).toBe('blocker');
  });

  test('OSM kerb height in metres is converted before comparing with the profile', () => {
    const osmKerb: Fact = { ...kerbFactHigh, value: '0.12', unit: 'm' };
    const sev = evaluateFactSeverity(osmKerb, MOCK_CONFIG.profiles.wheelchair);
    expect(sev.severity).toBe('blocker');
    expect(sev.evidence).toContain('120 mm');
    const loose = evaluateFactSeverity(osmKerb, {
      ...MOCK_CONFIG.profiles.wheelchair,
      maxKerbMillimetres: 140,
    });
    expect(loose.severity).toBe('ok');
  });

  test('qualitative kerb tags use a profile comparison instead of a 10 mm default', () => {
    const raised = evaluateFactSeverity(
      { ...kerbFactHigh, value: 'raised' },
      MOCK_CONFIG.profiles.wheelchair,
    );
    expect(raised.severity).toBe('blocker');
    expect(raised.evidence).toContain('100 mm');
    expect(
      evaluateFactSeverity(
        { ...kerbFactHigh, value: 'raised' },
        { ...MOCK_CONFIG.profiles.wheelchair, maxKerbMillimetres: 140 },
      ).severity,
    ).toBe('ok');

    const lowered = evaluateFactSeverity(
      { ...kerbFactHigh, value: 'lowered' },
      { ...MOCK_CONFIG.profiles.wheelchair, maxKerbMillimetres: 20 },
    );
    expect(lowered.severity).toBe('blocker');
    expect(lowered.evidence).toContain('30 mm');
  });

  test('missing kerb tag stays unknown', () => {
    const sevUnknown = evaluateFactSeverity(missingKerbFact, MOCK_CONFIG.profiles.wheelchair);
    expect(sevUnknown.severity).toBe('unknown');
  });

  test('route report orders findings by distance and computes coverage and longest unknown stretch', () => {
    const report = analyzeRoute({
      routeId: 'route-test-1',
      profileId: 'wheelchair',
      routeCoordinates: samplePolyline,
      facts: [stepFactWithoutRamp, kerbFactHigh, missingKerbFact],
      config: MOCK_CONFIG,
    });

    expect(report.lengthMetres).toBeGreaterThan(100);
    expect(report.findings.length).toBe(3);

    // Verify distance ordering
    for (let i = 0; i < report.findings.length - 1; i++) {
      expect(report.findings[i]!.distanceFromStartMetres).toBeLessThanOrEqual(
        report.findings[i + 1]!.distanceFromStartMetres,
      );
    }

    expect(report.longestUnknownStretchMetres).toBeGreaterThan(0);
    expect(report.coverage.length).toBeGreaterThan(0);
  });

  test('surface fact is blocker when surface is in blockedRoadTypes and warning otherwise', () => {
    const cobblestoneFact: Fact = {
      id: 'way/201',
      subject: { type: 'segment', ref: 'way/201', lat: 50.0612, lon: 19.9374 },
      criterion: 'surface',
      value: 'cobblestone',
      status: 'community',
      source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
      retrievedAt: '2026-10-01T10:00:00Z',
    };

    // With blockedRoadTypes including cobblestone
    const blockerEval = evaluateFactSeverity(cobblestoneFact, {
      ...MOCK_CONFIG.profiles.wheelchair,
      blockedRoadTypes: ['cobblestone'],
    });
    expect(blockerEval.severity).toBe('blocker');
    expect(blockerEval.evidence).toContain('Zablokowana nawierzchnia: cobblestone');

    // Without blockedRoadTypes (only not in allowedSurfaces) -> warning
    const warningEval = evaluateFactSeverity(cobblestoneFact, {
      ...MOCK_CONFIG.profiles.wheelchair,
      blockedRoadTypes: [],
    });
    expect(warningEval.severity).toBe('warning');
    expect(warningEval.evidence).toContain('Nawierzchnia utrudniająca poruszanie się: cobblestone');
  });

  test('low kerb with mm unit (20 mm) is ok for wheelchair with 30mm threshold, not blocker', () => {
    const lowKerbFact: Fact = {
      id: 'node/105',
      subject: { type: 'crossing', ref: 'node/105', lat: 50.0532, lon: 19.9457 },
      criterion: 'kerb',
      value: '20 mm',
      status: 'community',
      source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
      retrievedAt: '2026-10-01T10:00:00Z',
    };

    const evalResult = evaluateFactSeverity(lowKerbFact, MOCK_CONFIG.profiles.wheelchair);
    expect(evalResult.severity).toBe('ok');
    expect(evalResult.evidence).toContain('20 mm');
    expect(evalResult.evidence).not.toContain('20000 mm');
  });
});
