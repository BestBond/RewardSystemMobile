import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BackArrowLeft } from '../../assets/svgs';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  align?: 'center' | 'left';
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  containerStyle?: ViewStyle;
  titleColor?: string;
};

export function AppTopBar({
  title,
  align = 'center',
  onBack,
  rightSlot,
  containerStyle,
  titleColor = colors.navyAlt,
}: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {onBack ? (
        <Pressable
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <BackArrowLeft width={22} height={22} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <Text
        style={[
          styles.title,
          align === 'left' && styles.titleLeft,
          { color: titleColor },
        ]}
        numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{rightSlot ?? <View style={styles.backSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { paddingVertical: 4, width: 24 },
  backSpacer: { width: 22 },
  rightSlot: { width: 24, alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleLeft: {
    textAlign: 'left',
    marginLeft: 8,
  },
});
