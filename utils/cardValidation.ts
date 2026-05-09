export type CardBrand = 'Visa' | 'Mastercard' | 'UnionPay' | 'Unknown';

export interface CardValidationResult {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  error: string | null;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function detectCardBrand(raw: string): CardBrand {
  const digits = raw.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^62/.test(digits)) return 'UnionPay';
  return 'Unknown';
}

export function isValidLuhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function validateExpiry(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return 'Expiry is required.';
  if (digits.length !== 4) return 'Enter expiry as MM / YY.';

  const month = Number(digits.slice(0, 2));
  const year = Number(`20${digits.slice(2)}`);
  if (month < 1 || month > 12) return 'Expiry month must be 01-12.';

  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  if (expiryDate.getTime() < Date.now()) return 'Card is expired.';

  return null;
}

export function validateDemoCard(
  cardNumber: string,
  expiry: string,
  cvc: string,
): CardValidationResult {
  const digits = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(digits);
  const last4 = digits.slice(-4);

  if (digits.length === 0) {
    return { valid: false, brand, last4, error: 'Card number is required.' };
  }
  if (!isValidLuhn(digits)) {
    return { valid: false, brand, last4, error: 'Enter a valid demo card number.' };
  }
  if (brand === 'Unknown') {
    return { valid: false, brand, last4, error: 'Unsupported card type in demo mode.' };
  }

  const expiryError = validateExpiry(expiry);
  if (expiryError) return { valid: false, brand, last4, error: expiryError };

  const cvcDigits = cvc.replace(/\D/g, '');
  if (cvcDigits.length === 0) {
    return { valid: false, brand, last4, error: 'CVC is required.' };
  }
  if (!/^\d{3}$/.test(cvcDigits)) {
    return { valid: false, brand, last4, error: 'CVC must be 3 digits.' };
  }

  return { valid: true, brand, last4, error: null };
}
