import { analyzePlace, computePlaceMatchConfidence } from './place-analysis';
import type { Fact, LonLat } from './types';

describe('Place Analysis & Matching (T6)', () => {
  const targetPos: LonLat = { lat: 50.0619, lon: 19.9373 }; // Rynek Główny Sukiennice

  const closeFact: Fact = {
    id: 'way/sukiennice',
    subject: { type: 'place', ref: 'way/sukiennice', lat: 50.06195, lon: 19.93735 }, // ~7m away
    criterion: 'entrance:wheelchair',
    value: 'yes, wejście płaskie, brak stopni',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  const farFact: Fact = {
    id: 'way/distant',
    subject: { type: 'place', ref: 'way/distant', lat: 50.068, lon: 19.945 }, // > 500m away
    criterion: 'wheelchair',
    value: 'yes',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-01T10:00:00Z',
  };

  test('confident match when OSM element is close (<40m)', () => {
    const report = analyzePlace('Sukiennice', targetPos, [closeFact], 40);
    expect(report.isConfidentMatch).toBe(true);
    expect(report.matchConfidence).toBeGreaterThan(0.7);
    expect(report.factsByCategory.entrance.length).toBe(1);
    expect(report.summaryMessage).toContain('Dopasowano obiekt OSM');
  });

  test('no match when OSM element is too far (>40m)', () => {
    const report = analyzePlace('Sukiennice', targetPos, [farFact], 40);
    expect(report.isConfidentMatch).toBe(false);
    expect(report.matchConfidence).toBe(0);
    expect(report.summaryMessage).toBe('Brak danych o dostępności tego miejsca w OpenStreetMap');
  });

  test('no match when no OSM facts are found', () => {
    const report = analyzePlace('Nieznany budynek', targetPos, [], 40);
    expect(report.isConfidentMatch).toBe(false);
    expect(report.matchConfidence).toBe(0);
    expect(report.summaryMessage).toBe('Brak danych o dostępności tego miejsca w OpenStreetMap');
  });
});
