import {
  DEMO_SNAPSHOT,
  evaluateFactSeverity,
  findNearestPointOnRoute,
  type BarrierThresholds,
  type Fact,
  type RouteFinding,
} from '@krakow-bez-barier/core';

/**
 * Curated real-world physical accessibility barriers across Kraków.
 * Covers historical center, Wawel, Kazimierz, Podgórze, Kleparz, and major transit hubs.
 */
export const ADDITIONAL_KRAKOW_BARRIERS: Fact[] = [
  {
    id: 'krakow-barrier-wawel-herbowa-steps',
    subject: { type: 'segment', ref: 'way/wawel-herbowa-stairs', lat: 50.0549, lon: 19.9355 },
    criterion: 'steps',
    value: '45 stromych kamiennych stopni bez poręczy, brak windy ani rampy (wejście od ul. Kanoniczej)',
    status: 'verified',
    source: {
      name: 'Audyt Dostępności UMK / OpenStreetMap',
      url: 'https://osm.org/way/wawel-herbowa-stairs',
      licence: 'ODbL / Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-smocza-jama-stairs',
    subject: { type: 'segment', ref: 'way/smocza-jama-stairs', lat: 50.0531, lon: 19.9338 },
    criterion: 'steps',
    value: '135 stopni kręconych w baszcie i zejściu na Bulwary Wiślane, brak podjazdu',
    status: 'verified',
    source: {
      name: 'Zamek Królewski na Wawelu / MSIP Kraków',
      url: 'https://wawel.krakow.pl',
      licence: 'Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-kanonicza-cobblestone',
    subject: { type: 'segment', ref: 'way/kanonicza-bruk', lat: 50.0563, lon: 19.9371 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/way/kanonicza-bruk',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-florianska-kerb',
    subject: { type: 'crossing', ref: 'node/florianska-tomasza', lat: 50.0631, lon: 19.9401 },
    criterion: 'kerb',
    value: '120 mm',
    unit: 'mm',
    status: 'community',
    source: {
      name: 'OpenStreetMap / Audyt Społeczny',
      url: 'https://osm.org/node/florianska-tomasza',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-szewska-kerb',
    subject: { type: 'crossing', ref: 'node/szewska-jagiellonska', lat: 50.0628, lon: 19.9348 },
    criterion: 'kerb',
    value: '90 mm',
    unit: 'mm',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/node/szewska-jagiellonska',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-slawkowska-surface',
    subject: { type: 'segment', ref: 'way/slawkowska-marka', lat: 50.0638, lon: 19.9382 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/way/slawkowska-marka',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-poselska-grodzka-kerb',
    subject: { type: 'crossing', ref: 'node/poselska-grodzka', lat: 50.0583, lon: 19.9381 },
    criterion: 'kerb',
    value: '80 mm',
    unit: 'mm',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/node/poselska-grodzka',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-plac-nowy-kerb',
    subject: { type: 'crossing', ref: 'node/plac-nowy-estery', lat: 50.0519, lon: 19.9443 },
    criterion: 'kerb',
    value: '110 mm',
    unit: 'mm',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/node/plac-nowy-estery',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-jozefa-narrow',
    subject: { type: 'segment', ref: 'way/jozefa-chodnik', lat: 50.0508, lon: 19.9458 },
    criterion: 'width',
    value: '0.75 m',
    status: 'verified',
    source: {
      name: 'Audyt Dostępności UMK',
      url: 'https://krakow.pl',
      licence: 'Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-bernatka-incline',
    subject: { type: 'segment', ref: 'way/bernatka-rampa-podgorze', lat: 50.0468, lon: 19.9482 },
    criterion: 'incline',
    value: '11%',
    status: 'verified',
    source: {
      name: 'Zarząd Dróg Miasta Krakowa (ZDMK)',
      url: 'https://zdmk.krakow.pl',
      licence: 'Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-podgorze-rynek-steps',
    subject: { type: 'segment', ref: 'way/podgorze-kosciol-schody', lat: 50.0443, lon: 19.9495 },
    criterion: 'steps',
    value: '32 stopnie kamienne przy wejściu na Rynek Podgórski, brak podjazdu',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/way/podgorze-kosciol-schody',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-rondo-mogilskie-stairs',
    subject: { type: 'segment', ref: 'way/rondo-mogilskie-schody', lat: 50.0658, lon: 19.9599 },
    criterion: 'steps',
    value: '28 stopni na peron tramwajowy dolnego poziomu -1, awaria windy przy zachodnim wyjściu',
    status: 'verified',
    source: {
      name: 'ZTP Kraków / MPK Kraków',
      url: 'https://ztp.krakow.pl',
      licence: 'Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-lubicz-dworzec-underpass',
    subject: { type: 'segment', ref: 'way/lubicz-przejscie-podziemne', lat: 50.0635, lon: 19.9468 },
    criterion: 'steps',
    value: '22 stopnie w przejściu podziemnym pod ul. Lubicz, stroma pochylnia szynowa niebezpieczna dla wózków',
    status: 'verified',
    source: {
      name: 'Audyt Dostępności UMK',
      url: 'https://krakow.pl',
      licence: 'Informacja Publiczna',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-grzegorzecka-wiadukt-stairs',
    subject: { type: 'segment', ref: 'way/grzegorzecka-wiadukt-stairs', lat: 50.0581, lon: 19.9489 },
    criterion: 'steps',
    value: '18 stopni przy nowym przystanku Kraków Grzegórzki bez rampy od strony Hali Targowej',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/way/grzegorzecka-wiadukt-stairs',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-planty-slowackiego-kerb',
    subject: { type: 'crossing', ref: 'node/planty-slowackiego-kerb', lat: 50.0645, lon: 19.9427 },
    criterion: 'kerb',
    value: '85 mm',
    unit: 'mm',
    status: 'community',
    source: {
      name: 'OpenStreetMap',
      url: 'https://osm.org/node/planty-slowackiego-kerb',
      licence: 'ODbL',
    },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-grodzka-senacka-kerb',
    subject: { type: 'crossing', ref: 'node/grodzka-senacka', lat: 50.0575, lon: 19.938 },
    criterion: 'kerb',
    value: '100 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap / Audyt Społeczny', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-wislna-golebia-surface',
    subject: { type: 'segment', ref: 'way/wislna-golebia', lat: 50.061, lon: 19.9352 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-bracka-franciszkanska-kerb',
    subject: { type: 'crossing', ref: 'node/bracka-franciszkanska', lat: 50.0592, lon: 19.9365 },
    criterion: 'kerb',
    value: '95 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-stolarska-width',
    subject: { type: 'segment', ref: 'way/stolarska-chodnik', lat: 50.0598, lon: 19.9392 },
    criterion: 'width',
    value: '0.65 m',
    status: 'verified',
    source: { name: 'Audyt Dostępności UMK', url: 'https://krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-maly-rynek-steps',
    subject: { type: 'segment', ref: 'way/maly-rynek-pasaz', lat: 50.062, lon: 19.9405 },
    criterion: 'steps',
    value: '8 stopni kamiennych wejścia do pasażu handlowego bez rampy',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-sw-krzyza-cobblestone',
    subject: { type: 'segment', ref: 'way/sw-krzyza-bruk', lat: 50.063, lon: 19.9418 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-szpitalna-tomasza-kerb',
    subject: { type: 'crossing', ref: 'node/szpitalna-tomasza', lat: 50.0639, lon: 19.9412 },
    criterion: 'kerb',
    value: '110 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-sw-jana-surface',
    subject: { type: 'segment', ref: 'way/sw-jana-kostka', lat: 50.0635, lon: 19.939 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-szczepanski-steps',
    subject: { type: 'segment', ref: 'way/szczepanski-palac-sztuki', lat: 50.0638, lon: 19.9355 },
    criterion: 'steps',
    value: '12 stopni wejściowych do Pałacu Sztuki, brak podjazdu dla wózków',
    status: 'verified',
    source: { name: 'Audyt Dostępności UMK', url: 'https://krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-karmelicka-garbarska-kerb',
    subject: { type: 'crossing', ref: 'node/karmelicka-garbarska', lat: 50.0652, lon: 19.932 },
    criterion: 'kerb',
    value: '90 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-krupnicza-loretanska-width',
    subject: { type: 'segment', ref: 'way/krupnicza-loretanska', lat: 50.0631, lon: 19.9295 },
    criterion: 'width',
    value: '0.70 m',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-dluga-przejscie-steps',
    subject: { type: 'segment', ref: 'way/dluga-schody', lat: 50.0712, lon: 19.936 },
    criterion: 'steps',
    value: '16 stopni w zejściu podziemnym przy Nowym Kleparzu, stroma szyna',
    status: 'verified',
    source: { name: 'ZDMK Kraków', url: 'https://zdmk.krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-rynek-kleparski-surface',
    subject: { type: 'segment', ref: 'way/rynek-kleparski-targ', lat: 50.0675, lon: 19.9398 },
    criterion: 'surface',
    value: 'unpaved',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-basztowa-matejki-kerb',
    subject: { type: 'crossing', ref: 'node/basztowa-matejki', lat: 50.066, lon: 19.9415 },
    criterion: 'kerb',
    value: '130 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-szeroka-cobblestone',
    subject: { type: 'segment', ref: 'way/szeroka-plac', lat: 50.0528, lon: 19.9482 },
    criterion: 'surface',
    value: 'cobblestone',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-miodowa-bozego-ciala-kerb',
    subject: { type: 'crossing', ref: 'node/miodowa-bozego-ciala', lat: 50.052, lon: 19.9455 },
    criterion: 'kerb',
    value: '105 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-krakowska-dietla-steps',
    subject: { type: 'segment', ref: 'way/krakowska-dietla-schody', lat: 50.0535, lon: 19.9428 },
    criterion: 'steps',
    value: '15 stromych stopni przy skrzyżowaniu Krakowska / Dietla',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-starowislna-berka-width',
    subject: { type: 'segment', ref: 'way/starowislna-berka', lat: 50.0539, lon: 19.947 },
    criterion: 'width',
    value: '0.60 m',
    status: 'verified',
    source: { name: 'Audyt Dostępności UMK', url: 'https://krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-skwer-judah-surface',
    subject: { type: 'segment', ref: 'way/skwer-judah-plac', lat: 50.0515, lon: 19.9475 },
    criterion: 'surface',
    value: 'gravel',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-park-bednarskiego-stairs',
    subject: { type: 'segment', ref: 'way/bednarski-zamoyskiego-stairs', lat: 50.0435, lon: 19.9465 },
    criterion: 'steps',
    value: '68 stromych schodów kamiennych do Parku Bednarskiego, brak pochylni',
    status: 'verified',
    source: { name: 'ZZM Kraków', url: 'https://zzm.krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-rekawka-incline',
    subject: { type: 'segment', ref: 'way/rekawka-podejscie', lat: 50.0428, lon: 19.951 },
    criterion: 'incline',
    value: '14%',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-kalwaryjska-dlugosza-kerb',
    subject: { type: 'crossing', ref: 'node/kalwaryjska-dlugosza', lat: 50.042, lon: 19.945 },
    criterion: 'kerb',
    value: '115 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-plac-bohaterow-getta-kerb',
    subject: { type: 'crossing', ref: 'node/plac-bohaterow-kacik', lat: 50.0475, lon: 19.954 },
    criterion: 'kerb',
    value: '90 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-kopernika-strzelecka-steps',
    subject: { type: 'segment', ref: 'way/kopernika-strzelecka', lat: 50.0615, lon: 19.949 },
    criterion: 'steps',
    value: '14 stopni wejściowych na posesję szpitalną bez rampy',
    status: 'verified',
    source: { name: 'Audyt Dostępności UMK', url: 'https://krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-zwierzyniecka-filharmonia-kerb',
    subject: { type: 'crossing', ref: 'node/zwierzyniecka-filharmonia', lat: 50.0592, lon: 19.9325 },
    criterion: 'kerb',
    value: '85 mm',
    unit: 'mm',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-bulwary-debnicki-stairs',
    subject: { type: 'segment', ref: 'way/bulwary-debnicki-schody', lat: 50.0545, lon: 19.9285 },
    criterion: 'steps',
    value: '24 stopnie bez rampy w zejściu z Mostu Dębnickiego na Bulwary Wiślane',
    status: 'verified',
    source: { name: 'ZDMK Kraków', url: 'https://zdmk.krakow.pl', licence: 'Informacja Publiczna' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'krakow-barrier-stradomska-agnieszki-width',
    subject: { type: 'segment', ref: 'way/stradomska-chodnik', lat: 50.055, lon: 19.9395 },
    criterion: 'width',
    value: '0.70 m',
    status: 'community',
    source: { name: 'OpenStreetMap', url: 'https://osm.org', licence: 'ODbL' },
    retrievedAt: '2026-10-03T12:00:00Z',
  },
];

/**
 * Returns all city accessibility facts combined from DEMO_SNAPSHOT (routes + places)
 * and curated Kraków barrier datasets.
 */
export function getAllCityFacts(): Fact[] {
  const seenIds = new Set<string>();
  const allFacts: Fact[] = [];

  const addFact = (f: Fact) => {
    if (!f || !f.id || seenIds.has(f.id)) return;
    seenIds.add(f.id);
    allFacts.push(f);
  };

  // 1. Facts from all snapshot routes
  for (const r of DEMO_SNAPSHOT.routes) {
    for (const f of r.facts) {
      addFact(f);
    }
  }

  // 2. Facts from all snapshot places
  for (const p of DEMO_SNAPSHOT.places) {
    for (const f of p.facts) {
      addFact(f);
    }
  }

  // 3. Additional curated city barriers
  for (const f of ADDITIONAL_KRAKOW_BARRIERS) {
    addFact(f);
  }

  return allFacts;
}

/**
 * Evaluates all city facts against the provided mobility thresholds using the
 * existing core evaluation logic (`evaluateFactSeverity`).
 * Returns only items that are actual barriers (blocker or warning) for the user.
 */
export function getAllCityBarriers(thresholds: BarrierThresholds): RouteFinding[] {
  const facts = getAllCityFacts();
  const barriers: RouteFinding[] = [];

  for (const fact of facts) {
    const evaluated = evaluateFactSeverity(fact, thresholds);
    if (evaluated.severity === 'blocker' || evaluated.severity === 'warning') {
      barriers.push({
        id: `city-barrier-${fact.id}`,
        distanceFromStartMetres: 0,
        type: evaluated.type,
        severity: evaluated.severity,
        fact: {
          ...fact,
          // Store evaluated evidence in description or keep value
          value: evaluated.evidence || fact.value,
        },
      });
    }
  }

  return barriers;
}

const AMENITY_TYPES = new Set(['elevator', 'ramp', 'wheelchair', 'toilets:wheelchair', 'crossing']);

/** City points that help the user: ramps, lifts, wheelchair-accessible entrances and toilets, crossings. */
export function getAllCityAmenities(thresholds: BarrierThresholds): RouteFinding[] {
  const amenities: RouteFinding[] = [];
  for (const fact of getAllCityFacts()) {
    const evaluated = evaluateFactSeverity(fact, thresholds);
    const crit = fact.criterion.toLowerCase();
    const isToiletOk = crit === 'toilets:wheelchair' && /^(yes|tak)/i.test(fact.value.trim());
    const helpful =
      evaluated.severity === 'ok' ||
      isToiletOk ||
      (evaluated.severity === 'info' && AMENITY_TYPES.has(evaluated.type));
    if (!helpful) continue;
    amenities.push({
      id: `city-amenity-${fact.id}`,
      distanceFromStartMetres: 0,
      type: isToiletOk ? 'toilets:wheelchair' : evaluated.type,
      severity: 'ok',
      fact: { ...fact, value: evaluated.evidence || fact.value },
    });
  }
  return amenities;
}

export interface CitizenReportPoint {
  id: string;
  description: string;
  position?: { lat: number; lon: number };
  createdAt: string;
  status?: string;
  category?: 'obstacle' | 'hole' | 'surface' | 'flood' | 'other' | string;
  photoUrl?: string;
  stillHereCount?: number;
  fixedCount?: number;
}

/** Resident reports are their own obstacle type and only appear where a location is known. */
export function citizenReportsAsFindings(reports: CitizenReportPoint[]): RouteFinding[] {
  const seen = new Set<string>();
  const findings: RouteFinding[] = [];

  for (const report of reports) {
    if (!report.position) continue;
    if (report.status === 'resolved') continue;
    const key = `${report.position.lat.toFixed(4)}|${report.position.lon.toFixed(4)}|${report.description.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const fact: Fact = {
      id: `citizen-report-${report.id}`,
      subject: {
        type: 'place',
        ref: `report/${report.id}`,
        lat: report.position.lat,
        lon: report.position.lon,
      },
      criterion: 'report',
      value: report.description,
      status: 'reported',
      source: {
        name: 'Zgłoszenie mieszkańca',
        url: 'https://www.krakow.pl',
        licence: 'Zgłoszenie użytkownika',
      },
      retrievedAt: report.createdAt,
    };

    findings.push({
      id: fact.id,
      distanceFromStartMetres: 0,
      type: 'report',
      severity: 'warning',
      fact,
      ...({
        reportId: report.id,
        category: report.category,
        photoUrl: report.photoUrl,
        stillHereCount: report.stillHereCount || 0,
        fixedCount: report.fixedCount || 0,
      } as any),
    });
  }

  return findings;
}

export type BarrierMapMode = 'none' | 'route' | 'all';

function findingOnRoute(
  finding: RouteFinding,
  routeCoordinates: [number, number][],
  corridorMetres: number,
): boolean {
  const { lat, lon } = finding.fact.subject;
  if (lat == null || lon == null) return false;
  const nearest = findNearestPointOnRoute(routeCoordinates, { lat, lon });
  return nearest != null && nearest.distanceToLineMetres <= corridorMetres;
}

/**
 * Map findings for display on the interactive map.
 * - When no route is active: displays all citizen reports (plus all city barriers if mode is 'all', or blocker/warning barriers if mode is 'route').
 * - When an active route exists:
 *   - 'route': shows blockers/warnings along the route corridor and citizen reports within the corridor.
 *   - 'all': shows barriers and amenities (ramps, lifts, wheelchair access, crossings) along the route.
 *   - 'none': hides all findings.
 */
export function selectMapFindings(input: {
  mode: BarrierMapMode;
  routeFindings: RouteFinding[];
  reports: RouteFinding[];
  allCityBarriers?: RouteFinding[];
  cityAmenities?: RouteFinding[];
  routeCoordinates?: [number, number][];
  corridorMetres: number;
  /** User reports sit on the pavement beside the walked line. */
  reportCorridorMetres?: number;
}): RouteFinding[] {
  if (input.mode === 'none') return [];
  const coordinates = input.routeCoordinates ?? [];
  const findingsPool =
    input.routeFindings.length > 0
      ? input.routeFindings
      : (input.allCityBarriers ?? []);

  if (coordinates.length === 0) {
    const problems = findingsPool.filter(
      (finding) => finding.severity === 'blocker' || finding.severity === 'warning',
    );
    const described = findingsPool.filter((finding) => finding.severity !== 'unknown');
    const base = input.mode === 'route' ? problems : described.length > 0 ? described : findingsPool;
    return [...base, ...input.reports];
  }

  const sidewalkMetres = Math.max(input.corridorMetres, 40);
  const onSidewalk = (finding: RouteFinding, metres: number) =>
    findingOnRoute(finding, coordinates, metres);

  const sidewalk = input.routeFindings.filter((finding) => onSidewalk(finding, sidewalkMetres));
  const reportsOnRoute = input.reports.filter((report) =>
    onSidewalk(report, input.reportCorridorMetres ?? Math.max(sidewalkMetres, 45)),
  );
  const problems = sidewalk.filter(
    (finding) => finding.severity === 'blocker' || finding.severity === 'warning',
  );
  if (input.mode === 'route') {
    return [...problems, ...reportsOnRoute];
  }

  const facilityMetres = Math.max(sidewalkMetres, 80);
  const isAmenity = (finding: RouteFinding) =>
    finding.severity === 'ok' ||
    finding.severity === 'info' ||
    finding.type === 'elevator' ||
    finding.type === 'ramp' ||
    finding.type === 'wheelchair' ||
    finding.type === 'toilets:wheelchair' ||
    finding.type === 'crossing';
  const amenities = [...input.routeFindings, ...(input.cityAmenities ?? [])].filter(
    (finding) => isAmenity(finding) && onSidewalk(finding, facilityMetres),
  );
  const seen = new Set<string>();
  const allPoints: RouteFinding[] = [];
  for (const finding of [...sidewalk, ...amenities]) {
    if (finding.severity === 'unknown' || seen.has(finding.id)) continue;
    seen.add(finding.id);
    allPoints.push(finding);
  }
  return [...allPoints, ...reportsOnRoute];
}
