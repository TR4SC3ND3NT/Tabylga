import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Briefcase, Camera, Coffee, Compass, Heart, Landmark, Laptop, Moon, Mountain, Plane, ShoppingBag, Tent, Users, Utensils, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { useTripStore } from '../../stores/tripStore';
import type { BudgetTier, ExperienceKey, InternetComfort, PlannerActivityLevel, RoadTolerance, StartPoint, StayPreference, TravelersType, TravelStyle, TripDays } from '../../lib/data/tripPlaces';

const TOTAL_STEPS = 7;

const DAY_OPTIONS: Array<{ value: TripDays; label: string }> = [
  { value: 3, label: '3 days' },
  { value: 5, label: '5 days' },
  { value: 7, label: '7 days' },
  { value: 10, label: '10 days' },
  { value: 14, label: '14+ days' },
];

const START_OPTIONS: Array<{ value: StartPoint; label: string }> = [
  { value: 'manas_airport', label: 'Manas Airport' },
  { value: 'bishkek', label: 'Bishkek' },
  { value: 'osh', label: 'Osh' },
  { value: 'issyk_kul', label: 'Issyk-Kul' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const TRAVELERS: Array<{ value: TravelersType; label: string }> = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'colleagues', label: 'Colleagues' },
];

const STYLE_OPTIONS: Array<{ value: TravelStyle; label: string; desc: string; icon: typeof Mountain }> = [
  { value: 'relax', label: 'Relax & sightseeing', desc: 'Easy days, famous places and free time', icon: Heart },
  { value: 'adventure', label: 'Adventure', desc: 'Mountains, hikes and active days', icon: Mountain },
  { value: 'cultural_discovery', label: 'Cultural discovery', desc: 'History, traditions and local heritage', icon: Landmark },
  { value: 'food_local_life', label: 'Food & local life', desc: 'Cafes, bazaars and national dishes', icon: Utensils },
  { value: 'business', label: 'Business', desc: 'Wi-Fi, short drives and city comfort', icon: Briefcase },
  { value: 'family_trip', label: 'Family trip', desc: 'Safe, calm and flexible schedule', icon: Users },
  { value: 'digital_nomad', label: 'Digital nomad', desc: 'Work-friendly cafes and longer stays', icon: Laptop },
  { value: 'premium_comfort', label: 'Premium comfort', desc: 'Private driver, curated service and better stays', icon: Compass },
];

const BUDGET_OPTIONS: Array<{ value: BudgetTier; label: string }> = [
  { value: 'budget', label: 'Budget $100-300' },
  { value: 'standard', label: 'Standard $300-600' },
  { value: 'comfort', label: 'Comfort $600-1200' },
  { value: 'premium', label: 'Premium $1200+' },
];

const STAY_OPTIONS: Array<{ value: StayPreference; label: string }> = [
  { value: 'hotels_only', label: 'Hotels only' },
  { value: 'guesthouse_ok', label: 'Guesthouses are okay' },
  { value: 'yurt_ok', label: 'Yurt stay is okay' },
  { value: 'remote_basic_ok', label: 'Remote/basic places are okay' },
];

const PACE_OPTIONS = [
  { value: 'relaxed' as const, label: 'Relaxed', desc: '1-2 activities per day, more free time' },
  { value: 'balanced' as const, label: 'Balanced', desc: 'Main sights + enough rest' },
  { value: 'packed' as const, label: 'Packed', desc: 'More places, early starts, active days' },
];

const ACTIVITY_OPTIONS: Array<{ value: PlannerActivityLevel; label: string }> = [
  { value: 'easy', label: 'Easy walking' },
  { value: 'light', label: 'Light hikes' },
  { value: 'moderate', label: 'Moderate hikes' },
  { value: 'hard', label: 'Hard trekking / extreme' },
];

const ROAD_OPTIONS: Array<{ value: RoadTolerance; label: string; desc: string }> = [
  { value: 'low', label: 'Short drives only', desc: 'Stay close to cities' },
  { value: 'medium', label: 'Medium drives are okay', desc: 'Day trips and nearby regions' },
  { value: 'high', label: 'Rough roads are okay', desc: 'Remote lakes, yurts and mountains' },
];

const INTERNET_OPTIONS: Array<{ value: InternetComfort; label: string }> = [
  { value: 'prefer_internet', label: 'Prefer places with internet' },
  { value: 'offline_ok', label: 'Offline mode is okay' },
  { value: 'remote_ok_if_worth_it', label: 'Remote places are fine if it is worth it' },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceKey; label: string; icon: typeof Mountain }> = [
  { value: 'museums_history', label: 'Museums & history', icon: Landmark },
  { value: 'bazaars_local_life', label: 'Bazaars & local life', icon: ShoppingBag },
  { value: 'nomadic_culture', label: 'Nomadic culture', icon: Tent },
  { value: 'local_food', label: 'Local food', icon: Utensils },
  { value: 'mountain_views', label: 'Mountain views', icon: Mountain },
  { value: 'lakes_canyons', label: 'Lakes & canyons', icon: Compass },
  { value: 'horse_riding', label: 'Horse riding', icon: Compass },
  { value: 'hot_springs', label: 'Hot springs', icon: Heart },
  { value: 'shopping_crafts', label: 'Shopping & crafts', icon: ShoppingBag },
  { value: 'photography_spots', label: 'Photography spots', icon: Camera },
  { value: 'nightlife', label: 'Nightlife', icon: Moon },
  { value: 'light_hiking', label: 'Light hiking', icon: Mountain },
];

const REQUIREMENTS = [
  ['halal', 'Halal'],
  ['vegetarian', 'Vegetarian'],
  ['vegan', 'Vegan'],
  ['wheelchair', 'Wheelchair'],
  ['family_friendly', 'Family-friendly'],
  ['no_alcohol', 'No alcohol'],
  ['prayer_friendly', 'Prayer-friendly'],
  ['english_guide', 'English-speaking guide'],
  ['chinese_guide', 'Chinese-speaking guide'],
  ['arabic_guide', 'Arabic-speaking guide'],
  ['none', 'None'],
] as const;

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { preferences, patchPreferences, setTravelersType, setTravelerCount, toggleTravelStyle, toggleExperience, toggleRequirement } = useTripStore();
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  function canAdvance() {
    if (step === 1) return preferences.travelStyles.length > 0;
    if (step === 5) return preferences.experiences.length > 0;
    return true;
  }

  function close() {
    Alert.alert('Leave planner?', 'Your answers are saved on this device.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.replace('/(tabs)') },
    ]);
  }

  function next() {
    if (!canAdvance()) return;
    if (step === TOTAL_STEPS - 1) router.replace('/trip/generating');
    else setStep((current) => current + 1);
  }

  function back() {
    if (step === 0) router.back();
    else setStep((current) => current - 1);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border.divider, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', backgroundColor: colors.brand.primary }} />
          </View>
          <Pressable onPress={close} accessibilityRole="button" style={({ pressed }) => ({ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
            <X size={20} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.text.tertiary, marginTop: 8, textTransform: 'uppercase' }}>
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 126 }}>
        {step === 0 && (
          <View>
            <StepHeader title="Let's build your Kyrgyzstan trip" />
            <SectionTitle label="How many days?" />
            <ChipRow items={DAY_OPTIONS} value={preferences.days} onPress={(value) => patchPreferences({ days: value })} />
            <SectionTitle label="Where do you start?" />
            <ChipRow items={START_OPTIONS} value={preferences.startPoint} onPress={(value) => patchPreferences({ startPoint: value })} />
            <SectionTitle label="Who are you traveling with?" />
            <ChipRow items={TRAVELERS} value={preferences.travelersType} onPress={setTravelersType} />
            {['family', 'friends', 'colleagues'].includes(preferences.travelersType) ? (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text.primary, marginBottom: 10 }}>Traveler count</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[2, 3, 4, 5].map((count) => (
                    <Chip key={count} label={count === 5 ? '5+' : String(count)} selected={preferences.travelerCount === count} onPress={() => setTravelerCount(count)} height={38} fontSize={14} />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}

        {step === 1 && (
          <View>
            <StepHeader title="What kind of trip feels right?" subtitle="Pick one or more." />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {STYLE_OPTIONS.map((option) => (
                <IconCard key={option.value} label={option.label} desc={option.desc} icon={option.icon} selected={preferences.travelStyles.includes(option.value)} onPress={() => toggleTravelStyle(option.value)} />
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <StepHeader title="What should the trip feel like?" />
            <SectionTitle label="Budget per person" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: colors.text.secondary, marginBottom: 12 }}>
              Estimated per person for the full trip. International flights are not included.
            </Text>
            <OptionList items={BUDGET_OPTIONS} value={preferences.budgetTier} onPress={(value) => patchPreferences({ budgetTier: value })} />
            <SectionTitle label="Stay preference" />
            <OptionList items={STAY_OPTIONS} value={preferences.stayPreference} onPress={(value) => patchPreferences({ stayPreference: value })} />
          </View>
        )}

        {step === 3 && (
          <View>
            <StepHeader title="How active should your days be?" />
            <SectionTitle label="Pace" />
            <OptionList items={PACE_OPTIONS} value={preferences.pace} onPress={(value) => patchPreferences({ pace: value })} />
            <SectionTitle label="Activity level" />
            <OptionList items={ACTIVITY_OPTIONS} value={preferences.activityLevel} onPress={(value) => patchPreferences({ activityLevel: value })} />
          </View>
        )}

        {step === 4 && (
          <View>
            <StepHeader title="How far are you ready to go?" />
            <SectionTitle label="Road tolerance" />
            <OptionList items={ROAD_OPTIONS} value={preferences.roadTolerance} onPress={(value) => patchPreferences({ roadTolerance: value })} />
            <SectionTitle label="Internet comfort" />
            <OptionList items={INTERNET_OPTIONS} value={preferences.internetComfort} onPress={(value) => patchPreferences({ internetComfort: value })} />
          </View>
        )}

        {step === 5 && (
          <View>
            <StepHeader title="What would you like to include?" subtitle="Pick specific experiences." />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {EXPERIENCE_OPTIONS.map((option) => (
                <IconCard key={option.value} label={option.label} icon={option.icon} selected={preferences.experiences.includes(option.value)} onPress={() => toggleExperience(option.value)} />
              ))}
            </View>
          </View>
        )}

        {step === 6 && (
          <View>
            <StepHeader title="Any special requirements?" subtitle="Pick all that apply, or skip." />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REQUIREMENTS.map(([value, label]) => (
                <Chip key={value} label={label} selected={preferences.requirements.includes(value)} onPress={() => toggleRequirement(value)} height={40} fontSize={14} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface.primary, borderTopWidth: 1, borderTopColor: colors.border.divider, flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" label="Back" onPress={back} style={{ flex: 1 }} />
        <Button label={step === TOTAL_STEPS - 1 ? 'Generate my trip' : 'Next'} disabled={!canAdvance()} onPress={next} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 33, color: colors.text.primary }}>{title}</Text>
      {subtitle ? <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.text.secondary, marginTop: 6 }}>{subtitle}</Text> : null}
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.text.primary, marginTop: 24, marginBottom: 12 }}>{label}</Text>;
}

function ChipRow<T extends string | number>({ items, value, onPress }: { items: Array<{ value: T; label: string }>; value: T; onPress: (value: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <Chip key={String(item.value)} label={item.label} selected={value === item.value} onPress={() => onPress(item.value)} height={38} fontSize={14} />
      ))}
    </View>
  );
}

function OptionList<T extends string>({ items, value, onPress }: { items: Array<{ value: T; label: string; desc?: string }>; value: T; onPress: (value: T) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => <OptionCard key={item.value} label={item.label} desc={item.desc} selected={value === item.value} onPress={() => onPress(item.value)} />)}
    </View>
  );
}

function OptionCard({ selected, onPress, label, desc }: { selected: boolean; onPress: () => void; label: string; desc?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => ({ borderRadius: 16, padding: 16, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brand.primary : colors.border.divider, backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card, opacity: pressed ? 0.86 : 1 })}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: selected ? colors.brand.primary : colors.text.primary }}>{label}</Text>
      {desc ? <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 4 }}>{desc}</Text> : null}
    </Pressable>
  );
}

function IconCard({ selected, onPress, label, desc, icon: Icon }: { selected: boolean; onPress: () => void; label: string; desc?: string; icon: typeof Mountain }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => ({ width: '48.5%', minHeight: desc ? 132 : 96, borderRadius: 16, padding: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brand.primary : colors.border.divider, backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card, opacity: pressed ? 0.86 : 1 })}>
      <Icon size={23} color={selected ? colors.brand.primary : colors.text.primary} strokeWidth={1.6} />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: selected ? colors.brand.primary : colors.text.primary, marginTop: 10 }}>{label}</Text>
      {desc ? <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 3 }}>{desc}</Text> : null}
    </Pressable>
  );
}
