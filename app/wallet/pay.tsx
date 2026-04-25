import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { X, Flashlight, Check } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';

type Stage = 'scanning' | 'confirming' | 'loading' | 'success';

const MOCK_MERCHANT = { name: 'Supara Ethno Restaurant', amount: 18.50 };

export default function PayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const [stage, setStage] = useState<Stage>('scanning');
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (stage !== 'scanning') return;
    const t = setTimeout(() => setStage('confirming'), 3000);
    return () => clearTimeout(t);
  }, [stage]);

  async function handleConfirm() {
    setStage('loading');
    await new Promise(r => setTimeout(r, 1200));
    setStage('success');
    await new Promise(r => setTimeout(r, 1200));
    router.back();
  }

  if (stage === 'success') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.status.success, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Check size={40} color="#fff" strokeWidth={2.5} />
        </View>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: '#fff' }}>{strings.walletExtra.paymentSent}</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
          ${MOCK_MERCHANT.amount.toFixed(2)} to {MOCK_MERCHANT.name}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={{ paddingTop: (insets.top || 0) + 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} accessibilityLabel={strings.common.close} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} color="#fff" strokeWidth={1.5} />
        </Pressable>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#fff' }}>
            {strings.walletExtra.scanInstruction}
          </Text>
        </View>
        <Pressable onPress={() => setFlashOn(!flashOn)} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Flashlight size={22} color={flashOn ? colors.status.warning : '#fff'} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Camera placeholder with frame */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 260, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {/* Corners */}
          {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
            <View key={i} style={{ position: 'absolute', width: 32, height: 32, ...pos }}>
              <View style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 4, backgroundColor: colors.brand.cta, borderRadius: 2, ...(pos.right !== undefined ? { right: 0, left: undefined } : {}) }} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 32, backgroundColor: colors.brand.cta, borderRadius: 2, ...(pos.right !== undefined ? { right: 0, left: undefined } : {}), ...(pos.bottom !== undefined ? { bottom: 0, top: undefined } : {}) }} />
            </View>
          ))}

          {/* Scanning animation placeholder */}
          <View style={{ width: 200, height: 1, backgroundColor: 'rgba(198,93,58,0.6)' }} />
        </View>
      </View>

      {/* Can't scan link */}
      <View style={{ alignItems: 'center', paddingBottom: Math.max(insets.bottom, 24) + 16 }}>
        <Pressable accessibilityRole="button">
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' }}>
            {strings.walletExtra.cantScan}
          </Text>
        </Pressable>
      </View>

      {/* Confirm modal */}
      <Modal visible={stage === 'confirming'} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Math.max(insets.bottom, 24) }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.tertiary, marginBottom: 4, letterSpacing: 0.08 * 13, textTransform: 'uppercase' }}>
              {strings.walletExtra.confirmTitle}
            </Text>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.text.primary, marginBottom: 4 }}>
              {MOCK_MERCHANT.name}
            </Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: colors.text.primary, marginBottom: 24 }}>
              ${MOCK_MERCHANT.amount.toFixed(2)}
            </Text>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              style={({ pressed }) => ({ height: 56, borderRadius: 16, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center', marginBottom: 10, opacity: pressed ? 0.85 : 1 })}
            >
              {stage === 'loading'
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' }}>{strings.walletExtra.confirmPay}</Text>
              }
            </Pressable>
            <Pressable onPress={() => { setStage('scanning'); }} accessibilityRole="button" style={({ pressed }) => ({ height: 52, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.secondary }}>{strings.common.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
