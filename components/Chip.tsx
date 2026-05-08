import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  height?: number;
  fontSize?: number;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  style,
  height = 32,
  fontSize = 13,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ([
        {
          height,
          paddingHorizontal: 14,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderWidth: selected ? 1 : 1,
          borderColor: selected ? 'rgba(255,255,255,0.38)' : colors.border.divider,
          backgroundColor: selected ? colors.brand.primary : 'rgba(255,255,255,0.96)',
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        selected ? shadows.cardElevated : shadows.card,
        style,
      ])}
    >
      {icon}
      <Text
        style={{
          fontFamily: selected ? 'Inter_700Bold' : 'Inter_500Medium',
          fontSize,
          lineHeight: fontSize * 1.1,
          letterSpacing: 0,
          color: selected ? '#fff' : colors.text.primary,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {label}
      </Text>
    </Pressable>
  );
}
