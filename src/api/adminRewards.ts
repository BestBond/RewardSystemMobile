import { apiGet, apiPatch, apiPost } from './client';

export type GiftTier = 'WORKER' | 'CONTRACTOR';

export type AdminReward = {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  giftTier: GiftTier;
  sortOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listAdminRewards() {
  return apiGet<AdminReward[]>('/admin/rewards');
}

export async function createAdminReward(body: {
  title: string;
  description?: string | null;
  pointsCost: number;
  giftTier: GiftTier;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return apiPost<AdminReward>('/admin/rewards', body);
}

export async function updateAdminReward(
  id: string,
  body: {
    title?: string;
    description?: string | null;
    pointsCost?: number;
    giftTier?: GiftTier;
    imageUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return apiPatch<AdminReward>(`/admin/rewards/${encodeURIComponent(id)}`, body);
}

export async function toggleAdminRewardActive(id: string) {
  return apiPost<AdminReward>(
    `/admin/rewards/${encodeURIComponent(id)}/toggle-active`,
    {},
  );
}
