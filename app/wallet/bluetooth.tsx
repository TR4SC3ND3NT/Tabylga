import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bluetooth,
  CheckCircle2,
  Clock,
  Radio,
  ShieldCheck,
  Store,
} from 'lucide-react-native';

import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import type { PaymentMerchant } from '../../lib/data/paymentMerchants';
import {
  getBluetoothMerchants,
  getOfflineTokens,
  getWallet,
  sendViaBluetoothDemo,
  type BluetoothDemoResult,
  type OfflineToken,
  type Wallet,
} from '../../lib/payments/paymentService';
import { formatKgs } from '../../lib/payments/paymentStrings';

const PRESET_AMOUNTS = [500, 1000, 2000];

const FLOW_STEPS = [
  'Searching nearby merchants...',
  'Merchant found',
  'Preparing KICB Demo signed token...',
  'Sending token via Bluetooth demo...',
  'Merchant verifies signature...',
  'Merchant accepted payment',
  'Status: Pending sync',
];

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shorten(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

export default function BluetoothPayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tokenId?: string }>();
  const merchants = useMemo(() => getBluetoothMerchants(), []);
  const defaultMerchant =
    merchants.find((merchant) => merchant.id === 'shepherd_yurt') ??
    merchants[0] ??
    null;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tokens, setTokens] = useState<OfflineToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(
    params.tokenId ?? null,
  );
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    defaultMerchant?.id ?? null,
  );
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<BluetoothDemoResult | null>(null);

  const selectedMerchant =
    merchants.find((merchant) => merchant.id === selectedMerchantId) ??
    defaultMerchant;
  const selectedToken = tokens.find((token) => token.id === selectedTokenId) ?? null;
  const amount = selectedToken
    ? selectedToken.amount
    : Number(amountText.replace(/[^0-9]/g, ''));
  const canSend =
    !!selectedMerchant &&
    !sending &&
    (selectedToken ? true : Number.isFinite(amount) && amount > 0);
  const exceedsReserve =
    !selectedToken && wallet ? amount > wallet.offlineReserve : false;

  const refresh = useCallback(async () => {
    try {
      const [nextWallet, nextTokens] = await Promise.all([
        getWallet(),
        getOfflineTokens(),
      ]);
      setWallet(nextWallet);
      setTokens(
        nextTokens
          .filter((token) => token.status === 'created')
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
      );
    } catch (err) {
      console.warn('[bluetooth-demo] failed to load payment state', err);
      Alert.alert('Bluetooth payment demo', 'Failed to load offline tokens.');
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

  function pickToken(tokenId: string | null) {
    setSelectedTokenId(tokenId);
    setResult(null);
  }

  async function handleSend() {
    if (!selectedMerchant || sending) return;
    if (!selectedToken && (!Number.isFinite(amount) || amount <= 0)) {
      Alert.alert('Amount required', 'Enter an amount in KGS or select an existing token.');
      return;
    }
    if (exceedsReserve) {
      Alert.alert('Not enough offline reserve', 'Activate Offline Pay or choose a smaller amount.');
      return;
    }

    setSending(true);
    setResult(null);
    setStepIndex(0);

    try {
      for (let index = 0; index < FLOW_STEPS.length - 1; index += 1) {
        setStepIndex(index);
        await new Promise((resolve) => setTimeout(resolve, 360));
      }

      const nextResult = await sendViaBluetoothDemo(
        selectedToken
          ? { tokenId: selectedToken.id, merchantId: selectedMerchant.id }
          : { amount, merchantId: selectedMerchant.id },
      );
      setStepIndex(FLOW_STEPS.length - 1);
      setResult(nextResult);
      setSelectedTokenId(nextResult.token.id);
      await refresh();
    } catch (err) {
      Alert.alert(
        'Bluetooth demo failed',
        err instanceof Error ? err.message : 'Could not complete the demo transfer.',
      );
    } finally {
      setSending(false);
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
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
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
            fontFamily: 'Inter_700Bold',
            fontSize: 17,
            color: colors.text.primary,
            flex: 1,
            textAlign: 'center',
            marginRight: 44,
          }}
        >
          Bluetooth payment demo
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom, 18) + 28,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            {
              padding: 18,
              borderRadius: 22,
              backgroundColor: colors.status.warningLight,
            },
            shadows.card,
          ]}
        >
          <Bluetooth size={32} color={colors.brand.cta} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 27,
              lineHeight: 32,
              color: colors.text.primary,
              marginTop: 12,
            }}
          >
            Bluetooth payment demo
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              lineHeight: 21,
              color: colors.text.secondary,
              marginTop: 6,
            }}
          >
            Send the same KICB Demo offline token to a nearby merchant.
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 12,
              lineHeight: 18,
              color: colors.brand.primary,
              marginTop: 12,
            }}
          >
            MPay-style demo. No real MBANK integration in prototype.
          </Text>
        </View>

        <SectionTitle
          title="Nearby merchant"
          body="Prototype only. No real Bluetooth discovery or device connection is used."
        />
        <View style={{ gap: 10 }}>
          {merchants.map((merchant) => (
            <MerchantOption
              key={merchant.id}
              merchant={merchant}
              selected={merchant.id === selectedMerchant?.id}
              onPress={() => {
                setSelectedMerchantId(merchant.id);
                setResult(null);
              }}
            />
          ))}
        </View>

        <SectionTitle
          title="KICB Demo token"
          body="Use the token passed from Offline QR, select a waiting token, or create one from an amount."
        />
        {tokens.length > 0 ? (
          <View style={{ gap: 8 }}>
            {tokens.map((token) => (
              <TokenOption
                key={token.id}
                token={token}
                selected={token.id === selectedTokenId}
                onPress={() => pickToken(token.id)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: colors.surface.card,
              borderWidth: 1,
              borderColor: colors.border.divider,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                lineHeight: 19,
                color: colors.text.secondary,
              }}
            >
              No existing created tokens. Enter an amount to create a new
              KICB Demo offline token before sending.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => pickToken(null)}
          accessibilityRole="radio"
          accessibilityState={{ selected: !selectedToken }}
          style={({ pressed }) => ({
            borderRadius: 16,
            padding: 14,
            backgroundColor: !selectedToken ? colors.brand.primaryLight : colors.surface.card,
            borderWidth: 1.5,
            borderColor: !selectedToken ? colors.brand.primary : colors.border.divider,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: colors.text.primary,
              marginBottom: 10,
            }}
          >
            Create token from amount
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {PRESET_AMOUNTS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => {
                  pickToken(null);
                  setAmountText(String(preset));
                }}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  height: 38,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: amount === preset && !selectedToken
                    ? colors.brand.primary
                    : colors.surface.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 12,
                    color: amount === preset && !selectedToken ? '#fff' : colors.text.primary,
                  }}
                >
                  {formatKgs(preset)}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={amountText}
            onChangeText={(value) => {
              pickToken(null);
              setAmountText(value.replace(/[^0-9]/g, ''));
            }}
            placeholder="1500"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="number-pad"
            editable={!selectedToken}
            style={{
              height: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: exceedsReserve ? colors.status.error : colors.border.input,
              backgroundColor: colors.surface.card,
              paddingHorizontal: 14,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 16,
              color: colors.text.primary,
            }}
          />
          {wallet ? (
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: exceedsReserve ? colors.status.error : colors.text.secondary,
                marginTop: 8,
              }}
            >
              Offline reserve: {formatKgs(wallet.offlineReserve)}
            </Text>
          ) : null}
        </Pressable>

        <SectionTitle
          title="Transfer flow"
          body="The checklist simulates MPay-style Bluetooth transport for the same signed offline token."
        />
        <View
          style={{
            padding: 14,
            borderRadius: 18,
            backgroundColor: colors.surface.card,
            borderWidth: 1,
            borderColor: colors.border.divider,
            gap: 10,
          }}
        >
          {FLOW_STEPS.map((step, index) => {
            const done = result ? true : index < stepIndex;
            const active = !result && index === stepIndex;
            return (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: done
                      ? colors.status.success
                      : active
                        ? colors.brand.primary
                        : colors.brand.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done ? (
                    <CheckCircle2 size={15} color="#fff" strokeWidth={2} />
                  ) : active ? (
                    <Radio size={14} color="#fff" strokeWidth={2} />
                  ) : (
                    <Clock size={13} color={colors.brand.primary} strokeWidth={2} />
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: active || done ? 'Inter_700Bold' : 'Inter_500Medium',
                    fontSize: 13,
                    color: active || done ? colors.text.primary : colors.text.secondary,
                  }}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        <Button
          label={sending ? 'Sending token...' : 'Send via Bluetooth demo'}
          disabled={!canSend || exceedsReserve}
          onPress={handleSend}
          icon={<Bluetooth size={18} color="#fff" strokeWidth={2} />}
        />

        {result ? (
          <View
            style={[
              {
                borderRadius: 18,
                backgroundColor: colors.status.successLight,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
              },
              shadows.card,
            ]}
          >
            <CheckCircle2 size={26} color={colors.status.successText} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 16,
                  color: colors.text.primary,
                }}
              >
                Bluetooth demo payment accepted offline
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  lineHeight: 19,
                  color: colors.text.secondary,
                  marginTop: 5,
                }}
              >
                {formatKgs(result.transaction.amount)} - {result.merchant.name}
                {'\n'}Status: Pending sync
                {'\n'}Receipt: {result.transaction.receiptCode}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 16,
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

function MerchantOption({
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
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          padding: 14,
          borderRadius: 16,
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
          <Store size={20} color={selected ? '#fff' : colors.brand.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text.primary }}>
            {merchant.name}
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
            {merchant.type} - {merchant.region}
          </Text>
        </View>
        {selected ? <CheckCircle2 size={20} color={colors.brand.primary} strokeWidth={2} /> : null}
      </View>
    </Pressable>
  );
}

function TokenOption({
  token,
  selected,
  onPress,
}: {
  token: OfflineToken;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 16,
        backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : colors.border.divider,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            backgroundColor: colors.status.warningLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={18} color={colors.brand.cta} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary }}>
            {formatKgs(token.amount)}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
            Token {shorten(token.id)} - expires {formatTime(token.expiresAt)}
          </Text>
        </View>
        {selected ? <CheckCircle2 size={19} color={colors.brand.primary} strokeWidth={2} /> : null}
      </View>
    </Pressable>
  );
}
