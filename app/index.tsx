import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';

export default function Index() {
  const { isAuthenticated, _hydrated: authHydrated } = useAuthStore();
  const { welcomeCompleted, preferencesCompleted, _hydrated: onboardingHydrated } = useOnboardingStore();

  if (!authHydrated || !onboardingHydrated) {
    // _layout.tsx is still initialising — keep native splash visible
    return null;
  }

  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  if (!welcomeCompleted) return <Redirect href="/splash" />;
  if (!preferencesCompleted) return <Redirect href="/preferences" />;
  return <Redirect href="/auth/phone" />;
}
