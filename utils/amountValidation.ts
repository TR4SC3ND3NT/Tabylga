import type { Wallet } from '../lib/payments/paymentService';

export const MAX_TOPUP_USD = 1000;
export const MAX_WALLET_BALANCE_KGS = 100000;

export interface AmountValidationResult {
  valid: boolean;
  error: string | null;
}

export function sanitizeUsdInput(text: string): string {
  const normalized = text.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole, ...decimalParts] = normalized.split('.');
  const decimals = decimalParts.join('').slice(0, 2);
  return decimalParts.length > 0 ? `${whole}.${decimals}` : whole;
}

export function parseUsdAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function validateTopUpAmount(
  amountUsd: number | null,
  convertedKgs: number,
  wallet: Wallet | null,
): AmountValidationResult {
  if (amountUsd === null || !Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { valid: false, error: 'Enter a valid amount.' };
  }

  if (amountUsd > MAX_TOPUP_USD) {
    return { valid: false, error: 'Maximum top-up is $1,000 in demo mode.' };
  }

  if (wallet && wallet.availableOnline + convertedKgs > MAX_WALLET_BALANCE_KGS) {
    return { valid: false, error: 'This top-up exceeds your wallet limit.' };
  }

  return { valid: true, error: null };
}
