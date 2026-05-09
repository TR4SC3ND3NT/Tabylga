import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  QrCode,
  RefreshCw,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { goBackOrReplace } from '../../lib/navigation';
import {
  getWallet,
  topUpWallet,
  type Transaction,
  type TransactionMethod,
  type Wallet,
} from '../../lib/payments/paymentService';
import { PAYMENT_STRINGS } from '../../lib/payments/paymentStrings';
import {
  getUsdToKgsRate,
  type ExchangeRateResult,
} from '../../services/exchangeRateService';
import {
  MAX_WALLET_BALANCE_KGS,
  parseUsdAmount,
  sanitizeUsdInput,
  validateTopUpAmount,
} from '../../utils/amountValidation';
import {
  formatCardNumber,
  formatExpiry,
  validateDemoCard,
} from '../../utils/cardValidation';
import {
  formatKgs,
  formatRate,
  formatUsd,
  formatUsdPlain,
} from '../../utils/formatMoney';

const PRESET_AMOUNTS = [20, 50, 100, 200];
const RATE_LOCK_MS = 30_000;
const QR_TTL_MS = 120_000;
const STEP_DELAY_MS = 720;

type Stage = 'form' | 'qr' | 'processing' | 'success';
type Method = Extract<TransactionMethod, 'card_demo' | 'online_qr_demo'>;

interface TopUpDraft {
  amountUsd: number;
  amountKgs: number;
  rate: number;
  rateSource: ExchangeRateResult['source'];
  rateDate?: string;
  receiptCode: string;
  method: Method;
  lockedUntil: number;
  cardBrand?: string;
  cardLast4?: string;
  qrExpiresAt?: number;
}

function makeReceiptCode(): string {
  return `TBL-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function methodLabel(method: Method): string {
  return method === 'card_demo'
    ? PAYMENT_STRINGS.topUpMethodCard
    : PAYMENT_STRINGS.topUpMethodLocalQr;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stage, setStage] = useState<Stage>('form');
  const [rateInfo, setRateInfo] = useState<ExchangeRateResult | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [lockedRateInfo, setLockedRateInfo] = useState<ExchangeRateResult | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const [presetAmount, setPresetAmount] = useState<number | null>(50);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const [method, setMethod] = useState<Method>('card_demo');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [draft, setDraft] = useState<TopUpDraft | null>(null);
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [resultWallet, setResultWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loadedWallet, loadedRate] = await Promise.all([
          getWallet(),
          getUsdToKgsRate(),
        ]);
        if (!active) return;
        setWallet(loadedWallet);
        setRateInfo(loadedRate);
      } catch (error) {
        console.warn('[topup] failed to load top-up data', error);
      } finally {
        if (active) setRateLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lockActive = lockedUntil !== null && lockedUntil > nowMs;
  const activeRateInfo = lockActive && lockedRateInfo ? lockedRateInfo : rateInfo;
  const lockedSecondsRemaining = lockActive
    ? Math.max(0, Math.ceil(((lockedUntil as number) - nowMs) / 1000))
    : 0;

  const amountUsd = customMode ? parseUsdAmount(customText) : presetAmount;
  const convertedKgs = useMemo(() => {
    if (!activeRateInfo || amountUsd === null || amountUsd <= 0) return 0;
    return Math.round(amountUsd * activeRateInfo.rate);
  }, [activeRateInfo, amountUsd]);

  const amountValidation = useMemo(
    () => validateTopUpAmount(amountUsd, convertedKgs, wallet),
    [amountUsd, convertedKgs, wallet],
  );
  const cardValidation = useMemo(
    () => validateDemoCard(cardNumber, expiry, cvc),
    [cardNumber, expiry, cvc],
  );

  const disabledReason = useMemo(() => {
    if (submitting || stage !== 'form') return null;
    if (!amountValidation.valid) return amountValidation.error;
    if (rateLoading) return PAYMENT_STRINGS.topUpRateStillLoading;
    if (!activeRateInfo) return 'Rate unavailable, try refreshing.';
    if (method === 'card_demo' && !cardValidation.valid) return cardValidation.error;
    return null;
  }, [
    activeRateInfo,
    amountValidation,
    cardValidation,
    method,
    rateLoading,
    stage,
    submitting,
  ]);
  const canSubmit = !disabledReason && !!activeRateInfo && !submitting;

  const ctaAmountLabel = amountUsd && amountUsd > 0 ? formatUsdPlain(amountUsd) : '0';
  const qrExpired = stage === 'qr' && draft?.qrExpiresAt
    ? draft.qrExpiresAt <= nowMs
    : false;

  async function refreshRate() {
    if (rateLoading || lockActive) return;
    setRateLoading(true);
    setInlineError(null);
    try {
      setRateInfo(await getUsdToKgsRate());
    } finally {
      setRateLoading(false);
    }
  }

  function selectPreset(amount: number) {
    setInlineError(null);
    setCustomMode(false);
    setPresetAmount(amount);
  }

  function selectCustom() {
    setInlineError(null);
    setCustomMode(true);
    setPresetAmount(null);
  }

  function useDemoVisa() {
    setCardNumber('4242424242424242');
    setExpiry('12 / 29');
    setCvc('123');
    setInlineError(null);
  }

  function buildDraft(nextMethod: Method, receiptCode = makeReceiptCode()): TopUpDraft | null {
    const rateForPayment = lockActive && lockedRateInfo ? lockedRateInfo : rateInfo;
    if (!rateForPayment || rateLoading) {
      setInlineError(PAYMENT_STRINGS.topUpRateStillLoading);
      return null;
    }
    if (!amountValidation.valid || amountUsd === null) {
      setInlineError(amountValidation.error);
      return null;
    }
    if (nextMethod === 'card_demo' && !cardValidation.valid) {
      setInlineError(cardValidation.error);
      return null;
    }

    const amountKgs = Math.round(amountUsd * rateForPayment.rate);
    const limitValidation = validateTopUpAmount(amountUsd, amountKgs, wallet);
    if (!limitValidation.valid) {
      setInlineError(limitValidation.error);
      return null;
    }

    const nextLockedUntil =
      lockActive && lockedUntil ? lockedUntil : Date.now() + RATE_LOCK_MS;
    setLockedRateInfo(rateForPayment);
    setLockedUntil(nextLockedUntil);
    setInlineError(null);

    return {
      amountUsd,
      amountKgs,
      rate: rateForPayment.rate,
      rateSource: rateForPayment.source,
      rateDate: rateForPayment.date,
      receiptCode,
      method: nextMethod,
      lockedUntil: nextLockedUntil,
      cardBrand: nextMethod === 'card_demo' ? cardValidation.brand : undefined,
      cardLast4: nextMethod === 'card_demo' ? cardValidation.last4 : undefined,
    };
  }

  async function completeTopUp(nextDraft: TopUpDraft) {
    if (submitting) return;
    setSubmitting(true);
    setDraft(nextDraft);
    setProcessingStep(0);
    setStage('processing');

    try {
      const steps = nextDraft.method === 'card_demo'
        ? [
            PAYMENT_STRINGS.topUpStepAuthorizeCard,
            PAYMENT_STRINGS.topUpStepConvert,
            PAYMENT_STRINGS.topUpStepCredit,
          ]
        : [
            PAYMENT_STRINGS.topUpStepReceiveQr,
            PAYMENT_STRINGS.topUpStepConvert,
            PAYMENT_STRINGS.topUpStepCredit,
          ];

      for (let i = 0; i < steps.length; i += 1) {
        setProcessingStep(i);
        await delay(STEP_DELAY_MS);
      }
      setProcessingStep(steps.length);

      const result = await topUpWallet(nextDraft.amountUsd, nextDraft.method, {
        inputCurrency: 'USD',
        exchangeRate: nextDraft.rate,
        convertedAmountKgs: nextDraft.amountKgs,
        receiptCode: nextDraft.receiptCode,
        cardBrand: nextDraft.cardBrand,
        cardLast4: nextDraft.cardLast4,
      });

      setWallet(result.wallet);
      setResultTx(result.transaction);
      setResultWallet(result.wallet);
      setStage('success');
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : 'Top up failed.');
      setStage(nextDraft.method === 'online_qr_demo' ? 'qr' : 'form');
    } finally {
      setSubmitting(false);
    }
  }

  function startTopUp() {
    if (!canSubmit) {
      setInlineError(disabledReason ?? PAYMENT_STRINGS.topUpInvalidAmount);
      return;
    }

    const nextDraft = buildDraft(method);
    if (!nextDraft) return;

    if (method === 'online_qr_demo') {
      setDraft({ ...nextDraft, qrExpiresAt: Date.now() + QR_TTL_MS });
      setStage('qr');
      return;
    }

    completeTopUp(nextDraft);
  }

  function generateNewQr() {
    const nextDraft = buildDraft('online_qr_demo');
    if (!nextDraft) return;
    setDraft({ ...nextDraft, qrExpiresAt: Date.now() + QR_TTL_MS });
  }

  function simulateQrPaymentReceived() {
    if (!draft || qrExpired || submitting) return;
    completeTopUp(draft);
  }

  if (stage === 'qr' && draft) {
    return (
      <LocalQrView
        draft={draft}
        expired={qrExpired}
        remainingMs={(draft.qrExpiresAt ?? nowMs) - nowMs}
        onBack={() => setStage('form')}
        onCancel={() => {
          setDraft(null);
          setStage('form');
        }}
        onGenerateNew={generateNewQr}
        onSimulateReceived={simulateQrPaymentReceived}
        disabled={submitting}
      />
    );
  }

  if (stage === 'processing' && draft) {
    return (
      <ProcessingView
        method={draft.method}
        activeStep={processingStep}
      />
    );
  }

  if (stage === 'success' && draft && resultTx && resultWallet) {
    return (
      <SuccessReceiptView
        draft={draft}
        transaction={resultTx}
        wallet={resultWallet}
        onBack={() => goBackOrReplace(router, '/(tabs)/wallet')}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title={PAYMENT_STRINGS.topUpTitle} onBack={() => goBackOrReplace(router, '/(tabs)/wallet')} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {wallet ? (
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
        ) : null}

        <SectionLabel>{PAYMENT_STRINGS.topUpAmountLabel}</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {PRESET_AMOUNTS.map((amount) => (
            <AmountChip
              key={amount}
              selected={!customMode && presetAmount === amount}
              label={formatUsd(amount)}
              accessibilityLabel={`${amount} USD`}
              onPress={() => selectPreset(amount)}
            />
          ))}
          <AmountChip
            selected={customMode}
            label={PAYMENT_STRINGS.topUpCustomChip}
            accessibilityLabel={PAYMENT_STRINGS.topUpCustomChip}
            onPress={selectCustom}
          />
        </View>

        {customMode ? (
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
              onChangeText={(text) => {
                setInlineError(null);
                setCustomText(sanitizeUsdInput(text));
              }}
              placeholder="100"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              accessibilityLabel={PAYMENT_STRINGS.topUpCustomLabel}
              style={inputStyle}
            />
          </View>
        ) : null}

        <ExchangeRateCard
          rateInfo={activeRateInfo}
          rateLoading={rateLoading}
          amountUsd={amountUsd}
          amountKgs={convertedKgs}
          lockActive={lockActive}
          lockedSecondsRemaining={lockedSecondsRemaining}
          onRefresh={refreshRate}
        />

        <SectionLabel>{PAYMENT_STRINGS.topUpMethodLabel}</SectionLabel>
        <MethodOption
          selected={method === 'card_demo'}
          onPress={() => {
            setMethod('card_demo');
            setInlineError(null);
          }}
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
          onPress={() => {
            setMethod('online_qr_demo');
            setInlineError(null);
          }}
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

        {method === 'card_demo' ? (
          <CardForm
            cardNumber={cardNumber}
            expiry={expiry}
            cvc={cvc}
            validationError={cardValidation.error}
            detectedBrand={cardValidation.brand}
            onCardNumberChange={(text) => {
              setInlineError(null);
              setCardNumber(text.replace(/\D/g, '').slice(0, 19));
            }}
            onExpiryChange={(text) => {
              setInlineError(null);
              setExpiry(formatExpiry(text));
            }}
            onCvcChange={(text) => {
              setInlineError(null);
              setCvc(text.replace(/\D/g, '').slice(0, 3));
            }}
            onUseDemoVisa={useDemoVisa}
          />
        ) : null}

        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.status.warningLight,
            borderWidth: 1,
            borderColor: colors.border.divider,
            marginTop: method === 'card_demo' ? 14 : 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 12,
              color: colors.text.primary,
              marginBottom: 3,
            }}
          >
            Demo wallet limits
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              lineHeight: 17,
              color: colors.text.secondary,
            }}
          >
            Maximum wallet balance is {formatKgs(MAX_WALLET_BALANCE_KGS)}.
            Payments are simulated and no real card or bank charge is made.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.divider,
        }}
      >
        {(inlineError || disabledReason) ? (
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 12,
              lineHeight: 17,
              color: colors.status.error,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {inlineError ?? disabledReason}
          </Text>
        ) : null}
        <Button
          variant="cta"
          label={PAYMENT_STRINGS.topUpConfirm(ctaAmountLabel)}
          onPress={startTopUp}
          disabled={!canSubmit}
          accessibilityLabel={PAYMENT_STRINGS.topUpConfirm(ctaAmountLabel)}
        />
      </View>
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
          fontFamily: 'Inter_600SemiBold',
          fontSize: 17,
          color: colors.text.primary,
          flex: 1,
          textAlign: 'center',
          marginRight: 44,
        }}
      >
        {title}
      </Text>
    </View>
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
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

function AmountChip({
  selected,
  label,
  accessibilityLabel,
  onPress,
}: {
  selected: boolean;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        height: 48,
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.brand.primary : colors.border.divider,
        backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 15,
          color: selected ? colors.brand.primary : colors.text.primary,
        }}
      >
        {label}
      </Text>
    </Pressable>
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

function ExchangeRateCard({
  rateInfo,
  rateLoading,
  amountUsd,
  amountKgs,
  lockActive,
  lockedSecondsRemaining,
  onRefresh,
}: {
  rateInfo: ExchangeRateResult | null;
  rateLoading: boolean;
  amountUsd: number | null;
  amountKgs: number;
  lockActive: boolean;
  lockedSecondsRemaining: number;
  onRefresh: () => void;
}) {
  return (
    <Card
      style={{
        padding: 14,
        backgroundColor: colors.brand.primaryLight,
        marginBottom: 18,
      }}
    >
      {rateLoading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: colors.text.primary,
            }}
          >
            {PAYMENT_STRINGS.topUpFxLoading}
          </Text>
        </View>
      ) : rateInfo ? (
        <>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: colors.text.primary,
              marginBottom: 5,
            }}
          >
            {PAYMENT_STRINGS.topUpFxPreview(
              amountUsd && amountUsd > 0 ? formatUsdPlain(amountUsd) : '0',
              amountKgs.toLocaleString('en-US'),
              formatRate(rateInfo.rate),
            )}
          </Text>
          {rateInfo.isFallback ? (
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
              <AlertTriangle size={14} color={colors.status.warningText} strokeWidth={2} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'Inter_500Medium',
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors.status.warningText,
                }}
              >
                {PAYMENT_STRINGS.topUpFxFallback}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                lineHeight: 17,
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              {PAYMENT_STRINGS.topUpFxSource(rateInfo.source, rateInfo.date ?? '')}
            </Text>
          )}
        </>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Clock size={14} color={colors.text.secondary} strokeWidth={2} />
        <Text
          style={{
            flex: 1,
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            lineHeight: 17,
            color: colors.text.secondary,
          }}
        >
          {lockActive
            ? `${PAYMENT_STRINGS.topUpFxLock}. ${PAYMENT_STRINGS.topUpFxLockedRemaining(lockedSecondsRemaining)}`
            : PAYMENT_STRINGS.topUpFxLockHint}
        </Text>
      </View>

      <Pressable
        onPress={onRefresh}
        disabled={rateLoading || lockActive}
        accessibilityRole="button"
        accessibilityState={{ disabled: rateLoading || lockActive }}
        accessibilityLabel={PAYMENT_STRINGS.topUpFxRefresh}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          minHeight: 34,
          paddingHorizontal: 10,
          borderRadius: 10,
          backgroundColor: colors.surface.card,
          borderWidth: 1,
          borderColor: colors.border.divider,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity: rateLoading || lockActive ? 0.45 : pressed ? 0.7 : 1,
          marginTop: 12,
        })}
      >
        <RefreshCw size={13} color={colors.brand.primary} strokeWidth={2} />
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 12,
            color: colors.brand.primary,
          }}
        >
          {PAYMENT_STRINGS.topUpFxRefresh}
        </Text>
      </Pressable>
    </Card>
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
        {selected ? (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
        ) : null}
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

function CardForm({
  cardNumber,
  expiry,
  cvc,
  validationError,
  detectedBrand,
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
  onUseDemoVisa,
}: {
  cardNumber: string;
  expiry: string;
  cvc: string;
  validationError: string | null;
  detectedBrand: string;
  onCardNumberChange: (text: string) => void;
  onExpiryChange: (text: string) => void;
  onCvcChange: (text: string) => void;
  onUseDemoVisa: () => void;
}) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <TextInput
        value={formatCardNumber(cardNumber)}
        onChangeText={onCardNumberChange}
        placeholder={PAYMENT_STRINGS.topUpCardNumber}
        placeholderTextColor={colors.text.tertiary}
        keyboardType="number-pad"
        maxLength={23}
        accessibilityLabel={PAYMENT_STRINGS.topUpCardNumber}
        style={inputStyle}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          value={expiry}
          onChangeText={onExpiryChange}
          placeholder={PAYMENT_STRINGS.topUpCardExpiry}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="number-pad"
          maxLength={7}
          accessibilityLabel={PAYMENT_STRINGS.topUpCardExpiry}
          style={[inputStyle, { flex: 1 }]}
        />
        <TextInput
          value={cvc}
          onChangeText={onCvcChange}
          placeholder={PAYMENT_STRINGS.topUpCardCvc}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="number-pad"
          maxLength={3}
          secureTextEntry
          accessibilityLabel={PAYMENT_STRINGS.topUpCardCvc}
          style={[inputStyle, { flex: 1 }]}
        />
      </View>

      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.surface.card,
          borderWidth: 1,
          borderColor: colors.border.divider,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CreditCard size={15} color={colors.brand.primary} strokeWidth={2} />
          <Text
            style={{
              flex: 1,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 12,
              color: colors.text.primary,
            }}
          >
            {detectedBrand !== 'Unknown' ? `${detectedBrand} detected` : PAYMENT_STRINGS.topUpDemoCards}
          </Text>
        </View>
        {validationError ? (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              lineHeight: 17,
              color: colors.status.error,
              marginTop: 7,
            }}
          >
            {validationError}
          </Text>
        ) : null}
        <Button
          variant="secondary"
          label={PAYMENT_STRINGS.topUpUseDemoVisa}
          onPress={onUseDemoVisa}
          height={42}
          fontSize={13}
          style={{ marginTop: 10, borderColor: colors.brand.primary }}
        />
      </View>
    </View>
  );
}

function LocalQrView({
  draft,
  expired,
  remainingMs,
  disabled,
  onBack,
  onCancel,
  onGenerateNew,
  onSimulateReceived,
}: {
  draft: TopUpDraft;
  expired: boolean;
  remainingMs: number;
  disabled: boolean;
  onBack: () => void;
  onCancel: () => void;
  onGenerateNew: () => void;
  onSimulateReceived: () => void;
}) {
  const insets = useSafeAreaInsets();
  const payload = JSON.stringify({
    type: 'TABYLGA_TOPUP',
    method: 'LOCAL_QR_DEMO',
    amountUsd: draft.amountUsd,
    amountKgs: draft.amountKgs,
    rate: draft.rate,
    currency: 'KGS',
    receiptCode: draft.receiptCode,
    expiresAt: draft.qrExpiresAt,
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <Header title={PAYMENT_STRINGS.topUpLocalQrTitle} onBack={onBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 20) + 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            lineHeight: 20,
            color: colors.text.secondary,
            textAlign: 'center',
            marginBottom: 18,
          }}
        >
          {PAYMENT_STRINGS.topUpLocalQrSubtitle}
        </Text>

        <View
          style={[
            {
              backgroundColor: '#fff',
              padding: 22,
              borderRadius: 22,
              alignItems: 'center',
              marginBottom: 18,
              borderWidth: 2,
              borderColor: expired ? colors.status.error : colors.brand.primary,
            },
            shadows.cardElevated,
          ]}
        >
          <QRCode
            value={payload}
            size={220}
            color="#1A1A1A"
            backgroundColor="#fff"
            ecl="M"
          />
          <View
            style={{
              marginTop: 16,
              paddingHorizontal: 12,
              minHeight: 30,
              borderRadius: 999,
              backgroundColor: expired ? colors.status.errorLight : colors.brand.primaryLight,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock
              size={13}
              color={expired ? colors.status.error : colors.brand.primary}
              strokeWidth={2}
            />
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 12,
                color: expired ? colors.status.error : colors.brand.primary,
              }}
            >
              {expired
                ? PAYMENT_STRINGS.topUpQrExpired
                : PAYMENT_STRINGS.topUpQrExpiresIn(formatCountdown(remainingMs))}
            </Text>
          </View>
        </View>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <ReceiptRow label={PAYMENT_STRINGS.topUpCharged} value={formatUsd(draft.amountUsd)} />
          <ReceiptRow label={PAYMENT_STRINGS.topUpReceived} value={formatKgs(draft.amountKgs)} />
          <ReceiptRow label={PAYMENT_STRINGS.topUpFxRate} value={`1 USD = ${formatRate(draft.rate)} KGS`} />
          <ReceiptRow label={PAYMENT_STRINGS.receiptCode} value={draft.receiptCode} mono />
          <ReceiptRow label="Source" value={draft.rateSource} isLast />
        </Card>

        <View style={{ gap: 10 }}>
          {expired ? (
            <Button
              variant="primary"
              label={PAYMENT_STRINGS.topUpGenerateNewQr}
              onPress={onGenerateNew}
              icon={<RefreshCw size={18} color="#fff" strokeWidth={2} />}
            />
          ) : (
            <Button
              variant="cta"
              label={PAYMENT_STRINGS.topUpSimulateQrReceived}
              onPress={onSimulateReceived}
              disabled={disabled}
            />
          )}
          <Button
            variant="ghost"
            label={PAYMENT_STRINGS.topUpCancel}
            onPress={onCancel}
            disabled={disabled}
            style={{ borderWidth: 1.5, borderColor: colors.border.divider }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProcessingView({
  method,
  activeStep,
}: {
  method: Method;
  activeStep: number;
}) {
  const steps = method === 'card_demo'
    ? [
        PAYMENT_STRINGS.topUpStepAuthorizeCard,
        PAYMENT_STRINGS.topUpStepConvert,
        PAYMENT_STRINGS.topUpStepCredit,
      ]
    : [
        PAYMENT_STRINGS.topUpStepReceiveQr,
        PAYMENT_STRINGS.topUpStepConvert,
        PAYMENT_STRINGS.topUpStepCredit,
      ];

  return (
    <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center px-8">
      <StatusBar style="dark" />
      <ActivityIndicator size="large" color={colors.brand.primary} />
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold',
          fontSize: 24,
          color: colors.text.primary,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        {PAYMENT_STRINGS.topUpProcessing}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 10 }}>
        {steps.map((step, index) => {
          const completed = index < activeStep;
          const current = index === activeStep;
          return (
            <View
              key={step}
              style={{
                minHeight: 44,
                borderRadius: 14,
                paddingHorizontal: 12,
                backgroundColor: completed || current
                  ? colors.brand.primaryLight
                  : colors.surface.card,
                borderWidth: 1,
                borderColor: completed || current
                  ? colors.brand.primary
                  : colors.border.divider,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: completed ? colors.status.success : colors.brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: completed || current ? 1 : 0.32,
                }}
              >
                {completed ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 14,
                  color: completed || current ? colors.text.primary : colors.text.secondary,
                }}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function SuccessReceiptView({
  draft,
  transaction,
  wallet,
  onBack,
}: {
  draft: TopUpDraft;
  transaction: Transaction;
  wallet: Wallet;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
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
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: colors.status.successLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Check size={42} color={colors.status.success} strokeWidth={2.5} />
          </View>
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 25,
              color: colors.text.primary,
              marginBottom: 5,
            }}
          >
            {PAYMENT_STRINGS.topUpSuccessTitle}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 33,
              lineHeight: 40,
              color: colors.brand.primary,
            }}
          >
            + {formatKgs(draft.amountKgs)}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: colors.text.secondary,
              marginTop: 6,
            }}
          >
            Charged {formatUsd(draft.amountUsd)}
          </Text>
        </View>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <ReceiptRow label={PAYMENT_STRINGS.topUpCharged} value={formatUsd(draft.amountUsd)} />
          <ReceiptRow label={PAYMENT_STRINGS.topUpReceived} value={formatKgs(draft.amountKgs)} />
          <ReceiptRow label={PAYMENT_STRINGS.topUpFxRate} value={`1 USD = ${formatRate(draft.rate)} KGS`} />
          <ReceiptRow label={PAYMENT_STRINGS.receiptMethod} value={methodLabel(draft.method)} />
          {draft.method === 'card_demo' && draft.cardBrand && draft.cardLast4 ? (
            <ReceiptRow
              label={PAYMENT_STRINGS.topUpCard}
              value={PAYMENT_STRINGS.topUpCardEnding(draft.cardBrand, draft.cardLast4)}
            />
          ) : null}
          <ReceiptRow label={PAYMENT_STRINGS.receiptCode} value={transaction.receiptCode} mono />
          <ReceiptRow label={PAYMENT_STRINGS.receiptStatus} value={PAYMENT_STRINGS.statusLabels[transaction.status]} />
          <ReceiptRow
            label={PAYMENT_STRINGS.topUpRemainingBalance}
            value={formatKgs(wallet.totalBalance)}
            isLast
          />
        </Card>

        <Button
          variant="primary"
          label={PAYMENT_STRINGS.backToWallet}
          onPress={onBack}
          accessibilityLabel={PAYMENT_STRINGS.backToWallet}
        />
      </ScrollView>
    </SafeAreaView>
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
        gap: 14,
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.divider,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: colors.text.tertiary,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1.35,
          fontFamily: mono ? 'Inter_500Medium' : 'Inter_600SemiBold',
          fontSize: 13,
          color: colors.text.primary,
          textAlign: 'right',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {value}
      </Text>
    </View>
  );
}

const inputStyle = {
  height: 56,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border.input,
  backgroundColor: colors.surface.card,
  paddingHorizontal: 16,
  fontFamily: 'Inter_400Regular',
  fontSize: 16,
  color: colors.text.primary,
};
