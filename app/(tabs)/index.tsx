import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Search,
  Mic,
  User,
  Bed,
  Utensils,
  Car,
  Mountain,
  Sparkles,
  Star,
  MapPin,
  Map,
  Route,
  WalletCards,
} from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { useAuthStore } from '../../stores/authStore';
import { useTravelPreferencesStore } from '../../stores/travelPreferencesStore';
import { useTripStore } from '../../stores/tripStore';
import {
  DGIS_BUSINESS_RUBRICS,
  getDgisBusinessSection,
  type DgisSearchResult,
} from '../../lib/api/dgis';
import { formatUSD } from '../../lib/format';
import { KyrgyzBackdrop } from '../../components/KyrgyzBackdrop';
import { PlacePhoto } from '../../components/PlacePhoto';

interface PlaceCard {
  id: string;
  name: string;
  subtitle: string;
  bgTint: string;
  rating?: number;
  description?: string;
  imageUrl?: string;
  hasPhotos?: boolean;
}

type ServiceKey = "hotels" | "food" | "transport" | "activities";

function formatServiceSubtitle(count: number | undefined, fallback: string) {
  return typeof count === "number" && count > 0 ? `2GIS · ${count}` : fallback;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const guestSessionId = useAuthStore((s) => s.guestSessionId);
  const startGuestSession = useAuthStore((s) => s.startGuestSession);
  const currentTrip = useTripStore((s) => s.generatedItinerary);
  const setEntryMode = useTripStore((s) => s.setEntryMode);
  const peopleCount = useTravelPreferencesStore((s) => s.peopleCount);
  const age = useTravelPreferencesStore((s) => s.age);
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const [trending, setTrending] = useState<PlaceCard[]>([]);
  const [serviceCounts, setServiceCounts] = useState<
    Partial<Record<ServiceKey, number>>
  >({});
  const [homeLoading, setHomeLoading] = useState(true);

  const serviceTiles = [
    {
      key: "hotels" as const,
      icon: Bed,
      label: strings.home.serviceHotels,
      sub: formatServiceSubtitle(serviceCounts.hotels, "Live on 2GIS"),
      bg: colors.brand.primary,
      route: "/services/hotels",
    },
    {
      key: "food" as const,
      icon: Utensils,
      label: strings.home.serviceFood,
      sub: formatServiceSubtitle(
        serviceCounts.food,
        strings.home.serviceFoodSub,
      ),
      bg: colors.brand.cta,
      route: "/services/food",
    },
    {
      key: "transport" as const,
      icon: Car,
      label: strings.home.serviceTransport,
      sub: formatServiceSubtitle(
        serviceCounts.transport,
        strings.home.serviceTransportSub,
      ),
      bg: colors.accent.mint,
      route: "/services/transport",
    },
    {
      key: "activities" as const,
      icon: Mountain,
      label: strings.home.serviceActivities,
      sub: formatServiceSubtitle(
        serviceCounts.activities,
        strings.home.serviceActivitiesSub,
      ),
      bg: colors.accent.violet,
      route: "/services/activities",
    },
  ];

  useEffect(() => {
    let active = true;
    setHomeLoading(true);

    (async () => {
      try {
        const [hotels, food, transport, activities] = await Promise.all(
          [
            getDgisBusinessSection(DGIS_BUSINESS_RUBRICS.hotels, 6, language),
            getDgisBusinessSection(DGIS_BUSINESS_RUBRICS.food, 6, language),
            getDgisBusinessSection(DGIS_BUSINESS_RUBRICS.transport, 6, language),
            getDgisBusinessSection(DGIS_BUSINESS_RUBRICS.activities, 6, language),
          ],
        );
        if (!active) return;

        setServiceCounts({
          hotels: hotels.total,
          food: food.total,
          transport: transport.total,
          activities: activities.total,
        });

        const seen = new Set<string>();
        const sections: { section: DgisSearchResult; bgTint: string }[] = [
          { section: hotels, bgTint: "#1E4D6B" },
          { section: food, bgTint: "#C65D3A" },
          { section: activities, bgTint: "#6A5A4B" },
          { section: transport, bgTint: "#4A7289" },
        ];
        const cards = sections.flatMap(({ section, bgTint }) => {
          const place = section.items.find((item) => item.hasPhotos && !seen.has(item.id)) 
                     ?? section.items.find((item) => !seen.has(item.id));
          if (!place) return [];
          seen.add(place.id);
          return [
            {
              id: place.id,
              name: place.name,
              subtitle: place.address ?? place.category ?? "2GIS",
              bgTint,
              rating: place.rating,
              description: place.description,
              imageUrl: place.photoUrl,
              hasPhotos: place.hasPhotos,
            },
          ];
        });

        setTrending(cards.slice(0, 4));
      } catch (error) {
        console.warn("[home] trending query failed", error);
      } finally {
        if (active) setHomeLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [language]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <KyrgyzBackdrop height={compact ? 260 : 305} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 82,
        }}
      >
        <View
          className="flex-row items-center px-5"
          style={{ minHeight: 48 }}
        >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 18,
                backgroundColor: colors.surface.card,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.74)',
                ...shadows.card,
              }}
            >
              <User size={20} color={colors.brand.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }}>
                {user?.name ? `Hi, ${user.name}` : guestSessionId ? 'Hi, traveler' : strings.home.greeting}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: colors.text.secondary,
                  marginTop: 1,
                }}
              >
                {peopleCount} travelers · age {age}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/wallet')}
              accessibilityRole="button"
              accessibilityLabel={strings.tabs.wallet}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 18,
                backgroundColor: colors.surface.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.74)',
                opacity: pressed ? 0.78 : 1,
                ...shadows.card,
              })}
            >
              <WalletCards size={20} color={colors.brand.cta} strokeWidth={1.9} />
            </Pressable>
          </View>

          <View
            style={{
              minHeight: compact ? 146 : 170,
              paddingHorizontal: 20,
              paddingTop: compact ? 14 : 20,
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                borderRadius: 30,
                padding: 18,
                minHeight: compact ? 138 : 154,
                backgroundColor: colors.surface.inverse,
                overflow: 'hidden',
                justifyContent: 'space-between',
                ...shadows.cardElevated,
              }}
            >
              <View pointerEvents="none" style={{ position: 'absolute', right: -52, top: 18, width: 168, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,79,123,0.42)', transform: [{ rotate: '-18deg' }] }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: -56, bottom: 20, width: 200, height: 32, borderRadius: 16, backgroundColor: 'rgba(24,200,184,0.28)', transform: [{ rotate: '18deg' }] }} />
              <View style={{ alignSelf: 'flex-start', height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 0 }}>
                  AI route studio
                </Text>
              </View>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: compact ? 30 : 34, lineHeight: compact ? 34 : 38, color: '#fff', maxWidth: 292 }}>
                Build a Kyrgyzstan trip in seconds
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Ask', icon: Sparkles, color: colors.brand.cta },
                  { label: 'Route', icon: Route, color: colors.accent.aqua },
                  { label: 'Pay', icon: WalletCards, color: colors.accent.lemon },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.label} style={{ height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.13)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Icon size={13} color={item.color} strokeWidth={2} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View
            className="mx-5"
            style={{
              height: 54,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.94)",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              gap: 11,
              borderWidth: 1,
              borderColor: 'rgba(19,104,242,0.12)',
              marginTop: compact ? 14 : 18,
              ...shadows.card,
            }}
          >
            <Search size={19} color={colors.text.tertiary} strokeWidth={1.7} />
            <TextInput
              placeholder={strings.home.searchPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              keyboardAppearance="light"
              returnKeyType="search"
              onSubmitEditing={(event) =>
                router.push({
                  pathname: "/(tabs)/map",
                  params: { q: event.nativeEvent.text },
                } as never)
              }
              style={{
                flex: 1,
                fontFamily: "Inter_500Medium",
                fontSize: 15,
                color: colors.text.primary,
              }}
            />
            <Pressable
              accessibilityLabel={strings.home.voiceSearch}
              accessibilityRole="button"
              onPress={() => router.push("/trip/voice")}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 13,
                backgroundColor: colors.brand.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.76 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Mic size={19} color={colors.brand.primary} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: compact ? 14 : 18 }}>
            <Pressable
              onPress={async () => {
                await startGuestSession();
                setEntryMode('ai');
                router.push('/trip/voice');
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1.25,
                minHeight: 78,
                borderRadius: 22,
                padding: 13,
                backgroundColor: colors.brand.cta,
                justifyContent: 'space-between',
                opacity: pressed ? 0.86 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                ...shadows.floating,
              })}
            >
              <Sparkles size={20} color="#fff" strokeWidth={2} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>Plan with AI</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/trip/ready')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 78,
                borderRadius: 22,
                padding: 13,
                backgroundColor: colors.accent.violet,
                justifyContent: 'space-between',
                opacity: pressed ? 0.86 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                ...shadows.cardElevated,
              })}
            >
              <Route size={20} color="#fff" strokeWidth={2} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>Ready trips</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/map')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 78,
                borderRadius: 22,
                padding: 13,
                backgroundColor: colors.accent.aqua,
                justifyContent: 'space-between',
                opacity: pressed ? 0.86 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                ...shadows.cardElevated,
              })}
            >
              <Map size={20} color="#fff" strokeWidth={2} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>Map live</Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              paddingHorizontal: 20,
              marginTop: compact ? 12 : 16,
            }}
          >
            {serviceTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.key}
                  onPress={() => router.push(tile.route as never)}
                  accessibilityLabel={tile.label}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: "48.4%",
                    height: compact ? 92 : 106,
                    borderRadius: 24,
                    backgroundColor: tile.bg,
                    padding: 13,
                    justifyContent: "space-between",
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                    ...shadows.cardElevated,
                  })}
                >
                  <Icon size={22} color="#fff" strokeWidth={1.8} />
                  <View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        color: "#fff",
                      }}
                    >
                      {tile.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.78)",
                        marginTop: 2,
                      }}
                    >
                      {tile.sub}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {currentTrip && (
            <Pressable
              onPress={() => router.push('/trip/itinerary')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                marginHorizontal: 20,
                marginTop: compact ? 12 : 16,
                borderRadius: 24,
                padding: 14,
                backgroundColor: colors.surface.card,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.82)',
                opacity: pressed ? 0.85 : 1,
                ...shadows.cardElevated,
              })}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>
                Continue your trip
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: colors.text.primary, marginTop: 4 }}>
                {currentTrip.title}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginTop: 4 }}>
                {currentTrip.days} days - {currentTrip.travelerCount} {currentTrip.travelerCount === 1 ? 'traveler' : 'travelers'} - {formatUSD(currentTrip.totalCost)} total estimate
              </Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 10, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>View trip</Text>
              </View>
            </Pressable>
          )}

          {(homeLoading || trending.length > 0) && (
            <View style={{ marginTop: compact ? 12 : 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>
                  {strings.home.sectionTrending}
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/map")}
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                      color: colors.brand.primary,
                    }}
                  >
                    {strings.home.seeAll}
                  </Text>
                </Pressable>
              </View>
              {homeLoading ? (
                <View
                  style={{
                    marginHorizontal: 20,
                    height: compact ? 86 : 102,
                    borderRadius: 16,
                    backgroundColor: colors.surface.card,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border.divider,
                    gap: 8,
                  }}
                >
                  <ActivityIndicator
                    color={colors.brand.primary}
                    size="small"
                  />
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 12,
                      color: colors.text.secondary,
                    }}
                  >
                    {strings.map.loadingPlaces}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                  {trending.map((card) => (
                    <Pressable
                      key={card.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/map",
                          params: { q: card.name },
                        } as never)
                      }
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        width: 170,
                        height: compact ? 86 : 102,
                        borderRadius: 16,
                        backgroundColor: card.bgTint,
                        overflow: "hidden",
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <PlacePhoto
                        width="100%"
                        height={compact ? 86 : 102}
                        radius={16}
                        tint={card.bgTint}
                        imageUrl={card.imageUrl}
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          right: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <MapPin size={15} color="#fff" strokeWidth={2} />
                        {typeof card.rating === "number" ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Star
                              size={11}
                              color="#F8D18A"
                              fill="#F8D18A"
                              strokeWidth={0}
                            />
                            <Text
                              style={{
                                fontFamily: "Inter_700Bold",
                                fontSize: 11,
                                color: "#fff",
                              }}
                            >
                              {card.rating.toFixed(1)}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                              color: "rgba(255,255,255,0.78)",
                            }}
                          >
                            2GIS
                          </Text>
                        )}
                      </View>
                      <View style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 14,
                            color: "#fff",
                          }}
                        >
                          {card.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: "Inter_500Medium",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.78)",
                            marginTop: 2,
                          }}
                        >
                          {card.description ?? card.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </ScrollView>
    </View>
  );
}
