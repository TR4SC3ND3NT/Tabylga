import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { runMigrations } from '../lib/db/migrations';
import { seedDevData } from '../lib/db/seed';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useTravelPreferencesStore } from '../stores/travelPreferencesStore';
import { useTripStore } from '../stores/tripStore';
import { colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const hydrateTravelPreferences = useTravelPreferencesStore((s) => s.hydrate);
  const hydrateTrip = useTripStore((s) => s.hydrate);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await seedDevData();
        await hydrateAuth();
        await hydrateOnboarding();
        await hydrateTravelPreferences();
        await hydrateTrip();
      } catch (e) {
        console.error('[init] Bootstrap error:', e);
      } finally {
        setDbReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady]);

  if ((!fontsLoaded && !fontError) || !dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface.primary } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="auth/phone" />
          <Stack.Screen name="auth/otp" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="merchant" />
          <Stack.Screen name="services" />
          <Stack.Screen name="tools" />
          <Stack.Screen name="offline-pack" />
          <Stack.Screen name="rating" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
