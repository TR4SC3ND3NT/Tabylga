import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ClipboardList, Map, Sparkles, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { Button } from '../../components/Button';
import { useTripStore, type EntryMode } from '../../stores/tripStore';

const ENTRY_CARDS: Array<{
  mode: Exclude<EntryMode, null>;
  title: string;
  description: string;
  icon: typeof Sparkles;
  route: '/trip/voice' | '/trip/ready';
}> = [
  {
    mode: 'ai',
    title: 'Plan with AI chat',
    description: 'Write or say what you want, then adjust budget, days and route choices with AI.',
    icon: Sparkles,
    route: '/trip/voice',
  },
  {
    mode: 'ready',
    title: 'Choose ready trip',
    description: 'Start from a proven Kyrgyzstan itinerary, use it as-is or customize the preferences.',
    icon: ClipboardList,
    route: '/trip/ready',
  },
];

export default function PurposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entryMode, setEntryMode, resetGeneratedTrip } = useTripStore();

  function start(mode: Exclude<EntryMode, null>, route: '/trip/voice' | '/trip/ready') {
    setEntryMode(mode);
    resetGeneratedTrip();
    router.push(route);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <View style={{ paddingHorizontal: 12, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable
          onPress={() => goBackOrReplace(router, '/(tabs)')}
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <X size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        <View
          style={{
            minHeight: 142,
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            backgroundColor: colors.brand.primaryLight,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              backgroundColor: colors.surface.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Map size={26} color={colors.brand.primary} strokeWidth={1.6} />
          </View>
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold',
              fontSize: 30,
              lineHeight: 36,
              color: colors.text.primary,
            }}
          >
            How do you want to start?
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              lineHeight: 22,
              color: colors.text.secondary,
              marginTop: 8,
            }}
          >
            Build a personal Kyrgyzstan trip from your preferences or begin with a ready-made route.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {ENTRY_CARDS.map((card) => {
            const Icon = card.icon;
            const selected = entryMode === card.mode;
            return (
              <Pressable
                key={card.mode}
                onPress={() => start(card.mode, card.route)}
                accessibilityRole="button"
                accessibilityLabel={card.title}
                style={({ pressed }) => ({
                  borderRadius: 18,
                  padding: 16,
                  backgroundColor: selected ? colors.brand.primaryLight : colors.surface.card,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.brand.primary : colors.border.divider,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: selected ? colors.surface.card : colors.brand.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={23} color={colors.brand.primary} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: selected ? colors.brand.primary : colors.text.primary }}>
                      {card.title}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 4 }}>
                      {card.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.divider,
        }}
      >
        <Button
          label={entryMode === 'ready' ? 'Open ready trips' : 'Plan with AI'}
          onPress={() => start(entryMode === 'ready' ? 'ready' : 'ai', entryMode === 'ready' ? '/trip/ready' : '/trip/voice')}
        />
      </View>
    </SafeAreaView>
  );
}
