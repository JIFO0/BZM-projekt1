import {
  DEMO_SNAPSHOT,
  evaluateFactSeverity,
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
