import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Star, Plus } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useStrings } from '../lib/i18n';
import { Button } from '../components/Button';

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; region?: string }>();
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const targetName = typeof params.name === 'string' ? params.name : strings.rating.targetName;
  const targetRegion = typeof params.region === 'string' ? params.region : strings.rating.targetRegion;
  const [rating, setRating] = useState(0);
  const [subRatings, setSubRatings] = useState({
    cleanliness: 0,
    staff: 0,
    location: 0,
    value: 0,
  });
  const [reviewText, setReviewText] = useState('');

  const renderStars = (current: number, onSelect?: (r: number) => void, size = 42) => {
    return (
      <View style={{ flexDirection: 'row', gap: size > 20 ? 10 : 4 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable key={s} onPress={() => onSelect && onSelect(s)} disabled={!onSelect}>
            <Star
              size={size}
              color={s <= current ? colors.status.warning : colors.border.divider}
              fill={s <= current ? colors.status.warning : 'transparent'}
              strokeWidth={s <= current ? 0 : 2}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  const renderSubRating = (key: keyof typeof subRatings, label: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: key === 'value' ? 0 : 1, borderBottomColor: colors.border.divider }}>
      <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text.primary }}>
        {label}
      </Text>
      {renderStars(subRatings[key], (v) => setSubRatings({ ...subRatings, [key]: v }), 16)}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.primary }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        
        {/* Header & Close */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.divider, marginBottom: 8 }} />
          <View style={{ width: '100%', alignItems: 'flex-end', marginTop: -12 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <X size={22} color={colors.text.tertiary} />
            </Pressable>
          </View>
        </View>

        {/* Identity */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#4a7289', marginBottom: 10, borderWidth: 3, borderColor: colors.brand.primaryLight }} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.text.primary }}>{targetName}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginTop: 3 }}>{targetRegion}</Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, color: colors.text.primary, marginTop: 14 }}>{strings.rating.title}</Text>
        </View>

        {/* Main Rating */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          {renderStars(rating, setRating, 42)}
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.tertiary, marginTop: 4 }}>{strings.rating.tapToRate}</Text>
        </View>

        {/* Sub Ratings */}
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border.divider, marginBottom: 14, overflow: 'hidden' }}>
          {renderSubRating('cleanliness', strings.rating.cleanliness)}
          {renderSubRating('staff', strings.rating.staff)}
          {renderSubRating('location', strings.rating.location)}
          {renderSubRating('value', strings.rating.value)}
        </View>

        {/* Text Area */}
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border.divider, padding: 12, marginBottom: 10, minHeight: 100 }}>
          <TextInput
            multiline
            placeholder={strings.rating.reviewPlaceholder}
            placeholderTextColor={colors.text.tertiary}
            value={reviewText}
            onChangeText={setReviewText}
            maxLength={500}
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text.primary, textAlignVertical: 'top' }}
          />
          <Text style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.text.tertiary }}>
            {reviewText.length} / 500
          </Text>
        </View>

        {/* Photo Upload */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 2, borderColor: colors.border.divider, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={22} color={colors.text.tertiary} />
            </View>
          ))}
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text.secondary, marginLeft: 4, flex: 1 }}>
            {strings.rating.addPhotos}
          </Text>
        </View>

        {/* CTAs */}
        <View style={{ gap: 10 }}>
          <Button
            variant="primary"
            label={strings.rating.submit}
            onPress={() => router.back()}
          />
          <Button
            variant="secondary"
            label={strings.rating.maybeLater}
            onPress={() => router.back()}
            style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
          />
        </View>

      </ScrollView>
    </View>
  );
}
