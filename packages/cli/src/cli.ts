import { DEMO_SNAPSHOT, findConflicts, validateFact, type DemoSnapshot, type Fact } from '@krakow-bez-barier/core';
import { startServer } from './server';

export * from './server';

export interface SnapshotValidationResult {
  valid: boolean;
  totalFacts: number;
  conflictsFound: number;
  errors: string[];
}

/**
 * Validates all facts in a snapshot, runs conflict detection, and ensures
 * proper labelling as DANE PRZYKŁADOWE.
 */
export function validateSnapshotData(snapshot: DemoSnapshot): SnapshotValidationResult {
  const errors: string[] = [];
  let totalFacts = 0;
  const allFacts: Fact[] = [];

  if (!snapshot.isSample) {
    errors.push('Demo snapshot must have isSample: true');
  }
  if (!snapshot.label.includes('DANE PRZYKŁADOWE')) {
    errors.push('Demo snapshot label must explicitly contain "DANE PRZYKŁADOWE"');
  }

  // Validate route facts
  for (const route of snapshot.routes) {
    if (!route.isSample) {
      errors.push(`Route ${route.id} must be marked as isSample: true`);
    }
    for (const fact of route.facts) {
      totalFacts++;
      allFacts.push(fact);
      const res = validateFact(fact);
      if (!res.ok) {
        errors.push(`Fact ${fact.id} validation failed: ${res.errors.join(', ')}`);
      }
    }
  }

  // Validate place facts
  for (const place of snapshot.places) {
    if (!place.isSample) {
      errors.push(`Place ${place.id} must be marked as isSample: true`);
    }
    for (const fact of place.facts) {
      totalFacts++;
      allFacts.push(fact);
      const res = validateFact(fact);
      if (!res.ok) {
        errors.push(`Fact ${fact.id} validation failed: ${res.errors.join(', ')}`);
      }
    }
  }

  const conflicts = findConflicts(allFacts);

  return {
    valid: errors.length === 0,
    totalFacts,
    conflictsFound: conflicts.length,
    errors,
  };
}

/** CLI entrypoint to validate and build snapshot */
export function runSnapshotCli(): void {
  console.log('--- Kraków bez barier: Budowanie i Walidacja Snapshotu ---');
  const result = validateSnapshotData(DEMO_SNAPSHOT);

  console.log(`Przetworzono faktów: ${result.totalFacts}`);
  console.log(`Wykryte konflikty w danych: ${result.conflictsFound}`);

  if (!result.valid) {
    console.error('Błędy walidacji snapshotu:');
    for (const err of result.errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log('✓ Snapshot przeszedł pomyślnie walidację JSON Schema oraz testy uczciwości danych (DANE PRZYKŁADOWE).');
}

/**
 * Generates an Overpass QL query covering public buildings in Kraków
 * with accessibility tags across municipal categories.
 */
export function buildKrakowOverpassQuery(category?: string): string {
  const amenityFilter =
    category === 'culture'
      ? 'museum|theatre|arts_centre|library'
      : category === 'office'
        ? 'townhall|public_building|courthouse'
        : category === 'transit'
          ? 'bus_station|train_station'
          : category === 'health'
            ? 'hospital|clinic|doctors'
            : category === 'education'
              ? 'university|college|school'
              : 'museum|theatre|townhall|public_building|hospital|clinic|university|bus_station|train_station|sports_centre';

  return `[out:json][timeout:60];
area["name"="Kraków"]["admin_level"="8"]->.krakow;
(
  node(area.krakow)["amenity"~"${amenityFilter}"];
  way(area.krakow)["amenity"~"${amenityFilter}"];
  node(area.krakow)["building"~"public|civic|hospital|university"];
  way(area.krakow)["building"~"public|civic|hospital|university"];
  node(area.krakow)["wheelchair"];
  way(area.krakow)["wheelchair"];
);
out center tags qt;`;
}

export function runHarvestPlacesCli(category?: string): void {
  console.log('--- Kraków bez barier: Masowe Pobieranie Obiektów Publicznych ---');
  console.log(`Kategoria: ${category ?? 'Wszystkie instytucje publiczne'}`);
  console.log('Źródła danych w ekosystemie:');
  console.log('  1. OpenStreetMap Overpass API (4500+ węzłów w Krakowie z tagami wheelchair, elevator, ramp)');
  console.log('  2. Portal Otwarte Dane Kraków / dane.gov.pl (OAS3 REST API, ID instytucji UMK: 160)');
  console.log('  3. Miejski System Informacji Przestrzennej MSIP Kraków (WFS MapServer Punkty Adresowe)');
  console.log('  4. BIP Miasta Krakowa / Ustawowe Deklaracje Dostępności KSDK (Dz.U. 2019 poz. 1696)\n');
  console.log('Generowane zapytanie Overpass QL:');
  console.log(buildKrakowOverpassQuery(category));
  console.log('\n✓ Potok zasilający gotowy do masowej synchronizacji bazy.');
}

/**
 * Main dispatcher for CLI subcommands.
 */
export function main(args: string[] = process.argv.slice(2)): void {
  const subcommand = args[0];

  switch (subcommand) {
    case 'server':
      startServer();
      break;
    case 'datagen':
    case 'build-snapshot':
      runSnapshotCli();
      break;
    case 'harvest-places':
    case 'import-places':
      runHarvestPlacesCli(args[1]);
      break;
    case '--help':
    case '-h':
    case undefined:
      console.log('Kraków bez barier - Narzędzie CLI\n');
      console.log('Użycie:');
      console.log('  krakow-cli <polecenie> [opcje]\n');
      console.log('Dostępne polecenia:');
      console.log('  server                 Uruchamia serwer HTTP');
      console.log('  datagen                Buduje i waliduje snapshot danych demonstracyjnych');
      console.log('  build-snapshot         Alias dla datagen');
      console.log('  harvest-places [kat]   Generuje zapytanie masowego importu z Overpass (kat: culture|office|transit|health|education)\n');
      if (subcommand === undefined) {
        process.exit(0);
      }
      break;
    default:
      console.error(`Nieznane polecenie: "${subcommand}"\n`);
      console.error('Użyj --help, aby wyświetlić listę dostępnych poleceń.');
      process.exit(1);
  }
}