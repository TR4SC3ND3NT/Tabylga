export const regionWeights = [
  { name: "Issyk-Kul", weight: 35 },
  { name: "Chuy", weight: 25 },
  { name: "Naryn", weight: 15 },
  { name: "Osh", weight: 10 },
  { name: "Jalal-Abad", weight: 5 },
  { name: "Batken", weight: 5 },
  { name: "Talas", weight: 5 },
] as const;

export type Region = (typeof regionWeights)[number]["name"];

export const categories = [
  { id: "accommodation", label: "Accommodation" },
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "activities", label: "Activities" },
  { id: "park_entry", label: "Park Entry" },
  { id: "shopping", label: "Shopping" },
] as const;

export type Category = (typeof categories)[number]["id"];

export type Merchant = {
  id: string;
  name: string;
  region: Region;
  category: Category;
  rating: number;
};

export type Transaction = {
  id: string;
  date: string;
  amountKgs: number;
  category: Category;
  region: Region;
  merchantId: string;
  merchantName: string;
  touristCountry: string;
  paymentMethod: "card" | "elqr" | "wallet";
};

const merchantSeedData: Array<Omit<Merchant, "id">> = [
  { name: "Nomad's Yurt Camp", region: "Issyk-Kul", category: "accommodation", rating: 4.9 },
  { name: "Supara Ethno", region: "Chuy", category: "food", rating: 4.8 },
  { name: "Karakol Ski Base", region: "Issyk-Kul", category: "activities", rating: 4.7 },
  { name: "Altyn Arashan Lodge", region: "Issyk-Kul", category: "accommodation", rating: 4.8 },
  { name: "Bishkek Silk Road Hotel", region: "Chuy", category: "accommodation", rating: 4.5 },
  { name: "Song-Kol Yurt Stay", region: "Naryn", category: "accommodation", rating: 4.9 },
  { name: "Osh Bazaar Taste", region: "Osh", category: "food", rating: 4.6 },
  { name: "Arslanbob Walnut Guesthouse", region: "Jalal-Abad", category: "accommodation", rating: 4.7 },
  { name: "Sary-Chelek Eco Tours", region: "Jalal-Abad", category: "activities", rating: 4.8 },
  { name: "Ala-Archa Trail Guides", region: "Chuy", category: "activities", rating: 4.7 },
  { name: "Tash-Rabat Caravanserai", region: "Naryn", category: "activities", rating: 4.9 },
  { name: "Burana Tower Tickets", region: "Chuy", category: "park_entry", rating: 4.4 },
  { name: "Issyk-Kul Lake Cruises", region: "Issyk-Kul", category: "activities", rating: 4.6 },
  { name: "Karakol Dungan Cafe", region: "Issyk-Kul", category: "food", rating: 4.7 },
  { name: "Naryn Nomad Kitchen", region: "Naryn", category: "food", rating: 4.5 },
  { name: "Osh Mountain Taxi", region: "Osh", category: "transport", rating: 4.3 },
  { name: "Manas Airport Shuttle", region: "Chuy", category: "transport", rating: 4.4 },
  { name: "Kochkor Felt Workshop", region: "Naryn", category: "shopping", rating: 4.8 },
  { name: "Talas Heritage House", region: "Talas", category: "accommodation", rating: 4.5 },
  { name: "Batken Apricot Market", region: "Batken", category: "shopping", rating: 4.6 },
  { name: "Jeti-Oguz Horse Trek", region: "Issyk-Kul", category: "activities", rating: 4.9 },
  { name: "Cholpon-Ata Resort Pier", region: "Issyk-Kul", category: "transport", rating: 4.4 },
  { name: "Bokonbaevo Eagle Hunters", region: "Issyk-Kul", category: "activities", rating: 4.8 },
  { name: "Jalal-Abad Kurort Spa", region: "Jalal-Abad", category: "accommodation", rating: 4.6 },
  { name: "Sulaiman-Too Museum", region: "Osh", category: "park_entry", rating: 4.7 },
  { name: "Bishkek Craft Market", region: "Chuy", category: "shopping", rating: 4.5 },
  { name: "Ak-Sai Travel Desk", region: "Chuy", category: "transport", rating: 4.6 },
  { name: "CBT Naryn Office", region: "Naryn", category: "activities", rating: 4.7 },
  { name: "Tamga Guest Villas", region: "Issyk-Kul", category: "accommodation", rating: 4.6 },
  { name: "Kaji-Say Fish House", region: "Issyk-Kul", category: "food", rating: 4.5 },
  { name: "Toktogul Lake Camp", region: "Jalal-Abad", category: "accommodation", rating: 4.4 },
  { name: "Kyzyl-Oi Riverside Stay", region: "Naryn", category: "accommodation", rating: 4.8 },
  { name: "Osh Plov Center", region: "Osh", category: "food", rating: 4.7 },
  { name: "Talas Manas Tours", region: "Talas", category: "activities", rating: 4.6 },
  { name: "Batken Border Cafe", region: "Batken", category: "food", rating: 4.3 },
  { name: "Karakol Gear Rental", region: "Issyk-Kul", category: "shopping", rating: 4.6 },
  { name: "Chunkurchak Ski Lodge", region: "Chuy", category: "activities", rating: 4.7 },
  { name: "Boom Gorge Transit", region: "Chuy", category: "transport", rating: 4.4 },
  { name: "Naryn Canyon Jeep", region: "Naryn", category: "transport", rating: 4.6 },
  { name: "Arslanbob Trail Guides", region: "Jalal-Abad", category: "activities", rating: 4.8 },
  { name: "Issyk-Kul Souvenir Lane", region: "Issyk-Kul", category: "shopping", rating: 4.5 },
  { name: "Bishkek Metro Hostel", region: "Chuy", category: "accommodation", rating: 4.3 },
  { name: "Osh Textile Rows", region: "Osh", category: "shopping", rating: 4.5 },
  { name: "Batken Mountain Taxi", region: "Batken", category: "transport", rating: 4.4 },
  { name: "Talas Honey Shop", region: "Talas", category: "shopping", rating: 4.7 },
  { name: "Son-Kol Horseback Routes", region: "Naryn", category: "activities", rating: 4.9 },
  { name: "Karakol Coffee Roasters", region: "Issyk-Kul", category: "food", rating: 4.6 },
  { name: "Chuy Valley Bike Tours", region: "Chuy", category: "activities", rating: 4.5 },
  { name: "Jalal-Abad Walnut Shop", region: "Jalal-Abad", category: "shopping", rating: 4.6 },
  { name: "Kadamjay Family Guesthouse", region: "Batken", category: "accommodation", rating: 4.5 },
];

export const merchants: Merchant[] = merchantSeedData.map((merchant, index) => ({
  ...merchant,
  id: `merchant-${String(index + 1).padStart(2, "0")}`,
}));

const categoryWeights: Array<{ id: Category; weight: number }> = [
  { id: "accommodation", weight: 28 },
  { id: "food", weight: 25 },
  { id: "transport", weight: 20 },
  { id: "activities", weight: 15 },
  { id: "park_entry", weight: 4 },
  { id: "shopping", weight: 8 },
];

const amountRanges: Record<Category, { min: number; max: number }> = {
  accommodation: { min: 3500, max: 15000 },
  food: { min: 300, max: 2800 },
  transport: { min: 500, max: 6500 },
  activities: { min: 1000, max: 9000 },
  park_entry: { min: 200, max: 900 },
  shopping: { min: 500, max: 8000 },
};

const regionMultipliers: Record<Region, number> = {
  "Issyk-Kul": 1.18,
  Chuy: 1.08,
  Naryn: 0.98,
  Osh: 0.92,
  "Jalal-Abad": 0.86,
  Batken: 0.78,
  Talas: 0.74,
};

const touristCountries = [
  "Kazakhstan",
  "Russia",
  "Uzbekistan",
  "Kyrgyzstan",
  "Turkey",
  "Germany",
  "United States",
  "United Arab Emirates",
] as const;

const paymentMethods: Transaction["paymentMethod"][] = ["card", "elqr", "wallet"];

function createRandom(seed: number) {
  let value = seed;

  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends { weight: number }>(items: readonly T[], random: () => number): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = random() * totalWeight;

  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function createDateBuckets() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const growthWeight = 0.75 + index * 0.035;

    return {
      date,
      index,
      isWeekend,
      key: getDateKey(date),
      label: dateFormatter.format(date),
      weight: (isWeekend ? 1.9 : 1) * growthWeight,
    };
  });
}

const dateBuckets = createDateBuckets();

function pickMerchant(region: Region, category: Category, random: () => number) {
  const exactMatches = merchants.filter(
    (merchant) => merchant.region === region && merchant.category === category,
  );
  const regionMatches = merchants.filter((merchant) => merchant.region === region);
  const categoryMatches = merchants.filter((merchant) => merchant.category === category);
  const candidates = exactMatches.length
    ? exactMatches
    : regionMatches.length
      ? regionMatches
      : categoryMatches.length
        ? categoryMatches
        : merchants;

  return candidates[Math.floor(random() * candidates.length)];
}

function createAmount(category: Category, region: Region, isWeekend: boolean, random: () => number) {
  const range = amountRanges[category];
  const spendingCurve = Math.pow(random(), 1.55);
  const weekendMultiplier = isWeekend ? 1.12 : 1;
  const noise = 0.88 + random() * 0.24;
  const amount = (range.min + (range.max - range.min) * spendingCurve)
    * regionMultipliers[region]
    * weekendMultiplier
    * noise;

  return Math.round(clamp(amount, 200, 15000));
}

export function generateTransactions(count = 10000): Transaction[] {
  const random = createRandom(20260425);

  return Array.from({ length: count }, (_, index) => {
    const region = pickWeighted(regionWeights, random).name;
    const category = pickWeighted(categoryWeights, random).id;
    const dayBucket = pickWeighted(dateBuckets, random);
    const merchant = pickMerchant(region, category, random);
    const date = new Date(dayBucket.date);
    date.setHours(Math.floor(random() * 24), Math.floor(random() * 60), Math.floor(random() * 60), 0);

    return {
      id: `txn-${String(index + 1).padStart(5, "0")}`,
      date: date.toISOString(),
      amountKgs: createAmount(category, region, dayBucket.isWeekend, random),
      category,
      region,
      merchantId: merchant.id,
      merchantName: merchant.name,
      touristCountry: touristCountries[Math.floor(random() * touristCountries.length)],
      paymentMethod: paymentMethods[Math.floor(random() * paymentMethods.length)],
    };
  });
}

export const transactions = generateTransactions();

export const dashboardStats = {
  totalRevenueKgs: 108450,
  transactionsToday: 234,
  activeTourists: 1847,
  averageSpendUsd: 87,
};

export const spendingByCategory = [
  { name: "Accommodation", value: 35, color: "#1E4D6B" },
  { name: "Food", value: 25, color: "#C65D3A" },
  { name: "Transport", value: 20, color: "#4E8CA8" },
  { name: "Activities", value: 15, color: "#E3A047" },
  { name: "Other", value: 5, color: "#7A869A" },
];

export const revenueByRegion = regionWeights.map(({ name }) => {
  const regionTransactions = transactions.filter((transaction) => transaction.region === name);

  return {
    region: name,
    revenue: regionTransactions.reduce((sum, transaction) => sum + transaction.amountKgs, 0),
    transactions: regionTransactions.length,
  };
});

const maxRegionRevenue = Math.max(...revenueByRegion.map((region) => region.revenue));

export const heatmapRegions = revenueByRegion.map((region) => ({
  ...region,
  intensity: Number((region.revenue / maxRegionRevenue).toFixed(2)),
}));

export const transactionsOverTime = dateBuckets.map((bucket) => {
  const dayTransactions = transactions.filter((transaction) => transaction.date.startsWith(bucket.key));

  return {
    date: bucket.label,
    revenue: dayTransactions.reduce((sum, transaction) => sum + transaction.amountKgs, 0),
    transactions: dayTransactions.length,
  };
});

export const topMerchants = merchants
  .map((merchant) => {
    const merchantTransactions = transactions.filter((transaction) => transaction.merchantId === merchant.id);

    return {
      id: merchant.id,
      name: merchant.name,
      region: merchant.region,
      category: merchant.category,
      revenue: merchantTransactions.reduce((sum, transaction) => sum + transaction.amountKgs, 0),
      transactions: merchantTransactions.length,
      rating: merchant.rating,
    };
  })
  .sort((first, second) => second.revenue - first.revenue)
  .slice(0, 10);
