import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../db/client';
import { verifySignature } from './signatures';

// ─── Local Types (defined here to avoid circular imports with walletStore) ────

type TransactionType = 'top_up' | 'payment' | 'offline_payment' | 'merchant_income' | 'refund';
type TransactionStatus = 'completed' | 'pending_sync' | 'failed' | 'refunded';

interface OfflineTransaction {
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
  signature: string;
  publicKey: string;
  nonce: string;
  metadata?: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = '@tabylga/offline_queue';

/** Timer-based sync check interval (ms) — 30 seconds for demo */
const SYNC_CHECK_INTERVAL = 30_000;

let _syncTimerId: ReturnType<typeof setInterval> | null = null;

// ─── Queue Management ─────────────────────────────────────────────────────────

/**
 * Add a signed transaction to the offline queue (AsyncStorage).
 */
export async function addToOfflineQueue(signedTx: OfflineTransaction): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    queue.push(signedTx);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[sync] Failed to add to offline queue:', e);
  }
}

/**
 * Retrieve all pending offline transactions from AsyncStorage.
 */
export async function getOfflineQueue(): Promise<OfflineTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineTransaction[];
  } catch {
    return [];
  }
}

/**
 * Flush the offline queue:
 * - For each pending tx: validate signature, move to transactions table, clear from queue.
 * - Returns the number of successfully synced transactions.
 */
export async function flushOfflineQueue(): Promise<number> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return 0;

  const db = await getDb();
  let syncedCount = 0;
  const failedTxs: OfflineTransaction[] = [];

  for (const tx of queue) {
    try {
      // Validate signature before committing
      const txDataForVerify: Record<string, unknown> = {
        id: tx.id,
        userId: tx.userId,
        type: tx.type,
        amountUsd: tx.amountUsd,
        amountKgs: tx.amountKgs,
        merchantName: tx.merchantName,
        status: 'pending_sync',
        offlinePending: true,
        createdAt: tx.createdAt,
        nonce: tx.nonce,
      };

      const isValid = verifySignature(txDataForVerify, tx.signature, tx.publicKey);

      const finalStatus: TransactionStatus = isValid ? 'completed' : 'failed';

      // Insert into SQLite transactions table
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions (id, user_id, type, amount_usd, amount_kgs, merchant_name, status, offline_pending, created_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tx.id,
        tx.userId,
        tx.type,
        tx.amountUsd,
        tx.amountKgs,
        tx.merchantName,
        finalStatus,
        0, // no longer offline pending
        tx.createdAt,
        JSON.stringify({
          offlineNonce: tx.nonce,
          syncedAt: Date.now(),
          signatureValid: isValid,
        }),
      );

      if (isValid) {
        syncedCount++;
      } else {
        console.warn(`[sync] Invalid signature for tx ${tx.id}, marked as failed`);
      }
    } catch (e) {
      console.warn(`[sync] Failed to sync tx ${tx.id}:`, e);
      failedTxs.push(tx);
    }
  }

  // Keep only failed-to-sync txs in the queue; clear the rest
  if (failedTxs.length > 0) {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedTxs));
  } else {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  console.log(`[sync] Flushed ${syncedCount}/${queue.length} offline transactions`);
  return syncedCount;
}

// ─── Auto-Sync (Timer-based for Demo) ─────────────────────────────────────────

/**
 * Start a periodic sync check. Every SYNC_CHECK_INTERVAL ms, attempts to flush
 * the offline queue. In production, this would be triggered by NetInfo's
 * online/offline events instead.
 */
export function startAutoSync(onSynced?: (count: number) => void): void {
  if (_syncTimerId) return; // already running

  _syncTimerId = setInterval(async () => {
    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) return;

      console.log(`[sync] Auto-sync: ${queue.length} pending transactions`);
      const count = await flushOfflineQueue();

      if (count > 0 && onSynced) {
        onSynced(count);
      }
    } catch (e) {
      console.warn('[sync] Auto-sync error:', e);
    }
  }, SYNC_CHECK_INTERVAL);

  console.log('[sync] Auto-sync started (every 30s)');
}

/**
 * Stop the periodic sync timer.
 */
export function stopAutoSync(): void {
  if (_syncTimerId) {
    clearInterval(_syncTimerId);
    _syncTimerId = null;
    console.log('[sync] Auto-sync stopped');
  }
}
