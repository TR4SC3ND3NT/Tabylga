import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';

const AMOUNTS = [50, 100, 200, 500];
const RATE = 87.0;

type Method = 'mbank' | 'card' | 'applepay';
type Stage = 'form' | 'loading' | 'success';

function formatCard(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState<Method>('mbank');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [stage, setStage] = useState<Stage>('form');

  async function handlePay() {
    setStage('loading');
    await new Promise(r => setTimeout(r, 2000));
    setStage('success');
    await new Promise(r => setTimeout(r, 1200));
    router.back();
  }

  if (stage === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.secondary, marginTop: 16 }}>
          Processing payment…
        </Text>
      </SafeAreaView>
    );
  }

  if (stage === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center">
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.status.successLight,
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Check size={40} color={colors.status.success} strokeWidth={2.5} />
        </View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: colors.text.primary }}>
          ${amount} added!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={strings.common.back}
          accessibilityRole="button"
          style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary, flex: 1, textAlign: 'center', marginRight: 44 }}>
          {strings.walletExtra.topUpTitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Amount chips */}
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.secondary, marginBottom: 10, letterSpacing: 0.08 * 14, textTransform: 'uppercase' }}>
          {strings.walletExtra.amountLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          {AMOUNTS.map(a => {
            const sel = amount === a;
            return (
              <Pressable
                key={a}
                onPress={() => setAmount(a)}
                accessibilityLabel={`$${a}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                style={({ pressed }) => ({
                  flex: 1, height: 48, borderRadius: 12,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.brand.primary : colors.border.divider,
                  backgroundColor: sel ? colors.brand.primaryLight : colors.surface.card,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: sel ? colors.brand.primary : colors.text.primary }}>
                  ${a}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, marginBottom: 24 }}>
          = {(amount * RATE).toLocaleString('ru-RU')} KGS at {RATE.toFixed(2)} rate
        </Text>

        {/* Payment methods */}
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.secondary, marginBottom: 10, letterSpacing: 0.08 * 14, textTransform: 'uppercase' }}>
          Payment method
        </Text>

        {([
          { key: 'mbank', label: strings.walletExtra.methodMBank, sub: strings.walletExtra.methodMBankSub, badge: strings.walletExtra.methodMBankBadge },
          { key: 'card',  label: strings.walletExtra.methodCard, sub: null, badge: null },
          { key: 'applepay', label: strings.walletExtra.methodApplePay, sub: null, badge: null },
        ] as { key: Method; label: string; sub: string | null; badge: string | null }[]).map(m => {
          const sel = method === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMethod(m.key)}
              accessibilityLabel={m.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12,
                minHeight: 72, padding: 16, borderRadius: 14, marginBottom: 10,
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? colors.brand.primary : colors.border.divider,
                backgroundColor: sel ? colors.brand.primaryLight : colors.surface.card,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: sel ? 0 : 1.5, borderColor: colors.border.input, backgroundColor: sel ? colors.brand.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {sel && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: sel ? colors.brand.primary : colors.text.primary }}>
                    {m.label}
                  </Text>
                  {m.badge && (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.status.warning }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.text.primary }}>{m.badge}</Text>
                    </View>
                  )}
                </View>
                {m.sub && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>{m.sub}</Text>}
              </View>
            </Pressable>
          );
        })}

        {/* Card form */}
        {method === 'card' && (
          <View style={{ gap: 10, marginBottom: 8 }}>
            <TextInput
              value={formatCard(cardNum)}
              onChangeText={t => setCardNum(t.replace(/\D/g, ''))}
              placeholder={strings.walletExtra.cardNumber}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              maxLength={19}
              style={{ height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.border.input, backgroundColor: colors.surface.card, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 16, letterSpacing: 2, color: colors.text.primary }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={expiry}
                onChangeText={t => { const d = t.replace(/\D/g,''); setExpiry(d.length > 2 ? `${d.slice(0,2)} / ${d.slice(2,4)}` : d); }}
                placeholder={strings.walletExtra.expiry}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={7}
                style={{ flex: 1, height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.border.input, backgroundColor: colors.surface.card, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text.primary }}
              />
              <TextInput
                value={cvc}
                onChangeText={t => setCvc(t.replace(/\D/g,'').slice(0,4))}
                placeholder={strings.walletExtra.cvc}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={{ flex: 1, height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.border.input, backgroundColor: colors.surface.card, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text.primary }}
              />
            </View>
          </View>
        )}

        {/* Trust */}
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, textAlign: 'center', marginTop: 16 }}>
          {strings.walletExtra.securedBy}
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.primary, borderTopWidth: 1, borderTopColor: colors.border.divider }}>
        <Pressable
          onPress={handlePay}
          accessibilityRole="button"
          style={({ pressed }) => ({ height: 56, borderRadius: 16, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' }}>
            Pay ${amount}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
