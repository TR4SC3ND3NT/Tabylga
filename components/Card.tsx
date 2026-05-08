import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border.divider,
          overflow: 'hidden',
        },
        elevated ? shadows.cardElevated : shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
