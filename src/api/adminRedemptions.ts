import { apiGet, apiPost } from './client';

export type AdminRedemptionStatus =
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type AdminRedemptionChannel = 'CUSTOMER_APP' | 'DEALER_STORE';

export type AdminRedemptionListItem = {
  id: string;
  code: string;
  points: number;
  itemName: string;
  requester: string;
  status: AdminRedemptionStatus;
  channel?: AdminRedemptionChannel;
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
  channel?: AdminRedemptionChannel;
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
  /** Superadmin: filter channel; ops always see dealer store only. */
  channel?: 'DEALER_STORE' | 'CUSTOMER_APP' | 'ALL';
}) {
  const q = new URLSearchParams();
  q.set('status', params?.status ?? 'PROCESSING');
  q.set('sort', params?.sort ?? 'HIGH_VALUE');
  if (params?.take != null) q.set('take', String(params.take));
  if (params?.offset != null) q.set('offset', String(params.offset));
  if (params?.flagged) q.set('flagged', 'true');
  if (params?.flagMinPoints != null)
    q.set('flagMinPoints', String(params.flagMinPoints));
  if (params?.channel && params.channel !== 'ALL')
    q.set('channel', params.channel);
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

export type DealerSearchItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  loyaltyPoints: number;
};

export type DealerSearchResponse = {
  total: number;
  hasMore: boolean;
  items: DealerSearchItem[];
};

export async function searchAdminDealers(params?: {
  q?: string;
  take?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q != null && params.q.trim()) q.set('q', params.q.trim());
  if (params?.take != null) q.set('take', String(params.take));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiGet<DealerSearchResponse>(
    `/admin/dealers${qs ? `?${qs}` : ''}`,
  );
}

export type CreateDealerRedemptionResponse = {
  id: string;
  trackingId: string;
  status: AdminRedemptionStatus;
  channel: AdminRedemptionChannel;
};

export async function createDealerStoreRedemption(body: {
  dealerUserId: string;
  rewardId: string;
  deliveryLabel?: string | null;
  deliveryAddress?: string | null;
}) {
  return apiPost<CreateDealerRedemptionResponse>(
    '/admin/dealer-redemptions',
    body,
  );
}

