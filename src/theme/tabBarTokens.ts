import { colors } from './colors';
import { figma } from './figmaTokens';

export const tabBarTokens = {
  background: 'transparent',
  borderColor: colors.borderGray,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  rowPaddingHorizontal: 0,
  itemPaddingVertical: 0,
  floatingOffsetY: -0,
  floatingSize: 48,
  floatingRadius: 16,
  floatingBg: figma.brandOrangeCTA,
  labelSize: 11,
  labelWeight: '600' as const,
  labelActiveWeight: '800' as const,
  activeColor: colors.navyAlt,
  inactiveColor: colors.mutedGray,
  floatingShadow: figma.shadowCta,
} as const;
