import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Luggage, ChevronRight, Sparkles } from 'lucide-react-native';
import { formatString } from '../../lib/strings';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { useTripStore } from '../../stores/tripStore';
import { formatUSD } from '../../lib/format';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export default function TripsScreen() {
  const router = useRouter();
  const strings = useStrings();
  const itinerary = useTripStore(s => s.generatedItinerary);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <View style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:28, color:colors.text.primary }}>
          {strings.trips.title}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {itinerary ? (
          /* Has generated itinerary */
          <Pressable
            onPress={() => router.push('/trip/itinerary')}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, width: '100%' })}
          >
            <Card elevated style={{ padding: 20, overflow: 'hidden' }}>
              <View style={{ height:80, borderRadius:12, backgroundColor:'#3d6479', marginBottom:16, alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
              </View>
              <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.text.primary, marginBottom:6 }} numberOfLines={2}>
                {itinerary.title}
              </Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, color:colors.text.secondary, marginBottom:14 }}>
                {formatString(strings.itinerary.daysCount, { count: itinerary.days.length })} · {itinerary.regionsCovered.slice(0,3).join(', ')}
              </Text>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.brand.primary }}>
                  {formatUSD(itinerary.totalCostUsd)}
                </Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, height:36, borderRadius:10, backgroundColor:colors.brand.primary }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:14, color:'#fff' }}>{strings.common.viewDetails}</Text>
                  <ChevronRight size={16} color="#fff" strokeWidth={2} />
                </View>
              </View>
            </Card>
          </Pressable>
        ) : (
          /* Empty state */
          <>
            <View style={{ width:72, height:72, borderRadius:36, backgroundColor:colors.brand.primaryLight, alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <Luggage size={36} color={colors.brand.primary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary, textAlign:'center', marginBottom:10 }}>
              {strings.trips.emptyTitle}
            </Text>
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:15, color:colors.text.secondary, textAlign:'center', marginBottom:28, lineHeight:22 }}>
              {strings.trips.emptySubtitle}
            </Text>
            <Button
              variant="cta"
              label={strings.trips.emptyButton}
              icon={<Sparkles size={20} color="#fff" strokeWidth={2} />}
              onPress={() => router.push('/trip/purpose')}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
