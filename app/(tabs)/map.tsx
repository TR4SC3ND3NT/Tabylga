import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocateFixed, MapPin, Navigation, Search, SlidersHorizontal, X } from 'lucide-react-native';
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

type MapFilter = {
  key: string;
  label: string;
  categories: string[];
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
  yurt: '#6a5a4b',
  guesthouse: colors.brand.primary,
  restaurant: colors.brand.cta,
  cafe: colors.brand.cta,
  activity: '#4a5e40',
  attraction: '#4a5d68',
  nature: colors.status.success,
  market: colors.status.warning,
  park: colors.status.success,
  rest_point: '#4a7289',
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const generatedItinerary = useTripStore((s) => s.generatedItinerary);
  const filters = useMemo(() => getFilters(strings), [strings]);

  const [activeFilter, setActiveFilter] = useState(filters[0].key);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [routePlaces, setRoutePlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<MapRegion | null>(null);

  const routePlaceIds = useMemo(() => {
    if (!generatedItinerary) return [];
    const ids = generatedItinerary.days.flatMap((day) => day.activities.map((activity) => activity.placeId));
    return [...new Set(ids)];
  }, [generatedItinerary]);

  const currentFilter = filters.find((filter) => filter.key === activeFilter) ?? filters[0];
  const mapRegion = selectedPlace
    ? {
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lon,
        latitudeDelta: 0.18,
        longitudeDelta: 0.18,
      }
    : userRegion ?? (
        routePlaces[0]
          ? { latitude: routePlaces[0].lat, longitude: routePlaces[0].lon, latitudeDelta: 2.4, longitudeDelta: 2.4 }
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

    return () => { active = false; };
  }, [activeFilter, currentFilter.categories, language, query]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (routePlaceIds.length === 0) {
        if (active) setRoutePlaces([]);
        return;
      }

      const rows = await getPlacesByIds(routePlaceIds, language);
      const optimized = optimizeRouteByNearestNeighbor(rows).slice(0, 12);
      if (active) setRoutePlaces(optimized);
    })().catch((error) => {
      console.warn('[map] route places failed', error);
      if (active) setRoutePlaces([]);
    });

    return () => { active = false; };
  }, [language, routePlaceIds]);

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
          setUserRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          });
        }
      } catch {
        if (active) setLocationError(strings.map.locationUnavailable);
      }
    })();

    return () => { active = false; };
  }, [strings.map.locationUnavailable]);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#E8E8E0' }}>
      <StatusBar style="dark" />

      <MapCanvas
        places={places}
        selectedPlace={selectedPlace}
        routePlaces={routePlaces}
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

      <View style={{ position: 'absolute', right: 16, bottom: (insets.bottom || 0) + 210, gap: 10 }}>
        <Pressable
          onPress={() => userRegion && setSelectedPlace(null)}
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
          <View style={{ borderRadius: 18, backgroundColor: colors.surface.card, padding: 14, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: PIN_COLORS[selectedPlace.category] ?? colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={24} color="#fff" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary }} numberOfLines={1}>
                  {selectedPlace.name}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, marginTop: 3 }}>
                  {selectedPlace.category} · {selectedPlace.region}
                </Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary, marginTop: 6 }}>
                  {formatString(strings.map.placesFound, { count: places.length })}
                </Text>
              </View>
              <Pressable
                onPress={openSelectedInMaps}
                accessibilityLabel={strings.map.openInMaps}
                accessibilityRole="button"
                style={({ pressed }) => ({ paddingHorizontal: 12, height: 34, borderRadius: 999, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.brand.primary }}>
                  {strings.map.openInMaps}
                </Text>
              </Pressable>
            </View>
            {routePlaces.length > 1 && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.divider, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.status.warningLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Navigation size={18} color={colors.brand.cta} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text.primary }}>
                    {strings.map.routeTitle}
                  </Text>
                  <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.text.secondary, marginTop: 2 }}>
                    {strings.map.routeSubtitle}
                  </Text>
                </View>
                <Pressable
                  onPress={openRouteIn2gis}
                  accessibilityRole="button"
                  accessibilityLabel={strings.map.openIn2gis}
                  style={({ pressed }) => ({ paddingHorizontal: 10, height: 32, borderRadius: 999, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff' }}>
                    2GIS
                  </Text>
                </Pressable>
              </View>
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
      </View>
    </View>
  );
}
