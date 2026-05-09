import { apiGet, apiPost } from './client';

export type RedeemCouponResponse = {
  pointsAdded: number;
  newTotalBalance: number;
  title: string;
  site: string | null;
};

export async function redeemCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  return apiPost<RedeemCouponResponse>('/coupons/redeem', { code: normalized });
}

export type GeneratedCouponItem = {
  id: string;
  code: string;
  title: string;
  points: number;
  status: string;
  createdAt: string;
};

export type GenerateCouponBatchResponse = {
  batchId: string;
  batchNumber: number;
  createdAt: string;
  quantity: number;
  title: string;
  points: number;
  site: string | null;
  expiresAt: string | null;
  previewCodes: string[];
  items: GeneratedCouponItem[];
};

export async function generateCouponBatch(params: {
  points: number;
  quantity: number;
  title?: string;
  site?: string;
  expiresAt?: string;
}) {
  const title =
    params.title ??
    `Coupon Batch – ${params.points.toLocaleString()} pts × ${params.quantity}`;
  return apiPost<GenerateCouponBatchResponse>('/coupons/generate', {
    title,
    points: params.points,
    quantity: params.quantity,
    ...(params.site ? { site: params.site } : {}),
    ...(params.expiresAt ? { expiresAt: params.expiresAt } : {}),
  });
}

export type CouponStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

export type AdminCouponItem = {
  id: string;
  code: string;
  points: number;
  title: string;
  site: string | null;
  status: CouponStatus;
  expiresAt: string | null;
  createdAt: string;
};

export async function listCoupons(params?: {
  status?: CouponStatus;
  take?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.take != null) q.set('take', String(params.take));
  const qs = q.toString();
  return apiGet<AdminCouponItem[]>(`/coupons${qs ? `?${qs}` : ''}`);
}
