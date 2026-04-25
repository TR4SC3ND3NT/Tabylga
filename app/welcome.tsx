import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Sparkles, CreditCard, WifiOff, ChevronRight } from 'lucide-react-native';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useStrings } from '../lib/i18n';
import { colors } from '../constants/colors';
import { Button } from '../components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  key: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const completeWelcome = useOnboardingStore((s) => s.completeWelcome);
  const slides: Slide[] = [
    {
      key: 'ai',
      icon: <Sparkles size={32} color={colors.brand.primary} strokeWidth={1.5} />,
      iconBg: colors.brand.primaryLight,
      title: strings.welcome.slide1.title,
      subtitle: strings.welcome.slide1.body,
    },
    {
      key: 'wallet',
      icon: <CreditCard size={32} color={colors.brand.cta} strokeWidth={1.5} />,
      iconBg: colors.brand.ctaLight,
      title: strings.welcome.slide2.title,
      subtitle: strings.welcome.slide2.body,
    },
    {
      key: 'offline',
      icon: <WifiOff size={32} color={colors.surface.card} strokeWidth={1.5} />,
      iconBg: colors.brand.primary,
      title: strings.welcome.slide3.title,
      subtitle: strings.welcome.slide3.body,
    },
  ];

  function handleNext() {
    if (currentSlide < slides.length - 1) {
      const next = currentSlide + 1;
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * next, animated: true });
      setCurrentSlide(next);
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    await completeWelcome();
    router.replace('/preferences');
  }

  function handleScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(page);
  }

  const isLast = currentSlide === slides.length - 1;

  return (
    <View className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Skip */}
      <View
        style={{ paddingTop: (insets.top || 0) + 12, paddingRight: 20 }}
        className="items-end"
      >
        <Pressable
          onPress={handleFinish}
          accessibilityLabel={strings.welcome.skip}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: colors.text.secondary,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            {strings.welcome.skip}
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide) => (
          <View
            key={slide.key}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 items-center justify-center px-8"
          >
            {/* Icon circle */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: slide.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              {slide.icon}
            </View>

            {/* Headline */}
            <Text
              style={{
                fontFamily: 'Fraunces_600SemiBold',
                fontSize: 28,
                lineHeight: 33.6,
                letterSpacing: -0.005 * 28,
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {slide.title}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                lineHeight: 24,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots + CTA */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          paddingTop: 20,
        }}
      >
        {/* Dots */}
        <View className="flex-row items-center" style={{ gap: 6 }}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={{
                width: index === currentSlide ? 24 : 8,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === currentSlide ? colors.brand.primary : colors.border.input,
              }}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <Button
          label={isLast ? strings.welcome.getStarted : strings.welcome.next}
          onPress={handleNext}
          icon={!isLast ? <ChevronRight size={18} color="#fff" strokeWidth={2} /> : undefined}
          style={{
            flex: 1,
            marginLeft: 20,
            maxWidth: isLast ? SCREEN_WIDTH - 40 : undefined,
          }}
        />
      </View>
    </View>
  );
}
