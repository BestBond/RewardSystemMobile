import type { PointsTransactionType } from '../api/transactions';

export function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function activitySubtitle(site: string | null, createdAt: string): string {
  const when = formatActivityDate(createdAt);
  if (site?.trim()) return `${when} • ${site.trim()}`;
  return when;
}

export function activityIconFromType(
  type: PointsTransactionType,
  pointsDelta: number,
): 'cart' | 'rewardsEarn' | 'rewardsRedeem' {
  if (type === 'REWARD_REDEEM' || pointsDelta < 0) return 'rewardsRedeem';
  if (type === 'COUPON_SCAN') return 'cart';
  return 'rewardsEarn';
}

export function formatPointsDelta(pointsDelta: number): {
  text: string;
  positive: boolean;
} {
  const abs = Math.abs(pointsDelta);
  const fmt = abs.toLocaleString();
  if (pointsDelta > 0) return { text: `+${fmt} POINTS`, positive: true };
  if (pointsDelta < 0) return { text: `-${fmt} POINTS`, positive: false };
  return { text: '0 POINTS', positive: true };
}
