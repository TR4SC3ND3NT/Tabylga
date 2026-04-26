import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock, Info, MapPin, QrCode, Search, ShieldCheck, Star, WalletCards, WifiOff, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import {
  calculateActivityCommission,
  getActivityTransportRequirement,
  getAllActivityOptions,
  type ActivityCategory,
  type ActivityOption,
  type ActivitySource,
  type RecommendedTransportType,
} from '../../lib/data/activityOptions';

const ACTIVITIES = getAllActivityOptions();
const BG_TINTS = ['#4a5d68', '#6a5a4b', '#56473d', '#3d6479', '#7a5a43', '#506a54'];
const MOCK_BOOKING_PEOPLE = 2;

type ActivityTab = 'all' | ActivityCategory;
type LabelKind = 'neutral' | 'success' | 'warning' | 'error' | 'brand';
type ActivityFilter = typeof FILTERS[number];

interface ReadyExperience {
  id: string;
  title: string;
  regions: string;
  activityIds: string[];
  transportNote: string;
  goodFor: string[];
}

const TABS: { label: string; value: ActivityTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Culture', value: 'culture' },
  { label: 'Nature', value: 'nature' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Local life', value: 'food_local_life' },
  { label: 'Nomadic', value: 'nomadic_culture' },
  { label: 'Wellness', value: 'wellness' },
];

const FILTERS = [
  'All',
  'Easy',
  'Family',
  'Free',
  'Short',
  'Photography',
  'Food/local life',
  'Offline-ready',
  'Guide included',
  'QR payment',
  'Transport needed',
  'Mountain driver',
] as const;

const SOURCE_LABELS: Record<ActivitySource, string> = {
  tabylga_partner: 'Tabylga partner',
  mtravel_partner_mock: 'MTravel partner mock',
  tour_operator_mock: 'Tour operator mock',
  public_tour_pattern: 'Public tour pattern',
};

const TRANSPORT_LABELS: Record<RecommendedTransportType, string> = {
  none: 'No transport needed',
  city_taxi: 'City taxi recommended',
  airport_transfer: 'Airport transfer',
  private_driver: 'Private driver recommended',
  shared_minivan: 'Shared minivan recommended',
  regional_transfer: 'Regional transfer needed',
  mountain_driver: 'Verified mountain driver required',
};

const READY_EXPERIENCES: ReadyExperience[] = [
  { id: 'first_day_bishkek', title: 'First day in Bishkek', regions: 'Bishkek, Chuy', activityIds: ['ala_too_square_oak_park_walk', 'osh_bazaar_local_life_walk', 'coworking_cafe_stop'], transportNote: 'Central walking route with optional city taxi.', goodFor: ['first day', 'budget', 'local life'] },
  { id: 'culture_nature_day', title: 'Culture + nature day', regions: 'Bishkek, Ala-Archa, Tokmok', activityIds: ['ala_archa_light_walk', 'burana_tower_cultural_stop'], transportNote: 'Private driver recommended.', goodFor: ['culture', 'nature', 'family'] },
  { id: 'issyk_kul_highlights', title: 'Issyk-Kul highlights', regions: 'Cholpon-Ata, Issyk-Kul', activityIds: ['cholpon_ata_petroglyphs', 'issyk_kul_beach_walk', 'ruh_ordo_cultural_center'], transportNote: 'Regional transfer recommended.', goodFor: ['lake', 'culture', 'relax'] },
  { id: 'karakol_culture_evening', title: 'Karakol culture evening', regions: 'Karakol, Issyk-Kul', activityIds: ['karakol_city_walk', 'dungan_mosque_visit', 'local_cooking_class'], transportNote: 'Local taxi or walking route.', goodFor: ['culture', 'food', 'evening'] },
  { id: 'song_kul_nomad_experience', title: 'Song-Kul nomad experience', regions: 'Song-Kul, Naryn', activityIds: ['song_kul_yurt_experience', 'song_kul_horse_riding', 'song_kul_photography_viewpoint'], transportNote: 'Verified mountain driver required.', goodFor: ['nomadic culture', 'remote', 'photography'] },
  { id: 'adventure_day', title: 'Adventure day', regions: 'Issyk-Kul, Karakol, Jeti-Oguz', activityIds: ['skazka_canyon_adventure_walk', 'jeti_oguz_light_hike', 'karakol_hot_springs'], transportNote: 'Regional/private driver recommended.', goodFor: ['adventure', 'hiking', 'wellness'] },
];

function money(value: number) {
  return '$' + value.toFixed(value % 1 === 0 ? 0 : 2);
}

function priceLabel(activity: ActivityOption) {
  if (activity.price === 0) return 'Free';
  return money(activity.price) + (activity.priceType === 'per_person' ? ' / person' : ' fixed');
}

function totalForPeople(activity: ActivityOption, people = MOCK_BOOKING_PEOPLE) {
  return activity.priceType === 'per_person' ? activity.price * people : activity.price;
}

function difficultyLabel(activity: ActivityOption) {
  if (activity.difficulty === 1) return 'Easy';
  if (activity.difficulty === 2) return 'Light';
  if (activity.difficulty === 3) return 'Moderate';
  return 'Hard';
}

function priceTypeLabel(activity: ActivityOption) {
  return activity.priceType === 'per_person' ? 'per person' : 'fixed price';
}

function categoryLabel(category: ActivityCategory) {
  return category.replace(/_/g, ' ');
}

function sourceColor(source: ActivitySource) {
  if (source === 'tabylga_partner') return colors.status.successText;
  if (source === 'mtravel_partner_mock') return colors.brand.primary;
  if (source === 'tour_operator_mock') return colors.brand.cta;
  return colors.text.secondary;
}

function labelStyle(kind: LabelKind) {
  const styles = {
    neutral: { backgroundColor: colors.surface.canvas, color: colors.text.secondary },
    success: { backgroundColor: colors.status.successLight, color: colors.status.successText },
    warning: { backgroundColor: colors.status.warningLight, color: colors.status.warningText },
    error: { backgroundColor: colors.status.errorLight, color: colors.status.errorText },
    brand: { backgroundColor: colors.brand.primaryLight, color: colors.brand.primary },
  } as const;
  return styles[kind];
}

function activityById(id: string) {
  return ACTIVITIES.find((activity) => activity.id === id);
}

function readyExperienceActivities(experience: ReadyExperience) {
  return experience.activityIds.map(activityById).filter((activity): activity is ActivityOption => Boolean(activity));
}

function readyExperienceEstimate(experience: ReadyExperience) {
  return readyExperienceActivities(experience).reduce((sum, activity) => sum + activity.price, 0);
}

function readyExperienceDifficulty(experience: ReadyExperience) {
  const maxDifficulty = Math.max(...readyExperienceActivities(experience).map((activity) => activity.difficulty));
  if (maxDifficulty <= 1) return 'Easy';
  if (maxDifficulty === 2) return 'Light';
  if (maxDifficulty === 3) return 'Moderate';
  return 'Hard';
}

function readyExperienceTransportKind(experience: ReadyExperience): LabelKind {
  if (experience.transportNote.toLowerCase().includes('verified mountain')) return 'error';
  if (experience.transportNote.toLowerCase().includes('driver') || experience.transportNote.toLowerCase().includes('transfer')) return 'warning';
  return 'success';
}

function includesSearch(activity: ActivityOption, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const haystack = [activity.name, activity.provider, activity.typeLabel, activity.city, activity.region, activity.description, activity.tags.join(' ')].join(' ').toLowerCase();
  return haystack.includes(query);
}

function matchesFilter(activity: ActivityOption, filter: ActivityFilter) {
  if (filter === 'All') return true;
  if (filter === 'Easy') return activity.difficulty === 1;
  if (filter === 'Family') return activity.familyFriendly;
  if (filter === 'Free') return activity.price === 0;
  if (filter === 'Short') return activity.durationHours <= 2;
  if (filter === 'Photography') return activity.tags.some((tag) => ['photography', 'sunset', 'viewpoint', 'canyon', 'lake'].includes(tag));
  if (filter === 'Food/local life') return activity.category === 'food_local_life' || activity.tags.some((tag) => ['food', 'bazaar', 'local life', 'cooking'].includes(tag));
  if (filter === 'Offline-ready') return activity.offlineReady;
  if (filter === 'Guide included') return activity.guideIncluded;
  if (filter === 'QR payment') return activity.qrPayment;
  if (filter === 'Transport needed') return activity.requiresTransport === true;
  if (filter === 'Mountain driver') return activity.requiresVerifiedMountainDriver === true || activity.recommendedTransportType === 'mountain_driver';
  return true;
}

function Pill({ label, kind = 'neutral' }: { label: string; kind?: LabelKind }) {
  const style = labelStyle(kind);
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: style.backgroundColor }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: style.color }}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 3, flexGrow: 1, flexBasis: '46%' }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.text.tertiary }}>{label}</Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>{value}</Text>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary }}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Not specified for this mock listing.</Text>;
  }
  return (
    <View style={{ gap: 5 }}>
      {items.map((item) => <Text key={item} style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, color: colors.text.secondary }}>- {item}</Text>)}
    </View>
  );
}

function PaymentPills({ activity }: { activity: ActivityOption }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {activity.qrPayment && <Pill label="QR payment" kind="brand" />}
      {activity.offlinePaymentSupported && <Pill label="Offline Pay" kind="warning" />}
      {activity.offlineReady && <Pill label="Offline-ready" kind="success" />}
      {!activity.qrPayment && !activity.offlinePaymentSupported && !activity.offlineReady && <Pill label="Basic booking" />}
    </View>
  );
}

function ActivityDetailsModal({ activity, booked, onClose, onBook }: { activity: ActivityOption | null; booked: boolean; onClose: () => void; onBook: (activity: ActivityOption) => void }) {
  const [businessOpen, setBusinessOpen] = useState(false);
  if (!activity) return null;

  const selectedActivity = activity;
  const transport = getActivityTransportRequirement(selectedActivity);
  const commission = calculateActivityCommission(selectedActivity);
  const transportKind: LabelKind = transport.requiresVerifiedMountainDriver ? 'error' : transport.requiresTransport ? 'warning' : 'success';
  const whyItFits = activity.goodFor.slice(0, 3).map((item) => item.replace(/_/g, ' ')).join(', ');

  function handleBook() {
    onBook(selectedActivity);
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(26,26,26,0.42)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface.primary, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 28, color: colors.text.primary }} numberOfLines={2}>{activity.name}</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: sourceColor(activity.source), marginTop: 2 }}>{SOURCE_LABELS[activity.source]}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', opacity: pressed ? 0.7 : 1 })}>
              <X size={20} color={colors.text.primary} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <Card style={{ overflow: 'hidden' }}>
              <View style={{ minHeight: 126, backgroundColor: BG_TINTS[Math.abs(activity.id.length) % BG_TINTS.length], padding: 14, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {activity.verified && <Pill label="Verified" kind="success" />}
                  <Pill label={activity.typeLabel} kind="brand" />
                  <Pill label={categoryLabel(activity.category)} />
                  {booked && <Pill label="booked_mock" kind="success" />}
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{activity.provider}</Text>
                  <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 26, lineHeight: 30, color: '#fff' }}>{activity.city}, {activity.region}</Text>
                </View>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <DetailRow label="Price" value={priceLabel(activity) + ' - ' + priceTypeLabel(activity)} />
              <DetailRow label="Duration" value={activity.durationHours + 'h'} />
              <DetailRow label="Difficulty" value={difficultyLabel(activity)} />
              <DetailRow label="Rating" value={activity.rating.toFixed(1) + ' (' + activity.reviewCount + ' reviews)'} />
            </View>

            <DetailSection title="Overview">
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19, color: colors.text.primary }}>{activity.description}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, color: colors.text.secondary }}>{activity.longDescription}</Text>
            </DetailSection>

            <DetailSection title="Guide and meeting point">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                <Pill label={activity.guideIncluded ? 'Guide included' : 'Guide not included'} kind={activity.guideIncluded ? 'brand' : 'neutral'} />
                <Pill label={'Languages: ' + activity.guideLanguages.join(', ')} kind="brand" />
                {activity.meetingPoint && <Pill label={'Meeting: ' + activity.meetingPoint} />}
              </View>
            </DetailSection>

            <DetailSection title="Payment and offline readiness">
              <PaymentPills activity={activity} />
            </DetailSection>

            <Card style={{ padding: 13, gap: 9, backgroundColor: labelStyle(transportKind).backgroundColor }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: labelStyle(transportKind).color }}>Transport requirement</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19, color: colors.text.primary }}>{TRANSPORT_LABELS[transport.recommendedTransportType]}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, color: colors.text.secondary }}>{transport.transportNote}</Text>
              {transport.requiresVerifiedMountainDriver && <Pill label="Verified mountain driver required" kind="error" />}
            </Card>

            <DetailSection title="Included"><BulletList items={activity.included} /></DetailSection>
            <DetailSection title="Not included"><BulletList items={activity.notIncluded} /></DetailSection>
            <DetailSection title="Safety notes"><BulletList items={activity.safetyNotes} /></DetailSection>

            <DetailSection title="Requirements supported">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(activity.requirementsSupported.length > 0 ? activity.requirementsSupported : ['standard travelers']).map((item) => <Pill key={item} label={item.replace(/_/g, ' ')} />)}
              </View>
            </DetailSection>

            <DetailSection title="Tags">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{activity.tags.map((tag) => <Pill key={tag} label={tag} />)}</View>
            </DetailSection>

            <Card style={{ padding: 13, gap: 7, backgroundColor: colors.brand.primaryLight }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>Why it fits this trip</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, color: colors.text.secondary }}>Standalone marketplace demo: this activity is best for {whyItFits || 'general sightseeing'} and can be inserted into a generated trip day in the replace flow.</Text>
            </Card>

            {activity.reviews.length > 0 && (
              <DetailSection title="Recent reviews">
                <View style={{ gap: 8 }}>
                  {activity.reviews.slice(0, 2).map((review) => (
                    <Card key={review.user + '-' + review.date} style={{ padding: 12, gap: 5 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>{review.user} - {review.rating.toFixed(1)}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary }}>{review.text}</Text>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.text.tertiary }}>{review.date}</Text>
                    </Card>
                  ))}
                </View>
              </DetailSection>
            )}

            <Card style={{ padding: 13, gap: 9, borderWidth: 1, borderColor: colors.border.divider }}>
              <Pressable onPress={() => setBusinessOpen((value) => !value)} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary }}>Business model demo</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.text.secondary, marginTop: 2 }}>Secondary mock revenue view</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.brand.primary }}>{businessOpen ? '-' : '+'}</Text>
                </View>
              </Pressable>
              {businessOpen && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <DetailRow label="Tourist price" value={money(commission.touristPrice)} />
                  <DetailRow label="Commission rate" value={Math.round(commission.commissionRate * 100) + '%'} />
                  <DetailRow label="Tabylga commission" value={money(commission.tabylgaCommission)} />
                  <DetailRow label="Partner payout" value={money(commission.partnerPayout)} />
                </View>
              )}
            </Card>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Close" variant="secondary" height={48} fontSize={14} style={{ flex: 1 }} onPress={onClose} />
              <Button label={booked ? 'booked_mock' : 'Book mock'} variant={booked ? 'primary' : 'cta'} height={48} fontSize={14} style={{ flex: 1 }} disabled={booked} onPress={handleBook} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActivityBookingModal({ activity, alreadyBooked, onClose, onConfirm }: { activity: ActivityOption | null; alreadyBooked: boolean; onClose: () => void; onConfirm: (activity: ActivityOption) => void }) {
  if (!activity) return null;

  const transport = getActivityTransportRequirement(activity);
  const requirements = activity.requirementsSupported.length > 0 ? activity.requirementsSupported : ['standard travelers'];
  const totalEstimate = totalForPeople(activity);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(26,26,26,0.42)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface.primary, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 28, color: colors.text.primary }}>Mock booking</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>{activity.name}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', opacity: pressed ? 0.7 : 1 })}>
              <X size={20} color={colors.text.primary} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 22 }} showsVerticalScrollIndicator={false}>
            <Card style={{ padding: 14, gap: 8 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>{activity.provider}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, color: colors.text.secondary }}>This confirms a demo booking request only. No backend, real payment, provider account or ticket is created.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                <Pill label="status: booked_mock" kind={alreadyBooked ? 'success' : 'brand'} />
                <Pill label={SOURCE_LABELS[activity.source]} />
              </View>
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <DetailRow label="Date / day" value="Demo date - standalone marketplace" />
              <DetailRow label="People count" value={String(MOCK_BOOKING_PEOPLE) + ' tourists'} />
              <DetailRow label="Total estimate" value={activity.price === 0 ? 'Free' : money(totalEstimate)} />
              <DetailRow label="Price basis" value={priceTypeLabel(activity)} />
              <DetailRow label="Guide language" value={activity.guideIncluded ? activity.guideLanguages.join(', ') : 'Guide not included'} />
              <DetailRow label="Provider" value={activity.provider} />
            </View>

            <DetailSection title="Requirements"><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{requirements.map((item) => <Pill key={item} label={item.replace(/_/g, ' ')} />)}</View></DetailSection>

            <Card style={{ padding: 13, gap: 8, backgroundColor: transport.requiresVerifiedMountainDriver ? colors.status.errorLight : colors.brand.primaryLight }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: transport.requiresVerifiedMountainDriver ? colors.status.errorText : colors.brand.primary }}>Transport requirement</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text.primary }}>{TRANSPORT_LABELS[transport.recommendedTransportType]}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, color: colors.text.secondary }}>{transport.transportNote}</Text>
            </Card>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Close" variant="secondary" height={48} fontSize={14} style={{ flex: 1 }} onPress={onClose} />
              <Button label={alreadyBooked ? 'Already booked' : 'Confirm booking'} variant={alreadyBooked ? 'primary' : 'cta'} height={48} fontSize={14} style={{ flex: 1 }} disabled={alreadyBooked} onPress={() => onConfirm(activity)} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActivityCard({ activity, index, booked, onBook, onDetails }: { activity: ActivityOption; index: number; booked: boolean; onBook: () => void; onDetails: () => void }) {
  const transport = getActivityTransportRequirement(activity);
  const transportKind: LabelKind = transport.requiresVerifiedMountainDriver ? 'error' : transport.requiresTransport ? 'warning' : 'success';
  const topTags = activity.tags.slice(0, 3);

  return (
    <Card style={{ overflow: 'hidden', flexGrow: 1, flexBasis: '48%', minWidth: 280 }}>
      <View style={{ height: 132, backgroundColor: BG_TINTS[index % BG_TINTS.length], padding: 12, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }}><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff' }} numberOfLines={1}>{activity.typeLabel}</Text></View>
          {activity.verified && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }}><ShieldCheck size={13} color="#fff" strokeWidth={2} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10.5, color: '#fff' }}>Verified</Text></View>}
        </View>
        <View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 27, color: '#fff' }} numberOfLines={2}>{activity.name}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.86)', marginTop: 4 }} numberOfLines={1}>{activity.city}, {activity.region}</Text>
        </View>
      </View>

      <View style={{ padding: 13, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.brand.primary }}>{priceLabel(activity)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Star size={13} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.primary }}>{activity.rating.toFixed(1)}</Text><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.text.secondary }}>({activity.reviewCount})</Text></View>
        </View>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.primary }} numberOfLines={1}>{activity.provider}</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary }} numberOfLines={2}>{activity.description}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.secondary }}><Clock size={13} color={colors.text.secondary} strokeWidth={1.7} /> {activity.durationHours}h</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.secondary }}><Info size={13} color={colors.text.secondary} strokeWidth={1.7} /> {difficultyLabel(activity)}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text.secondary }}><MapPin size={13} color={colors.text.secondary} strokeWidth={1.7} /> {activity.city}</Text>
        </View>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: sourceColor(activity.source) }}>{SOURCE_LABELS[activity.source]}</Text>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, color: transport.requiresVerifiedMountainDriver ? colors.status.errorText : colors.brand.primary }}>{TRANSPORT_LABELS[transport.recommendedTransportType]}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}><Pill label={activity.guideIncluded ? 'Guide: ' + activity.guideLanguages.slice(0, 2).join(', ') : 'Guide optional'} kind={activity.guideIncluded ? 'brand' : 'neutral'} /><Pill label={TRANSPORT_LABELS[transport.recommendedTransportType]} kind={transportKind} /></View>
        <PaymentPills activity={activity} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{topTags.map((tag) => <Pill key={tag} label={tag} />)}{booked && <Pill label="booked_mock" kind="success" />}</View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <Button label="Details" variant="secondary" height={42} fontSize={13} style={{ flex: 1 }} onPress={onDetails} />
          <Button label={booked ? 'booked_mock' : 'Book mock'} variant={booked ? 'primary' : 'cta'} height={42} fontSize={13} style={{ flex: 1 }} icon={booked ? <Check size={15} color="#fff" strokeWidth={2} /> : undefined} disabled={booked} onPress={onBook} />
        </View>
      </View>
    </Card>
  );
}

function ReadyExperienceCard({ experience, booked, onBook }: { experience: ReadyExperience; booked: boolean; onBook: () => void }) {
  const activities = readyExperienceActivities(experience);
  const totalEstimate = readyExperienceEstimate(experience);
  return (
    <Card style={{ padding: 14, gap: 10, width: 286 }}>
      <View style={{ gap: 4 }}><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, lineHeight: 25, color: colors.text.primary }} numberOfLines={2}>{experience.title}</Text><Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.brand.primary }}>{experience.regions}</Text></View>
      <View style={{ gap: 5 }}>{activities.map((activity) => <Text key={activity.id} style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, color: colors.text.secondary }} numberOfLines={1}>- {activity.name}</Text>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}><Pill label={totalEstimate > 0 ? money(totalEstimate) + ' estimate' : 'Free estimate'} kind="brand" /><Pill label={readyExperienceDifficulty(experience)} /><Pill label={experience.transportNote} kind={readyExperienceTransportKind(experience)} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{experience.goodFor.map((tag) => <Pill key={tag} label={tag} />)}</View>
      <Button label={booked ? 'booked_mock' : 'Book mock'} variant={booked ? 'primary' : 'cta'} height={42} fontSize={13} disabled={booked} onPress={onBook} />
    </Card>
  );
}

function ReadyExperiencesSection({ bookedExperienceIds, onBook }: { bookedExperienceIds: Set<string>; onBook: (experience: ReadyExperience) => void }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 3 }}><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 25, lineHeight: 29, color: colors.text.primary }}>Ready tour experiences</Text><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, color: colors.text.secondary }}>Packaged mock routes composed from activity options.</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>{READY_EXPERIENCES.map((experience) => <ReadyExperienceCard key={experience.id} experience={experience} booked={bookedExperienceIds.has(experience.id)} onBook={() => onBook(experience)} />)}</ScrollView>
    </View>
  );
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const [filter, setFilter] = useState<ActivityFilter>('All');
  const [search, setSearch] = useState('');
  const [bookedActivityIds, setBookedActivityIds] = useState<Set<string>>(() => new Set());
  const [bookedExperienceIds, setBookedExperienceIds] = useState<Set<string>>(() => new Set());
  const [detailsActivity, setDetailsActivity] = useState<ActivityOption | null>(null);
  const [bookingActivity, setBookingActivity] = useState<ActivityOption | null>(null);

  const filteredActivities = useMemo(() => {
    return ACTIVITIES.filter((activity) => activeTab === 'all' || activity.category === activeTab)
      .filter((activity) => matchesFilter(activity, filter))
      .filter((activity) => includesSearch(activity, search));
  }, [activeTab, filter, search]);

  function openBooking(activity: ActivityOption) {
    setDetailsActivity(null);
    setBookingActivity(activity);
  }

  function confirmBooking(activity: ActivityOption) {
    setBookedActivityIds((current) => {
      const next = new Set(current);
      next.add(activity.id);
      return next;
    });
    setBookingActivity(null);
    Alert.alert('Booking confirmed', activity.name + ' status: booked_mock. No real booking or payment was made.');
  }

  function bookReadyExperience(experience: ReadyExperience) {
    setBookedExperienceIds((current) => {
      const next = new Set(current);
      next.add(experience.id);
      return next;
    });
    Alert.alert('Ready experience selected', experience.title + ' status: booked_mock. This is a packaged demo route, not a real booking.');
  }

  function resetFilters() {
    setActiveTab('all');
    setFilter('All');
    setSearch('');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} /></Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary, flex: 1, textAlign: 'center', marginRight: 44 }}>Activities & Tours</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Card style={{ padding: 20, gap: 14, backgroundColor: '#f2eadc' }}>
          <View style={{ gap: 8 }}><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 31, lineHeight: 35, color: colors.text.primary }}>Activities & Tours</Text><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21, color: colors.text.secondary }}>Choose cultural stops, nature walks, horse riding, food experiences and guided tours.</Text><Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.brand.primary }}>Curated from local tour patterns and partner experiences. Mock data only.</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border.input, backgroundColor: '#fff' }}><Search size={18} color={colors.text.secondary} strokeWidth={1.8} /><TextInput value={search} onChangeText={setSearch} placeholder="Search activities, tours or places" placeholderTextColor={colors.text.tertiary} style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.primary, paddingVertical: 0 }} /></View>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>{TABS.map((tab) => <Chip key={tab.value} label={tab.label} selected={activeTab === tab.value} onPress={() => setActiveTab(tab.value)} />)}</ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>{FILTERS.map((item) => <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} height={30} fontSize={12} />)}</ScrollView>

        <ReadyExperiencesSection bookedExperienceIds={bookedExperienceIds} onBook={bookReadyExperience} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary }}>{filteredActivities.length} activities found</Text>{bookedActivityIds.size > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Check size={14} color={colors.status.successText} strokeWidth={2} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.status.successText }}>{bookedActivityIds.size} booked_mock</Text></View>}</View>

        {filteredActivities.length === 0 ? (
          <Card style={{ padding: 20, gap: 8, alignItems: 'center' }}><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 23, color: colors.text.primary, textAlign: 'center' }}>No matching activities</Text><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, color: colors.text.secondary, textAlign: 'center' }}>Try another filter or reset to All.</Text><Button label="Reset filters" variant="secondary" height={44} fontSize={13} style={{ marginTop: 8, maxWidth: 180 }} onPress={resetFilters} /></Card>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{filteredActivities.map((activity, index) => <ActivityCard key={activity.id} activity={activity} index={index} booked={bookedActivityIds.has(activity.id)} onBook={() => openBooking(activity)} onDetails={() => setDetailsActivity(activity)} />)}</View>
        )}

        <Card style={{ padding: 14, gap: 10, backgroundColor: colors.brand.primaryLight }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><QrCode size={16} color={colors.brand.primary} strokeWidth={1.8} /><WalletCards size={16} color={colors.brand.primary} strokeWidth={1.8} /><WifiOff size={16} color={colors.brand.primary} strokeWidth={1.8} /><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>Demo labels</Text></View><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, color: colors.text.secondary }}>Source, payment and transport labels are mock/demo metadata. No real booking, payment, tour API or map integration is used here.</Text></Card>
      </ScrollView>

      <ActivityDetailsModal activity={detailsActivity} booked={detailsActivity ? bookedActivityIds.has(detailsActivity.id) : false} onClose={() => setDetailsActivity(null)} onBook={openBooking} />
      <ActivityBookingModal activity={bookingActivity} alreadyBooked={bookingActivity ? bookedActivityIds.has(bookingActivity.id) : false} onClose={() => setBookingActivity(null)} onConfirm={confirmBooking} />
    </SafeAreaView>
  );
}
