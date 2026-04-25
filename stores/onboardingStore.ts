import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tabylga/onboarding';

interface OnboardingState {
  welcomeCompleted: boolean;
  preferencesCompleted: boolean;
  _hydrated: boolean;
}

interface OnboardingActions {
  completeWelcome: () => Promise<void>;
  completePreferences: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set) => ({
  welcomeCompleted: false,
  preferencesCompleted: false,
  _hydrated: false,

  completeWelcome: async () => {
    await AsyncStorage.mergeItem(STORAGE_KEY, JSON.stringify({ welcomeCompleted: true }));
    set({ welcomeCompleted: true });
  },

  completePreferences: async () => {
    await AsyncStorage.mergeItem(STORAGE_KEY, JSON.stringify({ preferencesCompleted: true }));
    set({ preferencesCompleted: true });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { welcomeCompleted, preferencesCompleted } = JSON.parse(raw);
        set({
          welcomeCompleted: !!welcomeCompleted,
          preferencesCompleted: !!preferencesCompleted,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
