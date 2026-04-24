# Tabylga — Project Brief

> Single source of truth for the Tabylga mobile application. Read this document first, before any other project file, before writing any code, and before making any architectural decision. When in doubt, this document wins.

---

## 1. Product in One Sentence

Tabylga is an all-in-one travel companion app for tourists visiting Kyrgyzstan that combines AI-powered trip planning, modular booking services (hotels, food, transport, activities), and a unified multi-currency wallet that works offline in the mountains — turning a fragmented cash-based tourism economy into a single digital experience.

---

## 2. The Problem We Solve

Kyrgyzstan received 8.8 million visits in 2024 and generated $1.1 billion in tourism revenue in 2025, yet the tourist experience on the ground is broken:

- **Fragmentation.** A single tourist needs 5+ separate apps: one for ride-hailing, another for food delivery, another for hotel booking, another for currency exchange, another for maps with offline data. None are integrated, none speak to each other, and most only have interfaces in Russian.
- **Payment gaps.** Outside of Bishkek and major Issyk-Kul resorts, the country runs on cash. Yurt camps on Song-Kul, guides in Arslanbob, private drivers, national park entrances, and village guesthouses accept only Kyrgyz som in physical bills. Foreign tourists arriving with Visa, Mastercard, Mir, UnionPay, or MBank cards cannot pay directly. They lose money at informal exchange counters, carry risky amounts of cash, or simply cannot transact at all.
- **Infrastructure blind spot.** The state has already invested in physical infrastructure — Rest Points along highways, visitor centers, park entrance stations — but none of these are digitized as revenue collection points. Cash disappears into a grey economy. The government's own brief for this sector explicitly states: *"We have mountains, routes, visitor centers and Rest Points. We're missing one thing — a sustainable digital revenue model."*
- **Planning overhead.** First-time visitors from Europe, the Gulf, China, and the US spend 10–20 hours researching itineraries across Reddit threads, blog posts, and outdated Tripadvisor reviews before they even buy a ticket. By the time they land, they've already decided to stay in Bishkek and maybe visit Issyk-Kul for a weekend — bypassing 90% of the country's revenue-generating regions.
- **Micro-merchant exclusion.** Yurt hosts, local guides, private drivers, and family homestay operators have no realistic path to accept cashless payments. A KICB merchant contract requires paperwork, a fixed location, a POS terminal, and internet. A shepherd hosting two tourists on Song-Kul meets none of these criteria, so remains locked out of the formal economy forever — meaning he never builds a transaction history, never qualifies for credit, and never scales.

Tabylga closes all five gaps in one product.

---

## 3. Product Pillars

The application rests on three equally important pillars. Removing any one of them collapses the business model.

### 3.1 Modular Services

Each major travel service is a first-class independent module that works without engaging any other module. A user who only wants to find a hotel near their current location at 2 AM after a late flight can do exactly that, in two taps, without ever seeing the AI planner. The modules are:

- **Hotels.** Hotels, hostels, yurts, guesthouses, homestays. Filter by price, rating, type, amenities, distance, countryside/urban, free cancellation. Each listing shows real photos, verified reviews, live availability, and instant booking with wallet payment.
- **Food.** Dine-in restaurants and cafes plus delivery (Glovo-style flow when delivery mode is selected). Categorized by cuisine, with open-now filtering, menu previews, and reservation or delivery ordering.
- **Transport.** Taxi (Uber-style with map pickup/dropoff and per-class pricing with driver ratings), intercity transfers (Bishkek ↔ Cholpon-Ata, Bishkek ↔ Osh, etc.), and car rental.
- **Activities.** Guided tours, local guides, horse riding, trekking, cultural experiences, eagle hunting demos, festivals (including World Nomad Games 2026 which Kyrgyzstan is hosting). Each activity shows the host/operator with their rating, itinerary, difficulty, and group size.

Every module writes into the same underlying wallet — the user never enters a card number twice.

### 3.2 AI Trip Generation

For users who want the full experience planned for them, Tabylga offers an AI-powered planner that produces a complete day-by-day itinerary in under 10 seconds. Two entry paths:

- **Structured quiz.** Six steps: trip purpose (leisure, adventure, family, business, romantic, cultural, digital nomad, pilgrimage), companions and age range, duration, budget, activity level, interests and dietary/accessibility requirements.
- **Voice conversation.** A dark-themed voice-first interface where the user speaks naturally in any of six supported languages. The AI asks follow-up questions, confirms understanding, and produces the same structured itinerary output. Real-time transcription is shown so the user sees what the AI heard.

The generator is powered by Google Gemini 2.5 Flash (primary) with Groq Llama 3.3 70B as fallback. Prompts are grounded in our own places database (populated from OpenStreetMap Overpass API), so the AI can only recommend real locations that exist, have coordinates, and have matching categories — no hallucinated hotels.

The output is an editable itinerary: the user can swap any activity, reshuffle a day, add suggested upsells from the AI ("5 out of 6 people in your age group added horseback riding on day 3 — add for $25?"), or accept as-is. When the user confirms, the total cost is locked and the wallet is charged.

A collaborative mode lets a group of friends or family plan together: each participant adds their own preferences, the AI computes a consensus route based on overlapping interests and the combined age range of the group.

### 3.3 Unified Wallet with Offline Mode

One prepaid wallet for the entire trip. The user tops it up once, from any source, and pays everywhere.

**Supported top-up methods:**
- MBank (prominent placement — primary for regional tourists from Russia, Kazakhstan, Uzbekistan)
- Visa, Mastercard, Mir (international networks)
- UnionPay (Chinese tourists)
- Apple Pay, Google Pay

All top-ups convert on the spot to Kyrgyz som at the daily KICB exchange rate. The user sees both USD and KGS balance at all times.

**Payment surface:** anywhere a merchant has a Tabylga QR code or an ELQR-compatible code. The app scans, the user confirms the amount, the transaction settles through the KICB rails. The merchant receives KGS in their bank account.

**Offline mode — the killer feature.** When the app is online, it silently pre-issues a signed offline-spendable token with a conservative limit (default $150 equivalent). If the user loses signal in the mountains — Song-Kul, Sary-Chelek, Saimaluu-Tash, high valleys without 3G — they can still pay yurt hosts, guides, and drivers. The flow:

1. User shows their QR (contains signed wallet token).
2. Merchant scans with their own Tabylga merchant app.
3. The transaction is signed locally by both parties using Ed25519 (tweetnacl library), stored in a pending queue on both devices.
4. When either device returns to signal range, the queue flushes to our Supabase Edge Function, the server validates signatures, checks against the offline limit to prevent double-spend, and settles the transaction.

The visible indicator to the user is always present at the top of the wallet: green dot "online", gold dot "offline ready — $150 available", red dot "reconnecting".

**Merchant side.** Yurt hosts, drivers, guides, and small shops register in under two minutes: photo of ID, name, bank card for payout. They download the same Tabylga app, toggle to Merchant mode, and immediately accept QR payments. No POS terminal, no paperwork, no business registration required for the MVP phase (formal KYC/KYB layered on during production).

---

## 4. Target Users

### 4.1 Primary: International inbound tourists (25–45 years old)

- German, French, British, American, Dutch, Japanese, Korean, Chinese individual travelers and couples
- First or second visit to Central Asia
- English-speaking (or comfortable with translation)
- Comfortable with Airbnb, Uber, Booking.com as baseline apps — Tabylga must not feel less polished than these
- Primary concern is trust: they're handing over a credit card in a country they don't know
- Expected AOV (average order value): $300–$1,500 per trip

### 4.2 Secondary: CIS regional tourists (25–55)

- Russian, Kazakh, Uzbek travelers
- Often prefer MBank over Visa/Mastercard
- Shorter trips, lower per-day budget, but higher volume — 95% of inbound tourism by count is from CIS
- Russian-language interface is essential

### 4.3 Tertiary: Gulf, China, India visitors (30–50)

- Growing segment, higher spend
- Require halal food filtering (Gulf), UnionPay support (China), vegetarian options (India)
- Arabic RTL layout required for Gulf users

### 4.4 Supply-side user: Micro-merchants (any age)

- Yurt hosts, guides, drivers, homestay operators, small café owners
- Often in regions with poor connectivity
- Rarely have formal bank relationships
- Need a dead-simple merchant flow: enter amount, show QR, get money

---

## 5. Application Structure

### 5.1 Navigation

Bottom tab bar with five tabs, identical on iOS and Android:

1. **Home** — service entry points, AI planner CTA, countryside retreat promotions
2. **Map** — full-screen Mapbox map with all categorized places and current location
3. **Trips** — user's saved and active itineraries
4. **Wallet** — balance, top-up, pay, receive, transaction history
5. **Profile** — settings, languages, reviews, merchant mode toggle

A floating microphone button sits above the tab bar on main screens — "hold to talk to AI" from anywhere.

### 5.2 Complete Screen Inventory (28 screens)

**Onboarding (4 screens):**
1. Splash & Language Select
2. Welcome Carousel (3 internal slides)
3. Authentication — phone entry
4. Authentication — OTP verification

**Home (2 screens):**
5. Home Screen (hero with search, countryside carousel, service tiles, AI CTA)
6. Home with Voice Entry Overlay

**Modular Services (5 screens):**
9. Hotels List (with booking conflict states)
10. Hotel Detail
11. Food (restaurants + delivery mode)
12. Transport (taxi + transfers + rental)
13. Activities List

**AI Trip Planner (5 screens):**
14. Trip Purpose & Companions
15. Collaborative Planning Invite
16. AI Quiz (multi-step)
17. Voice AI Conversation
18. AI Generating Animation

**AI Trip Result (1 screen):**
19. Itinerary View (day-by-day, swap, upsell insights)

**Map (1 screen):**
20. Map View (pins, clusters, bottom sheet details)

**Wallet (3 screens):**
21. Wallet Home
22. Top Up (MBank prominent, cards, UnionPay, Apple/Google Pay)
23. Pay by QR (scanner + confirmation)

**Merchant Mode (2 screens):**
24. Merchant Dashboard
25. Accept Payment (amount entry + QR display)

**Profile & Reviews (2 screens):**
26. Profile & Settings
27. Rating & Review Modal (context-aware sub-ratings)

**Composite States (3 screens):**
7. Loading / Empty / Error state reference
8. Component library sheet
28. Offline banner and offline wallet state

### 5.3 Core User Flows (what the jury sees on stage)

**Flow A — The Planner.** User opens the app from a QR in Manas airport arrivals hall → selects English → signs in with phone OTP → lands on Home → taps "Plan my full trip with AI" → answers 6 quiz questions about purpose, companions, duration, budget, activity level, interests → watches AI generate animation → sees a 5-day itinerary with Bishkek, Ala-Archa, Issyk-Kul, Song-Kul, return — total $687 → taps "Pay & lock itinerary" → tops up wallet with Visa → everything is booked in one transaction.

**Flow B — The Spontaneous Arrival.** User lands at 2 AM, has no plan → opens app → taps Hotels tile → sees map of 20 hotels within 5 km of current location → books nearest 4-star for two nights → taps Transport → books a taxi to the hotel → arrives, sleeps → next morning taps Food → orders breakfast delivery to the hotel.

**Flow C — The Mountain Payment.** User on Song-Kul with no signal → shows wallet QR to yurt host → host scans with their merchant Tabylga app → transaction queued with offline signature on both devices → that evening host drives down to the nearest signal → queue flushes → host sees money in his bank card the next morning.

**Flow D — The Collaborative Trip.** User wants to plan with three friends → taps "Plan together" → invites three phone numbers → each friend gets a push, adds their preferences in the app → AI sees the group is ages 24–42 with overlap on nature + food and disagreement on extreme sports → proposes a moderate-activity route that avoids extreme sports and emphasizes shared interests → group approves → one person pays, the app splits the cost across four wallets.

---

## 6. Technology Stack

### 6.1 Mobile application
- **Framework:** Expo SDK 52+ (managed workflow) with React Native
- **Language:** TypeScript (strict mode)
- **Navigation:** Expo Router (file-based routing in `/app`)
- **Styling:** NativeWind (Tailwind for React Native)
- **State management:** Zustand (no Redux, no Context overload)
- **Forms:** React Hook Form
- **Icons:** Lucide React Native
- **Maps:** React Native Maps with Mapbox-styled tiles (Apple Maps on iOS, Google Maps on Android for maps package compatibility)
- **Fonts:** Inter (UI), Fraunces (editorial accents) via expo-font
- **Secure storage:** expo-secure-store (offline wallet keys)
- **Cache storage:** @react-native-async-storage/async-storage (non-sensitive state)
- **Camera/QR:** expo-camera
- **Location:** expo-location
- **Crypto:** tweetnacl for Ed25519 signing, react-native-get-random-values for entropy
- **Build/deploy:** EAS Build for iOS and Android binaries (no local Mac required)

### 6.2 Backend
- **Platform:** Supabase
- **Database:** PostgreSQL with PostGIS extension for geo queries
- **Auth:** Supabase Auth (phone OTP)
- **File storage:** Supabase Storage (user avatars, review photos, merchant KYC docs)
- **Serverless:** Supabase Edge Functions (TypeScript/Deno) for offline transaction validation, AI orchestration, webhooks
- **Realtime:** Supabase Realtime for live merchant dashboard updates

### 6.3 AI
- **Primary LLM:** Google Gemini 2.5 Flash via Google AI Studio free tier (1,500 req/day)
- **Fallback LLM:** Groq Llama 3.3 70B via Groq Cloud free tier (14,400 req/day on 8B, 1,000/day on 70B)
- **Speech-to-text:** Web Speech API on-device (free, works offline on iOS 17+, Android 13+)
- **Text-to-speech:** expo-speech for AI voice responses

### 6.4 Data sources
- **Places:** OpenStreetMap via Overpass API (free, unlimited), imported once into Supabase `places` table
- **Descriptions:** Wikipedia API (free)
- **Photos placeholders:** Unsplash API (free, 50 req/hour)
- **Geocoding:** Nominatim (free)
- **Weather:** Open-Meteo API (free, no key required)

### 6.5 Payments
- **Demo:** Stripe test mode (card number 4242 4242 4242 4242)
- **Production (post-hackathon):** KICB ELQR acquiring + MBank API + Stripe international + UnionPay
- **Currency conversion:** Daily KICB rate (mocked for hackathon, real API call in production)

### 6.6 Supporting
- **Admin dashboard (for investor demo):** Next.js 14 + Recharts, deployed to Vercel. Separate repo from mobile app.
- **Pitch deck:** Google Slides
- **Demo video backup:** Loom or QuickTime screen recording of the phone

---

## 7. Business Model

### 7.1 Four revenue streams

**Stream 1 — Acquiring commission (primary, scalable).**
1.5%–2% per wallet transaction. Every payment, from a $2 coffee at a Bishkek café to a $200 yurt camp stay, generates this fee. Partner: KICB.

Unit economics at scale: if Tabylga processes 0.5% of Kyrgyzstan's $1.1B tourism spend in year 1, that is $5.5M in transaction volume → ~$100K in acquiring commission. At 5% market share by year 3: $1.1M revenue from this stream alone.

**Stream 2 — Booking commission (industry-standard).**
5%–7% on hotels, activities, and tour bundles booked through the app. Classic marketplace economics. AI upsells measurably increase average order value by ~30%.

**Stream 3 — Park entry digitization (B2G partnership).**
3%–5% revenue share with the state tourism agency on digital national park entry fee collection (Ala-Archa, Sary-Chelek, Song-Kul, etc.). We convert cash-at-the-gate revenue into transparent digital revenue — the state has an incentive to share the upside because we surface revenue they currently lose to cash leakage. This plugs directly into the existing Rest Points infrastructure.

**Stream 4 — Data-as-a-Service (enterprise B2B/B2G).**
Anonymized analytics dashboard sold as a subscription: $500–$2,000/month to the Ministry of Tourism, to major HoReCa chains, to tour operators. They see heatmaps of tourist flows, category-level spending, source-country breakdowns, seasonality patterns, regional revenue distribution — data that currently does not exist in any form in the country.

### 7.2 Defensive moat

None of our 19 known hackathon competitors combine these four streams in a single product. Competitors fall into predictable buckets: AI planners with no payment layer, QR payment tools with no traffic source, analytics dashboards with no data source, narrow vertical apps (park entry only, events only, affiliate marketing only). Tabylga is the first to connect the full stack from tourist acquisition to merchant settlement to state-level data monetization.

### 7.3 Year-1 realistic projection

- 0.5% market penetration → ~44,000 tourists served
- Average trip spend through app: $300
- Total transaction volume: $13M
- Blended take rate (acquiring + booking commissions): ~3%
- Gross revenue year 1: **~$390K**
- Plus one Ministry of Tourism data contract: ~$50K
- **Total year 1 revenue: ~$440K**

Year-3 at 5% penetration: $5M+ annual revenue. These are conservative numbers — presented to the jury as the floor, not the ceiling.

---

## 8. Competitive Positioning

Competitors at this hackathon can be grouped into four archetypes. Tabylga's positioning against each:

- **AI planners without payments** (Kyrk Os, Nomads, NomadJol, AiTrek): *"AI itineraries are the tip of the iceberg. Underneath there must be a payment layer, or tourists still bleed cash into the grey economy. We solve the full chain, not just the pretty planning UX."*
- **QR payments without AI** (Islam's QR-Payment, NomadSync): *"QR payments without an AI layer create no demand for themselves. Tourists will not download a standalone wallet. We embed payment inside the moment of planning, when willingness-to-pay is highest."*
- **Analytics dashboards without data** (Ainazik's Big Data, Syimyk's KG Tourism Intelligence): *"Dashboards are only valuable with real data. We produce primary transaction data — we are the source, they are the consumers. They become our B2B customers via API, not our competitors."*
- **Narrow vertical apps** (MobiGate for parks, Fibe for events, Cashback Tourism, Mingle Social): *"Single-purpose apps require tourists to install 5 different things. We unify in one surface with one wallet — the same reason tourists install Uber and not a separate app for every taxi company."*

Pitch-stage soundbite: *"We are not a marketplace. We are Kyrgyzstan's tourism payment infrastructure. The $1.1B market, a 2% blended take rate — that is a $22M-revenue-per-year company."*

---

## 9. What We Build for the Hackathon Demo

Hackathons are won by polished demo flows, not feature-complete products. We explicitly scope down.

### 9.1 In scope (we build real)

- All 28 screens designed to pixel fidelity
- Splash → Welcome → Auth → Home fully functional
- AI quiz with real Gemini API call generating real itineraries from real OpenStreetMap places
- Wallet with real Stripe test-mode top-up
- QR scan and confirmation flow
- Offline signing demo (with mocked sync, not production-grade crypto review)
- Merchant mode toggle + accept-payment flow
- Map view with real places from our database
- Admin dashboard on Vercel (separate project) showing heatmap and graphs

### 9.2 Out of scope (we mock)

- Real KICB API integration (we show the logo and claim "2-week integration post-hackathon, validated technically")
- Real MBank API (same — mocked)
- Production-grade Ed25519 offline security (we demonstrate the concept, not a fully audited protocol)
- Full 6-language localization (we ship English + Russian, show the language picker for the others)
- Native push notifications (demo runs in foreground)
- Real merchant KYC verification (we accept any photo)
- Production rate limits and billing on AI providers (we stay within free tier)

### 9.3 Hard rules for the build

- Every screen must render without console errors on both iOS and Android. A crash during demo is instant elimination.
- The critical demo flow (Splash → Auth → Home → AI Quiz → Itinerary → Wallet → Pay) must be tested end-to-end on a physical device at least 10 times before Demo Day.
- A pre-recorded 2-minute video backup of the flow must exist by the morning of Demo Day. If the conference Wi-Fi fails, we show the video.
- No new features after the evening of Day 2. Day 3 morning is exclusively bug fixes and pitch rehearsal.

---

## 10. Success Criteria

The hackathon is won on three criteria explicitly stated by the organizing brief: *technology, monetization, data*. Tabylga's demo must visibly prove all three within the 3-minute pitch window:

- **Technology.** Live AI generation on stage. The jury watches an itinerary being built in real time, not a pre-recorded animation.
- **Monetization.** Four clearly enumerated revenue streams with numbers, not hand-waving. "2% of $1.1B" is the memorable line.
- **Data.** A live tap into the admin dashboard at the end of the pitch — "this is the product we sell to the Ministry of Tourism for $X/month". Visible heatmap, visible revenue flow, visible regional distribution.

If all three are on screen by minute 3, we are in the top 3. Whether we take first place depends on execution quality, delivery of the pitch, and answers in Q&A — factors outside of this document's scope.

---

## 11. Non-Negotiable Principles

These apply to every code commit, every design decision, every feature prioritization:

1. **Trust is the product.** Tourists hand us their credit card. Every screen must feel like a bank, not a toy.
2. **Kyrgyzstan first, generic SaaS last.** Real photos of real places, real local names, real regional pricing. No stock photography of generic mountains. No AI-generated yurts.
3. **Offline is a first-class state, not a fallback.** Every screen has an offline variant. Every write operation queues. Nothing breaks when signal drops.
4. **One flow, polished, beats five flows, rough.** If a feature can't reach demo quality, we cut it.
5. **Jury partners become product partners.** Every feature that aligns with KICB, the Tourism Development Fund, or the Ministry of Tourism gets priority over features that don't — because alignment is how this product ships to market after the hackathon.
6. **Design system is law.** No custom colors, no ad-hoc spacing, no "I thought this would look better" deviations from DESIGN_SYSTEM.md. If the token is wrong, fix the token, not the screen.

---

## 12. How to Use This Document

- Before starting any Claude Code session: reread sections 1–3 to reload context.
- When scoping a new screen: verify it appears in section 5.2 and fits a flow in section 5.3.
- When making a technology choice: verify it aligns with section 6. If not, update this document first, then change the code.
- When tempted to add a feature: check section 9.1 and 9.2. If it's not in 9.1, it doesn't ship for the hackathon.
- When writing pitch material: pull language directly from sections 2, 7, and 8.

This document is the contract between the team, Claude Code, and the product. When it changes, everyone reads the diff.
