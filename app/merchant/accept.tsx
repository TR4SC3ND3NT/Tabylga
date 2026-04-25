import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Delete } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';

type Stage = 'entry' | 'qr';

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
const TOTAL_SECONDS = 298;

function formatCountdown(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function AcceptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState<'KGS'|'USD'>('KGS');
  const [amountStr, setAmountStr] = useState('0');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('entry');
  const [countdown, setCountdown] = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (stage !== 'qr') return;
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  function handleKey(k: string) {
    setAmountStr(prev => {
      if (k === '⌫') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (k === '.' && prev.includes('.')) return prev;
      if (prev === '0' && k !== '.') return k;
      return prev + k;
    });
  }

  const amount = parseFloat(amountStr) || 0;
  const qrData = JSON.stringify({ type: 'tabylga_pay', merchantId: 'merchant_demo_001', amount, currency, nonce: Date.now(), timestamp: Date.now() });

  if (stage === 'qr') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
          <Pressable onPress={() => { setStage('entry'); setCountdown(TOTAL_SECONDS); }} accessibilityLabel={strings.common.back} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary, flex: 1, textAlign: 'center', marginRight: 44 }}>
            {strings.merchantExtra.showToCustomer}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 40, color: colors.text.primary, marginBottom: 4 }}>
            {amount.toLocaleString('ru-RU')} {currency}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.secondary, marginBottom: 28 }}>
            {strings.merchantExtra.showToCustomer}
          </Text>

          <View style={{ padding: 20, borderRadius: 20, backgroundColor: colors.surface.card, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, marginBottom: 20 }}>
            <QRCode value={qrData} size={220} color={colors.text.primary} backgroundColor={colors.surface.card} />
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: countdown < 60 ? colors.status.errorLight : colors.status.warningLight }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: countdown < 60 ? colors.status.error : colors.text.primary }}>
              {strings.merchantExtra.expiresIn.replace('{time}', formatCountdown(countdown))}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable onPress={() => { setStage('entry'); setCountdown(TOTAL_SECONDS); }} accessibilityRole="button" style={({ pressed }) => ({ height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border.divider, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.text.secondary }}>
              {strings.merchantExtra.cancelPayment}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityLabel={strings.common.back} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary, flex: 1, textAlign: 'center' }}>
          {strings.merchantExtra.acceptTitle}
        </Text>

        {/* Currency toggle */}
        <View style={{ flexDirection: 'row', borderRadius: 8, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' }}>
          {(['KGS','USD'] as const).map(c => (
            <Pressable key={c} onPress={() => setCurrency(c)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: currency === c ? colors.brand.primary : 'transparent' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: currency === c ? '#fff' : colors.text.secondary }}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Amount display */}
      <View className="items-center py-6">
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 54, color: colors.text.primary }}>
          {parseFloat(amountStr).toLocaleString('ru-RU')} {currency}
        </Text>
        {amountStr !== '0' && (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.secondary, marginTop: 6 }}>
            ≈ {currency === 'KGS' ? `$${(parseFloat(amountStr) / 87).toFixed(2)}` : `${Math.round(parseFloat(amountStr) * 87).toLocaleString('ru-RU')} KGS`}
          </Text>
        )}
      </View>

      {/* Note */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={strings.merchantExtra.addNote}
          placeholderTextColor={colors.text.tertiary}
          style={{ height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, backgroundColor: colors.surface.card, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.primary }}
        />
      </View>

      {/* Keypad */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => handleKey(k)}
              accessibilityLabel={k === '⌫' ? 'Delete' : k}
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: '30.5%', height: 72, borderRadius: 12,
                backgroundColor: k === '⌫' ? colors.status.errorLight : colors.surface.card,
                borderWidth: 1, borderColor: colors.border.divider,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {k === '⌫'
                ? <Delete size={22} color={colors.status.error} strokeWidth={1.5} />
                : <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 24, color: colors.text.primary }}>{k}</Text>
              }
            </Pressable>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16), paddingTop: 12 }}>
        <Pressable
          onPress={() => { if (amount > 0) setStage('qr'); }}
          disabled={amount <= 0}
          accessibilityRole="button"
          style={({ pressed }) => ({ height: 56, borderRadius: 16, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center', opacity: amount <= 0 ? 0.4 : pressed ? 0.85 : 1 })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' }}>
            {strings.merchantExtra.generateQr}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
