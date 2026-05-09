import { apiGet, apiPost } from './client';

export type AdminUserListItem = {
  id: string;
  name: string;
  profession: string | null;
  walletBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
};

export type AdminUsersListResponse = {
  total: number;
  hasMore: boolean;
  items: AdminUserListItem[];
};

export type AdminUserDetail = {
  id: string;
  displayName: string;
  fullName: string | null;
  profession: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  loyaltyPoints: number;
  phone: string | null;
  deliveryAddress: string | null;
  updatedAt: string;
  createdAt: string;
};

export async function listAdminUsers(params?: {
  q?: string;
  profession?: string;
  take?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q?.trim()) q.set('q', params.q.trim());
  if (params?.profession?.trim()) q.set('profession', params.profession.trim());
  if (params?.take != null) q.set('take', String(params.take));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiGet<AdminUsersListResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getAdminUserById(id: string) {
  return apiGet<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`);
}

export type SuspendUserResponse = {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED';
};

export async function suspendAdminUser(id: string, reason?: string) {
  return apiPost<SuspendUserResponse>(
    `/admin/users/${encodeURIComponent(id)}/suspend`,
    { reason: reason ?? null },
  );
}

export async function activateAdminUser(id: string) {
  return apiPost<SuspendUserResponse>(
    `/admin/users/${encodeURIComponent(id)}/activate`,
    {},
  );
}

export type AdminUserTx = {
  id: string;
  type: 'COUPON_SCAN' | 'REWARD_REDEEM';
  title: string;
  site: string | null;
  pointsDelta: number;
  createdAt: string;
};

export type AdminUserTransactionsResponse = {
  user: {
    id: string;
    displayName: string;
    profession: string | null;
    status: 'ACTIVE' | 'SUSPENDED';
  };
  period: 'THIS_MONTH' | 'ALL';
  totalBalance: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  monthlyScans: number;
  hasMore: boolean;
  transactions: AdminUserTx[];
};

export async function getAdminUserTransactions(
  userId: string,
  params?: { period?: 'THIS_MONTH' | 'ALL'; limit?: number; offset?: number },
) {
  const q = new URLSearchParams();
  if (params?.period) q.set('period', params.period);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiGet<AdminUserTransactionsResponse>(
    `/admin/users/${encodeURIComponent(userId)}/transactions${qs ? `?${qs}` : ''}`,
  );
}

