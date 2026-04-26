import {
  getAllActivityOptions,
  type ActivityOption,
} from './activityOptions';
import type { Activity, RequirementKey, RoadTolerance, TravelersType } from './tripPlaces';

const REQUIREMENTS: RequirementKey[] = [
  'halal',
  'vegetarian',
  'vegan',
  'wheelchair',
  'family_friendly',
  'no_alcohol',
  'prayer_friendly',
  'english_guide',
  'chinese_guide',
  'arabic_guide',
  'none',
];

const TRAVELERS: TravelersType[] = ['solo', 'couple', 'family', 'friends', 'colleagues'];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function mapRequirement(value: string): RequirementKey | undefined {
  const normalized = normalize(value).replace('family_trip', 'family_friendly');
  return REQUIREMENTS.includes(normalized as RequirementKey) ? normalized as RequirementKey : undefined;
}

function mapTraveler(value: string): TravelersType | undefined {
  if (value === 'family_trip') return 'family';
  if (value === 'business' || value === 'digital_nomad') return 'colleagues';
  return TRAVELERS.includes(value as TravelersType) ? value as TravelersType : undefined;
}

function mapRoadIntensity(activity: ActivityOption): RoadTolerance {
  if (activity.requiresVerifiedMountainDriver || activity.recommendedTransportType === 'mountain_driver') return 'high';
  if (activity.recommendedTransportType === 'regional_transfer' || activity.recommendedTransportType === 'shared_minivan') return 'medium';
  if (activity.requiresTransport && activity.region !== 'Chuy') return 'medium';
  return 'low';
}

function mapTags(activity: ActivityOption): string[] {
  const tags = activity.tags.map(normalize);
  const mapped = [...tags, normalize(activity.category), normalize(activity.typeLabel)];

  if (activity.category === 'culture') mapped.push('culture', 'cultural_discovery', 'museums_history');
  if (activity.category === 'nature') mapped.push('nature', 'mountain_views', 'photography_spots');
  if (activity.category === 'adventure') mapped.push('adventure', 'mountain_views');
  if (activity.category === 'food_local_life') mapped.push('local_food', 'bazaars_local_life');
  if (activity.category === 'nomadic_culture') mapped.push('nomadic_culture', 'mountain_views');
  if (activity.category === 'wellness') mapped.push('hot_springs', 'relax');
  if (activity.category === 'nightlife') mapped.push('nightlife', 'late_activity');
  if (activity.category === 'digital_nomad') mapped.push('digital_nomad', 'business', 'wifi', 'city');

  for (const tag of tags) {
    if (tag.includes('photo') || tag.includes('sunset') || tag.includes('viewpoint')) mapped.push('photography_spots');
    if (tag.includes('family')) mapped.push('family_friendly');
    if (tag.includes('easy')) mapped.push('easy');
    if (tag.includes('short')) mapped.push('short_drive');
    if (tag.includes('horse')) mapped.push('horse_riding');
    if (tag.includes('hot_springs')) mapped.push('hot_springs');
    if (tag.includes('remote')) mapped.push('remote');
    if (tag.includes('offline')) mapped.push('offline_ready');
    if (tag.includes('lake') || tag.includes('canyon')) mapped.push('lakes_canyons');
    if (tag.includes('mountain') || tag.includes('valley')) mapped.push('mountain_views');
    if (tag.includes('bazaar') || tag.includes('local_life')) mapped.push('bazaars_local_life');
    if (tag.includes('food') || tag.includes('cooking')) mapped.push('local_food');
    if (tag.includes('craft') || tag.includes('shopping')) mapped.push('shopping_crafts');
    if (tag.includes('history') || tag.includes('museum') || tag.includes('petroglyph') || tag.includes('silk')) mapped.push('museums_history', 'cultural_discovery');
  }

  if (activity.offlineReady) mapped.push('offline_ready');
  if (activity.requiresVerifiedMountainDriver) mapped.push('remote', 'mountain_driver_required');
  return unique(mapped);
}

function mapRequirements(activity: ActivityOption): RequirementKey[] {
  const fromData = activity.requirementsSupported
    .map(mapRequirement)
    .filter((item): item is RequirementKey => Boolean(item));
  if (activity.familyFriendly) fromData.push('family_friendly');
  if (activity.guideLanguages.some((language) => language.toLowerCase().includes('english'))) fromData.push('english_guide');
  return unique(fromData.length > 0 ? fromData : ['none']);
}

function mapGoodFor(activity: ActivityOption): TravelersType[] {
  const mapped = activity.goodFor
    .map(mapTraveler)
    .filter((item): item is TravelersType => Boolean(item));
  if (activity.familyFriendly) mapped.push('family');
  if (activity.businessFriendly) mapped.push('colleagues');
  return unique(mapped.length > 0 ? mapped : ['solo']);
}

function mapBadFor(activity: ActivityOption): string[] {
  const values = activity.badFor ?? [];
  if (activity.requiresVerifiedMountainDriver) return unique([...values, 'low_road_tolerance']);
  return values;
}

export function activityOptionToTripActivity(activity: ActivityOption): Activity {
  const roadIntensity = mapRoadIntensity(activity);
  return {
    id: activity.id,
    name: activity.name,
    city: activity.city,
    region: activity.region,
    type: normalize(activity.typeLabel || activity.category),
    price: activity.price,
    durationHours: activity.durationHours,
    difficulty: activity.difficulty,
    tags: mapTags(activity),
    goodFor: mapGoodFor(activity),
    badFor: mapBadFor(activity),
    requirementsSupported: mapRequirements(activity),
    roadIntensity,
    internetAvailable: roadIntensity !== 'high' && !activity.requiresVerifiedMountainDriver,
    offlineReady: activity.offlineReady,
    description: activity.description,
  };
}

export const ACTIVITIES: Activity[] = getAllActivityOptions().map(activityOptionToTripActivity);
