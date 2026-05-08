import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Map, Route, Sparkles, WifiOff } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { Button } from '../components/Button';
import { KyrgyzBackdrop } from '../components/KyrgyzBackdrop';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useTripStore } from '../stores/tripStore';

const CARDS = [
  {
    title: 'Personalized routes',
    body: 'Build a trip around your budget, comfort level and travel style.',
    icon: Route,
  },
  {
    title: 'Everything in one plan',
    body: 'Hotels, food, transport and activities are connected to your route.',
    icon: Map,
  },
  {
    title: 'Offline-ready',
    body: 'Save your route, contacts and key details before going to the mountains.',
    icon: WifiOff,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startGuestSession = useAuthStore((state) => state.startGuestSession);
  const completeWelcome = useOnboardingStore((state) => state.completeWelcome);
  const setEntryMode = useTripStore((state) => state.setEntryMode);

  async function begin(route: '/trip/quiz' | '/trip/ready' | '/(tabs)', mode?: 'ai' | 'ready') {
    await startGuestSession();
    await completeWelcome();
    if (mode) setEntryMode(mode);
    router.replace(route);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <KyrgyzBackdrop height={360} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 18) + 24,
        }}
      >
        <View
          style={{
            borderRadius: 30,
            padding: 22,
            backgroundColor: colors.surface.inverse,
            minHeight: 240,
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}
        >
          <View pointerEvents="none" style={{ position: 'absolute', right: -58, top: 22, width: 180, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,79,123,0.36)', transform: [{ rotate: '-18deg' }] }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: -52, bottom: 28, width: 196, height: 34, borderRadius: 17, backgroundColor: 'rgba(24,200,184,0.28)', transform: [{ rotate: '18deg' }] }} />
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
            }}
          >
            <Sparkles size={28} color={colors.accent.lemon} strokeWidth={1.7} />
          </View>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 36, lineHeight: 42, color: '#fff' }}>
            Welcome to Tabylga
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.78)', marginTop: 10 }}>
            Build a Kyrgyzstan route that actually works — with stays, food, transport and activities connected into one plan.
          </Text>
        </View>

        <View style={{ gap: 12, marginTop: 20 }}>
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <View
                key={card.title}
                style={{
                  borderRadius: 18,
                  padding: 16,
                  backgroundColor: colors.surface.card,
                  borderWidth: 1,
                  borderColor: colors.border.divider,
                  flexDirection: 'row',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: colors.brand.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={colors.brand.primary} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text.primary }}>
                    {card.title}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 4 }}>
                    {card.body}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ gap: 10, marginTop: 26 }}>
          <Button
            label="Plan my trip"
            icon={<Sparkles size={19} color="#fff" strokeWidth={2} />}
            onPress={() => begin('/trip/quiz', 'ai')}
          />
          <Button
            variant="secondary"
            label="Explore ready trips"
            onPress={() => begin('/trip/ready', 'ready')}
          />
          <Button
            variant="ghost"
            label="Continue as guest"
            onPress={() => begin('/(tabs)')}
          />
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
