import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/db/client';
import { getStrings, type Language } from '../lib/strings';

export type { Language };

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  language: Language;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  language: Language;
  loading: boolean;
  error: string | null;
  _hydrated: boolean;
  _pendingPhone: string | null;
}

interface AuthActions {
  setLanguage: (lang: Language) => void;
  startPhoneAuth: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@tabylga/auth';
const DEMO_OTP = '000000';

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  language: 'en',
  loading: false,
  error: null,
  _hydrated: false,
  _pendingPhone: null,

  setLanguage: (lang) => {
    const current = get();
    const user = current.user ? { ...current.user, language: lang } : null;
    set({ language: lang, user });

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userId: user?.id, language: lang })
    ).catch(() => null);

    if (user) {
      getDb()
        .then((db) => db.runAsync('UPDATE users SET language = ? WHERE id = ?', lang, user.id))
        .catch(() => null);
    }
  },

  startPhoneAuth: async (phone) => {
    set({ loading: true, error: null, _pendingPhone: phone });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ loading: false });
  },

  verifyOtp: async (code) => {
    const { _pendingPhone, language } = get();
    if (!_pendingPhone) {
      set({ error: getStrings(language).auth.genericError });
      return;
    }
    if (code !== DEMO_OTP) {
      set({ error: getStrings(language).auth.invalidCode });
      return;
    }

    set({ loading: true, error: null });
    try {
      const db = await getDb();

      let user = await db.getFirstAsync<AuthUser>(
        'SELECT id, phone, name, language FROM users WHERE phone = ?',
        _pendingPhone
      );

      if (!user) {
        const id = generateId();
        await db.runAsync(
          'INSERT INTO users (id, phone, language, created_at) VALUES (?, ?, ?, ?)',
          id, _pendingPhone, language, Date.now()
        );
        user = { id, phone: _pendingPhone, name: null, language };
      }

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId: user.id, language: user.language })
      );

      set({ user, isAuthenticated: true, language: user.language, loading: false, _pendingPhone: null });
    } catch (e) {
      set({ error: getStrings(language).auth.genericError, loading: false });
    }
  },

  signOut: async () => {
    const { language } = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ language }));
    set({ user: null, isAuthenticated: false, _pendingPhone: null, error: null });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ _hydrated: true });
        return;
      }

      const { userId, language } = JSON.parse(raw) as { userId?: string; language?: Language };
      if (!userId) {
        set({ language: language ?? 'en', _hydrated: true });
        return;
      }

      const db = await getDb();
      const user = await db.getFirstAsync<AuthUser>(
        'SELECT id, phone, name, language FROM users WHERE id = ?',
        userId
      );

      if (user) {
        set({ user, isAuthenticated: true, language: user.language ?? language ?? 'en', _hydrated: true });
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ language: language ?? 'en' }));
        set({ language: language ?? 'en', _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
