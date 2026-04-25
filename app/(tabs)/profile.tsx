import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  User, ChevronRight, Globe, CreditCard, Bell, Shield,
  Star, Users, Gift, Headphones, Info, Lock, Store, CheckCircle,
  Briefcase,
} from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';

const GROUPS = [
  [
    { key: 'language',   icon: Globe,       label: strings.profileExtra.settingsLanguage,  onPress: () => {} },
    { key: 'payment',    icon: CreditCard,  label: strings.profileExtra.settingsPayment,  onPress: () => {} },
    { key: 'notif',      icon: Bell,        label: strings.profileExtra.settingsNotifications, onPress: () => {} },
    { key: 'security',   icon: Shield,      label: strings.profileExtra.settingsSecurity, onPress: () => {} },
  ],
  [
    { key: 'ratings',    icon: Star,        label: strings.profileExtra.settingsRatings,  onPress: () => {} },
    { key: 'collab',     icon: Users,       label: strings.profileExtra.settingsCollaborative, onPress: () => {} },
    { key: 'referrals',  icon: Gift,        label: strings.profileExtra.settingsReferrals, onPress: () => {} },
  ],
  [
    { key: 'help',       icon: Headphones,  label: strings.profileExtra.settingsHelp,     onPress: () => {} },
    { key: 'about',      icon: Info,        label: strings.profileExtra.settingsAbout,    onPress: () => {} },
    { key: 'privacy',    icon: Lock,        label: strings.profileExtra.settingsPrivacy,  onPress: () => {} },
  ],
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore(s => s.signOut);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 80 }} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View className="items-center pt-6 pb-6 px-5">
          <View style={{ width:80, height:80, borderRadius:40, backgroundColor: colors.brand.primaryLight, alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <User size={40} color={colors.brand.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary }}>Sarah Müller</Text>
            <CheckCircle size={18} color={colors.status.success} fill={colors.status.success} strokeWidth={0} />
          </View>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, color:colors.text.secondary, marginTop:4 }}>
            Germany 🇩🇪
          </Text>
        </View>

        {/* Trips shortcut */}
        <Pressable
          onPress={() => router.push('/(tabs)/trips')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginHorizontal:16, borderRadius:16, backgroundColor:colors.surface.card,
            borderWidth:1, borderColor:colors.border.divider,
            flexDirection:'row', alignItems:'center', gap:14, padding:16, marginBottom:20,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ width:44, height:44, borderRadius:12, backgroundColor:colors.brand.primaryLight, alignItems:'center', justifyContent:'center' }}>
            <Briefcase size={22} color={colors.brand.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>{strings.profileExtra.tripsShortcut}</Text>
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:2 }}>3 upcoming · 12 past</Text>
          </View>
          <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.5} />
        </Pressable>

        {/* Settings groups */}
        {GROUPS.map((group, gi) => (
          <View key={gi} style={{ marginHorizontal:16, borderRadius:16, backgroundColor:colors.surface.card, borderWidth:1, borderColor:colors.border.divider, overflow:'hidden', marginBottom:12 }}>
            {group.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection:'row', alignItems:'center', gap:14,
                    paddingHorizontal:16, minHeight:52,
                    borderBottomWidth: i < group.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border.divider,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon size={20} color={colors.text.secondary} strokeWidth={1.5} />
                  <Text style={{ flex:1, fontFamily:'Inter_400Regular', fontSize:15, color:colors.text.primary }}>{item.label}</Text>
                  <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Merchant mode */}
        <View style={{ marginHorizontal:16, borderRadius:16, backgroundColor:colors.surface.card, borderWidth:1, borderColor:colors.border.divider, overflow:'hidden', marginBottom:20 }}>
          <Pressable
            onPress={() => router.push('/merchant/dashboard')}
            accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, minHeight:52, opacity: pressed ? 0.7 : 1 })}
          >
            <Store size={20} color={colors.brand.cta} strokeWidth={1.5} />
            <Text style={{ flex:1, fontFamily:'Inter_500Medium', fontSize:15, color:colors.brand.cta }}>{strings.profileExtra.settingsMerchant}</Text>
            <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={() => signOut()}
          accessibilityRole="button"
          style={({ pressed }) => ({ marginHorizontal:16, height:52, borderRadius:14, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ fontFamily:'Inter_500Medium', fontSize:15, color:colors.status.error }}>{strings.profile.signOut}</Text>
        </Pressable>

        <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.tertiary, textAlign:'center', marginTop:20 }}>
          {strings.profileExtra.version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
