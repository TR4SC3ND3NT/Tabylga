import * as nacl from 'tweetnacl';
import * as SecureStore from 'expo-secure-store';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIVATE_KEY_STORE = 'tabylga_ed25519_private';
const PUBLIC_KEY_STORE = 'tabylga_ed25519_public';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Uint8Array → base64 string */
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** base64 string → Uint8Array */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode a string to Uint8Array (UTF-8) */
function encodeUTF8(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// ─── Key Management ──────────────────────────────────────────────────────────

/**
 * Generate an Ed25519 key pair using tweetnacl.
 * Private key is stored in expo-secure-store; public key is also cached.
 * Returns the public key as a base64 string.
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = nacl.sign.keyPair();

  const publicKeyB64 = toBase64(keyPair.publicKey);
  const privateKeyB64 = toBase64(keyPair.secretKey);

  // Store in secure storage
  await SecureStore.setItemAsync(PRIVATE_KEY_STORE, privateKeyB64);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORE, publicKeyB64);

  return { publicKey: publicKeyB64, privateKey: privateKeyB64 };
}

/**
 * Retrieve the stored key pair, or generate a new one if none exists.
 */
export async function getOrCreateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const existingPrivate = await SecureStore.getItemAsync(PRIVATE_KEY_STORE);
  const existingPublic = await SecureStore.getItemAsync(PUBLIC_KEY_STORE);

  if (existingPrivate && existingPublic) {
    return { publicKey: existingPublic, privateKey: existingPrivate };
  }

  return generateKeyPair();
}

/**
 * Get the stored public key, or null if no key pair exists.
 */
export async function getPublicKey(): Promise<string | null> {
  return SecureStore.getItemAsync(PUBLIC_KEY_STORE);
}

// ─── Signing & Verification ──────────────────────────────────────────────────

/**
 * Sign transaction data with the user's private key.
 * Returns the original data + signature and public key.
 */
export async function signTransaction(
  tx: Record<string, unknown>,
): Promise<{ signature: string; publicKey: string; data: Record<string, unknown> }> {
  const { publicKey, privateKey } = await getOrCreateKeyPair();

  const message = JSON.stringify(tx);
  const messageBytes = encodeUTF8(message);
  const privateKeyBytes = fromBase64(privateKey);

  const signatureBytes = nacl.sign.detached(messageBytes, privateKeyBytes);
  const signature = toBase64(signatureBytes);

  return {
    signature,
    publicKey,
    data: tx,
  };
}

/**
 * Verify a transaction signature against a public key.
 * Returns true if the signature is valid.
 */
export function verifySignature(
  tx: Record<string, unknown>,
  signature: string,
  publicKey: string,
): boolean {
  try {
    const message = JSON.stringify(tx);
    const messageBytes = encodeUTF8(message);
    const signatureBytes = fromBase64(signature);
    const publicKeyBytes = fromBase64(publicKey);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
