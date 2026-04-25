import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2, Sparkles, X, Plus, MapPin } from 'lucide-react-native';
import { useTripStore } from '../../stores/tripStore';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';
import { formatUSD } from '../../lib/format';

const REGION_TINTS: Record<string, string> = {
  'bishkek':   '#3d6479',
  'ala-archa': '#4a5d68',
  'issyk-kul': '#4a7289',
  'song-kul':  '#4a5e40',
  'karakol':   '#5a6f4d',
  'osh':       '#6a5a4b',
  'naryn':     '#56473d',
};

export default function ItineraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { generatedItinerary, companionCount } = useTripStore();
  const [activeDay, setActiveDay] = useState(1);
  const [showInsight, setShowInsight] = useState(true);

  if (!generatedItinerary) {
    return (
      <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center">
        <Text style={{ fontFamily: 'Inter_500Medium', color: colors.text.secondary }}>
          No itinerary loaded.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: 16, padding: 12 }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.brand.primary }}>
            Back to home
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const trip = generatedItinerary;
  const currentDay = trip.days.find((d) => d.day === activeDay) || trip.days[0];

  return (
    <View className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.surface.primary,
          borderBottomWidth: 1, borderBottomColor: colors.border.divider,
        }}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityLabel={strings.common.back}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: colors.text.primary }}>
          {strings.itinerary.headerTitle}
        </Text>
        <Pressable
          accessibilityLabel="Share trip"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Share2 size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Trip header card ── */}
        <View
          style={{
            margin: 20, padding: 18, borderRadius: 16,
            backgroundColor: colors.brand.primaryLight,
          }}
        >
          <Text
            style={{
              fontFamily: 'Fraunces_600SemiBold', fontSize: 22, lineHeight: 26.4,
              letterSpacing: -0.01 * 22,
              color: colors.text.primary, marginBottom: 6,
            }}
          >
            {trip.title}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.secondary, marginBottom: 14 }}>
            {trip.days.length} days · {companionCount} {companionCount === 1 ? 'traveler' : 'travelers'} · {trip.regionsCovered.slice(0, 3).join(', ')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, letterSpacing: 0.12 * 12, textTransform: 'uppercase' }}>
                {strings.itinerary.totalLabel}
              </Text>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 33.6, color: colors.brand.primary, marginTop: 2 }}>
                {formatUSD(trip.totalCostUsd)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color={colors.brand.primary} strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.brand.primary }}>
                  {trip.regionsCovered.length} regions
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Day tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {trip.days.map((d) => {
            const isActive = activeDay === d.day;
            return (
              <Pressable
                key={d.day}
                onPress={() => setActiveDay(d.day)}
                accessibilityLabel={`Day ${d.day}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => ({
                  paddingHorizontal: 18, height: 36, borderRadius: 999,
                  backgroundColor: isActive ? colors.brand.primary : colors.surface.card,
                  borderWidth: 1,
                  borderColor: isActive ? colors.brand.primary : colors.border.divider,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold', fontSize: 13,
                    color: isActive ? '#fff' : colors.text.primary,
                  }}
                >
                  {strings.itinerary.dayLabel.replace('{n}', String(d.day))}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Timeline ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          {currentDay.activities.map((activity, index) => {
            const isLast = index === currentDay.activities.length - 1;
            const tint = REGION_TINTS[Object.keys(REGION_TINTS)[index % 7]] || '#3d6479';
            return (
              <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
                {/* Time + dot column */}
                <View style={{ width: 50, alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary, marginTop: 12 }}>
                    {activity.time}
                  </Text>
                </View>

                <View style={{ alignItems: 'center', width: 16 }}>
                  <View
                    style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: colors.brand.primary, marginTop: 16,
                    }}
                  />
                  {!isLast && (
                    <View
                      style={{
                        width: 2, flex: 1, backgroundColor: colors.border.divider,
                        marginTop: 4, minHeight: 60,
                      }}
                    />
                  )}
                </View>

                {/* Activity card */}
                <View
                  style={{
                    flex: 1, marginBottom: isLast ? 0 : 12, marginTop: 4,
                    flexDirection: 'row', gap: 12,
                    backgroundColor: colors.surface.card,
                    borderRadius: 12, padding: 10,
                    borderWidth: 1, borderColor: colors.border.divider,
                  }}
                >
                  <View
                    style={{
                      width: 60, height: 60, borderRadius: 10,
                      backgroundColor: tint,
                    }}
                  />
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <Text
                        numberOfLines={1}
                        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.text.primary }}
                      >
                        {activity.placeName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 2 }}
                      >
                        {activity.duration} · {activity.description.slice(0, 32)}{activity.description.length > 32 ? '…' : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.brand.primary, alignSelf: 'flex-end' }}>
                    {activity.costUsd > 0 ? formatUSD(activity.costUsd) : 'Free'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── AI insight bubble ── */}
        {showInsight && (
          <View
            style={{
              marginHorizontal: 20, marginTop: 20, padding: 14,
              borderRadius: 14, backgroundColor: colors.status.warningLight,
              flexDirection: 'row', alignItems: 'flex-start', gap: 12,
            }}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color={colors.brand.cta} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.08 * 12, textTransform: 'uppercase', color: colors.brand.cta }}>
                {strings.itinerary.aiInsightTitle}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.primary, marginTop: 2 }}>
                {strings.itinerary.aiInsightExample}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={strings.itinerary.aiInsightAdd}
              style={({ pressed }) => ({
                paddingHorizontal: 12, height: 32, borderRadius: 999,
                backgroundColor: colors.brand.cta,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 4,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Plus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' }}>
                {strings.itinerary.aiInsightAdd}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowInsight(false)}
              accessibilityLabel={strings.common.close}
              style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
            >
              <X size={14} color={colors.text.tertiary} strokeWidth={2} />
            </Pressable>
          </View>
        )}

        {/* ── Tips ── */}
        {trip.tips.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text.primary, marginBottom: 12 }}>
              {strings.itinerary.tipsTitle}
            </Text>
            {trip.tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row', gap: 10, paddingVertical: 10,
                  borderBottomWidth: i === trip.tips.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border.divider,
                }}
              >
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: colors.brand.cta, marginTop: 7,
                  }}
                />
                <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: colors.text.secondary }}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.card,
          borderTopWidth: 1, borderTopColor: colors.border.divider,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
      >
        <View style={{ flex: 0.5 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary }}>
            {strings.itinerary.totalLabel}
          </Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.text.primary }}>
            {formatUSD(trip.totalCostUsd)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.replace('/(tabs)/wallet')}
          accessibilityLabel={strings.itinerary.payCta}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1, height: 56, borderRadius: 16,
            backgroundColor: colors.brand.cta,
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' }}>
            {strings.itinerary.payCta}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
