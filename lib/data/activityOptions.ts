export type ActivityCategory =
  | 'culture'
  | 'nature'
  | 'adventure'
  | 'food_local_life'
  | 'nomadic_culture'
  | 'wellness'
  | 'nightlife'
  | 'digital_nomad';

export type ActivitySource =
  | 'tabylga_partner'
  | 'mtravel_partner_mock'
  | 'tour_operator_mock'
  | 'public_tour_pattern';

export type ActivityPriceType = 'per_person' | 'fixed';
export type RecommendedTransportType =
  | 'none'
  | 'city_taxi'
  | 'airport_transfer'
  | 'private_driver'
  | 'shared_minivan'
  | 'regional_transfer'
  | 'mountain_driver';

export interface ActivityOptionReview {
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  category: ActivityCategory;
  typeLabel: string;
  provider: string;
  source: ActivitySource;
  city: string;
  region: string;
  price: number;
  currency: 'USD';
  priceType: ActivityPriceType;
  durationHours: number;
  difficulty: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  description: string;
  longDescription: string;
  tags: string[];
  goodFor: string[];
  badFor?: string[];
  requirementsSupported: string[];
  familyFriendly: boolean;
  businessFriendly: boolean;
  qrPayment: boolean;
  offlinePaymentSupported: boolean;
  offlineReady: boolean;
  guideIncluded: boolean;
  guideLanguages: string[];
  verified: boolean;
  commissionRate: number;
  season?: string[];
  meetingPoint?: string;
  included?: string[];
  notIncluded?: string[];
  safetyNotes?: string[];
  transportNote?: string;
  recommendedTransportType?: RecommendedTransportType;
  requiresTransport?: boolean;
  requiresVerifiedMountainDriver?: boolean;
  reviews: ActivityOptionReview[];
}

export interface ActivityCommission {
  touristPrice: number;
  commissionRate: number;
  tabylgaCommission: number;
  partnerPayout: number;
}

export interface ActivityTransportRequirement {
  requiresTransport: boolean;
  recommendedTransportType: RecommendedTransportType;
  requiresVerifiedMountainDriver: boolean;
  transportNote: string;
}

export interface ActivitySortPreferences {
  travelStyles?: string[];
  experiences?: string[];
  requirements?: string[];
  budgetTier?: 'budget' | 'standard' | 'comfort' | 'premium';
  activityLevel?: 'easy' | 'light' | 'moderate' | 'hard' | 'chill' | 'active' | 'extreme';
  roadTolerance?: 'low' | 'medium' | 'high';
  travelersType?: string;
  internetComfort?: string;
}

export interface ActivityTripDayContext {
  day?: number;
  city?: string;
  region?: string;
  routeLabel?: string;
  remote?: boolean;
}

const REVIEW_POOL: ActivityOptionReview[] = [
  { user: 'Lena', rating: 5, text: 'Well organized and easy to understand.', date: 'Apr 2026' },
  { user: 'Omar', rating: 4.8, text: 'Good local context and clear meeting point.', date: 'Mar 2026' },
];

function activity(input: Omit<ActivityOption, 'currency' | 'priceType' | 'rating' | 'reviewCount' | 'longDescription' | 'requirementsSupported' | 'familyFriendly' | 'businessFriendly' | 'qrPayment' | 'offlinePaymentSupported' | 'offlineReady' | 'guideIncluded' | 'guideLanguages' | 'verified' | 'reviews'> & Partial<Pick<ActivityOption, 'currency' | 'priceType' | 'rating' | 'reviewCount' | 'longDescription' | 'requirementsSupported' | 'familyFriendly' | 'businessFriendly' | 'qrPayment' | 'offlinePaymentSupported' | 'offlineReady' | 'guideIncluded' | 'guideLanguages' | 'verified' | 'reviews'>>): ActivityOption {
  return {
    currency: 'USD',
    priceType: 'per_person',
    rating: 4.7,
    reviewCount: 42,
    longDescription: input.description,
    requirementsSupported: [],
    familyFriendly: false,
    businessFriendly: false,
    qrPayment: true,
    offlinePaymentSupported: false,
    offlineReady: false,
    guideIncluded: false,
    guideLanguages: ['Russian', 'Basic English'],
    verified: true,
    reviews: REVIEW_POOL,
    ...input,
  };
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  activity({
    id: 'ala_archa_light_walk',
    name: 'Ala-Archa light walk',
    category: 'nature',
    typeLabel: 'Easy nature walk',
    provider: 'Tabylga Nature Partner',
    source: 'public_tour_pattern',
    city: 'Bishkek',
    region: 'Chuy',
    price: 8,
    durationHours: 3,
    difficulty: 1,
    rating: 4.7,
    reviewCount: 86,
    description: 'Easy mountain walk near Bishkek for first-time visitors.',
    longDescription: 'A soft nature stop close to Bishkek with fresh air, mountain views and simple walking routes. Good for relaxed tourists, families and first-day acclimatization.',
    tags: ['nature', 'easy walk', 'short drive', 'family-friendly', 'photography'],
    goodFor: ['relax', 'family_trip', 'nature', 'light_hiking', 'photography'],
    badFor: ['hard_adventure'],
    requirementsSupported: ['family-friendly'],
    familyFriendly: true,
    commissionRate: 0.08,
    meetingPoint: 'Bishkek hotel pickup',
    included: ['Route note', 'Basic safety note'],
    notIncluded: ['Transport', 'Meals'],
    safetyNotes: ['Stay on marked paths', 'Carry water'],
    transportNote: 'Short private transfer or city taxi from Bishkek recommended.',
    recommendedTransportType: 'private_driver',
    requiresTransport: true,
    requiresVerifiedMountainDriver: false,
    offlineReady: true,
  }),
  activity({ id: 'ala_archa_viewpoint_hike', name: 'Ala-Archa viewpoint hike', category: 'adventure', typeLabel: 'Viewpoint hike', provider: 'Tabylga Nature Partner', source: 'public_tour_pattern', city: 'Bishkek', region: 'Chuy', price: 15, durationHours: 5, difficulty: 2, rating: 4.8, reviewCount: 64, description: 'Moderate viewpoint hike in Ala-Archa for mountain photos.', tags: ['mountains', 'viewpoint', 'light hiking', 'photography'], goodFor: ['adventure', 'photography', 'nature'], commissionRate: 0.10, transportNote: 'Private driver recommended for round trip.', recommendedTransportType: 'private_driver', requiresTransport: true, offlineReady: true, safetyNotes: ['Check weather before departure', 'Bring layers'] }),
  activity({ id: 'burana_tower_cultural_stop', name: 'Burana Tower cultural stop', category: 'culture', typeLabel: 'Silk Road stop', provider: 'Chuy Culture Partner', source: 'public_tour_pattern', city: 'Tokmok', region: 'Chuy', price: 5, durationHours: 1.5, difficulty: 1, rating: 4.6, reviewCount: 71, description: 'Short Silk Road history stop at Burana Tower.', tags: ['history', 'silk road', 'culture', 'family-friendly'], goodFor: ['cultural_discovery', 'family_trip', 'photography'], requirementsSupported: ['family-friendly'], familyFriendly: true, commissionRate: 0.08, transportNote: 'Best with private driver or regional transfer from Bishkek.', recommendedTransportType: 'private_driver', requiresTransport: true, included: ['Entry planning note'] }),
  activity({ id: 'osh_bazaar_local_life_walk', name: 'Osh Bazaar local life walk', category: 'food_local_life', typeLabel: 'Bazaar walk', provider: 'Local Life Guide Mock', source: 'mtravel_partner_mock', city: 'Bishkek', region: 'Chuy', price: 7, durationHours: 2, difficulty: 1, rating: 4.7, reviewCount: 98, description: 'Food, spices and daily life walk through Osh Bazaar.', tags: ['bazaar', 'local life', 'budget', 'food', 'culture'], goodFor: ['food_local_life', 'budget', 'culture'], requirementsSupported: ['halal', 'vegetarian'], commissionRate: 0.10, transportNote: 'City taxi or walking route inside Bishkek.', recommendedTransportType: 'city_taxi', requiresTransport: false, guideIncluded: true, guideLanguages: ['Russian', 'English'] }),
  activity({ id: 'kyrgyz_state_history_museum', name: 'Kyrgyz State History Museum', category: 'culture', typeLabel: 'Museum visit', provider: 'Museum Culture Partner', source: 'public_tour_pattern', city: 'Bishkek', region: 'Chuy', price: 6, durationHours: 2, difficulty: 1, rating: 4.5, reviewCount: 54, description: 'Indoor history stop for city and business travelers.', tags: ['museum', 'history', 'city', 'indoor'], goodFor: ['culture', 'business', 'family_trip'], familyFriendly: true, businessFriendly: true, commissionRate: 0.06, transportNote: 'City taxi or walking route.', recommendedTransportType: 'city_taxi', requiresTransport: false }),
  activity({ id: 'ala_too_square_oak_park_walk', name: 'Ala-Too Square and Oak Park walk', category: 'culture', typeLabel: 'Free city walk', provider: 'Tabylga City Pattern', source: 'public_tour_pattern', city: 'Bishkek', region: 'Chuy', price: 0, durationHours: 1, difficulty: 1, rating: 4.5, reviewCount: 49, description: 'Central Bishkek walk with square, park and city photos.', tags: ['free', 'city', 'culture', 'easy', 'photography'], goodFor: ['relax', 'budget', 'business', 'first_day'], familyFriendly: true, businessFriendly: true, commissionRate: 0, transportNote: 'No transport needed if staying in central Bishkek.', recommendedTransportType: 'none', requiresTransport: false, qrPayment: false }),
  activity({ id: 'chon_kemin_horse_riding', name: 'Chon-Kemin horse riding', category: 'adventure', typeLabel: 'Horse riding', provider: 'Chon-Kemin Horse Partner', source: 'tour_operator_mock', city: 'Chon-Kemin', region: 'Chuy', price: 25, durationHours: 3, difficulty: 2, rating: 4.8, reviewCount: 67, description: 'Horse riding through Chon-Kemin valley landscapes.', tags: ['horse riding', 'valley', 'nomadic culture', 'nature'], goodFor: ['adventure', 'nomadic_culture', 'nature'], offlineReady: true, commissionRate: 0.15, transportNote: 'Regional transfer or private driver required.', recommendedTransportType: 'regional_transfer', requiresTransport: true, guideIncluded: true }),
  activity({ id: 'eagle_hunting_show', name: 'Eagle hunting show', category: 'nomadic_culture', typeLabel: 'Nomadic tradition', provider: 'Bokonbaevo Eagle Partner', source: 'tour_operator_mock', city: 'Bokonbaevo', region: 'Issyk-Kul', price: 20, durationHours: 1, difficulty: 1, rating: 4.8, reviewCount: 73, description: 'Traditional eagle hunting demonstration near Issyk-Kul.', tags: ['eagle show', 'nomadic culture', 'tradition', 'photography'], goodFor: ['culture', 'family_trip', 'photography'], familyFriendly: true, commissionRate: 0.12, transportNote: 'Usually paired with Issyk-Kul regional route.', recommendedTransportType: 'regional_transfer', requiresTransport: true }),
  activity({ id: 'issyk_kul_beach_walk', name: 'Issyk-Kul beach walk', category: 'nature', typeLabel: 'Lake walk', provider: 'Issyk-Kul Public Pattern', source: 'public_tour_pattern', city: 'Cholpon-Ata', region: 'Issyk-Kul', price: 0, durationHours: 2, difficulty: 1, rating: 4.6, reviewCount: 81, description: 'Relaxed beach walk on the north shore of Issyk-Kul.', tags: ['lake', 'relax', 'free', 'family-friendly'], goodFor: ['relax', 'family_trip', 'couple', 'photography'], familyFriendly: true, commissionRate: 0, transportNote: 'Regional transfer to Issyk-Kul needed if coming from Bishkek.', recommendedTransportType: 'regional_transfer', requiresTransport: true, qrPayment: false }),
  activity({ id: 'cholpon_ata_petroglyphs', name: 'Cholpon-Ata petroglyphs', category: 'culture', typeLabel: 'Open-air heritage', provider: 'Issyk-Kul Culture Partner', source: 'public_tour_pattern', city: 'Cholpon-Ata', region: 'Issyk-Kul', price: 5, durationHours: 1.5, difficulty: 1, rating: 4.6, reviewCount: 62, description: 'Open-air petroglyph field with lake-region history.', tags: ['petroglyphs', 'history', 'culture', 'photography'], goodFor: ['cultural_discovery', 'photography', 'family_trip'], familyFriendly: true, commissionRate: 0.08, transportNote: 'Short local transfer from Cholpon-Ata.', recommendedTransportType: 'city_taxi', requiresTransport: true }),
  activity({ id: 'ruh_ordo_cultural_center', name: 'Ruh Ordo cultural center', category: 'culture', typeLabel: 'Cultural center', provider: 'Issyk-Kul Culture Partner', source: 'public_tour_pattern', city: 'Cholpon-Ata', region: 'Issyk-Kul', price: 8, durationHours: 2, difficulty: 1, rating: 4.5, reviewCount: 58, description: 'Lakeside cultural complex with easy walking.', tags: ['culture', 'lake', 'museum', 'easy'], goodFor: ['culture', 'family_trip', 'relax'], familyFriendly: true, commissionRate: 0.08, transportNote: 'Local taxi or walking route from central Cholpon-Ata.', recommendedTransportType: 'city_taxi', requiresTransport: false }),
  activity({ id: 'skazka_canyon_light_walk', name: 'Skazka Canyon light walk', category: 'nature', typeLabel: 'Canyon walk', provider: 'Issyk-Kul Route Partner', source: 'public_tour_pattern', city: 'Tosor', region: 'Issyk-Kul', price: 6, durationHours: 2, difficulty: 1, rating: 4.8, reviewCount: 93, description: 'Easy photography walk through Skazka Canyon.', tags: ['canyon', 'photography', 'easy walk', 'nature'], goodFor: ['nature', 'photography', 'family_trip'], familyFriendly: true, offlineReady: true, commissionRate: 0.08, transportNote: 'Regional/private driver recommended on Issyk-Kul south shore.', recommendedTransportType: 'regional_transfer', requiresTransport: true, safetyNotes: ['Avoid climbing loose formations'] }),
  activity({ id: 'skazka_canyon_adventure_walk', name: 'Skazka Canyon adventure walk', category: 'adventure', typeLabel: 'Canyon adventure', provider: 'Issyk-Kul Route Partner', source: 'tour_operator_mock', city: 'Tosor', region: 'Issyk-Kul', price: 10, durationHours: 3, difficulty: 2, rating: 4.8, reviewCount: 51, description: 'Longer canyon walk for active travelers and photographers.', tags: ['canyon', 'adventure', 'photography'], goodFor: ['adventure', 'photography', 'nature'], commissionRate: 0.10, transportNote: 'Regional/private driver recommended.', recommendedTransportType: 'regional_transfer', requiresTransport: true, offlineReady: true }),
  activity({ id: 'karakol_city_walk', name: 'Karakol city walk', category: 'culture', typeLabel: 'City walk', provider: 'Karakol Local Guide', source: 'mtravel_partner_mock', city: 'Karakol', region: 'Issyk-Kul', price: 5, durationHours: 2, difficulty: 1, rating: 4.7, reviewCount: 66, description: 'Central Karakol walk through culture, bazaar and local streets.', tags: ['city walk', 'culture', 'local life', 'bazaar'], goodFor: ['culture', 'food_local_life', 'budget'], commissionRate: 0.08, transportNote: 'No transport needed inside central Karakol.', recommendedTransportType: 'none', requiresTransport: false, guideIncluded: true, guideLanguages: ['Russian', 'English'] }),
  activity({ id: 'dungan_mosque_visit', name: 'Dungan Mosque visit', category: 'culture', typeLabel: 'Architecture stop', provider: 'Karakol Culture Partner', source: 'public_tour_pattern', city: 'Karakol', region: 'Issyk-Kul', price: 4, durationHours: 1, difficulty: 1, rating: 4.6, reviewCount: 44, description: 'Short architecture and history stop at Dungan Mosque.', tags: ['architecture', 'culture', 'history'], goodFor: ['culture', 'family_trip', 'photography'], familyFriendly: true, commissionRate: 0.06, transportNote: 'Short local taxi or walking route.', recommendedTransportType: 'city_taxi', requiresTransport: false }),
  activity({ id: 'jeti_oguz_viewpoint', name: 'Jeti-Oguz viewpoint', category: 'nature', typeLabel: 'Red rocks viewpoint', provider: 'Karakol Route Partner', source: 'public_tour_pattern', city: 'Jeti-Oguz', region: 'Issyk-Kul', price: 8, durationHours: 2, difficulty: 1, rating: 4.8, reviewCount: 69, description: 'Viewpoint stop for red rocks and valley photos.', tags: ['viewpoint', 'red rocks', 'photography', 'nature'], goodFor: ['nature', 'photography', 'family_trip'], familyFriendly: true, offlineReady: true, commissionRate: 0.08, transportNote: 'Local transfer from Karakol recommended.', recommendedTransportType: 'regional_transfer', requiresTransport: true }),
  activity({ id: 'jeti_oguz_light_hike', name: 'Jeti-Oguz light hike', category: 'adventure', typeLabel: 'Light hike', provider: 'Karakol Route Partner', source: 'tour_operator_mock', city: 'Jeti-Oguz', region: 'Issyk-Kul', price: 15, durationHours: 4, difficulty: 2, rating: 4.8, reviewCount: 47, description: 'Light mountain hike around Jeti-Oguz valley.', tags: ['hiking', 'mountain', 'nature', 'photography'], goodFor: ['adventure', 'light_hiking', 'nature'], commissionRate: 0.10, transportNote: 'Local transfer from Karakol recommended.', recommendedTransportType: 'regional_transfer', requiresTransport: true, offlineReady: true }),
  activity({ id: 'karakol_hot_springs', name: 'Karakol hot springs', category: 'wellness', typeLabel: 'Hot springs', provider: 'Karakol Wellness Partner', source: 'tour_operator_mock', city: 'Karakol', region: 'Issyk-Kul', price: 12, durationHours: 2, difficulty: 1, rating: 4.6, reviewCount: 39, description: 'Relaxed hot springs stop after active travel days.', tags: ['hot springs', 'relax', 'wellness'], goodFor: ['relax', 'wellness', 'adventure'], commissionRate: 0.10, transportNote: 'Local transfer recommended.', recommendedTransportType: 'city_taxi', requiresTransport: true }),
  activity({ id: 'local_cooking_class', name: 'Local cooking class', category: 'food_local_life', typeLabel: 'Cooking class', provider: 'Karakol Family Host', source: 'mtravel_partner_mock', city: 'Karakol', region: 'Issyk-Kul', price: 18, durationHours: 2.5, difficulty: 1, rating: 4.9, reviewCount: 57, description: 'Cook a local dish with a host family in Karakol.', tags: ['cooking', 'local family', 'food experience', 'culture'], goodFor: ['food_local_life', 'culture', 'family_trip'], requirementsSupported: ['halal', 'vegetarian', 'family-friendly'], familyFriendly: true, commissionRate: 0.12, transportNote: 'Usually reachable by local taxi or walking route.', recommendedTransportType: 'city_taxi', requiresTransport: false, guideIncluded: true, guideLanguages: ['English', 'Russian'] }),
  activity({ id: 'craft_workshop', name: 'Craft workshop', category: 'culture', typeLabel: 'Craft workshop', provider: 'Kochkor Craft Host', source: 'mtravel_partner_mock', city: 'Kochkor', region: 'Naryn', price: 15, durationHours: 2, difficulty: 1, rating: 4.8, reviewCount: 41, description: 'Felt and craft workshop with local artisans.', tags: ['crafts', 'felt', 'local artisans', 'shopping'], goodFor: ['culture', 'shopping_crafts', 'family_trip'], familyFriendly: true, commissionRate: 0.12, transportNote: 'Regional transfer/private driver needed from Bishkek or Naryn.', recommendedTransportType: 'regional_transfer', requiresTransport: true }),
  activity({ id: 'song_kul_yurt_experience', name: 'Song-Kul yurt experience', category: 'nomadic_culture', typeLabel: 'Yurt experience', provider: 'Song-Kul Yurt Camp Partner', source: 'mtravel_partner_mock', city: 'Song-Kul', region: 'Naryn', price: 25, durationHours: 3, difficulty: 1, rating: 4.9, reviewCount: 63, description: 'Tea, yurt life and pasture culture at Song-Kul.', tags: ['yurt', 'nomadic culture', 'remote', 'offline-ready'], goodFor: ['adventure', 'nomadic_culture', 'photography'], offlinePaymentSupported: true, offlineReady: true, qrPayment: false, commissionRate: 0.15, transportNote: 'Verified mountain driver required for remote road.', recommendedTransportType: 'mountain_driver', requiresTransport: true, requiresVerifiedMountainDriver: true, safetyNotes: ['Road access depends on weather'] }),
  activity({ id: 'song_kul_horse_riding', name: 'Song-Kul horse riding', category: 'adventure', typeLabel: 'Mountain lake horse riding', provider: 'Song-Kul Horse Provider', source: 'mtravel_partner_mock', city: 'Song-Kul', region: 'Naryn', price: 30, durationHours: 2, difficulty: 2, rating: 4.9, reviewCount: 52, description: 'Horse riding near high mountain pastures and lake views.', tags: ['horse riding', 'remote', 'mountain lake', 'offline-ready'], goodFor: ['adventure', 'nomadic_culture', 'photography'], offlinePaymentSupported: true, offlineReady: true, qrPayment: false, commissionRate: 0.15, transportNote: 'Verified mountain driver required to reach Song-Kul.', recommendedTransportType: 'mountain_driver', requiresTransport: true, requiresVerifiedMountainDriver: true, guideIncluded: true }),
  activity({ id: 'song_kul_photography_viewpoint', name: 'Song-Kul photography viewpoint', category: 'nature', typeLabel: 'Remote viewpoint', provider: 'Song-Kul Yurt Camp Partner', source: 'public_tour_pattern', city: 'Song-Kul', region: 'Naryn', price: 0, durationHours: 1.5, difficulty: 1, rating: 4.8, reviewCount: 36, description: 'Sunset and lake viewpoint near Song-Kul yurt camps.', tags: ['photography', 'mountain lake', 'sunset', 'remote'], goodFor: ['photography', 'relax', 'adventure'], offlineReady: true, qrPayment: false, commissionRate: 0, transportNote: 'Verified mountain driver required to reach Song-Kul.', recommendedTransportType: 'mountain_driver', requiresTransport: true, requiresVerifiedMountainDriver: true }),
  activity({ id: 'bishkek_nightlife_evening', name: 'Bishkek nightlife evening', category: 'nightlife', typeLabel: 'Evening social', provider: 'Bishkek Evening Guide', source: 'tour_operator_mock', city: 'Bishkek', region: 'Chuy', price: 20, durationHours: 3, difficulty: 1, rating: 4.5, reviewCount: 35, description: 'Evening route for music, social stops and city atmosphere.', tags: ['nightlife', 'city', 'friends', 'evening'], goodFor: ['friends', 'nightlife'], badFor: ['family_trip', 'no_alcohol'], commissionRate: 0.10, transportNote: 'City taxi recommended for evening return.', recommendedTransportType: 'city_taxi', requiresTransport: true, guideIncluded: true }),
  activity({ id: 'coworking_cafe_stop', name: 'Coworking cafe stop', category: 'digital_nomad', typeLabel: 'Coworking cafe', provider: 'Bishkek Digital Nomad Mock', source: 'public_tour_pattern', city: 'Bishkek', region: 'Chuy', price: 10, durationHours: 3, difficulty: 1, rating: 4.6, reviewCount: 48, description: 'Wi-Fi cafe stop for work, calls or route planning.', tags: ['wifi', 'digital nomad', 'coffee', 'business'], goodFor: ['digital_nomad', 'business'], businessFriendly: true, commissionRate: 0.08, transportNote: 'No special transport needed in central Bishkek.', recommendedTransportType: 'none', requiresTransport: false }),
  activity({ id: 'bishkek_guided_city_highlights', name: 'Bishkek guided city highlights', category: 'culture', typeLabel: 'Guided city highlights', provider: 'MTravel Partner Guide', source: 'mtravel_partner_mock', city: 'Bishkek', region: 'Chuy', price: 18, durationHours: 3, difficulty: 1, rating: 4.8, reviewCount: 77, description: 'Guided highlights across central Bishkek history and city life.', tags: ['guide', 'city', 'history', 'easy'], goodFor: ['culture', 'business', 'family_trip'], familyFriendly: true, businessFriendly: true, guideIncluded: true, guideLanguages: ['English', 'Russian'], commissionRate: 0.12, transportNote: 'Walking route with optional taxi between stops.', recommendedTransportType: 'city_taxi', requiresTransport: false }),
  activity({ id: 'issyk_kul_sunset_photography_stop', name: 'Issyk-Kul sunset photography stop', category: 'nature', typeLabel: 'Sunset stop', provider: 'Issyk-Kul Photo Pattern', source: 'public_tour_pattern', city: 'Cholpon-Ata', region: 'Issyk-Kul', price: 5, durationHours: 1.5, difficulty: 1, rating: 4.7, reviewCount: 33, description: 'Simple sunset photo stop by Issyk-Kul.', tags: ['sunset', 'photography', 'lake', 'easy'], goodFor: ['photography', 'couple', 'relax'], commissionRate: 0.08, transportNote: 'Local taxi or walking route depending on hotel location.', recommendedTransportType: 'city_taxi', requiresTransport: false }),
];

const ACTIVITY_LEVEL_MAX: Record<NonNullable<ActivitySortPreferences['activityLevel']>, number> = {
  easy: 1,
  light: 2,
  moderate: 3,
  hard: 4,
  chill: 1,
  active: 3,
  extreme: 4,
};

const ROAD_RANK = { low: 1, medium: 2, high: 3 } as const;

export function getAllActivityOptions(): ActivityOption[] {
  return [...ACTIVITY_OPTIONS];
}

export function getActivityById(id: string): ActivityOption | undefined {
  return ACTIVITY_OPTIONS.find((activity) => activity.id === id);
}

export function getActivitiesByCategory(category: ActivityCategory): ActivityOption[] {
  return ACTIVITY_OPTIONS.filter((activity) => activity.category === category);
}

export function getActivitiesForTripDay({
  day,
  preferences,
}: {
  day: ActivityTripDayContext;
  preferences?: ActivitySortPreferences;
}): ActivityOption[] {
  const matches = ACTIVITY_OPTIONS.filter((activityOption) => matchesTripDay(activityOption, day));
  const source = matches.length > 0 ? matches : ACTIVITY_OPTIONS;
  return sortActivitiesForPreferences(source, preferences);
}

export function sortActivitiesForPreferences(
  options: ActivityOption[],
  preferences: ActivitySortPreferences = {}
): ActivityOption[] {
  return [...options]
    .filter((activityOption) => activityAllowed(activityOption, preferences))
    .sort((a, b) => scoreActivity(b, preferences) - scoreActivity(a, preferences));
}

export function calculateActivityCommission(option: ActivityOption): ActivityCommission {
  const touristPrice = option.price;
  const tabylgaCommission = roundMoney(touristPrice * option.commissionRate);
  return {
    touristPrice,
    commissionRate: option.commissionRate,
    tabylgaCommission,
    partnerPayout: roundMoney(touristPrice - tabylgaCommission),
  };
}

export function getActivityTransportRequirement(activityOption: ActivityOption): ActivityTransportRequirement {
  return {
    requiresTransport: activityOption.requiresTransport ?? false,
    recommendedTransportType: activityOption.recommendedTransportType ?? 'none',
    requiresVerifiedMountainDriver: activityOption.requiresVerifiedMountainDriver ?? false,
    transportNote: activityOption.transportNote ?? 'No special transport note.',
  };
}

function matchesTripDay(activityOption: ActivityOption, day: ActivityTripDayContext): boolean {
  const haystack = normalize([activityOption.city, activityOption.region, activityOption.tags.join(' '), activityOption.name].join(' '));
  const needles = [day.city, day.region, day.routeLabel]
    .filter((value): value is string => !!value)
    .map(normalize);
  return needles.length === 0 || needles.some((needle) => haystack.includes(needle));
}

function activityAllowed(activityOption: ActivityOption, preferences: ActivitySortPreferences): boolean {
  const roadTolerance = preferences.roadTolerance ?? 'medium';
  const roadRank = ROAD_RANK[roadTolerance];
  if ((activityOption.requiresVerifiedMountainDriver || activityOption.recommendedTransportType === 'mountain_driver') && roadTolerance === 'low') return false;
  if (activityOption.difficulty > (ACTIVITY_LEVEL_MAX[preferences.activityLevel ?? 'moderate'] ?? 3)) return false;
  if (activityOption.requiresVerifiedMountainDriver && !allowsRemote(preferences)) return false;
  if (ROAD_RANK[activityOption.requiresVerifiedMountainDriver ? 'high' : 'medium'] > roadRank && activityOption.requiresTransport) return false;
  return true;
}

function scoreActivity(activityOption: ActivityOption, preferences: ActivitySortPreferences): number {
  const styles = preferences.travelStyles ?? [];
  const experiences = preferences.experiences ?? [];
  let score = activityOption.verified ? 10 : 0;

  if (activityOption.difficulty === 1 && ['easy', 'chill', undefined].includes(preferences.activityLevel)) score += 25;
  if (styles.includes('adventure') && ['adventure', 'nature', 'nomadic_culture', 'wellness'].includes(activityOption.category)) score += 30;
  if (styles.includes('family_trip') && activityOption.familyFriendly && activityOption.difficulty === 1) score += 35;
  if ((styles.includes('business') || styles.includes('digital_nomad')) && (activityOption.businessFriendly || ['digital_nomad', 'culture'].includes(activityOption.category))) score += 26;
  if (preferences.budgetTier === 'budget') score -= activityOption.price;
  if (preferences.budgetTier === 'budget' && activityOption.price <= 8) score += 25;
  if (styles.includes('cultural_discovery') || experiences.some((item) => ['museums_history', 'shopping_crafts'].includes(item))) {
    if (activityOption.category === 'culture' || activityOption.tags.some((tag) => ['history', 'museum', 'petroglyphs', 'crafts', 'silk road'].includes(tag))) score += 26;
  }
  if (experiences.some((item) => ['mountain_views', 'lakes_canyons', 'photography_spots', 'light_hiking'].includes(item))) {
    if (activityOption.category === 'nature' || activityOption.tags.some((tag) => ['nature', 'photography', 'lake', 'canyon'].includes(tag))) score += 24;
  }
  if (styles.includes('food_local_life') && activityOption.category === 'food_local_life') score += 28;
  if (preferences.internetComfort !== 'prefer_internet' && activityOption.offlineReady) score += 15;
  if (activityOption.requiresVerifiedMountainDriver) score += allowsRemote(preferences) ? 8 : -50;
  score += activityOption.rating + activityOption.reviewCount / 100;

  return score;
}

function allowsRemote(preferences: ActivitySortPreferences): boolean {
  return (
    preferences.roadTolerance === 'high' ||
    preferences.internetComfort === 'remote_ok_if_worth_it' ||
    (preferences.travelStyles ?? []).includes('adventure') ||
    (preferences.experiences ?? []).includes('nomadic_culture')
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 -]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
