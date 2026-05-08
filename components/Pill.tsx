import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

type PillVariant = 'online' | 'offline' | 'error' | 'discount' | 'countryside' | 'custom';

interface PillProps {
  label: string;
  variant?: PillVariant;
  icon?: React.ReactNode;
  showDot?: boolean;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  height?: number;
  fontSize?: number;
}

const VARIANT_STYLES: Record<string, { bg: string; color: string }> = {
  online:      { bg: colors.status.success,  color: '#fff' },
  offline:     { bg: colors.status.warning,  color: '#1A1A1A' },
  error:       { bg: colors.status.error,    color: '#fff' },
  discount:    { bg: colors.status.warning,  color: '#1A1A1A' },
  countryside: { bg: 'rgba(255,255,255,0.92)', color: colors.brand.primary },
};

export function Pill({
  label,
  variant = 'custom',
  icon,
  showDot = false,
  backgroundColor,
  textColor,
  style,
  height = 24,
  fontSize = 12,
}: PillProps) {
  const vs = VARIANT_STYLES[variant] ?? { bg: '#E8EEF2', color: colors.brand.primary };
  const bg = backgroundColor ?? vs.bg;
  const color = textColor ?? vs.color;

  return (
    <View
      style={[
        {
          height,
          paddingHorizontal: 12,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {showDot && (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      )}
      {icon}
      <Text
        style={{
          fontFamily: variant === 'discount' || variant === 'countryside'
            ? 'Inter_600SemiBold'
            : 'Inter_500Medium',
          fontSize,
          lineHeight: fontSize * 1.1,
          letterSpacing: 0,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
