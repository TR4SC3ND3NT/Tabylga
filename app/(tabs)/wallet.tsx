import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Plus, QrCode, ArrowDownLeft, ArrowUpRight, AlertTriangle, ChevronRight, Clock } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Pill } from '../../components/Pill';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

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

  const [isOffline, setIsOffline] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      {/* Hidden toggle for testing offline state */}
      <Pressable onPress={() => setIsOffline(!isOffline)} style={{ position:'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10 }}>Toggle Offline</Text>
      </Pressable>
      
      {isOffline && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.status.warningLight, borderBottomWidth: 1, borderBottomColor: '#EBD6B4' }}>
          <AlertTriangle size={18} color="#8a6530" />
          <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: '#5a3a00' }}>
            You're offline — wallet works for <Text style={{ fontFamily: 'Inter_700Bold' }}>$150 more</Text>
          </Text>
          <ChevronRight size={16} color="#8a6530" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Status badge ── */}
        <View className="items-center pt-4 pb-2">
          <Pill
            variant={isOffline ? "offline" : "online"}
            label={isOffline ? "Offline ready · $150 available" : strings.walletExtra.statusOnline}
            showDot={true}
          />
        </View>

        {/* ── Balance ── */}
        <View className="items-center px-5 py-6">
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.tertiary, marginBottom: 4, letterSpacing: 0.12 * 13, textTransform: 'uppercase' }}>
            {strings.walletExtra.balance}
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 54, color: isOffline ? colors.text.secondary : colors.text.primary }}>
            $1,247.00
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text.secondary, marginTop: 4 }}>
            {isOffline ? 'Last synced 2 hours ago' : '≈ 108,489 KGS'}
          </Text>
          {!isOffline && (
            <Pressable style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary }}>
                {strings.walletExtra.rateLink}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Action buttons ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
          {/* Top up */}
          <Button
            variant="primary"
            label={strings.walletExtra.actionTopUp}
            onPress={() => router.push('/wallet/topup')}
            icon={<Plus size={18} color="#fff" strokeWidth={2} />}
            style={{ flex: 1, ...(isOffline && { backgroundColor: colors.border.divider, opacity: 0.6 }) }}
            disabled={isOffline}
            fontSize={12}
          />

          {/* Pay */}
          <Button
            variant="cta"
            label={strings.walletExtra.actionPay}
            onPress={() => router.push('/wallet/pay')}
            icon={<QrCode size={18} color="#fff" strokeWidth={2} />}
            style={{ flex: 1 }}
            fontSize={12}
          />

          {/* Receive */}
          <Button
            variant="secondary"
            label={strings.walletExtra.actionReceive}
            onPress={() => router.push('/wallet/receive')}
            icon={<ArrowDownLeft size={18} color={colors.brand.primary} strokeWidth={2} />}
            style={{ flex: 1 }}
            fontSize={12}
          />
        </View>

        {isOffline && (
          <View style={{ marginHorizontal: 20, marginBottom: 20, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.status.warningLight, borderRadius: 10 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 15.6, color: '#5a3a00', textAlign: 'center' }}>
              Pay offline with up to $150 · syncs automatically when back online
            </Text>
          </View>
        )}

        {/* ── Recent transactions ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.text.primary, marginBottom: 14 }}>
            {strings.walletExtra.recentTitle}
          </Text>

          {isOffline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.status.warningLight, borderRadius: 12, borderWidth: 1, borderColor: '#EBD6B4', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBD6B4', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#8a6530" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text.primary }}>Nomad's Yurt Camp</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#8a6530', marginTop: 2 }}>⏳ Pending sync</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.text.secondary }}>-$65.00</Text>
            </View>
          )}

          <Card>
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
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
