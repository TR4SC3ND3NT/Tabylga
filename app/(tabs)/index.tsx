import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Search, Mic, Bell, User,
  Bed, Utensils, Car, Mountain,
  Sparkles, TreePine, Star,
} from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { getDb } from '../../lib/db/client';
import { Button } from '../../components/Button';
import { SectionHeader } from '../../components/SectionHeader';
import { Pill } from '../../components/Pill';
import { Card } from '../../components/Card';

interface PlaceCard {
  id: string;
  name: string;
  region: string;
  category: string;
  bgTint: string;
}

const COUNTRYSIDE_CARDS = [
  { id: 'place_024', name: 'Jyrgalan Village Stay', region: 'Karakol region',  price: 45,  bgTint: '#5a6f4d', discount: '-20%' },
  { id: 'place_017', name: 'Song-Kul Yurt Camp',    region: 'Naryn region',    price: 65,  bgTint: '#4a5d68', discount: '-15%' },
  { id: 'place_029', name: 'Arslanbob Forest',      region: 'Jalal-Abad region', price: 38, bgTint: '#6a5a4b', discount: '-25%' },
];

const SERVICE_TILES = [
  { key: 'hotels',    icon: Bed,       label: strings.home.serviceHotels,     sub: strings.home.serviceHotelsSub,     bg: '#3d6479', route: '/services/hotels' },
  { key: 'food',      icon: Utensils,  label: strings.home.serviceFood,       sub: strings.home.serviceFoodSub,       bg: '#5a4f3d', route: '/services/food' },
  { key: 'transport', icon: Car,       label: strings.home.serviceTransport,  sub: strings.home.serviceTransportSub,  bg: '#4a5e40', route: '/services/transport' },
  { key: 'activities', icon: Mountain, label: strings.home.serviceActivities, sub: strings.home.serviceActivitiesSub, bg: '#56473d', route: '/services/activities' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trending, setTrending] = useState<PlaceCard[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await getDb();
        const rows = await db.getAllAsync<{ id: string; name: string; region: string; category: string }>(
          `SELECT id, name, region, category FROM places
           WHERE category IN ('hotel','attraction','nature') ORDER BY RANDOM() LIMIT 4`
        );
        if (active) {
          const tints = ['#3d6479', '#4a5d68', '#5a6f4d', '#6a5a4b'];
          setTrending(rows.map((r, i) => ({ ...r, bgTint: tints[i % tints.length] })));
        }
      } catch (e) {
        console.warn('[home] trending query failed', e);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <View className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View className="flex-row items-center px-5 py-2">
          <View
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.brand.primaryLight,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <User size={20} color={colors.brand.primary} strokeWidth={1.5} />
          </View>
          <Text
            className="flex-1 ml-3"
            style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.primary }}
          >
            {strings.home.greeting}
          </Text>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Bell size={24} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ── Search bar ── */}
        <View
          className="mx-5 mt-3"
          style={[
            {
              height: 56, borderRadius: 12,
              backgroundColor: colors.surface.card,
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, gap: 12,
              borderWidth: 1, borderColor: colors.border.divider,
            },
            shadows.card,
          ]}
        >
          <Search size={20} color={colors.text.tertiary} strokeWidth={1.5} />
          <TextInput
            placeholder={strings.home.searchPlaceholder}
            placeholderTextColor={colors.text.tertiary}
            style={{
              flex: 1,
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: colors.text.primary,
            }}
          />
          <Pressable accessibilityLabel="Voice search" accessibilityRole="button" onPress={() => router.push('/trip/voice')}>
            <Mic size={20} color={colors.brand.primary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ── Countryside escapes ── */}
        <SectionHeader
          title={strings.home.sectionRetreat}
          onSeeAll={() => console.log('See all countryside')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          className="mt-3"
        >
          {COUNTRYSIDE_CARDS.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => console.log('tap', card.id)}
              accessibilityLabel={card.name}
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 280, height: 200, borderRadius: 16,
                backgroundColor: card.bgTint, overflow: 'hidden',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {/* Bottom dim overlay */}
              <View
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '70%', backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              />

              {/* Discount badge */}
              <View
                style={{
                  position: 'absolute', top: 12, right: 12,
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 999, backgroundColor: colors.status.warning,
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.primary }}>
                  {card.discount}
                </Text>
              </View>

              {/* Countryside tag */}
              <View style={{ position: 'absolute', top: 12, left: 12 }}>
                <Pill
                  variant="countryside"
                  label={strings.home.countrysideTag}
                  icon={<TreePine size={12} color={colors.brand.primary} strokeWidth={2} />}
                />
              </View>

              {/* Bottom content */}
              <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: '#fff', marginBottom: 2 }}
                >
                  {card.name}
                </Text>
                <Text
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
                >
                  {card.region}
                </Text>
                <Text
                  style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff', marginTop: 6 }}
                >
                  {strings.home.fromPrice} ${card.price}{strings.home.perNight}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Service tiles 2×2 ── */}
        <View className="px-5 mt-7" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SERVICE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Pressable
                key={tile.key}
                onPress={() => router.push(tile.route as any)}
                accessibilityLabel={tile.label}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: '48%', height: 160, borderRadius: 16,
                  backgroundColor: tile.bg, padding: 14,
                  justifyContent: 'flex-end',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'absolute', top: 14, left: 14,
                  }}
                >
                  <Icon size={20} color="#fff" strokeWidth={1.5} />
                </View>
                <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: '#fff' }}>
                  {tile.label}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                  {tile.sub}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── AI CTA ── */}
        <Button
          variant="cta"
          label={strings.home.aiCtaTitle}
          icon={<Sparkles size={22} color="#fff" strokeWidth={2} />}
          onPress={() => router.push('/trip/purpose')}
          style={{ marginHorizontal: 20, marginTop: 24 }}
        />

        {/* ── Trending now ── */}
        <SectionHeader title={strings.home.sectionTrending} onSeeAll={() => console.log('See all trending')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          className="mt-3"
        >
          {trending.map((card) => (
            <Pressable
              key={card.id}
              accessibilityLabel={card.name}
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 180, height: 220,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Card style={{ flex: 1 }}>
              {/* Image placeholder */}
              <View style={{ height: 130, backgroundColor: card.bgTint, position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    paddingHorizontal: 8, paddingVertical: 4,
                    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)',
                  }}
                >
                  <Star size={11} color={colors.status.warning} strokeWidth={0} fill={colors.status.warning} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.text.primary }}>
                    4.{Math.floor(Math.random() * 5) + 4}
                  </Text>
                </View>
              </View>
              {/* Body */}
              <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
                <View>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.primary }}
                  >
                    {card.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}
                  >
                    {card.region}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.brand.primary }}>
                  {strings.home.fromPrice} ${20 + Math.floor(Math.random() * 80)}
                </Text>
              </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

