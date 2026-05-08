const appJson = require('./app.json');

const expo = appJson.expo;

module.exports = {
  ...expo,
  extra: {
    ...(expo.extra || {}),
    geminiProxyUrl: process.env.EXPO_PUBLIC_GEMINI_PROXY_URL || '',
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    dgisApiKey: process.env.EXPO_PUBLIC_2GIS_API_KEY || '',
    unsplashAccessKey: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '',
    overpassUrl: process.env.EXPO_PUBLIC_OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
    nominatimUrl: process.env.EXPO_PUBLIC_NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
    wikipediaUrl: process.env.EXPO_PUBLIC_WIKIPEDIA_URL || 'https://en.wikipedia.org/api/rest_v1',
  },
};
