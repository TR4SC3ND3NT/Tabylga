import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Button } from '../../components/Button';

const OTP_RESEND_SECONDS = 58;

function maskPhone(phone: string | null): string {
  if (!phone) return '';
  // +996 5XX XXX XX XX → +996 5•• ••• •• XX
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ••• •• ${digits.slice(-2)}`;
  }
  return phone;
}

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const { verifyOtp, loading, error, _pendingPhone } = useAuthStore();

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function handleResend() {
    if (!canResend) return;
    setCountdown(OTP_RESEND_SECONDS);
    setCanResend(false);
    setCode('');
  }

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  async function handleVerify(codeToVerify = code) {
    if (codeToVerify.length < 6 || loading) return;
    await verifyOtp(codeToVerify);
    // Read fresh store state directly — no hook call, safe inside async function
    const { isAuthenticated, error: freshError } = useAuthStore.getState();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else if (freshError) {
      triggerShake();
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleChangeText(text: string) {
    const filtered = text.replace(/\D/g, '').slice(0, 6);
    setCode(filtered);
    if (filtered.length === 6) {
      handleVerify(filtered);
    }
  }

  const digits = code.split('').concat(Array(6 - code.length).fill(''));
  const canSubmit = code.length === 6 && !loading;

  const countdownLabel =
    `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
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
          {/* Back */}
          <View className="px-3 pt-2">
            <Pressable
              onPress={() => goBackOrReplace(router, '/auth/phone')}
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
              {strings.auth.otpTitle}
            </Text>

            {/* Subtitle with masked phone */}
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                lineHeight: 22.5,
                color: colors.text.secondary,
                marginBottom: 32,
              }}
            >
              {strings.auth.otpSubtitle}{' '}
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  color: colors.text.primary,
                }}
              >
                {maskPhone(_pendingPhone)}
              </Text>
            </Text>

            {/* OTP boxes */}
            <Pressable onPress={() => inputRef.current?.focus()}>
              <Animated.View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  transform: [{ translateX: shakeAnim }],
                }}
              >
                {digits.map((digit, index) => {
                  const isActive = index === code.length && code.length < 6;
                  const isFilled = digit !== '';
                  const hasError = !!error && code.length === 0;

                  return (
                    <View
                      key={index}
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 12,
                        borderWidth: isActive ? 1.5 : 1,
                        borderColor: hasError
                          ? colors.status.error
                          : isActive
                          ? colors.border.inputFocused
                          : colors.border.input,
                        backgroundColor: colors.surface.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isActive && !isFilled ? (
                        // Blinking caret
                        <BlinkingCaret />
                      ) : (
                        <Text
                          style={{
                            fontFamily: 'Inter_600SemiBold',
                            fontSize: 22,
                            lineHeight: 26.4,
                            color: colors.text.primary,
                          }}
                        >
                          {digit}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </Animated.View>

              {/* Hidden real input */}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleChangeText}
                keyboardType="number-pad"
                maxLength={6}
                caretHidden
                accessibilityLabel={strings.auth.otpCodeLabel}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 1,
                  height: 1,
                  top: 0,
                  left: 0,
                }}
              />
            </Pressable>

            {/* Error text */}
            {error && code.length === 0 && (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.status.error,
                  marginTop: 10,
                }}
              >
                {error}
              </Text>
            )}

            {/* Resend row */}
            <View
              className="flex-row items-center"
              style={{ marginTop: 18, gap: 6 }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: colors.text.secondary,
                }}
              >
                {strings.auth.otpResend}
              </Text>
              <Pressable
                onPress={handleResend}
                disabled={!canResend}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 13,
                    color: canResend ? colors.brand.primary : colors.text.tertiary,
                  }}
                >
                  {canResend
                    ? strings.auth.otpResendNow
                    : `${strings.auth.otpResendTimer} ${countdownLabel}`}
                </Text>
              </Pressable>
            </View>

            {/* Verify CTA */}
            <Button
              label={strings.auth.otpVerify}
              onPress={() => handleVerify()}
              disabled={!canSubmit}
              style={{ marginTop: 32 }}
            />

            {/* Change number */}
            <Button
              variant="ghost"
              label={strings.auth.otpChangeNumber}
              onPress={() => goBackOrReplace(router, '/auth/phone')}
              style={{ marginTop: 4, height: 52 }}
            />

            {/* Auto-fill hint card */}
            <View
              style={{
                marginTop: 28,
                marginBottom: Math.max(insets.bottom, 16),
                padding: 14,
                backgroundColor: colors.brand.primaryLight,
                borderRadius: 12,
                flexDirection: 'row',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.surface.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={16} color={colors.brand.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                    lineHeight: 16.9,
                    color: colors.text.primary,
                  }}
                >
                  {strings.auth.otpAutoFillTitle}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    lineHeight: 16.8,
                    color: colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {strings.auth.otpAutoFillBody}
                </Text>
              </View>
            </View>

            {/* Demo hint */}
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: colors.text.tertiary,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {strings.auth.demoHint}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Blinking cursor component
function BlinkingCaret() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: 2,
        height: 22,
        backgroundColor: colors.brand.primary,
        borderRadius: 1,
        opacity,
      }}
    />
  );
}
