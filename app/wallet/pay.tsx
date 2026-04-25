import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { X, Flashlight, Check, Camera, Keyboard } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';

type Stage = 'scanning' | 'confirming' | 'loading' | 'success';

type MerchantPayment = {
  name: string;
  amount: number;
  payload: string;
};

const MOCK_MERCHANT: MerchantPayment = {
  name: 'Supara Ethno Restaurant',
  amount: 18.5,
  payload: 'tabylga://pay?merchant=Supara%20Ethno%20Restaurant&amount=18.50',
};

function parseQrPayload(data: string): MerchantPayment {
  try {
    const url = new URL(data);
    const merchant = url.searchParams.get('merchant') || 'Tabylga Merchant';
    const amount = Number(url.searchParams.get('amount') || '18.5');
    return {
      name: merchant,
      amount: Number.isFinite(amount) ? amount : 18.5,
      payload: data,
    };
  } catch {
    return { ...MOCK_MERCHANT, payload: data };
  }
}

export default function PayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('scanning');
  const [flashOn, setFlashOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [merchant, setMerchant] = useState<MerchantPayment>(MOCK_MERCHANT);

  function handleScanned(data: string) {
    if (scanned || stage !== 'scanning') return;
    setScanned(true);
    setMerchant(parseQrPayload(data));
    setStage('confirming');
  }

  async function handleConfirm() {
    setStage('loading');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStage('success');
    await new Promise((resolve) => setTimeout(resolve, 1200));
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
          ${merchant.amount.toFixed(2)} to {merchant.name}
        </Text>
      </View>
    );
  }

  const hasPermission = permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <StatusBar style="light" />

      {hasPermission ? (
        <CameraView
          style={{ position: 'absolute', inset: 0 }}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(result) => handleScanned(result.data)}
        />
      ) : (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <Camera size={48} color="#fff" strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, color: '#fff', textAlign: 'center', marginTop: 18 }}>
            Camera access
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 8 }}>
            Camera is required to scan merchant QR codes.
          </Text>
          <Pressable
            onPress={requestPermission}
            accessibilityRole="button"
            style={({ pressed }) => ({ marginTop: 20, height: 50, paddingHorizontal: 22, borderRadius: 16, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' }}>
              Allow camera
            </Text>
          </Pressable>
        </View>
      )}

      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.28)' }} pointerEvents="none" />

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

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        <View style={{ width: 260, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
            <View key={i} style={{ position: 'absolute', width: 32, height: 32, ...pos }}>
              <View style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 4, backgroundColor: colors.brand.cta, borderRadius: 2, ...(pos.right !== undefined ? { right: 0, left: undefined } : {}) }} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 32, backgroundColor: colors.brand.cta, borderRadius: 2, ...(pos.right !== undefined ? { right: 0, left: undefined } : {}), ...(pos.bottom !== undefined ? { bottom: 0, top: undefined } : {}) }} />
            </View>
          ))}
          <View style={{ width: 205, height: 205, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }} />
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingBottom: Math.max(insets.bottom, 24) + 16 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleScanned(MOCK_MERCHANT.payload)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', opacity: pressed ? 0.75 : 1 })}
        >
          <Keyboard size={16} color="rgba(255,255,255,0.84)" strokeWidth={2} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.84)' }}>
            {strings.walletExtra.cantScan}
          </Text>
        </Pressable>
      </View>

      <Modal visible={stage === 'confirming'} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Math.max(insets.bottom, 24) }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.tertiary, marginBottom: 4, letterSpacing: 0.08 * 13, textTransform: 'uppercase' }}>
              {strings.walletExtra.confirmTitle}
            </Text>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.text.primary, marginBottom: 4 }}>
              {merchant.name}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginBottom: 8 }} numberOfLines={1}>
              {merchant.payload}
            </Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: colors.text.primary, marginBottom: 24 }}>
              ${merchant.amount.toFixed(2)}
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
            <Pressable
              onPress={() => {
                setStage('scanning');
                setScanned(false);
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({ height: 52, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.secondary }}>{strings.common.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
