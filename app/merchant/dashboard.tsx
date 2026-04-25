import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, CheckCircle, ArrowDownLeft, CreditCard } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Button } from '../../components/Button';

const WEEKLY = [
  { day: 'Mon', amount: 8450 },
  { day: 'Tue', amount: 6200 },
  { day: 'Wed', amount: 9800 },
  { day: 'Thu', amount: 7300 },
  { day: 'Fri', amount: 11200 },
  { day: 'Sat', amount: 14500 },
  { day: 'Sun', amount: 12450, isToday: true },
];
const MAX_BAR = Math.max(...WEEKLY.map(d => d.amount));
const BAR_HEIGHT = 56;

const RECENT = [
  { name: 'Aliya K.', amount: 4500, time: '14:32' },
  { name: 'Tourist John', amount: 8750, time: '12:15' },
  { name: 'Sarah M.',  amount: 3200, time: '10:08' },
];

export default function MerchantDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityLabel={strings.common.back} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>

        {/* Mode switcher */}
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.surface.primary, borderRadius: 10, padding: 3, marginHorizontal: 8, borderWidth: 1, borderColor: colors.border.divider }}>
          <View style={{ flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>
              {strings.merchantExtra.modeTraverler}
            </Text>
          </View>
          <View style={{ flex: 1, height: 34, borderRadius: 8, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' }}>
              {strings.merchantExtra.modeMerchant}
            </Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Business card */}
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: colors.surface.card, marginBottom: 16 }, shadows.card]}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#6a5a4b', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>🏕</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary }}>
                Nomad's Yurt Camp
              </Text>
              <CheckCircle size={16} color={colors.status.success} strokeWidth={2} fill={colors.status.success} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Star size={13} color={colors.status.warning} strokeWidth={0} fill={colors.status.warning} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text.primary }}>4.9</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary }}>(34 reviews)</Text>
            </View>
          </View>
        </View>

        {/* Today stats */}
        <View style={{ padding: 20, borderRadius: 16, backgroundColor: colors.brand.primaryLight, marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, letterSpacing: 0.12 * 12, textTransform: 'uppercase', marginBottom: 4 }}>
            {strings.merchantExtra.earningsToday}
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 36, color: colors.brand.primary }}>
            12,450 KGS
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.secondary, marginTop: 2 }}>
            ≈ $143
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>23 transactions</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>Avg $6.21</Text>
          </View>
        </View>

        {/* Weekly chart */}
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 14 }}>
          This week
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_HEIGHT + 30, marginBottom: 20 }}>
          {WEEKLY.map((d) => {
            const h = Math.round((d.amount / MAX_BAR) * BAR_HEIGHT);
            return (
              <View key={d.day} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: '65%', height: h, borderRadius: 5, backgroundColor: d.isToday ? colors.brand.cta : colors.brand.primaryLight }} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: d.isToday ? colors.brand.cta : colors.text.tertiary, marginTop: 6 }}>
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Recent incoming */}
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          Recent payments
        </Text>
        <View style={[{ borderRadius: 14, backgroundColor: colors.surface.card, overflow: 'hidden', marginBottom: 20 }, shadows.card]}>
          {RECENT.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < RECENT.length - 1 ? 1 : 0, borderBottomColor: colors.border.divider }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.status.successLight, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownLeft size={18} color={colors.status.success} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.primary }}>{r.name}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary, marginTop: 1 }}>{r.time}</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.status.success }}>+{r.amount.toLocaleString('ru-RU')} KGS</Text>
            </View>
          ))}
        </View>

        <Button
          variant="secondary"
          label={strings.merchantExtra.withdrawCta}
          icon={<CreditCard size={18} color={colors.brand.primary} strokeWidth={1.5} />}
        />
      </ScrollView>

      {/* Accept payment CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.primary, borderTopWidth: 1, borderTopColor: colors.border.divider }}>
        <Button
          variant="cta"
          label={strings.merchantExtra.acceptCta}
          onPress={() => router.push('/merchant/accept')}
        />
      </View>
    </SafeAreaView>
  );
}
