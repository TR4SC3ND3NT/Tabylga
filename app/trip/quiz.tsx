import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  X, Sun, Mountain, Zap, Cloud,
  TreePine, Landmark, Utensils, Camera, ShoppingBag, Moon,
} from 'lucide-react-native';
import { useTripStore, type Interest, type Dietary, type ActivityLevel, type BudgetRange } from '../../stores/tripStore';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';

const TOTAL_STEPS = 5;

function getDayOptions(strings: ReturnType<typeof useStrings>) {
  return [
  { value: 3,  label: strings.planner.days3 },
  { value: 5,  label: strings.planner.days5 },
  { value: 7,  label: strings.planner.days7 },
  { value: 10, label: strings.planner.days10 },
  { value: 14, label: strings.planner.days14 },
  ];
}

function getBudgetOptions(strings: ReturnType<typeof useStrings>): { value: BudgetRange; label: string }[] {
  return [
  { value: '100-300',  label: strings.planner.budget100 },
  { value: '300-600',  label: strings.planner.budget300 },
  { value: '600-1200', label: strings.planner.budget600 },
  { value: '1200+',    label: strings.planner.budget1200 },
  ];
}

function getActivityOptions(strings: ReturnType<typeof useStrings>): { value: ActivityLevel; label: string; desc: string; icon: any }[] {
  return [
  { value: 'chill',    label: strings.planner.activityChill,    desc: strings.planner.activityChillDesc,    icon: Sun },
  { value: 'moderate', label: strings.planner.activityModerate, desc: strings.planner.activityModerateDesc, icon: Cloud },
  { value: 'active',   label: strings.planner.activityActive,   desc: strings.planner.activityActiveDesc,   icon: Mountain },
  { value: 'extreme',  label: strings.planner.activityExtreme,  desc: strings.planner.activityExtremeDesc,  icon: Zap },
  ];
}

function getInterestOptions(strings: ReturnType<typeof useStrings>): { value: Interest; label: string; icon: any }[] {
  return [
  { value: 'nature',         label: strings.planner.interestNature,    icon: TreePine },
  { value: 'culture',        label: strings.planner.interestCulture,   icon: Landmark },
  { value: 'food',           label: strings.planner.interestFood,      icon: Utensils },
  { value: 'extreme_sports', label: strings.planner.interestExtreme,   icon: Mountain },
  { value: 'photography',    label: strings.planner.interestPhoto,     icon: Camera },
  { value: 'shopping',       label: strings.planner.interestShopping,  icon: ShoppingBag },
  { value: 'wellness',       label: strings.planner.interestWellness,  icon: Sun },
  { value: 'nightlife',      label: strings.planner.interestNightlife, icon: Moon },
  ];
}

function getDietaryOptions(strings: ReturnType<typeof useStrings>): { value: Dietary; label: string }[] {
  return [
  { value: 'vegetarian',     label: strings.planner.dietaryVegetarian },
  { value: 'halal',          label: strings.planner.dietaryHalal },
  { value: 'vegan',          label: strings.planner.dietaryVegan },
  { value: 'wheelchair',     label: strings.planner.dietaryWheelchair },
  { value: 'family_friendly', label: strings.planner.dietaryFamily },
  { value: 'none',           label: strings.planner.dietaryNone },
  ];
}

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const [step, setStep] = useState(0);
  const {
    days, budget, activityLevel, interests, dietaryNeeds,
    setQuizAnswer, toggleInterest, toggleDietary,
  } = useTripStore();

  function handleClose() {
    Alert.alert(
      strings.planner.discardTitle,
      strings.planner.discardMessage,
      [
        { text: strings.planner.discardCancel, style: 'cancel' },
        { text: strings.planner.discardConfirm, style: 'destructive', onPress: () => router.replace('/(tabs)') },
      ]
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return days != null;
    if (step === 1) return budget != null;
    if (step === 2) return activityLevel != null;
    if (step === 3) return interests.length > 0;
    if (step === 4) return true; // dietary optional
    return false;
  }

  function handleNext() {
    if (!canAdvance()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      router.replace('/trip/generating');
    }
  }

  function handleBack() {
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Header: progress + close */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Progress bar */}
          <View
            style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: colors.border.divider, overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${progress}%`, height: '100%',
                backgroundColor: colors.brand.primary,
              }}
            />
          </View>
          <Pressable
            onPress={handleClose}
            accessibilityLabel={strings.common.close}
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <X size={20} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
        </View>
        <Text
          style={{
            fontFamily: 'Inter_500Medium', fontSize: 12,
            color: colors.text.tertiary, marginTop: 8,
            letterSpacing: 0.12 * 12, textTransform: 'uppercase',
          }}
        >
          {strings.planner.progressLabel.replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && <DaysStep value={days} onChange={(v) => setQuizAnswer('days', v)} />}
        {step === 1 && <BudgetStep value={budget} onChange={(v) => setQuizAnswer('budget', v)} />}
        {step === 2 && <ActivityStep value={activityLevel} onChange={(v) => setQuizAnswer('activityLevel', v)} />}
        {step === 3 && <InterestsStep selected={interests} onToggle={toggleInterest} />}
        {step === 4 && <DietaryStep selected={dietaryNeeds} onToggle={toggleDietary} />}
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1, borderTopColor: colors.border.divider,
          flexDirection: 'row', gap: 10,
        }}
      >
        <Button
          variant="secondary"
          label={strings.planner.backButton}
          onPress={handleBack}
          style={{ flex: 1 }}
        />

        <Button
          label={isLast ? strings.planner.generateButton : strings.planner.nextButton}
          disabled={!canAdvance()}
          onPress={handleNext}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Step components ─────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 28.8,
          letterSpacing: -0.005 * 24, color: colors.text.primary,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22.5,
            color: colors.text.secondary, marginTop: 6,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function OptionCard({
  selected, onPress, label, desc, large,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  desc?: string;
  large?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        borderRadius: 16, padding: 16,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.brand.primary : colors.border.divider,
        backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
        marginBottom: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: large ? 17 : 15,
          color: selected ? colors.brand.primary : colors.text.primary,
        }}
      >
        {label}
      </Text>
      {desc && (
        <Text
          style={{
            fontFamily: 'Inter_400Regular', fontSize: 13,
            color: colors.text.secondary, marginTop: 4,
          }}
        >
          {desc}
        </Text>
      )}
    </Pressable>
  );
}

function DaysStep({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  const strings = useStrings();
  const dayOptions = getDayOptions(strings);

  return (
    <View>
      <StepHeader title={strings.planner.stepDurationQuestion} />
      {dayOptions.map((o) => (
        <OptionCard key={o.value} selected={value === o.value} onPress={() => onChange(o.value)} label={o.label} large />
      ))}
    </View>
  );
}

function BudgetStep({ value, onChange }: { value: BudgetRange | null; onChange: (b: BudgetRange) => void }) {
  const strings = useStrings();
  const budgetOptions = getBudgetOptions(strings);

  return (
    <View>
      <StepHeader title={strings.planner.stepBudgetQuestion} />
      {budgetOptions.map((o) => (
        <OptionCard key={o.value} selected={value === o.value} onPress={() => onChange(o.value)} label={o.label} large />
      ))}
    </View>
  );
}

function ActivityStep({ value, onChange }: { value: ActivityLevel | null; onChange: (a: ActivityLevel) => void }) {
  const strings = useStrings();
  const activityOptions = getActivityOptions(strings);

  return (
    <View>
      <StepHeader title={strings.planner.stepActivityQuestion} />
      {activityOptions.map((o) => {
        const Icon = o.icon;
        const isSelected = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityLabel={o.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => ({
              borderRadius: 16, padding: 16, marginBottom: 10,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? colors.brand.primary : colors.border.divider,
              backgroundColor: isSelected ? colors.brand.primaryLight : colors.surface.card,
              flexDirection: 'row', alignItems: 'center', gap: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: isSelected ? '#fff' : colors.brand.primaryLight,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={22} color={colors.brand.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: isSelected ? colors.brand.primary : colors.text.primary }}>
                {o.label}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>
                {o.desc}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function InterestsStep({ selected, onToggle }: { selected: Interest[]; onToggle: (i: Interest) => void }) {
  const strings = useStrings();
  const interestOptions = getInterestOptions(strings);

  return (
    <View>
      <StepHeader title={strings.planner.stepInterestsQuestion} subtitle={strings.planner.stepInterestsSubtitle} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {interestOptions.map((o) => {
          const Icon = o.icon;
          const isSelected = selected.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => onToggle(o.value)}
              accessibilityLabel={o.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => ({
                width: '48.5%', borderRadius: 14, padding: 14,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.brand.primary : colors.border.divider,
                backgroundColor: isSelected ? colors.brand.primaryLight : colors.surface.card,
                flexDirection: 'row', alignItems: 'center', gap: 10,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon size={20} color={isSelected ? colors.brand.primary : colors.text.primary} strokeWidth={1.5} />
              <Text
                style={{
                  fontFamily: 'Inter_500Medium', fontSize: 14,
                  color: isSelected ? colors.brand.primary : colors.text.primary,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DietaryStep({ selected, onToggle }: { selected: Dietary[]; onToggle: (d: Dietary) => void }) {
  const strings = useStrings();
  const dietaryOptions = getDietaryOptions(strings);

  return (
    <View>
      <StepHeader title={strings.planner.stepDietaryQuestion} subtitle={strings.planner.stepDietarySubtitle} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {dietaryOptions.map((o) => {
          const isSelected = selected.includes(o.value);
          return (
            <Chip
              key={o.value}
              label={o.label}
              selected={selected.includes(o.value)}
              onPress={() => onToggle(o.value)}
              height={40}
              fontSize={14}
            />
          );
        })}
      </View>
    </View>
  );
}
