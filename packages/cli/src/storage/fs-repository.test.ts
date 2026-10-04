import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FsReportsRepository } from './fs-repository';
import { defaultPlacesRegistry } from './places-registry';

describe('FsReportsRepository', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-repo-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Non-fatal
    }
  });

  test('initializes and seeds default hazards when seedInitialData is true', async () => {
    const repo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: true,
    });

    const hazards = await repo.listHazards();
    expect(hazards.length).toBeGreaterThan(0);

    const hazardsFile = path.join(tempDir, 'hazards.json');
    expect(fs.existsSync(hazardsFile)).toBe(true);

    const content = JSON.parse(fs.readFileSync(hazardsFile, 'utf-8'));
    expect(content.length).toBe(hazards.length);
  });

  test('creates hazard and persists to disk', async () => {
    const repo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
    });

    const hazard = await repo.createHazard({
      description: 'Zapadnięta płyta chodnikowa',
      email: 'mieszkaniec@krakow.pl',
      category: 'surface',
      position: { lat: 50.061, lon: 19.938 },
      photoUrl: '/uploads/photo-1.jpg',
    });

    expect(hazard.id).toBeDefined();
    expect(hazard.description).toBe('Zapadnięta płyta chodnikowa');

    // Re-instantiate repository from same directory to verify persistence
    const reloadedRepo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
    });

    const retrieved = await reloadedRepo.getHazard(hazard.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.description).toBe('Zapadnięta płyta chodnikowa');
    expect(retrieved?.photoUrl).toBe('/uploads/photo-1.jpg');
    expect(retrieved?.email).toBe('mieszkaniec@krakow.pl');
  });

  test('persists hazard verifications and undos', async () => {
    const repo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
    });

    const hazard = await repo.createHazard({
      description: 'Przeszkoda testowa',
      email: 'autor@krakow.pl',
      category: 'obstacle',
    });

    const vote1 = await repo.verifyHazard(hazard.id, 'still_here', 'voter1@krakow.pl');
    expect(vote1.hazard.stillHereCount).toBe(1);

    // Reload from disk
    const reloadedRepo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
    });

    const vote2 = await reloadedRepo.verifyHazard(hazard.id, 'unset', 'voter1@krakow.pl');
    expect(vote2.hazard.stillHereCount).toBe(0);
    expect(vote2.userVote).toBeNull();
  });

  test('persists place comments and enforces canonical place data', async () => {
    const repo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
      placesRegistry: defaultPlacesRegistry,
    });

    const comment = await repo.addPlaceComment({
      placeId: 'place-sukiennice',
      sentiment: 'positive',
      comment: 'Bardzo szerokie i dostępne wejście.',
      category: 'entrance',
      email: 'audytor@krakow.pl',
      photoUrl: '/uploads/sukiennice.jpg',
    });

    expect(comment).not.toBeNull();
    expect(comment?.placeName).toBe('Sukiennice (Galeria Sztuki)');

    // Reload from disk
    const reloadedRepo = new FsReportsRepository({
      dataDir: tempDir,
      seedInitialData: false,
      placesRegistry: defaultPlacesRegistry,
    });

    const comments = await reloadedRepo.listPlaceComments('place-sukiennice');
    expect(comments.length).toBe(1);
    expect(comments[0]?.comment).toBe('Bardzo szerokie i dostępne wejście.');
    expect(comments[0]?.photoUrl).toBe('/uploads/sukiennice.jpg');
  });
});
