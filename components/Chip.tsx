import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

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
          borderWidth: selected ? 0 : 1,
          borderColor: colors.border.input,
          backgroundColor: selected ? colors.brand.primary : '#fff',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ])}
    >
      {icon}
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize,
          lineHeight: fontSize * 1.1,
          color: selected ? '#fff' : colors.text.secondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
