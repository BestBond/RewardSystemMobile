import { apiGet, apiPost } from './client';

export type AdminRedemptionStatus =
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type AdminRedemptionListItem = {
  id: string;
  code: string;
  points: number;
  itemName: string;
  requester: string;
  status: AdminRedemptionStatus;
  createdAt: string;
  duplicate: boolean;
  flagged: boolean;
};

export type AdminRedemptionListResponse = {
  total: number;
  hasMore: boolean;
  items: AdminRedemptionListItem[];
};

export type AdminRedemptionDetail = {
  id: string;
  code: string;
  status: AdminRedemptionStatus;
  statusLabel: string;
  statusMessage: string | null;
  flagged: boolean;
  duplicate: boolean;
  reward: {
    id: string | null;
    title: string | null;
    points: number;
    imageUrl: string | null;
  };
  requester: {
    id: string | null;
    fullName: string;
    phone: string | null;
    address: string | null;
  };
  createdAt: string;
};

export async function listAdminRedemptions(params?: {
  status?: AdminRedemptionStatus;
  sort?: 'HIGH_VALUE' | 'NEWEST';
  take?: number;
  offset?: number;
  flagged?: boolean;
  /** Used to compute “flagged” on server until persistent flags exist. */
  flagMinPoints?: number;
}) {
  const q = new URLSearchParams();
  q.set('status', params?.status ?? 'PROCESSING');
  q.set('sort', params?.sort ?? 'HIGH_VALUE');
  if (params?.take != null) q.set('take', String(params.take));
  if (params?.offset != null) q.set('offset', String(params.offset));
  if (params?.flagged) q.set('flagged', 'true');
  if (params?.flagMinPoints != null)
    q.set('flagMinPoints', String(params.flagMinPoints));
  const qs = q.toString();
  return apiGet<AdminRedemptionListResponse>(`/admin/redemptions?${qs}`);
}

export async function getAdminRedemptionById(
  id: string,
  params?: { flagMinPoints?: number },
) {
  const q = new URLSearchParams();
  if (params?.flagMinPoints != null)
    q.set('flagMinPoints', String(params.flagMinPoints));
  const qs = q.toString();
  return apiGet<AdminRedemptionDetail>(
    `/admin/redemptions/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`,
  );
}

export type ApproveAdminRedemptionResponse = {
  id: string;
  code: string;
  status: AdminRedemptionStatus;
};

export async function approveAdminRedemption(id: string) {
  return apiPost<ApproveAdminRedemptionResponse>(
    `/admin/redemptions/${encodeURIComponent(id)}/approve`,
    {},
  );
}

export type RejectAdminRedemptionResponse = {
  id: string;
  code: string;
  status: AdminRedemptionStatus;
};

export async function rejectAdminRedemption(id: string) {
  return apiPost<RejectAdminRedemptionResponse>(
    `/admin/redemptions/${encodeURIComponent(id)}/reject`,
    {},
  );
}

export type DeliverAdminRedemptionResponse = {
  id: string;
  code: string;
  status: AdminRedemptionStatus;
};

export async function deliverAdminRedemption(id: string) {
  return apiPost<DeliverAdminRedemptionResponse>(
    `/admin/redemptions/${encodeURIComponent(id)}/deliver`,
    {},
  );
}

