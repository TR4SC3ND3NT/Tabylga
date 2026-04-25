import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  actionLabel = 'See all',
  onAction,
  style,
}: SectionHeaderProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginTop: 28,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
          lineHeight: 25.2,
          color: colors.text.primary,
        }}
      >
        {title}
      </Text>
      {onAction && (
        <Pressable onPress={onAction} accessibilityRole="link">
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              lineHeight: 14,
              color: colors.brand.primary,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
