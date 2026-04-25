import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  X, Minus, Plus,
  TreePalm, Mountain, Users, Briefcase,
  Heart, Landmark, Laptop, Star,
} from 'lucide-react-native';
import { useTripStore, type Purpose, type Companions } from '../../stores/tripStore';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';

const PURPOSES: { key: Purpose; icon: any; label: string; desc: string }[] = [
  { key: 'leisure',       icon: TreePalm,  label: strings.planner.purposeLeisure,    desc: strings.planner.purposeLeisureDesc },
  { key: 'adventure',     icon: Mountain,  label: strings.planner.purposeAdventure,  desc: strings.planner.purposeAdventureDesc },
  { key: 'family',        icon: Users,     label: strings.planner.purposeFamily,     desc: strings.planner.purposeFamilyDesc },
  { key: 'business',      icon: Briefcase, label: strings.planner.purposeBusiness,   desc: strings.planner.purposeBusinessDesc },
  { key: 'romantic',      icon: Heart,     label: strings.planner.purposeRomantic,   desc: strings.planner.purposeRomanticDesc },
  { key: 'cultural',      icon: Landmark,  label: strings.planner.purposeCultural,   desc: strings.planner.purposeCulturalDesc },
  { key: 'digital_nomad', icon: Laptop,    label: strings.planner.purposeNomad,      desc: strings.planner.purposeNomadDesc },
  { key: 'pilgrimage',    icon: Star,      label: strings.planner.purposePilgrimage, desc: strings.planner.purposePilgrimageDesc },
];

const COMPANIONS: { key: Companions; label: string }[] = [
  { key: 'solo',       label: strings.planner.companionSolo },
  { key: 'couple',     label: strings.planner.companionCouple },
  { key: 'family',     label: strings.planner.companionFamily },
  { key: 'friends',    label: strings.planner.companionFriends },
  { key: 'colleagues', label: strings.planner.companionColleagues },
];

export default function PurposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    purpose, companions, companionCount,
    setPurpose, setCompanions, setCompanionCount,
  } = useTripStore();

  const showGroupSize = companions === 'family' || companions === 'friends' || companions === 'colleagues';
  const canContinue = !!purpose && !!companions;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />

      {/* Close */}
      <View className="px-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={strings.common.close}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <X size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* H1 */}
        <Text
          style={{
            fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 33.6,
            letterSpacing: -0.005 * 28, color: colors.text.primary, marginBottom: 8,
          }}
        >
          {strings.planner.stepPurposeQuestion}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22.5,
            color: colors.text.secondary, marginBottom: 20,
          }}
        >
          {strings.planner.stepPurposeSubtitle}
        </Text>

        {/* Purpose grid 2×4 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PURPOSES.map((p) => {
            const Icon = p.icon;
            const isSelected = purpose === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPurpose(p.key)}
                accessibilityLabel={p.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => ({
                  width: '48.5%',
                  borderRadius: 16,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.brand.primary : colors.border.divider,
                  backgroundColor: isSelected ? colors.brand.primaryLight : colors.surface.card,
                  padding: 14,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Icon
                  size={28}
                  color={isSelected ? colors.brand.primary : colors.text.primary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold', fontSize: 15,
                    color: isSelected ? colors.brand.primary : colors.text.primary,
                    marginTop: 10,
                  }}
                >
                  {p.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'Inter_400Regular', fontSize: 12,
                    color: colors.text.secondary, marginTop: 2,
                  }}
                >
                  {p.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Companions section */}
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold', fontSize: 18,
            color: colors.text.primary, marginTop: 32, marginBottom: 14,
          }}
        >
          {strings.planner.stepCompanionsQuestion}
        </Text>

        {/* Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {COMPANIONS.map((c) => {
            const isSelected = companions === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCompanions(c.key)}
                accessibilityLabel={c.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => ({
                  height: 36, paddingHorizontal: 16, borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.brand.primary : colors.border.input,
                  backgroundColor: isSelected ? colors.brand.primary : colors.surface.card,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_500Medium', fontSize: 13,
                    color: isSelected ? '#fff' : colors.text.primary,
                  }}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Kids ages indicator */}
        {companions === 'family' && (
          <View
            style={{
              marginTop: 14, padding: 14, borderRadius: 12,
              backgroundColor: colors.brand.primaryLight,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.brand.primary }}>
              {strings.planner.kidsAges}
            </Text>
          </View>
        )}

        {/* Group size stepper */}
        {showGroupSize && (
          <View
            style={{
              marginTop: 14, padding: 14, borderRadius: 12,
              backgroundColor: colors.surface.card,
              borderWidth: 1, borderColor: colors.border.divider,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.primary }}>
              {strings.planner.groupSize}
            </Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setCompanionCount(Math.max(2, companionCount - 1))}
                disabled={companionCount <= 2}
                accessibilityLabel="Decrease group size"
                style={({ pressed }) => ({
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: colors.brand.primaryLight,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: companionCount <= 2 ? 0.4 : pressed ? 0.7 : 1,
                })}
              >
                <Minus size={16} color={colors.brand.primary} strokeWidth={2} />
              </Pressable>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, minWidth: 24, textAlign: 'center' }}>
                {companionCount}
              </Text>
              <Pressable
                onPress={() => setCompanionCount(Math.min(10, companionCount + 1))}
                disabled={companionCount >= 10}
                accessibilityLabel="Increase group size"
                style={({ pressed }) => ({
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: colors.brand.primaryLight,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: companionCount >= 10 ? 0.4 : pressed ? 0.7 : 1,
                })}
              >
                <Plus size={16} color={colors.brand.primary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.surface.primary,
          borderTopWidth: 1, borderTopColor: colors.border.divider,
        }}
      >
        <Pressable
          onPress={() => router.push('/trip/quiz')}
          disabled={!canContinue}
          accessibilityLabel={strings.auth.continueButton}
          accessibilityRole="button"
          style={({ pressed }) => ({
            height: 56, borderRadius: 16,
            backgroundColor: colors.brand.primary,
            alignItems: 'center', justifyContent: 'center',
            opacity: !canContinue ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' }}>
            {strings.auth.continueButton}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
