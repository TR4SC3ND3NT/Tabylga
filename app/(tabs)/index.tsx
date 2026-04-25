import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Search,
  Mic,
  Bell,
  User,
  Bed,
  Utensils,
  Car,
  Mountain,
  Sparkles,
  Star,
  MapPin,
  Languages,
} from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { useTravelPreferencesStore } from '../../stores/travelPreferencesStore';
import { useTripStore } from '../../stores/tripStore';
import { getPlacesByCategories } from '../../lib/api/places';
import { formatUSD } from '../../lib/format';
import { Button } from '../../components/Button';
import { KyrgyzBackdrop } from '../../components/KyrgyzBackdrop';

interface PlaceCard {
  id: string;
  name: string;
  region: string;
  category: string;
  bgTint: string;
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

  const serviceTiles = [
    { key: 'hotels', icon: Bed, label: strings.home.serviceHotels, sub: strings.home.serviceHotelsSub, bg: '#1E4D6B', route: '/services/hotels' },
    { key: 'food', icon: Utensils, label: strings.home.serviceFood, sub: strings.home.serviceFoodSub, bg: '#C65D3A', route: '/services/food' },
    { key: 'transport', icon: Car, label: strings.home.serviceTransport, sub: strings.home.serviceTransportSub, bg: '#4A6B40', route: '/services/transport' },
    { key: 'activities', icon: Mountain, label: strings.home.serviceActivities, sub: strings.home.serviceActivitiesSub, bg: '#6A5A4B', route: '/services/activities' },
  ];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await getPlacesByCategories(['hotel', 'attraction', 'nature'], language, 4);
        if (!active) return;
        const tints = ['#1E4D6B', '#4A6B40', '#6A5A4B', '#C65D3A'];
        setTrending(rows.map((row, index) => ({ ...row, bgTint: tints[index % tints.length] })));
      } catch (error) {
        console.warn('[home] trending query failed', error);
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

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) + 82 }}>
          <View className="flex-row items-center px-5" style={{ minHeight: 44 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.84)', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color={colors.brand.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }}>
                {user?.name ? `Hi, ${user.name}` : guestSessionId ? 'Hi, traveler' : strings.home.greeting}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginTop: 1 }}>
                {peopleCount} travelers · age {age}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={strings.home.notifications}
              accessibilityRole="button"
              style={({ pressed }) => ({ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Bell size={23} color={colors.text.primary} strokeWidth={1.7} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: compact ? 14 : 20 }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: compact ? 30 : 36, lineHeight: compact ? 35 : 41, color: colors.text.primary }}>
              Kyrgyzstan routes that actually work
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 8, maxWidth: 310 }}>
              Hotels, food, transport and activities connected into one personalized trip plan.
            </Text>
          </View>

          <View
            className="mx-5"
            style={{
              height: 54,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.94)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 15,
              gap: 11,
              borderWidth: 1,
              borderColor: colors.border.divider,
              marginTop: compact ? 14 : 18,
            }}
          >
            <Search size={19} color={colors.text.tertiary} strokeWidth={1.7} />
            <TextInput
              placeholder={strings.home.searchPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              onSubmitEditing={(event) => router.push({ pathname: '/(tabs)/map', params: { q: event.nativeEvent.text } } as never)}
              style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.primary }}
            />
            <Pressable accessibilityLabel={strings.home.voiceSearch} accessibilityRole="button" onPress={() => router.push('/trip/voice')}>
              <Mic size={19} color={colors.brand.primary} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: compact ? 14 : 18 }}>
            {serviceTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.key}
                  onPress={() => router.push(tile.route as never)}
                  accessibilityLabel={tile.label}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: '48.4%',
                    height: compact ? 92 : 106,
                    borderRadius: 18,
                    backgroundColor: tile.bg,
                    padding: 13,
                    justifyContent: 'space-between',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Icon size={22} color="#fff" strokeWidth={1.8} />
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' }}>
                      {tile.label}
                    </Text>
                    <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>
                      {tile.sub}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: compact ? 14 : 18 }}>
            <Button
              variant="cta"
              label="Plan my full trip with AI"
              icon={<Sparkles size={20} color="#fff" strokeWidth={2} />}
              onPress={async () => {
                await startGuestSession();
                setEntryMode('ai');
                router.push('/trip/quiz');
              }}
              style={{ flex: 1 }}
              fontSize={13}
            />
            <Pressable
              onPress={() => router.push('/tools/translator')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 54,
                height: 54,
                borderRadius: 16,
                backgroundColor: colors.surface.card,
                borderWidth: 1,
                borderColor: colors.border.divider,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Languages size={22} color={colors.brand.primary} strokeWidth={1.8} />
            </Pressable>
          </View>

          {currentTrip && (
            <Pressable
              onPress={() => router.push('/trip/itinerary')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                marginHorizontal: 20,
                marginTop: compact ? 12 : 16,
                borderRadius: 18,
                padding: 14,
                backgroundColor: colors.brand.primaryLight,
                borderWidth: 1,
                borderColor: colors.border.divider,
                opacity: pressed ? 0.85 : 1,
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

          <View style={{ marginTop: compact ? 12 : 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>
                {strings.home.sectionTrending}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/map')} accessibilityRole="button">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>
                  {strings.home.seeAll}
                </Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {trending.map((card, index) => (
                <Pressable
                  key={card.id}
                  onPress={() => router.push({ pathname: '/(tabs)/map', params: { q: card.name } } as never)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: 170,
                    height: compact ? 86 : 102,
                    borderRadius: 16,
                    backgroundColor: card.bgTint,
                    padding: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MapPin size={15} color="#fff" strokeWidth={2} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Star size={11} color="#F8D18A" fill="#F8D18A" strokeWidth={0} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff' }}>
                        4.{index + 5}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>
                      {card.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>
                      {card.region}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
