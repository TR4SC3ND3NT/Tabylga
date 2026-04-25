import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = '@tabylga/travel_preferences';

export type EsimChoice = 'later' | 'skip' | 'starter' | 'traveler' | 'nomad';

interface TravelPreferencesState {
  peopleCount: number;
  preferredTourPeople: number;
  age: number;
  esimChoice: EsimChoice;
  wantsStrangerMatch: boolean;
  _hydrated: boolean;
}

interface TravelPreferencesActions {
  setPeopleCount: (count: number) => void;
  setPreferredTourPeople: (count: number) => void;
  setAge: (age: number) => void;
  setEsimChoice: (choice: EsimChoice) => void;
  setWantsStrangerMatch: (enabled: boolean) => void;
  hydrate: () => Promise<void>;
}

const INITIAL: TravelPreferencesState = {
  peopleCount: 1,
  preferredTourPeople: 6,
  age: 29,
  esimChoice: 'later',
  wantsStrangerMatch: true,
  _hydrated: false,
};

export const useTravelPreferencesStore = create<TravelPreferencesState & TravelPreferencesActions>((set, get) => {
  async function persist() {
    const { _hydrated, ...state } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => null);
  }

  return {
    ...INITIAL,

    setPeopleCount: (peopleCount) => {
      set({ peopleCount: Math.max(1, Math.min(20, peopleCount)) });
      persist();
    },
    setPreferredTourPeople: (preferredTourPeople) => {
      set({ preferredTourPeople: Math.max(2, Math.min(30, preferredTourPeople)) });
      persist();
    },
    setAge: (age) => {
      set({ age: Math.max(18, Math.min(80, age)) });
      persist();
    },
    setEsimChoice: (esimChoice) => {
      set({ esimChoice });
      persist();
    },
    setWantsStrangerMatch: (wantsStrangerMatch) => {
      set({ wantsStrangerMatch });
      persist();
    },
    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<TravelPreferencesState>;
          set({ ...INITIAL, ...parsed, _hydrated: true });
          return;
        }
      } catch {
        // Keep defaults.
      }
      set({ _hydrated: true });
    },
  };
});
