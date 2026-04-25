import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Sparkles, Users } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { formatString } from '../../lib/strings';
import { GROUP_CHAT_MESSAGES, TOUR_TRANSPORT_QUOTES, TRAVELER_MATCHES } from '../../lib/backend/demoBackend';
import { useTravelPreferencesStore } from '../../stores/travelPreferencesStore';
import { useTripStore } from '../../stores/tripStore';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function GroupMatchScreen() {
  const router = useRouter();
  const strings = useStrings();
  const age = useTravelPreferencesStore((s) => s.age);
  const preferredTourPeople = useTravelPreferencesStore((s) => s.preferredTourPeople);
  const wantsStrangerMatch = useTravelPreferencesStore((s) => s.wantsStrangerMatch);
  const setWantsStrangerMatch = useTravelPreferencesStore((s) => s.setWantsStrangerMatch);
  const interests = useTripStore((s) => s.interests);
  const [chatCreated, setChatCreated] = useState(false);

  const matches = useMemo(() => {
    return TRAVELER_MATCHES
      .map((match) => {
        const interestOverlap = match.interests.filter((interest) => interests.includes(interest)).length * 4;
        const ageFit = Math.max(0, 10 - Math.abs(match.age - age));
        return { ...match, overlapScore: Math.min(99, match.overlapScore + interestOverlap + ageFit - 6) };
      })
      .sort((a, b) => b.overlapScore - a.overlapScore);
  }, [age, interests]);

  const quote = TOUR_TRANSPORT_QUOTES[0];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.groupPlanner.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:20, gap:14 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding:18, borderRadius:18, backgroundColor:colors.brand.primaryLight }}>
          <Sparkles size={28} color={colors.brand.primary} strokeWidth={1.6} />
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary, marginTop:12 }}>
            {strings.groupPlanner.title}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, lineHeight:21, color:colors.text.secondary, marginTop:6 }}>
            {strings.groupPlanner.subtitle}
          </Text>
          <Pressable
            onPress={() => setWantsStrangerMatch(!wantsStrangerMatch)}
            accessibilityRole="switch"
            accessibilityState={{ checked: wantsStrangerMatch }}
            style={({ pressed }) => ({
              marginTop:14,
              height:40,
              borderRadius:999,
              paddingHorizontal:14,
              alignSelf:'flex-start',
              backgroundColor:wantsStrangerMatch ? colors.brand.primary : colors.surface.card,
              justifyContent:'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:wantsStrangerMatch ? '#fff' : colors.text.primary }}>
              {strings.preferences.strangerMatch}
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Users size={18} color={colors.brand.primary} strokeWidth={2} />
          <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:15, color:colors.text.primary }}>
            {formatString(strings.taxi.peopleWant, { count: preferredTourPeople })}
          </Text>
        </View>

        {matches.map((match) => (
          <Card key={match.id} style={{ padding:16 }}>
            <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12 }}>
              <View style={{ width:50, height:50, borderRadius:18, backgroundColor:colors.brand.primaryLight, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:20, color:colors.brand.primary }}>{match.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:'Inter_700Bold', fontSize:16, color:colors.text.primary }}>
                  {match.name} · {match.age} · {match.country}
                </Text>
                <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.brand.primary, marginTop:4 }}>
                  {formatString(strings.groupPlanner.overlap, { score: match.overlapScore })}
                </Text>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:8 }}>
                  {strings.groupPlanner.suggestedMeetup}: {match.suggestedMeetup}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        <Card style={{ padding:16, backgroundColor:colors.status.warningLight }}>
          <Text style={{ fontFamily:'Inter_700Bold', fontSize:15, color:colors.text.primary }}>
            {strings.groupPlanner.transportSplit}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:5 }}>
            {quote.title} · {quote.route}
          </Text>
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.brand.cta, marginTop:10 }}>
            ${quote.pricePerPersonUsd} {strings.common.perPerson}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:4 }}>
            {strings.preferences.transportDeposit}
          </Text>
        </Card>

        <Button
          label={chatCreated ? strings.groupPlanner.chatTitle : strings.groupPlanner.createChat}
          onPress={() => setChatCreated(true)}
          icon={<MessageCircle size={18} color="#fff" strokeWidth={2} />}
        />

        {chatCreated && (
          <Card style={{ padding:16 }}>
            <Text style={{ fontFamily:'Inter_700Bold', fontSize:16, color:colors.text.primary, marginBottom:10 }}>
              {strings.groupPlanner.chatTitle}
            </Text>
            {GROUP_CHAT_MESSAGES.map((message) => (
              <View key={message.id} style={{ paddingVertical:9, borderTopWidth:1, borderTopColor:colors.border.divider }}>
                <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.text.primary }}>
                  {message.sender} · {message.time}
                </Text>
                <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, lineHeight:18, color:colors.text.secondary, marginTop:3 }}>
                  {message.text}
                </Text>
              </View>
            ))}
            <Button
              variant="secondary"
              label={strings.itinerary.payCta}
              onPress={() => router.push('/(tabs)/wallet')}
              style={{ marginTop:12 }}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
