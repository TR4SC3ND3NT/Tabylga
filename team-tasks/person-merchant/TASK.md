# Merchant & Offline Task — Payment Logic

You are responsible for the MERCHANT and OFFLINE PAYMENT logic. You work ONLY in the files listed below. Do NOT touch app/, components/ (except components/merchant/), or constants/.

## Your Files (ONLY these)
lib/crypto/                   ← NEW folder
lib/crypto/wallet.ts          ← offline wallet token generation
lib/crypto/signatures.ts      ← Ed25519 sign/verify with tweetnacl
lib/crypto/sync.ts            ← offline transaction queue + sync logic
lib/payments/                 ← NEW folder
lib/payments/stripe.ts        ← Stripe test mode integration
lib/payments/wallet.ts        ← wallet balance operations (top up, deduct, check)
lib/payments/exchange.ts      ← USD↔KGS conversion helpers
stores/walletStore.ts         ← NEW: wallet Zustand store
stores/merchantStore.ts       ← NEW: merchant Zustand store
components/merchant/          ← NEW folder: merchant-specific UI components (ONLY for merchant screens)

## Task 1 — Wallet Store
Create `stores/walletStore.ts` (Zustand):
- State: balanceUsd, balanceKgs, exchangeRate (default 87.0), transactions[], offlinePending[], offlineLimit (default 150), isOnline, lastSyncAt
- Actions:
  - topUp(amountUsd, method: 'card'|'mbank'|'applepay') — adds to balance, creates transaction record, saves to SQLite
  - pay(amountKgs, merchantName, merchantId?) — deducts from balance, creates transaction
  - payOffline(amountKgs, merchantName) — checks offlineLimit, creates signed offline transaction using lib/crypto/
  - syncOffline() — flushes offlinePending to regular transactions (simulated for demo)
  - getTransactionHistory(limit?) — reads from SQLite
- Persist balances to AsyncStorage for app restart survival
- On init: hydrate from AsyncStorage + load last 20 transactions from SQLite

## Task 2 — Merchant Store
Create `stores/merchantStore.ts` (Zustand):
- State: isMerchantMode, merchantProfile (name, category, verified, rating), todayEarnings, todayCount, weeklyData[], recentTransactions[]
- Actions:
  - toggleMerchantMode()
  - acceptPayment(amountKgs, description?) — creates incoming transaction
  - generatePaymentQR(amountKgs) — returns QR data string containing { merchantId, amount, nonce, timestamp }
  - getMerchantStats() — earnings today, this week, avg rating

## Task 3 — Offline Crypto
Create `lib/crypto/wallet.ts`:
- generateOfflineToken(userId, balanceLimit) — creates a signed JWT-like token { userId, limit, expiresAt, nonce } signed with Ed25519
- validateOfflineToken(token) — verifies signature, checks expiry

Create `lib/crypto/signatures.ts`:
- generateKeyPair() — uses tweetnacl.sign.keyPair(), stores private key in expo-secure-store
- signTransaction(tx) — signs transaction data with user's private key
- verifySignature(tx, publicKey) — verifies

Create `lib/crypto/sync.ts`:
- addToOfflineQueue(signedTx) — stores in AsyncStorage under 'offline_queue'
- getOfflineQueue() → SignedTransaction[]
- flushOfflineQueue() — for each pending tx: validate signature, move to transactions table, clear from queue
- Call flushOfflineQueue() automatically when network state changes to online (use NetInfo or just timer-based check for demo)

## Task 4 — Payment Helpers
Create `lib/payments/stripe.ts`:
- createTestPayment(amountUsd) — calls Stripe test mode (or just simulates with 2s delay returning success for demo)
- validateCard(number) — Luhn algorithm check

Create `lib/payments/wallet.ts`:
- Thin wrapper around walletStore for use in non-React contexts

Create `lib/payments/exchange.ts`:
- usdToKgs(usd, rate?) → number
- kgsToUsd(kgs, rate?) → number
- formatKgs(amount) → string like "12,450 KGS"
- formatUsd(amount) → string like "$143.00"
- getCurrentRate() → number (hardcoded 87.0 for demo, structure for API call later)

## Architectural Contracts
- Export TypeScript interfaces: Transaction, OfflineTransaction, MerchantProfile, WalletState
- All amounts stored in KGS internally, displayed in both currencies
- Transaction statuses: 'completed' | 'pending_sync' | 'failed' | 'refunded'
- QR data format: JSON.stringify({ type: 'tabylga_pay', merchantId, amount, currency: 'KGS', nonce, timestamp })
- tweetnacl is already installed — import from 'tweetnacl'
- expo-secure-store is already installed — use for private key storage

## DO NOT
- Touch any file in app/ (screens are built by team lead)
- Touch constants/, lib/db/ (except reading from db), lib/ai/
- Install packages without team lead approval
- Change the SQLite schema
