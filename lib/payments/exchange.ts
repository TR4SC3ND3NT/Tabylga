// ─── Exchange Rate Helpers ────────────────────────────────────────────────────
// All amounts stored in KGS internally; these helpers convert and format.

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_RATE = 87.0; // KGS per 1 USD

// ─── Conversion ──────────────────────────────────────────────────────────────

/**
 * Convert USD to KGS.
 */
export function usdToKgs(usd: number, rate: number = DEFAULT_RATE): number {
  return Math.round(usd * rate * 100) / 100;
}

/**
 * Convert KGS to USD.
 */
export function kgsToUsd(kgs: number, rate: number = DEFAULT_RATE): number {
  return Math.round((kgs / rate) * 100) / 100;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format an amount in KGS with thousands separators.
 * Example: 12450 → "12,450 KGS"
 */
export function formatKgs(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} KGS`;
}

/**
 * Format an amount in USD with dollar sign.
 * Example: 143 → "$143.00"
 */
export function formatUsd(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `$${rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Rate Provider ───────────────────────────────────────────────────────────

/**
 * Get the current USD → KGS exchange rate.
 * Hardcoded to 87.0 for demo. Structured for future API call.
 */
export function getCurrentRate(): number {
  // TODO: In production, fetch from an API:
  // const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=KGS');
  // const data = await response.json();
  // return data.rates.KGS;
  return DEFAULT_RATE;
}
