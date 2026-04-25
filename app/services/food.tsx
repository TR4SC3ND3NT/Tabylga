import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';

type Tab = 'restaurants' | 'cafes' | 'delivery';

const RESTAURANTS = [
  { id:'1', name:'Arzu Restaurant',    cuisine:'Kyrgyz',        rating:4.8, reviews:341, avgPrice:'$$', open:true,  bg:'#4a5d68' },
  { id:'2', name:'Supara Ethno',       cuisine:'Central Asian', rating:4.9, reviews:512, avgPrice:'$$$', open:true,  bg:'#56473d' },
  { id:'3', name:'Navat Restaurant',   cuisine:'Uzbek',         rating:4.6, reviews:189, avgPrice:'$$',  open:false, bg:'#5a4f3d' },
  { id:'4', name:'Coffee House',       cuisine:'European, Café', rating:4.5, reviews:267, avgPrice:'$',  open:true,  bg:'#4a5e40' },
];

export default function FoodScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('restaurants');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.foodTitle}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 }}>
        {(['restaurants','cafes','delivery'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab===t }} style={({ pressed }) => ({ flex:1, height:36, borderRadius:999, backgroundColor: tab===t ? colors.brand.primary : colors.surface.card, borderWidth:1, borderColor: tab===t ? colors.brand.primary : colors.border.input, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ fontFamily:'Inter_500Medium', fontSize:13, color: tab===t ? '#fff' : colors.text.primary, textTransform:'capitalize' }}>
              {t === 'restaurants' ? strings.services.tabRestaurants : t === 'cafes' ? strings.services.tabCafes : strings.services.tabDelivery}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal:16, gap:12 }} showsVerticalScrollIndicator={false}>
        {RESTAURANTS.map(r => (
          <Pressable key={r.id} accessibilityRole="button" style={[{ borderRadius:16, backgroundColor:colors.surface.card, overflow:'hidden', flexDirection:'row' }, shadows.card]}>
            <View style={{ width:90, height:90, backgroundColor: r.bg }} />
            <View style={{ flex:1, padding:12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>{r.name}</Text>
                <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:999, backgroundColor: r.open ? colors.status.successLight : colors.status.errorLight }}>
                  <Text style={{ fontFamily:'Inter_500Medium', fontSize:11, color: r.open ? colors.status.success : colors.status.error }}>{r.open ? 'Open' : 'Closed'}</Text>
                </View>
              </View>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }}>{r.cuisine} · {r.avgPrice}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:6 }}>
                <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>{r.rating}</Text>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>({r.reviews})</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
