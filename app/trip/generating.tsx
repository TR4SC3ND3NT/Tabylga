import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Sparkles, AlertTriangle } from 'lucide-react-native';
import { useTripStore } from '../../stores/tripStore';
import { useStrings } from '../../lib/i18n';
import { colors } from '../../constants/colors';

export default function GeneratingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const { generateTrip, isGenerating, error, generatedItinerary, resetTrip } = useTripStore();
  const statusMessages = [
    strings.planner.genStep1,
    strings.planner.genStep2,
    strings.planner.genStep3,
    strings.planner.genStep4,
    strings.planner.genStep5,
  ];

  const [statusIndex, setStatusIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Trigger Gemini once
  useEffect(() => {
    generateTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle status messages while generating
  useEffect(() => {
    if (!isGenerating) return;
    const t = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, statusMessages.length - 2));
    }, 2000);
    return () => clearInterval(t);
  }, [isGenerating, statusMessages.length]);

  // On success → "Ready!" then nav
  useEffect(() => {
    if (!generatedItinerary) return;
    setStatusIndex(statusMessages.length - 1);
    const t = setTimeout(() => router.replace('/trip/itinerary'), 1000);
    return () => clearTimeout(t);
  }, [generatedItinerary]);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] });

  function handleRetry() {
    setStatusIndex(0);
    generateTrip();
  }

  function handleCancel() {
    resetTrip();
    router.replace('/(tabs)');
  }

  // ── Error state ──
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center px-8">
        <StatusBar style="dark" />
        <View
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.status.errorLight,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <AlertTriangle size={36} color={colors.status.error} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 28.8,
            color: colors.text.primary, textAlign: 'center', marginBottom: 8,
          }}
        >
          {strings.planner.generatingError}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20,
            color: colors.text.secondary, textAlign: 'center', marginBottom: 32,
          }}
        >
          {error}
        </Text>
        <Pressable
          onPress={handleRetry}
          accessibilityLabel={strings.planner.generatingRetry}
          accessibilityRole="button"
          style={({ pressed }) => ({
            height: 56, paddingHorizontal: 32, borderRadius: 16,
            backgroundColor: colors.brand.primary,
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            marginBottom: 12, alignSelf: 'stretch',
          })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' }}>
            {strings.planner.generatingRetry}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          style={({ pressed }) => ({ padding: 12, opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.secondary }}>
            {strings.common.cancel}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Generating state ──
  return (
    <SafeAreaView className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-8">
        {/* Pulsing circle */}
        <View
          style={{
            width: 120, height: 120, alignItems: 'center', justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute', width: 120, height: 120, borderRadius: 60,
              backgroundColor: colors.brand.cta,
              opacity, transform: [{ scale }],
            }}
          />
          <View
            style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: colors.brand.cta,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles size={36} color="#fff" strokeWidth={2} />
          </View>
        </View>

        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 33.6,
            letterSpacing: -0.005 * 28,
            color: colors.text.primary, textAlign: 'center', marginBottom: 16,
          }}
        >
          {strings.planner.generatingTitle}
        </Text>

        <View style={{ minHeight: 24 }}>
          <Text
            key={statusIndex}
            style={{
              fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22.5,
              color: colors.text.secondary, textAlign: 'center',
            }}
          >
            {statusMessages[statusIndex]}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
