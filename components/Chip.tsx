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
          borderWidth: 1,
          borderColor: selected ? colors.brand.primary : colors.border.divider,
          backgroundColor: selected ? colors.brand.primary : colors.surface.card,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        !selected && shadows.card,
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
      >
        {label}
      </Text>
    </Pressable>
  );
}
