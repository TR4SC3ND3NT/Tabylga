import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, Keyboard, X } from 'lucide-react-native';
import { strings } from '../../lib/strings';
import { colors } from '../../constants/colors';

export default function VoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const outerPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const inner = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    const outer = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, { toValue: 1.5,  duration: 1200, useNativeDriver: true }),
        Animated.timing(outerPulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    );
    inner.start();
    outer.start();
    return () => { inner.stop(); outer.stop(); };
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:'#1A1A1A' }}>
      <StatusBar style="light" />

      {/* Close */}
      <View style={{ paddingTop: (insets.top || 0) + 8, paddingHorizontal:16 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={strings.common.close}
          accessibilityRole="button"
          style={({ pressed }) => ({ width:44, height:44, alignItems:'center', justifyContent:'center', opacity: pressed ? 0.6 : 1 })}
        >
          <X size={22} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {/* Pulsing rings */}
        <View style={{ width:200, height:200, alignItems:'center', justifyContent:'center', marginBottom:40 }}>
          <Animated.View style={{ position:'absolute', width:200, height:200, borderRadius:100, backgroundColor: colors.brand.cta, opacity:0.1, transform:[{ scale: outerPulse }] }} />
          <Animated.View style={{ position:'absolute', width:160, height:160, borderRadius:80, backgroundColor: colors.brand.cta, opacity:0.2, transform:[{ scale: pulseAnim }] }} />
          <View style={{ width:96, height:96, borderRadius:48, backgroundColor: colors.brand.cta, alignItems:'center', justifyContent:'center' }}>
            <Mic size={40} color="#fff" strokeWidth={1.5} />
          </View>
        </View>

        <Text style={{ fontFamily:'Fraunces_600SemiBold', fontSize:28, color:'#fff', textAlign:'center', marginBottom:12 }}>
          {strings.voice.listening}
        </Text>
        <Text style={{ fontFamily:'Inter_400Regular', fontSize:15, color:'rgba(255,255,255,0.6)', textAlign:'center', lineHeight:22 }}>
          {strings.voice.hint}
        </Text>
      </View>

      {/* Bottom actions */}
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:20, paddingBottom: Math.max(insets.bottom, 24) + 16, paddingTop:16 }}>
        <Pressable
          onPress={() => router.replace('/trip/quiz')}
          accessibilityLabel={strings.voice.switchKeyboard}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width:56, height:56, borderRadius:28,
            backgroundColor:'rgba(255,255,255,0.12)',
            alignItems:'center', justifyContent:'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Keyboard size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
        </Pressable>

        <Text style={{ fontFamily:'Inter_400Regular', fontSize:13, color:'rgba(255,255,255,0.5)', textAlign:'center', flex:0 }}>
          {strings.voice.switchKeyboard}
        </Text>
      </View>
    </View>
  );
}
