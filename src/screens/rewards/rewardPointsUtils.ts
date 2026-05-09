import type { RewardDto } from '../../api/rewards';

/** Smallest reward cost strictly above balance (next unlock target), if any. */
export function nextRewardCostThreshold(
  rewards: RewardDto[],
  balance: number,
): number | null {
  const sorted = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
  const next = sorted.find((r) => r.pointsCost > balance);
  return next ? next.pointsCost : null;
}

export function balanceCaption(balance: number, rewards: RewardDto[]): string {
  const next = nextRewardCostThreshold(rewards, balance);
  if (next != null && next > balance) {
    const gap = next - balance;
    return `You're only ${gap.toLocaleString()} points away from the next tier rewards. Keep building your legacy.`;
  }
  return "You've unlocked every reward tier. Keep building your legacy.";
}

export function splitDeliveryAddress(addr: string | null): {
  label: string;
  line: string;
} {
  if (!addr?.trim()) {
    return { label: 'Delivery', line: 'Add your address in Profile' };
  }
  const lines = addr
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    return { label: lines[0], line: lines.slice(1).join(', ') };
  }
  return { label: 'Delivery', line: lines[0] };
}
