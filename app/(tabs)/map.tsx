import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bike, Car, ChevronDown, ChevronUp, LocateFixed, MapPin, Navigation, Search, SlidersHorizontal, Star, UserRound, X } from 'lucide-react-native';
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
import { optimizeRouteFromOrigin, plan2gisRoute, planPointToPointRoute, placeToLatLon, type LatLon, type PlannedRoute, type RouteTransport } from '../../lib/geo/routing';
import { PlacePhoto } from '../../components/PlacePhoto';

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

const TAB_BAR_HEIGHT = 80;

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
  if (typeof tags.description === 'string') return tags.description;
  const pieces = [
    typeof tags.price_usd === 'number' ? `$${tags.price_usd}` : null,
    typeof tags.entry_fee_usd === 'number' ? `$${tags.entry_fee_usd} entry` : null,
    typeof tags.phone === 'string' ? tags.phone : null,
    typeof tags.opening_hours === 'string' ? tags.opening_hours : null,
    typeof tags.source === 'string' ? `Source: ${tags.source}` : null,
  ].filter(Boolean);
  return pieces.length > 0 ? pieces.join(' · ') : 'Verified tourism point with location, routing and reviews.';
}

function getPlacePhotoUrls(place: Place): string[] {
  const tagPhotos = Array.isArray(place.tags?.dgisPhotos)
    ? place.tags.dgisPhotos.filter((url): url is string => typeof url === 'string')
    : [];
  return [...new Set([place.photoUrl, ...tagPhotos].filter((url): url is string => typeof url === 'string' && url.length > 0))];
}

function routeText(route: PlannedRoute | null) {
  if (!route) return 'Select a point to build a route.';
  const accuracy = route.summary.mode === '2gis_routing'
    ? '2GIS route'
    : 'smart estimate';
  const mode = route.summary.transport === 'walking' ? 'walking' : route.summary.transport === 'bicycle' ? 'bicycle' : 'car';
  return `${route.summary.distanceKm.toFixed(1)} km · ${route.summary.label ?? `${route.summary.durationMin} min`} · ${mode} · ${accuracy}`;
}

function getExternalRating(place: Place) {
  const rating = typeof place.tags?.dgisRating === 'number' ? place.tags.dgisRating : null;
  const count = typeof place.tags?.dgisRatingCount === 'number'
    ? place.tags.dgisRatingCount
    : typeof place.tags?.dgisReviewCount === 'number'
      ? place.tags.dgisReviewCount
      : 0;
  return rating != null ? { rating, count } : null;
}

function calculateCombinedRating(place: Place, localReviews: LocalReview[]) {
  const external = getExternalRating(place);
  const localCount = localReviews.length;
  const localTotal = localReviews.reduce((sum, review) => sum + review.rating, 0);
  const externalCount = external?.count && external.count > 0 ? external.count : external ? 1 : 0;
  const externalTotal = external ? external.rating * externalCount : 0;
  const count = externalCount + localCount;

  if (count === 0) return null;

  return {
    rating: (externalTotal + localTotal) / count,
    count,
    externalRating: external?.rating,
    externalCount,
    localCount,
  };
}

async function geocodeRouteStart(input: string, language: string): Promise<LatLon | null> {
  const clean = input.trim();
  if (!clean) return null;

  const dgisMatches = await searchDgisPlaces(clean, 'Бишкек', language as any);
  const dgisPoint = dgisMatches.find((place) => typeof place.lat === 'number' && typeof place.lon === 'number');
  if (typeof dgisPoint?.lat === 'number' && typeof dgisPoint.lon === 'number') {
    return { latitude: dgisPoint.lat, longitude: dgisPoint.lon };
  }

  const localMatches = await searchPlaces(clean, language as any, 1);
  const localPoint = localMatches[0];
  return localPoint ? placeToLatLon(localPoint) : null;
}

const MapOverlayWrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

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
  const [routeStartText, setRouteStartText] = useState('Current location');
  const [routeStartPoint, setRouteStartPoint] = useState<LatLon | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeRequested, setRouteRequested] = useState(false);
  const [routeStartEdited, setRouteStartEdited] = useState(false);
  const [routeTransport, setRouteTransport] = useState<RouteTransport>('driving');
  const [locating, setLocating] = useState(false);
  const [selectedSheetCollapsed, setSelectedSheetCollapsed] = useState(false);
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
  const routeStartRegion = routeRequested && routeStartPoint && selectedPlace
    ? {
        latitude: (routeStartPoint.latitude + selectedPlace.lat) / 2,
        longitude: (routeStartPoint.longitude + selectedPlace.lon) / 2,
        latitudeDelta: Math.max(Math.abs(routeStartPoint.latitude - selectedPlace.lat) * 1.6, 0.04),
        longitudeDelta: Math.max(Math.abs(routeStartPoint.longitude - selectedPlace.lon) * 1.6, 0.04),
      }
    : null;
  const mapRegion = selectedPlace
    ? routeStartRegion ?? {
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
  const selectedSheetMaxHeight = Platform.OS === 'ios' ? 300 : 286;
  const selectedSheetBottom = TAB_BAR_HEIGHT;

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const normalizedQuery = query.trim();
      const rows = normalizedQuery
        ? [
            ...(await searchPlaces(normalizedQuery, language, 120)),
            ...(await searchDgisPlaces(normalizedQuery, 'Бишкек', language)).flatMap((place): Place[] => {
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
                tags: {
                  source: '2gis',
                  description: place.description,
                  dgisPhotos: place.photoUrls,
                  dgisRating: place.rating,
                  dgisReviewCount: place.reviewCount,
                  dgisRatingCount: place.ratingCount,
                },
                photoUrl: place.photoUrl ?? null,
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
        setPlannedRoute(null);
        setRouteRequested(false);
        setRouteError(null);
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
      if (active) setRoutePlaces(optimized.slice(0, userLocation ? 9 : 10));
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

        const coords = await getCurrentLatLon();
        if (active && coords) {
          setUserLocation(coords);
          setRouteStartPoint((current) => current ?? coords);
          if (!routeStartEdited) setRouteStartText('Current location');
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
  }, [routeStartEdited, strings.map.locationUnavailable]);

  useEffect(() => {
    setPlannedRoute(null);
    setRouteRequested(false);
    setRouteError(null);
    setSelectedSheetCollapsed(false);
  }, [selectedPlace?.id]);

  async function getCurrentLatLon(): Promise<LatLon | null> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocationError(strings.map.locationUnavailable);
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setLocationError(null);
    setUserLocation(coords);
    setUserRegion({
      ...coords,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    });
    return coords;
  }

  async function showMyLocation() {
    setLocating(true);
    try {
      const coords = await getCurrentLatLon();
      if (coords) {
        setSelectedPlace(null);
        setPlannedRoute(null);
        setRouteRequested(false);
        setRouteStartText('Current location');
        setRouteStartEdited(false);
        setRouteStartPoint(coords);
      }
    } catch {
      setLocationError(strings.map.locationUnavailable);
    } finally {
      setLocating(false);
    }
  }

  function openSelectedInMaps() {
    if (!selectedPlace) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(selectedPlace.name)}&ll=${selectedPlace.lat},${selectedPlace.lon}`,
      android: `geo:${selectedPlace.lat},${selectedPlace.lon}?q=${selectedPlace.lat},${selectedPlace.lon}(${encodeURIComponent(selectedPlace.name)})`,
      default: `https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lon}#map=15/${selectedPlace.lat}/${selectedPlace.lon}`,
    });
    if (url) Linking.openURL(url).catch(() => null);
  }

  function openRouteIn2gis() {
    if (selectedPlace && routeStartPoint) {
      const startPlace: Place = {
        id: 'route_start',
        osmId: null,
        name: routeStartText.trim() || 'Start',
        nameEn: null,
        nameKy: null,
        lat: routeStartPoint.latitude,
        lon: routeStartPoint.longitude,
        category: 'rest_point',
        region: 'Route start',
        tags: {},
        photoUrl: null,
      };
      Linking.openURL(buildDgisDirectionsUrl([startPlace, selectedPlace])).catch(() => null);
      return;
    }

    if (routePlaces.length >= 2) {
      Linking.openURL(buildDgisDirectionsUrl(routePlaces)).catch(() => null);
    }
  }

  function leaveSelectedPlace() {
    setSelectedPlace(null);
    setPlannedRoute(null);
    setRouteRequested(false);
    setRouteError(null);
    if (query.trim()) setQuery('');
  }

  async function generateRouteToSelectedPlace() {
    if (!selectedPlace) return;

    setRouteLoading(true);
    setRouteError(null);
    setRouteRequested(true);

    try {
      let start = routeStartPoint;
      const typedStart = routeStartText.trim();
      const usingCurrentLocation = typedStart.length === 0 || typedStart.toLowerCase() === 'current location';

      if (usingCurrentLocation) {
        start = userLocation ?? await getCurrentLatLon();
        if (!start) {
          setRouteError('Current location is unavailable. Enter a start point.');
          setRouteRequested(false);
          return;
        }
        setRouteStartPoint(start);
      } else {
        start = await geocodeRouteStart(typedStart, language);
        if (!start) {
          setRouteError('Could not find that start point.');
          setRouteRequested(false);
          return;
        }
        setRouteStartPoint(start);
      }

      const route = await planPointToPointRoute(start, placeToLatLon(selectedPlace), language, routeTransport);
      setPlannedRoute(route);
    } catch (error) {
      console.warn('[map] route generation failed', error);
      setRouteError('Route generation failed.');
    } finally {
      setRouteLoading(false);
    }
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
  const selectedUserReviews = selectedPlace ? (reviews[selectedPlace.id] ?? []) : [];
  const selectedCombinedRating = selectedPlace
    ? calculateCombinedRating(selectedPlace, selectedUserReviews)
    : null;
  const selectedPhotoUrls = selectedPlace ? getPlacePhotoUrls(selectedPlace) : [];
  const navigationCoordinates = plannedRoute?.points ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.canvas }}>
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
        zIndex: 40, elevation: 40,
      }}>
        <View style={{
          flex: 1, height: 54, borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.96)',
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.82)',
          shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6,
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
          onPress={() => {
            setActiveFilter(filters[0].key);
            setQuery('');
            setSelectedPlace(places[0] ?? null);
          }}
          accessibilityLabel="Reset filters"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 54, height: 54, borderRadius: 22,
            backgroundColor: colors.surface.card, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.82)',
            shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <SlidersHorizontal size={20} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={{ position: 'absolute', top: (insets.top || 0) + 72, left: 0, right: 0, zIndex: 39, elevation: 39 }}>
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
                  height: 36, paddingHorizontal: 15, borderRadius: 999,
                  backgroundColor: active ? colors.brand.cta : 'rgba(255,255,255,0.94)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border.divider,
                  shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
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

      <View style={{ position: 'absolute', right: 16, bottom: (insets.bottom || 0) + 306, gap: 10, zIndex: 45, elevation: 45 }}>
        <Pressable
          onPress={showMyLocation}
          accessibilityLabel={strings.map.useMyLocation}
          accessibilityRole="button"
          hitSlop={10}
          style={({ pressed }) => ({
            width: 52, height: 52, borderRadius: 22, backgroundColor: colors.brand.primary,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 16, elevation: 46, zIndex: 46,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {locating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <LocateFixed size={20} color="#fff" strokeWidth={1.8} />
          )}
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

      <MapOverlayWrapper
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, 20) : 0}
        pointerEvents={Platform.OS === 'web' ? 'auto' : 'box-none'}
        style={{ position: 'absolute', bottom: selectedSheetBottom, left: 16, right: 16, zIndex: 50, elevation: 50 }}
      >
        {selectedPlace ? (
          <View style={{ maxHeight: selectedSheetCollapsed ? undefined : selectedSheetMaxHeight, borderRadius: 20, backgroundColor: colors.surface.card, padding: selectedSheetCollapsed ? 12 : 14, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 51, zIndex: 51 }}>
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
                  {selectedCombinedRating && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <Star size={13} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>
                        {selectedCombinedRating.rating.toFixed(1)}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>
                        ({selectedCombinedRating.count} total · {selectedCombinedRating.localCount} Tabylga)
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary, marginTop: 6 }}>
                    {routeRequested ? routeText(plannedRoute) : 'Generate a route when ready.'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedSheetCollapsed((value) => !value)}
                  accessibilityLabel={selectedSheetCollapsed ? 'Expand place details' : 'Collapse place details'}
                  accessibilityRole="button"
                  hitSlop={12}
                  style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1, zIndex: 60, elevation: 60 })}
                >
                  {selectedSheetCollapsed ? (
                    <ChevronUp size={18} color={colors.brand.primary} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={18} color={colors.brand.primary} strokeWidth={2} />
                  )}
                </Pressable>
                <Pressable
                  onPress={leaveSelectedPlace}
                  accessibilityLabel="Leave place"
                  accessibilityRole="button"
                  hitSlop={12}
                  style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1, zIndex: 60, elevation: 60 })}
                >
                  <X size={17} color={colors.brand.primary} strokeWidth={2} />
                </Pressable>
              </View>

              {!selectedSheetCollapsed && (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: 10 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary }}>
                    {buildTagSummary(selectedPlace)}
                  </Text>

              <View style={{ marginTop: 12, borderRadius: 16, backgroundColor: '#F7F5EF', padding: 12, gap: 8 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>
                  Route to this place
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider, paddingHorizontal: 10, justifyContent: 'center' }}>
                    <TextInput
                      value={routeStartText}
                      onChangeText={(text) => {
                        setRouteStartText(text);
                        setRouteStartEdited(true);
                        setRouteStartPoint(null);
                        setRouteError(null);
                      }}
                      placeholder="Start from current location or type a place"
                      placeholderTextColor={colors.text.tertiary}
                      returnKeyType="route"
                      clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
                      autoCorrect={false}
                      onSubmitEditing={generateRouteToSelectedPlace}
                      style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.primary }}
                    />
                  </View>
                  <Pressable
                    onPress={() => {
                      if (userLocation) {
                        setRouteStartText('Current location');
                        setRouteStartEdited(false);
                        setRouteStartPoint(userLocation);
                        setRouteError(null);
                      }
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
                  >
                    <LocateFixed size={18} color={colors.brand.primary} strokeWidth={2} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([
                    { key: 'driving' as const, label: 'Car', icon: Car },
                    { key: 'bicycle' as const, label: 'Bike', icon: Bike },
                    { key: 'walking' as const, label: 'Walk', icon: UserRound },
                  ]).map((option) => {
                    const selected = routeTransport === option.key;
                    const Icon = option.icon;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => {
                          setRouteTransport(option.key);
                          setPlannedRoute(null);
                          setRouteRequested(false);
                          setRouteError(null);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        style={({ pressed }) => ({
                          flex: 1,
                          height: 36,
                          borderRadius: 11,
                          backgroundColor: selected ? colors.brand.primary : colors.surface.card,
                          borderWidth: selected ? 0 : 1,
                          borderColor: colors.border.divider,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Icon size={14} color={selected ? '#fff' : colors.brand.primary} strokeWidth={2} />
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: selected ? '#fff' : colors.text.primary }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={generateRouteToSelectedPlace}
                    disabled={routeLoading}
                    accessibilityRole="button"
                    style={({ pressed }) => ({ flex: 1, height: 40, borderRadius: 12, backgroundColor: colors.brand.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed || routeLoading ? 0.75 : 1 })}
                  >
                    {routeLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Navigation size={17} color="#fff" strokeWidth={2} />
                    )}
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>
                      {routeLoading ? 'Generating...' : 'Generate route'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={openSelectedInMaps}
                    accessibilityRole="button"
                    style={({ pressed }) => ({ height: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>
                      Maps
                    </Text>
                  </Pressable>
                </View>
                {routeError && (
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.status.error }}>
                    {routeError}
                  </Text>
                )}
              </View>

              {selectedPhotoUrls.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingTop: 12 }}
                >
                  {selectedPhotoUrls.map((url, index) => (
                    <PlacePhoto
                      key={`${url}_${index}`}
                      width={150}
                      height={92}
                      radius={14}
                      tint={PIN_COLORS[selectedPlace.category] ?? colors.brand.primary}
                      imageUrl={url}
                      label={index === 0 ? '2GIS photo' : undefined}
                    />
                  ))}
                </ScrollView>
              )}

              {(routePlaces.length > 1 || (selectedPlace && plannedRoute)) && (
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
                  Reviews{selectedCombinedRating?.externalRating ? ` · 2GIS ${selectedCombinedRating.externalRating.toFixed(1)}` : ''}
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
              )}
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
      </MapOverlayWrapper>
    </View>
  );
}
