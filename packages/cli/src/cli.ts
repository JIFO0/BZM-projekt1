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
    case '--help':
    case '-h':
    case undefined:
      console.log('Kraków bez barier - Narzędzie CLI\n');
      console.log('Użycie:');
      console.log('  krakow-cli <polecenie> [opcje]\n');
      console.log('Dostępne polecenia:');
      console.log('  server          Uruchamia serwer HTTP');
      console.log('  datagen         Buduje i waliduje snapshot danych demonstracyjnych');
      console.log('  build-snapshot  Alias dla datagen\n');
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