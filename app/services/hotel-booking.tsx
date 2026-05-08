import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, CheckCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react-native';
import { STAYS } from '../../lib/data/stays';
import { STORAGE_KEYS } from '../../lib/data/tripPlaces';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { PlacePhoto } from '../../components/PlacePhoto';
import { formatUSD } from '../../lib/format';
import { useTripStore } from '../../stores/tripStore';

const STAY_BOOKINGS_KEY = 'tabylga_stay_bookings';
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthTitle(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`).getTime();
  const end = new Date(`${checkOut}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

function isValidDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(time);
}

function makeDateOptions() {
  const today = new Date();
  return [0, 1, 2, 3, 5, 7].map((offset) => {
    const date = new Date(today.getTime() + offset * DAY_MS);
    return toDateInputValue(date);
  });
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateInputValue(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function HotelBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stayId?: string; mode?: string; day?: string; region?: string }>();
  const bookStay = useTripStore((state) => state.bookStay);
  const stay = STAYS.find((item) => item.id === params.stayId) ?? STAYS[0];
  const dayNumber = Number(params.day ?? 0);
  const fromTrip = params.mode === 'trip' && dayNumber > 0;
  const dateOptions = useMemo(() => makeDateOptions(), []);
  const [checkIn, setCheckIn] = useState(dateOptions[1] ?? toDateInputValue(new Date()));
  const [checkOut, setCheckOut] = useState(dateOptions[2] ?? toDateInputValue(new Date(Date.now() + DAY_MS)));
  const [calendarTarget, setCalendarTarget] = useState<'checkIn' | 'checkOut' | null>(null);
  const [roomId, setRoomId] = useState(stay.roomTypes[0]?.id ?? '');
  const paymentMethods = useMemo(() => [
    'Pay later',
    'Card',
    ...(stay.paymentOptions.includes('qr') || stay.qrPayment ? ['QR'] : []),
    ...(stay.offlinePaymentSupported ? ['Offline Pay'] : []),
  ], [stay]);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const room = stay.roomTypes.find((item) => item.id === roomId) ?? stay.roomTypes[0];
  const nights = nightsBetween(checkIn, checkOut);
  const datesValid = isValidDateValue(checkIn)
    && isValidDateValue(checkOut)
    && new Date(`${checkOut}T00:00:00`).getTime() > new Date(`${checkIn}T00:00:00`).getTime();
  const roomTotal = (room?.pricePerNight ?? stay.pricePerNight) * nights;
  const serviceFee = Math.round(roomTotal * 0.04);
  const total = roomTotal + serviceFee;
  const commission = Math.round(roomTotal * stay.commissionRate);
  const partnerPayout = roomTotal - commission;

  async function confirmBooking() {
    if (!datesValid) {
      Alert.alert('Check your dates', 'Enter dates as YYYY-MM-DD and make sure check-out is after check-in.');
      return;
    }

    const booking = {
      id: `booking_${Date.now()}`,
      stayId: stay.id,
      stayName: stay.name,
      day: fromTrip ? dayNumber : null,
      status: 'booked_mock',
      total,
      commission,
      partnerPayout,
      roomType: room?.title ?? 'Standard stay',
      checkIn,
      checkOut,
      nights,
      pricePerNight: room?.pricePerNight ?? stay.pricePerNight,
      paymentMethod,
      createdAt: Date.now(),
    };
    const existingRaw = await AsyncStorage.getItem(STAY_BOOKINGS_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) as unknown[] : [];
    await AsyncStorage.setItem(STAY_BOOKINGS_KEY, JSON.stringify([booking, ...existing]));
    await AsyncStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(booking));

    if (fromTrip) {
      bookStay(dayNumber, stay.id);
      Alert.alert('Stay updated in your trip', `${stay.name} is booked for Day ${dayNumber}.`, [
        { text: 'View trip', onPress: () => router.replace({ pathname: '/trip/itinerary', params: { day: String(dayNumber) } } as never) },
      ]);
      router.replace({ pathname: '/trip/itinerary', params: { day: String(dayNumber) } } as never);
      return;
    }

    Alert.alert('Booking saved', 'Your stay was saved locally and added to your bookings.');
    goBackOrReplace(router, '/services/hotels');
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Button variant="ghost" label="" icon={<ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />} onPress={() => goBackOrReplace(router, '/services/hotels')} style={{ width: 44, borderRadius: 12 }} height={44} />
        <View style={{ flex: 1, marginRight: 44 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.text.primary, textAlign: 'center' }}>Book stay</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, textAlign: 'center', marginTop: 2 }}>
            {fromTrip ? `Trip Day ${dayNumber} · ${params.region ?? stay.region}` : 'Flexible booking'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
        <View style={{ borderRadius: 20, backgroundColor: colors.surface.card, padding: 14, borderWidth: 1, borderColor: colors.border.divider }}>
          <PlacePhoto width="100%" height={170} radius={16} tint="#3d6479" imageUrl={stay.imageUrl} />
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary, marginTop: 14 }}>{stay.name}</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, marginTop: 4 }}>{stay.city}, {stay.region} · {stay.rating} rating</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <Chip label={stay.wifi ? 'Wi-Fi' : 'No Wi-Fi'} height={26} fontSize={11} />
            <Chip label={stay.offlinePaymentSupported ? 'Offline payment' : 'Online payment'} height={26} fontSize={11} />
            <Chip label={stay.familyFriendly ? 'Family-friendly' : stay.type} height={26} fontSize={11} />
          </View>
        </View>

        <View style={{ borderRadius: 18, backgroundColor: colors.surface.card, padding: 16, borderWidth: 1, borderColor: colors.border.divider }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }}>Booking summary</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginTop: 14 }}>Room type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {stay.roomTypes.map((item) => (
              <Chip
                key={item.id}
                label={`${item.title} · ${formatUSD(item.pricePerNight)}`}
                selected={item.id === room?.id}
                onPress={() => setRoomId(item.id)}
                height={32}
                fontSize={11}
              />
            ))}
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginTop: 14 }}>Check-in date</Text>
          <DateSelectButton label={formatDisplayDate(checkIn)} onPress={() => setCalendarTarget('checkIn')} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginTop: 14 }}>Check-out date</Text>
          <DateSelectButton label={formatDisplayDate(checkOut)} onPress={() => setCalendarTarget('checkOut')} />
          {!datesValid && (
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.status.error, marginTop: 8 }}>
              Use YYYY-MM-DD. Check-out must be after check-in.
            </Text>
          )}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.primary, marginTop: 14 }}>Payment method</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {paymentMethods.map((method) => (
              <Chip key={method} label={method} selected={paymentMethod === method} onPress={() => setPaymentMethod(method)} height={32} fontSize={11} />
            ))}
          </View>
          <Line label={room?.title ?? 'Standard stay'} value={`${formatUSD(room?.pricePerNight ?? stay.pricePerNight)} / night`} />
          <Line label="Check-in" value={formatDisplayDate(checkIn)} />
          <Line label="Check-out" value={formatDisplayDate(checkOut)} />
          <Line label="Nights" value={String(nights)} />
          <Line label="Gross booking value" value={formatUSD(roomTotal)} />
          <Line label="Service fee" value={formatUSD(serviceFee)} />
          <Line label="Total" value={formatUSD(total)} strong />
        </View>

        <View style={{ borderRadius: 18, backgroundColor: colors.status.warningLight, padding: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }}>Partner payout preview</Text>
          <Line label="Gross booking value" value={formatUSD(roomTotal)} />
          <Line label={`Commission ${(stay.commissionRate * 100).toFixed(0)}%`} value={formatUSD(commission)} />
          <Line label="Tabylga commission" value={formatUSD(commission)} />
          <Line label="Partner payout" value={formatUSD(partnerPayout)} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 8 }}>
            Booking details and payout estimates are saved with this stay for quick review.
          </Text>
        </View>

        <Button
          variant="cta"
          label={fromTrip ? 'Confirm and update trip' : 'Confirm booking'}
          icon={<CreditCard size={18} color="#fff" strokeWidth={2} />}
          onPress={confirmBooking}
          disabled={!datesValid}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <CheckCircle size={16} color={colors.status.success} fill={colors.status.success} strokeWidth={0} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Saved locally after confirmation</Text>
        </View>
      </ScrollView>

      <CalendarModal
        visible={calendarTarget !== null}
        title={calendarTarget === 'checkIn' ? 'Select check-in' : 'Select check-out'}
        selectedDate={calendarTarget === 'checkOut' ? checkOut : checkIn}
        minDate={calendarTarget === 'checkOut' ? toDateInputValue(new Date(new Date(`${checkIn}T00:00:00`).getTime() + DAY_MS)) : toDateInputValue(new Date())}
        onClose={() => setCalendarTarget(null)}
        onSelect={(date) => {
          if (calendarTarget === 'checkIn') {
            setCheckIn(date);
            if (new Date(`${checkOut}T00:00:00`).getTime() <= new Date(`${date}T00:00:00`).getTime()) {
              setCheckOut(toDateInputValue(new Date(new Date(`${date}T00:00:00`).getTime() + DAY_MS)));
            }
          } else {
            setCheckOut(date);
          }
          setCalendarTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

function DateSelectButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.input,
        backgroundColor: colors.surface.card,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: colors.text.primary,
      }}>
        {label}
      </Text>
      <CalendarDays size={18} color={colors.brand.primary} strokeWidth={1.8} />
    </Pressable>
  );
}

function CalendarModal({
  visible,
  title,
  selectedDate,
  minDate,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  selectedDate: string;
  minDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const initialMonth = isValidDateValue(selectedDate) ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [monthDate, setMonthDate] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const cells = buildCalendarDays(monthDate);
  const minTime = new Date(`${minDate}T00:00:00`).getTime();

  function shiftMonth(delta: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.34)', justifyContent: 'center', padding: 18 }}>
        <View style={{ borderRadius: 22, backgroundColor: colors.surface.card, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>{title}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>{monthTitle(monthDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton onPress={() => shiftMonth(-1)} icon={<ChevronLeft size={18} color={colors.brand.primary} />} />
              <IconButton onPress={() => shiftMonth(1)} icon={<ChevronRight size={18} color={colors.brand.primary} />} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.text.tertiary }}>{day}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((date, index) => {
              if (!date) return <View key={`empty_${index}`} style={{ width: `${100 / 7}%`, height: 42 }} />;
              const disabled = new Date(`${date}T00:00:00`).getTime() < minTime;
              const selected = date === selectedDate;
              return (
                <Pressable
                  key={date}
                  disabled={disabled}
                  onPress={() => onSelect(date)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    width: `${100 / 7}%`,
                    height: 42,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.32 : pressed ? 0.72 : 1,
                  })}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.brand.primary : 'transparent' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: selected ? '#fff' : colors.text.primary }}>
                      {new Date(`${date}T00:00:00`).getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button variant="secondary" label="Close" onPress={onClose} height={44} fontSize={13} style={{ marginTop: 14 }} />
        </View>
      </View>
    </Modal>
  );
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.brand.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
      <Text style={{ fontFamily: strong ? 'Inter_700Bold' : 'Inter_400Regular', fontSize: strong ? 14 : 13, color: colors.text.primary }}>{label}</Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: strong ? 15 : 13, color: strong ? colors.brand.primary : colors.text.primary }}>{value}</Text>
    </View>
  );
}
