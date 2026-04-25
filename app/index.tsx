import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';

export default function Index() {
  const { isAuthenticated, guestSessionId, _hydrated: authHydrated } = useAuthStore();
  const { _hydrated: onboardingHydrated } = useOnboardingStore();

  if (!authHydrated || !onboardingHydrated) {
    // _layout.tsx is still initialising — keep native splash visible
    return null;
  }

  if (isAuthenticated || guestSessionId) return <Redirect href="/(tabs)" />;
  return <Redirect href="/welcome" />;
}
