# Backend Task — Data Pipeline & API Layer

You are responsible for the DATA LAYER of Tabylga. You work ONLY in the files listed below. Do NOT touch anything in app/, components/, stores/, or constants/.

## Your Files (ONLY these)
lib/db/seed-full.ts          ← NEW: full Overpass import script
lib/db/schema.ts             ← ONLY add new tables/indexes, don't remove existing
lib/api/places.ts            ← NEW: query helpers for places table
lib/api/weather.ts           ← NEW: Open-Meteo weather fetch
lib/api/unsplash.ts          ← NEW: Unsplash photo fetcher for places
lib/api/wikipedia.ts         ← NEW: Wikipedia descriptions fetcher
lib/api/nominatim.ts         ← NEW: reverse geocoding helper
scripts/                     ← NEW folder: any Node scripts for data import

## Task 1 — Full Places Import (CRITICAL — do this first)
Create `lib/db/seed-full.ts` that:
1. Calls Overpass API at https://overpass-api.de/api/interpreter
2. Query: all nodes in Kyrgyzstan (ISO3166-1=KG) with tags: tourism=*, amenity=restaurant|cafe|fast_food, natural=peak, historic=*, leisure=park
3. Parses response, maps each element to our places schema: { id (generate uuid), osm_id, name, name_en (from name:en tag), name_ky (from name:ky tag), lat, lon, category (map tourism=hotel→hotel, tourism=guest_house→guesthouse, tourism=camp_site→camping, amenity=restaurant→restaurant, etc.), region (determine from lat/lon which of 7 oblasts: Chuy/Issyk-Kul/Naryn/Osh/Jalal-Abad/Batken/Talas), tags (JSON string of all OSM tags), photo_url (null for now) }
4. Inserts into SQLite places table using batch INSERT (100 rows per transaction)
5. Logs progress: "Imported X/Y places..."
6. Make it idempotent — check if places count > 100 before running

Also create `scripts/import-places.ts` — a standalone script that can be run via `npx ts-node scripts/import-places.ts` to populate the database outside the app.

## Task 2 — API Helper Layer
Create typed query helpers in lib/api/:

`lib/api/places.ts`:
- getPlacesNearby(lat, lon, radiusKm, category?, limit?) → Place[]
- getPlacesByRegion(region, category?, limit?) → Place[]
- getPlacesByIds(ids: string[]) → Place[]
- searchPlaces(query: string, limit?) → Place[]
- getPlaceCategories() → {category: string, count: number}[]
All queries use the SQLite db from lib/db/client.ts.

`lib/api/weather.ts`:
- getCurrentWeather(lat, lon) → { temp, description, icon }
Uses Open-Meteo API (free, no key): https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=temperature_2m,weather_code

`lib/api/unsplash.ts`:
- searchPhotos(query, perPage?) → { url, photographer, photographerUrl }[]
Uses key from lib/env.ts (env.unsplash.accessKey)
Endpoint: https://api.unsplash.com/search/photos?query=X&per_page=Y
Header: Authorization: Client-ID {accessKey}

`lib/api/wikipedia.ts`:
- getPlaceDescription(placeName, lang?) → { extract, description, thumbnailUrl } | null
Endpoint: https://en.wikipedia.org/api/rest_v1/page/summary/{encodedName}

`lib/api/nominatim.ts`:
- reverseGeocode(lat, lon) → { city, region, country }
Endpoint: https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json
Must set User-Agent header to "Tabylga/1.0"

## Architectural Contracts
- Export TypeScript types for all return values
- All functions are async, use try/catch, return null on error (never throw to UI)
- Use the db instance from lib/db/client.ts — don't create your own
- Use env values from lib/env.ts — don't hardcode URLs or keys
- Add JSDoc comments on every exported function

## DO NOT
- Touch any file in app/, components/, stores/, constants/
- Install new packages without asking the team lead first
- Change lib/db/client.ts or lib/db/migrations.ts structure
- Change .env.local
