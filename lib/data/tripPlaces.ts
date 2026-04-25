export type StartPoint = 'manas_airport' | 'bishkek' | 'osh' | 'issyk_kul' | 'not_sure';
export type TravelersType = 'solo' | 'couple' | 'family' | 'friends' | 'colleagues';
export type TripDays = 3 | 5 | 7 | 10 | 14;
export type TravelStyle =
  | 'relax'
  | 'adventure'
  | 'cultural_discovery'
  | 'food_local_life'
  | 'business'
  | 'family_trip'
  | 'digital_nomad'
  | 'premium_comfort';
export type BudgetTier = 'budget' | 'standard' | 'comfort' | 'premium';
export type StayPreference = 'hotels_only' | 'guesthouse_ok' | 'yurt_ok' | 'remote_basic_ok';
export type Pace = 'relaxed' | 'balanced' | 'packed';
export type PlannerActivityLevel = 'easy' | 'light' | 'moderate' | 'hard';
export type RoadTolerance = 'low' | 'medium' | 'high';
export type InternetComfort = 'prefer_internet' | 'offline_ok' | 'remote_ok_if_worth_it';
export type ExperienceKey =
  | 'museums_history'
  | 'bazaars_local_life'
  | 'nomadic_culture'
  | 'local_food'
  | 'mountain_views'
  | 'lakes_canyons'
  | 'horse_riding'
  | 'hot_springs'
  | 'shopping_crafts'
  | 'photography_spots'
  | 'nightlife'
  | 'light_hiking';
export type RequirementKey =
  | 'halal'
  | 'vegetarian'
  | 'vegan'
  | 'wheelchair'
  | 'family_friendly'
  | 'no_alcohol'
  | 'prayer_friendly'
  | 'english_guide'
  | 'chinese_guide'
  | 'arabic_guide'
  | 'none';

export interface TripPreferences {
  days: TripDays;
  startPoint: StartPoint;
  travelersType: TravelersType;
  travelerCount: number;
  travelStyles: TravelStyle[];
  budgetTier: BudgetTier;
  stayPreference: StayPreference;
  pace: Pace;
  activityLevel: PlannerActivityLevel;
  roadTolerance: RoadTolerance;
  internetComfort: InternetComfort;
  experiences: ExperienceKey[];
  requirements: RequirementKey[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface RoomType {
  id: string;
  title: string;
  pricePerNight: number;
  sleeps: number;
}

export interface Stay {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'guesthouse' | 'yurt';
  city: string;
  region: string;
  imageUrl?: string;
  pricePerNight: number;
  tier: BudgetTier;
  rating: number;
  reviewCount: number;
  tags: string[];
  amenities: string[];
  goodFor: TravelersType[];
  badFor: string[];
  paymentOptions: string[];
  offlinePaymentSupported: boolean;
  wifi: boolean;
  familyFriendly: boolean;
  businessFriendly: boolean;
  remote: boolean;
  availability: 'available' | 'limited' | 'request';
  description: string;
  reviews: Review[];
  roomTypes: RoomType[];
  commissionRate: number;
}

export interface Activity {
  id: string;
  name: string;
  city: string;
  region: string;
  type: string;
  price: number;
  durationHours: number;
  difficulty: 1 | 2 | 3 | 4;
  tags: string[];
  goodFor: TravelersType[];
  badFor: string[];
  requirementsSupported: RequirementKey[];
  roadIntensity: RoadTolerance;
  internetAvailable: boolean;
  offlineReady: boolean;
  description: string;
}

export interface FoodPlace {
  id: string;
  name: string;
  city: string;
  region: string;
  type: 'restaurant' | 'cafe' | 'market' | 'cooking_class';
  priceEstimate: number;
  tier: BudgetTier;
  rating: number;
  reviewCount: number;
  tags: string[];
  requirementsSupported: RequirementKey[];
  goodFor: TravelersType[];
  badFor: string[];
  qrPayment: boolean;
  offlineReady: boolean;
  description: string;
}

export interface TransportOption {
  id: string;
  name: string;
  type: 'airport_transfer' | 'city_taxi' | 'shared_transport' | 'private_driver' | 'mountain_driver';
  regions: string[];
  price: number;
  tags: string[];
  goodFor: TravelersType[];
  roadToleranceRequired: RoadTolerance;
  offlineContactAvailable: boolean;
  qrPayment: boolean;
  description: string;
}

export interface ReadyTrip {
  id: string;
  title: string;
  daysLabel: string;
  description: string;
  tags: string[];
  preferences: TripPreferences;
}

export const STORAGE_VERSION = '4';
export const STORAGE_KEYS = {
  version: 'tabylga_storage_version',
  session: 'tabylga_current_session',
  preferences: 'tabylga_preferences',
  currentTrip: 'tabylga_current_trip',
  bookings: 'tabylga_bookings',
  offlinePack: 'tabylga_offline_pack',
  selectedPreset: 'tabylga_selected_preset',
} as const;

export const DEFAULT_TRIP_PREFERENCES: TripPreferences = {
  days: 5,
  startPoint: 'not_sure',
  travelersType: 'solo',
  travelerCount: 1,
  travelStyles: [],
  budgetTier: 'standard',
  stayPreference: 'guesthouse_ok',
  pace: 'balanced',
  activityLevel: 'light',
  roadTolerance: 'medium',
  internetComfort: 'prefer_internet',
  experiences: [],
  requirements: ['none'],
};

export function normalizeTravelerCount(type: TravelersType, count: number) {
  if (type === 'solo') return 1;
  if (type === 'couple') return 2;
  return Math.max(2, Math.min(count || 2, 5));
}
