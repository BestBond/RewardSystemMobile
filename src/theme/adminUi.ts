import { colors } from './colors';
import { figma } from './figmaTokens';

/** Superadmin shell — aligned with figmadesign/SuperAdmin */
export const adminUi = {
  ...colors,
  screenBg: figma.screenMuted,
  cardBg: '#FFFFFF',
  creamCard: '#FAF6F1',
  creamCardBorder: 'rgba(240, 129, 61, 0.18)',
  sectionTitle: figma.textTitle,
  labelMuted: figma.textMuted,
  roleAccent: figma.roleAccent,
  suspendAccent: figma.suspend,
  accentOrange: figma.brandOrange,
  successGreen: figma.success,
  successBg: figma.successBg,
  dangerBrown: figma.suspend,
  radiusLg: figma.radiusScreenCard,
  radiusHeroCard: figma.radiusHeroCard,
  radiusMd: 16,
  radiusPill: 999,
  shadowCard: figma.shadowSoft,
  shadowActionCard: figma.shadowActionCard,
  shadowCta: figma.shadowCta,
  engageCardBg: figma.engageCardBg,
  engageBadgeBg: figma.engageBadgeBg,
  borderSoft: figma.borderSoft,
} as const;
