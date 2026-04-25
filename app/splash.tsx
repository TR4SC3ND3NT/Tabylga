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
import { strings } from '../lib/strings';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';
import { Button } from '../components/Button';

interface LangOption {
  code: Language;
  label: string;
  native: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English',  native: 'English',    flag: '🇬🇧' },
  { code: 'ru', label: 'Russian',  native: 'Русский',    flag: '🇷🇺' },
  { code: 'ky', label: 'Kyrgyz',   native: 'Кыргызча',  flag: '🇰🇬' },
  { code: 'zh', label: 'Chinese',  native: '中文',        flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic',   native: 'العربية',    flag: '🇸🇦' },
  { code: 'de', label: 'German',   native: 'Deutsch',    flag: '🇩🇪' },
];

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const [selected, setSelected] = useState<Language | null>(null);

  function handleSelect(code: Language) {
    setSelected(code);
    setLanguage(code);
  }

  function handleContinue() {
    if (!selected) return;
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
        {LANGUAGES.map((lang, index) => {
          const isSelected = selected === lang.code;
          const isLast = index === LANGUAGES.length - 1;

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
              <Text style={{ fontSize: 22, lineHeight: 26 }}>{lang.flag}</Text>

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

        {/* Continue button */}
        <Button
          label={strings.splash.continueButton}
          onPress={handleContinue}
          disabled={!selected}
          style={{ marginTop: 16 }}
        />
      </View>
    </View>
  );
}
