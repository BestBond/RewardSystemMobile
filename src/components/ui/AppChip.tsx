import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type AppChipVariant = 'accent' | 'muted' | 'success' | 'danger';

type Props = {
  text: string;
  variant?: AppChipVariant;
  style?: StyleProp<ViewStyle>;
};

export function AppChip({ text, variant = 'muted', style }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'accent' && styles.accent,
        variant === 'muted' && styles.muted,
        variant === 'success' && styles.success,
        variant === 'danger' && styles.danger,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          variant === 'accent' && styles.accentText,
          variant === 'muted' && styles.mutedText,
          variant === 'success' && styles.successText,
          variant === 'danger' && styles.dangerText,
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  accent: { backgroundColor: colors.badgeTint },
  muted: { backgroundColor: colors.offWhite },
  success: { backgroundColor: '#E8F5E9' },
  danger: { backgroundColor: '#FEE2E2' },
  accentText: { color: colors.navyAlt },
  mutedText: { color: colors.mutedGray },
  successText: { color: colors.pointsGreen },
  dangerText: { color: colors.pointsDebit },
});
