function optional(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

export const env = {
  gemini: {
    apiKey: optional('EXPO_PUBLIC_GEMINI_API_KEY'),
  },
  googleMaps: {
    apiKey: optional('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'),
  },
  dgis: {
    apiKey: optional('EXPO_PUBLIC_2GIS_API_KEY'),
  },
  unsplash: {
    accessKey: optional('EXPO_PUBLIC_UNSPLASH_ACCESS_KEY'),
    secretKey: optional('EXPO_PUBLIC_UNSPLASH_SECRET_KEY'),
  },
  overpass: {
    url: optional('EXPO_PUBLIC_OVERPASS_URL', 'https://overpass-api.de/api/interpreter'),
  },
  nominatim: {
    url: optional('EXPO_PUBLIC_NOMINATIM_URL', 'https://nominatim.openstreetmap.org'),
  },
  wikipedia: {
    url: optional('EXPO_PUBLIC_WIKIPEDIA_URL', 'https://en.wikipedia.org/api/rest_v1'),
  },
} as const;
