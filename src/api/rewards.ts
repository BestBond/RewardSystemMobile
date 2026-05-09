import { apiDelete, apiGet, apiPost } from './client';

export type RewardDto = {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RedeemResponse = {
  status: string;
  trackingId: string;
  eta: string;
};

export async function listRewards(maxPoints?: number) {
  const q =
    maxPoints != null && Number.isFinite(maxPoints)
      ? `?maxPoints=${encodeURIComponent(String(maxPoints))}`
      : '';
  return apiGet<RewardDto[]>(`/rewards${q}`);
}

export async function getWorkerRedemptionSlabs() {
  const res = await apiGet<{ slabs: number[] }>('/rewards/slabs');
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
  status: string;
  etaText: string | null;
  createdAt: string;
  reward: {
    id: string | null;
    title: string | null;
    description: string | null;
    pointsCost: number;
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
