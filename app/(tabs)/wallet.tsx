import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  QrCode,
  ShieldCheck,
  Send,
  Store,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Bluetooth,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Pill } from '../../components/Pill';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import {
  getWallet,
  getTransactions,
  syncOfflinePayments,
  type Wallet,
  type Transaction,
} from '../../lib/payments/paymentService';
import { PAYMENT_STRINGS, formatKgs } from '../../lib/payments/paymentStrings';

const RECENT_LIMIT = 5;

const TRANSACTION_ICONS: Record<Transaction['type'], React.ReactNode> = {
  top_up: <ArrowDownLeft size={18} color="#fff" strokeWidth={2} />,
  online_qr_payment: <QrCode size={18} color="#fff" strokeWidth={2} />,
  offline_reserve: <ShieldCheck size={18} color="#fff" strokeWidth={2} />,
  offline_qr_payment: <Send size={18} color="#fff" strokeWidth={2} />,
  offline_bluetooth_payment: <Bluetooth size={18} color="#fff" strokeWidth={2} />,
  sync: <RefreshCw size={18} color="#fff" strokeWidth={2} />,
};

const TRANSACTION_AVATAR_COLORS: Record<Transaction['type'], string> = {
  top_up: colors.status.success,
  online_qr_payment: colors.brand.primary,
  offline_reserve: '#7A9B6E',
  offline_qr_payment: '#C65D3A',
  offline_bluetooth_payment: '#1E4D6B',
  sync: '#6a5a4b',
};

const STATUS_PILL: Record<Transaction['status'], { variant: 'online' | 'offline' | 'error' | 'custom'; bg?: string; color?: string }> = {
  completed_online: { variant: 'online' },
  waiting_merchant_acceptance: { variant: 'offline' },
  accepted_offline: { variant: 'custom', bg: '#E5DECD', color: '#6a5a4b' },
  synced: { variant: 'online' },
  expired: { variant: 'error' },
  failed_demo: { variant: 'error' },
};

function isCredit(tx: Transaction): boolean {
  return tx.type === 'top_up';
}

function isMovement(tx: Transaction): boolean {
  // offline_reserve does not change totalBalance, just shifts buckets — render
  // it as neutral.
  return (
    tx.type === 'top_up' ||
    tx.type === 'online_qr_payment' ||
    tx.type === 'offline_qr_payment' ||
    tx.type === 'offline_bluetooth_payment' ||
    tx.type === 'sync'
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [w, txs] = await Promise.all([getWallet(), getTransactions()]);
      setWallet(w);
      setTransactions(txs);
    } catch (err) {
      console.warn('[wallet] failed to load', err);
      Alert.alert('Wallet error', 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) await refresh();
      })();
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflinePayments();
      if (result.syncedCount === 0) {
        Alert.alert(
          PAYMENT_STRINGS.syncNothingTitle,
          PAYMENT_STRINGS.syncNothingBody,
        );
      } else {
        Alert.alert(
          PAYMENT_STRINGS.syncDoneTitle,
          PAYMENT_STRINGS.syncDoneBody(
            result.syncedCount,
            formatKgs(result.syncedAmount).replace(' KGS', ''),
          ),
        );
        await refresh();
      }
    } catch (err) {
      console.warn('[wallet] sync failed', err);
      Alert.alert(
        PAYMENT_STRINGS.syncFailedTitle,
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setSyncing(false);
    }
  }, [refresh, syncing]);

  if (loading || !wallet) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const offlineReady = wallet.offlineReserve > 0;

  const recentTransactions = transactions.slice(0, RECENT_LIMIT);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Balance hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 18 }}>
          <Card elevated style={{ padding: 18, backgroundColor: colors.brand.primary, borderColor: 'transparent' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: '#fff' }}>
                {PAYMENT_STRINGS.walletTitle}
              </Text>
              <Pill
                label={offlineReady ? PAYMENT_STRINGS.statusOfflineReady : PAYMENT_STRINGS.statusOnline}
                showDot
                backgroundColor="rgba(255,255,255,0.16)"
                textColor="#fff"
                height={28}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {PAYMENT_STRINGS.totalBalance}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 42,
                lineHeight: 48,
                color: '#fff',
              }}
            >
              {formatKgs(wallet.totalBalance)}
            </Text>
          </Card>
        </View>

        {/* Balance cards: 2x2 grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <BalanceCard
              label={PAYMENT_STRINGS.availableOnline}
              value={wallet.availableOnline}
              accent={colors.status.success}
            />
            <BalanceCard
              label={PAYMENT_STRINGS.offlineReserve}
              value={wallet.offlineReserve}
              accent={colors.brand.primary}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <BalanceCard
              label={PAYMENT_STRINGS.lockedOffline}
              value={wallet.lockedOffline}
              accent="#C65D3A"
            />
            <BalanceCard
              label={PAYMENT_STRINGS.pendingSync}
              value={wallet.pendingSync}
              accent={colors.status.warning}
            />
          </View>
        </View>

        {/* Action buttons grid 2x3 */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <Button
              variant="primary"
              label={PAYMENT_STRINGS.actionTopUp}
              onPress={() => router.push('/wallet/topup')}
              icon={<Plus size={18} color="#fff" strokeWidth={2} />}
              style={{ flex: 1 }}
              fontSize={13}
              accessibilityLabel={PAYMENT_STRINGS.actionTopUp}
            />
            <Button
              variant="cta"
              label={PAYMENT_STRINGS.actionPayOnlineQr}
              onPress={() => router.push('/wallet/pay')}
              icon={<QrCode size={18} color="#fff" strokeWidth={2} />}
              style={{ flex: 1 }}
              fontSize={13}
              accessibilityLabel={PAYMENT_STRINGS.actionPayOnlineQr}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <Button
              variant="secondary"
              label={PAYMENT_STRINGS.actionActivateOffline}
              onPress={() => router.push('/wallet/activate-offline')}
              icon={
                <ShieldCheck
                  size={18}
                  color={colors.brand.primary}
                  strokeWidth={2}
                />
              }
              style={{ flex: 1 }}
              fontSize={12}
              accessibilityLabel={PAYMENT_STRINGS.actionActivateOffline}
            />
            <Button
              variant="secondary"
              label={PAYMENT_STRINGS.actionPayOffline}
              onPress={() => router.push('/wallet/pay-offline')}
              icon={
                <Send
                  size={18}
                  color={colors.brand.primary}
                  strokeWidth={2}
                />
              }
              style={{ flex: 1 }}
              fontSize={13}
              accessibilityLabel={PAYMENT_STRINGS.actionPayOffline}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              variant="secondary"
              label={PAYMENT_STRINGS.actionMerchantMode}
              onPress={() => router.push('/merchant/dashboard')}
              icon={
                <Store
                  size={18}
                  color={colors.brand.primary}
                  strokeWidth={2}
                />
              }
              style={{ flex: 1 }}
              fontSize={13}
              accessibilityLabel={PAYMENT_STRINGS.actionMerchantMode}
            />
            <Button
              variant="ghost"
              label={syncing ? '…' : PAYMENT_STRINGS.actionSync}
              onPress={handleSync}
              disabled={syncing}
              icon={
                <RefreshCw
                  size={18}
                  color={colors.brand.primary}
                  strokeWidth={2}
                />
              }
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: colors.brand.primary,
              }}
              fontSize={13}
              accessibilityLabel={PAYMENT_STRINGS.actionSync}
            />
          </View>
        </View>

        {/* Explanation card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Card
            style={{
              padding: 16,
              backgroundColor: colors.status.warningLight,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ShieldCheck size={20} color={colors.brand.cta} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: colors.text.primary,
                }}
              >
                {PAYMENT_STRINGS.explanationTitle}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                lineHeight: 18,
                color: colors.text.secondary,
              }}
            >
              {PAYMENT_STRINGS.explanationBody}
            </Text>
          </Card>
        </View>

        {/* Prototype note */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#F4F1EA',
              borderWidth: 1,
              borderColor: colors.border.divider,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 11,
                color: colors.text.tertiary,
                letterSpacing: 0.08 * 11,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {PAYMENT_STRINGS.prototypeNoteTitle}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                lineHeight: 17,
                color: colors.text.secondary,
              }}
            >
              {PAYMENT_STRINGS.prototypeNoteBody}
            </Text>
          </View>
        </View>

        {/* Recent transactions */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 18,
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            {PAYMENT_STRINGS.recentTitle}
          </Text>

          {recentTransactions.length === 0 ? (
            <View
              style={[
                {
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: colors.surface.card,
                },
                shadows.card,
              ]}
            >
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                {PAYMENT_STRINGS.emptyRecent}
              </Text>
            </View>
          ) : (
            <Card>
              {recentTransactions.map((tx, i) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  isLast={i === recentTransactions.length - 1}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BalanceCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.surface.card,
          borderLeftWidth: 3,
          borderLeftColor: accent,
        },
        shadows.card,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          color: colors.text.tertiary,
          letterSpacing: 0.08 * 11,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
          color: colors.text.primary,
        }}
        numberOfLines={1}
      >
        {formatKgs(value)}
      </Text>
    </View>
  );
}

function TransactionRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const credit = isCredit(tx);
  const movement = isMovement(tx);
  const sign = credit ? '+' : movement && tx.type !== 'sync' ? '-' : '';
  const amountColor =
    credit
      ? colors.status.success
      : tx.type === 'sync'
        ? colors.brand.primary
        : colors.text.primary;
  const pillCfg = STATUS_PILL[tx.status];
  const title =
    tx.merchantName ?? PAYMENT_STRINGS.txTypeLabels[tx.type] ?? 'Transaction';
  const sub = PAYMENT_STRINGS.txTypeLabels[tx.type] ?? '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.divider,
        minHeight: 64,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: TRANSACTION_AVATAR_COLORS[tx.type],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {TRANSACTION_ICONS[tx.type]}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: colors.text.primary,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 11,
              color: colors.text.tertiary,
            }}
            numberOfLines={1}
          >
            {sub}
          </Text>
          <Pill
            label={PAYMENT_STRINGS.statusLabels[tx.status]}
            variant={pillCfg.variant}
            backgroundColor={pillCfg.bg}
            textColor={pillCfg.color}
            height={18}
            fontSize={10}
            icon={
              tx.status === 'waiting_merchant_acceptance' ? (
                <Clock size={10} color="#1A1A1A" strokeWidth={2} />
              ) : tx.status === 'synced' ? (
                <CheckCircle2 size={10} color="#fff" strokeWidth={2} />
              ) : null
            }
          />
        </View>
      </View>
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 14,
          color: amountColor,
        }}
      >
        {sign}
        {formatKgs(tx.amount)}
      </Text>
    </View>
  );
}
