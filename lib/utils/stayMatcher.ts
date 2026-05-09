import type { Stay, TripPreferences } from '../data/tripPlaces';
import type { GeneratedTripDay } from '../trip/tripGenerator';

export interface StayMatch {
  stay: Stay;
  score: number;
  reasons: string[];
}

function regionMatches(stay: Stay, region: string) {
  return stay.region === region
    || (region === 'Cholpon-Ata' && stay.region === 'Issyk-Kul')
    || (region === 'Jeti-Oguz' && stay.region === 'Karakol')
    || (region === 'Issyk-Kul' && stay.region === 'Karakol')
    || (region === 'Naryn' && stay.region === 'Song-Kul');
}

function addReason(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function getBestStaysForTripDay({
  day,
  preferences,
  stays,
}: {
  day: GeneratedTripDay;
  preferences: TripPreferences;
  stays: Stay[];
}): StayMatch[] {
  return stays
    .map((stay) => {
      const reasons: string[] = [];
      let score = 0;

      if (regionMatches(stay, day.region)) {
        score += 55;
        addReason(reasons, `Matches ${day.region}`);
      }

      if (day.region === 'Bishkek' && stay.region === 'Bishkek') score += 24;
      if (['Issyk-Kul', 'Cholpon-Ata', 'Karakol', 'Jeti-Oguz'].includes(day.region) && ['Issyk-Kul', 'Karakol'].includes(stay.region)) score += 24;
      if (['Song-Kul', 'Naryn'].includes(day.region)) {
        if (stay.type === 'yurt' || stay.offlinePaymentSupported) {
          score += 42;
          addReason(reasons, 'Offline payment supported');
        }
        if (stay.region === 'Song-Kul') score += 24;
      }

      if (stay.tier === preferences.budgetTier) {
        score += 26;
        addReason(reasons, 'Fits your budget');
      }

      if (preferences.budgetTier === 'budget') {
        if (['hostel', 'guesthouse', 'yurt'].includes(stay.type) && stay.tier !== 'premium') score += 32;
        if (stay.tier === 'premium' || stay.pricePerNight > 90) score -= 90;
      }

      if (preferences.budgetTier === 'standard') {
        if (['hotel', 'guesthouse', 'yurt'].includes(stay.type) && ['budget', 'standard'].includes(stay.tier)) score += 22;
      }

      if (preferences.budgetTier === 'comfort') {
        if (['hotel', 'guesthouse'].includes(stay.type) && ['standard', 'comfort'].includes(stay.tier)) score += 22;
      }

      if (preferences.budgetTier === 'premium') {
        if (stay.tier === 'premium' || (stay.type === 'hotel' && stay.pricePerNight >= 90)) score += 34;
      }

      if (preferences.stayPreference === 'hotels_only') {
        if (stay.type === 'hotel') score += 34;
        else score -= 80;
      }

      if (preferences.stayPreference === 'guesthouse_ok' && stay.type !== 'yurt') score += 16;
      if (preferences.stayPreference === 'yurt_ok' && ['hotel', 'guesthouse', 'yurt'].includes(stay.type)) score += 10;
      if (preferences.stayPreference !== 'remote_basic_ok' && stay.remote) score -= 42;

      if (preferences.travelStyles.includes('business')) {
        if (stay.city === 'Bishkek' && stay.wifi && stay.businessFriendly && stay.type === 'hotel' && !stay.remote) {
          score += 70;
          addReason(reasons, 'Wi-Fi and city comfort');
        } else {
          score -= 70;
        }
        if (stay.paymentOptions.includes('qr') || stay.qrPayment) score += 14;
      }

      if (preferences.travelStyles.includes('digital_nomad')) {
        if (stay.wifi && (!stay.remote || ['Bishkek', 'Karakol', 'Issyk-Kul', 'Osh'].includes(stay.region))) {
          score += 38;
          addReason(reasons, 'Wi-Fi and city comfort');
        }
        if (stay.tags.some((tag) => ['business', 'wifi', 'city_center', 'shared_kitchen'].includes(tag))) score += 10;
        if (!stay.wifi && stay.remote) score -= 55;
      }

      if (preferences.travelStyles.includes('adventure')) {
        if (['yurt', 'guesthouse'].includes(stay.type)) {
          score += 30;
          addReason(reasons, 'Good for adventure route');
        }
        if (['Song-Kul', 'Karakol', 'Issyk-Kul'].includes(stay.region)) score += 18;
        if (stay.remote && preferences.stayPreference !== 'remote_basic_ok' && preferences.roadTolerance !== 'high') score -= 45;
      }

      if (preferences.travelStyles.includes('family_trip') || preferences.travelersType === 'family' || preferences.requirements.includes('family_friendly')) {
        if (stay.familyFriendly) {
          score += 45;
          addReason(reasons, 'Family-friendly');
        } else {
          score -= 60;
        }
      }

      if (preferences.internetComfort === 'prefer_internet') {
        if (stay.wifi) {
          score += 24;
          addReason(reasons, 'Wi-Fi and city comfort');
        } else if (stay.remote) {
          score -= 65;
        }
      }

      if (preferences.internetComfort !== 'prefer_internet' && stay.offlinePaymentSupported) {
        score += 16;
        addReason(reasons, 'Offline payment supported');
      }

      if (preferences.requirements.includes('wheelchair') && (stay.remote || stay.type === 'yurt')) score -= 100;
      if (stay.remote && stay.type === 'yurt' && preferences.stayPreference !== 'remote_basic_ok' && preferences.stayPreference !== 'yurt_ok') score -= 80;
      if (stay.offlinePaymentSupported) addReason(reasons, 'Offline payment supported');
      if (reasons.length === 0) addReason(reasons, 'Best matches for your route');

      score += stay.rating * 4;
      score += Math.min(stay.reviewCount / 30, 10);

      return { stay, score, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score);
}

export function getStayMatchReasons(stay: Stay, day: GeneratedTripDay | null, preferences: TripPreferences) {
  if (!day) {
    const reasons = [];
    if (stay.wifi) reasons.push('Wi-Fi and city comfort');
    if (stay.offlinePaymentSupported) reasons.push('Offline payment supported');
    if (stay.familyFriendly) reasons.push('Family-friendly');
    return reasons.length ? reasons : ['Reliable stay'];
  }
  return getBestStaysForTripDay({ day, preferences, stays: [stay] })[0]?.reasons ?? ['Best matches for your route'];
}
