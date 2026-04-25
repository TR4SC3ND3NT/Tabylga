import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Bluetooth, CheckCircle, Loader } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService } from '../../services/paymentService';
import { PaymentMerchant } from '../../data/paymentMerchants';

export default function BluetoothDemoScreen() {
  const router = useRouter();
  const { tokenId } = useLocalSearchParams<{ tokenId?: string }>();
  
  const [step, setStep] = useState(0);
  const [merchant, setMerchant] = useState<PaymentMerchant | null>(null);

  useEffect(() => {
    if (!tokenId) {
      Alert.alert('Error', 'No token provided', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    const runDemo = async () => {
      try {
        const bluetoothMerchants = await paymentService.getBluetoothMerchants();
        const demoMerchant = bluetoothMerchants[0]; // Just pick the first one for demo
        setMerchant(demoMerchant);

        // Step 1: Searching nearby merchants...
        setStep(1);
        await new Promise(r => setTimeout(r, 1500));

        // Step 2: Merchant found
        setStep(2);
        await new Promise(r => setTimeout(r, 1500));

        // Step 3: Creating signed token...
        setStep(3);
        await new Promise(r => setTimeout(r, 1500));

        // Step 4: Sending via Bluetooth...
        setStep(4);
        await new Promise(r => setTimeout(r, 1500));

        // Step 5: Merchant verifies signature...
        setStep(5);
        await new Promise(r => setTimeout(r, 1500));

        // Step 6 & 7: Accepted
        await paymentService.sendViaBluetoothDemo({ tokenId, merchantId: demoMerchant.id });
        setStep(6);
      } catch (e: any) {
        Alert.alert('Demo Error', e.message || 'Bluetooth demo failed');
      }
    };

    runDemo();
  }, [tokenId]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Bluetooth size={40} color={colors.brand.primary} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary }}>
            Bluetooth Pay
          </Text>
        </View>

        <Card style={{ padding: 20, marginBottom: 24 }}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 1 ? 1 : 0.3 }}>
              {step === 1 ? <Loader size={20} color={colors.brand.primary} /> : <CheckCircle size={20} color={step > 1 ? colors.status.success : colors.text.tertiary} />}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary }}>
                Searching nearby merchants...
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 2 ? 1 : 0.3 }}>
              {step === 2 ? <Loader size={20} color={colors.brand.primary} /> : <CheckCircle size={20} color={step > 2 ? colors.status.success : colors.text.tertiary} />}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary }}>
                Merchant found: {merchant ? merchant.name : '...'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 3 ? 1 : 0.3 }}>
              {step === 3 ? <Loader size={20} color={colors.brand.primary} /> : <CheckCircle size={20} color={step > 3 ? colors.status.success : colors.text.tertiary} />}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary }}>
                Creating KICB Demo signed token...
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 4 ? 1 : 0.3 }}>
              {step === 4 ? <Loader size={20} color={colors.brand.primary} /> : <CheckCircle size={20} color={step > 4 ? colors.status.success : colors.text.tertiary} />}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary }}>
                Sending token via Bluetooth demo...
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 5 ? 1 : 0.3 }}>
              {step === 5 ? <Loader size={20} color={colors.brand.primary} /> : <CheckCircle size={20} color={step > 5 ? colors.status.success : colors.text.tertiary} />}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary }}>
                Merchant verifies signature...
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: step >= 6 ? 1 : 0.3 }}>
              <CheckCircle size={20} color={step >= 6 ? colors.status.success : colors.text.tertiary} />
              <View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary }}>
                  Merchant accepted payment
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                  Status: Pending sync
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {step >= 6 && (
          <View>
            <Card style={{ backgroundColor: colors.status.successLight, padding: 16, marginBottom: 24, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.status.success, marginBottom: 4 }}>
                Bluetooth demo payment accepted offline
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.status.success }}>
                Sync when internet is available
              </Text>
            </Card>
            <Button
              variant="cta"
              label="Back to Wallet"
              onPress={() => router.push('/(tabs)/wallet')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}