// ─── Stripe Test Mode Integration ─────────────────────────────────────────────
// For demo purposes, this simulates Stripe API calls with a 2s delay.
// In production, replace with actual Stripe SDK calls.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  amountUsd: number;
  timestamp: number;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePaymentId(): string {
  return `pi_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Luhn Algorithm ───────────────────────────────────────────────────────────

/**
 * Validate a card number using the Luhn algorithm.
 * Returns true if the card number passes the checksum.
 */
export function validateCard(number: string): boolean {
  // Strip spaces and dashes
  const cleaned = number.replace(/[\s-]/g, '');

  // Must be all digits, 13–19 characters
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  // Traverse from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

// ─── Payment Simulation ──────────────────────────────────────────────────────

/**
 * Simulate a Stripe test-mode payment.
 * In demo mode: waits 2 seconds and returns success.
 * Structure is ready for real Stripe SDK integration.
 */
export async function createTestPayment(amountUsd: number): Promise<PaymentResult> {
  if (amountUsd <= 0) {
    return {
      success: false,
      paymentId: '',
      amountUsd,
      timestamp: Date.now(),
      error: 'Amount must be greater than 0',
    };
  }

  // Simulate network delay (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate occasional failures for realism (5% chance)
  const shouldFail = Math.random() < 0.05;

  if (shouldFail) {
    return {
      success: false,
      paymentId: '',
      amountUsd,
      timestamp: Date.now(),
      error: 'Payment declined. Please try again.',
    };
  }

  return {
    success: true,
    paymentId: generatePaymentId(),
    amountUsd,
    timestamp: Date.now(),
  };
}
