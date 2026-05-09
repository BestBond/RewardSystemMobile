import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';

type AppButtonVariant = 'primary' | 'outlined' | 'neutral';

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: AppButtonVariant;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
};

export function AppButton({
  text,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  leftIcon,
}: Props) {
  const isPrimary = variant === 'primary';
  const isOutlined = variant === 'outlined';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isOutlined && styles.outlined,
        variant === 'neutral' && styles.neutral,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      disabled={disabled}
      onPress={onPress}>
      <View style={styles.content}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <Text
          style={[
            styles.baseText,
            isPrimary && styles.primaryText,
            isOutlined && styles.outlinedText,
            variant === 'neutral' && styles.neutralText,
          ]}>
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: figma.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primaryOrange,
    ...figma.shadowCta,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryOrange,
  },
  neutral: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  disabled: { opacity: 0.65 },
  pressed: { opacity: 0.92 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconLeft: {
    marginTop: -1,
  },
  baseText: {
    fontSize: 17,
    fontWeight: '700',
  },
  primaryText: { color: colors.white },
  outlinedText: { color: colors.navyAlt },
  neutralText: { color: colors.navyAlt },
});
