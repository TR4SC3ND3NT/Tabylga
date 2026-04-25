import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck, Sparkles } from 'lucide-react-native';
import { READY_TRIPS } from '../../lib/data/readyTrips';
import type { ReadyTrip } from '../../lib/data/tripPlaces';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { useTripStore } from '../../stores/tripStore';

export default function ReadyTripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const applyPreset = useTripStore((state) => state.applyPreset);

  function usePreset(trip: ReadyTrip) {
    applyPreset(trip, 'ready');
    router.replace('/trip/generating');
  }

  function customizePreset(trip: ReadyTrip) {
    applyPreset(trip, 'ready');
    router.push('/trip/quiz');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 30,
            lineHeight: 36,
            color: colors.text.primary,
          }}
        >
          Choose ready trip
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: colors.text.secondary,
            marginTop: 8,
            marginBottom: 20,
          }}
        >
          Start instantly from a Kyrgyzstan route that already has preferences behind it.
        </Text>

        <View style={{ gap: 14 }}>
          {READY_TRIPS.map((trip) => (
            <View
              key={trip.id}
              style={{
                borderRadius: 18,
                padding: 16,
                backgroundColor: colors.surface.card,
                borderWidth: 1,
                borderColor: colors.border.divider,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: colors.brand.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BadgeCheck size={21} color={colors.brand.primary} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.text.primary }}>
                    {trip.title}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.brand.primary, marginTop: 3 }}>
                    {trip.daysLabel}
                  </Text>
                </View>
              </View>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: colors.text.secondary, marginTop: 12 }}>
                {trip.description}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {trip.tags.map((tag) => (
                  <Chip key={tag} label={tag} height={30} fontSize={12} />
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Button
                  label="Use this"
                  icon={<Sparkles size={17} color="#fff" strokeWidth={2} />}
                  onPress={() => usePreset(trip)}
                  height={46}
                  fontSize={14}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="secondary"
                  label="Customize"
                  onPress={() => customizePreset(trip)}
                  height={46}
                  fontSize={14}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))}
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
        <Button variant="secondary" label="Back to start" onPress={() => router.replace('/trip/purpose')} />
      </View>
    </SafeAreaView>
  );
}
