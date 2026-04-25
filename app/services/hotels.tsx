import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, AlertTriangle } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const FILTERS = ['All','Price','Rating','Hotel','Hostel','Yurt','Guesthouse'];

const HOTELS = [
  { id:'1', name:'Hyatt Regency Bishkek',      stars:5, region:'Bishkek',       price:180, rating:4.8, reviews:312, type:'hotel',  limited:false },
  { id:'2', name:'Shepherd\'s Life Yurt Camp', stars:0, region:'Song-Kül',      price:45,  rating:4.9, reviews:87,  type:'yurt',   limited:true  },
  { id:'3', name:'Navigator Guesthouse',       stars:0, region:'Bishkek',       price:12,  rating:4.5, reviews:214, type:'hostel', limited:false },
  { id:'4', name:'Tamga Yurt Camp',            stars:0, region:'Issyk-Kül',     price:35,  rating:4.7, reviews:63,  type:'yurt',   limited:false },
  { id:'5', name:'Trekking Union Guesthouse',  stars:0, region:'Karakol',       price:25,  rating:4.6, reviews:98,  type:'hostel', limited:false },
];

const BG_TINTS: Record<string, string> = { hotel:'#3d6479', yurt:'#6a5a4b', hostel:'#4a5e40' };

export default function HotelsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.hotelsTitle}
        </Text>
      </View>

      <ScrollView showsHorizontalScrollIndicator={false} style={{ borderBottomWidth:1, borderBottomColor:colors.border.divider, maxHeight:52 }} horizontal contentContainerStyle={{ paddingHorizontal:16, gap:8, alignItems:'center' }}>
        {FILTERS.map(f => (
          <Chip
            key={f}
            label={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            height={34}
            fontSize={13}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding:16, gap:12 }} showsVerticalScrollIndicator={false}>
        {HOTELS.map(h => (
          <Card key={h.id}>
            <View style={{ flexDirection:'row' }}>
              <View style={{ width:120, height:120, backgroundColor: BG_TINTS[h.type] ?? '#3d6479' }} />
              <View style={{ flex:1, padding:12, justifyContent:'space-between' }}>
                <View>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }} numberOfLines={2}>{h.name}</Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }}>{h.region}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:4 }}>
                    <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>{h.rating}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>({h.reviews})</Text>
                  </View>
                  {h.limited && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:6 }}>
                      <AlertTriangle size={12} color={colors.status.warning} strokeWidth={2} />
                      <Text style={{ fontFamily:'Inter_500Medium', fontSize:11, color:colors.status.warning }}>{strings.services.limitedAvailability}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.brand.primary }}>${h.price}<Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>/night</Text></Text>
                  <View style={{ width: 80 }}>
                    <Button
                      variant="secondary"
                      label={strings.services.book}
                      height={32}
                      fontSize={13}
                      style={{ borderRadius: 8, borderWidth: 1.5 }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
