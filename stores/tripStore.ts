import { create } from 'zustand';
import { generateTrip as callGemini, type Itinerary } from '../lib/ai/generateTrip';

export type Purpose =
  | 'leisure' | 'adventure' | 'family' | 'business'
  | 'romantic' | 'cultural' | 'digital_nomad' | 'pilgrimage';

export type Companions = 'solo' | 'couple' | 'family' | 'friends' | 'colleagues';
export type ActivityLevel = 'chill' | 'moderate' | 'active' | 'extreme';
export type BudgetRange = '100-300' | '300-600' | '600-1200' | '1200+';

export type Interest =
  | 'nature' | 'culture' | 'food' | 'extreme_sports'
  | 'photography' | 'shopping' | 'wellness' | 'nightlife';

export type Dietary =
  | 'vegetarian' | 'halal' | 'vegan' | 'wheelchair' | 'family_friendly' | 'none';

export type { Itinerary };

interface TripState {
  // Purpose step
  purpose: Purpose | null;
  companions: Companions | null;
  companionCount: number;
  kidsAgeRange: string | null;

  // Quiz steps
  days: number | null;
  budget: BudgetRange | null;
  activityLevel: ActivityLevel | null;
  interests: Interest[];
  dietaryNeeds: Dietary[];

  // AI output
  generatedItinerary: Itinerary | null;
  isGenerating: boolean;
  error: string | null;
}

interface TripActions {
  setPurpose: (p: Purpose) => void;
  setCompanions: (c: Companions) => void;
  setCompanionCount: (n: number) => void;
  setKidsAgeRange: (r: string | null) => void;
  setQuizAnswer: <K extends keyof TripState>(key: K, value: TripState[K]) => void;
  toggleInterest: (interest: Interest) => void;
  toggleDietary: (dietary: Dietary) => void;
  generateTrip: () => Promise<void>;
  resetTrip: () => void;
}

const INITIAL: TripState = {
  purpose: null,
  companions: null,
  companionCount: 2,
  kidsAgeRange: null,
  days: null,
  budget: null,
  activityLevel: null,
  interests: [],
  dietaryNeeds: [],
  generatedItinerary: null,
  isGenerating: false,
  error: null,
};

export const useTripStore = create<TripState & TripActions>((set, get) => ({
  ...INITIAL,

  setPurpose: (purpose) => set({ purpose }),
  setCompanions: (companions) => set({ companions }),
  setCompanionCount: (companionCount) => set({ companionCount }),
  setKidsAgeRange: (kidsAgeRange) => set({ kidsAgeRange }),

  setQuizAnswer: (key, value) => set({ [key]: value } as Partial<TripState>),

  toggleInterest: (interest) => {
    const { interests } = get();
    const next = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest];
    set({ interests: next });
  },

  toggleDietary: (dietary) => {
    const { dietaryNeeds } = get();
    if (dietary === 'none') {
      set({ dietaryNeeds: dietaryNeeds.includes('none') ? [] : ['none'] });
      return;
    }
    const filtered = dietaryNeeds.filter((d) => d !== 'none');
    const next = filtered.includes(dietary)
      ? filtered.filter((d) => d !== dietary)
      : [...filtered, dietary];
    set({ dietaryNeeds: next });
  },

  generateTrip: async () => {
    set({ isGenerating: true, error: null });
    try {
      const state = get();
      const itinerary = await callGemini({
        purpose: state.purpose!,
        companions: state.companions!,
        companionCount: state.companionCount,
        kidsAgeRange: state.kidsAgeRange,
        days: state.days!,
        budget: state.budget!,
        activityLevel: state.activityLevel!,
        interests: state.interests,
        dietaryNeeds: state.dietaryNeeds,
      });
      set({ generatedItinerary: itinerary, isGenerating: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI generation failed.';
      set({ error: msg, isGenerating: false });
    }
  },

  resetTrip: () => set(INITIAL),
}));
