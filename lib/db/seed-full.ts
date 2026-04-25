import { env } from '../env';

const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="KG"][admin_level=2]->.kg;
(
  node["tourism"](area.kg);
  node["amenity"~"^(restaurant|cafe|fast_food)$"](area.kg);
  node["natural"="peak"](area.kg);
  node["historic"](area.kg);
  node["leisure"="park"](area.kg);
);
out body;
`;

const BATCH_SIZE = 100;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface ImportedPlace {
  id: string;
  osm_id: number;
  name: string;
  name_en: string | null;
  name_ky: string | null;
  lat: number;
  lon: number;
  category: string;
  region: string;
  tags: string;
  photo_url: string | null;
}

export interface PlacesImportStatement {
  executeAsync: (params: Record<string, unknown>) => Promise<unknown>;
  finalizeAsync: () => Promise<void>;
}

export interface PlacesImportDb {
  execAsync: (sql: string) => Promise<unknown>;
  getFirstAsync: <T>(sql: string) => Promise<T | null>;
  prepareAsync: (sql: string) => Promise<PlacesImportStatement>;
}

export interface SeedFullPlacesOptions {
  db?: PlacesImportDb;
  migrate?: () => Promise<void>;
}

type Oblast =
  | 'Chuy'
  | 'Issyk-Kul'
  | 'Naryn'
  | 'Osh'
  | 'Jalal-Abad'
  | 'Batken'
  | 'Talas';

interface RegionCentroid {
  name: Oblast;
  lat: number;
  lon: number;
}

interface CryptoSource {
  randomUUID?: () => string;
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
}

const REGION_CENTROIDS: RegionCentroid[] = [
  { name: 'Chuy', lat: 42.83, lon: 74.6 },
  { name: 'Issyk-Kul', lat: 42.15, lon: 78.1 },
  { name: 'Naryn', lat: 41.43, lon: 75.95 },
  { name: 'Osh', lat: 40.25, lon: 73.25 },
  { name: 'Jalal-Abad', lat: 41.25, lon: 72.25 },
  { name: 'Batken', lat: 40.05, lon: 70.75 },
  { name: 'Talas', lat: 42.35, lon: 72.25 },
];

function createUuid(): string {
  const cryptoSource = (globalThis as { crypto?: CryptoSource }).crypto;
  const randomUUID = cryptoSource?.randomUUID;
  if (typeof randomUUID === 'function') {
    return randomUUID.call(cryptoSource);
  }

  const bytes = new Uint8Array(16);
  const getRandomValues = cryptoSource?.getRandomValues;

  if (typeof getRandomValues === 'function') {
    getRandomValues.call(cryptoSource, bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

function normalizeName(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getDisplayName(tags: Record<string, string>, category: string, osmId: number): string {
  return (
    normalizeName(tags.name) ??
    normalizeName(tags['name:en']) ??
    normalizeName(tags['name:ky']) ??
    normalizeName(tags['name:ru']) ??
    normalizeName(tags.brand) ??
    normalizeName(tags.operator) ??
    `${category.replace(/_/g, ' ')} ${osmId}`
  );
}

function mapCategory(tags: Record<string, string>): string {
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'fast_food') return 'fast_food';
  if (tags.natural === 'peak') return 'peak';
  if (tags.leisure === 'park') return 'park';
  if (tags.historic) return 'historic';

  switch (tags.tourism) {
    case 'hotel':
    case 'motel':
      return 'hotel';
    case 'guest_house':
      return 'guesthouse';
    case 'camp_site':
    case 'caravan_site':
      return 'camping';
    case 'hostel':
      return 'hostel';
    case 'apartment':
      return 'apartment';
    case 'chalet':
    case 'alpine_hut':
    case 'wilderness_hut':
      return 'guesthouse';
    case 'museum':
      return 'museum';
    case 'viewpoint':
      return 'viewpoint';
    case 'information':
      return 'information';
    case 'picnic_site':
      return 'picnic_site';
    case 'attraction':
    case 'artwork':
    case 'gallery':
    case 'theme_park':
    case 'zoo':
      return 'attraction';
    default:
      return tags.tourism ?? 'place';
  }
}

function determineRegion(lat: number, lon: number): Oblast {
  if (lon < 72 && lat < 40.75) return 'Batken';
  if (lat >= 41.85 && lon < 73.65) return 'Talas';
  if (lat >= 42.1 && lon >= 73.2 && lon < 76.25) return 'Chuy';
  if (lon >= 76 && lat >= 41.55) return 'Issyk-Kul';
  if (lon < 74 && lat >= 40.75 && lat < 42.15) return 'Jalal-Abad';
  if (lat < 40.9 && lon >= 72 && lon < 74.9) return 'Osh';
  if (lon >= 73.6 && lat < 42.3) return 'Naryn';

  return REGION_CENTROIDS.reduce((best, candidate) => {
    const latDistance = lat - candidate.lat;
    const lonDistance = (lon - candidate.lon) * Math.cos((lat * Math.PI) / 180);
    const distance = latDistance * latDistance + lonDistance * lonDistance;

    if (distance < best.distance) {
      return { name: candidate.name, distance };
    }

    return best;
  }, { name: 'Chuy' as Oblast, distance: Number.POSITIVE_INFINITY }).name;
}

function mapElementToPlace(element: OverpassElement): ImportedPlace | null {
  if (element.type !== 'node' || typeof element.lat !== 'number' || typeof element.lon !== 'number') {
    return null;
  }

  const tags = element.tags ?? {};
  const category = mapCategory(tags);

  return {
    id: createUuid(),
    osm_id: element.id,
    name: getDisplayName(tags, category, element.id),
    name_en: normalizeName(tags['name:en']),
    name_ky: normalizeName(tags['name:ky']),
    lat: element.lat,
    lon: element.lon,
    category,
    region: determineRegion(element.lat, element.lon),
    tags: JSON.stringify(tags),
    photo_url: null,
  };
}

async function fetchOverpassPlaces(): Promise<ImportedPlace[]> {
  const response = await fetch(env.overpass.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OverpassResponse;
  return (data.elements ?? [])
    .map(mapElementToPlace)
    .filter((place): place is ImportedPlace => place !== null);
}

async function insertPlacesBatch(db: PlacesImportDb, places: ImportedPlace[]): Promise<void> {
  const stmt = await db.prepareAsync(
    `INSERT INTO places (id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url)
     VALUES ($id, $osm_id, $name, $name_en, $name_ky, $lat, $lon, $category, $region, $tags, $photo_url)`
  );

  try {
    for (const place of places) {
      await stmt.executeAsync({
        $id: place.id,
        $osm_id: place.osm_id,
        $name: place.name,
        $name_en: place.name_en,
        $name_ky: place.name_ky,
        $lat: place.lat,
        $lon: place.lon,
        $category: place.category,
        $region: place.region,
        $tags: place.tags,
        $photo_url: place.photo_url,
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

async function insertPlaces(db: PlacesImportDb, places: ImportedPlace[]): Promise<void> {
  for (let start = 0; start < places.length; start += BATCH_SIZE) {
    const batch = places.slice(start, start + BATCH_SIZE);

    await db.execAsync('BEGIN TRANSACTION');
    try {
      await insertPlacesBatch(db, batch);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

    console.log(`Imported ${Math.min(start + batch.length, places.length)}/${places.length} places...`);
  }
}

async function getDefaultDb(): Promise<PlacesImportDb> {
  const { getDb } = await import('./client');
  return (await getDb()) as PlacesImportDb;
}

async function runDefaultMigrations(): Promise<void> {
  const { runMigrations } = await import('./migrations');
  await runMigrations();
}

/**
 * Imports Kyrgyzstan places from Overpass into the local SQLite places table.
 */
export async function seedFullPlaces(options: SeedFullPlacesOptions = {}): Promise<void> {
  if (options.migrate) {
    await options.migrate();
  } else if (!options.db) {
    await runDefaultMigrations();
  }

  const db = options.db ?? (await getDefaultDb());
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM places');
  const existingCount = existing?.count ?? 0;

  if (existingCount > 100) {
    console.log(`[db] Full places import skipped: ${existingCount} places already exist`);
    return;
  }

  console.log('[db] Fetching Kyrgyzstan places from Overpass...');
  const places = await fetchOverpassPlaces();

  if (places.length === 0) {
    console.log('[db] Overpass returned no places to import');
    return;
  }

  await insertPlaces(db, places);
  console.log(`[db] Full places import complete: ${places.length} places`);
}
