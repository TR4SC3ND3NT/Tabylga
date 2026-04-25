import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Wifi } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { ESIM_PLANS } from '../../lib/backend/demoBackend';
import { useTravelPreferencesStore, type EsimChoice } from '../../stores/travelPreferencesStore';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';

function planToChoice(id: string): EsimChoice {
  if (id === 'esim_7_5') return 'starter';
  if (id === 'esim_14_15') return 'traveler';
  return 'nomad';
}

export default function EsimScreen() {
  const router = useRouter();
  const strings = useStrings();
  const esimChoice = useTravelPreferencesStore((s) => s.esimChoice);
  const setEsimChoice = useTravelPreferencesStore((s) => s.setEsimChoice);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.esim.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:20, gap:12 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding:18, borderRadius:18, backgroundColor:colors.brand.primaryLight }}>
          <Wifi size={28} color={colors.brand.primary} strokeWidth={1.5} />
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary, marginTop:12 }}>
            {strings.esim.title}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, lineHeight:21, color:colors.text.secondary, marginTop:6 }}>
            {strings.esim.subtitle}
          </Text>
        </View>

        {ESIM_PLANS.map((plan) => {
          const choice = planToChoice(plan.id);
          const selected = esimChoice === choice;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setEsimChoice(choice)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                borderRadius:16,
                borderWidth:selected ? 2 : 1,
                borderColor:selected ? colors.brand.primary : colors.border.divider,
                backgroundColor:selected ? colors.brand.primaryLight : colors.surface.card,
                padding:16,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <View style={{ width:42, height:42, borderRadius:14, backgroundColor:colors.surface.card, alignItems:'center', justifyContent:'center' }}>
                  {selected ? <Check size={20} color={colors.brand.primary} strokeWidth={2} /> : <Wifi size={20} color={colors.text.secondary} strokeWidth={1.5} />}
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:16, color:colors.text.primary }}>
                    {plan.title}
                  </Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:3 }}>
                    {strings.esim.data.replace('{count}', String(plan.dataGb))} · {strings.esim.days.replace('{count}', String(plan.durationDays))}
                  </Text>
                </View>
                <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:22, color:colors.brand.primary }}>${plan.priceUsd}</Text>
              </View>
              {plan.recommended && (
                <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.brand.cta, marginTop:10 }}>
                  {strings.esim.recommended}
                </Text>
              )}
            </Pressable>
          );
        })}

        <View style={{ flexDirection:'row', gap:10 }}>
          <Button variant="secondary" label={strings.esim.later} onPress={() => setEsimChoice('later')} style={{ flex:1 }} />
          <Button variant="secondary" label={strings.esim.skip} onPress={() => setEsimChoice('skip')} style={{ flex:1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
