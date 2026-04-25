function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
        `  → Copy .env.example to .env.local and fill in the value.`
    );
  }
  return value;
}

export const env = {
  gemini: {
    apiKey: required('EXPO_PUBLIC_GEMINI_API_KEY'),
  },
  googleMaps: {
    apiKey: required('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'),
  },
  unsplash: {
    accessKey: required('EXPO_PUBLIC_UNSPLASH_ACCESS_KEY'),
    secretKey: required('EXPO_PUBLIC_UNSPLASH_SECRET_KEY'),
  },
  overpass: {
    url: required('EXPO_PUBLIC_OVERPASS_URL'),
  },
  nominatim: {
    url: required('EXPO_PUBLIC_NOMINATIM_URL'),
  },
  wikipedia: {
    url: required('EXPO_PUBLIC_WIKIPEDIA_URL'),
  },
} as const;
