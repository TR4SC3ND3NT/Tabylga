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
import { ArrowLeft, Bluetooth, Check, QrCode, ShieldCheck, Star, Store } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { shadows } from '../../constants/shadows';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import {
  getOnlineQRMerchants,
  getWallet,
  payOnlineQR,
  type Transaction,
  type Wallet,
} from '../../lib/payments/paymentService';
import { type PaymentMerchant } from '../../lib/data/paymentMerchants';
import { PAYMENT_STRINGS, formatKgs } from '../../lib/payments/paymentStrings';

type Stage = 'form' | 'loading' | 'success';

export default function PayOnlineQRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const merchants = useMemo<PaymentMerchant[]>(() => getOnlineQRMerchants(), []);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    merchants[0]?.id ?? null,
  );
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [resultMerchant, setResultMerchant] = useState<PaymentMerchant | null>(
    null,
  );
  const [resultWallet, setResultWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = await getWallet();
        if (active) setWallet(w);
      } catch (err) {
        console.warn('[pay] failed to load wallet', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const amount = amountText.trim() === '' ? null : Number(amountText);
  const isAmountValid =
    amount !== null && Number.isFinite(amount) && amount > 0;
  const exceedsBalance =
    isAmountValid && wallet ? (amount as number) > wallet.availableOnline : false;
  const canConfirm =
    isAmountValid && !exceedsBalance && selectedMerchantId !== null;

  async function handleConfirm() {
    if (!selectedMerchantId) {
      setError(PAYMENT_STRINGS.payNoMerchant);
      return;
    }
    if (!isAmountValid || amount === null) {
      setError(PAYMENT_STRINGS.topUpInvalidAmount);
      return;
    }
    if (exceedsBalance) {
      setError(PAYMENT_STRINGS.payInsufficient);
      return;
    }
    setError(null);
    setStage('loading');
    try {
      const result = await payOnlineQR({
        merchantId: selectedMerchantId,
        amount,
      });
      setResultTx(result.transaction);
      setResultMerchant(result.merchant);
      setResultWallet(result.wallet);
      setStage('success');
    } catch (err) {
      setStage('form');
      setError(err instanceof Error ? err.message : 'Payment failed.');
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
          {PAYMENT_STRINGS.payProcessing}
        </Text>
      </SafeAreaView>
    );
  }

  if (stage === 'success' && resultTx && resultMerchant && resultWallet) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
            flexGrow: 1,
            justifyContent: 'center',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.status.successLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Check size={40} color={colors.status.success} strokeWidth={2.5} />
            </View>
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 24,
                color: colors.text.primary,
                marginBottom: 4,
              }}
            >
              {PAYMENT_STRINGS.paySuccessTitle}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 32,
                color: colors.text.primary,
              }}
            >
              − {formatKgs(resultTx.amount)}
            </Text>
          </View>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptCode}
              value={resultTx.receiptCode}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptMerchant}
              value={resultMerchant.name}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptMethod}
              value="Online QR"
            />
            <ReceiptRow
              label="Provider"
              value={resultMerchant.providerLabel}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptStatus}
              value={PAYMENT_STRINGS.statusLabels[resultTx.status]}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.availableOnline}
              value={formatKgs(resultWallet.availableOnline)}
              isLast
            />
          </Card>

          <Button
            variant="primary"
            label={PAYMENT_STRINGS.backToWallet}
            onPress={() => goBackOrReplace(router, '/(tabs)/wallet')}
            accessibilityLabel={PAYMENT_STRINGS.backToWallet}
          />
        </ScrollView>
      </SafeAreaView>
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
          {PAYMENT_STRINGS.payTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available online balance */}
        {wallet && (
          <View
            style={[
              {
                padding: 14,
                borderRadius: 14,
                backgroundColor: colors.surface.card,
                borderLeftWidth: 3,
                borderLeftColor: colors.status.success,
                marginBottom: 16,
              },
              shadows.card,
            ]}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 11,
                color: colors.text.tertiary,
                letterSpacing: 0,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {PAYMENT_STRINGS.availableOnline}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 22,
                color: colors.text.primary,
              }}
            >
              {formatKgs(wallet.availableOnline)}
            </Text>
          </View>
        )}

        <Card
          style={{
            padding: 16,
            backgroundColor: colors.brand.primaryLight,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Store size={20} color={colors.brand.primary} strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 15,
                color: colors.text.primary,
              }}
            >
              Provider-agnostic payment layer
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              lineHeight: 19,
              color: colors.text.secondary,
              marginBottom: 12,
            }}
          >
            Tabylga uses a provider-agnostic payment layer, so wallet flows can
            work with KICB, MBANK/MTravel or other local payment providers while
            keeping the same QR experience for travelers.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            <ProviderChip label="KICB-ready" />
            <ProviderChip label="MBANK / MTravel" />
            <ProviderChip label="Online QR" />
            <ProviderChip label="Nearby device" icon="bluetooth" />
          </View>
        </Card>

        {/* Mock scanner */}
        <View
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: 18,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            minHeight: 180,
          }}
        >
          <View style={{ width: 120, height: 120, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            {[
              { top: 0, left: 0 },
              { top: 0, right: 0 },
              { bottom: 0, left: 0 },
              { bottom: 0, right: 0 },
            ].map((pos, i) => (
              <View key={i} style={{ position: 'absolute', width: 28, height: 28, ...pos }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 28,
                    height: 3,
                    backgroundColor: colors.brand.cta,
                    borderRadius: 2,
                    ...(pos.right !== undefined ? { right: 0, left: undefined } : {}),
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 3,
                    height: 28,
                    backgroundColor: colors.brand.cta,
                    borderRadius: 2,
                    ...(pos.right !== undefined ? { right: 0, left: undefined } : {}),
                    ...(pos.bottom !== undefined ? { bottom: 0, top: undefined } : {}),
                  }}
                />
              </View>
            ))}
            <QrCode size={56} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: 'rgba(255,255,255,0.78)',
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            {PAYMENT_STRINGS.payScannerHint}
          </Text>
        </View>

        {/* Merchant selector */}
        <SectionLabel>{PAYMENT_STRINGS.payMerchantLabel}</SectionLabel>
        <View style={{ gap: 10, marginBottom: 16 }}>
          {merchants.map((m) => {
            const sel = selectedMerchantId === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  setError(null);
                  setSelectedMerchantId(m.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={m.name}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.brand.primary : colors.border.divider,
                  backgroundColor: sel ? colors.brand.primaryLight : colors.surface.card,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: sel ? 0 : 1.5,
                    borderColor: colors.border.input,
                    backgroundColor: sel ? colors.brand.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {sel && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#fff',
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 14,
                      color: sel ? colors.brand.primary : colors.text.primary,
                    }}
                    numberOfLines={1}
                  >
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      color: colors.text.secondary,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {m.region} - {m.type}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <ProviderChip label={m.providerLabel} />
                    {m.onlineQrSupported ? <CapabilityChip label="Online QR" icon="qr" /> : null}
                    {m.offlineQrSupported ? <CapabilityChip label="Offline QR" icon="shield" /> : null}
                    {m.bluetoothDemoSupported ? <CapabilityChip label="Nearby device" icon="bluetooth" /> : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star
                    size={13}
                    color={colors.status.warning}
                    strokeWidth={0}
                    fill={colors.status.warning}
                  />
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 12,
                      color: colors.text.primary,
                    }}
                  >
                    {m.rating.toFixed(1)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Amount */}
        <SectionLabel>{PAYMENT_STRINGS.payAmountLabel}</SectionLabel>
        <TextInput
          value={amountText}
          onChangeText={(t) => {
            setError(null);
            setAmountText(t.replace(/[^0-9]/g, ''));
          }}
          placeholder={PAYMENT_STRINGS.payAmountPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="number-pad"
          accessibilityLabel={PAYMENT_STRINGS.payAmountLabel}
          style={{
            height: 56,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: exceedsBalance ? colors.status.error : colors.border.input,
            backgroundColor: colors.surface.card,
            paddingHorizontal: 16,
            fontFamily: 'Inter_600SemiBold',
            fontSize: 18,
            color: colors.text.primary,
          }}
        />

        {error && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: colors.status.error,
              marginTop: 12,
            }}
          >
            {error}
          </Text>
        )}
        {!error && exceedsBalance && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: colors.status.error,
              marginTop: 12,
            }}
          >
            {PAYMENT_STRINGS.payInsufficient}
          </Text>
        )}
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
          label={PAYMENT_STRINGS.payConfirm(
            isAmountValid && amount !== null
              ? amount.toLocaleString('en-US')
              : '0',
          )}
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityLabel={PAYMENT_STRINGS.payConfirm(
            isAmountValid && amount !== null
              ? amount.toLocaleString('en-US')
              : '0',
          )}
        />
      </View>
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
        letterSpacing: 0,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

function ProviderChip({ label, icon }: { label: string; icon?: 'bluetooth' }) {
  return (
    <View
      style={{
        minHeight: 26,
        paddingHorizontal: 9,
        borderRadius: 999,
        backgroundColor: colors.surface.card,
        borderWidth: 1,
        borderColor: colors.border.divider,
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

function CapabilityChip({
  label,
  icon,
}: {
  label: string;
  icon: 'qr' | 'shield' | 'bluetooth';
}) {
  const Icon = icon === 'qr' ? QrCode : icon === 'shield' ? ShieldCheck : Bluetooth;
  return (
    <View
      style={{
        minHeight: 24,
        paddingHorizontal: 8,
        borderRadius: 999,
        backgroundColor: colors.status.warningLight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <Icon size={11} color={colors.brand.cta} strokeWidth={2} />
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 10,
          color: colors.brand.cta,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ReceiptRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.divider,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: colors.text.tertiary,
          letterSpacing: 0,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          color: colors.text.primary,
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
