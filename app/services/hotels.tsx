import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, AlertTriangle } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { formatString } from '../../lib/strings';
import { HOTEL_LISTINGS } from '../../lib/backend/demoBackend';
import { colors } from '../../constants/colors';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const BG_TINTS: Record<string, string> = { hotel:'#3d6479', yurt:'#6a5a4b', hostel:'#4a5e40' };

export default function HotelsScreen() {
  const router = useRouter();
  const strings = useStrings();
  const filters = [
    strings.services.filterAll,
    strings.services.filterPrice,
    strings.services.filterRating,
    strings.services.filterHotel,
    strings.services.filterHostel,
    strings.services.filterYurt,
    strings.services.filterGuesthouse,
  ];
  const [filter, setFilter] = useState(filters[0]);
  const hotels = [...HOTEL_LISTINGS]
    .filter((hotel) => {
      if (filter === strings.services.filterHotel) return hotel.type === 'hotel';
      if (filter === strings.services.filterHostel) return hotel.type === 'hostel';
      if (filter === strings.services.filterYurt) return hotel.type === 'yurt';
      if (filter === strings.services.filterGuesthouse) return hotel.type === 'guesthouse';
      return true;
    })
    .sort((a, b) => {
      if (filter === strings.services.filterPrice) return a.priceUsd - b.priceUsd;
      if (filter === strings.services.filterRating) return b.rating - a.rating;
      return b.rating - a.rating;
    });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.services.hotelsTitle}
        </Text>
      </View>

      <ScrollView showsHorizontalScrollIndicator={false} style={{ borderBottomWidth:1, borderBottomColor:colors.border.divider, maxHeight:52 }} horizontal contentContainerStyle={{ paddingHorizontal:16, gap:8, alignItems:'center' }}>
        {filters.map(f => (
          <Chip
            key={f}
            label={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            height={34}
            fontSize={13}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding:16, gap:12 }} showsVerticalScrollIndicator={false}>
        {hotels.map(h => (
          <Card key={h.id}>
            <View style={{ flexDirection:'row' }}>
              <View style={{ width:120, height:120, backgroundColor: BG_TINTS[h.type] ?? '#3d6479' }} />
              <View style={{ flex:1, padding:12, justifyContent:'space-between' }}>
                <View>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }} numberOfLines={2}>{h.name}</Text>
                  <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:2 }}>{h.region}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:4 }}>
                    <Star size={12} color={colors.status.warning} fill={colors.status.warning} strokeWidth={0} />
                    <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>{h.rating}</Text>
                    <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>
                      {formatString(strings.merchantExtra.reviewsCount, { count: h.reviewCount })}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6, marginTop:7 }}>
                    {h.amenities.slice(0, 3).map((amenity) => (
                      <View key={amenity} style={{ paddingHorizontal:8, height:24, borderRadius:999, backgroundColor:colors.brand.primaryLight, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontFamily:'Inter_500Medium', fontSize:11, color:colors.brand.primary }}>{amenity}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  {h.limited && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:6 }}>
                      <AlertTriangle size={12} color={colors.status.warning} strokeWidth={2} />
                      <Text style={{ fontFamily:'Inter_500Medium', fontSize:11, color:colors.status.warning }}>{strings.services.limitedAvailability}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.brand.primary }}>${h.priceUsd}<Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary }}>{strings.common.perNight}</Text></Text>
                  <View style={{ width: 86, gap: 6 }}>
                    <Button
                      variant="secondary"
                      label={strings.services.book}
                      onPress={() => router.push({ pathname: '/rating', params: { name: h.name, region: h.region } } as never)}
                      height={32}
                      fontSize={13}
                      style={{ borderRadius: 8, borderWidth: 1.5 }}
                    />
                    <Button
                      variant="primary"
                      label="Review"
                      onPress={() => router.push({ pathname: '/rating', params: { name: h.name, region: h.region } } as never)}
                      height={30}
                      fontSize={12}
                      style={{ borderRadius: 8 }}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal:12, paddingBottom:12 }}>
              {h.reviews.slice(0, 1).map((review) => (
                <View key={review.id} style={{ borderTopWidth:1, borderTopColor:colors.border.divider, paddingTop:10, marginTop:2 }}>
                  <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>
                    {review.author} · {review.rating}
                  </Text>
                  <Text numberOfLines={2} style={{ fontFamily:'Inter_400Regular', fontSize:12, lineHeight:16, color:colors.text.secondary, marginTop:3 }}>
                    {review.text}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
