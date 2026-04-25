import { env } from '../env';
import { getDb } from '../db/client';
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
  return db.getAllAsync<PlaceRow>(
    `SELECT id, name, lat, lon, category, region, tags FROM places LIMIT 60`
  );
}

function buildPrompt(input: GenerateTripInput, places: PlaceRow[]): string {
  const placesList = places
    .map((p) => `  { "id": "${p.id}", "name": "${p.name}", "category": "${p.category}", "region": "${p.region}", "lat": ${p.lat}, "lon": ${p.lon}, "tags": ${p.tags || '{}'} }`)
    .join(',\n');

  return `You are Tabylga, an AI trip planner specialized in Kyrgyzstan tourism. Generate a realistic, day-by-day itinerary.

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
2. Group activities by region per day to minimize travel time. Don't bounce between distant regions in one day.
3. 3-5 activities per day, with realistic times between 08:00 and 21:00.
4. Estimate realistic costUsd for each activity using tags (entry_fee_usd, price_usd) or sensible defaults: hotel/yurt $35-180/night, restaurant $8-25/meal, attraction $0-5, activity $20-50.
5. totalCostUsd should sum all activities and roughly fit budget × days × travelers.
6. Include 3-5 practical tips (altitude warnings, cash needs, weather, language tips).
7. Title should be evocative and specific to the regions covered (e.g. "5 Days Through the Tien Shan").

Return JSON exactly matching the response schema.`;
}

export async function generateTrip(input: GenerateTripInput): Promise<Itinerary> {
  const places = await fetchAvailablePlaces();
  if (places.length === 0) {
    throw new Error('No places in database. Restart the app to seed.');
  }

  const prompt = buildPrompt(input, places);

  const response = await fetch(`${GEMINI_URL}?key=${env.gemini.apiKey}`, {
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

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 120) || 'request failed'}`);
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
