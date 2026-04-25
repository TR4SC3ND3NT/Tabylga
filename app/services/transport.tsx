import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bus, CheckCircle2, MapPin, Star } from 'lucide-react-native';
import { formatString } from '../../lib/strings';
import { useStrings } from '../../lib/i18n';
import { TAXI_OPTIONS, TOUR_TRANSPORT_QUOTES } from '../../lib/backend/demoBackend';
import { useTravelPreferencesStore } from '../../stores/travelPreferencesStore';
import { colors } from '../../constants/colors';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

type Tab = 'taxi' | 'transfers' | 'rent';

const BG_TINTS = ['#3d6479', '#1E4D6B', '#4a5e40'];

export default function TransportScreen() {
  const router = useRouter();
  const strings = useStrings();
  const preferredTourPeople = useTravelPreferencesStore((s) => s.preferredTourPeople);
  const setPreferredTourPeople = useTravelPreferencesStore((s) => s.setPreferredTourPeople);
  const [tab, setTab] = useState<Tab>('taxi');
  const [pickup, setPickup] = useState(strings.taxi.pickupPlaceholder);
  const [dropoff, setDropoff] = useState(strings.taxi.dropoffPlaceholder);
  const [selectedTaxiId, setSelectedTaxiId] = useState(TAXI_OPTIONS[0].id);
  const [taxiStatus, setTaxiStatus] = useState<string | null>(null);
  const [reservedQuoteId, setReservedQuoteId] = useState<string | null>(null);
  const selectedTaxi = TAXI_OPTIONS.find((option) => option.id === selectedTaxiId) ?? TAXI_OPTIONS[0];

  function handleOrderTaxi() {
    setTaxiStatus(formatString(strings.taxi.arriving, {
      driver: selectedTaxi.driver,
      minutes: selectedTaxi.etaMin,
    }));
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.transportTitle}
        </Text>
      </View>

      <View style={{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 }}>
        {(['taxi','transfers','rent'] as Tab[]).map(t => (
          <Chip
            key={t}
            label={t === 'taxi' ? strings.services.tabTaxi : t === 'transfers' ? strings.services.tabTransfers : strings.services.tabRent}
            selected={tab === t}
            onPress={() => setTab(t)}
            height={36}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      {tab === 'taxi' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingBottom:24, gap:12 }} showsVerticalScrollIndicator={false}>
          <View style={{ height:170, borderRadius:18, backgroundColor:'#E8E8E0', overflow:'hidden', borderWidth:1, borderColor:colors.border.divider }}>
            <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
              <MapPin size={32} color={colors.brand.primary} strokeWidth={1.5} />
              <Text style={{ fontFamily:'Inter_700Bold', fontSize:14, color:colors.text.primary, marginTop:8 }}>{strings.taxi.routePreview}</Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:3 }}>{pickup}{' -> '}{dropoff}</Text>
            </View>
          </View>

          <Card style={{ padding:14 }}>
            <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.primary, marginBottom:8 }}>{strings.taxi.pickup}</Text>
            <TextInput
              value={pickup}
              onChangeText={setPickup}
              placeholder={strings.taxi.pickupPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              style={{ height:44, borderRadius:12, backgroundColor:'#F7F5EF', paddingHorizontal:12, fontFamily:'Inter_500Medium', fontSize:14, color:colors.text.primary }}
            />
            <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.primary, marginTop:12, marginBottom:8 }}>{strings.taxi.dropoff}</Text>
            <TextInput
              value={dropoff}
              onChangeText={setDropoff}
              placeholder={strings.taxi.dropoffPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              style={{ height:44, borderRadius:12, backgroundColor:'#F7F5EF', paddingHorizontal:12, fontFamily:'Inter_500Medium', fontSize:14, color:colors.text.primary }}
            />
          </Card>

          {TAXI_OPTIONS.map((option, index) => {
            const selected = selectedTaxiId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setSelectedTaxiId(option.id);
                  setTaxiStatus(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Card style={{ padding:16, borderWidth:selected ? 2 : 1, borderColor:selected ? colors.brand.primary : colors.border.divider }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                    <View style={{ width:60, height:48, borderRadius:10, backgroundColor: BG_TINTS[index] ?? '#3d6479', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:24 }}>🚗</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>{option.className}</Text>
                      <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }}>
                        {option.driver} · {option.car}
                      </Text>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:4 }}>
                        <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                        <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>
                          {option.rating} · {formatString(strings.services.seats, { count: option.seats })} · ~{option.etaMin} min
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.primary }}>${option.priceUsd}</Text>
                  </View>

                  {selected && (
                    <View style={{ marginTop:12, borderTopWidth:1, borderTopColor:colors.border.divider, paddingTop:12 }}>
                      <Text style={{ fontFamily:'Inter_700Bold', fontSize:13, color:colors.text.primary, marginBottom:8 }}>
                        {strings.taxi.reviewsTitle}
                      </Text>
                      {option.reviews.slice(0, 2).map((review) => (
                        <Text key={review.id} style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:17, color:colors.text.secondary, marginBottom:4 }}>
                          {review.author} · {review.rating}: {review.text}
                        </Text>
                      ))}
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}

          <Button label={strings.taxi.order} onPress={handleOrderTaxi} />

          {taxiStatus && (
            <View style={{ borderRadius:16, backgroundColor:colors.brand.primaryLight, padding:14, flexDirection:'row', alignItems:'center', gap:10 }}>
              <CheckCircle2 size={22} color={colors.brand.primary} strokeWidth={2} />
              <Text style={{ flex:1, fontFamily:'Inter_700Bold', fontSize:14, color:colors.text.primary }}>{taxiStatus}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {tab === 'transfers' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingBottom:24, gap:12 }} showsVerticalScrollIndicator={false}>
          <Card style={{ padding:16, backgroundColor:colors.brand.primaryLight }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
              <Bus size={22} color={colors.brand.primary} strokeWidth={2} />
              <Text style={{ flex:1, fontFamily:'Inter_700Bold', fontSize:16, color:colors.text.primary }}>{strings.taxi.sharedTourTitle}</Text>
            </View>
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:8 }}>
              {strings.preferences.transportDeposit}
            </Text>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
              <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.primary }}>
                {formatString(strings.taxi.peopleWant, { count: preferredTourPeople })}
              </Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Pressable onPress={() => setPreferredTourPeople(preferredTourPeople - 1)} style={({ pressed }) => ({ width:30, height:30, borderRadius:15, backgroundColor:colors.surface.card, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.75 : 1 })}>
                  <Text style={{ fontFamily:'Inter_700Bold', color:colors.brand.primary }}>-</Text>
                </Pressable>
                <Pressable onPress={() => setPreferredTourPeople(preferredTourPeople + 1)} style={({ pressed }) => ({ width:30, height:30, borderRadius:15, backgroundColor:colors.surface.card, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.75 : 1 })}>
                  <Text style={{ fontFamily:'Inter_700Bold', color:colors.brand.primary }}>+</Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {TOUR_TRANSPORT_QUOTES.map((quote) => {
            const reserved = reservedQuoteId === quote.id;
            return (
              <Card key={quote.id} style={{ padding:16, borderWidth:reserved ? 2 : 1, borderColor:reserved ? colors.brand.primary : colors.border.divider }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                  <View style={{ width:52, height:52, borderRadius:16, backgroundColor:quote.vehicle === 'bus' ? '#3d6479' : '#4a5e40', alignItems:'center', justifyContent:'center' }}>
                    <Bus size={24} color="#fff" strokeWidth={2} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>{quote.title}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:3 }}>
                      {formatString(strings.services.seats, { count: quote.seats })} · min {quote.minPeople}
                    </Text>
                  </View>
                  <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:22, color:colors.brand.primary }}>${quote.pricePerPersonUsd}</Text>
                </View>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:12 }}>
                  {quote.route}
                </Text>
                <Button
                  variant={reserved ? 'primary' : 'secondary'}
                  label={reserved ? strings.common.confirm : strings.taxi.reserveSeat}
                  onPress={() => setReservedQuoteId(quote.id)}
                  style={{ marginTop:12 }}
                  height={42}
                  fontSize={13}
                />
              </Card>
            );
          })}
        </ScrollView>
      )}

      {tab === 'rent' && (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.secondary, textAlign:'center' }}>
            {strings.services.rentalsComingSoon}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
