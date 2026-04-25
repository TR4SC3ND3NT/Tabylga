import { View, Text, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Minus, Plus, Users, UserRound, Bus } from 'lucide-react-native';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useTravelPreferencesStore } from '../stores/travelPreferencesStore';
import { useStrings } from '../lib/i18n';
import { colors } from '../constants/colors';
import { Button } from '../components/Button';
import { KyrgyzBackdrop } from '../components/KyrgyzBackdrop';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
};

function Stepper({ label, value, min, max, onChange, icon: Icon }: StepperProps) {
  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderWidth: 1,
        borderColor: colors.border.divider,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brand.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={colors.brand.primary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.primary }}>
          {label}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
          {min}-{max}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={() => onChange(value - 1)}
          disabled={value <= min}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.brand.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: value <= min ? 0.38 : pressed ? 0.7 : 1,
          })}
        >
          <Minus size={16} color={colors.brand.primary} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ minWidth: 30, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text.primary }}>
          {value}
        </Text>
        <Pressable
          onPress={() => onChange(value + 1)}
          disabled={value >= max}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.brand.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: value >= max ? 0.38 : pressed ? 0.7 : 1,
          })}
        >
          <Plus size={16} color={colors.brand.primary} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const peopleCount = useTravelPreferencesStore((s) => s.peopleCount);
  const preferredTourPeople = useTravelPreferencesStore((s) => s.preferredTourPeople);
  const age = useTravelPreferencesStore((s) => s.age);
  const wantsStrangerMatch = useTravelPreferencesStore((s) => s.wantsStrangerMatch);
  const setPeopleCount = useTravelPreferencesStore((s) => s.setPeopleCount);
  const setPreferredTourPeople = useTravelPreferencesStore((s) => s.setPreferredTourPeople);
  const setAge = useTravelPreferencesStore((s) => s.setAge);
  const setWantsStrangerMatch = useTravelPreferencesStore((s) => s.setWantsStrangerMatch);
  const completePreferences = useOnboardingStore((s) => s.completePreferences);

  async function handleContinue() {
    await completePreferences();
    router.replace('/auth/phone');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <KyrgyzBackdrop height={330} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: Math.max(insets.bottom, 18) }}>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  height: 34,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.82)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.brand.primary }}>
                  Tabylga setup
                </Text>
              </View>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 34, lineHeight: 39, color: colors.text.primary }}>
                {strings.preferences.title}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22, color: colors.text.secondary, marginTop: 8 }}>
                {strings.preferences.subtitle}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <Stepper
                label={strings.preferences.age}
                value={age}
                min={18}
                max={80}
                onChange={setAge}
                icon={UserRound}
              />
              <Stepper
                label={strings.preferences.peopleCount}
                value={peopleCount}
                min={1}
                max={20}
                onChange={setPeopleCount}
                icon={Users}
              />
              <Stepper
                label={strings.preferences.preferredTourPeople}
                value={preferredTourPeople}
                min={2}
                max={30}
                onChange={setPreferredTourPeople}
                icon={Bus}
              />

              <Pressable
                onPress={() => setWantsStrangerMatch(!wantsStrangerMatch)}
                accessibilityRole="switch"
                accessibilityState={{ checked: wantsStrangerMatch }}
                style={({ pressed }) => ({
                  minHeight: 54,
                  borderRadius: 18,
                  backgroundColor: wantsStrangerMatch ? colors.brand.primary : 'rgba(255,255,255,0.94)',
                  borderWidth: 1,
                  borderColor: wantsStrangerMatch ? colors.brand.primary : colors.border.divider,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14, color: wantsStrangerMatch ? '#fff' : colors.text.primary }}>
                  {strings.preferences.strangerMatch}
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: wantsStrangerMatch ? '#fff' : colors.text.tertiary }}>
                  {wantsStrangerMatch ? strings.preferences.enabled : strings.preferences.disabled}
                </Text>
              </Pressable>
            </View>

            <Button label={strings.auth.continueButton} onPress={handleContinue} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
