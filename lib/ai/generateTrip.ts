import {
  DEFAULT_TRIP_PREFERENCES,
  normalizeTravelerCount,
  type BudgetTier,
  type ExperienceKey,
  type PlannerActivityLevel,
  type RequirementKey,
  type TravelersType,
  type TravelStyle,
  type TripDays,
  type TripPreferences,
} from '../data/tripPlaces';
import { generateTrip as generateLocalTrip, type GeneratedTrip } from '../trip/tripGenerator';

export type Itinerary = GeneratedTrip;

export interface GenerateTripInput extends Partial<TripPreferences> {
  purpose?: string | null;
  companions?: TravelersType | null;
  companionCount?: number | null;
  budget?: string | null;
  interests?: string[];
  dietaryNeeds?: string[];
}

function mapDays(value: number | null | undefined): TripDays {
  return value === 3 || value === 5 || value === 7 || value === 10 || value === 14 ? value : DEFAULT_TRIP_PREFERENCES.days;
}

function mapBudget(value: string | null | undefined): BudgetTier {
  if (value === '100-300') return 'budget';
  if (value === '300-600') return 'standard';
  if (value === '600-1200') return 'comfort';
  if (value === '1200+') return 'premium';
  if (value === 'budget' || value === 'standard' || value === 'comfort' || value === 'premium') return value;
  return DEFAULT_TRIP_PREFERENCES.budgetTier;
}

function mapActivity(value: string | null | undefined): PlannerActivityLevel {
  if (value === 'chill') return 'easy';
  if (value === 'active') return 'moderate';
  if (value === 'extreme') return 'hard';
  if (value === 'easy' || value === 'light' || value === 'moderate' || value === 'hard') return value;
  return DEFAULT_TRIP_PREFERENCES.activityLevel;
}

function mapStyle(value: string | null | undefined): TravelStyle | null {
  if (!value) return null;
  if (value === 'culture' || value === 'cultural') return 'cultural_discovery';
  if (value === 'food') return 'food_local_life';
  if (value === 'family') return 'family_trip';
  if (value === 'leisure') return 'relax';
  if (value === 'adventure' || value === 'business' || value === 'digital_nomad') return value;
  return null;
}

function normalizeInput(input: GenerateTripInput): TripPreferences {
  const travelersType = input.travelersType ?? input.companions ?? DEFAULT_TRIP_PREFERENCES.travelersType;
  const legacyStyle = mapStyle(input.purpose);
  return {
    ...DEFAULT_TRIP_PREFERENCES,
    ...input,
    days: mapDays(input.days),
    travelersType,
    travelerCount: normalizeTravelerCount(travelersType, input.travelerCount ?? input.companionCount ?? DEFAULT_TRIP_PREFERENCES.travelerCount),
    travelStyles: (input.travelStyles?.length ? input.travelStyles : legacyStyle ? [legacyStyle] : DEFAULT_TRIP_PREFERENCES.travelStyles) as TravelStyle[],
    budgetTier: mapBudget(input.budgetTier ?? input.budget),
    activityLevel: mapActivity(input.activityLevel),
    experiences: (input.experiences?.length ? input.experiences : input.interests ?? DEFAULT_TRIP_PREFERENCES.experiences) as ExperienceKey[],
    requirements: (input.requirements?.length ? input.requirements : input.dietaryNeeds ?? DEFAULT_TRIP_PREFERENCES.requirements) as RequirementKey[],
  };
}

export async function generateTrip(input: GenerateTripInput): Promise<Itinerary> {
  return generateLocalTrip(normalizeInput(input));
}
