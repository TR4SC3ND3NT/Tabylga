import { ACTIVITIES } from '../data/activities';
import { FOOD_PLACES } from '../data/food';
import { STAYS } from '../data/stays';
import { TRANSPORT_OPTIONS } from '../data/transport';
import {
  DEFAULT_TRIP_PREFERENCES,
  normalizeTravelerCount,
  type Activity,
  type BudgetTier,
  type ExperienceKey,
  type FoodPlace,
  type PlannerActivityLevel,
  type RequirementKey,
  type RoadTolerance,
  type Stay,
  type StayPreference,
  type TransportOption,
  type TravelersType,
  type TravelStyle,
  type TripPreferences,
} from '../data/tripPlaces';

export interface GeneratedTripActivity extends Activity {
  labels: string[];
}

export interface GeneratedTripDay {
  day: number;
  title: string;
  region: string;
  reason: string;
  estimatedCost: number;
  stay: Stay;
  transport: TransportOption;
  food: FoodPlace;
  activities: GeneratedTripActivity[];
  offlineReady: boolean;
  tags: string[];
}

export interface GeneratedTrip {
  id: string;
  sessionId?: string | null;
  status?: 'draft' | 'locked_demo';
  title: string;
  summary: string;
  days: number;
  startPoint: TripPreferences['startPoint'];
  travelerCount: number;
  travelersType: TravelersType;
  travelStyles: TravelStyle[];
  budgetTier: BudgetTier;
  totalCost: number;
  costPerPerson: number;
  regions: string[];
  whyThisFits: string;
  dailyPlans: GeneratedTripDay[];
}

const ACTIVITY_MAX: Record<PlannerActivityLevel, number> = {
  easy: 1,
  light: 2,
  moderate: 3,
  hard: 4,
};

const ROAD_RANK: Record<RoadTolerance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const PACE_ACTIVITY_COUNTS = {
  relaxed: 2,
  balanced: 3,
  packed: 4,
} as const;

const BUDGET_CAP: Record<BudgetTier, number> = {
  budget: 300,
  standard: 600,
  comfort: 1200,
  premium: 2500,
};

const TIER_RANK: Record<BudgetTier, number> = {
  budget: 1,
  standard: 2,
  comfort: 3,
  premium: 4,
};

const STYLE_TAGS: Record<TravelStyle, string[]> = {
  relax: ['relax', 'easy', 'city', 'family_friendly'],
  adventure: ['adventure', 'mountain_views', 'lakes_canyons', 'horse_riding', 'light_hiking', 'remote'],
  cultural_discovery: ['cultural_discovery', 'museums_history', 'culture', 'heritage'],
  food_local_life: ['food_local_life', 'local_food', 'bazaars_local_life', 'market'],
  business: ['business', 'wifi', 'city', 'short_drive'],
  family_trip: ['family_friendly', 'easy', 'safe'],
  digital_nomad: ['digital_nomad', 'wifi', 'coworking', 'cafe'],
  premium_comfort: ['premium', 'comfort', 'private', 'curated'],
};

const EXPERIENCE_TAGS: Record<ExperienceKey, string[]> = {
  museums_history: ['museums_history', 'heritage', 'culture'],
  bazaars_local_life: ['bazaars_local_life', 'market', 'local_life'],
  nomadic_culture: ['nomadic_culture', 'yurt', 'nomadic'],
  local_food: ['local_food', 'national_food', 'cooking_class'],
  mountain_views: ['mountain_views', 'viewpoint', 'nature'],
  lakes_canyons: ['lakes_canyons', 'lake', 'canyon'],
  horse_riding: ['horse_riding', 'horse'],
  hot_springs: ['hot_springs', 'wellness'],
  shopping_crafts: ['shopping_crafts', 'crafts', 'shopping'],
  photography_spots: ['photography_spots', 'viewpoint'],
  nightlife: ['nightlife', 'social', 'late_activity'],
  light_hiking: ['light_hiking', 'nature_walk'],
};

const PRETTY: Record<string, string> = {
  relax: 'relaxed sightseeing',
  adventure: 'adventure',
  cultural_discovery: 'cultural discovery',
  food_local_life: 'food and local life',
  business: 'business',
  family_trip: 'family trip',
  digital_nomad: 'digital nomad',
  premium_comfort: 'premium comfort',
  manas_airport: 'Manas Airport',
  bishkek: 'Bishkek',
  osh: 'Osh',
  issyk_kul: 'Issyk-Kul',
  not_sure: 'Bishkek',
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function hasAny(source: string[], targets: string[]) {
  return targets.some((target) => source.includes(target));
}

function activeRequirements(preferences: TripPreferences) {
  return preferences.requirements.filter((item) => item !== 'none');
}

function normalizePreferences(input: TripPreferences): TripPreferences {
  const merged = { ...DEFAULT_TRIP_PREFERENCES, ...input };
  return {
    ...merged,
    travelerCount: normalizeTravelerCount(merged.travelersType, merged.travelerCount),
    travelStyles: merged.travelStyles.length ? merged.travelStyles : ['relax'],
    experiences: merged.experiences.length ? merged.experiences : ['museums_history', 'local_food', 'mountain_views'],
    requirements: merged.requirements.length ? merged.requirements : ['none'],
  };
}

function targetTags(preferences: TripPreferences) {
  return unique([
    ...preferences.travelStyles.flatMap((style) => STYLE_TAGS[style] ?? []),
    ...preferences.experiences.flatMap((experience) => EXPERIENCE_TAGS[experience] ?? []),
  ]);
}

function prettyList(items: string[]) {
  return items.map((item) => PRETTY[item] ?? item.replace(/_/g, ' ')).join(', ');
}

function regionPlan(preferences: TripPreferences) {
  const days = preferences.days;
  const business = preferences.travelStyles.includes('business');
  const nomad = preferences.travelStyles.includes('digital_nomad');
  const family = preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family' || preferences.requirements.includes('family_friendly');
  const adventure = preferences.travelStyles.includes('adventure');
  const remoteAllowed = preferences.roadTolerance === 'high' && preferences.internetComfort === 'remote_ok_if_worth_it' && preferences.stayPreference === 'remote_basic_ok';

  if (preferences.startPoint === 'osh') return fill(['Osh', 'Osh', 'Bishkek', 'Burana', 'Ala-Archa'], days);
  if (preferences.startPoint === 'issyk_kul') return fill(['Issyk-Kul', 'Cholpon-Ata', 'Skazka Canyon', 'Karakol', 'Jeti-Oguz'], days);
  if (business || nomad || preferences.roadTolerance === 'low') return fill(['Bishkek', 'Bishkek', 'Ala-Archa', 'Bishkek', 'Burana'], days);
  if (adventure && remoteAllowed && days >= 7) return fill(['Bishkek', 'Burana', 'Issyk-Kul', 'Karakol', 'Jeti-Oguz', 'Skazka Canyon', 'Song-Kul'], days);
  if (adventure && days >= 5) return fill(['Bishkek', 'Burana', 'Issyk-Kul', 'Karakol', 'Jeti-Oguz'], days);
  if (family) return fill(['Bishkek', 'Ala-Archa', 'Burana', 'Issyk-Kul', 'Cholpon-Ata'], days);
  if (days === 3) return ['Bishkek', 'Burana', 'Ala-Archa'];
  return fill(['Bishkek', 'Ala-Archa', 'Burana', 'Issyk-Kul', 'Cholpon-Ata'], days);
}

function fill(seed: string[], days: number) {
  return Array.from({ length: days }, (_, index) => seed[index % seed.length]);
}

function budgetScore(tier: BudgetTier, price: number, expensive: number) {
  if (tier === 'premium') return price >= expensive ? 18 : 6;
  if (tier === 'budget') return price <= expensive * 0.35 ? 18 : price > expensive * 0.7 ? -22 : 6;
  if (tier === 'standard') return price <= expensive * 0.65 ? 14 : price > expensive ? -12 : 5;
  return price <= expensive ? 12 : -4;
}

function stayAllowed(stay: Stay, preferences: TripPreferences) {
  const reqs = activeRequirements(preferences);
  if (preferences.stayPreference === 'hotels_only' && stay.type !== 'hotel') return false;
  if (preferences.stayPreference === 'guesthouse_ok' && stay.type === 'yurt') return false;
  if (preferences.stayPreference !== 'remote_basic_ok' && stay.remote && preferences.roadTolerance !== 'high') return false;
  if (preferences.internetComfort === 'prefer_internet' && !stay.wifi) return false;
  if (preferences.travelStyles.includes('business') && (!stay.businessFriendly || stay.remote)) return false;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && !stay.familyFriendly) return false;
  if (reqs.includes('wheelchair') && (stay.remote || stay.type === 'yurt')) return false;
  return ![preferences.stayPreference, preferences.travelersType, ...reqs].some((item) => stay.badFor.includes(item));
}

function scoreStay(stay: Stay, preferences: TripPreferences, region: string) {
  let score = 0;
  if (stay.region === region) score += 45;
  if (region === 'Cholpon-Ata' && stay.region === 'Issyk-Kul') score += 35;
  if (region === 'Jeti-Oguz' && stay.region === 'Karakol') score += 28;
  if (preferences.startPoint === 'osh' && stay.region === 'Osh') score += 30;
  if (stay.goodFor.includes(preferences.travelersType)) score += 12;
  if (stay.tier === preferences.budgetTier) score += 18;
  if (TIER_RANK[stay.tier] <= TIER_RANK[preferences.budgetTier]) score += 8;
  score += budgetScore(preferences.budgetTier, stay.pricePerNight, 120);
  if (preferences.travelStyles.includes('business') && stay.businessFriendly) score += 25;
  if (preferences.travelStyles.includes('digital_nomad') && stay.wifi) score += 22;
  if (preferences.travelStyles.includes('premium_comfort') && stay.tier === 'premium') score += 30;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && stay.familyFriendly) score += 24;
  if (preferences.internetComfort === 'prefer_internet' && stay.wifi) score += 18;
  if (preferences.internetComfort !== 'prefer_internet' && stay.offlinePaymentSupported) score += 10;
  return score;
}

function transportAllowed(transport: TransportOption, preferences: TripPreferences) {
  if (ROAD_RANK[transport.roadToleranceRequired] > ROAD_RANK[preferences.roadTolerance]) return false;
  if (preferences.travelStyles.includes('business') && transport.type === 'shared_transport') return false;
  if (preferences.budgetTier === 'budget' && transport.type === 'private_driver' && transport.price > 80) return false;
  if (preferences.requirements.includes('wheelchair') && transport.type === 'shared_transport') return false;
  return transport.goodFor.includes(preferences.travelersType) || preferences.travelersType === 'solo';
}

function scoreTransport(transport: TransportOption, preferences: TripPreferences, region: string, day: number) {
  let score = 0;
  if (transport.regions.includes(region)) score += 35;
  if (day === 1 && ['manas_airport', 'not_sure'].includes(preferences.startPoint) && transport.type === 'airport_transfer') score += 60;
  if (preferences.budgetTier === 'premium' && transport.type === 'private_driver') score += 25;
  if (preferences.budgetTier === 'budget' && transport.type === 'shared_transport') score += 22;
  if (preferences.travelStyles.includes('business') && hasAny(transport.tags, ['business', 'comfort'])) score += 24;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && transport.tags.includes('family_friendly')) score += 20;
  if (preferences.internetComfort !== 'prefer_internet' && transport.offlineContactAvailable) score += 12;
  if (transport.qrPayment) score += 8;
  score += budgetScore(preferences.budgetTier, transport.price, 110);
  return score;
}

function foodAllowed(food: FoodPlace, preferences: TripPreferences) {
  const reqs = activeRequirements(preferences);
  if (reqs.some((req) => ['halal', 'vegetarian', 'vegan', 'no_alcohol', 'prayer_friendly'].includes(req) && !food.requirementsSupported.includes(req))) return false;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && food.badFor.includes('family')) return false;
  if (preferences.budgetTier === 'budget' && food.tier === 'premium') return false;
  return ![preferences.travelersType, ...reqs].some((item) => food.badFor.includes(item));
}

function scoreFood(food: FoodPlace, preferences: TripPreferences, region: string) {
  const tags = targetTags(preferences);
  let score = 0;
  if (food.region === region) score += 35;
  if (region === 'Cholpon-Ata' && food.region === 'Issyk-Kul') score += 20;
  if (food.tags.some((tag) => tags.includes(tag))) score += 28;
  if (food.goodFor.includes(preferences.travelersType)) score += 10;
  if (food.tier === preferences.budgetTier) score += 14;
  if (preferences.travelStyles.includes('food_local_life') && hasAny(food.tags, ['local_food', 'market', 'national_food'])) score += 30;
  if (preferences.travelStyles.includes('digital_nomad') && hasAny(food.tags, ['wifi', 'cafe'])) score += 18;
  if (preferences.requirements.some((req) => food.requirementsSupported.includes(req))) score += 12;
  if (food.qrPayment) score += 6;
  if (food.offlineReady) score += 6;
  score += budgetScore(preferences.budgetTier, food.priceEstimate, 35);
  return score;
}

function activityAllowed(activity: Activity, preferences: TripPreferences) {
  const reqs = activeRequirements(preferences);
  if (activity.difficulty > ACTIVITY_MAX[preferences.activityLevel]) return false;
  if (ROAD_RANK[activity.roadIntensity] > ROAD_RANK[preferences.roadTolerance]) return false;
  if (preferences.internetComfort === 'prefer_internet' && !activity.internetAvailable && activity.roadIntensity === 'high') return false;
  if (preferences.travelStyles.includes('business') && hasAny(activity.tags, ['remote', 'late_activity']) && !preferences.travelStyles.includes('adventure')) return false;
  if ((preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') && (activity.difficulty > 2 || hasAny(activity.tags, ['nightlife', 'late_activity']))) return false;
  if (reqs.includes('wheelchair') && (activity.difficulty > 1 || activity.roadIntensity !== 'low')) return false;
  if (reqs.includes('no_alcohol') && activity.tags.includes('nightlife')) return false;
  return ![preferences.travelersType, ...reqs].some((item) => activity.badFor.includes(item));
}

function scoreActivity(activity: Activity, preferences: TripPreferences, region: string, used: Set<string>) {
  const tags = targetTags(preferences);
  let score = 0;
  if (activity.region === region) score += 42;
  if (region === 'Issyk-Kul' && ['Cholpon-Ata', 'Skazka Canyon'].includes(activity.region)) score += 28;
  if (region === 'Karakol' && activity.region === 'Jeti-Oguz') score += 22;
  if (activity.tags.some((tag) => tags.includes(tag))) score += 32;
  if (activity.goodFor.includes(preferences.travelersType)) score += 10;
  if (preferences.travelStyles.includes('adventure') && hasAny(activity.tags, ['mountain_views', 'lakes_canyons', 'horse_riding', 'hot_springs'])) score += 24;
  if (preferences.travelStyles.includes('business') && hasAny(activity.tags, ['wifi', 'city', 'easy'])) score += 20;
  if (preferences.travelStyles.includes('family_trip') && hasAny(activity.tags, ['family_friendly', 'easy'])) score += 22;
  if (preferences.travelStyles.includes('food_local_life') && hasAny(activity.tags, ['local_food', 'bazaars_local_life'])) score += 24;
  if (preferences.travelStyles.includes('digital_nomad') && hasAny(activity.tags, ['wifi', 'digital_nomad'])) score += 22;
  if (activity.offlineReady) score += 8;
  if (activity.internetAvailable && preferences.internetComfort === 'prefer_internet') score += 8;
  if (used.has(activity.id)) score -= 80;
  score += budgetScore(preferences.budgetTier, activity.price, 45);
  return score;
}

function rank<T>(items: T[], scorer: (item: T) => number) {
  return [...items].sort((a, b) => scorer(b) - scorer(a));
}

function chooseStay(preferences: TripPreferences, region: string, excludeId?: string) {
  const eligible = STAYS.filter((stay) => stay.id !== excludeId && stayAllowed(stay, preferences));
  return rank(eligible.length ? eligible : STAYS.filter((stay) => stay.id !== excludeId), (stay) => scoreStay(stay, preferences, region))[0] ?? STAYS[0];
}

function chooseTransport(preferences: TripPreferences, region: string, day: number, excludeId?: string) {
  const eligible = TRANSPORT_OPTIONS.filter((transport) => transport.id !== excludeId && transportAllowed(transport, preferences));
  return rank(eligible.length ? eligible : TRANSPORT_OPTIONS.filter((transport) => transport.id !== excludeId), (transport) => scoreTransport(transport, preferences, region, day))[0] ?? TRANSPORT_OPTIONS[0];
}

function chooseFood(preferences: TripPreferences, region: string, excludeId?: string) {
  const eligible = FOOD_PLACES.filter((food) => food.id !== excludeId && foodAllowed(food, preferences));
  return rank(eligible.length ? eligible : FOOD_PLACES.filter((food) => food.id !== excludeId), (food) => scoreFood(food, preferences, region))[0] ?? FOOD_PLACES[0];
}

function chooseActivities(preferences: TripPreferences, region: string, used: Set<string>, exclude = new Set<string>()) {
  const count = PACE_ACTIVITY_COUNTS[preferences.pace];
  const eligible = ACTIVITIES.filter((activity) => !exclude.has(activity.id) && activityAllowed(activity, preferences));
  const ranked = rank(eligible.length ? eligible : ACTIVITIES.filter((activity) => !exclude.has(activity.id)), (activity) => scoreActivity(activity, preferences, region, used));
  const chosen = ranked.slice(0, count);
  chosen.forEach((activity) => used.add(activity.id));
  return chosen.map((activity) => ({ ...activity, labels: activityLabels(activity, preferences) }));
}

function activityLabels(activity: Activity, preferences: TripPreferences) {
  const labels: string[] = [];
  if (activity.tags.some((tag) => targetTags(preferences).includes(tag))) labels.push('Matches your preferences');
  if (activity.price <= 10 || preferences.budgetTier !== 'budget') labels.push('Fits your budget');
  if (activity.difficulty === 1) labels.push('Easy activity');
  if (activity.goodFor.includes('family')) labels.push('Family-friendly');
  if (activity.internetAvailable) labels.push('Internet available');
  if (activity.offlineReady) labels.push('Offline-ready');
  if (activity.tags.includes('mountain_views')) labels.push('Mountain view');
  if (activity.tags.includes('local_food')) labels.push('Food pick');
  if (activity.tags.includes('museums_history')) labels.push('Local culture');
  return unique(labels).slice(0, 5);
}

function dayReason(preferences: TripPreferences, region: string) {
  if (preferences.travelStyles.includes('business')) return 'Kept city-friendly with Wi-Fi, short transfers and practical timing.';
  if (preferences.travelStyles.includes('digital_nomad')) return 'Grouped work-friendly stays, cafes and fewer region changes.';
  if (preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') return 'Selected easy movement, safe activities and family-friendly food.';
  if (preferences.travelStyles.includes('adventure')) return 'Built around mountains, active experiences and the road comfort you selected.';
  if (preferences.travelStyles.includes('food_local_life')) return 'Includes local food, markets and neighborhood-level experiences.';
  if (region === 'Osh') return 'Osh route demo using southern culture, food and short city transfers.';
  return 'Balanced around your budget, comfort level and selected experiences.';
}

function buildDay(preferences: TripPreferences, day: number, region: string, used: Set<string>): GeneratedTripDay {
  const stay = chooseStay(preferences, region);
  const transport = chooseTransport(preferences, region, day);
  const food = chooseFood(preferences, region);
  const activities = chooseActivities(preferences, region, used);
  const estimatedCost = stay.pricePerNight + transport.price + food.priceEstimate + activities.reduce((sum, item) => sum + item.price, 0);
  const offlineReady = stay.offlinePaymentSupported || transport.offlineContactAvailable || food.offlineReady || activities.some((activity) => activity.offlineReady);
  return {
    day,
    title: dayTitle(preferences, region, day),
    region,
    reason: dayReason(preferences, region),
    estimatedCost,
    stay,
    transport,
    food,
    activities,
    offlineReady,
    tags: unique([...stay.tags, ...transport.tags, ...food.tags, ...activities.flatMap((activity) => activity.tags)]).slice(0, 8),
  };
}

function dayTitle(preferences: TripPreferences, region: string, day: number) {
  if (day === 1 && ['manas_airport', 'not_sure'].includes(preferences.startPoint)) return 'Arrival and Bishkek soft landing';
  if (preferences.travelStyles.includes('business')) return `${region} with work-friendly timing`;
  if (preferences.travelStyles.includes('adventure')) return `${region} adventure day`;
  if (preferences.travelStyles.includes('family_trip')) return `${region} at a family pace`;
  if (preferences.travelStyles.includes('food_local_life')) return `${region} food and local life`;
  return `${region} route day`;
}

function buildTitle(preferences: TripPreferences, regions: string[]) {
  if (preferences.travelStyles.includes('business')) return 'Business-Friendly Bishkek Trip';
  if (preferences.travelStyles.includes('digital_nomad')) return 'Wi-Fi Friendly Kyrgyzstan Base';
  if (preferences.travelStyles.includes('family_trip')) return 'Calm Family Kyrgyzstan Plan';
  if (preferences.travelStyles.includes('premium_comfort')) return 'Private Comfort Kyrgyzstan Tour';
  if (preferences.travelStyles.includes('adventure') && regions.includes('Song-Kul')) return 'Adventure Route to Karakol and Song-Kul';
  if (preferences.travelStyles.includes('food_local_life')) return 'Food and Local Life Route';
  if (preferences.travelStyles.includes('cultural_discovery')) return 'Culture and Heritage Kyrgyzstan Trip';
  return `${preferences.days} Days in Kyrgyzstan`;
}

function buildWhy(preferences: TripPreferences, dailyPlans: GeneratedTripDay[]) {
  const regions = unique(dailyPlans.map((day) => day.region));
  const avoided: string[] = [];
  if (preferences.budgetTier === 'budget') avoided.push('premium hotels as defaults');
  if (preferences.roadTolerance === 'low') avoided.push('long drives');
  if (preferences.travelStyles.includes('business')) avoided.push('remote yurts and hard trekking');
  if (preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family') avoided.push('nightlife, late activities and hard trekking');
  if (preferences.internetComfort === 'prefer_internet') avoided.push('offline-only remote days');
  const included = dailyPlans.flatMap((day) => [day.stay.name, day.transport.name, day.food.name, ...day.activities.map((activity) => activity.name)]).slice(0, 5);
  return `We built this route for ${prettyList(preferences.travelStyles)} with a ${preferences.budgetTier} budget, ${preferences.stayPreference.replace(/_/g, ' ')} stays and ${preferences.roadTolerance} road tolerance. That is why the plan focuses on ${regions.slice(0, 4).join(', ')}, includes ${included.join(', ')}, and avoids ${unique(avoided).join(', ') || 'options that conflict with your answers'}.`;
}

function finalizeTrip(base: Omit<GeneratedTrip, 'title' | 'summary' | 'totalCost' | 'costPerPerson' | 'regions' | 'whyThisFits'>, preferences: TripPreferences): GeneratedTrip {
  const costPerPerson = Math.round(base.dailyPlans.reduce((sum, day) => sum + day.estimatedCost, 0));
  const totalCost = costPerPerson * preferences.travelerCount;
  const regions = unique(base.dailyPlans.map((day) => day.region));
  return {
    ...base,
    title: buildTitle(preferences, regions),
    summary: `${preferences.days} days from ${PRETTY[preferences.startPoint]} for ${preferences.travelerCount} ${preferences.travelerCount === 1 ? 'traveler' : 'travelers'}, connecting stays, transport, food and activities.`,
    totalCost,
    costPerPerson,
    regions,
    whyThisFits: buildWhy(preferences, base.dailyPlans),
  };
}

export function generateTrip(preferencesInput: TripPreferences, sessionId?: string | null): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const route = regionPlan(preferences);
  const used = new Set<string>();
  const dailyPlans = route.map((region, index) => buildDay(preferences, index + 1, region, used));
  return finalizeTrip(
    {
      id: `trip_${Date.now()}`,
      sessionId,
      status: 'draft',
      days: preferences.days,
      startPoint: preferences.startPoint,
      travelerCount: preferences.travelerCount,
      travelersType: preferences.travelersType,
      travelStyles: preferences.travelStyles,
      budgetTier: preferences.budgetTier,
      dailyPlans,
    },
    preferences
  );
}

function rebuild(trip: GeneratedTrip, preferencesInput: TripPreferences, dailyPlans: GeneratedTripDay[]): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  return finalizeTrip({ ...trip, dailyPlans, budgetTier: preferences.budgetTier, travelStyles: preferences.travelStyles, travelerCount: preferences.travelerCount, travelersType: preferences.travelersType, days: preferences.days, startPoint: preferences.startPoint }, preferences);
}

export function updateStay(trip: GeneratedTrip, dayNumber: number, stayId: string, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const stay = STAYS.find((item) => item.id === stayId);
  if (!stay) return trip;
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const estimatedCost = day.estimatedCost - day.stay.pricePerNight + stay.pricePerNight;
    return { ...day, stay, estimatedCost, offlineReady: day.offlineReady || stay.offlinePaymentSupported, tags: unique([...day.tags, ...stay.tags]).slice(0, 8) };
  }));
}

export function updateTransport(trip: GeneratedTrip, dayNumber: number, transportId: string, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const transport = TRANSPORT_OPTIONS.find((item) => item.id === transportId);
  if (!transport) return trip;
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const estimatedCost = day.estimatedCost - day.transport.price + transport.price;
    return { ...day, transport, estimatedCost, offlineReady: day.offlineReady || transport.offlineContactAvailable, tags: unique([...day.tags, ...transport.tags]).slice(0, 8) };
  }));
}

export function updateFood(trip: GeneratedTrip, dayNumber: number, foodId: string, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const food = FOOD_PLACES.find((item) => item.id === foodId);
  if (!food) return trip;
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const estimatedCost = day.estimatedCost - day.food.priceEstimate + food.priceEstimate;
    return { ...day, food, estimatedCost, offlineReady: day.offlineReady || food.offlineReady, tags: unique([...day.tags, ...food.tags]).slice(0, 8) };
  }));
}

export function updateActivity(trip: GeneratedTrip, dayNumber: number, currentActivityId: string, nextActivityId: string, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const nextActivity = ACTIVITIES.find((item) => item.id === nextActivityId);
  if (!nextActivity) return trip;
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const current = day.activities.find((activity) => activity.id === currentActivityId);
    if (!current) return day;
    const replacement = { ...nextActivity, labels: activityLabels(nextActivity, preferences) };
    const activities = day.activities.map((activity) => (activity.id === currentActivityId ? replacement : activity));
    return { ...day, activities, estimatedCost: day.estimatedCost - current.price + replacement.price, offlineReady: day.offlineReady || replacement.offlineReady, tags: unique([...day.tags, ...replacement.tags]).slice(0, 8) };
  }));
}

export function changeStay(trip: GeneratedTrip, dayNumber: number, preferencesInput: TripPreferences): GeneratedTrip {
  const day = trip.dailyPlans.find((item) => item.day === dayNumber);
  if (!day) return trip;
  const stay = chooseStay(normalizePreferences(preferencesInput), day.region, day.stay.id);
  return updateStay(trip, dayNumber, stay.id, preferencesInput);
}

export function changeTransport(trip: GeneratedTrip, dayNumber: number, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const transport = chooseTransport(preferences, day.region, day.day, day.transport.id);
    return { ...day, transport, estimatedCost: day.estimatedCost - day.transport.price + transport.price, offlineReady: day.offlineReady || transport.offlineContactAvailable, tags: unique([...day.tags, ...transport.tags]).slice(0, 8) };
  }));
}

export function changeFood(trip: GeneratedTrip, dayNumber: number, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const food = chooseFood(preferences, day.region, day.food.id);
    return { ...day, food, estimatedCost: day.estimatedCost - day.food.priceEstimate + food.priceEstimate, offlineReady: day.offlineReady || food.offlineReady, tags: unique([...day.tags, ...food.tags]).slice(0, 8) };
  }));
}

export function replaceActivity(trip: GeneratedTrip, dayNumber: number, activityId: string, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const used = new Set(trip.dailyPlans.flatMap((day) => day.activities.map((activity) => activity.id)).filter((id) => id !== activityId));
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    if (day.day !== dayNumber) return day;
    const current = day.activities.find((activity) => activity.id === activityId);
    if (!current) return day;
    const candidate = rank(
      ACTIVITIES.filter((activity) => activity.id !== activityId && !used.has(activity.id) && activityAllowed(activity, preferences) && (activity.type === current.type || activity.tags.some((tag) => current.tags.includes(tag)))),
      (activity) => scoreActivity(activity, preferences, day.region, used)
    )[0];
    if (!candidate) return day;
    const replacement = { ...candidate, labels: activityLabels(candidate, preferences) };
    const activities = day.activities.map((activity) => (activity.id === activityId ? replacement : activity));
    return { ...day, activities, estimatedCost: day.estimatedCost - current.price + replacement.price, offlineReady: day.offlineReady || replacement.offlineReady, tags: unique([...day.tags, ...replacement.tags]).slice(0, 8) };
  }));
}

export function regenerateDay(trip: GeneratedTrip, dayNumber: number, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const used = new Set(trip.dailyPlans.filter((day) => day.day !== dayNumber).flatMap((day) => day.activities.map((activity) => activity.id)));
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => (day.day === dayNumber ? buildDay(preferences, day.day, day.region, used) : day)));
}

export function makeTripCheaper(trip: GeneratedTrip, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences({ ...preferencesInput, budgetTier: 'budget' });
  let dailyPlans = trip.dailyPlans.map((day) => {
    const stay = chooseStay(preferences, day.region, day.stay.id);
    const transport = chooseTransport(preferences, day.region, day.day, day.transport.id);
    const food = chooseFood(preferences, day.region, day.food.id);
    const used = new Set<string>();
    const activities = chooseActivities(preferences, day.region, used);
    const estimatedCost = stay.pricePerNight + transport.price + food.priceEstimate + activities.reduce((sum, item) => sum + item.price, 0);
    return { ...day, stay, transport, food, activities, estimatedCost, offlineReady: stay.offlinePaymentSupported || transport.offlineContactAvailable || food.offlineReady || activities.some((activity) => activity.offlineReady), tags: unique([...stay.tags, ...transport.tags, ...food.tags, ...activities.flatMap((activity) => activity.tags)]).slice(0, 8) };
  });
  const nextCost = dailyPlans.reduce((sum, day) => sum + day.estimatedCost, 0);
  const currentCost = trip.dailyPlans.reduce((sum, day) => sum + day.estimatedCost, 0);
  if (nextCost >= currentCost) dailyPlans = trip.dailyPlans;
  return rebuild(trip, preferences, dailyPlans);
}

export function makeTripMoreActive(trip: GeneratedTrip, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences(preferencesInput);
  const max = ACTIVITY_MAX[preferences.activityLevel];
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    const used = new Set(day.activities.map((activity) => activity.id));
    const candidate = rank(
      ACTIVITIES.filter((activity) => !used.has(activity.id) && activityAllowed(activity, preferences) && activity.difficulty <= max && hasAny(activity.tags, ['mountain_views', 'light_hiking', 'horse_riding', 'lakes_canyons', 'hot_springs'])),
      (activity) => scoreActivity(activity, preferences, day.region, used)
    )[0];
    if (!candidate) return day;
    const replacement = { ...candidate, labels: activityLabels(candidate, preferences) };
    const activities = [...day.activities];
    const index = activities.findIndex((activity) => activity.difficulty < replacement.difficulty);
    const replaceAt = index >= 0 ? index : activities.length - 1;
    const old = activities[replaceAt];
    activities[replaceAt] = replacement;
    return { ...day, activities, estimatedCost: day.estimatedCost - old.price + replacement.price, offlineReady: day.offlineReady || replacement.offlineReady, tags: unique([...day.tags, ...replacement.tags]).slice(0, 8) };
  }));
}

export function makeTripMoreComfortable(trip: GeneratedTrip, preferencesInput: TripPreferences): GeneratedTrip {
  const preferences = normalizePreferences({ ...preferencesInput, budgetTier: preferencesInput.budgetTier === 'budget' ? 'standard' : preferencesInput.budgetTier, internetComfort: 'prefer_internet', stayPreference: 'hotels_only' });
  return rebuild(trip, preferences, trip.dailyPlans.map((day) => {
    const stay = chooseStay(preferences, day.region, day.stay.id);
    const transport = chooseTransport({ ...preferences, roadTolerance: preferences.roadTolerance === 'high' ? 'medium' : preferences.roadTolerance }, day.region, day.day, day.transport.id);
    const estimatedCost = day.estimatedCost - day.stay.pricePerNight - day.transport.price + stay.pricePerNight + transport.price;
    return { ...day, stay, transport, estimatedCost, offlineReady: day.offlineReady || stay.wifi || transport.qrPayment, tags: unique([...day.tags, ...stay.tags, ...transport.tags]).slice(0, 8) };
  }));
}

export function lockTripDemo(trip: GeneratedTrip): GeneratedTrip {
  return { ...trip, status: 'locked_demo' };
}

export function budgetCap(tier: BudgetTier) {
  return BUDGET_CAP[tier];
}
