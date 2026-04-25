import React, { useState } from 'react';
import { View, TextInput, Text, ViewStyle, TextInputProps } from 'react-native';
import { colors } from '../constants/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Input({
  label,
  value,
  containerStyle,
  icon,
  trailingIcon,
  onChangeText,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value && value.length > 0;
  const isActive = focused || hasValue;

  return (
    <View
      style={[
        {
          height: 56,
          borderRadius: 12,
          paddingHorizontal: focused ? 14.5 : 16,
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? colors.brand.primary : colors.border.input,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        containerStyle,
      ]}
    >
      {icon}
      <View style={{ flex: 1 }}>
        {/* Floating label */}
        {isActive && (
          <Text
            style={{
              position: 'absolute',
              top: -26,
              left: 0,
              fontFamily: 'Inter_500Medium',
              fontSize: 11.2,
              color: focused ? colors.brand.primary : colors.text.tertiary,
              backgroundColor: '#fff',
              paddingHorizontal: 4,
            }}
          >
            {label}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isActive ? '' : label}
          placeholderTextColor={colors.text.tertiary}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: colors.text.primary,
            padding: 0,
          }}
          {...rest}
        />
      </View>
      {trailingIcon}
    </View>
  );
}
