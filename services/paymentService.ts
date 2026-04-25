import AsyncStorage from '@react-native-async-storage/async-storage';
import { merchants, PaymentMerchant } from '../data/paymentMerchants';

const KEYS = {
  WALLET: 'tabylga_wallet',
  TRANSACTIONS: 'tabylga_transactions',
  OFFLINE_TOKENS: 'tabylga_offline_tokens',
  MERCHANTS: 'tabylga_payment_merchants',
  DEMO_SESSION: 'tabylga_payment_demo_session'
};

export interface Wallet {
  totalBalance: number;
  availableOnline: number;
  offlineReserve: number;
  lockedOffline: number;
  pendingSync: number;
  currency: 'KGS';
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'top_up' | 'online_qr_payment' | 'offline_reserve' | 'offline_qr_payment' | 'offline_bluetooth_payment' | 'sync';
  amount: number;
  currency: 'KGS';
  merchantId: string | null;
  merchantName: string | null;
  status: 'completed_online' | 'waiting_merchant_acceptance' | 'accepted_offline' | 'synced' | 'expired' | 'failed_demo';
  method: 'card_demo' | 'online_qr_demo' | 'offline_customer_qr' | 'bluetooth_demo';
  canCancel: boolean;
  createdAt: string;
  acceptedAt: string | null;
  syncedAt: string | null;
  receiptCode: string;
}

export interface OfflineToken {
  id: string;
  transactionId: string;
  amount: number;
  currency: 'KGS';
  issuer: 'KICB_DEMO';
  merchantId: string | null;
  merchantName: string | null;
  status: 'created' | 'shown_to_merchant' | 'accepted_offline' | 'synced' | 'expired';
  transferMethod: 'offline_customer_qr' | 'bluetooth_demo';
  createdAt: string;
  expiresAt: string;
  canCancel: boolean;
  mockSignature: string;
  qrPayload: string;
}

const DEFAULT_WALLET: Wallet = {
  totalBalance: 10000,
  availableOnline: 10000,
  offlineReserve: 0,
  lockedOffline: 0,
  pendingSync: 0,
  currency: 'KGS',
  updatedAt: new Date().toISOString()
};

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function generateReceiptCode() {
  return 'REC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const paymentService = {
  async getWallet(): Promise<Wallet> {
    const data = await AsyncStorage.getItem(KEYS.WALLET);
    if (!data) return DEFAULT_WALLET;
    return JSON.parse(data);
  },

  async saveWallet(wallet: Wallet): Promise<void> {
    wallet.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
  },

  async resetWalletDemo(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.WALLET);
    await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
    await AsyncStorage.removeItem(KEYS.OFFLINE_TOKENS);
  },

  async getTransactions(): Promise<Transaction[]> {
    const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    if (!data) return [];
    return JSON.parse(data);
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.unshift(transaction);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex((t) => t.id === transactionId);
    if (index >= 0) {
      transactions[index] = { ...transactions[index], ...updates };
      await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  },

  async getOfflineTokens(): Promise<OfflineToken[]> {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_TOKENS);
    if (!data) return [];
    return JSON.parse(data);
  },

  async saveOfflineToken(token: OfflineToken): Promise<void> {
    const tokens = await this.getOfflineTokens();
    tokens.unshift(token);
    await AsyncStorage.setItem(KEYS.OFFLINE_TOKENS, JSON.stringify(tokens));
  },

  async updateOfflineToken(tokenId: string, updates: Partial<OfflineToken>): Promise<void> {
    const tokens = await this.getOfflineTokens();
    const index = tokens.findIndex((t) => t.id === tokenId);
    if (index >= 0) {
      tokens[index] = { ...tokens[index], ...updates };
      await AsyncStorage.setItem(KEYS.OFFLINE_TOKENS, JSON.stringify(tokens));
    }
  },

  async getPaymentMerchants(): Promise<PaymentMerchant[]> {
    return merchants;
  },

  async getOnlineQRMerchants(): Promise<PaymentMerchant[]> {
    return merchants.filter(m => m.onlineQrSupported);
  },

  async getOfflineMerchants(): Promise<PaymentMerchant[]> {
    return merchants.filter(m => m.offlineQrSupported);
  },

  async getBluetoothMerchants(): Promise<PaymentMerchant[]> {
    return merchants.filter(m => m.bluetoothDemoSupported);
  },

  async topUpWallet(amount: number, method: 'card_demo' | 'online_qr_demo'): Promise<void> {
    const wallet = await this.getWallet();
    wallet.totalBalance += amount;
    wallet.availableOnline += amount;
    await this.saveWallet(wallet);

    const transaction: Transaction = {
      id: generateId(),
      type: 'top_up',
      amount,
      currency: 'KGS',
      merchantId: null,
      merchantName: null,
      status: 'completed_online',
      method,
      canCancel: false,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      syncedAt: null,
      receiptCode: generateReceiptCode()
    };
    await this.saveTransaction(transaction);
  },

  async payOnlineQR({ merchantId, amount }: { merchantId: string; amount: number }): Promise<void> {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant || !merchant.onlineQrSupported) throw new Error('Merchant does not support online QR');

    const wallet = await this.getWallet();
    if (amount > wallet.availableOnline) throw new Error('Insufficient online balance');

    wallet.availableOnline -= amount;
    wallet.totalBalance -= amount;
    await this.saveWallet(wallet);

    const transaction: Transaction = {
      id: generateId(),
      type: 'online_qr_payment',
      amount,
      currency: 'KGS',
      merchantId: merchant.id,
      merchantName: merchant.name,
      status: 'completed_online',
      method: 'online_qr_demo',
      canCancel: false,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      syncedAt: null,
      receiptCode: generateReceiptCode()
    };
    await this.saveTransaction(transaction);
  },

  async activateOfflineReserve(amount: number): Promise<void> {
    const wallet = await this.getWallet();
    if (amount > wallet.availableOnline) throw new Error('Insufficient online balance');

    wallet.availableOnline -= amount;
    wallet.offlineReserve += amount;
    await this.saveWallet(wallet);

    const transaction: Transaction = {
      id: generateId(),
      type: 'offline_reserve',
      amount,
      currency: 'KGS',
      merchantId: null,
      merchantName: null,
      status: 'completed_online',
      method: 'card_demo',
      canCancel: false,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      syncedAt: null,
      receiptCode: generateReceiptCode()
    };
    await this.saveTransaction(transaction);
  },

  async createOfflineCustomerQRPayment(amount: number): Promise<OfflineToken> {
    const wallet = await this.getWallet();
    if (amount > wallet.offlineReserve) throw new Error('Insufficient offline reserve');

    wallet.offlineReserve -= amount;
    wallet.lockedOffline += amount;
    wallet.pendingSync += amount;
    await this.saveWallet(wallet);

    const transactionId = generateId();
    const tokenId = generateId();

    const transaction: Transaction = {
      id: transactionId,
      type: 'offline_qr_payment',
      amount,
      currency: 'KGS',
      merchantId: null,
      merchantName: null,
      status: 'waiting_merchant_acceptance',
      method: 'offline_customer_qr',
      canCancel: true,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      syncedAt: null,
      receiptCode: generateReceiptCode()
    };
    await this.saveTransaction(transaction);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const qrPayloadObj = {
      tokenId,
      transactionId,
      amount,
      currency: 'KGS',
      issuer: 'KICB_DEMO',
      createdAt: transaction.createdAt,
      expiresAt: expiresAt.toISOString(),
      nonce: generateId(),
      mockSignature: 'sig_' + generateId()
    };

    const token: OfflineToken = {
      id: tokenId,
      transactionId,
      amount,
      currency: 'KGS',
      issuer: 'KICB_DEMO',
      merchantId: null,
      merchantName: null,
      status: 'created',
      transferMethod: 'offline_customer_qr',
      createdAt: transaction.createdAt,
      expiresAt: expiresAt.toISOString(),
      canCancel: true,
      mockSignature: qrPayloadObj.mockSignature,
      qrPayload: JSON.stringify(qrPayloadObj)
    };
    await this.saveOfflineToken(token);

    return token;
  },

  async merchantScanOfflineQR(qrPayload: string, merchantId: string): Promise<{ success: boolean; token?: OfflineToken; error?: string }> {
    try {
      const payload = JSON.parse(qrPayload);
      const tokens = await this.getOfflineTokens();
      const token = tokens.find(t => t.id === payload.tokenId);

      if (!token) return { success: false, error: 'Token not found' };
      if (token.status !== 'created' && token.status !== 'shown_to_merchant') return { success: false, error: 'Token already used or invalid' };
      if (new Date() > new Date(token.expiresAt)) return { success: false, error: 'Token expired' };

      return { success: true, token };
    } catch (e) {
      return { success: false, error: 'Invalid QR payload' };
    }
  },

  async merchantAcceptOfflinePayment(tokenId: string, merchantId: string): Promise<void> {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) throw new Error('Merchant not found');

    const tokens = await this.getOfflineTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'accepted_offline';
    token.canCancel = false;
    token.merchantId = merchant.id;
    token.merchantName = merchant.name;
    await this.updateOfflineToken(tokenId, token);

    const now = new Date().toISOString();
    await this.updateTransaction(token.transactionId, {
      status: 'accepted_offline',
      canCancel: false,
      merchantId: merchant.id,
      merchantName: merchant.name,
      acceptedAt: now
    });
  },

  async syncOfflinePayments(): Promise<void> {
    const transactions = await this.getTransactions();
    const acceptedTransactions = transactions.filter(t => t.status === 'accepted_offline');

    if (acceptedTransactions.length === 0) return;

    let totalSyncedAmount = 0;
    const now = new Date().toISOString();

    for (const tx of acceptedTransactions) {
      totalSyncedAmount += tx.amount;
      await this.updateTransaction(tx.id, {
        status: 'synced',
        syncedAt: now
      });
    }

    const tokens = await this.getOfflineTokens();
    for (const t of tokens) {
      if (t.status === 'accepted_offline') {
        await this.updateOfflineToken(t.id, { status: 'synced' });
      }
    }

    const wallet = await this.getWallet();
    wallet.lockedOffline -= totalSyncedAmount;
    wallet.pendingSync -= totalSyncedAmount;
    wallet.totalBalance -= totalSyncedAmount;
    await this.saveWallet(wallet);

    const syncTransaction: Transaction = {
      id: generateId(),
      type: 'sync',
      amount: totalSyncedAmount,
      currency: 'KGS',
      merchantId: null,
      merchantName: 'Settlement Sync',
      status: 'synced',
      method: 'card_demo', // or another appropriate method
      canCancel: false,
      createdAt: now,
      acceptedAt: now,
      syncedAt: now,
      receiptCode: generateReceiptCode()
    };
    await this.saveTransaction(syncTransaction);
  },

  async sendViaBluetoothDemo({ tokenId, merchantId }: { tokenId: string; merchantId: string }): Promise<void> {
    const tokens = await this.getOfflineTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) throw new Error('Token not found');

    await this.updateOfflineToken(tokenId, { transferMethod: 'bluetooth_demo' });
    await this.updateTransaction(token.transactionId, { method: 'bluetooth_demo' });

    await this.merchantAcceptOfflinePayment(tokenId, merchantId);
  }
};
