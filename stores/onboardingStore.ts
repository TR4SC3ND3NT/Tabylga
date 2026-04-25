import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tabylga/onboarding';

interface OnboardingState {
  welcomeCompleted: boolean;
  _hydrated: boolean;
}

interface OnboardingActions {
  completeWelcome: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set) => ({
  welcomeCompleted: false,
  _hydrated: false,

  completeWelcome: async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ welcomeCompleted: true }));
    set({ welcomeCompleted: true });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { welcomeCompleted } = JSON.parse(raw);
        set({ welcomeCompleted: !!welcomeCompleted, _hydrated: true });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
