import { env } from '../env';
import type { Place } from './places';

export interface DgisPlace {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
}

export function hasDgisKey(): boolean {
  return env.dgis.apiKey.length > 0;
}

export function buildDgisDirectionsUrl(points: Place[]): string {
  const routePoints = points
    .map((point) => `${point.lon},${point.lat}`)
    .join('/');
  return `https://2gis.kg/directions/points/${routePoints}`;
}

export async function searchDgisPlaces(query: string, city = 'Бишкек'): Promise<DgisPlace[]> {
  if (!env.dgis.apiKey || !query.trim()) return [];

  try {
    const url = new URL('https://catalog.api.2gis.com/3.0/items');
    url.searchParams.set('q', `${query}, ${city}`);
    url.searchParams.set('fields', 'items.point,items.address_name');
    url.searchParams.set('key', env.dgis.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = await response.json();
    const items = Array.isArray(data?.result?.items) ? data.result.items : [];
    return items.slice(0, 10).map((item: any) => ({
      id: String(item.id),
      name: String(item.name ?? query),
      address: item.address_name ? String(item.address_name) : undefined,
      lat: typeof item.point?.lat === 'number' ? item.point.lat : undefined,
      lon: typeof item.point?.lon === 'number' ? item.point.lon : undefined,
    }));
  } catch (error) {
    console.warn('[2gis] search failed', error);
    return [];
  }
}
