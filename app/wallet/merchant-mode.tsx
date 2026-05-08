import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Store, CheckCircle, RefreshCw } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { paymentService, OfflineToken, Transaction } from '../../services/paymentService';
import { PaymentMerchant } from '../../data/paymentMerchants';

export default function MerchantModeScreen() {
  const router = useRouter();
  const { scanPayload } = useLocalSearchParams<{ scanPayload?: string }>();
  
  const [merchants, setMerchants] = useState<PaymentMerchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  
  const [scannedToken, setScannedToken] = useState<OfflineToken | null>(null);
  const [pendingSyncTokens, setPendingSyncTokens] = useState<Transaction[]>([]);
  const [createdTokens, setCreatedTokens] = useState<OfflineToken[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const m = await paymentService.getOfflineMerchants();
    setMerchants(m);
    
    const allTokens = await paymentService.getOfflineTokens();
    setCreatedTokens(allTokens.filter(t => t.status === 'created' || t.status === 'shown_to_merchant'));
    
    const allTxs = await paymentService.getTransactions();
    setPendingSyncTokens(allTxs.filter(t => t.status === 'accepted_offline'));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (scanPayload && selectedMerchant) {
      handleScan(scanPayload);
    }
  }, [scanPayload, selectedMerchant]);

  const handleScan = async (payloadStr: string) => {
    if (!selectedMerchant) {
      Alert.alert('Merchant required', 'Please select your merchant profile before scanning.');
      return;
    }
    const res = await paymentService.merchantScanOfflineQR(payloadStr, selectedMerchant);
    if (res.success && res.token) {
      setScannedToken(res.token);
    } else {
      Alert.alert('Scan failed', res.error || 'Invalid token');
    }
  };

  const handleAccept = async () => {
    if (!scannedToken || !selectedMerchant) return;
    
    setLoading(true);
    try {
      await paymentService.merchantAcceptOfflinePayment(scannedToken.id, selectedMerchant);
      Alert.alert('Payment accepted offline', 'Customer cannot cancel this payment after acceptance.\nStatus: Pending sync', [
        { 
          text: 'OK', 
          onPress: () => {
            setScannedToken(null);
            loadData();
          } 
        }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await paymentService.syncOfflinePayments();
      Alert.alert('Payment synced', 'Settlement completed.\nMerchant will receive the amount through partner settlement.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  if (scannedToken) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
        <StatusBar style="dark" />
        <ScreenHeader
          title="Offline request"
          subtitle={merchants.find(m => m.id === selectedMerchant)?.name ?? 'Merchant verification'}
          onBack={() => setScannedToken(null)}
          backTo="/(tabs)/wallet"
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <Card style={{ padding: 24, marginBottom: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.text.primary }}>
                {scannedToken.amount} {scannedToken.currency}
              </Text>
            </View>

            <View style={{ gap: 8, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>Issued by {scannedToken.issuer}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>Signature verified</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>Reserve-backed token</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>One-time token</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>Not expired</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.primary }}>Receipt will be saved for sync</Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>
                Expires at: {new Date(scannedToken.expiresAt).toLocaleTimeString()}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>
                Risk: Low
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>
                Merchant: {merchants.find(m => m.id === selectedMerchant)?.name}
              </Text>
            </View>
          </Card>

          <Button
            variant="cta"
            label={loading ? 'Accepting...' : 'Accept payment'}
            onPress={handleAccept}
            disabled={loading}
          />
          <Button
            variant="secondary"
            label="Cancel"
            onPress={() => setScannedToken(null)}
            style={{ marginTop: 12 }}
            disabled={loading}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScreenHeader
        title="Merchant Mode"
        subtitle="Accept offline payments"
        backTo="/(tabs)/wallet"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          1. Select Merchant Profile
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

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          2. Scan Customer Offline QR
        </Text>
        <Card style={{ padding: 16, marginBottom: 24 }}>
          {createdTokens.length === 0 ? (
            <Text style={{ fontFamily: 'Inter_400Regular', color: colors.text.tertiary, textAlign: 'center' }}>
              No QR tokens generated by tourist yet.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {createdTokens.map(token => (
                <View key={token.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{token.amount} {token.currency}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>{new Date(token.createdAt).toLocaleTimeString()}</Text>
                  </View>
                  <Button
                    variant="cta"
                    label="Scan QR"
                    onPress={() => handleScan(token.qrPayload)}
                    style={{ paddingHorizontal: 12, height: 36 }}
                    fontSize={12}
                    disabled={!selectedMerchant}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
          3. Pending Sync (Accepted Offline)
        </Text>
        <Card style={{ padding: 16, marginBottom: 24 }}>
          {pendingSyncTokens.length === 0 ? (
            <Text style={{ fontFamily: 'Inter_400Regular', color: colors.text.tertiary, textAlign: 'center' }}>
              No pending payments.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {pendingSyncTokens.map(tx => (
                <View key={tx.id} style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.text.primary }}>{tx.amount} {tx.currency}</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.status.warning }}>Pending</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>Merchant: {tx.merchantName}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary }}>Receipt: {tx.receiptCode}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary }}>Accepted: {tx.acceptedAt ? new Date(tx.acceptedAt).toLocaleString() : ''}</Text>
                </View>
              ))}
              <Button
                variant="primary"
                label={loading ? 'Syncing...' : 'Sync when online'}
                onPress={handleSync}
                icon={<RefreshCw size={16} color="#fff" />}
                style={{ marginTop: 12 }}
                disabled={loading}
              />
            </View>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
