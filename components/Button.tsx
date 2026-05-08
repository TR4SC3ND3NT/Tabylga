import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle } from 'react-native';
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
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.26)',
    },
    text: { color: '#fff' },
    shadow: shadows.cardElevated,
  },
  cta: {
    container: {
      backgroundColor: colors.brand.cta,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    text: { color: '#fff' },
    shadow: shadows.floating,
  },
  secondary: {
    container: {
      backgroundColor: colors.surface.card,
      borderWidth: 1.5,
      borderColor: 'rgba(19,104,242,0.18)',
    },
    text: { color: colors.brand.primary },
    shadow: shadows.card,
  },
  ghost: {
    container: {
      backgroundColor: colors.brand.primaryLight,
      borderWidth: 1,
      borderColor: 'rgba(19,104,242,0.12)',
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
          alignSelf: 'stretch',
          height: h,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          paddingHorizontal: label ? 18 : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.965 : 1 }],
          overflow: 'hidden',
        },
        vs.container,
        vs.shadow,
        style,
      ])}
    >
      {icon}
      {(variant === 'primary' || variant === 'cta') && label ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -32,
            top: 4,
            width: 118,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(255,255,255,0.17)',
            transform: [{ rotate: '-18deg' }],
          }}
        />
      ) : null}
      {(variant === 'primary' || variant === 'cta') && label ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 10,
            bottom: 7,
            width: 34,
            height: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.22)',
          }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
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
