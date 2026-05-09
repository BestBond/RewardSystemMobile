import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';

type AppCardVariant = 'elevated' | 'outlined' | 'flat';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: AppCardVariant;
  compact?: boolean;
};

export function AppCard({
  children,
  style,
  variant = 'elevated',
  compact = false,
}: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        compact ? styles.compact : styles.regular,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: figma.radius.card,
    backgroundColor: colors.white,
  },
  regular: { padding: 20 },
  compact: { padding: 14 },
  elevated: {
    borderWidth: 1,
    borderColor: figma.borderSoft,
    ...figma.shadowSoft,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  flat: {
    borderWidth: 0,
  },
});
