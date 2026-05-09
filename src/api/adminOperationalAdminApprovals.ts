import { apiGet, apiPost } from './client';

export type PendingOperationalAdmin = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
};

export type PendingOperationalAdminsResponse = {
  total: number;
  hasMore: boolean;
  items: PendingOperationalAdmin[];
};

export async function listPendingOperationalAdmins(params?: {
  take?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.take != null) q.set('take', String(params.take));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiGet<PendingOperationalAdminsResponse>(
    `/admin/operational-admins/pending${qs ? `?${qs}` : ''}`,
  );
}

export type ApproveOperationalAdminResponse = {
  id: string;
  staffApprovedAt: string;
  staffApprovedBy: string;
};

export async function approveOperationalAdmin(userId: string) {
  return apiPost<ApproveOperationalAdminResponse>(
    `/admin/operational-admins/${encodeURIComponent(userId)}/approve`,
    {},
  );
}

