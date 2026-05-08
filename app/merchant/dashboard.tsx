import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bluetooth,
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react-native';

import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { goBackOrReplace } from '../../lib/navigation';
import type { PaymentMerchant } from '../../lib/data/paymentMerchants';
import {
  extractOfflinePayload,
  getOfflineMerchants,
  getOfflineTokens,
  getTransactions,
  merchantScanOfflineQR,
  syncOfflinePayments,
  type OfflineToken,
  type Transaction,
} from '../../lib/payments/paymentService';
import { formatKgs } from '../../lib/payments/paymentStrings';

function formatTime(value: string | null): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MerchantDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const merchants = useMemo(() => getOfflineMerchants(), []);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    merchants[0]?.id ?? null,
  );
  const [tokens, setTokens] = useState<OfflineToken[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningTokenId, setScanningTokenId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const selectedMerchant =
    merchants.find((merchant) => merchant.id === selectedMerchantId) ??
    merchants[0] ??
    null;

  const refresh = useCallback(async () => {
    try {
      const [offlineTokens, transactions] = await Promise.all([
        getOfflineTokens(),
        getTransactions(),
      ]);
      setTokens(
        offlineTokens
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
      );
      setPendingPayments(
        transactions
          .filter(
            (tx) =>
              tx.status === 'accepted_offline' &&
              (tx.type === 'offline_qr_payment' ||
                tx.type === 'offline_bluetooth_payment'),
          )
          .sort(
            (a, b) =>
              new Date(b.acceptedAt ?? b.createdAt).getTime() -
              new Date(a.acceptedAt ?? a.createdAt).getTime(),
          ),
      );
    } catch (err) {
      console.warn('[merchant] failed to load offline payments', err);
      Alert.alert('Merchant Mode error', 'Failed to load offline payment data.');
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

  const latestToken = tokens[0] ?? null;
  const pendingTotal = pendingPayments.reduce((sum, tx) => sum + tx.amount, 0);

  async function scanToken(token: OfflineToken) {
    if (!selectedMerchant) {
      Alert.alert('Choose merchant', 'Select a merchant profile first.');
      return;
    }

    setScanningTokenId(token.id);
    try {
      const offlinePayload = extractOfflinePayload(token.qrDeepLink ?? token.qrPayload);
      if (!offlinePayload) {
        router.push({
          pathname: '/merchant/accept',
          params: {
            errorReason: 'invalid_payload',
            tokenId: token.id,
            merchantId: selectedMerchant.id,
          },
        } as never);
        return;
      }

      const verification = await merchantScanOfflineQR(
        offlinePayload,
        selectedMerchant.id,
      );
      if (!verification.ok || !verification.token) {
        router.push({
          pathname: '/merchant/accept',
          params: {
            errorReason: verification.reason ?? 'unknown',
            tokenId: verification.tokenId ?? token.id,
            merchantId: selectedMerchant.id,
          },
        } as never);
        await refresh();
        return;
      }

      router.push({
        pathname: '/merchant/accept',
        params: {
          tokenId: verification.token.id,
          merchantId: selectedMerchant.id,
        },
      } as never);
    } catch (err) {
      Alert.alert(
        'Invalid or expired token.',
        err instanceof Error ? err.message : 'The QR could not be verified.',
      );
    } finally {
      setScanningTokenId(null);
    }
  }

  async function handleSyncPayments() {
    if (syncing) return;
    if (pendingPayments.length === 0) {
      Alert.alert('Nothing to sync', 'No accepted offline payments are waiting for sync.');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncOfflinePayments();
      await refresh();

      if (result.syncedCount === 0) {
        Alert.alert('Nothing to sync', 'No accepted offline payments are waiting for sync.');
        return;
      }

      Alert.alert(
        'Payment synced',
        `Settlement completed.\n\nSynced: ${result.syncedCount}\nAmount: ${formatKgs(result.syncedAmount)}\n\nMerchant will receive the amount through partner settlement.`,
      );
    } catch (err) {
      Alert.alert(
        'Sync failed',
        err instanceof Error ? err.message : 'Could not sync offline payments.',
      );
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.divider,
        }}
      >
        <Pressable
          onPress={() => goBackOrReplace(router, '/(tabs)/wallet')}
          accessibilityLabel="Back"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 25,
              color: colors.text.primary,
            }}
          >
            Merchant Mode
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              lineHeight: 18,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            Accept signed offline payments from tourists.
          </Text>
        </View>
        <Pressable
          onPress={refresh}
          accessibilityLabel="Refresh"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <RefreshCw size={20} color={colors.brand.primary} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 18) + 24,
        }}
      >
        <SectionTitle
          title="Merchant profile selector"
          body="Choose the local provider accepting the tourist's offline token."
        />
        <View style={{ gap: 10, marginBottom: 22 }}>
          {merchants.map((merchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              selected={merchant.id === selectedMerchant?.id}
              onPress={() => setSelectedMerchantId(merchant.id)}
            />
          ))}
        </View>

        <SectionTitle
          title="Scan customer offline QR"
          body="Use the latest tourist QR token saved on this device."
        />
        <View
          style={[
            {
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.surface.card,
              marginBottom: 22,
            },
            shadows.card,
          ]}
        >
          <Button
            variant="cta"
            label="Scan latest token"
            icon={<ShieldCheck size={18} color="#fff" strokeWidth={2} />}
            disabled={!latestToken || !!scanningTokenId}
            onPress={() => latestToken && scanToken(latestToken)}
          />
          <View
            style={{
              padding: 12,
              borderRadius: 14,
              backgroundColor: colors.brand.primaryLight,
              borderWidth: 1,
              borderColor: colors.border.divider,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 12,
                color: colors.text.primary,
                marginBottom: 4,
              }}
            >
              Device handoff
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                lineHeight: 18,
                color: colors.text.secondary,
              }}
            >
              External phone camera opens a Tabylga deep link. Saved offline
              tokens are verified locally and kept ready for later settlement.
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: colors.text.primary,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Offline QR tokens
          </Text>
          {tokens.length === 0 ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                lineHeight: 19,
                color: colors.text.secondary,
              }}
            >
              No waiting offline QR tokens.
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {tokens.map((token) => (
                <TokenRow
                  key={token.id}
                  token={token}
                  scanning={scanningTokenId === token.id}
                  onPress={() => scanToken(token)}
                />
              ))}
            </View>
          )}
        </View>

        <SectionTitle
          title="Pending offline payments"
          body="Accepted tokens waiting for future settlement sync."
        />
        {pendingPayments.length === 0 ? (
          <EmptyCard text="No pending offline payments yet." />
        ) : (
          <View style={{ gap: 10, marginBottom: 22 }}>
            {pendingPayments.map((tx) => (
              <PendingPaymentCard key={tx.id} tx={tx} />
            ))}
          </View>
        )}

        <SectionTitle
          title="Sync payments"
          body="Settle accepted offline payments when internet is available."
        />
        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: colors.brand.primaryLight,
            borderWidth: 1,
            borderColor: colors.border.divider,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <SyncStat label="Accepted payments" value={String(pendingPayments.length)} />
            <SyncStat label="Selected merchant" value={selectedMerchant?.name ?? 'None'} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: colors.text.primary,
              marginBottom: 6,
            }}
          >
            {formatKgs(pendingTotal)} pending sync
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              lineHeight: 19,
              color: colors.text.secondary,
              marginBottom: 12,
            }}
          >
            Accepted payments are saved locally and settle when internet is
            available through the selected payment partner.
          </Text>
          <Button
            variant="secondary"
            label={syncing ? 'Syncing...' : 'Sync when online'}
            disabled={syncing || pendingPayments.length === 0}
            icon={
              <RefreshCw
                size={18}
                color={colors.brand.primary}
                strokeWidth={2}
              />
            }
            onPress={handleSyncPayments}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 17,
          color: colors.text.primary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 13,
          lineHeight: 18,
          color: colors.text.secondary,
          marginTop: 3,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

function MerchantCard({
  merchant,
  selected,
  onPress,
}: {
  merchant: PaymentMerchant;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          padding: 14,
          borderRadius: 18,
          backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
          borderWidth: 1.5,
          borderColor: selected ? colors.brand.primary : colors.border.divider,
          opacity: pressed ? 0.75 : 1,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: selected ? colors.brand.primary : colors.status.warningLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Store
            size={20}
            color={selected ? '#fff' : colors.brand.primary}
            strokeWidth={1.8}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: colors.text.primary,
            }}
          >
            {merchant.name}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            {merchant.type} - {merchant.region}
          </Text>
        </View>
        {selected ? (
          <CheckCircle2
            size={20}
            color={colors.brand.primary}
            strokeWidth={2}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        <Badge label="Offline QR supported" />
        {merchant.bluetoothDemoSupported ? (
          <Badge label="Nearby device supported" icon="bluetooth" />
        ) : null}
      </View>
    </Pressable>
  );
}

function TokenRow({
  token,
  scanning,
  onPress,
}: {
  token: OfflineToken;
  scanning: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      disabled={scanning}
      style={({ pressed }) => ({
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.surface.primary,
        borderWidth: 1,
        borderColor: colors.border.divider,
        opacity: scanning ? 0.55 : pressed ? 0.75 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.status.warningLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QrCode size={18} color={colors.brand.cta} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: colors.text.primary,
            }}
          >
            {formatKgs(token.amount)}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            Signed offline token - expires {formatTime(token.expiresAt)}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 11,
              color: token.status === 'created' ? colors.brand.primary : colors.status.warningText,
              marginTop: 3,
            }}
          >
            Status: {token.status}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 12,
            color: colors.brand.primary,
          }}
        >
          {scanning ? 'Scanning...' : 'Scan'}
        </Text>
      </View>
    </Pressable>
  );
}

function PendingPaymentCard({ tx }: { tx: Transaction }) {
  return (
    <View
      style={[
        {
          padding: 14,
          borderRadius: 18,
          backgroundColor: colors.surface.card,
        },
        shadows.card,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.status.successLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={20} color={colors.status.successText} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: colors.text.primary,
            }}
          >
            {formatKgs(tx.amount)}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            {tx.merchantName ?? 'Merchant'} - accepted {formatTime(tx.acceptedAt)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        <Badge label="accepted_offline / pending sync" />
        <Badge label={tx.method === 'offline_customer_qr' ? 'offline customer QR' : tx.method} />
        <Badge label={tx.receiptCode} />
      </View>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View
      style={[
        {
          padding: 16,
          borderRadius: 18,
          backgroundColor: colors.surface.card,
          marginBottom: 22,
        },
        shadows.card,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 13,
          lineHeight: 19,
          color: colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function SyncStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 70,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.surface.card,
        borderWidth: 1,
        borderColor: colors.border.divider,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          color: colors.text.tertiary,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 13,
          lineHeight: 18,
          color: colors.text.primary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Badge({ label, icon }: { label: string; icon?: 'bluetooth' }) {
  return (
    <View
      style={{
        minHeight: 26,
        paddingHorizontal: 9,
        borderRadius: 999,
        backgroundColor: colors.brand.primaryLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {icon === 'bluetooth' ? (
        <Bluetooth size={12} color={colors.brand.primary} strokeWidth={2} />
      ) : null}
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 11,
          color: colors.brand.primary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
