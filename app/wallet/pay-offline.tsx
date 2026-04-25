import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SmartphoneNfc, QrCode as QrCodeIcon } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService, OfflineToken, Wallet } from '../../services/paymentService';

export default function PayOfflineScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<OfflineToken | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    paymentService.getWallet().then(setWallet);
  }, []);

  const handleGenerateQR = async () => {
    const finalAmount = parseInt(amount, 10);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!wallet || finalAmount > wallet.offlineReserve) {
      Alert.alert('Error', 'Amount exceeds offline reserve');
      return;
    }

    setLoading(true);
    try {
      const generatedToken = await paymentService.createOfflineCustomerQRPayment(finalAmount);
      setToken(generatedToken);
      const w = await paymentService.getWallet();
      setWallet(w);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) return null;

  if (token) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 24, textAlign: 'center' }}>
            Offline Payment Token
          </Text>

          <Card style={{ alignItems: 'center', padding: 24, marginBottom: 24 }}>
            <View style={{ height: 200, width: 200, backgroundColor: '#f0f0f0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <QRCode value={token.qrPayload} size={150} color={colors.text.primary} backgroundColor="#f0f0f0" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.text.primary, marginBottom: 8 }}>
              {token.amount} {token.currency}
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.status.success, marginBottom: 4 }}>
              Issuer: {token.issuer}
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.status.success, marginBottom: 4 }}>
              Signature: verified (ready)
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.secondary, marginBottom: 4 }}>
              Status: Waiting for merchant scan
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.tertiary, marginBottom: 4 }}>
              Expires at: {new Date(token.expiresAt).toLocaleTimeString()}
            </Text>
          </Card>

          <Button
            variant="cta"
            label="Simulate merchant scan"
            onPress={() => {
              router.push({
                pathname: '/wallet/merchant-mode',
                params: { scanPayload: token.qrPayload }
              });
            }}
            icon={<QrCodeIcon size={18} color="#fff" />}
            style={{ marginBottom: 12 }}
          />

          <Button
            variant="secondary"
            label="Send via Bluetooth demo"
            onPress={() => {
              router.push({
                pathname: '/wallet/bluetooth',
                params: { tokenId: token.id }
              });
            }}
            icon={<SmartphoneNfc size={18} color={colors.brand.primary} />}
            style={{ marginBottom: 12 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 8 }}>
          Pay Offline
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.secondary, marginBottom: 24, lineHeight: 20 }}>
          Use this when you have no internet. Enter the merchant's amount and generate a KICB Demo signed QR.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <Card style={{ flex: 1, padding: 16, backgroundColor: colors.status.warningLight }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8a6530' }}>Offline Reserve</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#5a3a00', marginTop: 4 }}>{wallet.offlineReserve} KGS</Text>
          </Card>
          <Card style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Locked Offline</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text.primary, marginTop: 4 }}>{wallet.lockedOffline} KGS</Text>
          </Card>
          <Card style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Pending Sync</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text.primary, marginTop: 4 }}>{wallet.pendingSync} KGS</Text>
          </Card>
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 8 }}>
          Amount (KGS)
        </Text>
        <Card style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <TextInput
            placeholder="Enter merchant's amount"
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
          label={loading ? 'Generating...' : `Generate QR`}
          onPress={handleGenerateQR}
          disabled={loading || !amount || parseInt(amount, 10) > wallet.offlineReserve}
        />
      </ScrollView>
    </SafeAreaView>
  );
}