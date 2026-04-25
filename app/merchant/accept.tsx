import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';

import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import type { PaymentMerchant } from '../../lib/data/paymentMerchants';
import {
  getOfflineMerchants,
  getOfflineTokens,
  getTransactions,
  merchantAcceptOfflinePayment,
  type MerchantAcceptResult,
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

export default function MerchantAcceptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tokenId?: string; merchantId?: string }>();
  const [token, setToken] = useState<OfflineToken | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchant, setMerchant] = useState<PaymentMerchant | null>(null);
  const [accepted, setAccepted] = useState<MerchantAcceptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [tokens, transactions] = await Promise.all([
        getOfflineTokens(),
        getTransactions(),
      ]);
      const nextToken = tokens.find((item) => item.id === params.tokenId) ?? null;
      const nextMerchant =
        getOfflineMerchants().find((item) => item.id === params.merchantId) ?? null;
      const nextTx = nextToken
        ? transactions.find((item) => item.id === nextToken.transactionId) ?? null
        : null;

      setToken(nextToken);
      setTransaction(nextTx);
      setMerchant(nextMerchant);
    } catch (err) {
      console.warn('[merchant-accept] failed to load verification', err);
      Alert.alert('Offline payment request', 'Failed to load token details.');
    } finally {
      setLoading(false);
    }
  }, [params.merchantId, params.tokenId]);

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

  async function acceptPayment() {
    if (!token || !merchant || accepting) return;
    setAccepting(true);
    try {
      const result = await merchantAcceptOfflinePayment(token.id, merchant.id);
      setAccepted(result);
      setToken(result.token);
      setTransaction(result.transaction);
      setMerchant(result.merchant);
    } catch (err) {
      Alert.alert(
        'Cannot accept payment',
        err instanceof Error ? err.message : 'The token could not be accepted.',
      );
    } finally {
      setAccepting(false);
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

  if (!token || !merchant || !transaction) {
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
          }}
        >
          <Pressable
            onPress={() => router.replace('/merchant/dashboard')}
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
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <XCircle size={44} color={colors.status.error} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 25,
              color: colors.text.primary,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            Invalid or expired token.
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 20,
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 22,
            }}
          >
            The merchant should ask the tourist to generate a new KICB Demo offline QR.
          </Text>
          <Button
            label="Back to Merchant Mode"
            onPress={() => router.replace('/merchant/dashboard')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (accepted) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <Header title="Payment accepted offline" onBack={() => router.replace('/merchant/dashboard')} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: Math.max(insets.bottom, 18) + 24,
          }}
        >
          <View
            style={[
              {
                padding: 18,
                borderRadius: 22,
                backgroundColor: colors.status.successLight,
                alignItems: 'center',
                marginBottom: 16,
              },
              shadows.card,
            ]}
          >
            <CheckCircle2
              size={48}
              color={colors.status.successText}
              strokeWidth={1.8}
            />
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 27,
                lineHeight: 32,
                color: colors.text.primary,
                textAlign: 'center',
                marginTop: 14,
              }}
            >
              Payment accepted offline
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: colors.text.secondary,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Customer cannot cancel this payment after acceptance. Settlement
              will sync when internet is available.
            </Text>
          </View>

          <View style={[stylesCard, shadows.card]}>
            <Detail label="Amount" value={formatKgs(accepted.transaction.amount)} />
            <Detail label="Merchant" value={accepted.merchant.name} />
            <Detail label="Status" value="Pending sync" />
            <Detail label="Receipt code" value={accepted.transaction.receiptCode} />
            <Detail label="Token ID" value={accepted.token.id} />
          </View>

          <View style={{ gap: 10, marginTop: 18 }}>
            <Button
              label="Back to Merchant Mode"
              onPress={() => router.replace('/merchant/dashboard')}
            />
            <Button
              variant="secondary"
              label="Sync payments"
              onPress={() =>
                Alert.alert(
                  'Sync payments',
                  'Sync accepted offline payments will be implemented in Phase 7.',
                )
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const notExpired = Date.now() < new Date(token.expiresAt).getTime();
  const canAccept =
    notExpired && (token.status === 'created' || token.status === 'shown_to_merchant');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title="Offline payment request" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 18) + 24,
        }}
      >
        <View
          style={[
            {
              padding: 18,
              borderRadius: 22,
              backgroundColor: colors.brand.primaryLight,
              marginBottom: 16,
            },
            shadows.card,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.surface.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={25} color={colors.brand.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: colors.text.primary,
                }}
              >
                KICB Demo token verified
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
                Prototype only. No real bank integration or settlement.
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 36,
              lineHeight: 42,
              color: colors.text.primary,
              marginTop: 18,
            }}
          >
            {formatKgs(token.amount)}
          </Text>
        </View>

        <View style={[stylesCard, shadows.card]}>
          <Detail label="Amount" value={formatKgs(token.amount)} />
          <Detail label="Currency" value="KGS" />
          <Detail label="Merchant name" value={merchant.name} />
          <Detail label="Issuer" value="KICB Demo" />
          <Detail label="Signature" value="verified" />
          <Detail label="Reserve-backed token" value="yes" />
          <Detail label="One-time token" value="yes" />
          <Detail label="Not expired" value={notExpired ? 'yes' : 'no'} />
          <Detail label="Risk" value="low" />
          <Detail label="Token ID" value={token.id} />
          <Detail label="Expires at" value={formatTime(token.expiresAt)} />
        </View>

        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 16,
              color: colors.text.primary,
              marginBottom: 10,
            }}
          >
            Trust signals
          </Text>
          <View style={{ gap: 8 }}>
            <TrustSignal label="Issued by KICB Demo" />
            <TrustSignal label="Signature verified" />
            <TrustSignal label="Reserve-backed token" />
            <TrustSignal label="One-time token" />
            <TrustSignal label="Not expired" />
            <TrustSignal label="Receipt will be saved for sync" />
          </View>
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.status.warningLight,
            borderWidth: 1,
            borderColor: colors.border.divider,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 13,
              color: colors.text.primary,
              marginBottom: 4,
            }}
          >
            Prototype only
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              lineHeight: 19,
              color: colors.text.secondary,
            }}
          >
            This is a demo. In production, the token would be issued and
            settled by a licensed banking partner.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Button
            variant="cta"
            label={accepting ? 'Accepting...' : 'Accept payment'}
            disabled={!canAccept || accepting}
            icon={<ReceiptText size={18} color="#fff" strokeWidth={2} />}
            onPress={acceptPayment}
          />
          <Button
            variant="ghost"
            label="Reject / Back"
            onPress={() => router.replace('/merchant/dashboard')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
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
        onPress={onBack}
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
      <Text
        style={{
          flex: 1,
          fontFamily: 'Inter_700Bold',
          fontSize: 17,
          color: colors.text.primary,
          textAlign: 'center',
          marginRight: 44,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.divider,
      }}
    >
      <Text
        style={{
          width: 126,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          color: colors.text.secondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
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

function TrustSignal({ label }: { label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.surface.card,
        borderWidth: 1,
        borderColor: colors.border.divider,
      }}
    >
      <CheckCircle2 size={18} color={colors.status.successText} strokeWidth={2} />
      <Text
        style={{
          flex: 1,
          fontFamily: 'Inter_700Bold',
          fontSize: 13,
          color: colors.text.primary,
        }}
      >
        {label}
      </Text>
      <Clock size={15} color={colors.text.tertiary} strokeWidth={1.7} />
    </View>
  );
}

const stylesCard = {
  padding: 16,
  borderRadius: 18,
  backgroundColor: colors.surface.card,
};
