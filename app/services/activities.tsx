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
import { Card } from '../../components/Card';
import { PlacePhoto } from '../../components/PlacePhoto';

const BG_TINTS = ['#4a5d68', '#6a5a4b', '#56473d', '#3d6479'];

export default function ActivitiesScreen() {
  const router = useRouter();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const [activities, setActivities] = useState<DgisPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchDgisCatalog({
      rubricIds: [...DGIS_BUSINESS_RUBRICS.activities],
      regionId: DGIS_BISHKEK_REGION_ID,
      location: HOME_SEARCH_LOCATION,
      radius: 25000,
      pageSize: 10,
      sort: 'relevance',
      language,
    }).then((result) => {
      if (!active) return;
      setActivities(result.items);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [language]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.activitiesTitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <Card style={{ padding:18, alignItems:'center', gap:8 }}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color:colors.text.secondary }}>{strings.map.loadingPlaces}</Text>
          </Card>
        )}

        {!loading && activities.length === 0 && (
          <Card style={{ padding:18 }}>
            <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>No 2GIS results</Text>
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:4 }}>Check the 2GIS API key or try again later.</Text>
          </Card>
        )}

        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {!loading && activities.map((activity, index) => (
            <Pressable
              key={activity.id}
              onPress={() => router.push({ pathname: '/(tabs)/map', params: { q: activity.name } } as never)}
              accessibilityRole="button"
              style={({ pressed }) => ({ width:'48.5%', opacity: pressed ? 0.85 : 1 })}
            >
              <Card style={{ overflow:'hidden' }}>
                <View style={{ position:'relative' }}>
                  <PlacePhoto
                    width="100%"
                    height={110}
                    tint={BG_TINTS[index % BG_TINTS.length]}
                    imageUrl={activity.photoUrl}
                    label={activity.mediaKind === '2gis_photo' ? '2GIS photo' : undefined}
                  />
                  {typeof activity.rating === 'number' && (
                    <View style={{ position:'absolute', top:8, right:8, flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:8, paddingVertical:4, borderRadius:999, backgroundColor:'rgba(255,255,255,0.92)' }}>
                      <Star size={11} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                      <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:11, color:colors.text.primary }}>{activity.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <View style={{ padding:10 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:14, color:colors.text.primary }} numberOfLines={1}>{activity.name}</Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:11, lineHeight:15, color:colors.text.secondary, marginTop:5 }} numberOfLines={2}>{activity.address ?? activity.category ?? '2GIS'}</Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:11, lineHeight:15, color:colors.text.secondary, marginTop:4 }} numberOfLines={2}>{activity.description}</Text>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.brand.primary, marginTop:8 }}>2GIS</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
