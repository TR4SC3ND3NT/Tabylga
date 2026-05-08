import { View, Text, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Download, User } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';

const QR_VALUE = JSON.stringify({ type: 'tabylga_pay', userId: 'user_demo_001', currency: 'KGS' });

export default function ReceiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
        <Pressable onPress={() => goBackOrReplace(router, '/(tabs)/wallet')} accessibilityLabel={strings.common.back} accessibilityRole="button" style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary, flex: 1, textAlign: 'center', marginRight: 44 }}>
          {strings.walletExtra.receiveTitle}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {/* Avatar + name */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <User size={32} color={colors.brand.primary} strokeWidth={1.5} />
          </View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, color: colors.text.primary }}>{strings.walletExtra.traveler}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.secondary, marginTop: 4 }}>$1,247.00 · 108,489 KGS</Text>
        </View>

        {/* QR */}
        <View style={{ padding: 20, borderRadius: 20, backgroundColor: colors.surface.card, shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
          <QRCode
            value={QR_VALUE}
            size={220}
            color={colors.text.primary}
            backgroundColor={colors.surface.card}
          />
        </View>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginTop: 24, marginBottom: 32, lineHeight: 22 }}>
          {strings.walletExtra.receiveSubtitle}
        </Text>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <Pressable
            accessibilityLabel={strings.walletExtra.shareQr}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1, height: 52, borderRadius: 14,
              backgroundColor: colors.surface.card,
              borderWidth: 1.5, borderColor: colors.brand.primary,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Share2 size={18} color={colors.brand.primary} strokeWidth={1.5} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.brand.primary }}>
              {strings.walletExtra.shareQr}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={strings.walletExtra.saveQr}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1, height: 52, borderRadius: 14,
              backgroundColor: colors.brand.primary,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Download size={18} color="#fff" strokeWidth={1.5} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' }}>
              {strings.walletExtra.saveQr}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
