// ─── Wallet Wrapper for Non-React Contexts ────────────────────────────────────
// Thin wrapper around walletStore for use outside React components
// (e.g. background tasks, utilities, service layers).

import { useWalletStore } from '../../stores/walletStore';
import type { Transaction, TopUpMethod } from '../../stores/walletStore';

// ─── Direct State Access ─────────────────────────────────────────────────────

/** Get current wallet balance in USD */
export function getBalanceUsd(): number {
  return useWalletStore.getState().balanceUsd;
}

/** Get current wallet balance in KGS */
export function getBalanceKgs(): number {
  return useWalletStore.getState().balanceKgs;
}

/** Get current exchange rate */
export function getExchangeRate(): number {
  return useWalletStore.getState().exchangeRate;
}

/** Check if user is online */
export function isOnline(): boolean {
  return useWalletStore.getState().isOnline;
}

/** Get all in-memory transactions */
export function getTransactions(): Transaction[] {
  return useWalletStore.getState().transactions;
}

/** Get pending offline transactions */
export function getOfflinePending(): Transaction[] {
  return useWalletStore.getState().offlinePending;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Top up wallet balance */
export async function topUp(amountUsd: number, method: TopUpMethod): Promise<void> {
  return useWalletStore.getState().topUp(amountUsd, method);
}

/** Make a payment (online) */
export async function pay(amountKgs: number, merchantName: string, merchantId?: string): Promise<void> {
  return useWalletStore.getState().pay(amountKgs, merchantName, merchantId);
}

/** Make an offline payment */
export async function payOffline(amountKgs: number, merchantName: string): Promise<void> {
  return useWalletStore.getState().payOffline(amountKgs, merchantName);
}

/** Sync offline transactions */
export async function syncOffline(): Promise<void> {
  return useWalletStore.getState().syncOffline();
}

/** Get transaction history from SQLite */
export async function getTransactionHistory(limit?: number): Promise<Transaction[]> {
  return useWalletStore.getState().getTransactionHistory(limit);
}

/** Set online/offline status */
export function setOnline(online: boolean): void {
  useWalletStore.getState().setOnline(online);
}

/** Hydrate wallet from persistence */
export async function hydrateWallet(userId: string): Promise<void> {
  return useWalletStore.getState().hydrate(userId);
}
