import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BedDouble, Car, Download, RefreshCw, Route, Sparkles, Undo2, Utensils, WalletCards, WifiOff, Zap } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { formatUSD } from '../../lib/format';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { useTripStore } from '../../stores/tripStore';
import type { GeneratedTripDay } from '../../lib/trip/tripGenerator';

function pretty(value: string) {
  return value.replace(/_/g, ' ');
}

export default function ItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ day?: string }>();
  const insets = useSafeAreaInsets();
  const {
    generatedItinerary,
    regenerateDay,
    makeCheaper,
    makeMoreActive,
    makeMoreComfortable,
    undoLastEdit,
    undoTrip,
    lastEditLabel,
    saveOfflinePack,
    lockTripDemo,
    resetTrip,
  } = useTripStore();
  const [activeDay, setActiveDay] = useState(1);
  const [offlineModal, setOfflineModal] = useState(false);
  const [lockModal, setLockModal] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [lockedSuccess, setLockedSuccess] = useState(false);

  useEffect(() => {
    const dayFromRoute = Number(params.day);
    if (Number.isFinite(dayFromRoute) && dayFromRoute > 0) setActiveDay(dayFromRoute);
  }, [params.day]);

  const currentDay = useMemo(() => {
    if (!generatedItinerary) return null;
    return generatedItinerary.dailyPlans.find((day) => day.day === activeDay) ?? generatedItinerary.dailyPlans[0];
  }, [activeDay, generatedItinerary]);

  if (!generatedItinerary || !currentDay) {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center px-8">
        <StatusBar style="dark" />
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary, textAlign: 'center' }}>No itinerary yet</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginTop: 8, marginBottom: 20 }}>Start with the planner or choose a ready trip.</Text>
        <Button label="Start planning" onPress={() => router.replace('/trip/purpose')} />
      </SafeAreaView>
    );
  }

  const trip = generatedItinerary;

  function startOver() {
    Alert.alert('Start a new trip?', 'This will clear your current route and preferences, but your demo wallet and app data will stay.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start new trip', style: 'destructive', onPress: () => { resetTrip(); router.replace('/(tabs)'); Alert.alert('Trip reset. You can start a new plan.'); } },
    ]);
  }

  async function handleOfflinePack() {
    await saveOfflinePack();
    setOfflineModal(true);
  }

  async function continueDemoLock() {
    await lockTripDemo();
    setLockModal(false);
    setLockedSuccess(true);
  }

  return (
    <View className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => router.replace('/(tabs)')} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>Your Kyrgyzstan trip</Text>
        <Pressable onPress={startOver} accessibilityRole="button" style={({ pressed }) => ({ paddingHorizontal: 10, height: 36, justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ padding: 20 }}>
          <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.brand.primaryLight }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 33, color: colors.text.primary }}>{trip.title}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 8 }}>{trip.summary}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <InfoPill label={`${trip.days} days`} />
              <InfoPill label={`${trip.travelerCount} ${trip.travelerCount === 1 ? 'traveler' : 'travelers'}`} />
              <InfoPill label={pretty(trip.budgetTier)} />
              <InfoPill label={`${formatUSD(trip.costPerPerson)} per person`} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <Metric label="Total estimate" value={formatUSD(trip.totalCost)} />
              <Metric label="Regions" value={String(trip.regions.length)} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {trip.regions.map((region) => <Chip key={region} label={region} height={30} fontSize={12} />)}
            </View>
          </View>

          <View style={{ marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.status.warningLight, alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={19} color={colors.brand.cta} strokeWidth={1.8} />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>Why this trip fits you</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: colors.text.secondary, marginTop: 10 }}>{trip.whyThisFits}</Text>
          </View>

          {undoTrip && lastEditLabel ? (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: colors.status.successLight, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.status.successText }}>{lastEditLabel}</Text>
              <Pressable onPress={undoLastEdit} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
                <Undo2 size={15} color={colors.status.successText} strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.status.successText }}>Undo</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary, marginTop: 20, marginBottom: 10 }}>Your route includes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <IncludeCard icon={<BedDouble size={18} color={colors.brand.primary} />} label="Stays" count={trip.dailyPlans.length} />
            <IncludeCard icon={<Car size={18} color={colors.brand.primary} />} label="Transport" count={trip.dailyPlans.length} />
            <IncludeCard icon={<Utensils size={18} color={colors.brand.primary} />} label="Food" count={trip.dailyPlans.length} />
            <IncludeCard icon={<Route size={18} color={colors.brand.primary} />} label="Activities" count={trip.dailyPlans.reduce((sum, day) => sum + day.activities.length, 0)} />
            <IncludeCard icon={<WifiOff size={18} color={colors.brand.primary} />} label="Offline-ready" count={trip.dailyPlans.filter((day) => day.offlineReady).length} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <SmallAction label="Make cheaper" icon={<WalletCards size={15} color={colors.brand.primary} strokeWidth={2} />} onPress={makeCheaper} />
            <SmallAction label="More active" icon={<Zap size={15} color={colors.brand.primary} strokeWidth={2} />} onPress={makeMoreActive} />
            <SmallAction label="More comfortable" icon={<BedDouble size={15} color={colors.brand.primary} strokeWidth={2} />} onPress={makeMoreComfortable} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {trip.dailyPlans.map((day) => {
            const selected = day.day === currentDay.day;
            return (
              <Pressable key={day.day} onPress={() => setActiveDay(day.day)} accessibilityRole="tab" accessibilityState={{ selected }} style={({ pressed }) => ({ height: 38, paddingHorizontal: 16, borderRadius: 999, backgroundColor: selected ? colors.brand.primary : colors.surface.card, borderWidth: 1, borderColor: selected ? colors.brand.primary : colors.border.divider, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: selected ? '#fff' : colors.text.primary }}>Day {day.day}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <DayPackage
            day={currentDay}
            onChangeStay={() => router.push({ pathname: '/services/hotels', params: { mode: 'change_stay', day: String(currentDay.day), region: currentDay.region } } as never)}
            onChangeTransport={() => router.push({ pathname: '/trip/select', params: { itemType: 'transport', day: String(currentDay.day), currentItemId: currentDay.transport.id, region: currentDay.region } } as never)}
            onChangeFood={() => router.push({ pathname: '/trip/select', params: { itemType: 'food', day: String(currentDay.day), currentItemId: currentDay.food.id, region: currentDay.region } } as never)}
            onRegenerate={() => regenerateDay(currentDay.day)}
            onReplaceActivity={(activityId) => router.push({ pathname: '/trip/select', params: { itemType: 'activity', day: String(currentDay.day), currentItemId: activityId, region: currentDay.region } } as never)}
          />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.surface.card, borderTopWidth: 1, borderTopColor: colors.border.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 88 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Total</Text>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.text.primary }}>{formatUSD(trip.totalCost)}</Text>
          </View>
          <Button variant="secondary" label="Save offline" icon={<Download size={16} color={colors.brand.primary} strokeWidth={2} />} onPress={handleOfflinePack} height={50} fontSize={13} style={{ flex: 1 }} />
          <Button variant="cta" label="Lock trip" onPress={() => setLockModal(true)} height={50} fontSize={13} style={{ flex: 1 }} />
        </View>
      </View>

      <OfflineModal visible={offlineModal} onClose={() => setOfflineModal(false)} />
      <LockModal visible={lockModal} total={trip.totalCost} trip={trip} onClose={() => setLockModal(false)} onContinue={continueDemoLock} onCreateAccount={() => { setLockModal(false); setAccountModal(true); }} />
      <AccountModal visible={accountModal} onClose={() => setAccountModal(false)} onCreate={() => router.push('/auth/phone')} />
      <SuccessModal visible={lockedSuccess} onClose={() => setLockedSuccess(false)} />
    </View>
  );
}

function DayPackage({ day, onChangeStay, onChangeTransport, onChangeFood, onRegenerate, onReplaceActivity }: { day: GeneratedTripDay; onChangeStay: () => void; onChangeTransport: () => void; onChangeFood: () => void; onRegenerate: () => void; onReplaceActivity: (activityId: string) => void }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Route size={21} color={colors.brand.primary} strokeWidth={1.7} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text.primary }}>{day.title}</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, marginTop: 4 }}>{day.region} - {formatUSD(day.estimatedCost)} per person</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 10 }}>{day.reason}</Text>
        <Pressable onPress={onRegenerate} accessibilityRole="button" style={({ pressed }) => ({ marginTop: 12, height: 38, borderRadius: 12, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: pressed ? 0.75 : 1 })}>
          <RefreshCw size={15} color={colors.brand.primary} strokeWidth={2} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.brand.primary }}>Regenerate day</Text>
        </Pressable>
      </View>

      <PackageCard title="Stay" action="Change stay" onPress={onChangeStay}>
        <Text style={stylesTitle}>{day.stay.name}</Text>
        <Text style={stylesSub}>{day.stay.type} - {day.stay.city}, {day.stay.region}</Text>
        <Text style={stylesPrice}>{formatUSD(day.stay.pricePerNight)} / night - {day.stay.rating} rating</Text>
        <TagRow tags={[...day.stay.tags.slice(0, 3), day.stay.wifi ? 'Wi-Fi' : 'offline pay']} />
      </PackageCard>

      <PackageCard title="Transport" action="Change transport" onPress={onChangeTransport}>
        <Text style={stylesTitle}>{day.transport.name}</Text>
        <Text style={stylesSub}>{pretty(day.transport.type)} - {day.transport.description}</Text>
        <Text style={stylesPrice}>{formatUSD(day.transport.price)}</Text>
        <TagRow tags={[day.transport.qrPayment ? 'QR payment' : 'cash/contact', day.transport.offlineContactAvailable ? 'offline contact' : 'online']} />
      </PackageCard>

      <PackageCard title="Food" action="Change food" onPress={onChangeFood}>
        <Text style={stylesTitle}>{day.food.name}</Text>
        <Text style={stylesSub}>{day.food.description}</Text>
        <Text style={stylesPrice}>{formatUSD(day.food.priceEstimate)} estimate - {day.food.rating} rating</Text>
        <TagRow tags={day.food.requirementsSupported.slice(0, 4).map(pretty)} />
      </PackageCard>

      {day.activities.map((activity) => (
        <PackageCard key={activity.id} title="Activity" action="Replace" onPress={() => onReplaceActivity(activity.id)}>
          <Text style={stylesTitle}>{activity.name}</Text>
          <Text style={stylesSub}>{activity.durationHours}h - difficulty {activity.difficulty} - {activity.description}</Text>
          <Text style={stylesPrice}>{activity.price > 0 ? formatUSD(activity.price) : 'Free'}</Text>
          <TagRow tags={activity.labels.length ? activity.labels : activity.tags.slice(0, 4).map(pretty)} />
        </PackageCard>
      ))}
    </View>
  );
}

const stylesTitle = { fontFamily: 'Inter_700Bold' as const, fontSize: 16, color: colors.text.primary };
const stylesSub = { fontFamily: 'Inter_400Regular' as const, fontSize: 13, lineHeight: 18, color: colors.text.secondary, marginTop: 4 };
const stylesPrice = { fontFamily: 'Inter_700Bold' as const, fontSize: 13, color: colors.brand.primary, marginTop: 7 };

function PackageCard({ title, action, onPress, children }: { title: string; action: string; onPress: () => void; children: ReactNode }) {
  return (
    <View style={{ padding: 14, borderRadius: 18, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.tertiary, textTransform: 'uppercase' }}>{title}</Text>
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ paddingHorizontal: 10, height: 30, borderRadius: 10, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>{action}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{tags.slice(0, 5).map((tag) => <Chip key={tag} label={tag} height={28} fontSize={11} />)}</View>;
}

function InfoPill({ label }: { label: string }) {
  return <View style={{ paddingHorizontal: 10, height: 30, borderRadius: 999, backgroundColor: colors.surface.card, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>{label}</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: colors.surface.card }}><Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>{label}</Text><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.brand.primary, marginTop: 2 }}>{value}</Text></View>;
}

function IncludeCard({ icon, label, count }: { icon: ReactNode; label: string; count: number }) {
  return <View style={{ width: '48.5%', padding: 12, borderRadius: 16, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{icon}<Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary }}>{label}</Text></View><Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.brand.primary, marginTop: 8 }}>{count}</Text></View>;
}

function SmallAction({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ height: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.border.divider, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.75 : 1 })}>{icon}<Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>{label}</Text></Pressable>;
}

function OfflineModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const checklist = ['Itinerary saved', 'Stay details saved', 'Transport contacts saved', 'Food and activity notes saved', 'Emergency contacts saved', 'Offline map placeholder saved', 'Phrasebook saved', 'Offline-ready labels prepared'];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>Offline pack ready</Text>
          {checklist.map((item) => <Text key={item} style={modalLine}>- {item}</Text>)}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Button variant="secondary" label="View offline pack" onPress={onClose} style={{ flex: 1 }} height={46} fontSize={13} />
            <Button label="Done" onPress={onClose} style={{ flex: 1 }} height={46} fontSize={13} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LockModal({ visible, total, trip, onClose, onContinue, onCreateAccount }: { visible: boolean; total: number; trip: { dailyPlans: GeneratedTripDay[] }; onClose: () => void; onContinue: () => void; onCreateAccount: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>Lock your itinerary</Text>
          <Text style={modalBody}>Total estimate: {formatUSD(total)}</Text>
          <Text style={modalBody}>{trip.dailyPlans.length} stays, {trip.dailyPlans.length} transport legs, {trip.dailyPlans.length} food picks and {trip.dailyPlans.reduce((sum, day) => sum + day.activities.length, 0)} activities.</Text>
          <Text style={[modalBody, { marginTop: 8 }]}>This is a demo. Real booking and payments will be connected through licensed partners.</Text>
          <View style={{ gap: 8, marginTop: 18 }}>
            <Button label="Continue demo" onPress={onContinue} height={46} fontSize={14} />
            <Button variant="secondary" label="Create account to save" onPress={onCreateAccount} height={46} fontSize={14} />
            <Button variant="ghost" label="Cancel" onPress={onClose} height={42} fontSize={14} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AccountModal({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>Create an account to save this trip</Text>
          <View style={{ gap: 8, marginTop: 18 }}>
            <Button label="Create account" onPress={onCreate} height={46} fontSize={14} />
            <Button variant="secondary" label="Continue demo" onPress={onClose} height={46} fontSize={14} />
            <Button variant="ghost" label="Not now" onPress={onClose} height={42} fontSize={14} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SuccessModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalBackdrop}>
        <View style={modalCard}>
          <Text style={modalTitle}>Your itinerary is locked in demo mode.</Text>
          <Button label="Done" onPress={onClose} style={{ marginTop: 18 }} />
        </View>
      </View>
    </Modal>
  );
}

const modalBackdrop = { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 20 };
const modalCard = { width: '100%' as const, borderRadius: 22, padding: 18, backgroundColor: colors.surface.card };
const modalTitle = { fontFamily: 'Fraunces_600SemiBold' as const, fontSize: 24, lineHeight: 29, color: colors.text.primary };
const modalBody = { fontFamily: 'Inter_400Regular' as const, fontSize: 14, lineHeight: 20, color: colors.text.secondary, marginTop: 8 };
const modalLine = { fontFamily: 'Inter_600SemiBold' as const, fontSize: 13, lineHeight: 20, color: colors.text.primary, marginTop: 7 };
