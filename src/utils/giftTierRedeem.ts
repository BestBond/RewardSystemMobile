import type { GiftTier } from '../api/rewards';

/** Contractors may redeem Worker-tier gifts; Worker users cannot redeem Contractor-tier gifts. */
export function canRedeemGiftTier(
  userTier: GiftTier,
  rewardTier: GiftTier,
): boolean {
  return userTier === 'CONTRACTOR' || rewardTier === 'WORKER';
}

export const CONTRACTOR_TIER_THRESHOLD = 120_000;
