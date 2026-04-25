export const env = {
  gemini: {
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  },
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  dgis: {
    apiKey: process.env.EXPO_PUBLIC_2GIS_API_KEY || '',
  },
  unsplash: {
    accessKey: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '',
    secretKey: process.env.EXPO_PUBLIC_UNSPLASH_SECRET_KEY || '',
  },
  overpass: {
    url: process.env.EXPO_PUBLIC_OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
  },
  nominatim: {
    url: process.env.EXPO_PUBLIC_NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
  },
  wikipedia: {
    url: process.env.EXPO_PUBLIC_WIKIPEDIA_URL || 'https://en.wikipedia.org/api/rest_v1',
  },
} as const;
