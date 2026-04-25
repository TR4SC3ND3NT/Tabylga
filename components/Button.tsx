import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';

type ButtonVariant = 'primary' | 'cta' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  height?: number;
  fontSize?: number;
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: TextStyle; shadow?: ViewStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.brand.primary,
    },
    text: { color: '#fff' },
  },
  cta: {
    container: {
      backgroundColor: colors.brand.cta,
    },
    text: { color: '#fff' },
    shadow: shadows.floating,
  },
  secondary: {
    container: {
      backgroundColor: '#fff',
      borderWidth: 1.5,
      borderColor: colors.brand.primary,
    },
    text: { color: colors.brand.primary },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: colors.brand.primary },
  },
};

export function Button({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  icon,
  style,
  height,
  fontSize,
  accessibilityLabel,
}: ButtonProps) {
  const vs = VARIANT_STYLES[variant];
  const h = height ?? (variant === 'secondary' ? 52 : 56);
  const fs = fontSize ?? 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      style={({ pressed }) => ([
        {
          width: '100%',
          height: h,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        vs.container,
        vs.shadow,
        style,
      ])}
    >
      {icon}
      <Text
        style={[
          {
            fontFamily: 'Inter_600SemiBold',
            fontSize: fs,
            lineHeight: fs * 1.1,
          },
          vs.text,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
