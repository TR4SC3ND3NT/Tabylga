import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, QrCode, WifiOff, Store, RefreshCw, SmartphoneNfc } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { paymentService, Wallet, Transaction } from '../../services/paymentService';
import { TransactionHistory } from '../../components/wallet/TransactionHistory';

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const w = await paymentService.getWallet();
    const t = await paymentService.getTransactions();
    setWallet(w);
    setTransactions(t);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!wallet) return null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 py-4">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.text.primary, marginBottom: 16 }}>
            Tabylga Wallet
          </Text>

          {/* ── Explanation Card ── */}
          <Card style={{ padding: 16, backgroundColor: colors.brand.primaryLight, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary, lineHeight: 18 }}>
              Offline Mountain Pay lets you reserve money before going to remote areas. When there is no internet, you can pay verified merchants with a KICB Demo signed QR or Bluetooth token.
            </Text>
          </Card>

          {/* ── Balances ── */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <Card style={{ padding: 16, flexBasis: '47%', flexGrow: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Total balance</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.text.primary, marginTop: 4 }}>{wallet.totalBalance} KGS</Text>
            </Card>
            
            <Card style={{ padding: 16, flexBasis: '47%', flexGrow: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Available online</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.status.success, marginTop: 4 }}>{wallet.availableOnline} KGS</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.text.tertiary, marginTop: 4 }}>Can be used for online QR payments.</Text>
            </Card>

            <Card style={{ padding: 16, flexBasis: '47%', flexGrow: 1, backgroundColor: colors.status.warningLight }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8a6530' }}>Offline reserve</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#5a3a00', marginTop: 4 }}>{wallet.offlineReserve} KGS</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#8a6530', marginTop: 4 }}>Reserved for offline payments before going to remote areas.</Text>
            </Card>

            <Card style={{ padding: 16, flexBasis: '47%', flexGrow: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Locked offline</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.text.primary, marginTop: 4 }}>{wallet.lockedOffline} KGS</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.text.tertiary, marginTop: 4 }}>Payments already created and waiting for merchant/sync.</Text>
            </Card>

            <Card style={{ padding: 16, flexBasis: '100%', flexGrow: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary }}>Pending sync</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.brand.primary, marginTop: 4 }}>{wallet.pendingSync} KGS</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.text.tertiary, marginTop: 4 }}>Accepted offline payments waiting for internet.</Text>
            </Card>
          </View>

          {/* ── Action buttons ── */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
            Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            <Button
              variant="primary"
              label="Top up"
              onPress={() => router.push('/wallet/topup')}
              icon={<Plus size={16} color="#fff" strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
            <Button
              variant="secondary"
              label="Pay Online QR"
              onPress={() => router.push('/wallet/pay')}
              icon={<QrCode size={16} color={colors.brand.primary} strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
            <Button
              variant="cta"
              label="Activate Offline Pay"
              onPress={() => router.push('/wallet/activate-offline')}
              icon={<WifiOff size={16} color="#fff" strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
            <Button
              variant="secondary"
              label="Pay Offline"
              onPress={() => router.push('/wallet/pay-offline')}
              icon={<SmartphoneNfc size={16} color={colors.brand.primary} strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
            <Button
              variant="secondary"
              label="Merchant Mode"
              onPress={() => router.push('/wallet/merchant-mode')}
              icon={<Store size={16} color={colors.text.secondary} strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
            <Button
              variant="secondary"
              label="Sync Payments"
              onPress={() => router.push('/wallet/merchant-mode')}
              icon={<RefreshCw size={16} color={colors.brand.primary} strokeWidth={2} />}
              style={{ flexBasis: '48%', flexGrow: 1 }}
              fontSize={13}
            />
          </View>

          {/* ── Safety Explanation ── */}
          <Card style={{ padding: 16, backgroundColor: '#f9f9f9', marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginBottom: 8, lineHeight: 18 }}>
              Offline payments are backed by reserved balance. After a merchant accepts a token, the customer cannot cancel it.
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.text.tertiary, lineHeight: 16 }}>
              In production, offline tokens would be issued and settled by a licensed banking partner. This prototype uses KICB Demo tokens.
            </Text>
          </Card>

          {/* ── Transactions ── */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.text.primary, marginBottom: 14 }}>
            Recent Transactions
          </Text>

          <TransactionHistory transactions={transactions} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}