import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../../theme/colors';

/** Bottom of account/delivery screens (Figma cream). */
export const ACCOUNT_SCREEN_BG = '#FFF3EA';

/** Mid blend so orange fades smoothly (no hard band). */
const GRADIENT_MID = '#FFD9BF';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-screen vertical gradient: orange at top → cream at bottom.
 * Uses smooth stops only (no duplicate offsets / hard split).
 */
export function AccountGradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgLinear id="accountBgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primaryOrange} stopOpacity="1" />
            <Stop offset="0.28" stopColor={colors.primaryOrange} stopOpacity="1" />
            <Stop offset="0.52" stopColor={GRADIENT_MID} stopOpacity="1" />
            <Stop offset="1" stopColor={ACCOUNT_SCREEN_BG} stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#accountBgGrad)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ACCOUNT_SCREEN_BG,
  },
});
