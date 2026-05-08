import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { goBackOrReplace } from '../lib/navigation';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  inverse?: boolean;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  subtitle,
  backTo = '/(tabs)',
  onBack,
  right,
  inverse = false,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const foreground = inverse ? colors.text.onDark : colors.text.primary;
  const secondary = inverse ? 'rgba(250,250,247,0.68)' : colors.text.secondary;
  const buttonBg = inverse ? 'rgba(255,255,255,0.12)' : colors.surface.card;

  function goBack() {
    if (onBack) {
      onBack();
      return;
    }

    goBackOrReplace(router, backTo);
  }

  return (
    <View
      style={[
        {
          minHeight: subtitle ? 68 : 58,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderBottomWidth: inverse ? 0 : 1,
          borderBottomColor: colors.border.divider,
          backgroundColor: inverse ? colors.surface.inverse : colors.surface.primary,
        },
        style,
      ]}
    >
      <Pressable
        onPress={goBack}
        accessibilityLabel="Back"
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: buttonBg,
          opacity: pressed ? 0.72 : 1,
          borderWidth: inverse ? 1 : 0,
          borderColor: 'rgba(255,255,255,0.1)',
        })}
      >
        <ArrowLeft size={22} color={foreground} strokeWidth={1.7} />
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'Fraunces_600SemiBold',
            fontSize: 24,
            lineHeight: 29,
            color: foreground,
          }}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 1,
              fontFamily: 'Inter_500Medium',
              fontSize: 12.5,
              lineHeight: 18,
              color: secondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {right ? <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View> : <View style={{ width: 44 }} />}
    </View>
  );
}
