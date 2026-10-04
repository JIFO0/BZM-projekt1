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

export function resolveBackendApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    if (hostname && !hostname.endsWith('.local')) {
      return `http://${hostname}:3000`;
    }
  }
  return 'http://localhost:3000';
}

function resolveGraphHopperUrl(): string {
  if (process.env.EXPO_PUBLIC_GRAPHHOPPER_URL) {
    return process.env.EXPO_PUBLIC_GRAPHHOPPER_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8989';
    }
    if (hostname && !hostname.endsWith('.local')) {
      return `http://${hostname}:8989`;
    }
  }
  return city.graphhopper?.apiBase || 'http://localhost:8989';
}

// Initialize providers
const graphhopperRouting = new GraphHopperRoutingProvider({
  apiBase: resolveGraphHopperUrl(),
});
const osmOverpass = new OsmOverpassProvider({
  endpoint: city.overpass.endpoint,
  userAgent: city.overpass.userAgent,
  stalenessMonths: city.stalenessMonths,
  timeoutMs: 12000,
});
const osmNominatim = new OsmNominatimGeocodingProvider({
  userAgent: city.overpass.userAgent,
});
const osmRouting = new OsmRoutingProvider();


export type RouteVariantId = 'accessible' | 'fastest';

export interface RouteVariant {
  id: RouteVariantId;
  title: string;
  description: string;
  walkingRoute: WalkingRoute;
  report: RouteReport;
  facts: Fact[];
  isSample: boolean;
}

export interface PlanRouteParams {
  start: { name: string; position: LonLat };
  end: { name: string; position: LonLat };
  profileId: ProfileId;
  thresholds?: BarrierThresholds;
  debugState: DebugState;
}

export interface PlanRouteResult {
  walkingRoute: WalkingRoute;
  report: RouteReport;
  facts: Fact[];
  fallbackNotice?: string;
  isSample: boolean;
  variants?: Record<RouteVariantId, RouteVariant>;
  selectedVariant?: RouteVariantId;
}

export async function planAndAnalyzeRoute(params: PlanRouteParams): Promise<PlanRouteResult> {
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
    // 1. Try self-hosted GraphHopper first (barrier-light walk and plain fastest walk)
    try {
      const pair = await graphhopperRouting.routePair({
        start: start.position,
        end: end.position,
        profileId,
        thresholds: params.thresholds,
      });

      const loadFacts = async (coordinates: Array<[number, number]>) => {
        try {
          const bundle: AccessibilityBundle = await osmOverpass.fetchAroundGeometry({
            coordinates,
            corridorMetres: city.corridorMeters,
          });
          return bundle.facts;
        } catch {
          return [] as Fact[];
        }
      };

      const sameLine =
        pair.accessible.coordinates.length === pair.fastest.coordinates.length &&
        pair.accessible.lengthMetres === pair.fastest.lengthMetres;
      const accessibleFacts = await loadFacts(pair.accessible.coordinates);
      const fastestFacts = sameLine ? accessibleFacts : await loadFacts(pair.fastest.coordinates);

      const accessibleReport = analyzeRoute({
        routeId: `route-accessible-${Date.now()}`,
        profileId,
        routeCoordinates: pair.accessible.coordinates,
        facts: accessibleFacts,
        config: city,
        thresholds: params.thresholds,
        isSample: false,
      });
      const fastestReport = analyzeRoute({
        routeId: `route-fastest-${Date.now()}`,
        profileId,
        routeCoordinates: pair.fastest.coordinates,
        facts: fastestFacts,
        config: city,
        thresholds: params.thresholds,
        isSample: false,
      });

      const accessibleHasGap = pair.accessible.surfaceSpans?.some((span) => span.tone === 'other');
      const notice = accessibleFacts.length === 0 && fastestFacts.length === 0
        ? 'Nie udało się pobrać barier z OpenStreetMap. Trasa między wskazanymi punktami została zachowana, ale bez oceny krawężników i nawierzchni.'
        : accessibleHasGap
          ? 'Objazd bez barier wychodzi poza rozsądny dystans, więc trasa bez barier idzie krócej. Pomarańczowe odcinki nie spełniają kryteriów profilu. Najszybsza trasa piesza jest dostępna osobno.'
          : 'Trasa bez barier omija zmapowane przeszkody, o ile objazd mieści się w rozsądnym dystansie. Najszybsza trasa piesza maluje na pomarańczowo odcinki poza kryteriami.';

      const variants: Record<RouteVariantId, RouteVariant> = {
        accessible: {
          id: 'accessible',
          title: 'Bez barier',
          description: 'Trasa z najmniejszą liczbą barier, bez dzikiego objazdu',
          walkingRoute: pair.accessible,
          report: accessibleReport,
          facts: accessibleFacts,
          isSample: false,
        },
        fastest: {
          id: 'fastest',
          title: 'Najszybsza',
          description: 'Najszybsza trasa piesza. Odcinki poza kryteriami są pomarańczowe.',
          walkingRoute: pair.fastest,
          report: fastestReport,
          facts: fastestFacts,
          isSample: false,
        },
      };

      return {
        walkingRoute: variants.accessible.walkingRoute,
        report: variants.accessible.report,
        facts: variants.accessible.facts,
        fallbackNotice: notice,
        isSample: false,
        variants,
        selectedVariant: 'accessible',
      };
    } catch {
      // GraphHopper unavailable or point out of sample bounds
    }

    let routed = false;

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
      facts = [];
      fallbackNotice =
        (fallbackNotice ? `${fallbackNotice} • ` : '') +
        'Nie udało się pobrać barier z OpenStreetMap. Trasa między wskazanymi punktami została zachowana, ale bez oceny krawężników i nawierzchni.';
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

  // Demo variants stay on the Rynek–Wawel snapshot. Any other A–B keeps the route
  // that was just calculated for those coordinates.
  let variants: Record<RouteVariantId, RouteVariant> | undefined;
  const sampleShortest = DEMO_SNAPSHOT.routes[0]!;
  const sampleAccessible =
    DEMO_SNAPSHOT.routes.find((r) => r.id === 'sample-route-rynek-wawel-accessible') ??
    DEMO_SNAPSHOT.routes[1]!;

  if (isSample) {
    const shortestReport = analyzeRoute({
      routeId: `route-shortest-${Date.now()}`,
      profileId,
      routeCoordinates: sampleShortest.walkingRoute.coordinates,
      facts: sampleShortest.facts,
      config: city,
      thresholds: params.thresholds,
      isSample: true,
    });

    const accessibleReport = analyzeRoute({
      routeId: `route-accessible-${Date.now()}`,
      profileId,
      routeCoordinates: sampleAccessible.walkingRoute.coordinates,
      facts: sampleAccessible.facts,
      config: city,
      thresholds: params.thresholds,
      isSample: true,
    });

    variants = {
      accessible: {
        id: 'accessible',
        title: 'Bez barier (Planty)',
        description: 'Trasa bez schodów i wysokich krawężników przez Park Planty',
        walkingRoute: sampleAccessible.walkingRoute,
        report: accessibleReport,
        facts: sampleAccessible.facts,
        isSample: true,
      },
      fastest: {
        id: 'fastest',
        title: 'Najkrótsza (ul. Grodzka)',
        description: 'Najszybszy pieszy wariant demonstracyjny (920 m), zawiera zabytkowy bruk i schody',
        walkingRoute: sampleShortest.walkingRoute,
        report: shortestReport,
        facts: sampleShortest.facts,
        isSample: true,
      },
    };

    return {
      walkingRoute: variants.accessible.walkingRoute,
      report: variants.accessible.report,
      facts: variants.accessible.facts,
      fallbackNotice,
      isSample: true,
      variants,
      selectedVariant: 'accessible',
    };
  }

  return {
    walkingRoute,
    report,
    facts,
    fallbackNotice,
    isSample,
    selectedVariant: 'accessible',
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
  const normQuery = placeName.trim().toLowerCase();
  const sampleMatch = DEMO_SNAPSHOT.places.find((p) => {
    const pName = p.name.toLowerCase();
    const pLabel = (p.label ?? '').toLowerCase();
    return (
      pName.includes(normQuery) ||
      normQuery.includes(pName) ||
      pLabel.includes(normQuery) ||
      (Math.abs(p.position.lat - position.lat) < 0.0015 &&
        Math.abs(p.position.lon - position.lon) < 0.0015)
    );
  });

  const mustUseFallback = debugState.simulateOverpassDown || debugState.simulateOffline;

  if (mustUseFallback || (sampleMatch && sampleMatch.name.includes('KSDK'))) {
    const placeToUse = sampleMatch ?? DEMO_SNAPSHOT.places[0]!;
    const isKsdk =
      placeToUse.name.includes('KSDK') ||
      placeToUse.facts.some((f) => f.source.licence === 'Informacja Publiczna');
    const report = analyzePlace(
      placeToUse.name,
      placeToUse.position,
      placeToUse.facts,
      city.placeMatchMaxMetres,
      true,
    );
    return {
      report,
      fallbackNotice: isKsdk
        ? 'Oficjalna deklaracja dostępności KSDK (BIP Miasta Krakowa / Ustawa o zapewnianiu dostępności).'
        : `Symulacja: Wyświetlono obiekt ze snapshotu demonstracyjnego (${placeToUse.name}).`,
      isSample: true,
    };
  }

  try {
    const bundle = await osmOverpass.fetchPlace({
      name: placeName,
      position,
      maxDistanceMetres: city.placeMatchMaxMetres,
    });

    const factsToUse = bundle.facts.length > 0 ? bundle.facts : (sampleMatch?.facts ?? []);
    const report = analyzePlace(
      placeName,
      position,
      factsToUse,
      city.placeMatchMaxMetres,
      bundle.facts.length === 0,
    );

    return {
      report,
      fallbackNotice:
        sampleMatch && sampleMatch.name.includes('KSDK')
          ? 'Oficjalna deklaracja dostępności KSDK (BIP Miasta Krakowa).'
          : undefined,
      isSample: bundle.facts.length === 0,
    };
  } catch {
    const placeToUse = sampleMatch ?? DEMO_SNAPSHOT.places[0]!;
    const isKsdk = placeToUse.name.includes('KSDK');
    const report = analyzePlace(
      placeToUse.name,
      placeToUse.position,
      placeToUse.facts,
      city.placeMatchMaxMetres,
      true,
    );
    return {
      report,
      fallbackNotice: isKsdk
        ? 'Oficjalna deklaracja dostępności KSDK (BIP Miasta Krakowa / Muzeum Krakowa).'
        : 'Błąd połączenia z OpenStreetMap. Wyświetlono obiekt z lokalnego snapshotu demo.',
      isSample: true,
    };
  }
}

export const DEFAULT_PRESET_PLACES: PlaceHit[] = [
  // 🏛️ KULTURA I KSDK
  {
    id: 'ksdk-krzysztofory',
    name: 'Pałac Krzysztofory (KSDK)',
    label: 'Rynek Główny 35, Kraków • Muzeum Krakowa (Główna siedziba, winda, pętla)',
    position: { lon: 19.937, lat: 50.062 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Winda', '⚡ Pętla indukcyjna', '🚻 Toaleta PRM', '🛡️ KSDK'],
  },
  {
    id: 'ksdk-wieza',
    name: 'Wieża Ratuszowa (KSDK)',
    label: 'Rynek Główny 1, Kraków • 110 stromych schodów kamiennych, brak windy',
    position: { lon: 19.9368, lat: 50.0615 },
    kind: 'poi',
    category: 'culture',
    tags: ['⚠️ Schody 110 st.', '❌ Brak windy', '🛡️ KSDK'],
  },
  {
    id: 'ksdk-barbakan',
    name: 'Barbakan (KSDK)',
    label: 'ul. Basztowa / Planty, Kraków • Bruk dziedzińca, pochylnia wejściowa',
    position: { lon: 19.9417, lat: 50.0655 },
    kind: 'poi',
    category: 'culture',
    tags: ['🪵 Pochylnia', '⚠️ Zabytkowy bruk', '🛡️ KSDK'],
  },
  {
    id: 'ksdk-synagoga',
    name: 'Stara Synagoga (KSDK)',
    label: 'ul. Szeroka 24, Kraków (Kazimierz) • Schody przy wejściu',
    position: { lon: 19.9485, lat: 50.0506 },
    kind: 'poi',
    category: 'culture',
    tags: ['⚠️ Schody wejściowe', '❌ Brak windy', '🛡️ KSDK'],
  },
  {
    id: 'ksdk-podgorze',
    name: 'Muzeum Podgórza (KSDK)',
    label: 'ul. Limanowskiego 51, Kraków • Bez barier, winda 1.58x2.10m, pętla',
    position: { lon: 19.9547, lat: 50.0441 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Wejście płaskie', '🛗 Winda 1.58x2.1m', '🚻 Toaleta PRM', '🛡️ KSDK'],
  },
  {
    id: 'sug-1',
    name: 'Sukiennice (Galeria Sztuki)',
    label: 'Rynek Główny 1/3, Kraków • Winda, toaleta przystosowana',
    position: { lon: 19.9373, lat: 50.0619 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Wejście bezprogowe', '🛗 Winda', '🚻 Toaleta PRM'],
  },
  {
    id: 'place-mocak',
    name: 'MOCAK Muzeum Sztuki Współczesnej (KSDK)',
    label: 'ul. Lipowa 4, Kraków (Zabłocie) • 100% dostępne, windy, toalety PRM',
    position: { lon: 19.9612, lat: 50.0475 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Bez barier', '🛗 2 windy', '🚻 Toalety PRM', '🛡️ KSDK'],
  },
  {
    id: 'place-mnk',
    name: 'MNK Gmach Główny (Muzeum Narodowe)',
    label: 'al. 3 Maja 1, Kraków • Rampa od Błoń, windy panoramiczne',
    position: { lon: 19.9248, lat: 50.0598 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Pochylnia wejściowa', '🛗 Windy', '🚻 Toaleta PRM'],
  },
  {
    id: 'place-cricoteka',
    name: 'Cricoteka (Ośrodek Sztuki T. Kantora)',
    label: 'ul. Nadwiślańska 2-4, Kraków (Podgórze) • Bezstopniowe wejście, windy',
    position: { lon: 19.9532, lat: 50.0463 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Wejście z bulwarów', '🛗 Windy przeszklone', '🛡️ KSDK'],
  },
  {
    id: 'place-slowacki',
    name: 'Teatr im. Juliusza Słowackiego (KSDK)',
    label: 'pl. Świętego Ducha 1, Kraków • Podjazd od Plant, platforma',
    position: { lon: 19.9431, lat: 50.0635 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Wejście boczne z rampą', '⚡ Pętla indukcyjna', '🛡️ KSDK'],
  },
  {
    id: 'place-nck',
    name: 'Nowohuckie Centrum Kultury (NCK)',
    label: 'al. Jana Pawła II 232, Kraków • Płaski parking, wejście bezprogowe',
    position: { lon: 20.0368, lat: 50.0712 },
    kind: 'poi',
    category: 'culture',
    tags: ['♿ Wejście z placu', '🛗 Winda', '🚻 Toalety PRM', '🛡️ KSDK'],
  },

  // 🏢 URZĘDY MIASTA KRAKOWA (UMK)
  {
    id: 'umk-glowny',
    name: 'Urząd Miasta Krakowa - Siedziba Główna',
    label: 'pl. Wszystkich Świętych 3-4, Kraków • Podjazd, winda z brajlem, PJM',
    position: { lon: 19.9383, lat: 50.0592 },
    kind: 'office',
    category: 'office',
    tags: ['♿ Wejście z podjazdem', '🛗 Winda Braille', '🤟 Tłumacz PJM', '⚡ Pętla'],
  },
  {
    id: 'umk-powstania',
    name: 'UMK Wydział Spraw Administracyjnych',
    label: 'al. Powstania Warszawskiego 10, Kraków • Pełna dostępność, drzwi foto',
    position: { lon: 19.9615, lat: 50.0595 },
    kind: 'office',
    category: 'office',
    tags: ['♿ Bez barier', '🛗 Windy', '🔊 Kolejkomat audio', '⚡ Pętla'],
  },
  {
    id: 'umk-wielicka',
    name: 'UMK Wydział Architektury i Urbanistyki',
    label: 'ul. Wielicka 28a, Kraków • Szeroka rampa 5%, 2 windy',
    position: { lon: 19.9644, lat: 50.0381 },
    kind: 'office',
    category: 'office',
    tags: ['♿ Rampa 5%', '🛗 2 windy', '🅿️ Miejsca PRM', '🚻 Toaleta PRM'],
  },
  {
    id: 'umk-zgody',
    name: 'UMK Obsługa Mieszkańców (Nowa Huta)',
    label: 'os. Zgody 2, Kraków • Wejście w poziomie chodnika, obniżone lady',
    position: { lon: 20.0382, lat: 50.0735 },
    kind: 'office',
    category: 'office',
    tags: ['♿ Poziom chodnika', '🪑 Obniżone lady', '🚻 Toaleta PRM'],
  },
  {
    id: 'usc-grunwaldzka',
    name: 'Urząd Stanu Cywilnego w Krakowie',
    label: 'ul. Grunwaldzka 8, Kraków • Rampa zewnętrzna, winda osobowa',
    position: { lon: 19.9658, lat: 50.0638 },
    kind: 'office',
    category: 'office',
    tags: ['♿ Zewnętrzna rampa', '🛗 Winda', '💍 Sala ślubów parter'],
  },

  // 🚆 DWORCE I WĘZŁY PRZESIADKOWE
  {
    id: 'dworzec-pkp',
    name: 'Dworzec Główny PKP Kraków',
    label: 'pl. Jana Nowaka-Jeziorańskiego 3, Kraków • Windy na perony 1-5, asysta PRM',
    position: { lon: 19.9482, lat: 50.0664 },
    kind: 'transit',
    category: 'transit',
    tags: ['♿ Pełna dostępność', '🛗 Windy peronowe 1-5', '🦯 Ścieżki dotykowe', '🤝 Asysta PKP'],
  },
  {
    id: 'stacja-plaszow',
    name: 'Stacja Kolejowa Kraków Płaszów',
    label: 'pl. Braci Dudzińskich 1, Kraków • Windy z tunelu na perony, zadaszona rampa',
    position: { lon: 19.9772, lat: 50.0348 },
    kind: 'transit',
    category: 'transit',
    tags: ['♿ Windy na perony', '🦯 Ścieżki uwagi', '☂️ Zadaszona rampa'],
  },
  {
    id: 'mda-bosacka',
    name: 'MDA Dworzec Autobusowy Kraków',
    label: 'ul. Bosacka 18, Kraków • Windy łączące płytę górną i dolną, kasy PRM',
    position: { lon: 19.9497, lat: 50.0683 },
    kind: 'transit',
    category: 'transit',
    tags: ['♿ Windy płyty górna/dolna', '🎫 Kasy PRM', '🚻 Toalety bez barier'],
  },
  {
    id: 'rondo-mogilskie',
    name: 'Węzeł Przesiadkowy Rondo Mogilskie',
    label: 'Rondo Mogilskie, Kraków • 4 windy na poziom tramwajów -1, pochylnie',
    position: { lon: 19.9602, lat: 50.0652 },
    kind: 'transit',
    category: 'transit',
    tags: ['🛗 4 windy', '♿ Pochylnie zjazdowe', '🚊 Tramwaj poziom -1'],
  },

  // 🏥 SZPITALE I OCHRONA ZDROWIA
  {
    id: 'szpital-narutowicz',
    name: 'Szpital Specjalistyczny im. G. Narutowicza',
    label: 'ul. Prądnicka 35, Kraków • Podjazd dla wózków, windy łóżkowe i osobowe',
    position: { lon: 19.9372, lat: 50.0825 },
    kind: 'health',
    category: 'health',
    tags: ['♿ Podjazd SOR', '🛗 Windy łóżkowe/osobowe', '🚻 Toaleta PRM'],
  },
  {
    id: 'szpital-uniwersytecki',
    name: 'Szpital Uniwersytecki (Nowy Prokocim)',
    label: 'ul. Jakubowskiego 2, Kraków • Najnowocześniejszy kampus 100% bez barier',
    position: { lon: 20.0076, lat: 50.0094 },
    kind: 'health',
    category: 'health',
    tags: ['♿ 100% bez barier', '🛗 Windy audio-synteza', '🦯 Ścieżki dotykowe'],
  },
  {
    id: 'szpital-zeromski',
    name: 'Szpital Specjalistyczny im. S. Żeromskiego',
    label: 'os. Na Skarpie 66, Kraków (Nowa Huta) • Pochylnie wejściowe, windy',
    position: { lon: 20.0452, lat: 50.0691 },
    kind: 'health',
    category: 'health',
    tags: ['♿ Pochylnie wejściowe', '🛗 Windy pawilonów', '🅿️ Parking PRM'],
  },

  // 🎓 UCZELNIE I EDUKACJA
  {
    id: 'uj-novum',
    name: 'UJ - Collegium Novum',
    label: 'ul. Gołębia 24, Kraków • Rampa od dziedzińca, przeszklona winda',
    position: { lon: 19.9328, lat: 50.0602 },
    kind: 'education',
    category: 'education',
    tags: ['♿ Wejście od dziedzińca', '🛗 Winda', '🏛️ Aula Główna'],
  },
  {
    id: 'agh-a0',
    name: 'AGH Budynek Główny A-0',
    label: 'al. Mickiewicza 30, Kraków • Winda panoramiczna, rampa dostępowa',
    position: { lon: 19.9192, lat: 50.0656 },
    kind: 'education',
    category: 'education',
    tags: ['♿ Rampa z tyłu', '🛗 Winda panoramiczna', '🚻 Toaleta PRM'],
  },
  {
    id: 'pk-wil',
    name: 'Politechnika Krakowska (Kampus Warszawska)',
    label: 'ul. Warszawska 24, Kraków • Pochylnia dziedzińca, platforma schodowa',
    position: { lon: 19.9458, lat: 50.0718 },
    kind: 'education',
    category: 'education',
    tags: ['♿ Pochylnia wejściowa', '🛗 Platforma przyschodowa'],
  },

  // 🏟️ SPORT I REKREACJA
  {
    id: 'tauron-arena',
    name: 'TAURON Arena Kraków',
    label: 'ul. Stanisława Lema 7, Kraków • Sektory dla wózków, 8 wind wielkogabarytowych',
    position: { lon: 19.9845, lat: 50.0682 },
    kind: 'sport',
    category: 'sport',
    tags: ['♿ Sektory wózkowe', '🛗 8 wind', '🅿️ Parking PRM', '🚻 Toalety PRM'],
  },
  {
    id: 'cracovia-sport',
    name: 'Centrum Sportu Niepełnosprawnych (Cracovia)',
    label: 'al. Marszałka Ferdinanda Focha 40, Kraków • Wzorcowy obiekt bez barier',
    position: { lon: 19.9075, lat: 50.0578 },
    kind: 'sport',
    category: 'sport',
    tags: ['♿ Referencyjny bez barier', '⚡ Pętla indukcyjna', '🚻 Pełna dostępność', '🛡️ KSDK'],
  },
];

export const DEFAULT_DEMO_LOCATIONS: PlaceHit[] = DEFAULT_PRESET_PLACES;

export async function suggestPlaces(
  query: string,
  lang: 'pl' | 'en' | 'uk' = 'pl',
): Promise<PlaceHit[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return DEFAULT_PRESET_PLACES;
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

  // 4. Local fallback filter for preset places
  const qLower = trimmed.toLowerCase();
  const matched = DEFAULT_PRESET_PLACES.filter(
    (loc) =>
      loc.name.toLowerCase().includes(qLower) ||
      loc.label.toLowerCase().includes(qLower) ||
      (loc.tags && loc.tags.some((t) => t.toLowerCase().includes(qLower))),
  );
  return matched;
}

export async function reverseGeocodeLocation(
  lat: number,
  lon: number,
  lang: 'pl' | 'en' | 'uk' = 'pl',
): Promise<PlaceHit | null> {
  try {
    const res = await osmNominatim.reverseGeocode(lat, lon, lang);
    if (res) return res;
  } catch {
    // Continue to fallback
  }

  // Find nearest preset place if within 150 metres
  let closest: PlaceHit | null = null;
  let minD = Infinity;
  for (const p of DEFAULT_PRESET_PLACES) {
    const d = Math.hypot(p.position.lat - lat, p.position.lon - lon);
    if (d < minD) {
      minD = d;
      closest = p;
    }
  }

  // 0.0015 degrees is approx 120-150m
  if (closest && minD < 0.0015) {
    return {
      ...closest,
      id: `picked-${closest.id}`,
      name: closest.name,
      label: `W pobliżu: ${closest.name}`,
      position: { lat, lon },
    };
  }

  return {
    id: `picked-${lat.toFixed(5)}-${lon.toFixed(5)}`,
    name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    label: `Punkt na mapie (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    position: { lat, lon },
    kind: 'coordinate',
  };
}

export interface ServerHazardValidation {
  id: string;
  voterKey: string;
  action: 'still_here' | 'fixed';
  photoUrl?: string;
  comment?: string;
  createdAt: string;
}

export interface ServerRouteHazard {
  id: string;
  description: string;
  status: 'reported' | 'confirmed' | 'resolved';
  createdAt: string;
  updatedAt: string;
  email?: string;
  position?: { lat: number; lon: number };
  category?: 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
  photoUrl?: string;
  validations?: ServerHazardValidation[];
  stillHereCount: number;
  fixedCount: number;
}

export interface ServerPlaceComment {
  id: string;
  placeId: string;
  placeName: string;
  position: { lat: number; lon: number };
  sentiment: 'positive' | 'negative';
  comment: string;
  category?: 'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general';
  photoUrl?: string;
  email?: string;
  createdAt: string;
}

export async function uploadPhotoToServer(
  uriOrBase64: string,
  filename = 'photo.jpg'
): Promise<string> {
  const apiBase = resolveBackendApiUrl();
  let payload: any;

  if (
    uriOrBase64.startsWith('data:') ||
    (!uriOrBase64.startsWith('http') && !uriOrBase64.startsWith('file:') && !uriOrBase64.startsWith('/') && !uriOrBase64.startsWith('blob:'))
  ) {
    payload = {
      image: uriOrBase64.startsWith('data:') ? uriOrBase64 : `data:image/jpeg;base64,${uriOrBase64}`,
      filename,
    };
  } else {
    // If it's a file URI or blob URI
    try {
      const response = await fetch(uriOrBase64);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      payload = { image: base64Data, filename };
    } catch {
      payload = { image: uriOrBase64, filename };
    }
  }

  const res = await fetch(`${apiBase}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  const relativeOrFullUrl: string = data.url;
  if (relativeOrFullUrl.startsWith('http')) {
    return relativeOrFullUrl;
  }
  return `${apiBase}${relativeOrFullUrl}`;
}

export async function fetchServerHazards(): Promise<ServerRouteHazard[]> {
  const apiBase = resolveBackendApiUrl();
  try {
    const res = await fetch(`${apiBase}/api/hazards`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).map((h: ServerRouteHazard) => ({
        ...h,
        photoUrl: h.photoUrl?.startsWith('/uploads') ? `${apiBase}${h.photoUrl}` : h.photoUrl,
        validations: (h.validations || []).map((v) => ({
          ...v,
          photoUrl: v.photoUrl?.startsWith('/uploads') ? `${apiBase}${v.photoUrl}` : v.photoUrl,
        })),
      }));
    }
  } catch {
    // fallback to empty
  }
  return [];
}

export async function fetchRandomServerHazard(): Promise<ServerRouteHazard | null> {
  const apiBase = resolveBackendApiUrl();
  try {
    const res = await fetch(`${apiBase}/api/hazards/random`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const h: ServerRouteHazard = await res.json();
      return {
        ...h,
        photoUrl: h.photoUrl?.startsWith('/uploads') ? `${apiBase}${h.photoUrl}` : h.photoUrl,
        validations: (h.validations || []).map((v) => ({
          ...v,
          photoUrl: v.photoUrl?.startsWith('/uploads') ? `${apiBase}${v.photoUrl}` : v.photoUrl,
        })),
      };
    }
  } catch {
    // fallback
  }
  return null;
}

export async function createServerHazard(data: {
  description: string;
  category?: 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
  email?: string;
  photoUrl?: string;
  position?: { lat: number; lon: number };
}): Promise<ServerRouteHazard> {
  const apiBase = resolveBackendApiUrl();
  const email = data.email || 'anonim@krakow.pl';
  const res = await fetch(`${apiBase}/api/hazards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: data.description,
      category: data.category || 'obstacle',
      email,
      photoUrl: data.photoUrl,
      position: data.position,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create hazard: HTTP ${res.status}`);
  }
  const created: ServerRouteHazard = await res.json();
  return {
    ...created,
    photoUrl: created.photoUrl?.startsWith('/uploads') ? `${apiBase}${created.photoUrl}` : created.photoUrl,
  };
}

export async function verifyServerHazard(
  hazardId: string,
  data: {
    action: 'still_here' | 'fixed';
    email?: string;
    photoUrl?: string;
    comment?: string;
  }
): Promise<any> {
  const apiBase = resolveBackendApiUrl();
  const email = data.email || 'weryfikator@krakow.pl';
  const res = await fetch(`${apiBase}/api/hazards/${hazardId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: data.action,
      email,
      photoUrl: data.photoUrl,
      comment: data.comment,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Verification failed: HTTP ${res.status}`);
  }
  const result = await res.json();
  return {
    ...result,
    photoUrl: result.photoUrl?.startsWith('/uploads') ? `${apiBase}${result.photoUrl}` : result.photoUrl,
    validations: (result.validations || []).map((v: any) => ({
      ...v,
      photoUrl: v.photoUrl?.startsWith('/uploads') ? `${apiBase}${v.photoUrl}` : v.photoUrl,
    })),
  };
}

export async function fetchPlaceServerComments(placeId: string): Promise<ServerPlaceComment[]> {
  const apiBase = resolveBackendApiUrl();
  try {
    const res = await fetch(`${apiBase}/api/places/${encodeURIComponent(placeId)}/comments`);
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).map((c: ServerPlaceComment) => ({
        ...c,
        photoUrl: c.photoUrl?.startsWith('/uploads') ? `${apiBase}${c.photoUrl}` : c.photoUrl,
      }));
    }
  } catch {
    // fallback
  }
  return [];
}

export async function addPlaceServerComment(
  placeId: string,
  data: {
    sentiment: 'positive' | 'negative';
    comment: string;
    category?: 'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general';
    email?: string;
    photoUrl?: string;
  }
): Promise<ServerPlaceComment> {
  const apiBase = resolveBackendApiUrl();
  const email = data.email || 'anonim@krakow.pl';
  const res = await fetch(`${apiBase}/api/places/${encodeURIComponent(placeId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sentiment: data.sentiment,
      comment: data.comment,
      category: data.category || 'general',
      email,
      photoUrl: data.photoUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to submit place comment: HTTP ${res.status}`);
  }
  const created: ServerPlaceComment = await res.json();
  return {
    ...created,
    photoUrl: created.photoUrl?.startsWith('/uploads') ? `${apiBase}${created.photoUrl}` : created.photoUrl,
  };
}
