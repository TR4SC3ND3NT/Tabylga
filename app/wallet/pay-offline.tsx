import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  Send,
  Bluetooth,
  Store,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import {
  createOfflineCustomerQRPayment,
  getWallet,
  type OfflineToken,
  type Transaction,
  type Wallet,
} from '../../lib/payments/paymentService';
import { PAYMENT_STRINGS, formatKgs } from '../../lib/payments/paymentStrings';

const PRESET_AMOUNTS = [500, 1000, 2000];

type Stage = 'form' | 'loading' | 'qr_ready';

function formatExpiresAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function shortenId(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export default function PayOfflineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [resultToken, setResultToken] = useState<OfflineToken | null>(null);
  const [resultWallet, setResultWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = await getWallet();
        if (!active) return;
        setWallet(w);
        if (w.offlineReserve >= 1000) {
          setPresetAmount(1000);
        } else if (w.offlineReserve > 0) {
          const fits = [...PRESET_AMOUNTS]
            .reverse()
            .find((a) => a <= w.offlineReserve);
          if (fits) setPresetAmount(fits);
          else setCustomMode(true);
        } else {
          setCustomMode(false);
        }
      } catch (err) {
        console.warn('[pay-offline] failed to load wallet', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const noReserve = wallet ? wallet.offlineReserve <= 0 : false;

  const effectiveAmount: number | null = customMode
    ? customText.trim() === ''
      ? null
      : Number(customText.replace(/[^0-9.]/g, ''))
    : presetAmount;

  const isValidAmount =
    effectiveAmount !== null &&
    Number.isFinite(effectiveAmount) &&
    effectiveAmount > 0;

  const exceedsReserve = useMemo(() => {
    if (!wallet || !isValidAmount || effectiveAmount === null) return false;
    return effectiveAmount > wallet.offlineReserve;
  }, [wallet, isValidAmount, effectiveAmount]);

  const canGenerate = !noReserve && isValidAmount && !exceedsReserve;

  function handlePickPreset(amount: number) {
    setError(null);
    setCustomMode(false);
    setPresetAmount(amount);
  }

  function handlePickCustom() {
    setError(null);
    setCustomMode(true);
    setPresetAmount(null);
  }

  async function handleGenerate() {
    if (!wallet) return;
    if (noReserve) return;
    if (!isValidAmount || effectiveAmount === null) {
      setError(PAYMENT_STRINGS.payOfflineAmountInvalid);
      return;
    }
    if (exceedsReserve) {
      setError(PAYMENT_STRINGS.payOfflineExceeds);
      return;
    }
    setError(null);
    setStage('loading');
    try {
      const result = await createOfflineCustomerQRPayment(effectiveAmount);
      setResultTx(result.transaction);
      setResultToken(result.token);
      setResultWallet(result.wallet);
      setStage('qr_ready');
    } catch (err) {
      setStage('form');
      setError(err instanceof Error ? err.message : 'Failed to generate QR.');
    }
  }

  if (stage === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 15,
            color: colors.text.secondary,
            marginTop: 16,
          }}
        >
          {PAYMENT_STRINGS.payOfflineProcessing}
        </Text>
      </SafeAreaView>
    );
  }

  if (stage === 'qr_ready' && resultTx && resultToken && resultWallet) {
    return (
      <QrReadyView
        transaction={resultTx}
        token={resultToken}
        onOpenMerchantMode={() => router.push('/merchant/dashboard')}
        onSendBluetooth={() =>
          router.push({
            pathname: '/wallet/bluetooth',
            params: { tokenId: resultToken.id },
          } as never)
        }
        onBack={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Header */}
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
          onPress={() => router.back()}
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
            fontFamily: 'Inter_600SemiBold',
            fontSize: 17,
            color: colors.text.primary,
            flex: 1,
            textAlign: 'center',
            marginRight: 44,
          }}
        >
          {PAYMENT_STRINGS.payOfflineTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            lineHeight: 19,
            color: colors.text.secondary,
            marginBottom: 18,
          }}
        >
          {PAYMENT_STRINGS.payOfflineSubtitle}
        </Text>

        {/* Status snapshot */}
        {wallet && (
          <View style={{ marginBottom: 20 }}>
            <SectionLabel>{PAYMENT_STRINGS.payOfflineStatusLabel}</SectionLabel>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <BalanceMini
                label={PAYMENT_STRINGS.offlineReserve}
                value={wallet.offlineReserve}
                accent={colors.brand.primary}
                emphasized
              />
              <BalanceMini
                label={PAYMENT_STRINGS.lockedOffline}
                value={wallet.lockedOffline}
                accent="#C65D3A"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BalanceMini
                label={PAYMENT_STRINGS.pendingSync}
                value={wallet.pendingSync}
                accent={colors.status.warning}
              />
              <BalanceMini
                label={PAYMENT_STRINGS.availableOnline}
                value={wallet.availableOnline}
                accent={colors.status.success}
                muted
              />
            </View>
          </View>
        )}

        {/* No reserve guard */}
        {noReserve && (
          <Card
            style={{
              padding: 16,
              backgroundColor: colors.status.warningLight,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <AlertTriangle size={18} color="#8a6530" strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: colors.text.primary,
                }}
              >
                {PAYMENT_STRINGS.payOfflineNoReserveTitle}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                lineHeight: 18,
                color: colors.text.secondary,
                marginBottom: 12,
              }}
            >
              {PAYMENT_STRINGS.payOfflineNoReserveBody}
            </Text>
            <Button
              variant="primary"
              label={PAYMENT_STRINGS.payOfflineGoActivate}
              onPress={() => router.push('/wallet/activate-offline')}
              icon={<ShieldCheck size={18} color="#fff" strokeWidth={2} />}
              accessibilityLabel={PAYMENT_STRINGS.payOfflineGoActivate}
            />
          </Card>
        )}

        {/* Amount chips */}
        <SectionLabel>{PAYMENT_STRINGS.payOfflineAmountLabel}</SectionLabel>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 12,
          }}
        >
          {PRESET_AMOUNTS.map((a) => {
            const sel = !customMode && presetAmount === a;
            const disabled =
              noReserve || (wallet ? a > wallet.offlineReserve : false);
            return (
              <Pressable
                key={a}
                disabled={disabled}
                onPress={() => handlePickPreset(a)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel, disabled }}
                accessibilityLabel={`${a} KGS`}
                style={({ pressed }) => ({
                  height: 48,
                  paddingHorizontal: 18,
                  borderRadius: 12,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.brand.primary : colors.border.divider,
                  backgroundColor: sel
                    ? colors.brand.primaryLight
                    : colors.surface.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 15,
                    color: sel ? colors.brand.primary : colors.text.primary,
                  }}
                >
                  {a.toLocaleString('en-US')} KGS
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            disabled={noReserve}
            onPress={handlePickCustom}
            accessibilityRole="radio"
            accessibilityState={{ selected: customMode, disabled: noReserve }}
            accessibilityLabel={PAYMENT_STRINGS.topUpCustomChip}
            style={({ pressed }) => ({
              height: 48,
              paddingHorizontal: 18,
              borderRadius: 12,
              borderWidth: customMode ? 2 : 1,
              borderColor: customMode ? colors.brand.primary : colors.border.divider,
              backgroundColor: customMode
                ? colors.brand.primaryLight
                : colors.surface.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: noReserve ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15,
                color: customMode ? colors.brand.primary : colors.text.primary,
              }}
            >
              {PAYMENT_STRINGS.topUpCustomChip}
            </Text>
          </Pressable>
        </View>

        {customMode && (
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={customText}
              onChangeText={(t) => {
                setError(null);
                setCustomText(t.replace(/[^0-9]/g, ''));
              }}
              placeholder="2500"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              accessibilityLabel={PAYMENT_STRINGS.payOfflineAmountLabel}
              editable={!noReserve}
              style={{
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: exceedsReserve
                  ? colors.status.error
                  : colors.border.input,
                backgroundColor: colors.surface.card,
                paddingHorizontal: 16,
                fontFamily: 'Inter_500Medium',
                fontSize: 16,
                color: colors.text.primary,
              }}
            />
          </View>
        )}

        {(error || (exceedsReserve && !error)) && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: colors.status.error,
              marginBottom: 12,
            }}
          >
            {error ?? PAYMENT_STRINGS.payOfflineExceeds}
          </Text>
        )}

        {/* Cancellation warning */}
        <Card
          style={{
            padding: 16,
            backgroundColor: colors.status.warningLight,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <AlertTriangle size={18} color="#8a6530" strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 14,
                color: colors.text.primary,
              }}
            >
              {PAYMENT_STRINGS.payOfflineWarningTitle}
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
            {PAYMENT_STRINGS.payOfflineWarningBody}
          </Text>
        </Card>

        {/* Trust note */}
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.brand.primaryLight,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} color={colors.brand.primary} strokeWidth={2} />
            <Text
              style={{
                flex: 1,
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                lineHeight: 18,
                color: colors.text.primary,
              }}
            >
              {PAYMENT_STRINGS.payOfflineTrustBody}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.divider,
        }}
      >
        <Button
          variant="cta"
          label={PAYMENT_STRINGS.payOfflineGenerate(
            isValidAmount && effectiveAmount !== null
              ? effectiveAmount.toLocaleString('en-US')
              : '0',
          )}
          onPress={handleGenerate}
          disabled={!canGenerate}
          icon={<Send size={18} color="#fff" strokeWidth={2} />}
          accessibilityLabel={PAYMENT_STRINGS.payOfflineGenerate(
            isValidAmount && effectiveAmount !== null
              ? effectiveAmount.toLocaleString('en-US')
              : '0',
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function QrReadyView({
  transaction,
  token,
  onOpenMerchantMode,
  onSendBluetooth,
  onBack,
}: {
  transaction: Transaction;
  token: OfflineToken;
  onOpenMerchantMode: () => void;
  onSendBluetooth: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

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
            fontFamily: 'Inter_600SemiBold',
            fontSize: 17,
            color: colors.text.primary,
            flex: 1,
            textAlign: 'center',
            marginRight: 44,
          }}
        >
          {PAYMENT_STRINGS.qrReadyTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount header */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              letterSpacing: 0.12 * 12,
              textTransform: 'uppercase',
              color: colors.text.tertiary,
              marginBottom: 4,
            }}
          >
            {PAYMENT_STRINGS.qrLabelAmount}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 38,
              color: colors.text.primary,
            }}
          >
            {formatKgs(token.amount)}
          </Text>
          <View style={{ marginTop: 10 }}>
            <Pill
              label={PAYMENT_STRINGS.qrStatusWaiting}
              variant="offline"
              icon={<Clock size={12} color="#1A1A1A" strokeWidth={2} />}
              showDot
            />
          </View>
        </View>

        {/* QR card */}
        <View
          style={[
            {
              backgroundColor: '#fff',
              padding: 22,
              borderRadius: 22,
              alignItems: 'center',
              marginBottom: 18,
              borderWidth: 2,
              borderColor: colors.brand.primary,
            },
            shadows.cardElevated,
          ]}
        >
          <View
            style={{
              padding: 14,
              backgroundColor: '#fff',
              borderRadius: 16,
            }}
          >
            <QRCode
              value={token.qrPayload}
              size={210}
              color="#1A1A1A"
              backgroundColor="#fff"
              ecl="M"
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
            }}
          >
            <ShieldCheck size={16} color={colors.brand.primary} strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 13,
                letterSpacing: 0.08 * 13,
                color: colors.brand.primary,
                textTransform: 'uppercase',
              }}
            >
              {PAYMENT_STRINGS.qrPlaceholder}
            </Text>
          </View>
        </View>

        {/* Token details */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelAmount}
            value={formatKgs(token.amount)}
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelCurrency}
            value={token.currency}
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelIssuer}
            value={PAYMENT_STRINGS.qrIssuerKicbDemo}
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelSignature}
            value={PAYMENT_STRINGS.qrSignatureReady}
            valueColor={colors.status.success}
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelStatus}
            value={PAYMENT_STRINGS.qrStatusWaiting}
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelTokenId}
            value={shortenId(token.id)}
            mono
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelTransactionId}
            value={shortenId(transaction.id)}
            mono
          />
          <DetailRow
            label={PAYMENT_STRINGS.qrLabelExpiresAt}
            value={formatExpiresAt(token.expiresAt)}
          />
          <DetailRow
            label={PAYMENT_STRINGS.receiptCode}
            value={transaction.receiptCode}
            mono
            isLast
          />
        </Card>

        {/* Payload preview */}
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#F4F1EA',
            borderWidth: 1,
            borderColor: colors.border.divider,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 11,
              color: colors.text.tertiary,
              letterSpacing: 0.08 * 11,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {PAYMENT_STRINGS.qrPayloadPreviewLabel}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 11,
              lineHeight: 16,
              color: colors.text.secondary,
            }}
          >
            tokenId: {shortenId(token.id)}{'\n'}
            amount: {token.amount} {token.currency}{'\n'}
            issuer: {token.issuer}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ gap: 10 }}>
          <Button
            variant="primary"
            label={PAYMENT_STRINGS.qrOpenMerchantMode}
            onPress={onOpenMerchantMode}
            icon={<Store size={18} color="#fff" strokeWidth={2} />}
            accessibilityLabel={PAYMENT_STRINGS.qrOpenMerchantMode}
          />
          <Button
            variant="secondary"
            label={PAYMENT_STRINGS.qrSendBluetooth}
            onPress={onSendBluetooth}
            icon={
              <Bluetooth size={18} color={colors.brand.primary} strokeWidth={2} />
            }
            accessibilityLabel={PAYMENT_STRINGS.qrSendBluetooth}
          />
          <Button
            variant="ghost"
            label={PAYMENT_STRINGS.backToWallet}
            onPress={onBack}
            accessibilityLabel={PAYMENT_STRINGS.backToWallet}
            style={{ borderWidth: 1.5, borderColor: colors.border.divider }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: 10,
        letterSpacing: 0.08 * 13,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

function BalanceMini({
  label,
  value,
  accent,
  emphasized = false,
  muted = false,
}: {
  label: string;
  value: number;
  accent: string;
  emphasized?: boolean;
  muted?: boolean;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          padding: 12,
          borderRadius: 14,
          backgroundColor: emphasized ? colors.brand.primaryLight : colors.surface.card,
          borderLeftWidth: 3,
          borderLeftColor: accent,
          opacity: muted ? 0.7 : 1,
        },
        shadows.card,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          color: colors.text.tertiary,
          letterSpacing: 0.08 * 11,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 16,
          color: colors.text.primary,
        }}
        numberOfLines={1}
      >
        {formatKgs(value)}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
  mono = false,
  isLast = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 9,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.divider,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: colors.text.tertiary,
          letterSpacing: 0.08 * 12,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: mono ? 'Inter_500Medium' : 'Inter_600SemiBold',
          fontSize: 13,
          color: valueColor ?? colors.text.primary,
          maxWidth: '60%',
          textAlign: 'right',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
