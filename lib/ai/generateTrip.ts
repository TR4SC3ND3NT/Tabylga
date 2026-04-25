import { env } from '../env';
import { getDb } from '../db/client';
import { SEED_PLACES } from '../db/seed';
import type {
  Purpose, Companions, ActivityLevel, BudgetRange, Interest, Dietary,
} from '../../stores/tripStore';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface ItineraryActivity {
  time: string;
  placeId: string;
  placeName: string;
  duration: string;
  description: string;
  costUsd: number;
}

export interface ItineraryDay {
  day: number;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  title: string;
  days: ItineraryDay[];
  totalCostUsd: number;
  regionsCovered: string[];
  tips: string[];
}

export interface GenerateTripInput {
  purpose: Purpose;
  companions: Companions;
  companionCount: number;
  kidsAgeRange: string | null;
  days: number;
  budget: BudgetRange;
  activityLevel: ActivityLevel;
  interests: Interest[];
  dietaryNeeds: Dietary[];
}

interface PlaceRow {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  region: string;
  tags: string | null;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'INTEGER' },
          activities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                time: { type: 'STRING' },
                placeId: { type: 'STRING' },
                placeName: { type: 'STRING' },
                duration: { type: 'STRING' },
                description: { type: 'STRING' },
                costUsd: { type: 'NUMBER' },
              },
              required: ['time', 'placeId', 'placeName', 'duration', 'description', 'costUsd'],
            },
          },
        },
        required: ['day', 'activities'],
      },
    },
    totalCostUsd: { type: 'NUMBER' },
    regionsCovered: { type: 'ARRAY', items: { type: 'STRING' } },
    tips: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'days', 'totalCostUsd', 'regionsCovered', 'tips'],
};

async function fetchAvailablePlaces(): Promise<PlaceRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PlaceRow>(
    `SELECT id, name, lat, lon, category, region, tags FROM places LIMIT 60`
  );
  if (rows.length > 0) return rows;
  return SEED_PLACES.slice(0, 60).map((place) => ({
    id: place.id,
    name: place.name,
    lat: place.lat,
    lon: place.lon,
    category: place.category,
    region: place.region,
    tags: place.tags,
  }));
}

function buildPrompt(input: GenerateTripInput, places: PlaceRow[]): string {
  const placesList = places
    .map((p) => `  { "id": "${p.id}", "name": "${p.name}", "category": "${p.category}", "region": "${p.region}", "lat": ${p.lat}, "lon": ${p.lon}, "tags": ${p.tags || '{}'} }`)
    .join(',\n');

  return `You are Tabylga, a senior AI trip planner and logistics optimizer specialized in Kyrgyzstan tourism. Generate a realistic, monetizable, day-by-day itinerary.

TRAVELER PREFERENCES:
- Purpose: ${input.purpose}
- Companions: ${input.companions} (${input.companionCount} travelers${input.kidsAgeRange ? `, kids ${input.kidsAgeRange}` : ''})
- Trip length: ${input.days} days
- Budget per person: $${input.budget}
- Activity level: ${input.activityLevel}
- Interests: ${input.interests.join(', ') || 'general'}
- Dietary/accessibility: ${input.dietaryNeeds.length ? input.dietaryNeeds.join(', ') : 'none'}

AVAILABLE PLACES (you must use these — do not invent locations):
[
${placesList}
]

REQUIREMENTS:
1. Use ONLY places from the list above. Reference each by its exact "id" and "name".
2. Build a short route: group activities by region, avoid long backtracking, and keep each day geographically coherent.
3. 3-5 activities per day, with realistic times between 08:00 and 21:00. Put hotels/yurts at the start or end of a day.
4. Estimate realistic costUsd using tags (entry_fee_usd, price_usd) or defaults: hotel/yurt $35-180/night, restaurant $8-25/meal, taxi/transfer $5-70, attraction $0-5, activity $20-50.
5. totalCostUsd should sum all activities and roughly fit budget × days × travelers.
6. Respect companions and age-sensitive constraints: family/couple/solo/business trips should feel different.
7. Include practical tips for monetizable flows: QR payment, cash backup, eSIM, altitude, weather, language, and when to book transport.
8. Title should be evocative and specific to the regions covered (e.g. "5 Days Through the Tien Shan").

Return JSON exactly matching the response schema.`;
}

export async function generateTrip(input: GenerateTripInput): Promise<Itinerary> {
  const places = await fetchAvailablePlaces();
  if (places.length === 0) {
    throw new Error('No places in database. Restart the app to seed.');
  }

  if (!env.gemini.apiKey) {
    return buildFallbackItinerary(input, places);
  }

  const prompt = buildPrompt(input, places);

  let response: Response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${env.gemini.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });
  } catch (error) {
    console.warn('[ai] Gemini request failed, using fallback itinerary', error);
    return buildFallbackItinerary(input, places);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.warn(`[ai] Gemini API ${response.status}: ${errText.slice(0, 120) || 'request failed'}`);
    return buildFallbackItinerary(input, places);
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textPart) {
    throw new Error('Gemini returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textPart);
  } catch {
    throw new Error('Gemini returned malformed JSON.');
  }

  if (!isValidItinerary(parsed)) {
    throw new Error('AI response did not match expected itinerary shape.');
  }
  return parsed;
}

function buildFallbackItinerary(input: GenerateTripInput, places: PlaceRow[]): Itinerary {
  const preferred = places.filter((place) => {
    if (input.interests.includes('food') && ['restaurant', 'cafe', 'market'].includes(place.category)) return true;
    if (input.interests.includes('nature') && place.category === 'nature') return true;
    if (input.interests.includes('culture') && ['attraction', 'market'].includes(place.category)) return true;
    if (input.interests.includes('extreme_sports') && place.category === 'activity') return true;
    return ['nature', 'attraction', 'activity', 'restaurant', 'hotel', 'yurt'].includes(place.category);
  });
  const pool = preferred.length >= input.days * 3 ? preferred : places;
  const perDay = Math.min(4, Math.max(3, Math.ceil(pool.length / input.days)));
  const days: ItineraryDay[] = [];
  let totalCostUsd = 0;

  for (let day = 1; day <= input.days; day += 1) {
    const dayPlaces = Array.from({ length: perDay }, (_, index) =>
      pool[((day - 1) * perDay + index) % pool.length]
    );
    const activities = dayPlaces
      .map((place, index) => {
        const tags = safeParseTags(place.tags);
        const costUsd =
          numberTag(tags.price_usd) ??
          numberTag(tags.entry_fee_usd) ??
          (place.category === 'restaurant' || place.category === 'cafe' ? 14 : 0);

        totalCostUsd += costUsd;
        return {
          time: ['09:00', '12:30', '15:30', '19:00'][index] ?? '10:00',
          placeId: place.id,
          placeName: place.name,
          duration: place.category === 'restaurant' || place.category === 'cafe' ? '1.5h' : '2h',
          description: `${place.category} in ${place.region}`,
          costUsd,
        };
      });

    days.push({ day, activities });
  }

  const regionsCovered = [...new Set(days.flatMap((day) =>
    day.activities
      .map((activity) => places.find((place) => place.id === activity.placeId)?.region)
      .filter((region): region is string => !!region)
  ))];

  return {
    title: `${input.days} Days Across Kyrgyzstan`,
    days,
    totalCostUsd: Math.max(totalCostUsd, input.days * 45),
    regionsCovered,
    tips: [
      'Carry some cash for remote valleys while keeping offline wallet enabled.',
      'Mountain weather changes quickly, so pack layers even in summer.',
      'Book transport between regions early; distances are longer than they look on the map.',
    ],
  };
}

function safeParseTags(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function numberTag(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isValidItinerary(x: unknown): x is Itinerary {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    Array.isArray(o.days) &&
    typeof o.totalCostUsd === 'number' &&
    Array.isArray(o.regionsCovered) &&
    Array.isArray(o.tips)
  );
}
