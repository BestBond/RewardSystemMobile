import { API_BASE_URL } from './config';
import { apiDelete, apiGet, apiPost } from './client';

export type GiftTier = 'WORKER' | 'CONTRACTOR';

export type RewardDto = {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  giftTier?: GiftTier;
  sortOrder?: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Wallet tier allows redeeming this gift's catalog tier. */
  tierRedeemable?: boolean;
  /** Balance sufficient and tierRedeemable. */
  eligible?: boolean;
};

export type GiftTierInfo = {
  giftTier: GiftTier;
  loyaltyPoints: number;
  contractorThreshold: number;
  pointsExpiresAt?: string | null;
  pointsExpireInDays?: number | null;
};

export type RedeemResponse = {
  status: string;
  trackingId: string;
  eta: string;
};

export function resolveRewardImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl?.trim()) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${base}${path}`;
}

export async function listRewards(maxPoints?: number) {
  const q =
    maxPoints != null && Number.isFinite(maxPoints)
      ? `?maxPoints=${encodeURIComponent(String(maxPoints))}`
      : '';
  return apiGet<RewardDto[]>(`/rewards${q}`);
}

export async function getMyGiftTier() {
  return apiGet<GiftTierInfo>('/rewards/me/tier');
}

export async function getWorkerRedemptionSlabs() {
  const res = await apiGet<{ slabs: number[]; giftTier?: GiftTier | null }>(
    '/rewards/slabs',
  );
  return res.slabs ?? [];
}

export async function getReward(id: string) {
  return apiGet<RewardDto>(`/rewards/${encodeURIComponent(id)}`);
}

export async function redeemReward(
  rewardId: string,
  body?: { deliveryLabel?: string | null; deliveryAddress?: string | null },
) {
  return apiPost<RedeemResponse>(
    `/rewards/${encodeURIComponent(rewardId)}/redeem`,
    body ?? {},
  );
}

export type RedemptionListItem = {
  id: string;
  trackingId: string;
  pointsCost: number;
  deliveryLabel: string | null;
  deliveryAddress: string | null;
  /** DEALER_STORE: in-store pickup after ops approves. CUSTOMER_APP: shipped delivery. */
  channel?: 'CUSTOMER_APP' | 'DEALER_STORE';
  status: string;
  etaText: string | null;
  createdAt: string;
  reward: {
    id: string | null;
    title: string | null;
    description: string | null;
    pointsCost: number;
    giftTier?: GiftTier | null;
    imageUrl?: string | null;
  };
};

export async function listMyRedemptions() {
  return apiGet<RedemptionListItem[]>('/rewards/me/redemptions');
}

export async function cancelMyRedemption(redemptionId: string) {
  return apiDelete<{ id: string; status: string }>(
    `/rewards/me/redemptions/${encodeURIComponent(redemptionId)}/cancel`,
  );
}
