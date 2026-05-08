import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  DEFAULT_TRIP_PREFERENCES,
  STORAGE_KEYS,
  STORAGE_VERSION,
  normalizeTravelerCount,
  type BudgetTier,
  type ExperienceKey,
  type PlannerActivityLevel,
  type ReadyTrip,
  type RequirementKey,
  type StartPoint,
  type Stay,
  type StayPreference,
  type TravelersType,
  type TravelStyle,
  type TripDays,
  type TripPreferences,
} from '../lib/data/tripPlaces';
import {
  runAiPlannerTurn,
  type AiPlannerMessage,
} from '../lib/ai/geminiTripPlanner';
import {
  changeFood as generatorChangeFood,
  changeStay as generatorChangeStay,
  changeTransport as generatorChangeTransport,
  bookStay as generatorBookStay,
  generateTrip as buildTrip,
  lockTripDemo as generatorLockTrip,
  makeTripCheaper,
  makeTripMoreActive,
  makeTripMoreComfortable,
  regenerateDay as generatorRegenerateDay,
  replaceActivity as generatorReplaceActivity,
  updateActivity as generatorUpdateActivity,
  updateFood as generatorUpdateFood,
  updateStay as generatorUpdateStay,
  updateTransport as generatorUpdateTransport,
  type GeneratedTrip,
} from '../lib/trip/tripGenerator';

export type Purpose = TravelStyle;
export type Companions = TravelersType;
export type ActivityLevel = PlannerActivityLevel;
export type BudgetRange = BudgetTier;
export type Interest = string;
export type Dietary = RequirementKey;
export type Itinerary = GeneratedTrip;
export type EntryMode = 'ai' | 'ready' | null;
export type { AiPlannerMessage };

const AI_PLANNER_CHAT_KEY = 'tabylga_ai_planner_chat';

interface OfflinePack {
  id: string;
  tripId: string;
  createdAt: number;
  checklist: string[];
}

interface TripState {
  entryMode: EntryMode;
  selectedPresetId: string | null;
  preferences: TripPreferences;
  generatedItinerary: GeneratedTrip | null;
  undoTrip: GeneratedTrip | null;
  lastEditLabel: string | null;
  offlinePack: OfflinePack | null;
  aiPlannerMessages: AiPlannerMessage[];
  isAiPlannerThinking: boolean;
  isGenerating: boolean;
  error: string | null;
  hydrated: boolean;

  purpose: Purpose | null;
  companions: Companions | null;
  companionCount: number;
  kidsAgeRange: string | null;
  days: TripDays;
  budget: BudgetRange;
  activityLevel: ActivityLevel;
  interests: Interest[];
  dietaryNeeds: Dietary[];
}

interface TripActions {
  hydrate: () => Promise<void>;
  setEntryMode: (mode: EntryMode) => void;
  setPreferences: (preferences: TripPreferences) => void;
  patchPreferences: (patch: Partial<TripPreferences>) => void;
  applyPreset: (preset: ReadyTrip | TripPreferences, mode?: EntryMode) => void;
  toggleTravelStyle: (style: TravelStyle) => void;
  setTravelersType: (type: TravelersType) => void;
  setTravelerCount: (count: number) => void;
  toggleExperience: (experience: ExperienceKey) => void;
  toggleRequirement: (requirement: RequirementKey) => void;
  sendAiPlannerMessage: (text: string) => Promise<void>;
  applyAiPlannerPatch: (patch: Partial<TripPreferences>, label: string) => Promise<void>;
  clearAiPlannerChat: () => Promise<void>;
  generateTrip: () => Promise<void>;
  changeStay: (dayNumber: number) => void;
  updateStay: (dayNumber: number, stayId: string) => void;
  bookStay: (dayNumber: number, stayId: string) => void;
  changeTransport: (dayNumber: number) => void;
  updateTransport: (dayNumber: number, transportId: string) => void;
  changeFood: (dayNumber: number) => void;
  updateFood: (dayNumber: number, foodId: string) => void;
  replaceActivity: (dayNumber: number, activityId: string) => void;
  updateActivity: (dayNumber: number, currentActivityId: string, nextActivityId: string) => void;
  regenerateDay: (dayNumber: number) => void;
  makeCheaper: () => void;
  makeMoreActive: () => void;
  makeMoreComfortable: () => void;
  undoLastEdit: () => void;
  clearUndo: () => void;
  saveOfflinePack: () => Promise<OfflinePack | null>;
  lockTripDemo: () => Promise<void>;
  resetTrip: () => void;
  resetGeneratedTrip: () => void;

  setPurpose: (purpose: Purpose) => void;
  setCompanions: (companions: Companions) => void;
  setCompanionCount: (count: number) => void;
  setKidsAgeRange: (range: string | null) => void;
  setQuizAnswer: (key: keyof TripState, value: TripState[keyof TripState]) => void;
  toggleInterest: (interest: Interest) => void;
  toggleDietary: (dietary: Dietary) => void;
}

function validTrip(value: unknown): value is GeneratedTrip {
  return !!value && typeof value === 'object' && Array.isArray((value as GeneratedTrip).dailyPlans);
}

function normalizePreferences(preferences: TripPreferences): TripPreferences {
  return {
    ...DEFAULT_TRIP_PREFERENCES,
    ...preferences,
    travelerCount: normalizeTravelerCount(preferences.travelersType ?? DEFAULT_TRIP_PREFERENCES.travelersType, preferences.travelerCount),
    travelStyles: preferences.travelStyles ?? [],
    experiences: preferences.experiences ?? [],
    requirements: preferences.requirements?.length ? preferences.requirements : ['none'],
  };
}

function aliases(preferences: TripPreferences): Pick<
  TripState,
  'purpose' | 'companions' | 'companionCount' | 'kidsAgeRange' | 'days' | 'budget' | 'activityLevel' | 'interests' | 'dietaryNeeds'
> {
  return {
    purpose: preferences.travelStyles[0] ?? null,
    companions: preferences.travelersType,
    companionCount: preferences.travelerCount,
    kidsAgeRange: null,
    days: preferences.days,
    budget: preferences.budgetTier,
    activityLevel: preferences.activityLevel,
    interests: preferences.experiences,
    dietaryNeeds: preferences.requirements,
  };
}

function baseState(preferences: TripPreferences = DEFAULT_TRIP_PREFERENCES): TripState {
  const normalized = normalizePreferences(preferences);
  return {
    entryMode: null,
    selectedPresetId: null,
    preferences: normalized,
    generatedItinerary: null,
    undoTrip: null,
    lastEditLabel: null,
    offlinePack: null,
    aiPlannerMessages: [],
    isAiPlannerThinking: false,
    isGenerating: false,
    error: null,
    hydrated: false,
    ...aliases(normalized),
  };
}

async function getCurrentSessionId() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}

async function ensureStorageVersion() {
  const version = await AsyncStorage.getItem(STORAGE_KEYS.version);
  if (version === STORAGE_VERSION) return;
  await AsyncStorage.multiRemove([
    '@tabylga/trip_planner_v2',
    STORAGE_KEYS.preferences,
    STORAGE_KEYS.currentTrip,
    STORAGE_KEYS.bookings,
    STORAGE_KEYS.offlinePack,
    STORAGE_KEYS.selectedPreset,
  ]);
  await AsyncStorage.setItem(STORAGE_KEYS.version, STORAGE_VERSION);
}

async function persistPreferences(preferences: TripPreferences) {
  await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

async function persistTrip(trip: GeneratedTrip | null) {
  if (!trip) {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentTrip);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEYS.currentTrip, JSON.stringify(trip));
}

async function persistAiPlannerMessages(messages: AiPlannerMessage[]) {
  await AsyncStorage.setItem(AI_PLANNER_CHAT_KEY, JSON.stringify(messages.slice(-30)));
}

function plannerMessage(role: AiPlannerMessage['role'], text: string, suggestions?: string[]): AiPlannerMessage {
  return {
    id: `ai_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
    suggestions,
  };
}

function isReadyTrip(value: ReadyTrip | TripPreferences): value is ReadyTrip {
  return 'preferences' in value && 'title' in value;
}

export const useTripStore = create<TripState & TripActions>((set, get) => {
  function commitPreferences(next: TripPreferences, extra: Partial<TripState> = {}) {
    const preferences = normalizePreferences(next);
    set({ preferences, ...aliases(preferences), ...extra });
    void persistPreferences(preferences);
    if (extra.generatedItinerary !== undefined) void persistTrip(extra.generatedItinerary ?? null);
  }

  function edit(label: string, updater: (trip: GeneratedTrip, preferences: TripPreferences) => GeneratedTrip) {
    const { generatedItinerary, preferences } = get();
    if (!generatedItinerary) return;
    const next = updater(generatedItinerary, preferences);
    set({ generatedItinerary: next, undoTrip: generatedItinerary, lastEditLabel: label });
    void persistTrip(next);
  }

  return {
    ...baseState(),

    hydrate: async () => {
      try {
        await ensureStorageVersion();
        const [prefsRaw, tripRaw, offlineRaw, presetRaw] = await AsyncStorage.multiGet([
          STORAGE_KEYS.preferences,
          STORAGE_KEYS.currentTrip,
          STORAGE_KEYS.offlinePack,
          STORAGE_KEYS.selectedPreset,
        ]);
        const chatRaw = await AsyncStorage.getItem(AI_PLANNER_CHAT_KEY);
        const sessionId = await getCurrentSessionId();
        const preferences = prefsRaw[1] ? normalizePreferences(JSON.parse(prefsRaw[1]) as TripPreferences) : DEFAULT_TRIP_PREFERENCES;
        const aiPlannerMessages = chatRaw ? (JSON.parse(chatRaw) as AiPlannerMessage[]).filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string') : [];
        let generatedItinerary: GeneratedTrip | null = null;
        if (tripRaw[1]) {
          const parsed = JSON.parse(tripRaw[1]);
          if (validTrip(parsed) && parsed.sessionId && parsed.sessionId === sessionId) generatedItinerary = parsed;
        }
        const offlinePack = offlineRaw[1] ? JSON.parse(offlineRaw[1]) as OfflinePack : null;
        set({
          entryMode: null,
          selectedPresetId: presetRaw[1] ?? null,
          preferences,
          generatedItinerary,
          offlinePack,
          aiPlannerMessages,
          isAiPlannerThinking: false,
          isGenerating: false,
          error: null,
          hydrated: true,
          ...aliases(preferences),
        });
      } catch (error) {
        console.warn('[tripStore] hydrate failed', error);
        set({ hydrated: true });
      }
    },

    setEntryMode: (entryMode) => set({ entryMode }),

    setPreferences: (preferences) => commitPreferences(preferences),

    patchPreferences: (patch) => {
      const preferences = normalizePreferences({ ...get().preferences, ...patch });
      commitPreferences(preferences);
    },

    applyPreset: (preset, mode = 'ready') => {
      const ready = isReadyTrip(preset) ? preset : null;
      const preferences: TripPreferences = ready ? ready.preferences : (preset as TripPreferences);
      set({ entryMode: mode, selectedPresetId: ready?.id ?? null, generatedItinerary: null, undoTrip: null, lastEditLabel: null });
      void AsyncStorage.setItem(STORAGE_KEYS.selectedPreset, ready?.id ?? '');
      void persistTrip(null);
      commitPreferences(preferences);
    },

    toggleTravelStyle: (style) => {
      const { preferences } = get();
      const travelStyles = preferences.travelStyles.includes(style)
        ? preferences.travelStyles.filter((item) => item !== style)
        : [...preferences.travelStyles, style];
      commitPreferences({ ...preferences, travelStyles });
    },

    setTravelersType: (travelersType) => {
      const { preferences } = get();
      commitPreferences({
        ...preferences,
        travelersType,
        travelerCount: normalizeTravelerCount(travelersType, preferences.travelerCount),
      });
    },

    setTravelerCount: (travelerCount) => {
      const { preferences } = get();
      commitPreferences({ ...preferences, travelerCount: normalizeTravelerCount(preferences.travelersType, travelerCount) });
    },

    toggleExperience: (experience) => {
      const { preferences } = get();
      const experiences = preferences.experiences.includes(experience)
        ? preferences.experiences.filter((item) => item !== experience)
        : [...preferences.experiences, experience];
      commitPreferences({ ...preferences, experiences });
    },

    toggleRequirement: (requirement) => {
      const { preferences } = get();
      if (requirement === 'none') {
        commitPreferences({ ...preferences, requirements: ['none'] });
        return;
      }
      const withoutNone = preferences.requirements.filter((item) => item !== 'none');
      const requirements = withoutNone.includes(requirement)
        ? withoutNone.filter((item) => item !== requirement)
        : [...withoutNone, requirement];
      commitPreferences({ ...preferences, requirements: requirements.length ? requirements : ['none'] });
    },

    sendAiPlannerMessage: async (text) => {
      const userText = text.trim();
      if (!userText || get().isAiPlannerThinking) return;

      const userMessage = plannerMessage('user', userText);
      const messages = [...get().aiPlannerMessages, userMessage].slice(-30);
      set({ aiPlannerMessages: messages, isAiPlannerThinking: true, error: null });
      void persistAiPlannerMessages(messages);

      try {
        const result = await runAiPlannerTurn({
          userText,
          messages,
          preferences: get().preferences,
          currentTrip: get().generatedItinerary,
        });
        const preferences = normalizePreferences({ ...get().preferences, ...result.preferencePatch });
        const sessionId = await getCurrentSessionId();
        const shouldGenerate = result.readyToGenerate || !!get().generatedItinerary || Object.keys(result.preferencePatch).length > 0;
        const generatedItinerary = shouldGenerate ? buildTrip(preferences, sessionId) : get().generatedItinerary;
        const assistantMessage = plannerMessage('assistant', result.assistantMessage, result.suggestions);
        const nextMessages = [...messages, assistantMessage].slice(-30);

        set({
          preferences,
          generatedItinerary,
          aiPlannerMessages: nextMessages,
          isAiPlannerThinking: false,
          undoTrip: null,
          lastEditLabel: result.source === 'gemini' ? 'AI planner updated your trip' : 'Planner updated your trip',
          ...aliases(preferences),
        });
        await persistPreferences(preferences);
        await persistTrip(generatedItinerary);
        await persistAiPlannerMessages(nextMessages);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI planner failed.';
        const nextMessages = [...messages, plannerMessage('assistant', message)].slice(-30);
        set({ aiPlannerMessages: nextMessages, isAiPlannerThinking: false, error: message });
        await persistAiPlannerMessages(nextMessages);
      }
    },

    applyAiPlannerPatch: async (patch, label) => {
      if (get().isAiPlannerThinking) return;
      const preferences = normalizePreferences({ ...get().preferences, ...patch });
      const sessionId = await getCurrentSessionId();
      const generatedItinerary = buildTrip(preferences, sessionId);
      const text = `${label}. Маршрут и бюджет пересчитаны.`;
      const nextMessages = [...get().aiPlannerMessages, plannerMessage('assistant', text, ['Открыть маршрут', 'Сделай дешевле', 'Добавь горы'])].slice(-30);

      set({
        preferences,
        generatedItinerary,
        aiPlannerMessages: nextMessages,
        undoTrip: null,
        lastEditLabel: 'AI edit applied',
        ...aliases(preferences),
      });
      await persistPreferences(preferences);
      await persistTrip(generatedItinerary);
      await persistAiPlannerMessages(nextMessages);
    },

    clearAiPlannerChat: async () => {
      set({ aiPlannerMessages: [], isAiPlannerThinking: false });
      await AsyncStorage.removeItem(AI_PLANNER_CHAT_KEY);
    },

    generateTrip: async () => {
      set({ isGenerating: true, error: null, undoTrip: null, lastEditLabel: null });
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const sessionId = await getCurrentSessionId();
        const generatedItinerary = buildTrip(get().preferences, sessionId);
        set({ generatedItinerary, isGenerating: false, error: null });
        await persistTrip(generatedItinerary);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Trip generation failed.';
        set({ error: message, isGenerating: false });
      }
    },

    changeStay: (dayNumber) => edit('Stay updated in your trip', (trip, preferences) => generatorChangeStay(trip, dayNumber, preferences)),
    updateStay: (dayNumber, stayId) => edit('Stay updated in your trip', (trip, preferences) => generatorUpdateStay(trip, dayNumber, stayId, preferences)),
    bookStay: (dayNumber, stayId) => edit('Stay booked in your trip', (trip, preferences) => generatorBookStay(trip, dayNumber, stayId, preferences)),
    changeTransport: (dayNumber) => edit('Transport updated in your trip', (trip, preferences) => generatorChangeTransport(trip, dayNumber, preferences)),
    updateTransport: (dayNumber, transportId) => edit('Transport updated in your trip', (trip, preferences) => generatorUpdateTransport(trip, dayNumber, transportId, preferences)),
    changeFood: (dayNumber) => edit('Food updated in your trip', (trip, preferences) => generatorChangeFood(trip, dayNumber, preferences)),
    updateFood: (dayNumber, foodId) => edit('Food updated in your trip', (trip, preferences) => generatorUpdateFood(trip, dayNumber, foodId, preferences)),
    replaceActivity: (dayNumber, activityId) => edit('Activity replaced', (trip, preferences) => generatorReplaceActivity(trip, dayNumber, activityId, preferences)),
    updateActivity: (dayNumber, currentActivityId, nextActivityId) => edit('Activity replaced', (trip, preferences) => generatorUpdateActivity(trip, dayNumber, currentActivityId, nextActivityId, preferences)),
    regenerateDay: (dayNumber) => edit('Day regenerated', (trip, preferences) => generatorRegenerateDay(trip, dayNumber, preferences)),
    makeCheaper: () => edit('Trip made cheaper', (trip, preferences) => makeTripCheaper(trip, preferences)),
    makeMoreActive: () => edit('Trip made more active', (trip, preferences) => makeTripMoreActive(trip, preferences)),
    makeMoreComfortable: () => edit('Trip made more comfortable', (trip, preferences) => makeTripMoreComfortable(trip, preferences)),

    undoLastEdit: () => {
      const { undoTrip, generatedItinerary } = get();
      if (!undoTrip) return;
      set({ generatedItinerary: undoTrip, undoTrip: generatedItinerary, lastEditLabel: 'Undo applied' });
      void persistTrip(undoTrip);
    },

    clearUndo: () => set({ undoTrip: null, lastEditLabel: null }),

    saveOfflinePack: async () => {
      const trip = get().generatedItinerary;
      if (!trip) return null;
      const pack: OfflinePack = {
        id: `offline_${Date.now()}`,
        tripId: trip.id,
        createdAt: Date.now(),
        checklist: [
          'Itinerary saved',
          'Stay details saved',
          'Transport contacts saved',
          'Food and activity notes saved',
          'Emergency contacts saved',
          'Offline map placeholder saved',
          'Phrasebook saved',
          'Offline-ready labels prepared',
        ],
      };
      set({ offlinePack: pack });
      await AsyncStorage.setItem(STORAGE_KEYS.offlinePack, JSON.stringify(pack));
      return pack;
    },

    lockTripDemo: async () => {
      const trip = get().generatedItinerary;
      if (!trip) return;
      const next = generatorLockTrip(trip);
      set({ generatedItinerary: next });
      await persistTrip(next);
      await AsyncStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify({ tripId: next.id, status: 'locked_demo', createdAt: Date.now() }));
    },

    resetTrip: () => {
      const next = normalizePreferences(DEFAULT_TRIP_PREFERENCES);
      set({
        preferences: next,
        generatedItinerary: null,
        selectedPresetId: null,
        undoTrip: null,
        lastEditLabel: null,
        entryMode: null,
        aiPlannerMessages: [],
        isAiPlannerThinking: false,
        ...aliases(next),
      });
      void AsyncStorage.multiRemove([
        STORAGE_KEYS.currentTrip,
        STORAGE_KEYS.preferences,
        STORAGE_KEYS.selectedPreset,
        STORAGE_KEYS.bookings,
        STORAGE_KEYS.offlinePack,
        AI_PLANNER_CHAT_KEY,
      ]);
    },

    resetGeneratedTrip: () => {
      set({ generatedItinerary: null, undoTrip: null, lastEditLabel: null });
      void persistTrip(null);
    },

    setPurpose: (purpose) => commitPreferences({ ...get().preferences, travelStyles: [purpose] }),
    setCompanions: (companions) => get().setTravelersType(companions),
    setCompanionCount: (count) => get().setTravelerCount(count),
    setKidsAgeRange: (kidsAgeRange) => set({ kidsAgeRange }),
    setQuizAnswer: (key, value) => {
      const preferences = get().preferences;
      if (key === 'days') commitPreferences({ ...preferences, days: value as TripDays });
      if (key === 'budget') commitPreferences({ ...preferences, budgetTier: value as BudgetTier });
      if (key === 'activityLevel') commitPreferences({ ...preferences, activityLevel: value as PlannerActivityLevel });
      if (key === 'interests') commitPreferences({ ...preferences, experiences: value as ExperienceKey[] });
      if (key === 'dietaryNeeds') commitPreferences({ ...preferences, requirements: value as RequirementKey[] });
    },
    toggleInterest: (interest) => {
      const mapped = interest as ExperienceKey;
      if ([
        'museums_history',
        'bazaars_local_life',
        'nomadic_culture',
        'local_food',
        'mountain_views',
        'lakes_canyons',
        'horse_riding',
        'hot_springs',
        'shopping_crafts',
        'photography_spots',
        'nightlife',
        'light_hiking',
      ].includes(mapped)) get().toggleExperience(mapped);
    },
    toggleDietary: (dietary) => get().toggleRequirement(dietary),
  };
});
