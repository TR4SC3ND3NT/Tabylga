# Tabylga

Tabylga is a React Native / Expo mobile app demo for tourism in Kyrgyzstan.
It combines trip planning, local service discovery, a demo wallet, and offline
merchant payments for remote travel scenarios where internet access is weak or
unavailable.

This repository is the mobile app. The app is built as an MVP/demo, not a real
banking product. Payment flows, QR flows, merchant acceptance, and settlement
are simulated locally for presentation and testing.

## Product Summary

Tabylga is designed for tourists visiting Kyrgyzstan who need one app for:

- AI-assisted trip planning.
- Hotels, food, transport, and activity discovery.
- A prepaid wallet in Kyrgyz som (KGS).
- Wallet top-up from demo international card or local QR.
- Online QR payment demo.
- Offline Pay activation before entering remote areas.
- Offline QR payments to yurt camps, drivers, guides, and guesthouses.
- Merchant Mode for accepting offline payments.
- Pending payment sync when internet becomes available.

The central demo story is:

1. A tourist tops up the wallet.
2. The tourist reserves part of the balance for Offline Pay.
3. The tourist generates a reserve-backed offline QR.
4. A merchant scans and verifies the token.
5. The merchant accepts the payment offline.
6. The payment stays pending sync.
7. When online, the payment syncs and becomes completed.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router for file-based navigation
- NativeWind / Tailwind classes plus project UI primitives
- Zustand stores
- AsyncStorage for local demo persistence
- expo-secure-store for secure local storage where needed
- expo-camera for QR scanning surfaces
- expo-location for location-based travel features
- react-native-qrcode-svg for QR generation
- lucide-react-native for icons
- tweetnacl for offline crypto demo utilities
- Google Gemini proxy/API support for AI trip generation

## Repository Structure

```text
app/
  (tabs)/                 Main tab screens: home, map, trips, wallet, profile
  auth/                   Phone and OTP auth screens
  merchant/               Merchant dashboard and offline payment acceptance
  services/               Hotels, food, transport, activities screens
  trip/                   AI trip planner and itinerary screens
  wallet/                 Wallet subflows: top-up, pay, offline pay, bluetooth

components/
  Button.tsx              Shared button primitive
  Card.tsx                Shared card primitive
  Input.tsx               Shared input primitive
  Pill.tsx                Status pill primitive
  wallet/                 Older wallet receipt/history components

constants/
  colors.ts               App colors
  shadows.ts              Shadow tokens
  spacing.ts              Spacing tokens
  typography.ts           Typography tokens

lib/
  ai/                     AI trip generation services
  api/                    2GIS, OSM, Wikipedia, geodata wrappers
  crypto/                 Offline signing helpers
  data/                   Demo places, merchants, activities, stays
  db/                     Local DB schema and seed helpers
  geo/                    Routing helpers
  offline/                Offline pack service
  payments/               Active wallet/payment service and strings

services/
  exchangeRateService.ts  NBKR USD/KGS exchange-rate helper
  paymentService.ts       Legacy compatibility payment service

stores/
  authStore.ts
  merchantStore.ts
  onboardingStore.ts
  travelPreferencesStore.ts
  tripStore.ts
  walletStore.ts

utils/
  amountValidation.ts
  cardValidation.ts
  formatMoney.ts

docs/
  PROJECT.md              Full product brief and product strategy

dashboard/
  Next.js demo dashboard project
```

## Prerequisites

Install these before running the app:

- Node.js 20 or newer
- npm
- Expo CLI through `npx expo`
- Android Studio or Xcode if running native builds
- Expo Go or a development build for device testing

## Environment Setup

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill only the values you need for the flow you are testing:

```text
GEMINI_API_KEY=
EXPO_PUBLIC_GEMINI_PROXY_URL=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_2GIS_API_KEY=
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=
EXPO_PUBLIC_OVERPASS_URL=https://overpass-api.de/api/interpreter
EXPO_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org
EXPO_PUBLIC_WIKIPEDIA_URL=https://en.wikipedia.org/api/rest_v1
```

Do not commit `.env.local`.

## Installation

```bash
npm install
```

If you want a clean install using the lockfile:

```bash
npm ci
```

## Running The App

Start Expo:

```bash
npm start
```

Run web:

```bash
npm run web
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

Build/export web:

```bash
npm run build
```

Optional AI planner proxy:

```bash
npm run serve:ai
```

## Main Demo Flows

### Flow A - Top Up Wallet With International Card Demo

1. Open Wallet.
2. Tap Top up.
3. Choose `$50`.
4. Select `International card demo`.
5. Tap `Use demo Visa`.
6. Confirm top-up.
7. Watch processing steps:
   - Authorizing card
   - Converting USD to KGS
   - Crediting wallet
8. Success receipt shows:
   - Charged USD amount
   - FX rate
   - Received KGS amount
   - Demo card ending
   - Receipt code
   - Remaining spendable balance
9. Return to Wallet and confirm balance update.

Demo Visa:

```text
4242 4242 4242 4242
12 / 29
123
```

Demo Mastercard:

```text
5555 5555 5555 4444
12 / 29
123
```

### Flow B - Top Up Wallet With Local QR Demo

1. Open Wallet.
2. Tap Top up.
3. Choose an amount.
4. Select `Local QR demo`.
5. Confirm top-up.
6. A QR payment screen appears first.
7. Tap `Simulate payment received`.
8. Watch processing steps:
   - Receiving local QR payment
   - Converting USD to KGS
   - Crediting wallet
9. Success receipt uses the same receipt code from the QR payload.
10. Return to Wallet and confirm balance update.

### Flow C - Activate Offline Pay

1. Wallet must have available online balance.
2. Open `Activate Offline Pay`.
3. Choose 500, 1000, 2000 KGS, or Custom.
4. Confirm activation.
5. The selected amount moves from `Available online` to
   `Reserved for future offline payments`.
6. Receipt shows KICB Demo tokens issued.

If available balance is 0, the screen shows:

```text
Top up your wallet before activating Offline Pay.
```

### Flow D - Offline QR Payment

1. Activate Offline Pay first.
2. Open `Pay Offline`.
3. Choose an amount that does not exceed reserved offline balance.
4. Generate Offline QR.
5. QR shows:
   - Amount
   - Issuer: KICB Demo
   - Signature status
   - Token ID
   - Transaction ID
   - Receipt code
   - Expiry
   - Payload preview
6. Generating the QR does not deduct balance yet.
7. Status stays `Waiting for merchant scan`.

### Flow E - Merchant Accepts Offline Payment

1. Open Merchant Mode.
2. Select `Shepherd's Life Yurt Camp` or another offline merchant.
3. Tap `Demo scan latest token`.
4. Offline payment request opens.
5. Verify trust signals:
   - Issued by KICB Demo
   - Signature verified
   - Reserve-backed token
   - One-time token
   - Not expired
   - Receipt will be saved for sync
6. Tap `Accept payment`.
7. Success screen shows:
   - Amount
   - Merchant
   - Pending sync status
   - Receipt code
   - Token ID
   - Accepted time

After acceptance:

- Reserved offline balance decreases.
- Already deducted and waiting increases.
- Offline payments waiting for internet increases.
- Merchant dashboard shows a pending sync card.

### Flow F - Sync Offline Payments

1. Open Wallet or Merchant Mode.
2. Tap Sync Payments / Sync when online.
3. If there are no pending payments, a clear message is shown.
4. If there are pending payments:
   - Accepted offline transactions become synced.
   - Offline tokens become synced.
   - Pending sync balance clears.
   - Already deducted/waiting balance clears.
   - A sync settlement transaction is recorded.

## Wallet State Model

The active implementation lives in:

```text
lib/payments/paymentService.ts
```

Wallet buckets:

```text
availableOnline
  Money available online and not reserved.

offlineReserve
  Money reserved for future offline payments.

lockedOffline
  Money already accepted by a merchant offline and waiting for sync.

pendingSync
  Total accepted offline payments waiting for online settlement.

totalBalance
  Remaining spendable balance shown in the wallet hero.
  It is derived from availableOnline + offlineReserve.
```

The demo state version is:

```text
WALLET_DEMO_STATE_VERSION = 2
```

If an older persisted demo state is detected, the wallet, transactions, and
offline tokens reset to a clean 0 KGS demo state.

## Exchange Rate Logic

Exchange rate logic is in:

```text
services/exchangeRateService.ts
```

The top-up screen fetches USD/KGS from the official National Bank of the
Kyrgyz Republic XML endpoint:

```text
https://www.nbkr.kg/XML/daily.xml
```

The parser handles comma decimal separators such as:

```text
87,4205 -> 87.4205
```

If NBKR is unavailable or XML parsing fails, the app uses:

```text
FALLBACK_USD_KGS_RATE = 87.5
```

The UI shows:

```text
Rate unavailable, demo fallback rate used.
```

Top-up still works in fallback mode because this is a demo.

## Card Validation

Card helpers are in:

```text
utils/cardValidation.ts
```

Validation includes:

- Required card number.
- Spaces removed before validation.
- Luhn algorithm.
- Visa, Mastercard, and UnionPay brand detection.
- Expiry format `MM / YY`.
- Month range validation.
- Expiry must not be in the past.
- CVC must be 3 digits for Visa/Mastercard.

The app disables top-up until the selected payment method is valid.

## Money Formatting And Amount Limits

Money formatting is in:

```text
utils/formatMoney.ts
```

Amount validation is in:

```text
utils/amountValidation.ts
```

Top-up demo limits:

```text
MAX_TOPUP_USD = 1000
MAX_WALLET_BALANCE_KGS = 100000
```

Examples:

```text
$50
$1,000
$25.50
4,375 KGS
99,250 KGS
```

## Important Demo Notes

This project intentionally does not include real payment integration.

Demo-only pieces:

- International card top-up.
- Local QR top-up.
- Offline QR token verification.
- Merchant acceptance.
- Settlement sync.
- KICB Demo token issuance.
- Wallet persistence in local storage.

Production integrations would need:

- Licensed payment partner integration.
- Real KYC/KYB.
- Server-side anti-double-spend checks.
- Audited offline token protocol.
- Bank settlement API.
- Secure backend transaction ledger.

## Quality Checks

Run TypeScript:

```bash
npx tsc --noEmit
```

Run web export build:

```bash
npm run build
```

The wallet/offline payment flow was checked with:

```bash
npx.cmd tsc --noEmit
npm.cmd run build
```

## Development Rules

- Keep wallet/payment logic in `lib/payments/paymentService.ts`.
- Do not add a second wallet source of truth.
- Do not auto-load fake balances by default.
- Keep demo state reset/migration safe.
- Do not make QR generation deduct money before merchant acceptance.
- Do not silently disable buttons. Show a reason.
- Do not commit `.env.local`.
- Do not put real API keys in the repository.

## Useful Project Docs

- `docs/PROJECT.md` - product brief and strategy.
- `CLAUDE.md` - local agent/project instructions.
- `pitch/` - pitch script, market data, competitor responses.
- `team-tasks/` - task briefs for specific project areas.
- `dashboard/README.md` - separate dashboard project notes.

