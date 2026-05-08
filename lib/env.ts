import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function fromExpoExtra(key: string): string {
  const value = extra[key];
  return typeof value === 'string' ? value : '';
}

export const env = {
  gemini: {
    proxyUrl: process.env.EXPO_PUBLIC_GEMINI_PROXY_URL || fromExpoExtra('geminiProxyUrl'),
  },
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || fromExpoExtra('googleMapsApiKey'),
  },
  dgis: {
    apiKey: process.env.EXPO_PUBLIC_2GIS_API_KEY || fromExpoExtra('dgisApiKey'),
  },
  unsplash: {
    accessKey: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || fromExpoExtra('unsplashAccessKey'),
  },
  overpass: {
    url: process.env.EXPO_PUBLIC_OVERPASS_URL || fromExpoExtra('overpassUrl') || 'https://overpass-api.de/api/interpreter',
  },
  nominatim: {
    url: process.env.EXPO_PUBLIC_NOMINATIM_URL || fromExpoExtra('nominatimUrl') || 'https://nominatim.openstreetmap.org',
  },
  wikipedia: {
    url: process.env.EXPO_PUBLIC_WIKIPEDIA_URL || fromExpoExtra('wikipediaUrl') || 'https://en.wikipedia.org/api/rest_v1',
  },
} as const;
