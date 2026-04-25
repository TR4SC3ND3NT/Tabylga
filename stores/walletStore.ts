import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/db/client';
import { signTransaction as signTxCrypto } from '../lib/crypto/signatures';
import { addToOfflineQueue, getOfflineQueue, flushOfflineQueue } from '../lib/crypto/sync';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionStatus = 'completed' | 'pending_sync' | 'failed' | 'refunded';
export type TransactionType = 'top_up' | 'payment' | 'offline_payment' | 'merchant_income' | 'refund';
export type TopUpMethod = 'card' | 'mbank' | 'applepay';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountUsd: number;
  amountKgs: number;
  merchantName: string | null;
  merchantId?: string | null;
  status: TransactionStatus;
  offlinePending: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface OfflineTransaction extends Transaction {
  signature: string;
  publicKey: string;
  nonce: string;
}

export interface WalletState {
  balanceUsd: number;
  balanceKgs: number;
  exchangeRate: number;
  transactions: Transaction[];
  offlinePending: OfflineTransaction[];
  offlineLimit: number;
  isOnline: boolean;
  lastSyncAt: number | null;
  _hydrated: boolean;
}

interface WalletActions {
  topUp: (amountUsd: number, method: TopUpMethod) => Promise<void>;
  pay: (amountKgs: number, merchantName: string, merchantId?: string) => Promise<void>;
  payOffline: (amountKgs: number, merchantName: string) => Promise<void>;
  syncOffline: () => Promise<void>;
  getTransactionHistory: (limit?: number) => Promise<Transaction[]>;
  setOnline: (online: boolean) => void;
  hydrate: (userId: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@tabylga/wallet';
const DEFAULT_EXCHANGE_RATE = 87.0;
const DEFAULT_OFFLINE_LIMIT = 150; // USD equivalent

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function usdToKgs(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

function kgsToUsd(kgs: number, rate: number): number {
  return Math.round((kgs / rate) * 100) / 100;
}

async function persistBalances(state: { balanceUsd: number; balanceKgs: number; exchangeRate: number; lastSyncAt: number | null }) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      balanceUsd: state.balanceUsd,
      balanceKgs: state.balanceKgs,
      exchangeRate: state.exchangeRate,
      lastSyncAt: state.lastSyncAt,
    }));
  } catch {
    // Silently fail — non-critical
  }
}

async function saveTxToDb(tx: Transaction, userId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO transactions (id, user_id, type, amount_usd, amount_kgs, merchant_name, status, offline_pending, created_at, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      userId,
      tx.type,
      tx.amountUsd,
      tx.amountKgs,
      tx.merchantName,
      tx.status,
      tx.offlinePending ? 1 : 0,
      tx.createdAt,
      tx.metadata ? JSON.stringify(tx.metadata) : null,
    );
  } catch (e) {
    console.warn('[walletStore] Failed to save tx to SQLite:', e);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
  // State
  balanceUsd: 0,
  balanceKgs: 0,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  transactions: [],
  offlinePending: [],
  offlineLimit: DEFAULT_OFFLINE_LIMIT,
  isOnline: true,
  lastSyncAt: null,
  _hydrated: false,

  // ── Actions ──────────────────────────────────────────────────────────

  setOnline: (online) => set({ isOnline: online }),

  /**
   * Top up wallet balance. Creates a transaction record and persists to SQLite.
   */
  topUp: async (amountUsd, method) => {
    const { balanceUsd, balanceKgs, exchangeRate, transactions } = get();

    const addedKgs = usdToKgs(amountUsd, exchangeRate);
    const newBalanceUsd = Math.round((balanceUsd + amountUsd) * 100) / 100;
    const newBalanceKgs = Math.round((balanceKgs + addedKgs) * 100) / 100;

    const tx: Transaction = {
      id: generateTxId(),
      userId: '', // Will be filled from auth context externally
      type: 'top_up',
      amountUsd,
      amountKgs: addedKgs,
      merchantName: null,
      status: 'completed',
      offlinePending: false,
      createdAt: Date.now(),
      metadata: { method },
    };

    const newTxs = [tx, ...transactions];

    set({
      balanceUsd: newBalanceUsd,
      balanceKgs: newBalanceKgs,
      transactions: newTxs,
    });

    await persistBalances({ balanceUsd: newBalanceUsd, balanceKgs: newBalanceKgs, exchangeRate, lastSyncAt: get().lastSyncAt });
    await saveTxToDb(tx, tx.userId);
  },

  /**
   * Pay a merchant (online). Deducts from KGS balance.
   */
  pay: async (amountKgs, merchantName, merchantId?) => {
    const { balanceKgs, balanceUsd, exchangeRate, transactions } = get();

    if (amountKgs > balanceKgs) {
      throw new Error('Insufficient balance');
    }

    const amountUsd = kgsToUsd(amountKgs, exchangeRate);
    const newBalanceKgs = Math.round((balanceKgs - amountKgs) * 100) / 100;
    const newBalanceUsd = Math.round((balanceUsd - amountUsd) * 100) / 100;

    const tx: Transaction = {
      id: generateTxId(),
      userId: '',
      type: 'payment',
      amountUsd,
      amountKgs,
      merchantName,
      merchantId,
      status: 'completed',
      offlinePending: false,
      createdAt: Date.now(),
      metadata: merchantId ? { merchantId } : undefined,
    };

    const newTxs = [tx, ...transactions];

    set({
      balanceUsd: newBalanceUsd,
      balanceKgs: newBalanceKgs,
      transactions: newTxs,
    });

    await persistBalances({ balanceUsd: newBalanceUsd, balanceKgs: newBalanceKgs, exchangeRate, lastSyncAt: get().lastSyncAt });
    await saveTxToDb(tx, tx.userId);
  },

  /**
   * Offline payment — checks offlineLimit, creates a signed offline transaction.
   * Uses lib/crypto/ for signing (imported dynamically to avoid circular deps).
   */
  payOffline: async (amountKgs, merchantName) => {
    const { balanceKgs, balanceUsd, exchangeRate, offlinePending, offlineLimit } = get();

    // Check offline limit (in USD)
    const amountUsd = kgsToUsd(amountKgs, exchangeRate);
    const pendingUsdTotal = offlinePending.reduce((sum, tx) => sum + tx.amountUsd, 0);

    if (pendingUsdTotal + amountUsd > offlineLimit) {
      throw new Error(`Offline limit exceeded. Remaining: $${(offlineLimit - pendingUsdTotal).toFixed(2)}`);
    }

    if (amountKgs > balanceKgs) {
      throw new Error('Insufficient balance');
    }


    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newBalanceKgs = Math.round((balanceKgs - amountKgs) * 100) / 100;
    const newBalanceUsd = Math.round((balanceUsd - amountUsd) * 100) / 100;

    const txData = {
      id: generateTxId(),
      userId: '',
      type: 'offline_payment' as TransactionType,
      amountUsd,
      amountKgs,
      merchantName,
      status: 'pending_sync' as TransactionStatus,
      offlinePending: true,
      createdAt: Date.now(),
      nonce,
    };

    const signed = await signTxCrypto(txData);

    const offlineTx: OfflineTransaction = {
      ...txData,
      merchantId: null,
      signature: signed.signature,
      publicKey: signed.publicKey,
      nonce,
    };

    await addToOfflineQueue(offlineTx);

    set({
      balanceUsd: newBalanceUsd,
      balanceKgs: newBalanceKgs,
      offlinePending: [...offlinePending, offlineTx],
    });

    await persistBalances({ balanceUsd: newBalanceUsd, balanceKgs: newBalanceKgs, exchangeRate, lastSyncAt: get().lastSyncAt });
  },

  /**
   * Flush offlinePending → regular transactions (simulated for demo).
   */
  syncOffline: async () => {
    const { offlinePending, transactions } = get();

    if (offlinePending.length === 0) return;

    // Move each offline tx to completed
    const synced: Transaction[] = offlinePending.map((otx) => ({
      id: otx.id,
      userId: otx.userId,
      type: otx.type,
      amountUsd: otx.amountUsd,
      amountKgs: otx.amountKgs,
      merchantName: otx.merchantName,
      merchantId: otx.merchantId,
      status: 'completed' as TransactionStatus,
      offlinePending: false,
      createdAt: otx.createdAt,
      metadata: { offlineNonce: otx.nonce, syncedAt: Date.now() },
    }));

    // Save synced txs to DB
    for (const tx of synced) {
      await saveTxToDb(tx, tx.userId);
    }

    // Clear offline queue from AsyncStorage
    try {
      await flushOfflineQueue();
    } catch {
      // queue already empty or module not ready
    }

    set({
      transactions: [...synced, ...transactions],
      offlinePending: [],
      lastSyncAt: Date.now(),
    });

    await persistBalances({ ...get(), lastSyncAt: Date.now() });
  },

  /**
   * Read transaction history from SQLite.
   */
  getTransactionHistory: async (limit = 20) => {
    try {
      const db = await getDb();
      const rows = await db.getAllAsync<{
        id: string;
        user_id: string;
        type: string;
        amount_usd: number;
        amount_kgs: number;
        merchant_name: string | null;
        status: string;
        offline_pending: number;
        created_at: number;
        metadata_json: string | null;
      }>(
        'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?',
        limit,
      );

      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type as TransactionType,
        amountUsd: r.amount_usd,
        amountKgs: r.amount_kgs,
        merchantName: r.merchant_name,
        status: r.status as TransactionStatus,
        offlinePending: r.offline_pending === 1,
        createdAt: r.created_at,
        metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
      }));
    } catch (e) {
      console.warn('[walletStore] Failed to read tx history:', e);
      return [];
    }
  },

  /**
   * Hydrate wallet from AsyncStorage (balances) + SQLite (last 20 transactions).
   */
  hydrate: async (userId: string) => {
    try {
      // 1. Restore balances from AsyncStorage
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const persisted = JSON.parse(raw) as {
          balanceUsd: number;
          balanceKgs: number;
          exchangeRate: number;
          lastSyncAt: number | null;
        };
        set({
          balanceUsd: persisted.balanceUsd,
          balanceKgs: persisted.balanceKgs,
          exchangeRate: persisted.exchangeRate || DEFAULT_EXCHANGE_RATE,
          lastSyncAt: persisted.lastSyncAt,
        });
      }

      // 2. Load last 20 transactions from SQLite
      const db = await getDb();
      const rows = await db.getAllAsync<{
        id: string;
        user_id: string;
        type: string;
        amount_usd: number;
        amount_kgs: number;
        merchant_name: string | null;
        status: string;
        offline_pending: number;
        created_at: number;
        metadata_json: string | null;
      }>(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        userId,
      );

      const txs: Transaction[] = rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type as TransactionType,
        amountUsd: r.amount_usd,
        amountKgs: r.amount_kgs,
        merchantName: r.merchant_name,
        status: r.status as TransactionStatus,
        offlinePending: r.offline_pending === 1,
        createdAt: r.created_at,
        metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
      }));

      // 3. Restore offline queue from AsyncStorage
      let offlineQueue: OfflineTransaction[] = [];
      try {
        offlineQueue = await getOfflineQueue();
      } catch {
        // crypto/sync not ready yet — no offline txs
      }

      set({
        transactions: txs,
        offlinePending: offlineQueue,
        _hydrated: true,
      });
    } catch (e) {
      console.warn('[walletStore] Hydration failed:', e);
      set({ _hydrated: true });
    }
  },
}));
