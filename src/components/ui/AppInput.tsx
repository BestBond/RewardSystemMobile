import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

type PillInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppPillInput({ containerStyle, ...props }: PillInputProps) {
  return (
    <View style={[styles.pillWrap, containerStyle]}>
      <TextInput
        {...props}
        style={[styles.pillInput, props.style]}
        placeholderTextColor={props.placeholderTextColor ?? colors.lightGray}
      />
    </View>
  );
}

type PhoneInputProps = {
  countryCode: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
};

export function AppPhoneInput({
  countryCode,
  value,
  onChangeText,
  placeholder = 'Enter 10 digit number',
  maxLength = 10,
  autoFocus = false,
}: PhoneInputProps) {
  return (
    <View style={styles.phoneRow}>
      <View style={styles.country}>
        <Text style={styles.countryText}>{countryCode}</Text>
      </View>
      <TextInput
        style={styles.phoneInput}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        keyboardType="phone-pad"
        maxLength={maxLength}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 26,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pillInput: {
    fontSize: 16,
    color: colors.navyAlt,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  country: {
    backgroundColor: colors.codeBg,
    paddingHorizontal: 14,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  countryText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    paddingVertical: 14,
    minWidth: 44,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
