/**
 * Allowed coupon point tiers — keep in sync with reward-system-backend/src/coupons/coupon-tiers.ts
 */
export const ALLOWED_COUPON_POINTS = [10, 20, 30, 40, 50, 100] as const;

export type AllowedCouponPoints = (typeof ALLOWED_COUPON_POINTS)[number];

export type CouponTierTheme = {
  points: AllowedCouponPoints | null;
  label: string;
  leftBg: string;
  leftBorder: string;
  pillBg: string;
  pillBorder: string;
  /** Gradient colors for metallic tiers (40, 50, 100) */
  gradientColors?: [string, string, string];
};

const TIER_THEMES: Record<AllowedCouponPoints, CouponTierTheme> = {
  10: {
    points: 10,
    label: '10 Points',
    leftBg: '#FFFFFF',
    leftBorder: '#9CA3AF',
    pillBg: '#FFFFFF',
    pillBorder: '#9CA3AF',
  },
  20: {
    points: 20,
    label: '20 Points',
    leftBg: '#F5F0E6',
    leftBorder: '#C9A227',
    pillBg: '#F5F0E6',
    pillBorder: '#C9A227',
  },
  30: {
    points: 30,
    label: '30 Points',
    leftBg: '#D4F0E4',
    leftBorder: '#2D6A4F',
    pillBg: '#D4F0E4',
    pillBorder: '#2D6A4F',
  },
  40: {
    points: 40,
    label: '40 Points',
    leftBg: '#CD7F32',
    leftBorder: '#B8860B',
    pillBg: '#CD7F32',
    pillBorder: '#B8860B',
    gradientColors: ['#E8B88A', '#CD7F32', '#A0522D'],
  },
  50: {
    points: 50,
    label: '50 Points',
    leftBg: '#C0C0C0',
    leftBorder: '#6B7280',
    pillBg: '#C0C0C0',
    pillBorder: '#6B7280',
    gradientColors: ['#F3F4F6', '#C0C0C0', '#9CA3AF'],
  },
  100: {
    points: 100,
    label: '100 Points',
    leftBg: '#FFD700',
    leftBorder: '#B8860B',
    pillBg: '#FFD700',
    pillBorder: '#B8860B',
    gradientColors: ['#FFE566', '#FFD700', '#DAA520'],
  },
};

const LEGACY_FALLBACK: CouponTierTheme = {
  points: null,
  label: 'Coupon',
  leftBg: '#FFFFFF',
  leftBorder: '#9CA3AF',
  pillBg: '#FFFFFF',
  pillBorder: '#9CA3AF',
};

export function getCouponTierTheme(points: number): CouponTierTheme {
  if ((ALLOWED_COUPON_POINTS as readonly number[]).includes(points)) {
    return TIER_THEMES[points as AllowedCouponPoints];
  }
  return LEGACY_FALLBACK;
}

export const COUPON_SLAB_OPTIONS = ALLOWED_COUPON_POINTS;
