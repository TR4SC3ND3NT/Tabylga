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
  Store,
  XCircle,
} from 'lucide-react-native';

import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { shadows } from '../../constants/shadows';
import type { PaymentMerchant } from '../../lib/data/paymentMerchants';
import {
  extractOfflinePayload,
  getOfflineMerchants,
  getOfflineTokens,
  getTransactions,
  merchantAcceptOfflinePayment,
  merchantScanOfflineQR,
  syncOfflinePayments,
  type MerchantAcceptResult,
  type OfflineToken,
  type OfflineQrVerificationReason,
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

function shortenId(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function firstParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodePayloadParam(value?: string | string[]): string | null {
  const raw = firstParam(value);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function errorCopy(reason: OfflineQrVerificationReason | string | undefined, token?: OfflineToken | null) {
  if (reason === 'invalid_payload') return { title: 'Invalid QR code', text: 'This QR is not a valid Tabylga offline payment token.' };
  if (reason === 'missing_fields') return { title: 'Incomplete offline token', text: 'This QR is missing required payment fields.' };
  if (reason === 'token_not_found') return { title: 'Demo token not found on this device', text: 'This QR was generated on another device. In production, verification would use partner bank infrastructure. For hackathon demo, use Merchant Mode on the same device or Demo scan latest token.' };
  if (reason === 'signature_or_payload_mismatch') return { title: 'Signature mismatch', text: 'Payment details do not match the signed token.' };
  if (reason === 'expired' || token?.status === 'expired') return { title: 'Token expired', text: 'This offline QR has expired. Ask the customer to generate a new one.' };
  if (token?.status === 'synced') return { title: 'Token already synced', text: 'This offline payment was already settled in demo mode.' };
  if (reason === 'already_used' || token?.status === 'accepted_offline') return { title: 'Token already used', text: 'This offline QR was already accepted and cannot be used again.' };
  if (reason === 'insufficient_reserved_balance') return { title: 'Reserve no longer available', text: 'This token amount exceeds the customer reserved offline balance.' };
  if (reason === 'merchant_not_supported') return { title: 'Merchant not supported', text: 'This merchant cannot accept offline QR payments.' };
  return { title: 'Verification failed', text: 'The offline payment token could not be verified.' };
}

export default function MerchantAcceptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tokenId?: string;
    merchantId?: string;
    errorReason?: string;
    payload?: string;
  }>();
  const [token, setToken] = useState<OfflineToken | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchant, setMerchant] = useState<PaymentMerchant | null>(null);
  const [accepted, setAccepted] = useState<MerchantAcceptResult | null>(null);
  const [selectedDeepLinkMerchantId, setSelectedDeepLinkMerchantId] = useState<string | null>(
    firstParam(params.merchantId) ?? null,
  );
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const deepLinkPayload = decodePayloadParam(params.payload);
  const paramMerchantId = firstParam(params.merchantId);
  const activeMerchantId = selectedDeepLinkMerchantId ?? paramMerchantId ?? null;

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setVerificationError(null);

      if (deepLinkPayload) {
        if (!activeMerchantId) {
          setToken(null);
          setTransaction(null);
          setMerchant(null);
          return;
        }

        const nextMerchant =
          getOfflineMerchants().find((item) => item.id === activeMerchantId) ?? null;
        setMerchant(nextMerchant);

        if (!nextMerchant) {
          setToken(null);
          setTransaction(null);
          setVerificationError('merchant_not_supported');
          return;
        }

        const offlinePayload = extractOfflinePayload(deepLinkPayload);
        if (!offlinePayload) {
          setToken(null);
          setTransaction(null);
          setVerificationError('invalid_payload');
          return;
        }

        const verification = await merchantScanOfflineQR(
          offlinePayload,
          nextMerchant.id,
        );
        const [tokens, transactions] = await Promise.all([
          getOfflineTokens(),
          getTransactions(),
        ]);
        const nextToken =
          verification.token ??
          tokens.find((item) => item.id === verification.tokenId) ??
          null;
        const nextTx = nextToken
          ? transactions.find((item) => item.id === nextToken.transactionId) ?? null
          : null;

        setToken(nextToken);
        setTransaction(nextTx);
        setMerchant(nextMerchant);
        setVerificationError(verification.ok ? null : verification.reason ?? 'unknown');
        return;
      }

      const [tokens, transactions] = await Promise.all([
        getOfflineTokens(),
        getTransactions(),
      ]);
      const nextToken =
        tokens.find((item) => item.id === firstParam(params.tokenId)) ?? null;
      const nextMerchant =
        getOfflineMerchants().find((item) => item.id === activeMerchantId) ?? null;
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
  }, [activeMerchantId, deepLinkPayload, params.tokenId]);

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

  async function syncFromSuccess() {
    try {
      const result = await syncOfflinePayments();
      Alert.alert(
        'Payment synced',
        result.syncedCount > 0
          ? `Settlement completed in demo mode.\n\nSynced amount: ${formatKgs(result.syncedAmount)}`
          : 'No accepted offline payments are waiting for sync.',
      );
      router.replace('/merchant/dashboard');
    } catch (err) {
      Alert.alert(
        'Sync failed',
        err instanceof Error ? err.message : 'Could not sync offline payments.',
      );
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

  if (deepLinkPayload && !activeMerchantId) {
    return (
      <MerchantSelectorScreen
        merchants={getOfflineMerchants()}
        onSelect={(merchantId) => {
          setVerificationError(null);
          setLoading(true);
          setSelectedDeepLinkMerchantId(merchantId);
        }}
        onBack={() => router.replace('/merchant/dashboard')}
      />
    );
  }

  const routeErrorReason = firstParam(params.errorReason);
  if (routeErrorReason) {
    return (
      <VerificationErrorScreen
        reason={routeErrorReason}
        token={token}
        transaction={transaction}
        merchant={merchant}
        onBack={() => router.replace('/merchant/dashboard')}
      />
    );
  }

  if (verificationError) {
    return (
      <VerificationErrorScreen
        reason={verificationError}
        token={token}
        transaction={transaction}
        merchant={merchant}
        onBack={() => router.replace('/merchant/dashboard')}
      />
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
            <Detail label="Token ID" value={shortenId(accepted.token.id)} />
            <Detail label="Accepted at" value={formatTime(accepted.transaction.acceptedAt)} />
          </View>

          <View style={{ gap: 10, marginTop: 18 }}>
            <Button
              label="Back to Merchant Mode"
              onPress={() => router.replace('/merchant/dashboard')}
            />
            <Button
              variant="secondary"
              label="Sync payments"
              onPress={syncFromSuccess}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const notExpired = Date.now() < new Date(token.expiresAt).getTime();
  const acceptDisabledReason = !notExpired ? 'Token expired.' : null;
  const canAccept = !acceptDisabledReason && token.status === 'created';

  if (token.status !== 'created') {
    return (
      <VerificationErrorScreen
        reason={token.status === 'synced' ? 'already_used' : token.status === 'expired' ? 'expired' : 'already_used'}
        token={token}
        transaction={transaction}
        merchant={merchant}
        onBack={() => router.replace('/merchant/dashboard')}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title="Offline payment request" onBack={() => goBackOrReplace(router, '/merchant/dashboard')} />

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
          <Detail label="Signature" value="Verified" />
          <Detail label="Reserve-backed token" value="Yes" />
          <Detail label="One-time token" value="Yes" />
          <Detail label="Not expired" value={notExpired ? 'Yes' : 'No'} />
          <Detail label="Risk" value="Low" />
          <Detail label="Token ID" value={shortenId(token.id)} />
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
            settled by a licensed banking partner. External phone camera opens
            a Tabylga deep link; real cross-device verification would require a
            backend or bank partner infrastructure.
          </Text>
        </View>

        {acceptDisabledReason ? (
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: colors.status.error,
              marginBottom: 10,
            }}
          >
            {acceptDisabledReason}
          </Text>
        ) : null}

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

function MerchantSelectorScreen({
  merchants,
  onSelect,
  onBack,
}: {
  merchants: PaymentMerchant[];
  onSelect: (merchantId: string) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title="Select merchant profile" onBack={onBack} />
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
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 26,
              lineHeight: 31,
              color: colors.text.primary,
            }}
          >
            Choose who is accepting this payment
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 20,
              color: colors.text.secondary,
              marginTop: 8,
            }}
          >
            The phone camera opened a Tabylga payment link. Select a merchant
            profile to verify the KICB Demo token.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {merchants.map((merchant) => (
            <Pressable
              key={merchant.id}
              onPress={() => onSelect(merchant.id)}
              accessibilityRole="button"
              style={({ pressed }) => [
                {
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.surface.card,
                  borderWidth: 1,
                  borderColor: colors.border.divider,
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
                    backgroundColor: colors.status.warningLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Store size={20} color={colors.brand.primary} strokeWidth={1.8} />
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
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 11,
                  color: colors.brand.primary,
                  marginTop: 10,
                }}
              >
                Offline QR supported
                {merchant.bluetoothDemoSupported ? ' - Bluetooth demo supported' : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.status.warningLight,
            borderWidth: 1,
            borderColor: colors.border.divider,
            marginTop: 18,
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
            Prototype note
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              lineHeight: 19,
              color: colors.text.secondary,
            }}
          >
            External phone camera opens a Tabylga deep link. Real cross-device
            verification would require a backend or bank partner infrastructure.
            This demo stores offline tokens locally.
          </Text>
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

function VerificationErrorScreen({
  reason,
  token,
  transaction,
  merchant,
  onBack,
}: {
  reason: string | undefined;
  token: OfflineToken | null;
  transaction: Transaction | null;
  merchant: PaymentMerchant | null;
  onBack: () => void;
}) {
  const copy = errorCopy(reason, token);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title={copy.title} onBack={onBack} />
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View
          style={[
            {
              padding: 20,
              borderRadius: 22,
              backgroundColor: colors.surface.card,
              alignItems: 'center',
            },
            shadows.card,
          ]}
        >
          <XCircle size={52} color={colors.status.error} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 27,
              lineHeight: 32,
              color: colors.text.primary,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            {copy.title}
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
            {copy.text}
          </Text>
        </View>

        <View style={[stylesCard, shadows.card, { marginTop: 16 }]}>
          <Detail label="Token ID" value={token ? shortenId(token.id) : 'Unknown'} />
          <Detail label="Current status" value={token?.status ?? 'unknown'} />
          <Detail label="Merchant" value={token?.merchantName ?? merchant?.name ?? 'Unknown'} />
          <Detail label="Accepted at" value={formatTime(transaction?.acceptedAt ?? null)} />
        </View>

        <Button
          label="Back to Merchant Mode"
          onPress={onBack}
          style={{ marginTop: 18 }}
        />
      </View>
    </SafeAreaView>
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
