import { useEffect, useState } from 'react';
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
import { ArrowLeft, Check, CreditCard, QrCode } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { shadows } from '../../constants/shadows';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import {
  getWallet,
  topUpWallet,
  type Transaction,
  type Wallet,
} from '../../lib/payments/paymentService';
import { PAYMENT_STRINGS, formatKgs } from '../../lib/payments/paymentStrings';

const PRESET_AMOUNTS = [500, 1000, 3000, 5000];

type Stage = 'form' | 'loading' | 'success';
type Method = 'card_demo' | 'online_qr_demo';

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  // Amount selection
  const [presetAmount, setPresetAmount] = useState<number | null>(1000);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  // Method
  const [method, setMethod] = useState<Method>('card_demo');

  // Card form (visual only)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Validation + result
  const [error, setError] = useState<string | null>(null);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [resultWallet, setResultWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = await getWallet();
        if (active) setWallet(w);
      } catch (err) {
        console.warn('[topup] failed to load wallet', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const effectiveAmount: number | null = customMode
    ? customText.trim() === ''
      ? null
      : Number(customText.replace(/[^0-9.]/g, ''))
    : presetAmount;

  const isValidAmount =
    effectiveAmount !== null &&
    Number.isFinite(effectiveAmount) &&
    effectiveAmount > 0;

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

  async function handleConfirm() {
    if (!isValidAmount || effectiveAmount === null) {
      setError(PAYMENT_STRINGS.topUpInvalidAmount);
      return;
    }
    setError(null);
    setStage('loading');
    try {
      const result = await topUpWallet(effectiveAmount, method);
      setResultTx(result.transaction);
      setResultWallet(result.wallet);
      setStage('success');
    } catch (err) {
      setStage('form');
      setError(err instanceof Error ? err.message : 'Top up failed.');
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
          {PAYMENT_STRINGS.topUpProcessing}
        </Text>
      </SafeAreaView>
    );
  }

  if (stage === 'success' && resultTx && resultWallet) {
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
              {PAYMENT_STRINGS.topUpSuccessTitle}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 32,
                color: colors.brand.primary,
              }}
            >
              + {formatKgs(resultTx.amount)}
            </Text>
          </View>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptCode}
              value={resultTx.receiptCode}
              mono
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptMethod}
              value={
                resultTx.method === 'card_demo'
                  ? PAYMENT_STRINGS.topUpMethodCard
                  : PAYMENT_STRINGS.topUpMethodLocalQr
              }
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptStatus}
              value={PAYMENT_STRINGS.statusLabels[resultTx.status]}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.totalBalance}
              value={formatKgs(resultWallet.totalBalance)}
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
          {PAYMENT_STRINGS.topUpTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current balance */}
        {wallet && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <BalanceMini
              label={PAYMENT_STRINGS.totalBalance}
              value={wallet.totalBalance}
              accent={colors.brand.primary}
            />
            <BalanceMini
              label={PAYMENT_STRINGS.availableOnline}
              value={wallet.availableOnline}
              accent={colors.status.success}
            />
          </View>
        )}

        {/* Amount chips */}
        <SectionLabel>{PAYMENT_STRINGS.topUpAmountLabel}</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {PRESET_AMOUNTS.map((a) => {
            const sel = !customMode && presetAmount === a;
            return (
              <Pressable
                key={a}
                onPress={() => handlePickPreset(a)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${a} KGS`}
                style={({ pressed }) => ({
                  height: 48,
                  paddingHorizontal: 18,
                  borderRadius: 12,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.brand.primary : colors.border.divider,
                  backgroundColor: sel ? colors.brand.primaryLight : colors.surface.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
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
            onPress={handlePickCustom}
            accessibilityRole="radio"
            accessibilityState={{ selected: customMode }}
            accessibilityLabel={PAYMENT_STRINGS.topUpCustomChip}
            style={({ pressed }) => ({
              height: 48,
              paddingHorizontal: 18,
              borderRadius: 12,
              borderWidth: customMode ? 2 : 1,
              borderColor: customMode ? colors.brand.primary : colors.border.divider,
              backgroundColor: customMode ? colors.brand.primaryLight : colors.surface.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
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
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: colors.text.secondary,
                marginBottom: 6,
              }}
            >
              {PAYMENT_STRINGS.topUpCustomLabel}
            </Text>
            <TextInput
              value={customText}
              onChangeText={(t) => {
                setError(null);
                setCustomText(t.replace(/[^0-9]/g, ''));
              }}
              placeholder="2500"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              accessibilityLabel={PAYMENT_STRINGS.topUpCustomLabel}
              style={{
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border.input,
                backgroundColor: colors.surface.card,
                paddingHorizontal: 16,
                fontFamily: 'Inter_500Medium',
                fontSize: 16,
                color: colors.text.primary,
              }}
            />
          </View>
        )}

        {/* Method */}
        <SectionLabel>{PAYMENT_STRINGS.topUpMethodLabel}</SectionLabel>

        <MethodOption
          selected={method === 'card_demo'}
          onPress={() => setMethod('card_demo')}
          icon={
            <CreditCard
              size={20}
              color={method === 'card_demo' ? colors.brand.primary : colors.text.secondary}
              strokeWidth={2}
            />
          }
          label={PAYMENT_STRINGS.topUpMethodCard}
          sub={PAYMENT_STRINGS.topUpMethodCardSub}
        />

        <MethodOption
          selected={method === 'online_qr_demo'}
          onPress={() => setMethod('online_qr_demo')}
          icon={
            <QrCode
              size={20}
              color={method === 'online_qr_demo' ? colors.brand.primary : colors.text.secondary}
              strokeWidth={2}
            />
          }
          label={PAYMENT_STRINGS.topUpMethodLocalQr}
          sub={PAYMENT_STRINGS.topUpMethodLocalQrSub}
        />

        {/* Card form (visual only) */}
        {method === 'card_demo' && (
          <View style={{ gap: 10, marginTop: 8, marginBottom: 8 }}>
            <TextInput
              value={formatCardNumber(cardNumber)}
              onChangeText={(t) => setCardNumber(t.replace(/\D/g, ''))}
              placeholder={PAYMENT_STRINGS.topUpCardNumber}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              maxLength={19}
              accessibilityLabel={PAYMENT_STRINGS.topUpCardNumber}
              style={{
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border.input,
                backgroundColor: colors.surface.card,
                paddingHorizontal: 16,
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                letterSpacing: 2,
                color: colors.text.primary,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                placeholder={PAYMENT_STRINGS.topUpCardExpiry}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={7}
                accessibilityLabel={PAYMENT_STRINGS.topUpCardExpiry}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border.input,
                  backgroundColor: colors.surface.card,
                  paddingHorizontal: 16,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 16,
                  color: colors.text.primary,
                }}
              />
              <TextInput
                value={cvc}
                onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                placeholder={PAYMENT_STRINGS.topUpCardCvc}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                accessibilityLabel={PAYMENT_STRINGS.topUpCardCvc}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border.input,
                  backgroundColor: colors.surface.card,
                  paddingHorizontal: 16,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 16,
                  color: colors.text.primary,
                }}
              />
            </View>
          </View>
        )}

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
          label={PAYMENT_STRINGS.topUpConfirm(
            isValidAmount && effectiveAmount !== null
              ? effectiveAmount.toLocaleString('en-US')
              : '0',
          )}
          onPress={handleConfirm}
          disabled={!isValidAmount}
          accessibilityLabel={PAYMENT_STRINGS.topUpConfirm(
            isValidAmount && effectiveAmount !== null
              ? effectiveAmount.toLocaleString('en-US')
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
          padding: 12,
          borderRadius: 14,
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

function MethodOption({
  selected,
  onPress,
  icon,
  label,
  sub,
}: {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 72,
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.brand.primary : colors.border.divider,
        backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: selected ? 0 : 1.5,
          borderColor: colors.border.input,
          backgroundColor: selected ? colors.brand.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
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
      {icon}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 15,
            color: selected ? colors.brand.primary : colors.text.primary,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: colors.text.secondary,
            marginTop: 2,
          }}
        >
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
  isLast = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
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
