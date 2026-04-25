import { Platform } from 'react-native';
import { getDb } from '../db/client';
import { SEED_PLACES } from '../db/seed';
import type { Language } from '../strings';

export type PlaceCategory =
  | 'hotel'
  | 'hostel'
  | 'yurt'
  | 'guesthouse'
  | 'restaurant'
  | 'cafe'
  | 'activity'
  | 'attraction'
  | 'nature'
  | 'market'
  | 'park'
  | 'rest_point'
  | 'atm';

export interface Place {
  id: string;
  osmId: number | null;
  name: string;
  nameEn: string | null;
  nameKy: string | null;
  lat: number;
  lon: number;
  category: PlaceCategory | string;
  region: string;
  tags: Record<string, unknown>;
  photoUrl: string | null;
  distanceKm?: number;
}

interface PlaceRow {
  id: string;
  osm_id: number | null;
  name: string;
  name_en: string | null;
  name_ky: string | null;
  lat: number;
  lon: number;
  category: string;
  region: string;
  tags: string | null;
  photo_url: string | null;
}

function parseTags(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function fromRow(row: PlaceRow): Place {
  return {
    id: row.id,
    osmId: row.osm_id,
    name: row.name,
    nameEn: row.name_en,
    nameKy: row.name_ky,
    lat: row.lat,
    lon: row.lon,
    category: row.category,
    region: row.region,
    tags: parseTags(row.tags),
    photoUrl: row.photo_url,
  };
}

function seedRows(): Place[] {
  return SEED_PLACES.map((place) => fromRow({
    id: place.id,
    osm_id: place.osm_id,
    name: place.name,
    name_en: place.name_en,
    name_ky: place.name_ky,
    lat: place.lat,
    lon: place.lon,
    category: place.category,
    region: place.region,
    tags: place.tags,
    photo_url: place.photo_url,
  }));
}

function localizeName(place: Place, language: Language): string {
  if (language === 'ky' && place.nameKy) return place.nameKy;
  if (language === 'en' && place.nameEn) return place.nameEn;
  return place.name;
}

function localizePlaces(places: Place[], language: Language): Place[] {
  return places.map((place) => ({ ...place, name: localizeName(place, language) }));
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const startLat = toRad(aLat);
  const endLat = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function selectPlaces(sql: string, params: unknown[] = []): Promise<Place[]> {
  if (Platform.OS === 'web') return seedRows();

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<PlaceRow>(sql, ...params);
    return rows.map(fromRow);
  } catch (error) {
    console.warn('[api/places] query failed, using seed fallback', error);
    return seedRows();
  }
}

export async function getAllPlaces(language: Language = 'en', limit = 200): Promise<Place[]> {
  const places = await selectPlaces(
    `SELECT id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url
     FROM places
     LIMIT ?`,
    [limit]
  );
  return localizePlaces(places.slice(0, limit), language);
}

export async function getPlacesByCategories(
  categories: string[],
  language: Language = 'en',
  limit = 80
): Promise<Place[]> {
  if (categories.length === 0) return getAllPlaces(language, limit);

  const placeholders = categories.map(() => '?').join(',');
  const places = await selectPlaces(
    `SELECT id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url
     FROM places
     WHERE category IN (${placeholders})
     LIMIT ?`,
    [...categories, limit]
  );

  const filtered = places.filter((place) => categories.includes(place.category));
  return localizePlaces(filtered.slice(0, limit), language);
}

export async function getPlacesNearby(
  lat: number,
  lon: number,
  radiusKm = 25,
  category?: string,
  language: Language = 'en',
  limit = 50
): Promise<Place[]> {
  const source = category
    ? await getPlacesByCategories([category], language, 200)
    : await getAllPlaces(language, 200);

  return source
    .map((place) => ({ ...place, distanceKm: haversineKm(lat, lon, place.lat, place.lon) }))
    .filter((place) => (place.distanceKm ?? 0) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, limit);
}

export async function getPlacesByRegion(
  region: string,
  category?: string,
  language: Language = 'en',
  limit = 50
): Promise<Place[]> {
  const places = await selectPlaces(
    `SELECT id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url
     FROM places
     WHERE region = ?
     LIMIT ?`,
    [region, limit]
  );

  const filtered = category ? places.filter((place) => place.category === category) : places;
  return localizePlaces(filtered.slice(0, limit), language);
}

export async function getPlacesByIds(ids: string[], language: Language = 'en'): Promise<Place[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const places = await selectPlaces(
    `SELECT id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url
     FROM places
     WHERE id IN (${placeholders})`,
    ids
  );
  const idSet = new Set(ids);
  const order = new Map(ids.map((id, index) => [id, index]));
  return localizePlaces(
    places
      .filter((place) => idSet.has(place.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
    language
  );
}

export async function searchPlaces(
  query: string,
  language: Language = 'en',
  limit = 30
): Promise<Place[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return getAllPlaces(language, limit);

  const places = await selectPlaces(
    `SELECT id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url
     FROM places
     WHERE LOWER(name) LIKE ? OR LOWER(name_en) LIKE ? OR LOWER(region) LIKE ?
     LIMIT ?`,
    [`%${normalized}%`, `%${normalized}%`, `%${normalized}%`, limit]
  );

  return localizePlaces(
    places
      .filter((place) => {
        const haystack = `${place.name} ${place.nameEn ?? ''} ${place.nameKy ?? ''} ${place.region} ${place.category}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, limit),
    language
  );
}

export async function getPlaceCategories(): Promise<Array<{ category: string; count: number }>> {
  const places = await getAllPlaces('en', 500);
  const counts = new Map<string, number>();
  for (const place of places) counts.set(place.category, (counts.get(place.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
