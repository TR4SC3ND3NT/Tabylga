import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bluetooth, CheckCircle2, Clock } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { createOfflineBluetoothPayment } from '../../lib/backend/demoBackend';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

const MERCHANTS = [
  { id: 'm1', name: "Nomad's Yurt Camp", amountUsd: 65, distance: '12 m' },
  { id: 'm2', name: 'Ala-Archa Gate', amountUsd: 3, distance: '31 m' },
  { id: 'm3', name: 'Local Guide Bakyt', amountUsd: 25, distance: '44 m' },
];

export default function BluetoothPayScreen() {
  const router = useRouter();
  const strings = useStrings();
  const [selectedMerchant, setSelectedMerchant] = useState(MERCHANTS[0]);
  const [payment, setPayment] = useState<ReturnType<typeof createOfflineBluetoothPayment> | null>(null);

  function handleSign() {
    setPayment(createOfflineBluetoothPayment(selectedMerchant.amountUsd, selectedMerchant.name));
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.bluetoothPay.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:20, gap:14 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding:18, borderRadius:18, backgroundColor:colors.status.warningLight }}>
          <Bluetooth size={30} color={colors.brand.cta} strokeWidth={1.8} />
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary, marginTop:12 }}>
            {strings.bluetoothPay.title}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, lineHeight:21, color:colors.text.secondary, marginTop:6 }}>
            {strings.bluetoothPay.subtitle}
          </Text>
        </View>

        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Clock size={16} color={colors.brand.primary} strokeWidth={2} />
          <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:14, color:colors.text.primary }}>
            {strings.bluetoothPay.scanning}
          </Text>
        </View>

        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:16, color:colors.text.primary }}>
          {strings.bluetoothPay.nearby}
        </Text>

        {MERCHANTS.map((merchant) => {
          const selected = selectedMerchant.id === merchant.id;
          return (
            <Pressable
              key={merchant.id}
              onPress={() => {
                setSelectedMerchant(merchant);
                setPayment(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card style={{ padding:16, borderWidth:selected ? 2 : 1, borderColor:selected ? colors.brand.primary : colors.border.divider }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                  <View style={{ width:46, height:46, borderRadius:16, backgroundColor:selected ? colors.brand.primaryLight : '#F4F1EA', alignItems:'center', justifyContent:'center' }}>
                    <Bluetooth size={20} color={selected ? colors.brand.primary : colors.text.secondary} strokeWidth={2} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>{merchant.name}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:3 }}>{merchant.distance}</Text>
                  </View>
                  <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:22, color:colors.text.primary }}>${merchant.amountUsd}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}

        <Button label={strings.bluetoothPay.sign} onPress={handleSign} icon={<Bluetooth size={18} color="#fff" strokeWidth={2} />} />

        {payment && (
          <View style={{ borderRadius:18, backgroundColor:colors.brand.primaryLight, padding:16, flexDirection:'row', alignItems:'flex-start', gap:12 }}>
            <CheckCircle2 size={24} color={colors.brand.primary} strokeWidth={2} />
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>
                {strings.bluetoothPay.signed}
              </Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:4 }}>
                {payment.merchantName} · ${payment.amountUsd} · {strings.bluetoothPay.syncLater}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
