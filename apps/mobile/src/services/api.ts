import { city } from '@/config/city';
import type { DebugState } from '@/state/session';
import {
  analyzePlace,
  analyzeRoute,
  DEMO_SNAPSHOT,
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
  OsmOverpassProvider,
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
  apiBase:
    process.env.EXPO_PUBLIC_GRAPHHOPPER_URL ||
    city.graphhopper?.apiBase ||
    'http://hopper.accessible.krakow.local',
});
const osmOverpass = new OsmOverpassProvider({
  endpoint: city.overpass.endpoint,
  userAgent: city.overpass.userAgent,
  stalenessMonths: city.stalenessMonths,
  timeoutMs: 4000,
});

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
        // Fall back to sample below
      }
    }

    // 3. Graceful fallback on API error (R12)
    if (!routed) {
      const sampleRoute = DEMO_SNAPSHOT.routes[0]!;
      walkingRoute = sampleRoute.walkingRoute;
      isSample = true;
      fallbackNotice = debugState.simulateMapyDown
        ? 'Symulacja awarii Mapy.com API (HTTP 429). Załadowano trasę z lokalnego snapshotu demo.'
        : 'Zewnętrzny routing niedostępny. Załadowano trasę zapasową z pamięci urządzenia.';
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

export async function suggestPlaces(query: string, lang: 'pl' | 'en'): Promise<PlaceHit[]> {
  if (!query.trim() || !hasValidMapyKey()) {
    // Default demo locations
    return [
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
    ];
  }

  try {
    const mapyGeocode = new MapyGeocodingProvider({ apiKey: getMapyApiKey() });
    return await mapyGeocode.suggest(query, lang);
  } catch {
    return [];
  }
}
