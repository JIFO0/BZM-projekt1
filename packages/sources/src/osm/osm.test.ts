import { OsmNominatimGeocodingProvider } from './nominatim';
import { OsmRoutingProvider } from './routing';

describe('OsmNominatimGeocodingProvider', () => {
  test('parses coordinates directly without network request', async () => {
    const fetchFn = jest.fn();
    const provider = new OsmNominatimGeocodingProvider({ fetchFn });

    const results = await provider.suggest('50.0619, 19.9373');
    expect(results).toHaveLength(1);
    expect(results[0]?.kind).toBe('coordinate');
    expect(results[0]?.position.lat).toBeCloseTo(50.0619);
    expect(results[0]?.position.lon).toBeCloseTo(19.9373);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test('queries Nominatim API for textual search query', async () => {
    const mockItems = [
      {
        place_id: 12345,
        name: 'Sukiennice',
        display_name: 'Sukiennice, Rynek Główny, Kraków, Polska',
        lat: '50.0619',
        lon: '19.9373',
        type: 'monument',
      },
    ];

    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockItems),
    } as any);

    const provider = new OsmNominatimGeocodingProvider({ fetchFn });
    const results = await provider.suggest('Sukiennice', 'pl');

    expect(fetchFn).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Sukiennice');
    expect(results[0]?.position.lat).toBe(50.0619);
    expect(results[0]?.position.lon).toBe(19.9373);
  });

  test('reverse geocodes coordinates to a place hit', async () => {
    const mockItem = {
      place_id: 999,
      name: 'Wawel',
      display_name: 'Zamek Królewski na Wawelu, Kraków',
      lat: '50.0544',
      lon: '19.9354',
      type: 'castle',
    };

    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    } as any);

    const provider = new OsmNominatimGeocodingProvider({ fetchFn });
    const res = await provider.reverseGeocode(50.0544, 19.9354, 'pl');

    expect(res).not.toBeNull();
    expect(res?.name).toBe('Wawel');
    expect(res?.position.lat).toBe(50.0544);
    expect(res?.position.lon).toBe(19.9354);
  });
});

describe('OsmRoutingProvider', () => {
  test('routes via OSRM foot router when service succeeds', async () => {
    const mockOsrm = {
      routes: [
        {
          distance: 850,
          duration: 700,
          geometry: {
            coordinates: [
              [19.9373, 50.0619],
              [19.9354, 50.0544],
            ],
          },
        },
      ],
    };

    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsrm,
    } as any);

    const provider = new OsmRoutingProvider({ fetchFn });
    const route = await provider.route({
      start: { lon: 19.9373, lat: 50.0619 },
      end: { lon: 19.9354, lat: 50.0544 },
      profileId: 'wheelchair',
    });

    expect(route.provider).toBe('osm-osrm');
    expect(route.lengthMetres).toBe(850);
    expect(route.coordinates).toHaveLength(2);
  });

  test('falls back to interpolated straight-line route if OSRM fails', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'));

    const provider = new OsmRoutingProvider({ fetchFn });
    const route = await provider.route({
      start: { lon: 19.9373, lat: 50.0619 },
      end: { lon: 19.9354, lat: 50.0544 },
      profileId: 'wheelchair',
    });

    expect(route.provider).toBe('osm-direct');
    expect(route.lengthMetres).toBeGreaterThan(800);
    expect(route.coordinates.length).toBeGreaterThan(2);
    expect(route.coordinates[0]).toEqual([19.9373, 50.0619]);
    expect(route.coordinates[route.coordinates.length - 1]).toEqual([19.9354, 50.0544]);
  });
});
