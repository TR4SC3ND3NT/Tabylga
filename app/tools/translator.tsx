import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Languages, Mic, Volume2 } from 'lucide-react-native';
import { useStrings } from '../../lib/i18n';
import { translateDemo } from '../../lib/backend/demoBackend';
import { colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';

const TARGETS = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'ky', label: 'KG' },
];

export default function TranslatorScreen() {
  const router = useRouter();
  const strings = useStrings();
  const [text, setText] = useState('Where is the nearest bus stop?');
  const [target, setTarget] = useState('ru');
  const [output, setOutput] = useState(translateDemo('Where is the nearest bus stop?', 'ru'));
  const [voiceState, setVoiceState] = useState<string | null>(null);

  function handleTranslate() {
    setOutput(translateDemo(text, target));
    setVoiceState(null);
  }

  function handleReadAloud() {
    setVoiceState(strings.translator.readAloud);
    if (Platform.OS === 'web') {
      const speech = (globalThis as any).speechSynthesis;
      const utteranceCtor = (globalThis as any).SpeechSynthesisUtterance;
      if (speech && utteranceCtor && output) {
        speech.cancel();
        speech.speak(new utteranceCtor(output));
      }
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-primary">
      <StatusBar style="dark" />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:12, borderBottomWidth:1, borderBottomColor:colors.border.divider }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={strings.common.back} style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:17, color:colors.text.primary, flex:1, textAlign:'center', marginRight:44 }}>
          {strings.translator.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:20, gap:14 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ padding:18, borderRadius:18, backgroundColor:colors.brand.primaryLight }}>
          <Languages size={28} color={colors.brand.primary} strokeWidth={1.5} />
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, color:colors.text.primary, marginTop:12 }}>
            {strings.translator.title}
          </Text>
          <Text style={{ fontFamily:'Inter_400Regular', fontSize:14, lineHeight:21, color:colors.text.secondary, marginTop:6 }}>
            {strings.translator.subtitle}
          </Text>
        </View>

        <View style={{ borderRadius:16, borderWidth:1, borderColor:colors.border.divider, backgroundColor:colors.surface.card, padding:14 }}>
          <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.primary, marginBottom:8 }}>
            {strings.translator.inputPlaceholder}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={strings.translator.inputPlaceholder}
            placeholderTextColor={colors.text.tertiary}
            multiline
            textAlignVertical="top"
            style={{ minHeight:92, fontFamily:'Inter_400Regular', fontSize:16, lineHeight:22, color:colors.text.primary }}
          />
          <Pressable
            onPress={() => setVoiceState(strings.translator.listening)}
            accessibilityRole="button"
            style={({ pressed }) => ({ alignSelf:'flex-start', marginTop:10, flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, height:34, borderRadius:999, backgroundColor:colors.status.warningLight, opacity: pressed ? 0.75 : 1 })}
          >
            <Mic size={15} color={colors.brand.cta} strokeWidth={2} />
            <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:12, color:colors.brand.cta }}>
              {strings.translator.listening}
            </Text>
          </Pressable>
        </View>

        <View>
          <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.primary, marginBottom:8 }}>
            {strings.translator.targetLanguage}
          </Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            {TARGETS.map((option) => (
              <Chip
                key={option.code}
                label={option.label}
                selected={target === option.code}
                onPress={() => setTarget(option.code)}
                height={36}
                style={{ minWidth:72 }}
              />
            ))}
          </View>
        </View>

        <Button label={strings.translator.translate} onPress={handleTranslate} />

        <View style={{ borderRadius:18, backgroundColor:colors.surface.card, borderWidth:1, borderColor:colors.border.divider, padding:16 }}>
          <Text style={{ fontFamily:'Inter_600SemiBold', fontSize:13, color:colors.text.secondary }}>
            {strings.translator.output}
          </Text>
          <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:24, lineHeight:30, color:colors.text.primary, marginTop:8 }}>
            {output || strings.common.noResults}
          </Text>
          <Button
            variant="secondary"
            label={strings.translator.readAloud}
            onPress={handleReadAloud}
            icon={<Volume2 size={18} color={colors.brand.primary} strokeWidth={2} />}
            style={{ marginTop:14 }}
          />
          {voiceState && (
            <Text style={{ fontFamily:'Inter_400Regular', fontSize:12, color:colors.text.secondary, marginTop:8 }}>
              {voiceState}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
