import {
  parseCoordinates,
  type GeocodingProvider,
  type PlaceHit,
  type SourceDescriptor,
} from '@krakow-bez-barier/core';

export interface NominatimProviderOptions {
  endpoint?: string;
  userAgent?: string;
  viewbox?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export class OsmNominatimGeocodingProvider implements GeocodingProvider {
  private readonly endpoint: string;
  private readonly userAgent: string;
  private readonly viewbox?: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: NominatimProviderOptions = {}) {
    this.endpoint = options.endpoint || 'https://nominatim.openstreetmap.org';
    this.userAgent =
      options.userAgent ||
      'KrakowBezBarier/0.1 (HackYeah 2026 prototype; contact@example.com)';
    // Default viewbox covers Kraków metropolitan area (lon,lat,lon,lat)
    this.viewbox = options.viewbox ?? '19.65,50.18,20.25,49.95';
    this.fetchFn = options.fetchFn || globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  describe(): SourceDescriptor {
    return {
      name: 'OpenStreetMap Nominatim',
      url: this.endpoint,
      licence: 'Open Database License (ODbL 1.0)',
      attribution: '© OpenStreetMap contributors',
      updateFrequency: 'community real-time',
    };
  }

  async suggest(query: string, lang = 'pl'): Promise<PlaceHit[]> {
    return this.geocode(query, lang);
  }

  async geocode(query: string, lang = 'pl'): Promise<PlaceHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Check if the query is a coordinate pair directly
    const coords = parseCoordinates(trimmed);
    if (coords) {
      return [
        {
          id: `coord-${coords.lat.toFixed(5)}-${coords.lon.toFixed(5)}`,
          name: `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`,
          label: `Współrzędne GPS (${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)})`,
          position: coords,
          kind: 'coordinate',
        },
      ];
    }

    const url = new URL('/search', this.endpoint);
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '8');
    url.searchParams.set(
      'accept-language',
      lang === 'uk' ? 'uk,pl,en' : lang === 'en' ? 'en,pl' : 'pl,en',
    );

    if (this.viewbox) {
      url.searchParams.set('viewbox', this.viewbox);
      url.searchParams.set('bounded', '0'); // Biases towards Krakow without strictly excluding
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return [];
      }

      const text = await response.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) return [];

      return items
        .map((item: any, idx: number): PlaceHit | null => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

          const rawName =
            item.name ||
            item.address?.amenity ||
            item.address?.building ||
            item.address?.road ||
            item.display_name?.split(',')[0]?.trim();

          const name = rawName || `Punkt #${idx + 1}`;
          const label = item.display_name || name;

          return {
            id: `osm-${item.place_id ?? item.osm_id ?? idx}`,
            name,
            label,
            position: { lat, lon },
            kind: item.type || item.category || 'poi',
          };
        })
        .filter((h): h is PlaceHit => h !== null);
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  async reverseGeocode(lat: number, lon: number, lang = 'pl'): Promise<PlaceHit | null> {
    const url = new URL('/reverse', this.endpoint);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set(
      'accept-language',
      lang === 'uk' ? 'uk,pl,en' : lang === 'en' ? 'en,pl' : 'pl,en',
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) return null;

      const item = (await response.json()) as any;
      if (!item || !item.lat || !item.lon) return null;

      const rawName =
        item.name ||
        item.address?.amenity ||
        item.address?.building ||
        item.address?.road ||
        item.display_name?.split(',')[0]?.trim();

      return {
        id: `osm-${item.place_id ?? 'rev'}`,
        name: rawName || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        label: item.display_name || rawName || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        position: { lat, lon },
        kind: item.type || 'address',
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
