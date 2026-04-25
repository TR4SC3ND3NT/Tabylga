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
  Check,
  Wifi,
  KeyRound,
  Mountain,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import {
  activateOfflineReserve,
  getWallet,
  type Transaction,
  type Wallet,
} from '../../lib/payments/paymentService';
import { PAYMENT_STRINGS, formatKgs } from '../../lib/payments/paymentStrings';

const PRESET_AMOUNTS = [500, 1000, 3000, 5000];

type Stage = 'form' | 'loading' | 'success';

export default function ActivateOfflineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stage, setStage] = useState<Stage>('form');

  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [resultWallet, setResultWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const w = await getWallet();
        if (!active) return;
        setWallet(w);
        // Pick a sensible default: 1000 if affordable, else the largest
        // preset that fits, else null (Custom).
        const preferred = PRESET_AMOUNTS.includes(1000) && w.availableOnline >= 1000
          ? 1000
          : [...PRESET_AMOUNTS]
              .reverse()
              .find((a) => a <= w.availableOnline) ?? null;
        if (preferred !== null) {
          setPresetAmount(preferred);
        } else {
          setCustomMode(true);
        }
      } catch (err) {
        console.warn('[activate-offline] failed to load wallet', err);
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

  const exceedsAvailable = useMemo(() => {
    if (!wallet || !isValidAmount || effectiveAmount === null) return false;
    return effectiveAmount > wallet.availableOnline;
  }, [wallet, isValidAmount, effectiveAmount]);

  const noBalance = wallet ? wallet.availableOnline <= 0 : false;
  const canConfirm = isValidAmount && !exceedsAvailable && !noBalance;

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
    if (!wallet) return;
    if (noBalance) {
      setError(PAYMENT_STRINGS.activateNeedTopUp);
      return;
    }
    if (!isValidAmount || effectiveAmount === null) {
      setError(PAYMENT_STRINGS.topUpInvalidAmount);
      return;
    }
    if (exceedsAvailable) {
      setError(PAYMENT_STRINGS.activateExceeds);
      return;
    }
    setError(null);
    setStage('loading');
    try {
      const result = await activateOfflineReserve(effectiveAmount);
      setResultTx(result.transaction);
      setResultWallet(result.wallet);
      setStage('success');
    } catch (err) {
      setStage('form');
      setError(err instanceof Error ? err.message : 'Activation failed.');
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
          {PAYMENT_STRINGS.activateProcessing}
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
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.brand.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <ShieldCheck size={44} color={colors.brand.primary} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 24,
                color: colors.text.primary,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              {PAYMENT_STRINGS.activateSuccessTitle}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 14,
              }}
            >
              {PAYMENT_STRINGS.activateSuccessSub}
            </Text>
            <Pill
              label={PAYMENT_STRINGS.activateStatusReady}
              variant="offline"
              showDot
            />
          </View>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <ReceiptRow
              label={PAYMENT_STRINGS.activateReservedAmount}
              value={formatKgs(resultTx.amount)}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.activateNewReserve}
              value={formatKgs(resultWallet.offlineReserve)}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.activateNewAvailable}
              value={formatKgs(resultWallet.availableOnline)}
            />
            <ReceiptRow
              label={PAYMENT_STRINGS.receiptCode}
              value={resultTx.receiptCode}
              isLast
            />
          </Card>

          <View style={{ gap: 10 }}>
            <Button
              variant="primary"
              label={PAYMENT_STRINGS.backToWallet}
              onPress={() => router.back()}
              accessibilityLabel={PAYMENT_STRINGS.backToWallet}
            />
            <Button
              variant="secondary"
              label={PAYMENT_STRINGS.activatePayLater}
              onPress={() => {
                router.replace('/wallet/pay-offline');
              }}
              accessibilityLabel={PAYMENT_STRINGS.activatePayLater}
            />
          </View>
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
          {PAYMENT_STRINGS.activateTitle}
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
          {PAYMENT_STRINGS.activateSubtitle}
        </Text>

        {/* Wallet snapshot — 4 small cards */}
        {wallet && (
          <View style={{ gap: 10, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BalanceMini
                label={PAYMENT_STRINGS.availableOnline}
                value={wallet.availableOnline}
                accent={colors.status.success}
              />
              <BalanceMini
                label={PAYMENT_STRINGS.offlineReserve}
                value={wallet.offlineReserve}
                accent={colors.brand.primary}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BalanceMini
                label={PAYMENT_STRINGS.lockedOffline}
                value={wallet.lockedOffline}
                accent="#C65D3A"
              />
              <BalanceMini
                label={PAYMENT_STRINGS.pendingSync}
                value={wallet.pendingSync}
                accent={colors.status.warning}
              />
            </View>
          </View>
        )}

        {/* Need top up first banner */}
        {noBalance && (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.status.warningLight,
              borderWidth: 1,
              borderColor: '#EBD6B4',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                lineHeight: 18,
                color: '#5a3a00',
              }}
            >
              {PAYMENT_STRINGS.activateNeedTopUp}
            </Text>
          </View>
        )}

        {/* Amount chips */}
        <SectionLabel>{PAYMENT_STRINGS.activateAmountLabel}</SectionLabel>
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
            const disabled = wallet ? a > wallet.availableOnline : false;
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
              backgroundColor: customMode
                ? colors.brand.primaryLight
                : colors.surface.card,
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
              {PAYMENT_STRINGS.activateCustomLabel}
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
              accessibilityLabel={PAYMENT_STRINGS.activateCustomLabel}
              style={{
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: exceedsAvailable
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

        {/* Inline errors */}
        {(error || (exceedsAvailable && !error)) && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: colors.status.error,
              marginBottom: 12,
            }}
          >
            {error ?? PAYMENT_STRINGS.activateExceeds}
          </Text>
        )}

        {/* How it works */}
        <Card
          style={{
            padding: 16,
            backgroundColor: colors.brand.primaryLight,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            {PAYMENT_STRINGS.activateHowTitle}
          </Text>
          <Step
            n={1}
            icon={<Wifi size={16} color={colors.brand.primary} strokeWidth={2} />}
            text={PAYMENT_STRINGS.activateHow1}
          />
          <Step
            n={2}
            icon={
              <KeyRound size={16} color={colors.brand.primary} strokeWidth={2} />
            }
            text={PAYMENT_STRINGS.activateHow2}
          />
          <Step
            n={3}
            icon={
              <Mountain size={16} color={colors.brand.primary} strokeWidth={2} />
            }
            text={PAYMENT_STRINGS.activateHow3}
            isLast
          />
        </Card>

        {/* Safety note */}
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.status.warningLight,
            borderWidth: 1,
            borderColor: '#EBD6B4',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              lineHeight: 18,
              color: '#5a3a00',
            }}
          >
            {PAYMENT_STRINGS.activateSafetyNote}
          </Text>
        </View>

        {/* Prototype note */}
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
            {PAYMENT_STRINGS.activatePrototypeNote}
          </Text>
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
          label={PAYMENT_STRINGS.activateConfirm(
            isValidAmount && effectiveAmount !== null
              ? effectiveAmount.toLocaleString('en-US')
              : '0',
          )}
          onPress={handleConfirm}
          disabled={!canConfirm}
          icon={<ShieldCheck size={18} color="#fff" strokeWidth={2} />}
          accessibilityLabel={PAYMENT_STRINGS.activateConfirm(
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

function Step({
  n,
  icon,
  text,
  isLast = false,
}: {
  n: number;
  icon: React.ReactNode;
  text: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: isLast ? 0 : 10,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 12,
            color: colors.brand.primary,
          }}
        >
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text
          style={{
            flex: 1,
            fontFamily: 'Inter_500Medium',
            fontSize: 13,
            lineHeight: 18,
            color: colors.text.primary,
          }}
        >
          {text}
        </Text>
      </View>
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
          letterSpacing: 0.08 * 12,
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
