import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  text: string;
  compact?: boolean;
};

export function AppFieldLabel({ text, compact = false }: Props) {
  return <Text style={[styles.label, compact && styles.compact]}>{text}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.labelGray,
    marginBottom: 10,
  },
  compact: {
    marginBottom: 6,
  },
});
