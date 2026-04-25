import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Store, QrCode } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService } from '../../services/paymentService';
import { PaymentMerchant } from '../../data/paymentMerchants';

export default function PayOnlineScreen() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<PaymentMerchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paymentService.getOnlineQRMerchants().then(setMerchants);
  }, []);

  const handlePay = async () => {
    const finalAmount = parseInt(amount, 10);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedMerchant) {
      Alert.alert('Error', 'Please select a merchant');
      return;
    }

    setLoading(true);
    try {
      await paymentService.payOnlineQR({ merchantId: selectedMerchant, amount: finalAmount });
      Alert.alert('Payment Successful', `Paid ${finalAmount} KGS online.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 16 }}>
          Online QR Payment
        </Text>

        {/* Mock Scanner Box */}
        <View style={{ height: 200, backgroundColor: '#000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <QrCode size={64} color="rgba(255,255,255,0.5)" />
          <Text style={{ fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>
            Simulating Camera Scanner...
          </Text>
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          Select Merchant (Demo)
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {merchants.map(m => (
            <Button
              key={m.id}
              variant={selectedMerchant === m.id ? 'primary' : 'secondary'}
              label={m.name}
              onPress={() => setSelectedMerchant(m.id)}
              icon={<Store size={18} color={selectedMerchant === m.id ? '#fff' : colors.brand.primary} />}
            />
          ))}
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 8 }}>
          Amount (KGS)
        </Text>
        <Card style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <TextInput
            placeholder="Enter amount to pay"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            style={{
              fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary,
              padding: 16,
            }}
          />
        </Card>

        <Button
          variant="cta"
          label={loading ? 'Processing...' : `Confirm Payment`}
          onPress={handlePay}
          disabled={loading || !selectedMerchant || !amount}
        />
      </ScrollView>
    </SafeAreaView>
  );
}