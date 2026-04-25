import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';

function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startPhoneAuth, loading, error } = useAuthStore();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Floating label animation
  const labelAnim = useRef(new Animated.Value(0)).current;
  const isRaised = isFocused || phoneDigits.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isRaised ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isRaised]);

  const labelTop    = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, -9] });
  const labelFontSz = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 12] });
  const labelColor  = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text.tertiary, colors.brand.primary],
  });

  const canSubmit = phoneDigits.replace(/\D/g, '').length >= 9 && !loading;

  async function handleContinue() {
    if (!canSubmit) return;
    const fullPhone = `+996${phoneDigits.replace(/\D/g, '')}`;
    await startPhoneAuth(fullPhone);
    router.push('/auth/otp');
  }

  function handleChangeText(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(digits);
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-surface-primary"
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View className="px-3 pt-2">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel={strings.common.back}
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
            </Pressable>
          </View>

          <View className="px-5 pt-3">
            {/* H1 */}
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 28,
                lineHeight: 33.6,
                letterSpacing: -0.005 * 28,
                color: colors.text.primary,
                marginBottom: 10,
              }}
            >
              {strings.auth.phoneTitle}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                lineHeight: 22.5,
                color: colors.text.secondary,
                marginBottom: 28,
              }}
            >
              {strings.auth.phoneSubtitle}
            </Text>

            {/* Phone input row */}
            <View className="flex-row items-stretch" style={{ gap: 10 }}>
              {/* Country pill */}
              <View
                style={{
                  height: 56,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border.input,
                  backgroundColor: colors.surface.card,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 20, lineHeight: 24 }}>🇰🇬</Text>
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 15,
                    color: colors.text.primary,
                  }}
                >
                  +996
                </Text>
                <ChevronDown size={16} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>

              {/* Floating-label text input */}
              <Pressable
                onPress={() => inputRef.current?.focus()}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: isFocused ? 1.5 : 1,
                  borderColor: isFocused ? colors.border.inputFocused : colors.border.input,
                  backgroundColor: colors.surface.card,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
              >
                {/* Floating label */}
                <Animated.Text
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: labelTop,
                    fontSize: labelFontSz,
                    color: labelColor,
                    fontFamily: 'Inter_400Regular',
                    backgroundColor: colors.surface.card,
                    paddingHorizontal: 4,
                  }}
                  pointerEvents="none"
                >
                  {strings.auth.phonePlaceholder}
                </Animated.Text>

                <TextInput
                  ref={inputRef}
                  value={formatPhoneDisplay(phoneDigits)}
                  onChangeText={handleChangeText}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmitEditing={handleContinue}
                  accessibilityLabel={strings.auth.phonePlaceholder}
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 16,
                    letterSpacing: 0.02 * 16,
                    color: colors.text.primary,
                    paddingTop: phoneDigits.length > 0 ? 8 : 0,
                  }}
                />
              </Pressable>
            </View>

            {/* Error / helper */}
            {error ? (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  lineHeight: 18.2,
                  color: colors.status.error,
                  marginTop: 8,
                  marginHorizontal: 2,
                }}
              >
                {error}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  lineHeight: 18.2,
                  color: colors.text.secondary,
                  marginTop: 10,
                  marginHorizontal: 2,
                }}
              >
                {strings.auth.phoneHelper}
              </Text>
            )}

            {/* Continue CTA */}
            <View style={{ marginTop: 28 }}>
              {loading ? (
                <View style={{ height: 56, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={colors.brand.primary} size="small" />
                </View>
              ) : (
                <Button
                  label={strings.auth.continueButton}
                  disabled={!canSubmit}
                  onPress={handleContinue}
                />
              )}
            </View>

            {/* Divider */}
            <View
              className="flex-row items-center"
              style={{ gap: 14, marginVertical: 28 }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.divider }} />
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 12,
                  color: colors.text.tertiary,
                  letterSpacing: 0.12 * 12,
                  textTransform: 'uppercase',
                }}
              >
                {strings.auth.orDivider}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.divider }} />
            </View>

            {/* Google */}
            <Pressable
              accessibilityLabel={strings.auth.continueGoogle}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 52,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.brand.primary,
                backgroundColor: colors.surface.card,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 3,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#E8E8E3',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#4285F4' }}>
                  G
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 15,
                  color: colors.brand.primary,
                }}
              >
                {strings.auth.continueGoogle}
              </Text>
            </Pressable>

            {/* Apple */}
            <Pressable
              accessibilityLabel={strings.auth.continueApple}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.surface.inverse,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 18, color: '#fff' }}>
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 15,
                  color: '#fff',
                }}
              >
                {strings.auth.continueApple}
              </Text>
            </Pressable>

            {/* Legal */}
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                lineHeight: 18,
                color: colors.text.tertiary,
                textAlign: 'center',
                marginTop: 28,
                marginBottom: Math.max(insets.bottom, 16),
              }}
            >
              {strings.auth.terms}{' '}
              <Text
                style={{ color: colors.brand.primary, fontFamily: 'Inter_500Medium' }}
              >
                {strings.auth.termsLink}
              </Text>{' '}
              {strings.auth.and}{' '}
              <Text
                style={{ color: colors.brand.primary, fontFamily: 'Inter_500Medium' }}
              >
                {strings.auth.privacyLink}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
