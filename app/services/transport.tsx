import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, MapPin } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';

type Tab = 'taxi' | 'transfers' | 'rent';

const TAXI_OPTIONS = [
  { id:'1', type: strings.services.economy, price:3,  eta:'~4 min', rating:4.6, seats:4, bg:'#3d6479' },
  { id:'2', type: strings.services.comfort, price:5,  eta:'~6 min', rating:4.8, seats:4, bg:'#1E4D6B' },
  { id:'3', type: strings.services.minivan, price:9,  eta:'~8 min', rating:4.7, seats:7, bg:'#4a5e40' },
];

export default function TransportScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('taxi');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.transportTitle}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 }}>
        {(['taxi','transfers','rent'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab===t }} style={({ pressed }) => ({ flex:1, height:36, borderRadius:999, backgroundColor: tab===t ? colors.brand.primary : colors.surface.card, borderWidth:1, borderColor: tab===t ? colors.brand.primary : colors.border.input, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ fontFamily:'Inter_500Medium', fontSize:12, color: tab===t ? '#fff' : colors.text.primary, textTransform:'capitalize' }}>
              {t === 'taxi' ? strings.services.tabTaxi : t === 'transfers' ? strings.services.tabTransfers : strings.services.tabRent}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'taxi' && (
        <>
          {/* Map placeholder */}
          <View style={{ marginHorizontal:16, height:160, borderRadius:16, backgroundColor:'#E8E8E0', marginBottom:12, alignItems:'center', justifyContent:'center' }}>
            <MapPin size={32} color={colors.brand.primary} strokeWidth={1.5} />
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:8 }}>Set pickup location</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal:16, gap:10 }} showsVerticalScrollIndicator={false}>
            {TAXI_OPTIONS.map(o => (
              <Pressable key={o.id} accessibilityRole="button" style={({ pressed }) => ([{ borderRadius:16, backgroundColor:colors.surface.card, padding:16, flexDirection:'row', alignItems:'center', gap:14 }, shadows.card, { opacity: pressed ? 0.85 : 1 }])}>
                <View style={{ width:60, height:48, borderRadius:10, backgroundColor: o.bg, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:24 }}>🚗</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>{o.type}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:3 }}>
                    <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>{o.rating} · {o.seats} seats · {o.eta}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.primary }}>${o.price}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {tab !== 'taxi' && (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.secondary, textAlign:'center' }}>
            {tab === 'transfers' ? 'Intercity transfers coming soon' : 'Car rentals coming soon'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
