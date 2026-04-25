import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Car, Check, Clock, Info, QrCode, Star, Utensils, WalletCards, WifiOff } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { colors } from '../../constants/colors';
import { ACTIVITIES } from '../../lib/data/activities';
import { FOOD_PLACES } from '../../lib/data/food';
import { TRANSPORT_OPTIONS } from '../../lib/data/transport';
import type { Activity, FoodPlace, TransportOption, TripPreferences } from '../../lib/data/tripPlaces';
import { formatUSD } from '../../lib/format';
import { useTripStore } from '../../stores/tripStore';

type SelectionType = 'transport' | 'food' | 'activity';
type SelectionItem = TransportOption | FoodPlace | Activity;

const ACTIVITY_MAX = { easy: 1, light: 2, moderate: 3, hard: 4 } as const;
const ROAD_RANK = { low: 1, medium: 2, high: 3 } as const;
const BUDGET_RANK = { budget: 1, standard: 2, comfort: 3, premium: 4 } as const;

const FILTERS: Record<SelectionType, string[]> = {
  transport: ['All', 'Cheapest', 'Fastest', 'Private', 'Shared', 'QR payment', 'Offline contact', 'Short drive'],
  food: ['All', 'Budget', 'Local food', 'Halal', 'Vegetarian', 'Vegan', 'Family-friendly', 'Premium', 'QR payment'],
  activity: ['All', 'Easy', 'Culture', 'Nature', 'Food/local life', 'Adventure', 'Free', 'Short', 'Photography', 'Offline-ready'],
};

function pretty(value: string) {
  return value.replace(/_/g, ' ');
}

function activeRequirements(preferences: TripPreferences) {
  return preferences.requirements.filter((item) => item !== 'none');
}

function itemPrice(item: SelectionItem) {
  if ('priceEstimate' in item) return item.priceEstimate;
  return item.price;
}

function hasAny(source: string[], targets: string[]) {
  return targets.some((target) => source.includes(target));
}

function regionMatch(itemRegion: string | undefined, region: string) {
  if (!itemRegion) return false;
  if (itemRegion === region) return true;
  if (region === 'Cholpon-Ata' && itemRegion === 'Issyk-Kul') return true;
  if (region === 'Jeti-Oguz' && itemRegion === 'Karakol') return true;
  return false;
}

function scoreTransport(item: TransportOption, preferences: TripPreferences, region: string, filter: string) {
  let score = 0;
  if (item.regions.includes(region)) score += 40;
  if (preferences.budgetTier === 'budget' && item.type === 'shared_transport') score += 24;
  if (preferences.budgetTier === 'premium' && item.type === 'private_driver') score += 28;
  if (preferences.travelStyles.includes('business') && hasAny(item.tags, ['business', 'comfort', 'short_drive'])) score += 28;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && item.tags.includes('family_friendly')) score += 24;
  if (ROAD_RANK[item.roadToleranceRequired] <= ROAD_RANK[preferences.roadTolerance]) score += 18;
  if (item.goodFor.includes(preferences.travelersType)) score += 14;
  if (item.qrPayment) score += 8;
  if (item.offlineContactAvailable) score += 8;
  if (filter === 'Cheapest') score -= item.price;
  if (filter === 'Fastest' || filter === 'Short drive') score += item.roadToleranceRequired === 'low' ? 32 : -8;
  if (filter === 'Private') score += item.type === 'private_driver' || item.type === 'airport_transfer' ? 35 : -20;
  if (filter === 'Shared') score += item.type === 'shared_transport' ? 35 : -20;
  if (filter === 'QR payment') score += item.qrPayment ? 35 : -20;
  if (filter === 'Offline contact') score += item.offlineContactAvailable ? 35 : -20;
  return score;
}

function scoreFood(item: FoodPlace, preferences: TripPreferences, region: string, filter: string) {
  let score = 0;
  const reqs = activeRequirements(preferences);
  if (regionMatch(item.region, region)) score += 36;
  if (item.tier === preferences.budgetTier) score += 18;
  if (BUDGET_RANK[item.tier] <= BUDGET_RANK[preferences.budgetTier]) score += 10;
  if (preferences.travelStyles.includes('food_local_life') && hasAny(item.tags, ['local_food', 'national_food', 'market'])) score += 32;
  if (preferences.travelStyles.includes('business') && hasAny(item.tags, ['city', 'wifi', 'cafe'])) score += 18;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && item.tags.includes('family_friendly')) score += 24;
  if (reqs.some((req) => item.requirementsSupported.includes(req))) score += 22;
  if (preferences.budgetTier === 'budget') score -= item.priceEstimate;
  if (item.goodFor.includes(preferences.travelersType)) score += 10;
  if (item.qrPayment) score += 6;
  if (item.offlineReady) score += 6;
  if (filter === 'Budget') score += item.tier === 'budget' ? 35 : -15;
  if (filter === 'Local food') score += hasAny(item.tags, ['local_food', 'national_food', 'market']) ? 35 : -15;
  if (filter === 'Halal') score += item.requirementsSupported.includes('halal') ? 35 : -20;
  if (filter === 'Vegetarian') score += item.requirementsSupported.includes('vegetarian') ? 35 : -20;
  if (filter === 'Vegan') score += item.requirementsSupported.includes('vegan') ? 35 : -20;
  if (filter === 'Family-friendly') score += item.requirementsSupported.includes('family_friendly') || item.tags.includes('family_friendly') ? 35 : -20;
  if (filter === 'Premium') score += item.tier === 'premium' || item.tags.includes('premium') ? 35 : -20;
  if (filter === 'QR payment') score += item.qrPayment ? 35 : -20;
  return score;
}

function scoreActivity(item: Activity, preferences: TripPreferences, region: string, current?: Activity, filter = 'All') {
  let score = 0;
  if (regionMatch(item.region, region)) score += 38;
  if (current && (item.type === current.type || item.tags.some((tag) => current.tags.includes(tag)))) score += 34;
  if (item.difficulty <= ACTIVITY_MAX[preferences.activityLevel]) score += 24;
  if (ROAD_RANK[item.roadIntensity] <= ROAD_RANK[preferences.roadTolerance]) score += 18;
  if (preferences.travelStyles.includes('adventure') && hasAny(item.tags, ['mountain_views', 'lakes_canyons', 'horse_riding', 'adventure'])) score += 28;
  if (preferences.travelStyles.includes('cultural_discovery') && hasAny(item.tags, ['museums_history', 'cultural_discovery', 'culture'])) score += 28;
  if (preferences.travelStyles.includes('food_local_life') && hasAny(item.tags, ['local_food', 'bazaars_local_life'])) score += 28;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && hasAny(item.tags, ['family_friendly', 'easy'])) score += 24;
  if (preferences.travelStyles.includes('business') && hasAny(item.tags, ['business', 'wifi', 'city'])) score += 22;
  if (preferences.budgetTier === 'budget') score -= item.price;
  if (item.offlineReady) score += 8;
  if (filter === 'Easy') score += item.difficulty === 1 ? 35 : -20;
  if (filter === 'Culture') score += hasAny(item.tags, ['museums_history', 'cultural_discovery', 'culture', 'shopping_crafts']) ? 35 : -15;
  if (filter === 'Nature') score += hasAny(item.tags, ['mountain_views', 'lakes_canyons', 'nature', 'light_hiking']) ? 35 : -15;
  if (filter === 'Food/local life') score += hasAny(item.tags, ['local_food', 'bazaars_local_life', 'market']) ? 35 : -15;
  if (filter === 'Adventure') score += hasAny(item.tags, ['adventure', 'horse_riding', 'hot_springs', 'remote']) ? 35 : -20;
  if (filter === 'Free') score += item.price === 0 ? 35 : -15;
  if (filter === 'Short') score += item.durationHours <= 2 ? 35 : -15;
  if (filter === 'Photography') score += item.tags.includes('photography_spots') ? 35 : -15;
  if (filter === 'Offline-ready') score += item.offlineReady ? 35 : -15;
  return score;
}

function transportAllowed(item: TransportOption, preferences: TripPreferences) {
  if (ROAD_RANK[item.roadToleranceRequired] > ROAD_RANK[preferences.roadTolerance]) return false;
  if (preferences.budgetTier === 'budget' && item.type === 'private_driver' && item.price > 90) return false;
  if (preferences.travelStyles.includes('business') && item.type === 'shared_transport') return false;
  return true;
}

function foodAllowed(item: FoodPlace, preferences: TripPreferences) {
  const reqs = activeRequirements(preferences);
  if (preferences.budgetTier === 'budget' && item.tier === 'premium') return false;
  if (reqs.some((req) => ['halal', 'vegetarian', 'vegan', 'no_alcohol', 'prayer_friendly'].includes(req) && !item.requirementsSupported.includes(req))) return false;
  return true;
}

function activityAllowed(item: Activity, preferences: TripPreferences) {
  const reqs = activeRequirements(preferences);
  if (item.difficulty > ACTIVITY_MAX[preferences.activityLevel]) return false;
  if (ROAD_RANK[item.roadIntensity] > ROAD_RANK[preferences.roadTolerance]) return false;
  if (preferences.internetComfort === 'prefer_internet' && item.roadIntensity === 'high' && !item.internetAvailable) return false;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && (item.difficulty > 2 || item.tags.includes('nightlife'))) return false;
  if (preferences.travelStyles.includes('business') && hasAny(item.tags, ['remote', 'late_activity']) && !preferences.travelStyles.includes('adventure')) return false;
  if (reqs.includes('wheelchair') && (item.difficulty > 1 || item.roadIntensity !== 'low')) return false;
  if (reqs.includes('no_alcohol') && item.tags.includes('nightlife')) return false;
  return true;
}

export default function TripItemSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ itemType?: string; day?: string; currentItemId?: string; region?: string }>();
  const generatedItinerary = useTripStore((state) => state.generatedItinerary);
  const preferences = useTripStore((state) => state.preferences);
  const updateTransport = useTripStore((state) => state.updateTransport);
  const updateFood = useTripStore((state) => state.updateFood);
  const updateActivity = useTripStore((state) => state.updateActivity);
  const [filter, setFilter] = useState('All');
  const [details, setDetails] = useState<SelectionItem | null>(null);

  const itemType = (params.itemType === 'food' || params.itemType === 'activity' || params.itemType === 'transport' ? params.itemType : 'transport') as SelectionType;
  const dayNumber = Number(params.day ?? '1') || 1;
  const currentDay = generatedItinerary?.dailyPlans.find((day) => day.day === dayNumber);
  const dayRegion = params.region ?? currentDay?.region ?? 'Bishkek';
  const currentActivity = itemType === 'activity'
    ? currentDay?.activities.find((activity) => activity.id === params.currentItemId)
    : undefined;

  const options = useMemo(() => {
    if (itemType === 'transport') {
      const eligible = TRANSPORT_OPTIONS.filter((item) => item.id !== params.currentItemId && transportAllowed(item, preferences));
      return eligible.sort((a, b) => scoreTransport(b, preferences, dayRegion, filter) - scoreTransport(a, preferences, dayRegion, filter));
    }
    if (itemType === 'food') {
      const eligible = FOOD_PLACES.filter((item) => item.id !== params.currentItemId && foodAllowed(item, preferences));
      return eligible.sort((a, b) => scoreFood(b, preferences, dayRegion, filter) - scoreFood(a, preferences, dayRegion, filter));
    }
    const eligible = ACTIVITIES.filter((item) => item.id !== params.currentItemId && activityAllowed(item, preferences));
    return eligible.sort((a, b) => scoreActivity(b, preferences, dayRegion, currentActivity, filter) - scoreActivity(a, preferences, dayRegion, currentActivity, filter));
  }, [currentActivity, dayRegion, filter, itemType, params.currentItemId, preferences]);

  const copy = itemCopy(itemType, dayNumber, dayRegion);

  function selectItem(item: SelectionItem) {
    if (!generatedItinerary) return;
    if (itemType === 'transport') updateTransport(dayNumber, item.id);
    if (itemType === 'food') updateFood(dayNumber, item.id);
    if (itemType === 'activity' && params.currentItemId) updateActivity(dayNumber, params.currentItemId, item.id);
    setDetails(null);
    Alert.alert('Trip updated');
    router.replace({ pathname: '/trip/itinerary', params: { day: String(dayNumber) } } as never);
  }

  if (!generatedItinerary || !currentDay) {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center px-8">
        <StatusBar style="dark" />
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary, textAlign: 'center' }}>No active trip</Text>
        <Button label="Back to home" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 18 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
            <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.6} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 29, color: colors.text.primary }}>{copy.title}</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>{copy.subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) + 22 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
          {FILTERS[itemType].map((item) => {
            const selected = filter === item;
            return (
              <Pressable key={item} onPress={() => setFilter(item)} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => ({ height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: selected ? colors.brand.primary : colors.surface.card, borderWidth: 1, borderColor: selected ? colors.brand.primary : colors.border.divider, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.78 : 1 })}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: selected ? '#fff' : colors.text.primary }}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
          {options.map((item) => (
            <SelectionCard
              key={item.id}
              item={item}
              itemType={itemType}
              dayRegion={dayRegion}
              preferences={preferences}
              currentActivity={currentActivity}
              onDetails={() => setDetails(item)}
              onSelect={() => selectItem(item)}
            />
          ))}
        </View>
      </ScrollView>

      <DetailsModal
        visible={!!details}
        item={details}
        itemType={itemType}
        dayNumber={dayNumber}
        dayRegion={dayRegion}
        preferences={preferences}
        currentActivity={currentActivity}
        onClose={() => setDetails(null)}
        onSelect={() => details && selectItem(details)}
      />
    </View>
  );
}

function itemCopy(type: SelectionType, dayNumber: number, region: string) {
  if (type === 'food') return { title: `Food options for Day ${dayNumber}`, subtitle: 'Matches your requirements' };
  if (type === 'activity') return { title: 'Replace activity', subtitle: `Best alternatives for Day ${dayNumber}` };
  return { title: `Transport options for Day ${dayNumber}`, subtitle: `${region} / short transfers` };
}

function whyFits(item: SelectionItem, type: SelectionType, preferences: TripPreferences, dayRegion: string, currentActivity?: Activity) {
  const points: string[] = [];
  if ('region' in item && regionMatch(item.region, dayRegion)) points.push(`matches ${dayRegion}`);
  if (type === 'transport' && 'roadToleranceRequired' in item && ROAD_RANK[item.roadToleranceRequired] <= ROAD_RANK[preferences.roadTolerance]) points.push('fits your road tolerance');
  if (type === 'food' && 'requirementsSupported' in item && activeRequirements(preferences).some((req) => item.requirementsSupported.includes(req))) points.push('supports your requirements');
  if (type === 'activity' && 'difficulty' in item && item.difficulty <= ACTIVITY_MAX[preferences.activityLevel]) points.push('fits your activity level');
  if (currentActivity && 'tags' in item && item.tags.some((tag) => currentActivity.tags.includes(tag))) points.push('keeps a similar experience');
  if (itemPrice(item) <= 10 || preferences.budgetTier !== 'budget') points.push('fits the budget');
  return points.length ? `It ${points.slice(0, 3).join(', ')}.` : 'It is one of the better local matches for this day.';
}

function SelectionCard({ item, itemType, dayRegion, preferences, currentActivity, onDetails, onSelect }: { item: SelectionItem; itemType: SelectionType; dayRegion: string; preferences: TripPreferences; currentActivity?: Activity; onDetails: () => void; onSelect: () => void }) {
  const icon = itemType === 'food' ? <Utensils size={18} color={colors.brand.primary} strokeWidth={1.8} /> : itemType === 'transport' ? <Car size={18} color={colors.brand.primary} strokeWidth={1.8} /> : <Clock size={18} color={colors.brand.primary} strokeWidth={1.8} />;
  const meta = itemMeta(item, itemType);
  return (
    <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>{item.name}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: colors.text.secondary, marginTop: 4 }}>{meta}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18, color: colors.brand.primary, marginTop: 6 }}>{whyFits(item, itemType, preferences, dayRegion, currentActivity)}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 10 }}>{item.description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {itemTags(item, itemType).slice(0, 5).map((tag) => <Chip key={tag} label={tag} height={28} fontSize={11} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Button variant="secondary" label="Details" onPress={onDetails} icon={<Info size={15} color={colors.brand.primary} strokeWidth={2} />} height={42} fontSize={13} style={{ flex: 1 }} />
        <Button label="Add" onPress={onSelect} icon={<Check size={15} color="#fff" strokeWidth={2} />} height={42} fontSize={13} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function itemMeta(item: SelectionItem, type: SelectionType) {
  if (type === 'food' && 'priceEstimate' in item) return `${item.city}, ${item.region} - ${formatUSD(item.priceEstimate)} estimate - ${item.rating} rating`;
  if (type === 'activity' && 'durationHours' in item) return `${item.city}, ${item.region} - ${item.durationHours}h - difficulty ${item.difficulty} - ${item.price > 0 ? formatUSD(item.price) : 'Free'}`;
  if ('regions' in item) return `${pretty(item.type)} - ${item.regions.join(', ')} - ${formatUSD(item.price)}`;
  return '';
}

function itemTags(item: SelectionItem, type: SelectionType) {
  if (type === 'transport' && 'roadToleranceRequired' in item) {
    return [item.qrPayment ? 'QR payment' : 'cash/contact', item.offlineContactAvailable ? 'offline contact' : 'online contact', item.roadToleranceRequired === 'low' ? 'short drive' : `${item.roadToleranceRequired} road`, ...item.tags.map(pretty)];
  }
  if (type === 'food' && 'requirementsSupported' in item) return [...item.requirementsSupported.map(pretty), ...item.tags.map(pretty)];
  if ('offlineReady' in item) return [item.offlineReady ? 'Offline-ready' : 'online', ...item.tags.map(pretty)];
  return item.tags.map(pretty);
}

function DetailsModal({ visible, item, itemType, dayNumber, dayRegion, preferences, currentActivity, onClose, onSelect }: { visible: boolean; item: SelectionItem | null; itemType: SelectionType; dayNumber: number; dayRegion: string; preferences: TripPreferences; currentActivity?: Activity; onClose: () => void; onSelect: () => void }) {
  if (!item) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>{item.name}</Text>
          <Text style={modalBody}>{item.description}</Text>
          <View style={{ gap: 8, marginTop: 14 }}>
            <DetailRow icon={<WalletCards size={16} color={colors.brand.primary} strokeWidth={2} />} label="Price" value={itemPrice(item) > 0 ? formatUSD(itemPrice(item)) : 'Free'} />
            {'durationHours' in item ? <DetailRow icon={<Clock size={16} color={colors.brand.primary} strokeWidth={2} />} label="Duration" value={`${item.durationHours} hours`} /> : null}
            {'rating' in item ? <DetailRow icon={<Star size={16} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />} label="Rating" value={`${item.rating} (${item.reviewCount} reviews)`} /> : null}
            {'qrPayment' in item ? <DetailRow icon={<QrCode size={16} color={colors.brand.primary} strokeWidth={2} />} label="QR" value={item.qrPayment ? 'QR payment available' : 'Cash/contact'} /> : null}
            {'offlineReady' in item ? <DetailRow icon={<WifiOff size={16} color={colors.brand.primary} strokeWidth={2} />} label="Offline" value={item.offlineReady ? 'Offline-ready' : 'Online details'} /> : null}
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginTop: 14 }}>Why it fits this trip</Text>
          <Text style={modalBody}>{whyFits(item, itemType, preferences, dayRegion, currentActivity)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {itemTags(item, itemType).slice(0, 8).map((tag) => <Chip key={tag} label={tag} height={28} fontSize={11} />)}
          </View>
          <View style={{ gap: 8, marginTop: 18 }}>
            <Button label={`Add to Day ${dayNumber}`} onPress={onSelect} height={46} fontSize={14} />
            <Button variant="ghost" label="Close" onPress={onClose} height={42} fontSize={14} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Text style={{ width: 76, fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.secondary }}>{label}</Text>
      <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>{value}</Text>
    </View>
  );
}

const modalBackdrop = { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 20 };
const modalCard = { width: '100%' as const, maxHeight: '86%' as const, borderRadius: 22, padding: 18, backgroundColor: colors.surface.card };
const modalTitle = { fontFamily: 'Fraunces_600SemiBold' as const, fontSize: 24, lineHeight: 29, color: colors.text.primary };
const modalBody = { fontFamily: 'Inter_400Regular' as const, fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 8 };
