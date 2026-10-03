import type { BarrierThresholds } from '@krakow-bez-barier/core';
import { mapGraphHopperPathToResult, parseGraphHopperResponse } from './mapper';
import type { GraphHopperPath, GraphHopperResponse } from './types';

describe('GraphHopper mapper', () => {
  const thresholds: BarrierThresholds = {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
  };

  const samplePath: GraphHopperPath = {
    distance: 250.5,
    weight: 300,
    time: 180000,
    bbox: [19.936, 50.061, 19.938, 50.063],
    points: {
      type: 'LineString',
      coordinates: [
        [19.936, 50.061],
        [19.937, 50.062],
        [19.938, 50.063],
      ],
    },
    instructions: [
      {
        distance: 120.0,
        sign: 0,
        interval: [0, 1],
        text: 'Idź prosto ulicą Floriańską',
        time: 80000,
        street_name: 'Floriańska',
      },
      {
        distance: 130.5,
        sign: 2,
        interval: [1, 2],
        text: 'Skręć w prawo na Rynek Główny',
        time: 100000,
        street_name: 'Rynek Główny',
      },
    ],
    details: {
      surface: [
        [0, 1, 'asphalt'],
        [1, 2, 'cobblestone'],
      ],
      smoothness: [
        [0, 1, 'good'],
        [1, 2, 'bad'],
      ],
      max_width: [
        [0, 1, 2.0],
        [1, 2, 0.8],
      ],
      road_class: [
        [0, 1, 'pedestrian'],
        [1, 2, 'steps'],
      ],
    },
  };

  it('correctly maps path metrics and instructions', () => {
    const result = mapGraphHopperPathToResult(samplePath, thresholds);
    expect(result.distanceMeters).toBe(250.5);
    expect(result.timeSeconds).toBe(180);
    expect(result.instructions.length).toBe(2);
    expect(result.instructions[0].streetName).toBe('Floriańska');
    expect(result.instructions[1].streetName).toBe('Rynek Główny');
  });

  it('detects barriers including steps, narrow width and cobblestone', () => {
    const result = mapGraphHopperPathToResult(samplePath, thresholds);
    expect(result.barriers.length).toBeGreaterThanOrEqual(3);

    const stepsBarrier = result.barriers.find((b) => b.type === 'steps');
    expect(stepsBarrier).toBeDefined();
    expect(stepsBarrier?.severity).toBe('blocker');
    expect(stepsBarrier?.status).toBe('community');

    const widthBarrier = result.barriers.find((b) => b.type === 'width');
    expect(widthBarrier).toBeDefined();
    expect(widthBarrier?.severity).toBe('blocker');

    const surfaceBarrier = result.barriers.find((b) => b.type === 'surface');
    expect(surfaceBarrier).toBeDefined();
    expect(surfaceBarrier?.severity).toBe('warning');
  });

  it('handles unmapped data with honesty requirements', () => {
    const unmappedPath: GraphHopperPath = {
      distance: 100,
      weight: 100,
      time: 60000,
      bbox: [19.936, 50.061, 19.937, 50.062],
      points: {
        type: 'LineString',
        coordinates: [
          [19.936, 50.061],
          [19.937, 50.062],
        ],
      },
      instructions: [
        {
          distance: 100,
          sign: 0,
          interval: [0, 1],
          text: 'Idź prosto',
          time: 60000,
          street_name: 'Grodzka',
        },
      ],
      details: {}, // Empty details: all unmapped
    };

    const result = mapGraphHopperPathToResult(unmappedPath, thresholds);
    expect(result.segments[0].surfaceStatus).toBe('unknown');
    expect(result.segments[0].widthStatus).toBe('unknown');
    // Per honesty principle, missing data must NOT claim no problem
    expect(result.summary.honestyNote).toContain('Brak informacji nie gwarantuje pełnej dostępności');
  });

  it('throws an informative error if response has no paths', () => {
    const emptyResponse: GraphHopperResponse = {
      paths: [],
      message: 'Points not found',
    };
    expect(() => parseGraphHopperResponse(emptyResponse, thresholds)).toThrow('Points not found');
  });
});
