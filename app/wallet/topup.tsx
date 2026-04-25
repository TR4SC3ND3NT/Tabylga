import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { CreditCard, QrCode } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService } from '../../services/paymentService';

const AMOUNTS = [500, 1000, 3000, 5000];

export default function TopUpScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState<'card_demo' | 'online_qr_demo'>('card_demo');
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    const finalAmount = amount || parseInt(customAmount, 10);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Error', 'Please select or enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await paymentService.topUpWallet(finalAmount, method);
      Alert.alert('Success', `Topped up ${finalAmount} KGS successfully.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Top up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 16 }}>
          Top Up Wallet
        </Text>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          Select Amount (KGS)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {AMOUNTS.map(amt => (
            <Button
              key={amt}
              variant={amount === amt ? 'primary' : 'secondary'}
              label={`${amt}`}
              onPress={() => { setAmount(amt); setCustomAmount(''); }}
              style={{ flexBasis: '48%', flexGrow: 1 }}
            />
          ))}
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 8 }}>
          Custom Amount
        </Text>
        <Card style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <TextInput
            placeholder="Enter custom amount"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={t => { setCustomAmount(t); setAmount(null); }}
            style={{
              fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text.primary,
              padding: 16,
            }}
          />
        </Card>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          Payment Method
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          <Button
            variant={method === 'card_demo' ? 'primary' : 'secondary'}
            label="International Card Demo"
            onPress={() => setMethod('card_demo')}
            icon={<CreditCard size={18} color={method === 'card_demo' ? '#fff' : colors.brand.primary} />}
          />
          <Button
            variant={method === 'online_qr_demo' ? 'primary' : 'secondary'}
            label="Local QR Demo"
            onPress={() => setMethod('online_qr_demo')}
            icon={<QrCode size={18} color={method === 'online_qr_demo' ? '#fff' : colors.brand.primary} />}
          />
        </View>

        {method === 'card_demo' && (
          <Card style={{ padding: 16, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.primary, marginBottom: 12 }}>
              Fake Card Form
            </Text>
            <TextInput
              placeholder="Card Number (Demo)"
              value="4111 1111 1111 1111"
              editable={false}
              style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 10 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                placeholder="MM/YY"
                value="12/25"
                editable={false}
                style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, flex: 1 }}
              />
              <TextInput
                placeholder="CVC"
                value="123"
                editable={false}
                style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, flex: 1 }}
              />
            </View>
          </Card>
        )}

        <Button
          variant="cta"
          label={loading ? 'Processing...' : `Confirm Top Up`}
          onPress={handleTopUp}
          disabled={loading || (!amount && !customAmount)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}