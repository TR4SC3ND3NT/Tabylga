import { env } from '../env';
import type { Place } from '../api/places';

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface RouteSummary {
  distanceKm: number;
  durationMin: number;
  mode: 'directions_api' | 'estimated';
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

export function estimateRoute(points: LatLon[]): PlannedRoute {
  let directKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    directKm += haversineKm(points[index - 1], points[index]);
  }

  const roadAdjustedKm = directKm * 1.28;
  const mountainSpeedKmh = roadAdjustedKm > 90 ? 48 : 32;
  const durationMin = Math.max(4, Math.round((roadAdjustedKm / mountainSpeedKmh) * 60));

  return {
    points,
    summary: {
      distanceKm: Number(roadAdjustedKm.toFixed(1)),
      durationMin,
      mode: 'estimated',
    },
  };
}

export async function planPointToPointRoute(origin: LatLon, destination: LatLon): Promise<PlannedRoute> {
  if (!env.googleMaps.apiKey) {
    return estimateRoute([origin, destination]);
  }

  const originParam = `${origin.latitude},${origin.longitude}`;
  const destinationParam = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originParam}&destination=${destinationParam}&mode=driving&key=${env.googleMaps.apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return estimateRoute([origin, destination]);
    const data = await response.json();
    const route = data?.routes?.[0];
    const leg = route?.legs?.[0];
    const steps = Array.isArray(leg?.steps) ? leg.steps : [];
    const points = steps.flatMap((step: any): LatLon[] => {
      const start = step?.start_location;
      const end = step?.end_location;
      const result: LatLon[] = [];
      if (typeof start?.lat === 'number' && typeof start?.lng === 'number') {
        result.push({ latitude: start.lat, longitude: start.lng });
      }
      if (typeof end?.lat === 'number' && typeof end?.lng === 'number') {
        result.push({ latitude: end.lat, longitude: end.lng });
      }
      return result;
    });

    if (!leg || points.length < 2) return estimateRoute([origin, destination]);

    return {
      points,
      summary: {
        distanceKm: Number(((leg.distance?.value ?? 0) / 1000).toFixed(1)),
        durationMin: Math.max(1, Math.round((leg.duration?.value ?? 0) / 60)),
        mode: 'directions_api',
      },
    };
  } catch (error) {
    console.warn('[routing] Google Directions failed, using estimate', error);
    return estimateRoute([origin, destination]);
  }
}
