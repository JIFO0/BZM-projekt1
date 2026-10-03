import { city } from '@/config/city';
import type { DebugState } from '@/state/session';
import {
  analyzePlace,
  analyzeRoute,
  DEMO_SNAPSHOT,
  parseCoordinates,
  type AccessibilityBundle,
  type BarrierThresholds,
  type Fact,
  type LonLat,
  type PlaceAnalysisReport,
  type PlaceHit,
  type ProfileId,
  type RouteReport,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import {
  GraphHopperRoutingProvider,
  MapyGeocodingProvider,
  MapyRoutingProvider,
  OsmNominatimGeocodingProvider,
  OsmOverpassProvider,
  OsmRoutingProvider,
} from '@krakow-bez-barier/sources';

function getMapyApiKey(): string {
  return process.env.EXPO_PUBLIC_MAPY_API_KEY || '';
}

function hasValidMapyKey(): boolean {
  const key = getMapyApiKey();
  return Boolean(key && !key.includes('replace-with') && key.trim().length > 5);
}

// Initialize providers
const graphhopperRouting = new GraphHopperRoutingProvider({
  apiBase: process.env.EXPO_PUBLIC_GRAPHHOPPER_URL || 'http://localhost:8989',
});
const osmOverpass = new OsmOverpassProvider({
  endpoint: city.overpass.endpoint,
  userAgent: city.overpass.userAgent,
  stalenessMonths: city.stalenessMonths,
  timeoutMs: 4000,
});
const osmNominatim = new OsmNominatimGeocodingProvider({
  userAgent: city.overpass.userAgent,
});
const osmRouting = new OsmRoutingProvider();


export interface PlanRouteParams {
  start: { name: string; position: LonLat };
  end: { name: string; position: LonLat };
  profileId: ProfileId;
  thresholds?: BarrierThresholds;
  debugState: DebugState;
}

export async function planAndAnalyzeRoute(params: PlanRouteParams): Promise<{
  walkingRoute: WalkingRoute;
  report: RouteReport;
  fallbackNotice?: string;
  isSample: boolean;
}> {
  const { start, end, profileId, debugState } = params;

  let walkingRoute: WalkingRoute = DEMO_SNAPSHOT.routes[0]!.walkingRoute;
  let isSample = false;
  let fallbackNotice: string | undefined;

  if (debugState.simulateOffline) {
    const sampleRoute = DEMO_SNAPSHOT.routes[0]!;
    walkingRoute = sampleRoute.walkingRoute;
    isSample = true;
    fallbackNotice = 'Tryb symulacji offline: załadowano trasę ze snapshotu.';
  } else {
    let routed = false;

    // 1. Try self-hosted GraphHopper first (applies dynamic barrier weights)
    try {
      walkingRoute = await graphhopperRouting.route({
        start: start.position,
        end: end.position,
        profileId,
        thresholds: params.thresholds,
      });
      routed = true;
      fallbackNotice = 'Trasa zoptymalizowana przez silnik GraphHopper (dynamiczne wagi barier).';
    } catch {
      // GraphHopper unavailable or point out of sample bounds
    }

    // 2. Fall back to Mapy.com if GraphHopper couldn't route this area
    if (!routed && hasValidMapyKey() && !debugState.simulateMapyDown) {
      try {
        const mapyRouting = new MapyRoutingProvider({ apiKey: getMapyApiKey() });
        walkingRoute = await mapyRouting.route({
          start: start.position,
          end: end.position,
          profileId,
        });
        routed = true;
      } catch {
        // Fall back to OSM routing below
      }
    }

    // 3. Fall back to OpenStreetMap (OSRM foot router)
    if (!routed && !debugState.simulateMapyDown) {
      try {
        walkingRoute = await osmRouting.route({
          start: start.position,
          end: end.position,
          profileId,
          thresholds: params.thresholds,
        });
        routed = true;
        fallbackNotice = 'Trasa wyznaczona na podstawie danych OpenStreetMap.';
      } catch {
        // Fall back below
      }
    }

    // 4. Graceful fallback on API error (R12)
    if (!routed) {
      const isCustom =
        Math.abs(start.position.lat - DEMO_SNAPSHOT.routes[0]!.start.position.lat) > 0.0005 ||
        Math.abs(start.position.lon - DEMO_SNAPSHOT.routes[0]!.start.position.lon) > 0.0005 ||
        Math.abs(end.position.lat - DEMO_SNAPSHOT.routes[0]!.end.position.lat) > 0.0005 ||
        Math.abs(end.position.lon - DEMO_SNAPSHOT.routes[0]!.end.position.lon) > 0.0005;

      if (isCustom) {
        walkingRoute = await osmRouting.route({
          start: start.position,
          end: end.position,
          profileId,
        });
        fallbackNotice = 'Trasa bezpośrednia (połączenie punktów A i B na mapie).';
      } else {
        const sampleRoute = DEMO_SNAPSHOT.routes[0]!;
        walkingRoute = sampleRoute.walkingRoute;
        isSample = true;
        fallbackNotice = debugState.simulateMapyDown
          ? 'Symulacja awarii Mapy.com API (HTTP 429). Załadowano trasę z lokalnego snapshotu demo.'
          : 'Zewnętrzny routing niedostępny. Załadowano trasę zapasową z pamięci urządzenia.';
      }
    }
  }

  // 2. Fetch accessibility data along route geometry
  let facts: Fact[] = [];
  const mustUseFallbackOsm =
    debugState.simulateOverpassDown || debugState.simulateOffline || isSample;

  if (mustUseFallbackOsm) {
    // Use snapshot facts for demo route
    facts = DEMO_SNAPSHOT.routes[0]!.facts;
    if (debugState.simulateOverpassDown) {
      fallbackNotice =
        (fallbackNotice ? `${fallbackNotice} • ` : '') +
        'Symulacja awarii Overpass API (HTTP 503). Użyto danych o barierach ze snapshotu offline.';
    }
  } else {
    try {
      const bundle: AccessibilityBundle = await osmOverpass.fetchAroundGeometry({
        coordinates: walkingRoute.coordinates,
        corridorMetres: city.corridorMeters,
      });
      facts = bundle.facts;
    } catch {
      // Overpass failed (R12): fall back to snapshot facts and notify user
      facts = DEMO_SNAPSHOT.routes[0]!.facts;
      isSample = true;
      fallbackNotice =
        (fallbackNotice ? `${fallbackNotice} • ` : '') +
        'Nie udało się pobrać danych z OpenStreetMap (Overpass niedostępny). Wyświetlono dane ze snapshotu demo.';
    }
  }

  // 3. Deterministic route analysis in core
  const report = analyzeRoute({
    routeId: `route-${Date.now()}`,
    profileId,
    routeCoordinates: walkingRoute.coordinates,
    facts,
    config: city,
    thresholds: params.thresholds,
    isSample,
  });

  return {
    walkingRoute,
    report,
    fallbackNotice,
    isSample,
  };
}

export async function inspectPlace(
  placeName: string,
  position: LonLat,
  debugState: DebugState,
): Promise<{
  report: PlaceAnalysisReport;
  fallbackNotice?: string;
  isSample: boolean;
}> {
  // Check if simulation or offline
  const mustUseFallback = debugState.simulateOverpassDown || debugState.simulateOffline;

  if (mustUseFallback) {
    const samplePlace = DEMO_SNAPSHOT.places[0]!;
    const report = analyzePlace(
      samplePlace.name,
      samplePlace.position,
      samplePlace.facts,
      city.placeMatchMaxMetres,
      true,
    );
    return {
      report,
      fallbackNotice:
        'Symulacja: Wyświetlono obiekt ze snapshotu demonstracyjnego (Sukiennice Kraków).',
      isSample: true,
    };
  }

  try {
    const bundle = await osmOverpass.fetchPlace({
      name: placeName,
      position,
      maxDistanceMetres: city.placeMatchMaxMetres,
    });

    const report = analyzePlace(
      placeName,
      position,
      bundle.facts,
      city.placeMatchMaxMetres,
      false,
    );

    return {
      report,
      isSample: false,
    };
  } catch {
    const samplePlace = DEMO_SNAPSHOT.places[0]!;
    const report = analyzePlace(
      samplePlace.name,
      samplePlace.position,
      samplePlace.facts,
      city.placeMatchMaxMetres,
      true,
    );
    return {
      report,
      fallbackNotice:
        'Błąd połączenia z OpenStreetMap. Wyświetlono obiekt z lokalnego snapshotu demo.',
      isSample: true,
    };
  }
}

const DEFAULT_DEMO_LOCATIONS: PlaceHit[] = [
  {
    id: 'sug-1',
    name: 'Rynek Główny',
    label: 'Rynek Główny, Kraków',
    position: { lon: 19.9373, lat: 50.0619 },
    kind: 'poi',
  },
  {
    id: 'sug-2',
    name: 'Zamek Królewski na Wawelu',
    label: 'Wawel 5, Kraków',
    position: { lon: 19.9354, lat: 50.0544 },
    kind: 'poi',
  },
  {
    id: 'sug-3',
    name: 'Plac Nowy (Kazimierz)',
    label: 'Plac Nowy, Kraków',
    position: { lon: 19.9449, lat: 50.0519 },
    kind: 'poi',
  },
  {
    id: 'sug-4',
    name: 'Sukiennice',
    label: 'Rynek Główny 1/3, Kraków',
    position: { lon: 19.9373, lat: 50.0619 },
    kind: 'poi',
  },
  {
    id: 'sug-5',
    name: 'Planty (Poczta Główna)',
    label: 'ul. Westerplatte / Wielopole, Kraków',
    position: { lon: 19.9423, lat: 50.0592 },
    kind: 'poi',
  },
  {
    id: 'sug-6',
    name: 'Dworzec Główny PKP',
    label: 'Plac Jana Nowaka-Jeziorańskiego 3, Kraków',
    position: { lon: 19.9482, lat: 50.0664 },
    kind: 'station',
  },
];

export async function suggestPlaces(
  query: string,
  lang: 'pl' | 'en' | 'uk' = 'pl',
): Promise<PlaceHit[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return DEFAULT_DEMO_LOCATIONS;
  }

  // 1. Direct coordinate check (lat, lon or lon, lat)
  const coords = parseCoordinates(trimmed);
  if (coords) {
    return [
      {
        id: `coord-${coords.lat.toFixed(5)}-${coords.lon.toFixed(5)}`,
        name: `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`,
        label: `Współrzędne GPS: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`,
        position: coords,
        kind: 'coordinate',
      },
    ];
  }

  // 2. OpenStreetMap Nominatim geocoder
  try {
    const osmHits = await osmNominatim.suggest(trimmed, lang);
    if (osmHits.length > 0) {
      return osmHits;
    }
  } catch {
    // Continue to fallback
  }

  // 3. Fall back to Mapy.com if API key is present
  if (hasValidMapyKey()) {
    try {
      const mapyGeocode = new MapyGeocodingProvider({ apiKey: getMapyApiKey() });
      const mapyHits = await mapyGeocode.suggest(trimmed, lang === 'uk' ? 'pl' : lang);
      if (mapyHits.length > 0) {
        return mapyHits;
      }
    } catch {
      // Continue to local filter
    }
  }

  // 4. Local fallback filter for demo locations
  const qLower = trimmed.toLowerCase();
  const matched = DEFAULT_DEMO_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(qLower) ||
      loc.label.toLowerCase().includes(qLower),
  );
  return matched;
}

export async function reverseGeocodeLocation(
  lat: number,
  lon: number,
  lang: 'pl' | 'en' | 'uk' = 'pl',
): Promise<PlaceHit | null> {
  try {
    return await osmNominatim.reverseGeocode(lat, lon, lang);
  } catch {
    return null;
  }
}

