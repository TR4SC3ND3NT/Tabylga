import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Clock, Users } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Card } from '../../components/Card';

const ACTIVITIES = [
  { id:'1', name:'Ala-Archa Trek',       duration:'6h', difficulty:'Moderate', price:35, rating:4.9, reviews:124, group:'4-12', bg:'#4a5d68' },
  { id:'2', name:'Song-Kül Horse Ride',  duration:'4h', difficulty:'Easy',     price:30, rating:4.8, reviews:89,  group:'2-8',  bg:'#6a5a4b' },
  { id:'3', name:'Eagle Hunting Demo',   duration:'2h', difficulty:'Easy',     price:45, rating:4.7, reviews:57,  group:'1-20', bg:'#56473d' },
  { id:'4', name:'Karakol Ski Pass',     duration:'Full day', difficulty:'Hard', price:25, rating:4.6, reviews:203, group:'1+', bg:'#3d6479' },
];

const DIFF_COLORS: Record<string, string> = { Easy: colors.status.success, Moderate: colors.status.warning, Hard: colors.status.error };

export default function ActivitiesScreen() {
  const router = useRouter();

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
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {ACTIVITIES.map(a => (
            <Pressable key={a.id} accessibilityRole="button" style={({ pressed }) => ({ width:'48.5%', opacity: pressed ? 0.85 : 1 })}>
              <Card style={{ overflow:'hidden' }}>
                <View style={{ height:110, backgroundColor: a.bg, position:'relative' }}>
                  <View style={{ position:'absolute', top:8, right:8, flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:8, paddingVertical:4, borderRadius:999, backgroundColor:'rgba(255,255,255,0.92)' }}>
                    <Star size={11} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:11, color:colors.text.primary }}>{a.rating}</Text>
                  </View>
                </View>
                <View style={{ padding:10 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:14, color:colors.text.primary }} numberOfLines={1}>{a.name}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:5 }}>
                    <Clock size={11} color={colors.text.tertiary} strokeWidth={1.5} />
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:11, color:colors.text.secondary }}>{a.duration}</Text>
                  </View>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:3 }}>
                    <Users size={11} color={colors.text.tertiary} strokeWidth={1.5} />
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:11, color:colors.text.secondary }}>{a.group}</Text>
                  </View>
                  <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:14, color:colors.brand.primary }}>${a.price}<Text style={{ fontFamily:'Inter_400Regular', fontSize:11, color:colors.text.secondary }}>/person</Text></Text>
                    <View style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, backgroundColor: `${DIFF_COLORS[a.difficulty]}22` }}>
                      <Text style={{ fontFamily:'Inter_500Medium', fontSize:10, color: DIFF_COLORS[a.difficulty] }}>{a.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
