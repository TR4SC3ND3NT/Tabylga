/**
 * Payment service — Tabylga Wallet + KICB Demo Offline Mountain Pay.
 *
 * Demo only. No real bank, KICB, Bluetooth or backend integration. All state
 * is persisted to AsyncStorage with payment-specific keys so it stays
 * isolated from the trip planner / hotels / transport state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PAYMENT_MERCHANTS,
  getPaymentMerchantById,
  type PaymentMerchant,
} from '../data/paymentMerchants';
import { FALLBACK_USD_TO_KGS_RATE } from '../../services/exchangeRateService';

// ── Storage keys (isolated; do not reuse planner/auth/hotels keys) ──────────
export const PAYMENT_STORAGE_KEYS = {
  wallet: 'tabylga_wallet',
  transactions: 'tabylga_transactions',
  offlineTokens: 'tabylga_offline_tokens',
  paymentMerchants: 'tabylga_payment_merchants',
  demoSession: 'tabylga_payment_demo_session',
} as const;

export const WALLET_DEMO_STATE_VERSION = 2;

// ── Domain types ────────────────────────────────────────────────────────────
export type Currency = 'KGS';

export interface Wallet {
  totalBalance: number;
  availableOnline: number;
  offlineReserve: number;
  lockedOffline: number;
  pendingSync: number;
  currency: Currency;
  updatedAt: string;
}

export type TransactionType =
  | 'top_up'
  | 'online_qr_payment'
  | 'offline_reserve'
  | 'offline_qr_payment'
  | 'offline_bluetooth_payment'
  | 'sync';

export type TransactionStatus =
  | 'completed_online'
  | 'waiting_merchant_acceptance'
  | 'accepted_offline'
  | 'synced'
  | 'expired'
  | 'failed_demo';

export type TransactionMethod =
  | 'card_demo'
  | 'online_qr_demo'
  | 'offline_customer_qr'
  | 'bluetooth_demo';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  sourceAmountUsd?: number;
  exchangeRate?: number;
  cardBrand?: string;
  cardLast4?: string;
  currency: Currency;
  merchantId: string | null;
  merchantName: string | null;
  status: TransactionStatus;
  method: TransactionMethod;
  canCancel: boolean;
  createdAt: string;
  acceptedAt: string | null;
  syncedAt: string | null;
  receiptCode: string;
}

export type OfflineTokenStatus =
  | 'created'
  | 'shown_to_merchant'
  | 'accepted_offline'
  | 'synced'
  | 'expired';

export type OfflineTokenTransfer = 'offline_customer_qr' | 'bluetooth_demo';

export interface OfflineToken {
  id: string;
  transactionId: string;
  receiptCode: string;
  amount: number;
  currency: Currency;
  issuer: 'KICB_DEMO';
  merchantId: string | null;
  merchantName: string | null;
  status: OfflineTokenStatus;
  transferMethod: OfflineTokenTransfer;
  createdAt: string;
  expiresAt: string;
  canCancel: boolean;
  mockSignature: string;
  qrPayload: string;
  qrDeepLink?: string;
}

export interface OfflineQrPayload {
  version: 'tabylga_offline_v1';
  tokenId: string;
  transactionId: string;
  receiptCode: string;
  amount: number;
  currency: Currency;
  issuer: 'KICB_DEMO';
  createdAt: string;
  expiresAt: string;
  nonce: string;
  mockSignature: string;
}

export type OfflineQrVerificationReason =
  | 'invalid_payload'
  | 'missing_fields'
  | 'token_not_found'
  | 'signature_or_payload_mismatch'
  | 'expired'
  | 'already_used'
  | 'insufficient_reserved_balance'
  | 'merchant_not_supported'
  | 'unknown';

export interface OfflineQrVerification {
  ok: boolean;
  reason?: OfflineQrVerificationReason;
  token?: OfflineToken;
  tokenId?: string;
  transactionId?: string;
  amount?: number;
  currency?: Currency;
  merchantId?: string;
  expiresAt?: string;
  status?: 'valid';
  issuer: 'KICB_DEMO';
  signatureVerified: boolean;
  reserveBacked: boolean;
  oneTimeToken: boolean;
  notExpired: boolean;
  risk: 'low' | 'medium' | 'high';
}

export interface SyncResult {
  syncedCount: number;
  syncedAmount: number;
  syncTransactionId: string | null;
}

interface DemoSessionState {
  walletDemoStateVersion?: number;
  version?: number;
  resetAt?: string;
}

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_WALLET: Wallet = {
  totalBalance: 0,
  availableOnline: 0,
  offlineReserve: 0,
  lockedOffline: 0,
  pendingSync: 0,
  currency: 'KGS',
  updatedAt: new Date(0).toISOString(),
};

const OFFLINE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h demo TTL
const OFFLINE_DEEP_LINK_PREFIX = 'tabylga://merchant/accept?payload=';

// ── Helpers ─────────────────────────────────────────────────────────────────
function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeReceiptCode(): string {
  return `TBL-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function roundKgs(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
}

function normalizeWallet(wallet: Wallet): Wallet {
  const availableOnline = roundKgs(wallet.availableOnline);
  const offlineReserve = roundKgs(wallet.offlineReserve);
  const lockedOffline = roundKgs(wallet.lockedOffline);
  const pendingSync = roundKgs(wallet.pendingSync);

  return {
    ...wallet,
    availableOnline,
    offlineReserve,
    lockedOffline,
    pendingSync,
    totalBalance: availableOnline + offlineReserve,
    currency: 'KGS',
    updatedAt: wallet.updatedAt ?? nowIso(),
  };
}

function makeNonce(): string {
  return Math.random().toString(36).slice(2, 12);
}

function makeOfflineQrDeepLink(qrPayload: string): string {
  return `${OFFLINE_DEEP_LINK_PREFIX}${encodeURIComponent(qrPayload)}`;
}

export function quoteUsdToKgs(amountUsd: number, rate = FALLBACK_USD_TO_KGS_RATE) {
  const safeAmount = Number.isFinite(amountUsd) && amountUsd > 0 ? amountUsd : 0;
  return {
    rate,
    amountUsd: safeAmount,
    amountKgs: Math.round(safeAmount * rate),
    validUntil: new Date(Date.now() + 30_000).toISOString(),
  };
}

export function extractOfflinePayload(scannedValue: string): string | null {
  const value = scannedValue.trim();
  if (!value) return null;

  if (value.startsWith(OFFLINE_DEEP_LINK_PREFIX)) {
    const encoded = value.slice(OFFLINE_DEEP_LINK_PREFIX.length).split('&')[0];
    try {
      return decodeURIComponent(encoded);
    } catch {
      return null;
    }
  }

  if (value.startsWith('{')) {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Demo signature only. Not cryptographically secure — used purely to
 * demonstrate the KICB Demo signed-token UX.
 */
function makeMockSignature(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `KICB_DEMO_SIG_${hex}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[paymentService] failed to read ${key}`, err);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[paymentService] failed to write ${key}`, err);
    throw err;
  }
}

let demoStateVersionChecked = false;
let demoStateVersionPromise: Promise<void> | null = null;

async function resetPersistedDemoState(): Promise<Wallet> {
  const seed = normalizeWallet({ ...DEFAULT_WALLET, updatedAt: nowIso() });
  await writeJson(PAYMENT_STORAGE_KEYS.wallet, seed);
  await writeJson<Transaction[]>(PAYMENT_STORAGE_KEYS.transactions, []);
  await writeJson<OfflineToken[]>(PAYMENT_STORAGE_KEYS.offlineTokens, []);
  await writeJson<DemoSessionState>(PAYMENT_STORAGE_KEYS.demoSession, {
    walletDemoStateVersion: WALLET_DEMO_STATE_VERSION,
    version: WALLET_DEMO_STATE_VERSION,
    resetAt: nowIso(),
  });
  return seed;
}

async function ensureDemoStateVersion(): Promise<void> {
  if (demoStateVersionChecked) return;

  if (!demoStateVersionPromise) {
    demoStateVersionPromise = (async () => {
      const session = await readJson<DemoSessionState | null>(
        PAYMENT_STORAGE_KEYS.demoSession,
        null,
      );
      const storedVersion =
        session?.walletDemoStateVersion ?? session?.version ?? 0;

      if (storedVersion !== WALLET_DEMO_STATE_VERSION) {
        await resetPersistedDemoState();
      }

      demoStateVersionChecked = true;
    })();
  }

  await demoStateVersionPromise;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ── Wallet ──────────────────────────────────────────────────────────────────
export async function getWallet(): Promise<Wallet> {
  await ensureDemoStateVersion();
  const wallet = await readJson<Wallet | null>(PAYMENT_STORAGE_KEYS.wallet, null);
  if (!wallet) {
    const seed = normalizeWallet({ ...DEFAULT_WALLET, updatedAt: nowIso() });
    await writeJson(PAYMENT_STORAGE_KEYS.wallet, seed);
    return seed;
  }
  const normalized = normalizeWallet(wallet);
  if (normalized.totalBalance !== wallet.totalBalance) {
    await writeJson(PAYMENT_STORAGE_KEYS.wallet, normalized);
  }
  return normalized;
}

export async function saveWallet(wallet: Wallet): Promise<Wallet> {
  const next: Wallet = normalizeWallet({ ...wallet, updatedAt: nowIso() });
  await writeJson(PAYMENT_STORAGE_KEYS.wallet, next);
  return next;
}

export async function resetWalletDemo(): Promise<Wallet> {
  const seed = await resetPersistedDemoState();
  demoStateVersionChecked = true;
  demoStateVersionPromise = Promise.resolve();
  return seed;
}

// ── Transactions ────────────────────────────────────────────────────────────
export async function getTransactions(): Promise<Transaction[]> {
  await ensureDemoStateVersion();
  return readJson<Transaction[]>(PAYMENT_STORAGE_KEYS.transactions, []);
}

export async function saveTransaction(tx: Transaction): Promise<Transaction> {
  const all = await getTransactions();
  all.unshift(tx);
  await writeJson(PAYMENT_STORAGE_KEYS.transactions, all);
  return tx;
}

export async function updateTransaction(
  transactionId: string,
  updates: Partial<Transaction>,
): Promise<Transaction | null> {
  const all = await getTransactions();
  const idx = all.findIndex((t) => t.id === transactionId);
  if (idx === -1) return null;
  const next: Transaction = { ...all[idx], ...updates };
  all[idx] = next;
  await writeJson(PAYMENT_STORAGE_KEYS.transactions, all);
  return next;
}

// ── Offline tokens ──────────────────────────────────────────────────────────
export async function getOfflineTokens(): Promise<OfflineToken[]> {
  await ensureDemoStateVersion();
  return readJson<OfflineToken[]>(PAYMENT_STORAGE_KEYS.offlineTokens, []);
}

export async function saveOfflineToken(token: OfflineToken): Promise<OfflineToken> {
  const all = await getOfflineTokens();
  all.unshift(token);
  await writeJson(PAYMENT_STORAGE_KEYS.offlineTokens, all);
  return token;
}

export async function updateOfflineToken(
  tokenId: string,
  updates: Partial<OfflineToken>,
): Promise<OfflineToken | null> {
  const all = await getOfflineTokens();
  const idx = all.findIndex((t) => t.id === tokenId);
  if (idx === -1) return null;
  const next: OfflineToken = { ...all[idx], ...updates };
  all[idx] = next;
  await writeJson(PAYMENT_STORAGE_KEYS.offlineTokens, all);
  return next;
}

// ── Merchants ───────────────────────────────────────────────────────────────
export function getPaymentMerchants(): PaymentMerchant[] {
  return PAYMENT_MERCHANTS;
}

export function getOnlineQRMerchants(): PaymentMerchant[] {
  return PAYMENT_MERCHANTS.filter((m) => m.onlineQrSupported);
}

export function getOfflineMerchants(): PaymentMerchant[] {
  return PAYMENT_MERCHANTS.filter((m) => m.offlineQrSupported);
}

export function getBluetoothMerchants(): PaymentMerchant[] {
  return PAYMENT_MERCHANTS.filter((m) => m.bluetoothDemoSupported);
}

// ── Top up ──────────────────────────────────────────────────────────────────
export interface TopUpResult {
  wallet: Wallet;
  transaction: Transaction;
}

export async function topUpWallet(
  amount: number,
  method: 'card_demo' | 'online_qr_demo' = 'card_demo',
  options: {
    inputCurrency?: 'KGS' | 'USD';
    exchangeRate?: number;
    convertedAmountKgs?: number;
    receiptCode?: string;
    cardBrand?: string;
    cardLast4?: string;
  } = {},
): Promise<TopUpResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Top up amount must be a positive number.');
  }
  const inputCurrency = options.inputCurrency ?? 'KGS';
  const exchangeRate = options.exchangeRate ?? FALLBACK_USD_TO_KGS_RATE;
  const converted = inputCurrency === 'USD' ? quoteUsdToKgs(amount, exchangeRate) : null;
  const amountKgs = options.convertedAmountKgs ?? (converted ? converted.amountKgs : amount);
  const wallet = await getWallet();
  const next: Wallet = {
    ...wallet,
    availableOnline: wallet.availableOnline + amountKgs,
  };
  const saved = await saveWallet(next);
  const tx: Transaction = {
    id: makeId('tx'),
    type: 'top_up',
    amount: amountKgs,
    sourceAmountUsd: inputCurrency === 'USD' ? amount : undefined,
    exchangeRate: inputCurrency === 'USD' ? exchangeRate : undefined,
    cardBrand: options.cardBrand,
    cardLast4: options.cardLast4,
    currency: 'KGS',
    merchantId: null,
    merchantName: null,
    status: 'completed_online',
    method,
    canCancel: false,
    createdAt: nowIso(),
    acceptedAt: nowIso(),
    syncedAt: nowIso(),
    receiptCode: options.receiptCode ?? makeReceiptCode(),
  };
  await saveTransaction(tx);
  return { wallet: saved, transaction: tx };
}

// ── Online QR payment ───────────────────────────────────────────────────────
export interface PayOnlineQRInput {
  merchantId: string;
  amount: number;
}

export interface PayOnlineQRResult {
  wallet: Wallet;
  transaction: Transaction;
  merchant: PaymentMerchant;
}

export async function payOnlineQR(
  input: PayOnlineQRInput,
): Promise<PayOnlineQRResult> {
  const merchant = getPaymentMerchantById(input.merchantId);
  if (!merchant) throw new Error('Merchant not found.');
  if (!merchant.onlineQrSupported) {
    throw new Error('This merchant does not support online QR payments.');
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Amount must be a positive number.');
  }

  const wallet = await getWallet();
  if (input.amount > wallet.availableOnline) {
    throw new Error('Insufficient online balance.');
  }

  const next: Wallet = {
    ...wallet,
    availableOnline: wallet.availableOnline - input.amount,
  };
  const saved = await saveWallet(next);

  const tx: Transaction = {
    id: makeId('tx'),
    type: 'online_qr_payment',
    amount: input.amount,
    currency: 'KGS',
    merchantId: merchant.id,
    merchantName: merchant.name,
    status: 'completed_online',
    method: 'online_qr_demo',
    canCancel: false,
    createdAt: nowIso(),
    acceptedAt: nowIso(),
    syncedAt: nowIso(),
    receiptCode: makeReceiptCode(),
  };
  await saveTransaction(tx);
  return { wallet: saved, transaction: tx, merchant };
}

// ── Activate offline reserve ────────────────────────────────────────────────
export interface ActivateOfflineResult {
  wallet: Wallet;
  transaction: Transaction;
}

export async function activateOfflineReserve(
  amount: number,
): Promise<ActivateOfflineResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Reserve amount must be a positive number.');
  }
  const wallet = await getWallet();
  if (amount > wallet.availableOnline) {
    throw new Error('Insufficient online balance to reserve.');
  }

  const next: Wallet = {
    ...wallet,
    availableOnline: wallet.availableOnline - amount,
    offlineReserve: wallet.offlineReserve + amount,
  };
  const saved = await saveWallet(next);

  const tx: Transaction = {
    id: makeId('tx'),
    type: 'offline_reserve',
    amount,
    currency: 'KGS',
    merchantId: null,
    merchantName: null,
    status: 'completed_online',
    method: 'card_demo',
    canCancel: false,
    createdAt: nowIso(),
    acceptedAt: nowIso(),
    syncedAt: null,
    receiptCode: makeReceiptCode(),
  };
  await saveTransaction(tx);
  return { wallet: saved, transaction: tx };
}

// ── Offline customer QR payment (tourist side) ──────────────────────────────
export interface OfflineCustomerQRResult {
  wallet: Wallet;
  transaction: Transaction;
  token: OfflineToken;
}

export async function createOfflineCustomerQRPayment(
  amount: number,
): Promise<OfflineCustomerQRResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be a positive number.');
  }
  const wallet = await getWallet();
  if (amount > wallet.offlineReserve) {
    throw new Error(
      'Not enough offline reserve. Activate Offline Pay first.',
    );
  }

  const txId = makeId('tx');
  const tokenId = makeId('tok');
  const receiptCode = makeReceiptCode();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + OFFLINE_TOKEN_TTL_MS).toISOString();
  const nonce = makeNonce();
  const mockSignature = makeMockSignature(
    `${tokenId}|${txId}|${receiptCode}|${amount}|${createdAt}|${nonce}`,
  );

  const qrPayloadObj: OfflineQrPayload = {
    version: 'tabylga_offline_v1',
    tokenId,
    transactionId: txId,
    receiptCode,
    amount,
    currency: 'KGS',
    issuer: 'KICB_DEMO',
    createdAt,
    expiresAt,
    nonce,
    mockSignature,
  };
  const qrPayload = JSON.stringify(qrPayloadObj);
  const qrDeepLink = makeOfflineQrDeepLink(qrPayload);

  const tx: Transaction = {
    id: txId,
    type: 'offline_qr_payment',
    amount,
    currency: 'KGS',
    merchantId: null,
    merchantName: null,
    status: 'waiting_merchant_acceptance',
    method: 'offline_customer_qr',
    canCancel: true,
    createdAt,
    acceptedAt: null,
    syncedAt: null,
    receiptCode,
  };
  await saveTransaction(tx);

  const token: OfflineToken = {
    id: tokenId,
    transactionId: txId,
    receiptCode,
    amount,
    currency: 'KGS',
    issuer: 'KICB_DEMO',
    merchantId: null,
    merchantName: null,
    status: 'created',
    transferMethod: 'offline_customer_qr',
    createdAt,
    expiresAt,
    canCancel: true,
    mockSignature,
    qrPayload,
    qrDeepLink,
  };
  await saveOfflineToken(token);

  return { wallet, transaction: tx, token };
}

// ── Merchant: scan + accept ─────────────────────────────────────────────────
function parseQrPayload(raw: string): OfflineQrPayload | null | 'missing_fields' {
  try {
    const parsed = JSON.parse(raw) as Partial<OfflineQrPayload>;
    if (
      typeof parsed?.version === 'string' &&
      typeof parsed?.tokenId === 'string' &&
      typeof parsed?.transactionId === 'string' &&
      typeof parsed?.receiptCode === 'string' &&
      typeof parsed?.amount === 'number' &&
      typeof parsed?.currency === 'string' &&
      typeof parsed?.issuer === 'string' &&
      typeof parsed?.createdAt === 'string' &&
      typeof parsed?.expiresAt === 'string' &&
      typeof parsed?.nonce === 'string' &&
      typeof parsed?.mockSignature === 'string'
    ) {
      if (
        parsed.version !== 'tabylga_offline_v1' ||
        parsed.currency !== 'KGS' ||
        parsed.issuer !== 'KICB_DEMO'
      ) {
        return null;
      }
      return parsed as OfflineQrPayload;
    }
    return 'missing_fields';
  } catch {
    return null;
  }
}

async function expireCreatedOfflineToken(token: OfflineToken): Promise<void> {
  if (token.status !== 'created' && token.status !== 'shown_to_merchant') return;

  await updateOfflineToken(token.id, { status: 'expired', canCancel: false });
  await updateTransaction(token.transactionId, {
    status: 'expired',
    canCancel: false,
  });
}

export async function merchantScanOfflineQR(
  qrPayload: string,
  merchantId: string,
): Promise<OfflineQrVerification> {
  const merchant = getPaymentMerchantById(merchantId);
  const baseFail = (reason: OfflineQrVerificationReason, token?: OfflineToken): OfflineQrVerification => ({
    ok: false,
    reason,
    token,
    tokenId: token?.id,
    transactionId: token?.transactionId,
    amount: token?.amount,
    currency: token?.currency,
    merchantId,
    expiresAt: token?.expiresAt,
    issuer: 'KICB_DEMO',
    signatureVerified: false,
    reserveBacked: false,
    oneTimeToken: false,
    notExpired: false,
    risk: 'high',
  });

  if (!merchant) return baseFail('merchant_not_supported');
  if (!merchant.offlineQrSupported) {
    return baseFail('merchant_not_supported');
  }

  const payload = parseQrPayload(qrPayload);
  if (payload === 'missing_fields') return baseFail('missing_fields');
  if (!payload) return baseFail('invalid_payload');

  const tokens = await getOfflineTokens();
  const token = tokens.find((t) => t.id === payload.tokenId);
  if (!token) {
    return {
      ...baseFail('token_not_found'),
      tokenId: payload.tokenId,
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      expiresAt: payload.expiresAt,
    };
  }

  const consistent =
    payload.tokenId === token.id &&
    payload.transactionId === token.transactionId &&
    payload.receiptCode === token.receiptCode &&
    payload.amount === token.amount &&
    payload.currency === token.currency &&
    payload.issuer === token.issuer &&
    payload.createdAt === token.createdAt &&
    payload.expiresAt === token.expiresAt &&
    payload.mockSignature === token.mockSignature;
  if (!consistent) return baseFail('signature_or_payload_mismatch', token);

  if (token.status !== 'created') {
    if (token.status === 'expired') return baseFail('expired', token);
    return baseFail('already_used', token);
  }

  const expired = Date.now() >= new Date(token.expiresAt).getTime();
  if (expired) {
    await expireCreatedOfflineToken(token);
    const refreshed = (await getOfflineTokens()).find((t) => t.id === token.id) ?? token;
    return { ...baseFail('expired', refreshed), notExpired: false };
  }

  const wallet = await getWallet();
  if (token.amount > wallet.offlineReserve) {
    return {
      ...baseFail('insufficient_reserved_balance', token),
      signatureVerified: true,
      reserveBacked: false,
      oneTimeToken: true,
      notExpired: true,
      risk: 'high',
    };
  }

  return {
    ok: true,
    token,
    tokenId: token.id,
    transactionId: token.transactionId,
    amount: token.amount,
    currency: token.currency,
    merchantId,
    expiresAt: token.expiresAt,
    status: 'valid',
    issuer: 'KICB_DEMO',
    signatureVerified: true,
    reserveBacked: true,
    oneTimeToken: true,
    notExpired: true,
    risk: 'low',
  };
}

export interface MerchantAcceptResult {
  token: OfflineToken;
  transaction: Transaction;
  merchant: PaymentMerchant;
  wallet: Wallet;
}

export async function merchantAcceptOfflinePayment(
  tokenId: string,
  merchantId: string,
): Promise<MerchantAcceptResult> {
  const merchant = getPaymentMerchantById(merchantId);
  if (!merchant) throw new Error('Merchant not found.');
  if (!merchant.offlineQrSupported) {
    throw new Error('Merchant does not support offline QR payments.');
  }

  const tokens = await getOfflineTokens();
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) throw new Error('Token not found.');

  if (token.status !== 'created') {
    throw new Error('Token already used');
  }

  if (Date.now() >= new Date(token.expiresAt).getTime()) {
    await expireCreatedOfflineToken(token);
    throw new Error('Token expired');
  }

  const wallet = await getWallet();
  if (token.amount > wallet.offlineReserve) {
    throw new Error('Amount exceeds reserved offline balance.');
  }

  const acceptedAt = nowIso();

  const updatedToken = await updateOfflineToken(tokenId, {
    status: 'accepted_offline',
    canCancel: false,
    merchantId: merchant.id,
    merchantName: merchant.name,
  });
  const updatedTx = await updateTransaction(token.transactionId, {
    status: 'accepted_offline',
    canCancel: false,
    merchantId: merchant.id,
    merchantName: merchant.name,
    acceptedAt,
  });

  if (!updatedToken || !updatedTx) {
    throw new Error('Failed to persist acceptance.');
  }

  const updatedWallet = await saveWallet({
    ...wallet,
    offlineReserve: wallet.offlineReserve - token.amount,
    lockedOffline: wallet.lockedOffline + token.amount,
    pendingSync: wallet.pendingSync + token.amount,
  });

  return {
    token: updatedToken,
    transaction: updatedTx,
    merchant,
    wallet: updatedWallet,
  };
}

// ── Sync offline payments ───────────────────────────────────────────────────
export async function syncOfflinePayments(): Promise<SyncResult> {
  const transactions = await getTransactions();
  const accepted = transactions.filter(
    (t) =>
      t.status === 'accepted_offline' &&
      (t.type === 'offline_qr_payment' ||
        t.type === 'offline_bluetooth_payment'),
  );

  if (accepted.length === 0) {
    return { syncedCount: 0, syncedAmount: 0, syncTransactionId: null };
  }

  await delay(750);

  const now = nowIso();
  let syncedAmount = 0;
  const acceptedTransactionIds = new Set(accepted.map((tx) => tx.id));
  for (const tx of accepted) {
    syncedAmount += tx.amount;
    await updateTransaction(tx.id, { status: 'synced', syncedAt: now });
  }

  const tokens = await getOfflineTokens();
  for (const token of tokens) {
    if (
      token.status === 'accepted_offline' &&
      acceptedTransactionIds.has(token.transactionId)
    ) {
      await updateOfflineToken(token.id, { status: 'synced' });
    }
  }

  const wallet = await getWallet();
  const next: Wallet = {
    ...wallet,
    lockedOffline: Math.max(0, wallet.lockedOffline - syncedAmount),
    pendingSync: Math.max(0, wallet.pendingSync - syncedAmount),
  };
  await saveWallet(next);

  const syncTx: Transaction = {
    id: makeId('tx'),
    type: 'sync',
    amount: syncedAmount,
    currency: 'KGS',
    merchantId: null,
    merchantName: null,
    status: 'synced',
    method: 'card_demo',
    canCancel: false,
    createdAt: now,
    acceptedAt: now,
    syncedAt: now,
    receiptCode: makeReceiptCode(),
  };
  await saveTransaction(syncTx);

  return {
    syncedCount: accepted.length,
    syncedAmount,
    syncTransactionId: syncTx.id,
  };
}

// ── Bluetooth demo ──────────────────────────────────────────────────────────
export interface BluetoothDemoInput {
  tokenId?: string;
  merchantId: string;
  amount?: number;
}

export interface BluetoothDemoResult {
  wallet: Wallet;
  transaction: Transaction;
  token: OfflineToken;
  merchant: PaymentMerchant;
}

/**
 * Bluetooth demo reuses the same KICB Demo signed-token logic as the offline
 * QR flow — the only difference is the transferMethod / method labels and
 * the requirement that the merchant supports bluetoothDemoSupported.
 *
 * If `tokenId` is provided, that existing token is delivered via Bluetooth.
 * Otherwise an `amount` must be provided and a fresh token is created.
 */
export async function sendViaBluetoothDemo(
  input: BluetoothDemoInput,
): Promise<BluetoothDemoResult> {
  const merchant = getPaymentMerchantById(input.merchantId);
  if (!merchant) throw new Error('Merchant not found.');
  if (!merchant.bluetoothDemoSupported) {
    throw new Error('Merchant does not support Bluetooth demo.');
  }

  let tokenId: string;

  if (input.tokenId) {
    const existing = (await getOfflineTokens()).find((t) => t.id === input.tokenId);
    if (!existing) throw new Error('Token not found.');
    if (existing.status !== 'created') {
      throw new Error('Token already used');
    }
    if (Date.now() >= new Date(existing.expiresAt).getTime()) {
      await expireCreatedOfflineToken(existing);
      throw new Error('Token expired');
    }
    tokenId = existing.id;

    await updateOfflineToken(existing.id, {
      transferMethod: 'bluetooth_demo',
    });
    await updateTransaction(existing.transactionId, {
      type: 'offline_bluetooth_payment',
      method: 'bluetooth_demo',
    });
  } else {
    if (!Number.isFinite(input.amount ?? NaN) || (input.amount ?? 0) <= 0) {
      throw new Error('Amount must be a positive number.');
    }
    const created = await createOfflineCustomerQRPayment(input.amount as number);
    tokenId = created.token.id;

    await updateOfflineToken(created.token.id, {
      transferMethod: 'bluetooth_demo',
    });
    await updateTransaction(created.transaction.id, {
      type: 'offline_bluetooth_payment',
      method: 'bluetooth_demo',
    });
  }

  const accepted = await merchantAcceptOfflinePayment(tokenId, merchant.id);

  return {
    wallet: accepted.wallet,
    transaction: accepted.transaction,
    token: accepted.token,
    merchant: accepted.merchant,
  };
}
