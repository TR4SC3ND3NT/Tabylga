import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';

const FILTERS = ['All', 'Hotels', 'Food', 'Activities', 'Parks', 'Rest Points', 'ATMs'];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={{ flex: 1, backgroundColor: '#E8E8E0' }}>
      <StatusBar style="dark" />

      {/* Map placeholder */}
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 18, color: colors.text.secondary }}>
            🗺 Map loads here
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text.tertiary, marginTop: 6 }}>
            react-native-maps with Mapbox tiles
          </Text>
        </View>
      </View>

      {/* Top floating search */}
      <View style={{
        position: 'absolute', top: (insets.top || 0) + 8, left: 16, right: 16,
        flexDirection: 'row', gap: 10,
      }}>
        <View style={{
          flex: 1, height: 52, borderRadius: 14,
          backgroundColor: colors.surface.card,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
          shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
        }}>
          <Search size={18} color={colors.text.tertiary} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.tertiary, flex: 1 }}>
            {strings.map.searchPlaceholder}
          </Text>
        </View>
        <View style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: colors.surface.card, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
        }}>
          <SlidersHorizontal size={20} color={colors.text.primary} strokeWidth={1.5} />
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ position: 'absolute', top: (insets.top || 0) + 72, left: 0, right: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                accessibilityLabel={f}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  height: 34, paddingHorizontal: 14, borderRadius: 999,
                  backgroundColor: active ? colors.brand.primary : colors.surface.card,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: active ? '#fff' : colors.text.primary }}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom hint */}
      <View style={{ position: 'absolute', bottom: (insets.bottom || 0) + 100, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text.secondary }}>
            Tap a pin to see details
          </Text>
        </View>
      </View>
    </View>
  );
}
