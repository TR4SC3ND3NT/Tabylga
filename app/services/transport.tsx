import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bus, CheckCircle2, MapPin, Star, Users } from 'lucide-react-native';
import { formatString } from '../../lib/strings';
import { useStrings } from '../../lib/i18n';
import { useAuthStore } from '../../stores/authStore';
import {
  DGIS_BISHKEK_REGION_ID,
  DGIS_BUSINESS_RUBRICS,
  HOME_SEARCH_LOCATION,
  searchDgisCatalog,
  type DgisPlace,
} from '../../lib/api/dgis';
import { useTravelPreferencesStore } from '../../stores/travelPreferencesStore';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PlacePhoto } from '../../components/PlacePhoto';

type Tab = 'taxi' | 'transfers' | 'rent';

const BG_TINTS = ['#3d6479', '#1E4D6B', '#4a5e40'];

export default function TransportScreen() {
  const router = useRouter();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const preferredTourPeople = useTravelPreferencesStore((s) => s.preferredTourPeople);
  const setPreferredTourPeople = useTravelPreferencesStore((s) => s.setPreferredTourPeople);
  const [tab, setTab] = useState<Tab>('taxi');
  const [pickup, setPickup] = useState(strings.taxi.pickupPlaceholder);
  const [dropoff, setDropoff] = useState(strings.taxi.dropoffPlaceholder);
  const [transportPlaces, setTransportPlaces] = useState<DgisPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [taxiStatus, setTaxiStatus] = useState<string | null>(null);
  const [reservedQuoteId, setReservedQuoteId] = useState<string | null>(null);
  const selectedPlace = transportPlaces.find((place) => place.id === selectedPlaceId) ?? transportPlaces[0];

  useEffect(() => {
    let active = true;

    setLoading(true);
    setTaxiStatus(null);
    searchDgisCatalog({
      rubricIds: [...DGIS_BUSINESS_RUBRICS.transport],
      regionId: DGIS_BISHKEK_REGION_ID,
      location: HOME_SEARCH_LOCATION,
      radius: 25000,
      pageSize: 10,
      sort: 'relevance',
      language,
    }).then((result) => {
      if (!active) return;
      setTransportPlaces(result.items);
      setSelectedPlaceId(result.items[0]?.id ?? null);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [language, tab]);

  function handleOrderTaxi() {
    if (!selectedPlace) return;
    setTaxiStatus(`${selectedPlace.name} selected from 2GIS. Confirm pickup and dropoff before booking.`);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => goBackOrReplace(router, '/(tabs)')} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
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

          {loading && (
            <Card style={{ padding:18, alignItems:'center', gap:8 }}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color:colors.text.secondary }}>{strings.map.loadingPlaces}</Text>
            </Card>
          )}

          {!loading && transportPlaces.length === 0 && (
            <Card style={{ padding:18 }}>
              <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>No 2GIS taxi results</Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:4 }}>Check the 2GIS API key or try again later.</Text>
            </Card>
          )}

          {!loading && transportPlaces.map((option, index) => {
            const selected = selectedPlaceId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setSelectedPlaceId(option.id);
                  setTaxiStatus(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Card style={{ padding:16, borderWidth:selected ? 2 : 1, borderColor:selected ? colors.brand.primary : colors.border.divider }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                    <PlacePhoto
                      width={68}
                      height={58}
                      radius={10}
                      tint={BG_TINTS[index % BG_TINTS.length]}
                      imageUrl={option.photoUrl}
                      label={option.mediaKind === '2gis_photo' ? '2GIS photo' : undefined}
                    />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }} numberOfLines={1}>{option.name}</Text>
                      <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }} numberOfLines={2}>
                        {option.address ?? option.category ?? '2GIS'}
                      </Text>
                      <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:16, color:colors.text.secondary, marginTop:3 }} numberOfLines={2}>{option.description}</Text>
                      {typeof option.rating === 'number' && (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:4 }}>
                          <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                          <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>
                            {option.rating.toFixed(1)}{typeof option.ratingCount === 'number' ? ` · ${option.ratingCount} reviews` : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily:'Inter_700Bold', fontSize:12, color:colors.brand.primary }}>2GIS</Text>
                  </View>

                  {selected && (
                    <View style={{ marginTop:12, borderTopWidth:1, borderTopColor:colors.border.divider, paddingTop:12 }}>
                      <Text style={{ fontFamily:'Inter_700Bold', fontSize:13, color:colors.text.primary, marginBottom:8 }}>
                        2GIS listing
                      </Text>
                      <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:17, color:colors.text.secondary, marginBottom:4 }}>
                        {option.category ?? 'Transport provider'} · {option.address ?? 'Bishkek'}
                      </Text>
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
            <Button
              variant="secondary"
              label={strings.groupPlanner.title}
              onPress={() => router.push('/trip/group-match')}
              icon={<Users size={17} color={colors.brand.primary} strokeWidth={2} />}
              style={{ marginTop:12 }}
              height={42}
              fontSize={12}
            />
          </Card>

          {loading && (
            <Card style={{ padding:18, alignItems:'center', gap:8 }}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color:colors.text.secondary }}>{strings.map.loadingPlaces}</Text>
            </Card>
          )}

          {!loading && transportPlaces.length === 0 && (
            <Card style={{ padding:18 }}>
              <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>No 2GIS transfer results</Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:4 }}>Check the 2GIS API key or try again later.</Text>
            </Card>
          )}

          {!loading && transportPlaces.map((quote) => {
            const reserved = reservedQuoteId === quote.id;
            return (
              <Card key={quote.id} style={{ padding:16, borderWidth:reserved ? 2 : 1, borderColor:reserved ? colors.brand.primary : colors.border.divider }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                  <PlacePhoto
                    width={58}
                    height={58}
                    radius={16}
                    tint="#3d6479"
                    imageUrl={quote.photoUrl}
                    label={quote.mediaKind === '2gis_photo' ? '2GIS photo' : undefined}
                  />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }} numberOfLines={1}>{quote.name}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:3 }}>
                      {quote.category ?? '2GIS transfer'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily:'Inter_700Bold', fontSize:12, color:colors.brand.primary }}>2GIS</Text>
                </View>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:12 }}>
                  {quote.description ?? quote.address ?? 'Bishkek'}
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
        <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingBottom:24, gap:12 }} showsVerticalScrollIndicator={false}>
          {loading && (
            <Card style={{ padding:18, alignItems:'center', gap:8 }}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color:colors.text.secondary }}>{strings.map.loadingPlaces}</Text>
            </Card>
          )}

          {!loading && transportPlaces.length === 0 && (
            <Card style={{ padding:18 }}>
              <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>No 2GIS rental results</Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:4 }}>Check the 2GIS API key or try again later.</Text>
            </Card>
          )}

          {!loading && transportPlaces.map((place, index) => (
            <Pressable
              key={place.id}
              onPress={() => router.push({ pathname: '/(tabs)/map', params: { q: place.name } } as never)}
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card style={{ padding:16 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <PlacePhoto
                    width={68}
                    height={58}
                    radius={10}
                    tint={BG_TINTS[index % BG_TINTS.length]}
                    imageUrl={place.photoUrl}
                    label={place.mediaKind === '2gis_photo' ? '2GIS photo' : undefined}
                  />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }} numberOfLines={1}>{place.name}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }} numberOfLines={2}>{place.address ?? place.category ?? '2GIS'}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:16, color:colors.text.secondary, marginTop:3 }} numberOfLines={2}>{place.description}</Text>
                  </View>
                  <Text style={{ fontFamily:'Inter_700Bold', fontSize:12, color:colors.brand.primary }}>2GIS</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
