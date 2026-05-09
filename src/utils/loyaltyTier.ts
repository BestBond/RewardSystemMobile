/**
 * Tier thresholds (UI-only until backend exposes a tier program).
 * Aligns with Core Home “balance card” + progress bar.
 */
export type LoyaltyTierInfo = {
  tierLabel: string;
  /** 0–1 within current tier band */
  progress: number;
  pointsToNextReward: number;
  nextThreshold: number;
};

const STEPS: { min: number; name: string; nextThreshold: number }[] = [
  { min: 0, name: 'Bronze Member Tier', nextThreshold: 5_000 },
  { min: 5_000, name: 'Silver Member Tier', nextThreshold: 10_000 },
  { min: 10_000, name: 'Gold Member Tier', nextThreshold: 15_000 },
  { min: 15_000, name: 'Platinum Member Tier', nextThreshold: 25_000 },
];

export function loyaltyTierFromPoints(balance: number): LoyaltyTierInfo {
  const b = Math.max(0, balance);
  let idx = 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (b >= STEPS[i].min) {
      idx = i;
      break;
    }
  }
  const s = STEPS[idx];
  const next = s.nextThreshold;
  const ptsToNext = Math.max(0, next - b);
  const span = next - s.min;
  const progress =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (b - s.min) / span));
  return {
    tierLabel: s.name,
    progress,
    pointsToNextReward: ptsToNext,
    nextThreshold: next,
  };
}
