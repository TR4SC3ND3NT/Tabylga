# Admin Dashboard & Pitch Materials

You are responsible for the ADMIN DASHBOARD (separate web project) and pitch preparation. You do NOT touch the mobile app code at all.

## Your Files
dashboard/                    ← NEW: entirely separate Next.js project
  package.json
  app/page.tsx                ← main dashboard page
  app/layout.tsx
  components/                 ← dashboard web components
  lib/mockData.ts             ← realistic fake transaction data
pitch/                        ← NEW folder in monorepo root
  pitch-script.md             ← 3-minute pitch script
  competitor-responses.md     ← one-liner against each competitor
  market-data.md              ← key stats for slides

## Task 1 — Admin Dashboard (Next.js + Recharts)
Create a new Next.js project in `dashboard/` folder:
```bash
cd dashboard && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install recharts
```

Build ONE page (app/page.tsx) — "KG Tourism Revenue Dashboard" — with:
1. Header: "Tabylga Analytics — KG Tourism Revenue Dashboard" + date range selector (visual only)
2. Stat cards row (4 cards): Total Revenue (108,450 KGS), Transactions Today (234), Active Tourists (1,847), Avg Spend ($87)
3. Heatmap section: use a simple colored grid representing 7 regions of Kyrgyzstan (Chuy, Issyk-Kul, Naryn, Osh, Jalal-Abad, Batken, Talas). Color intensity = revenue volume. Use CSS grid, not a real map library.
4. Revenue by Region bar chart (Recharts BarChart): Issyk-Kul highest, then Chuy, Naryn, Osh, others lower
5. Spending by Category pie chart (Recharts PieChart): Accommodation 35%, Food 25%, Transport 20%, Activities 15%, Other 5%
6. Transactions over time line chart (Recharts LineChart): last 30 days, showing growth trend
7. Top 10 merchants table: name, region, category, revenue, transaction count, rating

All data from lib/mockData.ts — generate 10,000 realistic fake transactions with:
- Dates spread across last 30 days (more on weekends)
- Amounts between 200-15000 KGS
- Categories: accommodation, food, transport, activities, park_entry, shopping
- Regions weighted: Issyk-Kul 35%, Chuy 25%, Naryn 15%, Osh 10%, rest 15%
- 50 fake merchant names (mix of Kyrgyz names: "Nomad's Yurt Camp", "Supara Ethno", "Karakol Ski Base", etc.)

Style: dark theme (#1A1A1A bg), cards with subtle borders, Tabylga brand blue #1E4D6B for highlights, terracotta #C65D3A for CTAs. Professional, investor-ready look.

Deploy to Vercel (or just run locally — `npm run dev` on port 3001).

## Task 2 — Pitch Materials
Create `pitch/pitch-script.md`: a 3-minute pitch script following this structure:
- 0:00-0:30 Hook: "$1.1 billion entered Kyrgyzstan tourism in 2025. A third disappeared into grey cash economy."
- 0:30-1:00 Problem: fragmentation, payment gaps, micro-merchant exclusion
- 1:00-2:30 Live demo: show the app flow (someone else operates the phone)
- 2:30-3:30 Business model: 4 revenue streams with numbers
- 3:30-4:00 Team + ask

Create `pitch/competitor-responses.md`: one-liner responses for each known competitor (Kyrk Os, Nomads, QR-Payment, NomadSync, Cashback Tourism, MobiGate, Big Data teams, AiTrek, Baatyr Team)

Create `pitch/market-data.md`: key stats — $1.1B revenue, 8.8M visits, 148,100 tourism businesses, 95% from CIS, Rest Points infrastructure, KICB ELQR 67K points

## Architectural Contracts
- Dashboard is a COMPLETELY SEPARATE project in dashboard/ folder
- Does NOT import from the mobile app — fully independent
- Uses its own mockData, not real SQLite
- Must look polished enough to show on projector during pitch as "our B2G product for Ministry of Tourism"

## DO NOT
- Touch ANY file outside dashboard/ and pitch/ folders
- Touch the mobile app code at all
- Use the same package.json as the mobile app
