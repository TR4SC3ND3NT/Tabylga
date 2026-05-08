import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Bot, CalendarDays, ChevronRight, Luggage, MapPin, Sparkles, Users, WalletCards } from 'lucide-react-native';
import { formatString } from '../../lib/strings';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { useTripStore } from '../../stores/tripStore';
import { formatUSD } from '../../lib/format';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';

export default function TripsScreen() {
  const router = useRouter();
  const strings = useStrings();
  const itinerary = useTripStore(s => s.generatedItinerary);
  const setEntryMode = useTripStore(s => s.setEntryMode);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112 }}
      >
        <View style={{ paddingHorizontal: 4, marginBottom: 14 }}>
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:34, lineHeight:38, color:colors.text.primary }}>
            {strings.trips.title}
          </Text>
          <Text style={{ marginTop: 4, fontFamily:'Inter_500Medium', fontSize:13, lineHeight:19, color:colors.text.secondary }}>
            Your route, AI edits and offline travel tools in one place.
          </Text>
        </View>

        {itinerary ? (
          <>
            <Pressable
              onPress={() => router.push('/trip/itinerary')}
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
            >
              <Card elevated style={{ overflow: 'hidden', marginBottom: 14, borderRadius: 30 }}>
                <View style={{ minHeight: 142, padding: 20, backgroundColor: colors.brand.primary, justifyContent: 'space-between' }}>
                  <View pointerEvents="none" style={{ position: 'absolute', right: -42, top: 14, width: 164, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '-18deg' }] }} />
                  <View pointerEvents="none" style={{ position: 'absolute', left: -48, bottom: 18, width: 174, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,209,102,0.2)', transform: [{ rotate: '18deg' }] }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Pill label="Ready route" backgroundColor="rgba(255,255,255,0.16)" textColor="#fff" height={28} />
                    <Sparkles size={24} color="#fff" strokeWidth={1.8} />
                  </View>
                  <Text style={{ marginTop: 18, fontFamily:'Fraunces_600SemiBold', fontSize:29, lineHeight:34, color:'#fff' }} numberOfLines={2}>
                    {itinerary.title}
                  </Text>
                </View>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, lineHeight:19, color:colors.text.secondary }}>
                    {formatString(strings.itinerary.daysCount, { count: itinerary.days })} · {itinerary.regions.slice(0,3).join(', ')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TripStat icon={<CalendarDays size={16} color={colors.brand.primary} />} label="Days" value={String(itinerary.days)} />
                    <TripStat icon={<Users size={16} color={colors.brand.primary} />} label="People" value={String(itinerary.travelerCount)} />
                    <TripStat icon={<WalletCards size={16} color={colors.brand.primary} />} label="Budget" value={formatUSD(itinerary.totalCost)} />
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {itinerary.regions.slice(0, 4).map((region) => (
                      <Pill key={region} label={region} icon={<MapPin size={12} color={colors.brand.primary} />} backgroundColor={colors.brand.primaryLight} textColor={colors.brand.primary} height={28} fontSize={12} />
                    ))}
                  </View>
                </View>
              </Card>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                variant="primary"
                label={strings.common.viewDetails}
                icon={<ChevronRight size={18} color="#fff" strokeWidth={2} />}
                onPress={() => router.push('/trip/itinerary')}
                style={{ flex: 1 }}
                fontSize={13}
              />
              <Button
                variant="secondary"
                label="Ask AI"
                icon={<Bot size={18} color={colors.brand.primary} strokeWidth={2} />}
                onPress={() => router.push('/trip/voice')}
                style={{ flex: 1 }}
                fontSize={13}
              />
            </View>
          </>
        ) : (
          <Card elevated style={{ padding: 20, borderRadius: 30, backgroundColor: colors.brand.primary }}>
            <View pointerEvents="none" style={{ position: 'absolute', right: -42, top: 18, width: 166, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '-18deg' }] }} />
            <View style={{ width:76, height:76, borderRadius:26, backgroundColor:'rgba(255,255,255,0.16)', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <Luggage size={34} color={colors.brand.cta} strokeWidth={1.7} />
            </View>
            <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:29, lineHeight:34, color:'#fff', marginBottom:8 }}>
              {strings.trips.emptyTitle}
            </Text>
            <Text style={{ fontFamily:'Inter_500Medium', fontSize:14, color:'rgba(255,255,255,0.78)', marginBottom:18, lineHeight:21 }}>
              {strings.trips.emptySubtitle}
            </Text>
            <View style={{ gap: 10 }}>
              <Button
                variant="cta"
                label="Plan with AI"
                icon={<Sparkles size={20} color="#fff" strokeWidth={2} />}
                onPress={() => {
                  setEntryMode('ai');
                  router.push('/trip/voice');
                }}
              />
              <Button
                variant="secondary"
                label={strings.trips.emptyButton}
                icon={<CalendarDays size={18} color={colors.brand.primary} strokeWidth={2} />}
                onPress={() => router.push('/trip/purpose')}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TripStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minHeight: 76, borderRadius: 16, backgroundColor: colors.brand.primaryLight, padding: 11, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text style={{ fontFamily:'Inter_700Bold', fontSize:11, color:colors.brand.primary }}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.primary }}>
        {value}
      </Text>
    </View>
  );
}
