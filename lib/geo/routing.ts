import { env } from '../env';
import type { Place } from '../api/places';

export interface LatLon {
  latitude: number;
  longitude: number;
}

export type RouteTransport = 'driving' | 'bicycle' | 'walking';

export interface RouteSummary {
  distanceKm: number;
  durationMin: number;
  mode: '2gis_routing' | 'estimated';
  transport: RouteTransport;
  label?: string;
}

export interface PlannedRoute {
  points: LatLon[];
  summary: RouteSummary;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: LatLon, b: LatLon): number {
  const radiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const startLat = toRad(a.latitude);
  const endLat = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function placeToLatLon(place: Place): LatLon {
  return { latitude: place.lat, longitude: place.lon };
}

export function optimizeRouteFromOrigin(origin: LatLon, places: Place[]): Place[] {
  const remaining = [...places];
  const route: Place[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = haversineKm(current, placeToLatLon(remaining[0]));

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = haversineKm(current, placeToLatLon(remaining[index]));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    const next = remaining.splice(bestIndex, 1)[0];
    route.push(next);
    current = placeToLatLon(next);
  }

  return route;
}

export function estimateRoute(points: LatLon[], transport: RouteTransport = 'driving'): PlannedRoute {
  let directKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    directKm += haversineKm(points[index - 1], points[index]);
  }

  const roadAdjustedKm = directKm * 1.28;
  const speedKmh =
    transport === 'walking'
      ? 4.8
      : transport === 'bicycle'
        ? 14
        : roadAdjustedKm > 90
          ? 48
          : 32;
  const durationMin = Math.max(4, Math.round((roadAdjustedKm / speedKmh) * 60));

  return {
    points,
    summary: {
      distanceKm: Number(roadAdjustedKm.toFixed(1)),
      durationMin,
      mode: 'estimated',
      transport,
    },
  };
}

function parseLineString(wkt: unknown): LatLon[] {
  if (typeof wkt !== 'string') return [];
  const match = wkt.match(/^LINESTRING\s*\((.+)\)$/i);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((pair) => {
      const [lonRaw, latRaw] = pair.trim().split(/\s+/);
      const longitude = Number(lonRaw);
      const latitude = Number(latRaw);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : null;
    })
    .filter((point): point is LatLon => point !== null);
}

function compactRoutePoints(points: LatLon[]): LatLon[] {
  return points.filter((point, index, list) => {
    if (index === 0) return true;
    const previous = list[index - 1];
    return previous.latitude !== point.latitude || previous.longitude !== point.longitude;
  });
}

function extract2gisGeometry(route: any): LatLon[] {
  const points: LatLon[] = [];

  points.push(...parseLineString(route?.begin_pedestrian_path?.geometry?.selection));

  if (Array.isArray(route?.maneuvers)) {
    for (const maneuver of route.maneuvers) {
      const geometries = Array.isArray(maneuver?.outcoming_path?.geometry)
        ? maneuver.outcoming_path.geometry
        : [];
      for (const geometry of geometries) {
        points.push(...parseLineString(geometry?.selection));
      }
    }
  }

  points.push(...parseLineString(route?.end_pedestrian_path?.geometry?.selection));

  return compactRoutePoints(points);
}

function routingLocale(language?: string): string {
  switch (language) {
    case 'ru':
    case 'ky':
      return 'ru';
    default:
      return 'en';
  }
}

export async function plan2gisRoute(
  points: LatLon[],
  language = 'en',
  transport: RouteTransport = 'driving',
): Promise<PlannedRoute> {
  const routePoints = points.slice(0, 10);
  if (!env.dgis.apiKey || routePoints.length < 2) {
    return estimateRoute(routePoints, transport);
  }

  try {
    const url = new URL('https://routing.api.2gis.com/routing/7.0.0/global');
    url.searchParams.set('key', env.dgis.apiKey);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points: routePoints.map((point) => ({
          type: 'walking',
          lon: point.longitude,
          lat: point.latitude,
        })),
        transport,
        route_mode: 'fastest',
        traffic_mode: 'jam',
        locale: routingLocale(language),
      }),
    });

    if (!response.ok) return estimateRoute(routePoints, transport);

    const data = await response.json();
    const route = Array.isArray(data?.result) ? data.result[0] : null;
    const geometry = extract2gisGeometry(route);
    const totalDistance = typeof route?.total_distance === 'number' ? route.total_distance : null;
    const totalDuration = typeof route?.total_duration === 'number' ? route.total_duration : null;

    if (!route || geometry.length < 2 || totalDistance == null || totalDuration == null) {
      return estimateRoute(routePoints, transport);
    }

    return {
      points: geometry,
      summary: {
        distanceKm: Number((totalDistance / 1000).toFixed(1)),
        durationMin: Math.max(1, Math.round(totalDuration / 60)),
        mode: '2gis_routing',
        transport,
        label: typeof route?.ui_total_duration === 'string' ? route.ui_total_duration : undefined,
      },
    };
  } catch (error) {
    console.warn('[routing] 2GIS Routing failed, using estimate', error);
    return estimateRoute(routePoints, transport);
  }
}

export async function planPointToPointRoute(
  origin: LatLon,
  destination: LatLon,
  language = 'en',
  transport: RouteTransport = 'driving',
): Promise<PlannedRoute> {
  return plan2gisRoute([origin, destination], language, transport);
}
