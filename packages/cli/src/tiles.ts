import fs from 'fs';
import path from 'path';

/**
 * Geoportal EPSG:2180 (PUWG 1992) tile matrix parameters
 */
export const EPSG2180_RESOLUTIONS = [
  2116.6708999999995,
  1058.3354499999997,
  529.1677249999999,
  264.58386249999994,
  132.29193124999997,
  66.14596562499999,
  26.45838625,
  13.229193125,
  6.6145965625,
  2.645838625,
  1.3229193125,
  0.529167725,
  0.2645838625,
];

export const EPSG2180_ORIGIN_X = 100000.0;
export const EPSG2180_ORIGIN_Y = 850000.0;
export const TILE_SIZE = 512;

export const GEOPORTAL_WMTS_BASE =
  'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/BDOT10k-BDOO?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BDOT10k-BDOO&STYLE=default&TILEMATRIXSET=EPSG:2180';

/**
 * Pure TypeScript conversion from WGS84 (lon, lat in degrees)
 * to EPSG:2180 (PUWG 1992, Easting and Northing in metres).
 * Ellipsoid: GRS80, Central meridian: 19° E, Scale factor: 0.9993.
 */
export function wgs84ToEpsg2180(lon: number, lat: number): [number, number] {
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const e_prime2 = (a * a - b * b) / (b * b);

  const k0 = 0.9993;
  const lon0 = (19 * Math.PI) / 180;
  const x0 = 500000;
  const y0 = -5300000;

  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
  const T = Math.tan(phi) * Math.tan(phi);
  const C = e_prime2 * Math.cos(phi) * Math.cos(phi);
  const A = (lambda - lon0) * Math.cos(phi);

  const m0 = 1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256;
  const m1 = (3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024;
  const m2 = (15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024;
  const m3 = (35 * e2 * e2 * e2) / 3072;
  const M = a * (m0 * phi - m1 * Math.sin(2 * phi) + m2 * Math.sin(4 * phi) - m3 * Math.sin(6 * phi));

  const x =
    x0 +
    k0 *
      N *
      (A +
        ((1 - T + C) * Math.pow(A, 3)) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * e_prime2) * Math.pow(A, 5)) / 120);
  const y =
    y0 +
    k0 *
      (M +
        N *
          Math.tan(phi) *
          ((A * A) / 2 +
            ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * e_prime2) * Math.pow(A, 6)) / 720));

  return [x, y];
}

export function getEpsg2180TileCoords(lon: number, lat: number, z: number): { col: number; row: number } {
  const [x, y] = wgs84ToEpsg2180(lon, lat);
  const resolution = EPSG2180_RESOLUTIONS[z] ?? EPSG2180_RESOLUTIONS[EPSG2180_RESOLUTIONS.length - 1]!;
  const col = Math.floor((x - EPSG2180_ORIGIN_X) / (resolution * TILE_SIZE));
  const row = Math.floor((EPSG2180_ORIGIN_Y - y) / (resolution * TILE_SIZE));
  return { col, row };
}

export interface TileItem {
  z: number;
  row: number;
  col: number;
  url: string;
  localRelPath: string;
}

export interface BoundingBox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

export const KRAKOW_AREAS: Record<'demo' | 'city' | 'region', BoundingBox> = {
  // Rynek Główny – Kazimierz – Wawel – Planty – Kleparz
  demo: {
    minLon: 19.92,
    maxLon: 19.96,
    minLat: 50.045,
    maxLat: 50.075,
  },
  // Kraków obszar miejski (zgodny z cities/krakow.json)
  city: {
    minLon: 19.86,
    maxLon: 20.08,
    minLat: 50.00,
    maxLat: 50.11,
  },
  // Kraków i najbliższa okolica (Wieliczka, Skawina, Zielonki)
  region: {
    minLon: 19.75,
    maxLon: 20.15,
    minLat: 49.95,
    maxLat: 50.15,
  },
};

export function getTileUrl(z: number, row: number, col: number): string {
  return `${GEOPORTAL_WMTS_BASE}&TILEMATRIX=EPSG:2180:${z}&TILEROW=${row}&TILECOL=${col}&FORMAT=image/png`;
}

export function getTilesDirectory(): string {
  // Default to project root data/tiles/geoportal
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'data', 'tiles', 'geoportal'),
    path.join(cwd, '..', '..', 'data', 'tiles', 'geoportal'),
    path.join(cwd, 'packages', 'cli', 'data', 'tiles', 'geoportal'),
  ];
  return candidates[0]!;
}

/**
 * Builds a list of tiles needed to cover a given bounding box across zoom levels.
 */
export function buildTileList(
  bbox: BoundingBox,
  minZoom = 7,
  maxZoom = 10,
): TileItem[] {
  const tiles: TileItem[] = [];
  const seen = new Set<string>();

  const [pMinX, pMinY] = wgs84ToEpsg2180(bbox.minLon, bbox.minLat);
  const [pMaxX, pMaxY] = wgs84ToEpsg2180(bbox.maxLon, bbox.maxLat);

  for (let z = minZoom; z <= maxZoom; z++) {
    const res = EPSG2180_RESOLUTIONS[z];
    if (!res) continue;

    const minCol = Math.floor((pMinX - EPSG2180_ORIGIN_X) / (res * TILE_SIZE));
    const maxCol = Math.floor((pMaxX - EPSG2180_ORIGIN_X) / (res * TILE_SIZE));
    const minRow = Math.floor((EPSG2180_ORIGIN_Y - pMaxY) / (res * TILE_SIZE));
    const maxRow = Math.floor((EPSG2180_ORIGIN_Y - pMinY) / (res * TILE_SIZE));

    for (let r = Math.min(minRow, maxRow); r <= Math.max(minRow, maxRow); r++) {
      for (let c = Math.min(minCol, maxCol); c <= Math.max(minCol, maxCol); c++) {
        const key = `${z}/${r}/${c}`;
        if (!seen.has(key)) {
          seen.add(key);
          tiles.push({
            z,
            row: r,
            col: c,
            url: getTileUrl(z, r, c),
            localRelPath: path.join(String(z), String(r), `${c}.png`),
          });
        }
      }
    }
  }

  return tiles;
}

export interface DownloadOptions {
  area?: 'demo' | 'city' | 'region';
  minZoom?: number;
  maxZoom?: number;
  outputDir?: string;
  concurrency?: number;
  onProgress?: (stats: { done: number; total: number; downloaded: number; cached: number; bytes: number }) => void;
}

/**
 * Downloads Geoportal WMTS tiles for Kraków to local disk cache.
 */
export async function downloadGeoportalTiles(options: DownloadOptions = {}): Promise<{
  total: number;
  downloaded: number;
  cached: number;
  sizeBytes: number;
  targetDir: string;
}> {
  const areaKey = options.area ?? 'city';
  const bbox = KRAKOW_AREAS[areaKey] ?? KRAKOW_AREAS.city;
  const minZoom = options.minZoom ?? 7;
  const maxZoom = options.maxZoom ?? 10;
  const targetDir = options.outputDir ?? getTilesDirectory();
  const concurrency = options.concurrency ?? 6;

  // Build tile list for selected area
  let tiles = buildTileList(bbox, minZoom, maxZoom);

  // If demo area is inside, also include zoom 11 for demo area core (Stare Miasto/Kazimierz)
  if (maxZoom >= 10) {
    const demoZoom11Tiles = buildTileList(KRAKOW_AREAS.demo, 11, 11);
    const existing = new Set(tiles.map((t) => `${t.z}/${t.row}/${t.col}`));
    for (const dt of demoZoom11Tiles) {
      if (!existing.has(`${dt.z}/${dt.row}/${dt.col}`)) {
        tiles.push(dt);
      }
    }
  }

  fs.mkdirSync(targetDir, { recursive: true });

  let done = 0;
  let downloaded = 0;
  let cached = 0;
  let sizeBytes = 0;

  let activeIndex = 0;

  async function worker(): Promise<void> {
    while (activeIndex < tiles.length) {
      const idx = activeIndex++;
      const tile = tiles[idx]!;
      const fullPath = path.join(targetDir, tile.localRelPath);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 100) {
        cached++;
        sizeBytes += fs.statSync(fullPath).size;
      } else {
        try {
          const res = await fetch(tile.url);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, buf);
            downloaded++;
            sizeBytes += buf.length;
          } else {
            console.warn(`[Tile] Błąd HTTP ${res.status} dla kafelka z=${tile.z}, row=${tile.row}, col=${tile.col}`);
          }
        } catch (err: any) {
          console.warn(`[Tile] Błąd pobierania (${err.message}) dla kafelka z=${tile.z}, r=${tile.row}, c=${tile.col}`);
        }
      }

      done++;
      if (options.onProgress && (done % 10 === 0 || done === tiles.length)) {
        options.onProgress({ done, total: tiles.length, downloaded, cached, bytes: sizeBytes });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tiles.length) }, () => worker());
  await Promise.all(workers);

  return {
    total: tiles.length,
    downloaded,
    cached,
    sizeBytes,
    targetDir,
  };
}
