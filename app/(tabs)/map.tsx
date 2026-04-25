import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocateFixed, MapPin, Navigation, Search, SlidersHorizontal, Star, X } from 'lucide-react-native';
import { MapCanvas } from '../../components/map/MapCanvas';
import type { MapRegion } from '../../components/map/MapCanvas.types';
import { useAuthStore } from '../../stores/authStore';
import { useTripStore } from '../../stores/tripStore';
import { useStrings } from '../../lib/i18n';
import { formatString } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { buildDgisDirectionsUrl, searchDgisPlaces } from '../../lib/api/dgis';
import { getAllPlaces, getPlacesByCategories, getPlacesByIds, searchPlaces, type Place } from '../../lib/api/places';
import { optimizeRouteByNearestNeighbor } from '../../lib/backend/demoBackend';
import { estimateRoute, optimizeRouteFromOrigin, planPointToPointRoute, placeToLatLon, type LatLon, type PlannedRoute } from '../../lib/geo/routing';

type MapFilter = {
  key: string;
  label: string;
  categories: string[];
};

type LocalReview = {
  author: string;
  rating: number;
  text: string;
};

const KYRGYZSTAN_REGION: MapRegion = {
  latitude: 41.2044,
  longitude: 74.7661,
  latitudeDelta: 5.8,
  longitudeDelta: 8.8,
};

const PIN_COLORS: Record<string, string> = {
  hotel: colors.brand.primary,
  hostel: colors.brand.primary,
  yurt: '#6A5A4B',
  guesthouse: colors.brand.primary,
  restaurant: colors.brand.cta,
  cafe: '#A84A2B',
  activity: '#4A6B40',
  attraction: '#4A5D68',
  nature: colors.status.success,
  market: colors.status.warning,
  park: colors.status.success,
  rest_point: '#4A7289',
  atm: '#2A2922',
};

function getFilters(strings: ReturnType<typeof useStrings>): MapFilter[] {
  return [
    { key: 'all', label: strings.map.filterAll, categories: [] },
    { key: 'hotels', label: strings.map.filterHotels, categories: ['hotel', 'hostel', 'yurt', 'guesthouse'] },
    { key: 'food', label: strings.map.filterFood, categories: ['restaurant', 'cafe', 'market'] },
    { key: 'activities', label: strings.map.filterActivities, categories: ['activity', 'attraction'] },
    { key: 'nature', label: strings.map.filterNature, categories: ['nature', 'park'] },
    { key: 'rest', label: strings.map.filterRestPoints, categories: ['rest_point'] },
    { key: 'atm', label: strings.map.filterAtms, categories: ['atm'] },
  ];
}

function prettyCategory(category: string) {
  return category.replace(/_/g, ' ');
}

function buildDefaultReviews(place: Place): LocalReview[] {
  const category = prettyCategory(place.category);
  return [
    {
      author: 'Verified traveler',
      rating: place.category === 'hotel' || place.category === 'yurt' ? 4.8 : 4.6,
      text: `Reliable ${category} in ${place.region}. Payment and route info are available in Tabylga.`,
    },
  ];
}

function buildTagSummary(place: Place) {
  const tags = place.tags ?? {};
  const pieces = [
    typeof tags.price_usd === 'number' ? `$${tags.price_usd}` : null,
    typeof tags.entry_fee_usd === 'number' ? `$${tags.entry_fee_usd} entry` : null,
    typeof tags.phone === 'string' ? tags.phone : null,
    typeof tags.opening_hours === 'string' ? tags.opening_hours : null,
    typeof tags.source === 'string' ? `Source: ${tags.source}` : null,
  ].filter(Boolean);
  return pieces.length > 0 ? pieces.join(' · ') : 'Verified tourism point with location, routing and reviews.';
}

function routeText(route: PlannedRoute | null) {
  if (!route) return 'Select a point to build a route.';
  const accuracy = route.summary.mode === 'directions_api' ? 'road route' : 'smart estimate';
  return `${route.summary.distanceKm.toFixed(1)} km · ${route.summary.durationMin} min · ${accuracy}`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const params = useLocalSearchParams<{ q?: string }>();
  const language = useAuthStore((s) => s.language);
  const generatedItinerary = useTripStore((s) => s.generatedItinerary);
  const filters = useMemo(() => getFilters(strings), [strings]);

  const [activeFilter, setActiveFilter] = useState(filters[0].key);
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [places, setPlaces] = useState<Place[]>([]);
  const [routePlaces, setRoutePlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<MapRegion | null>(null);
  const [userLocation, setUserLocation] = useState<LatLon | null>(null);
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [reviews, setReviews] = useState<Record<string, LocalReview[]>>({});
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    if (typeof params.q === 'string') setQuery(params.q);
  }, [params.q]);

  const routePlaceIds = useMemo(() => {
    if (!generatedItinerary) return [];
    const ids = generatedItinerary.dailyPlans.flatMap((day) => day.activities.map((activity) => activity.id));
    return [...new Set(ids)];
  }, [generatedItinerary]);

  const currentFilter = filters.find((filter) => filter.key === activeFilter) ?? filters[0];
  const mapRegion = selectedPlace
    ? {
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lon,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : userRegion ?? (
        routePlaces[0]
          ? { latitude: routePlaces[0].lat, longitude: routePlaces[0].lon, latitudeDelta: 1.8, longitudeDelta: 1.8 }
          : KYRGYZSTAN_REGION
      );

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const normalizedQuery = query.trim();
      const rows = normalizedQuery
        ? [
            ...(await searchPlaces(normalizedQuery, language, 120)),
            ...(await searchDgisPlaces(normalizedQuery)).flatMap((place): Place[] => {
              if (typeof place.lat !== 'number' || typeof place.lon !== 'number') return [];
              return [{
                id: `dgis_${place.id}`,
                osmId: null,
                name: place.name,
                nameEn: null,
                nameKy: null,
                lat: place.lat,
                lon: place.lon,
                category: 'attraction',
                region: place.address ?? '2GIS',
                tags: { source: '2gis' },
                photoUrl: null,
              }];
            }),
          ]
        : currentFilter.categories.length > 0
          ? await getPlacesByCategories(currentFilter.categories, language, 120)
          : await getAllPlaces(language, 120);

      const filtered = currentFilter.categories.length > 0
        ? rows.filter((place) => currentFilter.categories.includes(place.category))
        : rows;

      if (active) {
        setPlaces(filtered);
        setSelectedPlace((current) => current && filtered.some((place) => place.id === current.id) ? current : filtered[0] ?? null);
        setLoading(false);
      }
    })().catch((error) => {
      console.warn('[map] load places failed', error);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [activeFilter, currentFilter.categories, language, query]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (routePlaceIds.length === 0) {
        if (active) setRoutePlaces([]);
        return;
      }

      const rows = await getPlacesByIds(routePlaceIds, language);
      const optimized = userLocation
        ? optimizeRouteFromOrigin(userLocation, rows).slice(0, 12)
        : optimizeRouteByNearestNeighbor(rows).slice(0, 12);
      if (active) setRoutePlaces(optimized);
    })().catch((error) => {
      console.warn('[map] route places failed', error);
      if (active) setRoutePlaces([]);
    });

    return () => {
      active = false;
    };
  }, [language, routePlaceIds, userLocation]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (active) setLocationError(strings.map.locationUnavailable);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (active) {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(coords);
          setUserRegion({
            ...coords,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          });
        }
      } catch {
        if (active) setLocationError(strings.map.locationUnavailable);
      }
    })();

    return () => {
      active = false;
    };
  }, [strings.map.locationUnavailable]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (userLocation && selectedPlace) {
        const route = await planPointToPointRoute(userLocation, placeToLatLon(selectedPlace));
        if (active) setPlannedRoute(route);
        return;
      }

      if (userLocation && routePlaces.length > 0) {
        if (active) setPlannedRoute(estimateRoute([userLocation, ...routePlaces.map(placeToLatLon)]));
        return;
      }

      if (selectedPlace) {
        if (active) setPlannedRoute(estimateRoute([KYRGYZSTAN_REGION, placeToLatLon(selectedPlace)]));
        return;
      }

      if (active) setPlannedRoute(null);
    })();

    return () => {
      active = false;
    };
  }, [routePlaces, selectedPlace, userLocation]);

  function openSelectedInMaps() {
    if (!selectedPlace) return;
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(selectedPlace.name)}&ll=${selectedPlace.lat},${selectedPlace.lon}`,
      android: `geo:${selectedPlace.lat},${selectedPlace.lon}?q=${selectedPlace.lat},${selectedPlace.lon}(${encodeURIComponent(selectedPlace.name)})`,
      default: `https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lon}#map=15/${selectedPlace.lat}/${selectedPlace.lon}`,
    });
    if (url) Linking.openURL(url).catch(() => null);
  }

  function openRouteIn2gis() {
    if (routePlaces.length < 2) return;
    Linking.openURL(buildDgisDirectionsUrl(routePlaces)).catch(() => null);
  }

  function submitReview() {
    if (!selectedPlace || !draftText.trim()) return;
    setReviews((current) => ({
      ...current,
      [selectedPlace.id]: [
        { author: 'You', rating: draftRating, text: draftText.trim() },
        ...(current[selectedPlace.id] ?? []),
      ],
    }));
    setDraftText('');
    setDraftRating(5);
  }

  const selectedReviews = selectedPlace
    ? [...(reviews[selectedPlace.id] ?? []), ...buildDefaultReviews(selectedPlace)]
    : [];
  const navigationCoordinates = plannedRoute?.points ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#E8E8E0' }}>
      <StatusBar style="dark" />

      <MapCanvas
        places={places}
        selectedPlace={selectedPlace}
        routePlaces={selectedPlace ? [] : routePlaces}
        navigationCoordinates={navigationCoordinates}
        region={mapRegion}
        initialRegion={KYRGYZSTAN_REGION}
        pinColors={PIN_COLORS}
        routePointsLabel={strings.map.routePoints}
        routeMoreLabel={formatString(strings.map.routeMore, { count: Math.max(routePlaces.length - 4, 0) })}
        onSelectPlace={setSelectedPlace}
      />

      <View style={{
        position: 'absolute', top: (insets.top || 0) + 8, left: 16, right: 16,
        flexDirection: 'row', gap: 10,
      }}>
        <View style={{
          flex: 1, height: 52, borderRadius: 14,
          backgroundColor: colors.surface.card,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
          shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
        }}>
          <Search size={18} color={colors.text.tertiary} strokeWidth={1.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={strings.map.searchPlaceholder}
            placeholderTextColor={colors.text.tertiary}
            accessibilityLabel={strings.map.searchPlaceholder}
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.primary }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel={strings.common.close}>
              <X size={18} color={colors.text.tertiary} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setSelectedPlace(places[0] ?? null)}
          accessibilityLabel={strings.map.filterAll}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 52, height: 52, borderRadius: 14,
            backgroundColor: colors.surface.card, alignItems: 'center', justifyContent: 'center',
            shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <SlidersHorizontal size={20} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={{ position: 'absolute', top: (insets.top || 0) + 72, left: 0, right: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filters.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                accessibilityLabel={filter.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  height: 34, paddingHorizontal: 14, borderRadius: 999,
                  backgroundColor: active ? colors.brand.primary : colors.surface.card,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: active ? '#fff' : colors.text.primary }}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ position: 'absolute', right: 16, bottom: (insets.bottom || 0) + 306, gap: 10 }}>
        <Pressable
          onPress={() => {
            if (userRegion) {
              setSelectedPlace(null);
            }
          }}
          accessibilityLabel={strings.map.useMyLocation}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface.card,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <LocateFixed size={20} color={colors.brand.primary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {loading && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <View style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.brand.primary} size="small" />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>
              {strings.map.loadingPlaces}
            </Text>
          </View>
        </View>
      )}

      <View style={{ position: 'absolute', bottom: (insets.bottom || 0) + 92, left: 16, right: 16 }}>
        {selectedPlace ? (
          <View style={{ maxHeight: 286, borderRadius: 20, backgroundColor: colors.surface.card, padding: 14, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: PIN_COLORS[selectedPlace.category] ?? colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} color="#fff" strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }} numberOfLines={1}>
                    {selectedPlace.name}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary, marginTop: 3 }}>
                    {prettyCategory(selectedPlace.category)} · {selectedPlace.region}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary, marginTop: 6 }}>
                    {routeText(plannedRoute)}
                  </Text>
                </View>
                <Pressable
                  onPress={openSelectedInMaps}
                  accessibilityLabel={strings.map.openInMaps}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ paddingHorizontal: 12, height: 34, borderRadius: 999, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>
                    {strings.map.openInMaps}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 10 }}>
                {buildTagSummary(selectedPlace)}
              </Text>

              {routePlaces.length > 1 && (
                <Pressable
                  onPress={openRouteIn2gis}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ marginTop: 10, borderRadius: 14, backgroundColor: colors.status.warningLight, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.75 : 1 })}
                >
                  <Navigation size={18} color={colors.brand.cta} strokeWidth={2} />
                  <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>
                    {strings.map.openIn2gis}
                  </Text>
                </Pressable>
              )}

              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.divider }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginBottom: 8 }}>
                  Reviews
                </Text>
                {selectedReviews.slice(0, 2).map((review, index) => (
                  <View key={`${review.author}_${index}`} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>
                        {review.rating.toFixed(1)} · {review.author}
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.text.secondary, marginTop: 2 }}>
                      {review.text}
                    </Text>
                  </View>
                ))}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setDraftRating(star)} accessibilityRole="button">
                      <Star size={18} color={colors.status.warning} fill={star <= draftRating ? colors.status.warning : 'transparent'} strokeWidth={star <= draftRating ? 0 : 1.8} />
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <TextInput
                    value={draftText}
                    onChangeText={setDraftText}
                    placeholder="Leave a review"
                    placeholderTextColor={colors.text.tertiary}
                    style={{ flex: 1, height: 38, borderRadius: 12, backgroundColor: '#F7F5EF', paddingHorizontal: 12, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.primary }}
                  />
                  <Pressable
                    onPress={submitReview}
                    accessibilityRole="button"
                    style={({ pressed }) => ({ height: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>
                {locationError ?? (places.length === 0 ? strings.map.noPlaces : strings.map.tapPinHint)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
