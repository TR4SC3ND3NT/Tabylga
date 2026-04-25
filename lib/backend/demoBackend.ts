import type { Interest } from '../../stores/tripStore';
import type { Place } from '../api/places';

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface HotelListing {
  id: string;
  name: string;
  region: string;
  priceUsd: number;
  rating: number;
  reviewCount: number;
  type: 'hotel' | 'hostel' | 'yurt' | 'guesthouse';
  limited: boolean;
  amenities: string[];
  reviews: Review[];
}

export interface TaxiOption {
  id: string;
  className: string;
  priceUsd: number;
  etaMin: number;
  seats: number;
  driver: string;
  car: string;
  rating: number;
  reviews: Review[];
}

export interface EsimPlan {
  id: string;
  title: string;
  durationDays: number;
  dataGb: number;
  priceUsd: number;
  recommended?: boolean;
}

export interface TravelerMatch {
  id: string;
  name: string;
  age: number;
  country: string;
  interests: Interest[];
  overlapScore: number;
  suggestedMeetup: string;
}

export interface GroupChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export interface TourTransportQuote {
  id: string;
  vehicle: 'bus' | 'minivan';
  title: string;
  seats: number;
  minPeople: number;
  pricePerPersonUsd: number;
  route: string;
}

export const ESIM_PLANS: EsimPlan[] = [
  { id: 'esim_7_5', title: 'Starter eSIM', durationDays: 7, dataGb: 5, priceUsd: 8 },
  { id: 'esim_14_15', title: 'Traveler eSIM', durationDays: 14, dataGb: 15, priceUsd: 16, recommended: true },
  { id: 'esim_30_30', title: 'Nomad eSIM', durationDays: 30, dataGb: 30, priceUsd: 28 },
];

export const HOTEL_LISTINGS: HotelListing[] = [
  {
    id: 'hotel_hyatt',
    name: 'Hyatt Regency Bishkek',
    region: 'Bishkek',
    priceUsd: 180,
    rating: 4.8,
    reviewCount: 312,
    type: 'hotel',
    limited: false,
    amenities: ['Spa', 'Airport pickup', 'Visa cards', 'English staff'],
    reviews: [
      { id: 'r1', author: 'Laura', rating: 5, text: 'Very reliable after a late arrival.', date: 'Apr 2026' },
      { id: 'r2', author: 'Akira', rating: 4.7, text: 'Good breakfast and easy taxi pickup.', date: 'Mar 2026' },
    ],
  },
  {
    id: 'hotel_songkul_yurt',
    name: "Shepherd's Life Yurt Camp",
    region: 'Song-Kul',
    priceUsd: 45,
    rating: 4.9,
    reviewCount: 87,
    type: 'yurt',
    limited: true,
    amenities: ['Offline pay', 'Horse riding', 'Dinner included', 'Lake view'],
    reviews: [
      { id: 'r3', author: 'Miriam', rating: 5, text: 'Offline payment and warm host made the stay easy.', date: 'Apr 2026' },
      { id: 'r4', author: 'Daniel', rating: 4.8, text: 'Cold night, but incredible location.', date: 'Feb 2026' },
    ],
  },
  {
    id: 'hotel_tamga',
    name: 'Tamga Yurt Camp',
    region: 'Issyk-Kul',
    priceUsd: 35,
    rating: 4.7,
    reviewCount: 63,
    type: 'yurt',
    limited: false,
    amenities: ['Beach nearby', 'Halal meals', 'Family rooms'],
    reviews: [
      { id: 'r5', author: 'Omar', rating: 4.7, text: 'Good meals and calm lake access.', date: 'Apr 2026' },
    ],
  },
];

export const TAXI_OPTIONS: TaxiOption[] = [
  {
    id: 'taxi_economy',
    className: 'Economy',
    priceUsd: 3,
    etaMin: 4,
    seats: 4,
    driver: 'Azamat',
    car: 'Toyota Prius',
    rating: 4.7,
    reviews: [
      { id: 't1', author: 'Nina', rating: 5, text: 'Arrived fast and helped with luggage.', date: 'Today' },
      { id: 't2', author: 'Marco', rating: 4.6, text: 'Clean car, safe driving.', date: 'Yesterday' },
    ],
  },
  {
    id: 'taxi_comfort',
    className: 'Comfort',
    priceUsd: 5,
    etaMin: 6,
    seats: 4,
    driver: 'Aigerim',
    car: 'Hyundai Sonata',
    rating: 4.9,
    reviews: [
      { id: 't3', author: 'Sarah', rating: 5, text: 'English-speaking driver, very helpful.', date: 'Today' },
    ],
  },
  {
    id: 'taxi_minivan',
    className: 'Minivan',
    priceUsd: 9,
    etaMin: 8,
    seats: 7,
    driver: 'Bakyt',
    car: 'Mercedes Vito',
    rating: 4.8,
    reviews: [
      { id: 't4', author: 'Chen', rating: 4.8, text: 'Enough room for five tourists and bags.', date: 'Apr 2026' },
    ],
  },
];

export const TOUR_TRANSPORT_QUOTES: TourTransportQuote[] = [
  {
    id: 'tour_minivan_6',
    vehicle: 'minivan',
    title: 'Shared minivan to Issyk-Kul',
    seats: 7,
    minPeople: 4,
    pricePerPersonUsd: 18,
    route: 'Bishkek -> Burana -> Cholpon-Ata -> Karakol -> Bishkek',
  },
  {
    id: 'tour_bus_18',
    vehicle: 'bus',
    title: 'Small tour bus for group route',
    seats: 18,
    minPeople: 10,
    pricePerPersonUsd: 14,
    route: 'Bishkek -> Ala-Archa -> Issyk-Kul -> Song-Kul -> Bishkek',
  },
];

export const TRAVELER_MATCHES: TravelerMatch[] = [
  {
    id: 'match_lena',
    name: 'Lena',
    age: 29,
    country: 'Germany',
    interests: ['nature', 'food', 'photography'],
    overlapScore: 92,
    suggestedMeetup: 'Meet at Sierra Coffee before the Ala-Archa day trip.',
  },
  {
    id: 'match_omar',
    name: 'Omar',
    age: 32,
    country: 'UAE',
    interests: ['nature', 'culture', 'food'],
    overlapScore: 86,
    suggestedMeetup: 'Share a halal dinner in Bishkek before the Issyk-Kul transfer.',
  },
  {
    id: 'match_chen',
    name: 'Chen',
    age: 27,
    country: 'China',
    interests: ['photography', 'culture', 'shopping'],
    overlapScore: 81,
    suggestedMeetup: 'Meet near Osh Bazaar for a culture and food walk.',
  },
];

export const GROUP_CHAT_MESSAGES: GroupChatMessage[] = [
  { id: 'm1', sender: 'AI planner', text: 'You all overlap on nature, food and moderate activity. I suggest sharing the Issyk-Kul minivan.', time: '10:02' },
  { id: 'm2', sender: 'Lena', text: 'Works for me. I prefer photography stops on the way.', time: '10:04' },
  { id: 'm3', sender: 'You', text: 'Let us split transport for one person first, then confirm the route.', time: '10:05' },
];

const TRANSLATION_MEMORY: Record<string, Record<string, string>> = {
  'Where is the nearest bus stop?': {
    ru: 'Где ближайшая автобусная остановка?',
    ky: 'Эң жакын автобекет кайда?',
  },
  'I want to order a taxi to my hotel.': {
    ru: 'Я хочу заказать такси до моего отеля.',
    ky: 'Мен мейманканага такси чакыргым келет.',
  },
  'Can I pay offline by Bluetooth?': {
    ru: 'Можно оплатить офлайн через Bluetooth?',
    ky: 'Bluetooth аркылуу офлайн төлөсөм болобу?',
  },
};

export function translateDemo(text: string, targetLang: string): string {
  const clean = text.trim();
  if (!clean) return '';
  return TRANSLATION_MEMORY[clean]?.[targetLang] ?? `[${targetLang.toUpperCase()}] ${clean}`;
}

export function createOfflineBluetoothPayment(amountUsd: number, merchantName: string) {
  return {
    id: `bt_${Date.now()}`,
    merchantName,
    amountUsd,
    status: 'signed_offline',
    transport: 'bluetooth',
    syncMessage: 'Both devices signed the payment locally. It will settle when either device returns online.',
  };
}

export function optimizeRouteByNearestNeighbor(places: Place[]): Place[] {
  if (places.length <= 2) return places;
  const remaining = [...places];
  const route = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let bestIndex = 0;
    let bestDistance = distanceScore(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const score = distanceScore(current, remaining[index]);
      if (score < bestDistance) {
        bestDistance = score;
        bestIndex = index;
      }
    }

    route.push(remaining.splice(bestIndex, 1)[0]);
  }

  return route;
}

function distanceScore(a: Place, b: Place): number {
  return Math.abs(a.lat - b.lat) + Math.abs(a.lon - b.lon);
}
