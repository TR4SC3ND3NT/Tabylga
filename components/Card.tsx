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
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(220,230,242,0.86)',
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
