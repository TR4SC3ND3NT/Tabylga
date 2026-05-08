import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { useAuthStore } from '../../stores/authStore';
import {
  DGIS_BISHKEK_REGION_ID,
  DGIS_BUSINESS_RUBRICS,
  HOME_SEARCH_LOCATION,
  searchDgisCatalog,
  type DgisPlace,
} from '../../lib/api/dgis';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { PlacePhoto } from '../../components/PlacePhoto';

type Tab = 'restaurants' | 'cafes' | 'delivery';

const BG_TINTS = ['#4a5d68', '#56473d', '#5a4f3d', '#4a5e40'];

export default function FoodScreen() {
  const router = useRouter();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const [tab, setTab] = useState<Tab>('restaurants');
  const [places, setPlaces] = useState<DgisPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const rubricIds =
      tab === 'cafes' ? DGIS_BUSINESS_RUBRICS.cafes :
      tab === 'delivery' ? DGIS_BUSINESS_RUBRICS.food :
      DGIS_BUSINESS_RUBRICS.restaurants;

    setLoading(true);
    searchDgisCatalog({
      rubricIds: [...rubricIds],
      regionId: DGIS_BISHKEK_REGION_ID,
      location: HOME_SEARCH_LOCATION,
      radius: 25000,
      pageSize: 10,
      sort: 'relevance',
      language,
    }).then((result) => {
      if (!active) return;
      setPlaces(result.items);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [language, tab]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => goBackOrReplace(router, '/(tabs)')} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.foodTitle}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 }}>
        {(['restaurants','cafes','delivery'] as Tab[]).map(t => (
          <Chip
            key={t}
            label={t === 'restaurants' ? strings.services.tabRestaurants : t === 'cafes' ? strings.services.tabCafes : strings.services.tabDelivery}
            selected={tab === t}
            onPress={() => setTab(t)}
            height={36}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal:16, gap:12, paddingBottom:24 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <Card style={{ padding:18, alignItems:'center', gap:8 }}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color:colors.text.secondary }}>{strings.map.loadingPlaces}</Text>
          </Card>
        )}

        {!loading && places.length === 0 && (
          <Card style={{ padding:18 }}>
            <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>No 2GIS results</Text>
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:4 }}>Check the 2GIS API key or try another food tab.</Text>
          </Card>
        )}

        {!loading && places.map((place, index) => (
          <Pressable
            key={place.id}
            onPress={() => router.push({ pathname: '/(tabs)/map', params: { q: place.name } } as never)}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card style={{ flexDirection:'row', overflow:'hidden' }}>
              <PlacePhoto
                width={90}
                height={110}
                tint={BG_TINTS[index % BG_TINTS.length]}
                imageUrl={place.photoUrl}
                label={place.mediaKind === '2gis_photo' ? '2GIS photo' : undefined}
              />
              <View style={{ flex:1, padding:12 }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                  <Text style={{ flex:1, fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary, marginRight:8 }} numberOfLines={1}>{place.name}</Text>
                  <Pill
                    variant="custom"
                    label="2GIS"
                    backgroundColor={colors.status.successLight}
                    textColor={(colors.status as any).successText}
                    height={22}
                    fontSize={11}
                  />
                </View>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }} numberOfLines={2}>{place.address ?? place.category ?? '2GIS'}</Text>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:16, color:colors.text.secondary, marginTop:4 }} numberOfLines={2}>{place.description}</Text>
                {typeof place.rating === 'number' && (
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:6 }}>
                    <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>{place.rating.toFixed(1)}</Text>
                    {typeof place.ratingCount === 'number' && (
                      <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>({place.ratingCount})</Text>
                    )}
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
