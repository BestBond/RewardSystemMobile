import { colors } from './colors';
import { figma } from './figmaTokens';

export const tabBarTokens = {
  background: colors.white,
  borderColor: colors.borderGray,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  rowPaddingHorizontal: 8,
  itemPaddingVertical: 4,
  floatingOffsetY: -18,
  floatingSize: 58,
  floatingRadius: 16,
  floatingBg: figma.brandOrangeCTA,
  labelSize: 11,
  labelWeight: '600' as const,
  labelActiveWeight: '800' as const,
  activeColor: colors.navyAlt,
  inactiveColor: colors.mutedGray,
  floatingShadow: figma.shadowCta,
} as const;
