import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Wifi, WifiOff } from 'lucide-react-native';
import { STAYS } from '../../lib/data/stays';
import type { Stay } from '../../lib/data/tripPlaces';
import { colors } from '../../constants/colors';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PlacePhoto } from '../../components/PlacePhoto';
import { formatUSD } from '../../lib/format';
import { useTripStore } from '../../stores/tripStore';

const FILTERS = ['All', 'Price', 'Rating', 'Hotel', 'Hostel', 'Yurt', 'Wi-Fi', 'Family', 'Offline pay', 'QR pay'];
const BG_TINTS: Record<string, string> = { hotel: '#3d6479', yurt: '#6a5a4b', hostel: '#4a5e40', guesthouse: '#4a7289' };

export default function HotelsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; day?: string; region?: string }>();
  const updateStay = useTripStore((state) => state.updateStay);
  const preferences = useTripStore((state) => state.preferences);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [details, setDetails] = useState<Stay | null>(null);

  const dayNumber = Number(params.day ?? 0);
  const routeRegion = typeof params.region === 'string' ? params.region : null;
  const fromTrip = params.mode === 'change_stay' && dayNumber > 0;

  const stays = useMemo(() => {
    const routeFiltered = routeRegion
      ? STAYS.filter((stay) => stay.region === routeRegion || (routeRegion === 'Cholpon-Ata' && stay.region === 'Issyk-Kul') || (routeRegion === 'Jeti-Oguz' && stay.region === 'Karakol'))
      : STAYS;
    const base = routeFiltered.length ? routeFiltered : STAYS;
    return base
      .filter((stay) => {
        if (filter === 'Hotel') return stay.type === 'hotel';
        if (filter === 'Hostel') return stay.type === 'hostel';
        if (filter === 'Yurt') return stay.type === 'yurt';
        if (filter === 'Wi-Fi') return stay.wifi;
        if (filter === 'Family') return stay.familyFriendly;
        if (filter === 'Offline pay') return stay.offlinePaymentSupported;
        if (filter === 'QR pay') return stay.paymentOptions.includes('qr');
        return true;
      })
      .sort((a, b) => {
        if (filter === 'Price') return a.pricePerNight - b.pricePerNight;
        if (filter === 'Rating') return b.rating - a.rating;
        if (fromTrip) return scoreForTrip(b) - scoreForTrip(a);
        return b.rating - a.rating;
      });
  }, [filter, fromTrip, preferences, routeRegion]);

  function scoreForTrip(stay: Stay) {
    let score = 0;
    if (stay.tier === preferences.budgetTier) score += 20;
    if (preferences.stayPreference === 'hotels_only' && stay.type === 'hotel') score += 30;
    if (preferences.stayPreference === 'guesthouse_ok' && stay.type !== 'yurt') score += 14;
    if (preferences.stayPreference === 'yurt_ok' && ['hotel', 'guesthouse', 'yurt'].includes(stay.type)) score += 10;
    if (preferences.internetComfort === 'prefer_internet' && stay.wifi) score += 20;
    if (preferences.travelStyles.includes('business') && stay.businessFriendly) score += 24;
    if ((preferences.travelersType === 'family' || preferences.travelStyles.includes('family_trip')) && stay.familyFriendly) score += 24;
    if (preferences.budgetTier === 'budget' && stay.tier === 'premium') score -= 40;
    return score;
  }

  function selectStay(stay: Stay) {
    if (!fromTrip) {
      setDetails(stay);
      return;
    }
    updateStay(dayNumber, stay.id);
    Alert.alert('Stay updated in your trip', `${stay.name} was added to Day ${dayNumber}.`, [
      { text: 'View trip', onPress: () => router.replace('/trip/itinerary') },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1, marginRight: 44 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.text.primary, textAlign: 'center' }}>
            {fromTrip ? `Best matches for Day ${dayNumber}` : 'Hotels'}
          </Text>
          {fromTrip ? (
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, textAlign: 'center', marginTop: 2 }}>
              {routeRegion}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: colors.border.divider, maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {FILTERS.map((item) => <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} height={34} fontSize={13} />)}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {stays.map((stay) => (
          <Pressable
            key={stay.id}
            onPress={() => router.push({ pathname: '/(tabs)/map', params: { q: stay.name } } as never)}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card>
              <View style={{ flexDirection: 'row' }}>
              <PlacePhoto
                width={112}
                height={136}
                tint={BG_TINTS[stay.type] ?? '#3d6479'}
                imageUrl={stay.imageUrl}
              />
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }} numberOfLines={2}>{stay.name}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>{stay.city}, {stay.region}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>{stay.rating}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>{stay.reviewCount} reviews</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                  {stay.tags.slice(0, 4).map((tag) => <Chip key={tag} label={tag.replace(/_/g, ' ')} height={24} fontSize={11} />)}
                </ScrollView>
                <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.text.secondary, marginTop: 8 }}>{stay.reviews[0]?.text ?? stay.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.brand.primary }}>{formatUSD(stay.pricePerNight)}<Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}> / night</Text></Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button variant="secondary" label="Details" onPress={() => setDetails(stay)} height={34} fontSize={12} style={{ width: 78, borderRadius: 9 }} />
                    <Button label={fromTrip ? 'Add' : 'Book'} onPress={() => selectStay(stay)} height={34} fontSize={12} style={{ width: 72, borderRadius: 9 }} />
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Pressable>
        ))}
      </ScrollView>

      <StayDetails stay={details} fromTrip={fromTrip} onClose={() => setDetails(null)} onAdd={(stay) => selectStay(stay)} />
    </SafeAreaView>
  );
}

function StayDetails({ stay, fromTrip, onClose, onAdd }: { stay: Stay | null; fromTrip: boolean; onClose: () => void; onAdd: (stay: Stay) => void }) {
  if (!stay) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', padding: 20 }}>
        <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.surface.card }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary }}>{stay.name}</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, marginTop: 4 }}>{stay.city}, {stay.region} - {stay.rating} rating</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 10 }}>{stay.description}</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Amenities</Text>
          <TagList tags={stay.amenities} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Room types</Text>
          {stay.roomTypes.map((room) => (
            <Text key={room.id} style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary, marginTop: 5 }}>{room.title} - {formatUSD(room.pricePerNight)} - sleeps {room.sleeps}</Text>
          ))}
          {fromTrip ? (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.brand.primaryLight }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>Why it fits your trip</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 4 }}>This stay matches the selected route region and will update your trip total immediately.</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Button variant="secondary" label="Close" onPress={onClose} style={{ flex: 1 }} height={46} fontSize={13} />
            <Button label={fromTrip ? 'Add to trip' : 'Book demo'} onPress={() => { onClose(); onAdd(stay); }} style={{ flex: 1 }} height={46} fontSize={13} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{tags.map((tag) => <Chip key={tag} label={tag} height={28} fontSize={11} />)}</View>;
}
