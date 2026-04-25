import { create } from 'zustand';
import type { Transaction, TransactionStatus, TransactionType } from './walletStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MerchantProfile {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  rating: number;
}

export interface WeeklyDataPoint {
  day: string;       // e.g. 'Mon', 'Tue', ...
  earnings: number;  // KGS
  count: number;     // number of transactions
}

interface MerchantState {
  isMerchantMode: boolean;
  merchantProfile: MerchantProfile;
  todayEarnings: number;     // KGS
  todayCount: number;
  weeklyData: WeeklyDataPoint[];
  recentTransactions: Transaction[];
}

interface MerchantActions {
  toggleMerchantMode: () => void;
  acceptPayment: (amountKgs: number, description?: string) => void;
  generatePaymentQR: (amountKgs: number) => string;
  getMerchantStats: () => { todayEarnings: number; weekEarnings: number; avgRating: number };
  updateProfile: (partial: Partial<MerchantProfile>) => void;
  resetDailyStats: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateTxId(): string {
  return `mtx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateNonce(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getDefaultWeeklyData(): WeeklyDataPoint[] {
  return DAYS.map((day) => ({ day, earnings: 0, count: 0 }));
}

// ─── Default Profile ──────────────────────────────────────────────────────────

const DEFAULT_PROFILE: MerchantProfile = {
  id: `merchant_${Date.now()}`,
  name: 'My Business',
  category: 'general',
  verified: false,
  rating: 4.5,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMerchantStore = create<MerchantState & MerchantActions>((set, get) => ({
  // State
  isMerchantMode: false,
  merchantProfile: { ...DEFAULT_PROFILE },
  todayEarnings: 0,
  todayCount: 0,
  weeklyData: getDefaultWeeklyData(),
  recentTransactions: [],

  // ── Actions ──────────────────────────────────────────────────────────

  toggleMerchantMode: () => {
    set((s) => ({ isMerchantMode: !s.isMerchantMode }));
  },

  /**
   * Accept an incoming payment as a merchant. Creates an incoming transaction record.
   */
  acceptPayment: (amountKgs, description?) => {
    const { todayEarnings, todayCount, recentTransactions, weeklyData, merchantProfile } = get();

    const exchangeRate = 87.0; // same default rate
    const amountUsd = Math.round((amountKgs / exchangeRate) * 100) / 100;

    const tx: Transaction = {
      id: generateTxId(),
      userId: merchantProfile.id,
      type: 'merchant_income' as TransactionType,
      amountUsd,
      amountKgs,
      merchantName: merchantProfile.name,
      merchantId: merchantProfile.id,
      status: 'completed' as TransactionStatus,
      offlinePending: false,
      createdAt: Date.now(),
      metadata: description ? { description } : undefined,
    };

    // Update today's stats
    const newTodayEarnings = Math.round((todayEarnings + amountKgs) * 100) / 100;
    const newTodayCount = todayCount + 1;

    // Update weekly data for today
    const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ...
    const newWeeklyData = weeklyData.map((d, i) =>
      i === todayIndex
        ? { ...d, earnings: Math.round((d.earnings + amountKgs) * 100) / 100, count: d.count + 1 }
        : d
    );

    set({
      todayEarnings: newTodayEarnings,
      todayCount: newTodayCount,
      weeklyData: newWeeklyData,
      recentTransactions: [tx, ...recentTransactions].slice(0, 50), // keep last 50
    });
  },

  /**
   * Generate a QR code data string for receiving a payment.
   * Format: JSON per the architectural contract.
   */
  generatePaymentQR: (amountKgs) => {
    const { merchantProfile } = get();

    const qrData = {
      type: 'tabylga_pay',
      merchantId: merchantProfile.id,
      amount: amountKgs,
      currency: 'KGS',
      nonce: generateNonce(),
      timestamp: Date.now(),
    };

    return JSON.stringify(qrData);
  },

  /**
   * Get aggregated merchant stats.
   */
  getMerchantStats: () => {
    const { todayEarnings, weeklyData, merchantProfile } = get();

    const weekEarnings = weeklyData.reduce((sum, d) => sum + d.earnings, 0);

    return {
      todayEarnings,
      weekEarnings: Math.round(weekEarnings * 100) / 100,
      avgRating: merchantProfile.rating,
    };
  },

  /**
   * Update merchant profile fields.
   */
  updateProfile: (partial) => {
    set((s) => ({
      merchantProfile: { ...s.merchantProfile, ...partial },
    }));
  },

  /**
   * Reset daily stats (call at midnight or on new day).
   */
  resetDailyStats: () => {
    set({ todayEarnings: 0, todayCount: 0 });
  },
}));
