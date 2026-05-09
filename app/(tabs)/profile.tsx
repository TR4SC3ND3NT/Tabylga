import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  User, ChevronRight, Globe, CreditCard, Bell, Shield,
  Star, Users, Gift, Headphones, Info, Lock, Store, CheckCircle,
  Briefcase, Wifi,
} from 'lucide-react-native';
import { LANGUAGE_OPTIONS, formatString } from '../../lib/strings';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { KyrgyzBackdrop } from '../../components/KyrgyzBackdrop';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const [showLanguages, setShowLanguages] = useState(false);
  const language = useAuthStore(s => s.language);
  const setLanguage = useAuthStore(s => s.setLanguage);
  const signOut = useAuthStore(s => s.signOut);
  const currentLanguage = LANGUAGE_OPTIONS.find((item) => item.code === language) ?? LANGUAGE_OPTIONS[0];
  const groups = [
    [
      { key: 'language',   icon: Globe,       label: strings.profileExtra.settingsLanguage,  onPress: () => setShowLanguages((value) => !value) },
      { key: 'esim',       icon: Wifi,        label: strings.profileExtra.settingsEsim, onPress: () => router.push('/tools/esim') },
      { key: 'payment',    icon: CreditCard,  label: strings.profileExtra.settingsPayment,  onPress: () => {} },
      { key: 'notif',      icon: Bell,        label: strings.profileExtra.settingsNotifications, onPress: () => {} },
      { key: 'security',   icon: Shield,      label: strings.profileExtra.settingsSecurity, onPress: () => {} },
    ],
    [
      { key: 'ratings',    icon: Star,        label: strings.profileExtra.settingsRatings,  onPress: () => {} },
      { key: 'collab',     icon: Users,       label: strings.profileExtra.settingsCollaborative, onPress: () => router.push('/trip/group-match') },
      { key: 'referrals',  icon: Gift,        label: strings.profileExtra.settingsReferrals, onPress: () => {} },
    ],
    [
      { key: 'help',       icon: Headphones,  label: strings.profileExtra.settingsHelp,     onPress: () => {} },
      { key: 'about',      icon: Info,        label: strings.profileExtra.settingsAbout,    onPress: () => {} },
      { key: 'privacy',    icon: Lock,        label: strings.profileExtra.settingsPrivacy,  onPress: () => {} },
    ],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <KyrgyzBackdrop height={220} />
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + 6,
          paddingBottom: Math.max(insets.bottom, 16) + 88,
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar + name */}
        <View style={{ alignItems:'center', marginHorizontal:16, paddingTop:22, paddingBottom:20, paddingHorizontal:18, borderRadius:24, backgroundColor:'rgba(255,255,255,0.88)', borderWidth:1, borderColor:'rgba(255,255,255,0.72)', marginBottom:16 }}>
          <View style={{ width:84, height:84, borderRadius:42, backgroundColor: colors.brand.primaryLight, alignItems:'center', justifyContent:'center', marginBottom:12, borderWidth:3, borderColor:colors.surface.card }}>
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
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:colors.text.secondary, marginTop:2 }}>{formatString(strings.profileExtra.tripsCount, { upcoming: 3, past: 12 })}</Text>
          </View>
          <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.5} />
        </Pressable>

        {/* Settings groups */}
        {groups.map((group, gi) => (
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

        {showLanguages && (
          <View style={{ marginHorizontal:16, borderRadius:16, backgroundColor:colors.surface.card, borderWidth:1, borderColor:colors.border.divider, overflow:'hidden', marginBottom:12 }}>
            <View style={{ paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
              <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>
                {strings.profileExtra.languagePickerTitle}
              </Text>
              <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }}>
                {formatString(strings.profileExtra.currentLanguage, { language: currentLanguage.native })}
              </Text>
            </View>
            {LANGUAGE_OPTIONS.map((item, index) => {
              const selected = item.code === language;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setLanguage(item.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    flexDirection:'row', alignItems:'center', gap:12,
                    paddingHorizontal:16, minHeight:48,
                    borderBottomWidth: index < LANGUAGE_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border.divider,
                    backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ width:28, fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.secondary }}>{item.flag}</Text>
                  <Text style={{ flex:1, fontFamily:selected ? 'Inter_600SemiBold' : 'Inter_400Regular', fontSize:15, color:selected ? colors.brand.primary : colors.text.primary }}>{item.native}</Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.tertiary }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

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
    </View>
  );
}
