import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Wifi, WifiOff } from 'lucide-react-native';
import { STAYS } from '../../lib/data/stays';
import type { Stay } from '../../lib/data/tripPlaces';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PlacePhoto } from '../../components/PlacePhoto';
import { formatUSD } from '../../lib/format';
import { useTripStore } from '../../stores/tripStore';
import { getBestStaysForTripDay, getStayMatchReasons, type StayMatch } from '../../lib/utils/stayMatcher';

const FILTERS = ['All', 'Price', 'Rating', 'Hotel', 'Hostel', 'Guesthouse', 'Yurt', 'Wi-Fi', 'Family', 'Offline pay', 'QR pay'];
const BG_TINTS: Record<string, string> = { hotel: '#3d6479', yurt: '#6a5a4b', hostel: '#4a5e40', guesthouse: '#4a7289' };

function regionMatches(stay: Stay, region: string | null) {
  if (!region) return true;
  return stay.region === region
    || (region === 'Cholpon-Ata' && stay.region === 'Issyk-Kul')
    || (region === 'Jeti-Oguz' && stay.region === 'Karakol');
}

export default function HotelsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; day?: string; region?: string }>();
  const updateStay = useTripStore((state) => state.updateStay);
  const preferences = useTripStore((state) => state.preferences);
  const generatedItinerary = useTripStore((state) => state.generatedItinerary);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [details, setDetails] = useState<StayMatch | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);

  const dayNumber = Number(params.day ?? 0);
  const routeRegion = typeof params.region === 'string' ? params.region : null;
  const fromTrip = params.mode === 'change_stay' && dayNumber > 0;
  const tripDay = generatedItinerary?.dailyPlans.find((day) => day.day === dayNumber) ?? null;

  const matches = useMemo(() => {
    const regionFiltered = STAYS.filter((stay) => regionMatches(stay, routeRegion));
    const pool = fromTrip && regionFiltered.length ? regionFiltered : STAYS;
    const ranked = tripDay
      ? getBestStaysForTripDay({ day: tripDay, preferences, stays: pool })
      : STAYS.map((stay) => ({ stay, score: stay.rating * 10, reasons: getStayMatchReasons(stay, null, preferences) }));

    return ranked
      .filter(({ stay }) => {
        if (filter === 'Hotel') return stay.type === 'hotel';
        if (filter === 'Hostel') return stay.type === 'hostel';
        if (filter === 'Guesthouse') return stay.type === 'guesthouse';
        if (filter === 'Yurt') return stay.type === 'yurt';
        if (filter === 'Wi-Fi') return stay.wifi;
        if (filter === 'Family') return stay.familyFriendly;
        if (filter === 'Offline pay') return stay.offlinePaymentSupported;
        if (filter === 'QR pay') return stay.paymentOptions.includes('qr');
        return true;
      })
      .sort((a, b) => {
        if (filter === 'Price') return a.stay.pricePerNight - b.stay.pricePerNight;
        if (filter === 'Rating') return b.stay.rating - a.stay.rating;
        return b.score - a.score;
      });
  }, [filter, fromTrip, preferences, routeRegion, tripDay]);

  function returnToTrip() {
    router.replace({ pathname: '/trip/itinerary', params: { day: String(dayNumber) } } as never);
  }

  function addToTrip(stay: Stay) {
    if (!fromTrip || !tripDay) return;
    updateStay(dayNumber, stay.id);
    returnToTrip();
  }

  function bookStay(stay: Stay) {
    router.push({
      pathname: '/services/hotel-booking',
      params: {
        stayId: stay.id,
        mode: fromTrip ? 'trip' : 'standalone',
        day: fromTrip ? String(dayNumber) : undefined,
        region: routeRegion ?? stay.region,
      },
    } as never);
  }

  function openStayInMap(stay: Stay) {
    router.push({ pathname: '/(tabs)/map', params: { q: stay.name } } as never);
  }

  function selectStandaloneStay(stay: Stay) {
    setSelectedStayId(stay.id);
    setDetails({
      stay,
      score: stay.rating * 10,
      reasons: getStayMatchReasons(stay, null, preferences),
    });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Button variant="ghost" label="" icon={<ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />} onPress={() => goBackOrReplace(router, '/(tabs)')} style={{ width: 44, borderRadius: 12 }} height={44} />
        <View style={{ flex: 1, marginRight: 44 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.text.primary, textAlign: 'center' }}>
            {fromTrip ? `Best stays for Day ${dayNumber}` : 'Hotels'}
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, textAlign: 'center', marginTop: 2 }}>
            {fromTrip ? (routeRegion ?? tripDay?.region ?? 'Route region') : `${STAYS.length} stays in Kyrgyzstan`}
          </Text>
        </View>
      </View>

      {fromTrip && (
        <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: colors.brand.primaryLight, padding: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>Best matches for your route</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 2 }}>
            Sorted by your budget, stay style, internet needs, route region and traveler requirements.
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: colors.border.divider, maxHeight: 58 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {FILTERS.map((item) => <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} height={34} fontSize={13} />)}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {matches.map((match) => {
          const stay = match.stay;
          const selected = selectedStayId === stay.id;
          return (
            <Card key={stay.id}>
              <Pressable onPress={() => openStayInMap(stay)} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View style={{ flexDirection: 'row' }}>
                  <PlacePhoto width={112} height={156} radius={14} tint={BG_TINTS[stay.type] ?? '#3d6479'} imageUrl={stay.imageUrl} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {stay.wifi ? <Wifi size={13} color={colors.brand.primary} /> : <WifiOff size={13} color={colors.status.warningText} />}
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary, flex: 1 }} numberOfLines={2}>{stay.name}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>{stay.city}, {stay.region}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>{stay.rating}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>{stay.reviewCount} reviews</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary, marginTop: 8 }}>Why it fits</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {match.reasons.map((reason) => <Chip key={reason} label={reason} height={24} fontSize={10} />)}
                    </View>
                    <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.text.secondary, marginTop: 8 }}>{stay.description}</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.brand.primary, marginTop: 8 }}>
                      {formatUSD(stay.pricePerNight)}<Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}> / night</Text>
                    </Text>
                    {selected && (
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.status.successText, marginTop: 2 }}>
                        Selected for browsing
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button variant="secondary" label="Details" onPress={() => setDetails(match)} height={38} fontSize={12} style={{ flex: 1, borderRadius: 10 }} />
                {fromTrip ? (
                  <>
                    <Button label={`Add to Day ${dayNumber}`} onPress={() => addToTrip(stay)} height={38} fontSize={11} style={{ flex: 1.35, borderRadius: 10 }} />
                    <Button variant="cta" label={`Book for Day ${dayNumber}`} onPress={() => bookStay(stay)} height={38} fontSize={11} style={{ flex: 1.35, borderRadius: 10 }} />
                  </>
                ) : (
                  <>
                    <Button variant="cta" label="Book" onPress={() => bookStay(stay)} height={38} fontSize={12} style={{ flex: 1, borderRadius: 10 }} />
                    <Button label="Select" onPress={() => selectStandaloneStay(stay)} height={38} fontSize={12} style={{ flex: 1, borderRadius: 10 }} />
                  </>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <StayDetails match={details} fromTrip={fromTrip} dayNumber={dayNumber} onClose={() => setDetails(null)} onAdd={(stay) => addToTrip(stay)} onBook={(stay) => bookStay(stay)} />
    </SafeAreaView>
  );
}

function StayDetails({
  match,
  fromTrip,
  dayNumber,
  onClose,
  onAdd,
  onBook,
}: {
  match: StayMatch | null;
  fromTrip: boolean;
  dayNumber: number;
  onClose: () => void;
  onAdd: (stay: Stay) => void;
  onBook: (stay: Stay) => void;
}) {
  if (!match) return null;
  const stay = match.stay;
  const gross = stay.pricePerNight;
  const commission = gross * stay.commissionRate;
  const payout = gross - commission;
  const paymentLabels = [
    stay.wifi ? 'Wi-Fi' : 'No Wi-Fi',
    stay.paymentOptions.includes('qr') || stay.qrPayment ? 'QR payment' : null,
    stay.offlinePaymentSupported ? 'Offline Pay' : null,
  ].filter((item): item is string => !!item);
  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', padding: 20 }}>
        <View style={{ maxHeight: '86%', borderRadius: 22, padding: 18, backgroundColor: colors.surface.card }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary }}>{stay.name}</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, marginTop: 4 }}>{stay.city}, {stay.region} · {stay.rating} rating</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.brand.primary, marginTop: 8 }}>{formatUSD(stay.pricePerNight)} / night</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 10 }}>{stay.description}</Text>
            <TagList tags={[...stay.tags.slice(0, 6), ...paymentLabels]} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Why it fits</Text>
            {fromTrip ? (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 4 }}>
                {match.reasons.join(' · ')}
              </Text>
            ) : (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 4 }}>
                Good standalone stay option. You can select it for browsing or book a mock room without creating a full trip.
              </Text>
            )}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Amenities</Text>
            <TagList tags={stay.amenities} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Room types</Text>
            {stay.roomTypes.map((room) => (
              <View key={room.id} style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: colors.surface.primary }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>{room.title}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>{formatUSD(room.pricePerNight)} · sleeps {room.sleeps}</Text>
              </View>
            ))}
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginTop: 14 }}>Reviews</Text>
            {stay.reviews.map((review) => (
              <View key={review.id} style={{ marginTop: 8 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>{review.rating.toFixed(1)} · {review.author}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 2 }}>{review.text}</Text>
              </View>
            ))}
            <View style={{ marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surface.primary }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>Cancellation policy</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 4 }}>
                Mock policy: free cancellation until 24 hours before check-in. Partner rules may differ in production.
              </Text>
            </View>
            <View style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: colors.status.warningLight }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>Business model demo</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 4 }}>
                Gross {formatUSD(gross)} · Commission {(stay.commissionRate * 100).toFixed(0)}%: {formatUSD(commission)} · Partner payout {formatUSD(payout)}
              </Text>
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Button variant="secondary" label="Close" onPress={onClose} style={{ flex: 1 }} height={46} fontSize={13} />
            {fromTrip ? (
              <>
                <Button label="Update stay" onPress={() => { onClose(); onAdd(stay); }} style={{ flex: 1.25 }} height={46} fontSize={12} />
                <Button variant="cta" label={`Book Day ${dayNumber}`} onPress={() => { onClose(); onBook(stay); }} style={{ flex: 1.25 }} height={46} fontSize={12} />
              </>
            ) : (
              <Button variant="cta" label="Book" onPress={() => { onClose(); onBook(stay); }} style={{ flex: 1 }} height={46} fontSize={13} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{tags.map((tag) => <Chip key={tag} label={tag.replace(/_/g, ' ')} height={28} fontSize={11} />)}</View>;
}
