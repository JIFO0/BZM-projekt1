import type { BarrierThresholds } from '@krakow-bez-barier/core';
import {
  buildGraphHopperRequestBody,
  buildGraphHopperUrl,
  fetchGraphHopperRoute,
  fetchRouteRespectingDetour,
} from './client';
import type { GraphHopperRouteQuery } from './types';

describe('GraphHopper client', () => {
  const thresholds: BarrierThresholds = {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
  };

  const query: GraphHopperRouteQuery = {
    apiBase: 'http://localhost:8989',
    start: { lon: 19.936, lat: 50.061 },
    end: { lon: 19.938, lat: 50.063 },
    thresholds,
    lang: 'pl',
  };

  it('builds the correct URL', () => {
    const url = buildGraphHopperUrl('http://localhost:8989/');
    expect(url.toString()).toBe('http://localhost:8989/route');
  });

  it('builds request payload with ch.disable=true and custom model', () => {
    const body = buildGraphHopperRequestBody(query);
    expect(body['ch.disable']).toBe(true);
    expect(body.profile).toBe('foot');
    expect(body.points).toEqual([
      [19.936, 50.061],
      [19.938, 50.063],
    ]);
    expect(body.custom_model).toBeDefined();
    expect(body.custom_model?.priority).toBeDefined();
    expect(body.details).toContain('surface');
    expect(body.details).toContain('max_width');
    expect(body.snap_preventions).toContain('residential');
    expect(body.custom_model?.priority?.[0]?.if).toContain('road_class == RESIDENTIAL');
  });

  it('fetches route and returns mapped result', async () => {
    const mockJson = {
      paths: [
        {
          distance: 100,
          weight: 100,
          time: 60000,
          bbox: [19.936, 50.061, 19.938, 50.063],
          points: {
            type: 'LineString',
            coordinates: [
              [19.936, 50.061],
              [19.938, 50.063],
            ],
          },
          instructions: [
            {
              distance: 100,
              sign: 0,
              interval: [0, 1],
              text: 'Idź prosto',
              time: 60000,
              street_name: 'Floriańska',
            },
          ],
          details: {
            surface: [[0, 1, 'asphalt']],
          },
        },
      ],
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockJson),
    }) as unknown as typeof fetch;

    const result = await fetchGraphHopperRoute(query, mockFetch);
    expect(result.distanceMeters).toBe(100);
    expect(result.instructions[0].streetName).toBe('Floriańska');
    expect(result.source.name).toBe('OpenStreetMap');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8989/route',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('throws descriptive error on HTTP failure', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: jest.fn().mockResolvedValue({ message: 'Cannot find sequence of points' }),
    }) as unknown as typeof fetch;

    await expect(fetchGraphHopperRoute(query, mockFetch)).rejects.toThrow(
      'Błąd wyznaczania trasy w GraphHopper (400): Cannot find sequence of points',
    );
  });

  it('keeps the barrier-free route when the extra walk stays reasonable', async () => {
    const mockFetch = jest.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as {
        custom_model: { priority: Array<{ multiply_by?: string }> };
      };
      const strict = body.custom_model.priority.some((rule) => rule.multiply_by === '0.0');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          paths: [
            {
              distance: strict ? 2600 : 2000,
              weight: strict ? 2600 : 2000,
              time: 60000,
              bbox: [19.936, 50.061, 19.938, 50.063],
              points: {
                type: 'LineString',
                coordinates: [
                  [19.936, 50.061],
                  [19.938, 50.063],
                ],
              },
              instructions: [],
              details: { surface: [[0, 1, 'asphalt']] },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;

    const planned = await fetchRouteRespectingDetour(query, mockFetch);
    expect(planned.colorBySurface).toBe(false);
    expect(planned.result.distanceMeters).toBe(2600);
  });

  it('switches to the practical sidewalk route and marks a non-ok surface when the detour is huge', async () => {
    const mockFetch = jest.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as {
        custom_model: { priority: Array<{ multiply_by?: string }> };
      };
      const strict = body.custom_model.priority.some((rule) => rule.multiply_by === '0.0');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          paths: [
            {
              distance: strict ? 16000 : 2200,
              weight: strict ? 16000 : 2200,
              time: 60000,
              bbox: [19.7, 50.06, 19.94, 50.2],
              points: {
                type: 'LineString',
                coordinates: strict
                  ? [
                      [19.936, 50.061],
                      [19.75, 50.2],
                      [19.938, 50.063],
                    ]
                  : [
                      [19.936, 50.061],
                      [19.937, 50.062],
                      [19.938, 50.063],
                    ],
              },
              instructions: [],
              details: {
                surface: strict
                  ? [[0, 2, 'asphalt']]
                  : [
                      [0, 1, 'asphalt'],
                      [1, 2, 'cobblestone'],
                    ],
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;

    const planned = await fetchRouteRespectingDetour(query, mockFetch);
    expect(planned.colorBySurface).toBe(true);
    expect(planned.result.distanceMeters).toBe(2200);
    expect(planned.result.surfaceSpans?.map((span) => span.tone)).toEqual(['ok', 'other']);
  });
});
