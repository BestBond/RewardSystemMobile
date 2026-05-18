import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type AppChipVariant = 'accent' | 'muted' | 'success' | 'danger';

type Props = {
  text: string;
  variant?: AppChipVariant;
  style?: StyleProp<ViewStyle>;
};

export function AppChip({ text }: Props) {
  return (
     
      <Text style={styles.text}>
        {text}
      </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: {
    fontSize: 16,
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
