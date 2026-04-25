import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Plus, QrCode, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';

const TRANSACTIONS = [
  { id: '1', name: 'Faiza Restaurant',    type: 'debit',  amount: 12.50,  date: 'Today, 13:22' },
  { id: '2', name: 'Yandex Taxi',         type: 'debit',  amount: 4.20,   date: 'Today, 11:05' },
  { id: '3', name: 'Top up from MBank',   type: 'credit', amount: 100.00, date: 'Yesterday' },
  { id: '4', name: 'Ala-Archa entry',     type: 'debit',  amount: 3.00,   date: 'Apr 23' },
  { id: '5', name: "Nomad's Yurt Camp",   type: 'debit',  amount: 65.00,  date: 'Apr 22' },
];

const AVATAR_COLORS: Record<string, string> = {
  '1': '#C65D3A', '2': '#1E4D6B', '3': '#7A9B6E', '4': '#1E4D6B', '5': '#6a5a4b',
};

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Status badge ── */}
        <View className="items-center pt-4 pb-2">
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
            backgroundColor: colors.status.successLight,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.status.success }} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.status.success }}>
              {strings.walletExtra.statusOnline}
            </Text>
          </View>
        </View>

        {/* ── Balance ── */}
        <View className="items-center px-5 py-6">
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.tertiary, marginBottom: 4, letterSpacing: 0.12 * 13, textTransform: 'uppercase' }}>
            {strings.walletExtra.balance}
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 54, color: colors.text.primary }}>
            $1,247.00
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text.secondary, marginTop: 4 }}>
            ≈ 108,489 KGS
          </Text>
          <Pressable style={{ marginTop: 6 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary }}>
              {strings.walletExtra.rateLink}
            </Text>
          </Pressable>
        </View>

        {/* ── Action buttons ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
          {/* Top up */}
          <Pressable
            onPress={() => router.push('/wallet/topup')}
            accessibilityLabel={strings.walletExtra.actionTopUp}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: 14,
              backgroundColor: colors.brand.primary,
              alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Plus size={18} color="#fff" strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' }}>
              {strings.walletExtra.actionTopUp}
            </Text>
          </Pressable>

          {/* Pay */}
          <Pressable
            onPress={() => router.push('/wallet/pay')}
            accessibilityLabel={strings.walletExtra.actionPay}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: 14,
              backgroundColor: colors.brand.cta,
              alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <QrCode size={18} color="#fff" strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' }}>
              {strings.walletExtra.actionPay}
            </Text>
          </Pressable>

          {/* Receive */}
          <Pressable
            onPress={() => router.push('/wallet/receive')}
            accessibilityLabel={strings.walletExtra.actionReceive}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: 14,
              backgroundColor: colors.surface.card,
              borderWidth: 1.5, borderColor: colors.brand.primary,
              alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <ArrowDownLeft size={18} color={colors.brand.primary} strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.brand.primary }}>
              {strings.walletExtra.actionReceive}
            </Text>
          </Pressable>
        </View>

        {/* ── Recent transactions ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.text.primary, marginBottom: 14 }}>
            {strings.walletExtra.recentTitle}
          </Text>

          <View style={[{ borderRadius: 16, backgroundColor: colors.surface.card, overflow: 'hidden' }, shadows.card]}>
            {TRANSACTIONS.map((tx, i) => {
              const isCredit = tx.type === 'credit';
              const isLast = i === TRANSACTIONS.length - 1;
              return (
                <View
                  key={tx.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border.divider,
                    minHeight: 64,
                  }}
                >
                  {/* Avatar */}
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: AVATAR_COLORS[tx.id] ?? colors.brand.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCredit
                      ? <ArrowDownLeft size={18} color="#fff" strokeWidth={2} />
                      : <ArrowUpRight size={18} color="#fff" strokeWidth={2} />
                    }
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.primary }}>
                      {tx.name}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary, marginTop: 2 }}>
                      {tx.date}
                    </Text>
                  </View>

                  {/* Amount */}
                  <Text style={{
                    fontFamily: 'Inter_600SemiBold', fontSize: 15,
                    color: isCredit ? colors.status.success : colors.text.primary,
                  }}>
                    {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
