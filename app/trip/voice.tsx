import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Map,
  Mic,
  Mountain,
  Send,
  Sparkles,
  Tent,
  Trash2,
  WalletCards,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { goBackOrReplace } from '../../lib/navigation';
import { formatUSD } from '../../lib/format';
import { transcribePlannerAudio } from '../../lib/ai/geminiTripPlanner';
import { useTripStore, type AiPlannerMessage } from '../../stores/tripStore';
import type { BudgetTier, TripPreferences } from '../../lib/data/tripPlaces';

const STARTER_PROMPTS = [
  'Хочу увидеть горы на 5 дней, бюджет $500',
  'Недорогой отдых вокруг Иссык-Куля',
  'Хочу юрту, лошадей и красивые озера',
];

const BUDGET_LABELS: Record<BudgetTier, string> = {
  budget: '$100-300',
  standard: '$300-600',
  comfort: '$600-1200',
  premium: '$1200+',
};

function prettyList(items: string[]) {
  return items.length ? items.map((item) => item.replace(/_/g, ' ')).join(', ') : 'пока не выбрано';
}

function latestSuggestions(messages: AiPlannerMessage[]) {
  const latest = [...messages].reverse().find((message) => message.role === 'assistant' && message.suggestions?.length);
  return latest?.suggestions?.slice(0, 3) ?? STARTER_PROMPTS;
}

function audioMime(uri: string) {
  if (Platform.OS === 'web') return 'audio/webm';
  if (uri.endsWith('.mp3')) return 'audio/mp3';
  if (uri.endsWith('.wav')) return 'audio/wav';
  if (uri.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/aac';
}

function withUnique<T extends string>(items: T[], next: T[]) {
  return Array.from(new Set([...items, ...next]));
}

export default function VoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [draft, setDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const {
    preferences,
    generatedItinerary,
    aiPlannerMessages,
    isAiPlannerThinking,
    sendAiPlannerMessage,
    applyAiPlannerPatch,
    clearAiPlannerChat,
  } = useTripStore();

  const suggestions = useMemo(() => latestSuggestions(aiPlannerMessages), [aiPlannerMessages]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    if (recording || isAiPlannerThinking || transcribing) loop.start();
    return () => loop.stop();
  }, [isAiPlannerThinking, pulse, recording, transcribing]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [aiPlannerMessages.length, isAiPlannerThinking]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
    };
  }, []);

  async function submit(text = draft) {
    const trimmed = text.trim();
    if (!trimmed || isAiPlannerThinking) return;
    setDraft('');
    await sendAiPlannerMessage(trimmed);
  }

  function startBrowserSpeech() {
    if (Platform.OS !== 'web') return false;
    const root = globalThis as typeof globalThis & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition = root.SpeechRecognition ?? root.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript;
      if (text) setDraft((current) => current ? `${current} ${text}` : text);
    };
    recognition.onerror = () => Alert.alert('Voice input', 'Не удалось распознать речь в браузере.');
    recognition.start();
    return true;
  }

  async function startRecording() {
    if (startBrowserSpeech()) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone', 'Разрешите доступ к микрофону для голосового ввода.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: nextRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = nextRecording;
      setRecording(true);
    } catch (error) {
      Alert.alert('Voice input', error instanceof Error ? error.message : 'Не удалось включить запись.');
    }
  }

  async function stopRecording() {
    const current = recordingRef.current;
    if (!current) return;
    setRecording(false);
    setTranscribing(true);
    recordingRef.current = null;

    try {
      await current.stopAndUnloadAsync();
      const uri = current.getURI();
      if (!uri) throw new Error('Audio file was not saved.');
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const text = await transcribePlannerAudio(base64Audio, audioMime(uri));
      if (text) setDraft((value) => value ? `${value} ${text}` : text);
    } catch (error) {
      Alert.alert('Voice input', error instanceof Error ? error.message : 'Не удалось расшифровать голос.');
    } finally {
      setTranscribing(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined);
    }
  }

  async function handleMic() {
    if (transcribing || isAiPlannerThinking) return;
    if (recording) await stopRecording();
    else await startRecording();
  }

  function patchTrip(patch: Partial<TripPreferences>, label: string) {
    void applyAiPlannerPatch(patch, label);
  }

  function applyMountains() {
    patchTrip({
      travelStyles: withUnique(preferences.travelStyles, ['adventure']),
      experiences: withUnique(preferences.experiences, ['mountain_views', 'lakes_canyons', 'light_hiking']),
      activityLevel: preferences.activityLevel === 'easy' ? 'light' : preferences.activityLevel,
      roadTolerance: preferences.roadTolerance === 'low' ? 'medium' : preferences.roadTolerance,
    }, 'Добавил больше гор');
  }

  function applyYurt() {
    patchTrip({
      stayPreference: 'yurt_ok',
      experiences: withUnique(preferences.experiences, ['nomadic_culture']),
    }, 'Добавил ночь в юрте');
  }

  function applyHorseRide() {
    patchTrip({
      experiences: withUnique(preferences.experiences, ['horse_riding']),
      activityLevel: preferences.activityLevel === 'easy' ? 'light' : preferences.activityLevel,
    }, 'Добавил прогулку на лошадях');
  }

  function handleSuggestion(suggestion: string) {
    const lower = suggestion.toLowerCase();
    if (lower.includes('открыть') && generatedItinerary) {
      router.push('/trip/itinerary');
      return;
    }
    if (lower.includes('дешев')) {
      patchTrip({ budgetTier: 'budget' }, 'Сделал маршрут дешевле');
      return;
    }
    if (lower.includes('комфорт')) {
      patchTrip({ budgetTier: preferences.budgetTier === 'budget' ? 'standard' : 'comfort', stayPreference: 'hotels_only', internetComfort: 'prefer_internet' }, 'Сделал маршрут комфортнее');
      return;
    }
    if (lower.includes('гор')) {
      applyMountains();
      return;
    }
    if (lower.includes('7')) {
      patchTrip({ days: 7 }, 'Поменял на 7 дней');
      return;
    }
    if (lower.includes('лошад')) {
      applyHorseRide();
      return;
    }
    if (lower.includes('юрт')) {
      applyYurt();
      return;
    }
    void submit(suggestion);
  }

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.04] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.inverse }}>
      <StatusBar style="light" />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconButton label="Back" onPress={() => goBackOrReplace(router, '/(tabs)')} icon={<ArrowLeft size={21} color="#fff" strokeWidth={1.8} />} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' }}>AI планер</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.58)', marginTop: 2 }}>
            Чат и пересчет маршрута
          </Text>
        </View>
        <IconButton
          label="Clear chat"
          onPress={() => {
            Alert.alert('Очистить чат?', 'Маршрут останется, удалится только история запроса.', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Очистить', style: 'destructive', onPress: () => void clearAiPlannerChat() },
            ]);
          }}
          icon={<Trash2 size={19} color="rgba(255,255,255,0.78)" strokeWidth={1.8} />}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        >
          <TripSnapshot
            preferences={preferences}
            total={generatedItinerary?.totalCost ?? null}
            title={generatedItinerary?.title ?? null}
            onOpen={() => generatedItinerary ? router.push('/trip/itinerary') : void submit('Собери маршрут по текущим параметрам')}
          />

          <View style={{ marginTop: 14 }}>
            <Text style={sectionLabel}>Поправить план</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <ChoiceChip
                selected={preferences.budgetTier === 'budget'}
                label="Дешевле"
                icon={<WalletCards size={14} color={preferences.budgetTier === 'budget' ? '#fff' : colors.brand.cta} strokeWidth={2} />}
                accent={colors.brand.cta}
                onPress={() => patchTrip({ budgetTier: 'budget' }, 'Сделал маршрут дешевле')}
              />
              <ChoiceChip
                selected={preferences.experiences.includes('mountain_views')}
                label="Больше гор"
                icon={<Mountain size={14} color={preferences.experiences.includes('mountain_views') ? '#fff' : '#4A7289'} strokeWidth={2} />}
                accent="#4A7289"
                onPress={applyMountains}
              />
              <ChoiceChip
                selected={preferences.days === 7}
                label="7 дней"
                icon={<CalendarDays size={14} color={preferences.days === 7 ? '#fff' : colors.brand.primary} strokeWidth={2} />}
                onPress={() => patchTrip({ days: 7 }, 'Поменял на 7 дней')}
              />
              <ChoiceChip
                selected={preferences.stayPreference === 'yurt_ok'}
                label="Юрта"
                icon={<Tent size={14} color={preferences.stayPreference === 'yurt_ok' ? '#fff' : '#6A5A4B'} strokeWidth={2} />}
                accent="#6A5A4B"
                onPress={applyYurt}
              />
            </View>
          </View>

          <View style={{ marginTop: 18, gap: 10 }}>
            {aiPlannerMessages.length === 0 ? (
              <AssistantEmpty onPick={submit} />
            ) : (
              aiPlannerMessages.map((message) => <MessageBubble key={message.id} message={message} />)
            )}

            {isAiPlannerThinking || transcribing ? (
              <View style={{ alignSelf: 'flex-start', maxWidth: '86%', borderRadius: 18, padding: 13, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' }}>
                  {transcribing ? 'Расшифровываю голос' : 'Считаю маршрут'}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={sectionLabel}>Подсказки</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    minHeight: 38,
                    paddingHorizontal: 13,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: colors.surface.inverse }}>
          {recording ? (
            <View style={{ marginBottom: 8, height: 34, borderRadius: 12, backgroundColor: 'rgba(198,93,58,0.18)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand.cta, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' }}>Идет запись. Нажмите микрофон, чтобы закончить.</Text>
            </View>
          ) : null}

          <View style={{ minHeight: 56, borderRadius: 18, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 14, paddingRight: 8, paddingVertical: 8, gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Напишите бюджет, дни, горы, озера..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              editable={!isAiPlannerThinking}
              style={{ flex: 1, maxHeight: 110, paddingVertical: 8, fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text.primary }}
            />
            <Pressable
              onPress={handleMic}
              disabled={isAiPlannerThinking || transcribing}
              accessibilityLabel="Voice input"
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: recording ? colors.status.error : colors.brand.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Mic size={19} color={recording ? '#fff' : colors.brand.primary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => void submit()}
              disabled={!draft.trim() || isAiPlannerThinking}
              accessibilityLabel="Send"
              accessibilityRole="button"
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: draft.trim() ? colors.brand.cta : colors.border.divider,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Send size={18} color="#fff" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TripSnapshot({
  preferences,
  total,
  title,
  onOpen,
}: {
  preferences: TripPreferences;
  total: number | null;
  title: string | null;
  onOpen: () => void;
}) {
  return (
    <View style={{ borderRadius: 22, padding: 16, backgroundColor: '#F7F6F2', overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={22} color="#fff" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 29, color: colors.text.primary }}>
            {title ?? 'Новый маршрут по Кыргызстану'}
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text.secondary, marginTop: 5 }}>
            {preferences.days} дней · {preferences.travelerCount} чел. · {BUDGET_LABELS[preferences.budgetTier]}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <SnapshotMetric icon={<WalletCards size={16} color={colors.brand.primary} />} label="Бюджет" value={total ? formatUSD(total) : BUDGET_LABELS[preferences.budgetTier]} />
        <SnapshotMetric icon={<Map size={16} color={colors.brand.cta} />} label="Фокус" value={prettyList(preferences.experiences.slice(0, 2))} />
      </View>

      <View style={{ flexDirection: 'row', gap: 9, marginTop: 13 }}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.brand.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <Map size={16} color="#fff" strokeWidth={2} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' }}>{total ? 'Открыть маршрут' : 'Собрать маршрут'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SnapshotMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minHeight: 68, borderRadius: 14, padding: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border.divider }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.text.secondary }}>{label}</Text>
      </View>
      <Text numberOfLines={2} style={{ fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 17, color: colors.text.primary, marginTop: 7 }}>{value}</Text>
    </View>
  );
}

function AssistantEmpty({ onPick }: { onPick: (text: string) => void }) {
  return (
    <View style={{ borderRadius: 18, padding: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.brand.cta, alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={18} color="#fff" strokeWidth={1.8} />
        </View>
        <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' }}>Опишите отдых одним сообщением</Text>
      </View>
      <View style={{ gap: 8 }}>
        {STARTER_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => void onPick(prompt)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 42,
              borderRadius: 12,
              paddingHorizontal: 12,
              alignItems: 'center',
              flexDirection: 'row',
              backgroundColor: 'rgba(255,255,255,0.1)',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: AiPlannerMessage }) {
  const mine = message.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
      <View
        style={{
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: mine ? colors.brand.cta : 'rgba(255,255,255,0.12)',
          borderWidth: mine ? 0 : 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, color: '#fff' }}>{message.text}</Text>
      </View>
    </View>
  );
}

function IconButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.72 : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  accent = colors.brand.primary,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        height: 38,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: selected ? accent : '#fff',
        borderWidth: 1,
        borderColor: selected ? accent : colors.border.divider,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      {icon}
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: selected ? '#fff' : accent }}>{label}</Text>
    </Pressable>
  );
}

const sectionLabel = {
  fontFamily: 'Inter_700Bold' as const,
  fontSize: 12,
  color: 'rgba(255,255,255,0.56)',
  textTransform: 'uppercase' as const,
};
