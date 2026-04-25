import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight, Check } from 'lucide-react-native';
import { useAuthStore, type Language } from '../stores/authStore';
import { useTravelPreferencesStore } from '../stores/travelPreferencesStore';
import { LANGUAGE_OPTIONS } from '../lib/strings';
import { useStrings } from '../lib/i18n';
import { ESIM_PLANS } from '../lib/backend/demoBackend';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';
import { Button } from '../components/Button';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const esimChoice = useTravelPreferencesStore((s) => s.esimChoice);
  const setEsimChoice = useTravelPreferencesStore((s) => s.setEsimChoice);
  const [selected, setSelected] = useState<Language>(language);

  function handleSelect(code: Language) {
    setSelected(code);
    setLanguage(code);
  }

  function handleContinue() {
    router.replace('/welcome');
  }

  return (
    <View className="flex-1 bg-surface-inverse">
      <StatusBar style="light" />

      {/* ── Dark background with subtle warm tint at bottom ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45%',
          backgroundColor: '#2A3A4A',
          opacity: 0.6,
        }}
      />

      {/* ── Wordmark block ── */}
      <View
        style={{ position: 'absolute', top: (insets.top || 0) + 100, left: 0, right: 0 }}
        className="items-center px-5"
      >
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 40,
            lineHeight: 44,
            letterSpacing: -0.02 * 40,
            color: '#fff',
          }}
        >
          {strings.splash.wordmark}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            lineHeight: 22.4,
            color: 'rgba(255,255,255,0.92)',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          {strings.splash.tagline}
        </Text>
        <View className="flex-row items-center mt-3.5" style={{ gap: 8 }}>
          <View style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' }} />
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              letterSpacing: 0.14 * 11,
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
            }}
          >
            {strings.splash.taglineSub}
          </Text>
          <View style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' }} />
        </View>
      </View>

      {/* ── Bottom sheet ── */}
      <View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
          shadows.modal,
        ]}
      >
        {/* Handle */}
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: colors.border.divider,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 18,
          }}
        />

        {/* Title */}
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 18,
            lineHeight: 25.2,
            color: colors.text.primary,
            marginBottom: 14,
          }}
        >
          {strings.splash.languageSheetTitle}
        </Text>

        {/* Language rows */}
        {LANGUAGE_OPTIONS.map((lang, index) => {
          const isSelected = selected === lang.code;
          const isLast = index === LANGUAGE_OPTIONS.length - 1;

          return (
            <Pressable
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              accessibilityLabel={`Select language: ${lang.label}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border.divider,
                },
                isSelected && { backgroundColor: colors.brand.primaryLight, marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 8 },
              ]}
            >
              {/* Flag */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, color: colors.text.secondary, width: 28 }}>
                {lang.flag}
              </Text>

              {/* Labels */}
              <View className="flex-1">
                <Text
                  style={{
                    fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                    fontSize: 15,
                    lineHeight: 18,
                    color: isSelected ? colors.brand.primary : colors.text.primary,
                  }}
                >
                  {lang.label}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    lineHeight: 14.4,
                    color: colors.text.secondary,
                    marginTop: 1,
                  }}
                >
                  {lang.native}
                </Text>
              </View>

              {/* Selection indicator */}
              {isSelected ? (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.brand.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="#fff" strokeWidth={2.5} />
                </View>
              ) : (
                <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.5} />
              )}
            </Pressable>
          );
        })}

        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border.divider }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.text.primary }}>
            {strings.esim.title}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary, marginTop: 3, marginBottom: 10 }}>
            {strings.esim.subtitle}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ESIM_PLANS.map((plan) => {
              const selectedPlan = esimChoice === plan.id.replace('esim_7_5', 'starter').replace('esim_14_15', 'traveler').replace('esim_30_30', 'nomad');
              const choice = plan.id === 'esim_7_5' ? 'starter' : plan.id === 'esim_14_15' ? 'traveler' : 'nomad';
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setEsimChoice(choice)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedPlan }}
                  style={({ pressed }) => ({
                    width: 132,
                    borderRadius: 12,
                    borderWidth: selectedPlan ? 2 : 1,
                    borderColor: selectedPlan ? colors.brand.primary : colors.border.divider,
                    backgroundColor: selectedPlan ? colors.brand.primaryLight : colors.surface.card,
                    padding: 10,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  {plan.recommended && (
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.brand.cta, marginBottom: 4 }}>
                      {strings.esim.recommended}
                    </Text>
                  )}
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text.primary }}>{plan.title}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.text.secondary, marginTop: 3 }}>
                    {strings.esim.data.replace('{count}', String(plan.dataGb))} · {strings.esim.days.replace('{count}', String(plan.durationDays))}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.brand.primary, marginTop: 6 }}>${plan.priceUsd}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={() => setEsimChoice('later')}
              style={({ pressed }) => ({
                flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                backgroundColor: esimChoice === 'later' ? colors.brand.primaryLight : colors.surface.card,
                borderWidth: 1, borderColor: colors.border.divider,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.primary }}>{strings.esim.later}</Text>
            </Pressable>
            <Pressable
              onPress={() => setEsimChoice('skip')}
              style={({ pressed }) => ({
                flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                backgroundColor: esimChoice === 'skip' ? colors.brand.primaryLight : colors.surface.card,
                borderWidth: 1, borderColor: colors.border.divider,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.primary }}>{strings.esim.skip}</Text>
            </Pressable>
          </View>
        </View>

        {/* Continue button */}
        <Button
          label={strings.splash.continueButton}
          onPress={handleContinue}
          style={{ marginTop: 16 }}
        />
      </View>
    </View>
  );
}
