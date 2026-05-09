import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  onToggle: () => void;
};

export function EyeToggle({ onToggle }: Props) {
  return (
    <Pressable onPress={onToggle} hitSlop={12} style={styles.hit}>
      <Text style={styles.icon}>👁</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { padding: 4 },
  icon: {
    fontSize: 18,
    opacity: 0.65,
    color: colors.labelGray,
  },
});
