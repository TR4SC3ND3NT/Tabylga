import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService } from '../../services/paymentService';

const AMOUNTS = [500, 1000, 3000, 5000];

export default function ActivateOfflineScreen() {
  const router = useRouter();
  const [availableOnline, setAvailableOnline] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paymentService.getWallet().then(w => setAvailableOnline(w.availableOnline));
  }, []);

  const handleActivate = async () => {
    const finalAmount = amount || parseInt(customAmount, 10);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Error', 'Please select or enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await paymentService.activateOfflineReserve(finalAmount);
      Alert.alert('KICB Demo tokens issued', `Offline Pay is ready.\nReserve: ${finalAmount} KGS`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to activate offline reserve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 8 }}>
          Activate Offline Pay
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.secondary, marginBottom: 24, lineHeight: 20 }}>
          Reserve part of your balance before going to remote places. KICB Demo will issue signed offline tokens for this reserve.
        </Text>

        <Card style={{ padding: 16, backgroundColor: colors.brand.primaryLight, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary }}>Current Available Online</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.brand.primary, marginTop: 4 }}>{availableOnline} KGS</Text>
        </Card>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          Select Reserve Amount (KGS)
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
          Custom Reserve Amount
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

        <Button
          variant="cta"
          label={loading ? 'Processing...' : `Reserve Balance`}
          onPress={handleActivate}
          disabled={loading || (!amount && !customAmount) || (amount || parseInt(customAmount, 10)) > availableOnline}
        />
      </ScrollView>
    </SafeAreaView>
  );
}