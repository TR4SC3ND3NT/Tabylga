import { getOrCreateKeyPair, verifySignature } from './signatures';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineToken {
  userId: string;
  limit: number;       // USD balance limit for offline spending
  expiresAt: number;   // Unix timestamp (ms)
  nonce: string;
  issuedAt: number;
}

export interface SignedOfflineToken {
  payload: OfflineToken;
  signature: string;
  publicKey: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default offline token validity: 24 hours */
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

// ─── Token Generation & Validation ──────────────────────────────────────────

/**
 * Generate a signed offline token (JWT-like structure).
 * The token contains { userId, limit, expiresAt, nonce } and is signed with Ed25519.
 */
export async function generateOfflineToken(
  userId: string,
  balanceLimit: number,
): Promise<SignedOfflineToken> {
  const { publicKey, privateKey: _pk } = await getOrCreateKeyPair();

  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const payload: OfflineToken = {
    userId,
    limit: balanceLimit,
    expiresAt: Date.now() + TOKEN_VALIDITY_MS,
    nonce,
    issuedAt: Date.now(),
  };

  // Sign the payload
  const { signTransaction } = await import('./signatures');
  const signed = await signTransaction(payload as unknown as Record<string, unknown>);

  return {
    payload,
    signature: signed.signature,
    publicKey,
  };
}

/**
 * Validate an offline token:
 * 1. Verify Ed25519 signature
 * 2. Check expiry
 *
 * Returns { valid, reason? }
 */
export function validateOfflineToken(
  token: SignedOfflineToken,
): { valid: boolean; reason?: string } {
  // 1. Verify signature
  const isValidSig = verifySignature(
    token.payload as unknown as Record<string, unknown>,
    token.signature,
    token.publicKey,
  );

  if (!isValidSig) {
    return { valid: false, reason: 'Invalid signature' };
  }

  // 2. Check expiry
  if (Date.now() > token.payload.expiresAt) {
    return { valid: false, reason: 'Token expired' };
  }

  return { valid: true };
}
