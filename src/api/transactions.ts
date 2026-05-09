import { apiGet } from './client';

export type PointsTransactionType = 'COUPON_SCAN' | 'REWARD_REDEEM';

export type MyTransactionsResponse = {
  period: 'THIS_MONTH' | 'ALL';
  totalPointsEarned: number;
  totalPointsSpent: number;
  /** True when more rows exist after this page (use offset + limit). */
  hasMore?: boolean;
  transactions: {
    id: string;
    type: PointsTransactionType;
    title: string;
    site: string | null;
    pointsDelta: number;
    createdAt: string;
  }[];
};

export async function getMyTransactions(params?: {
  period?: 'THIS_MONTH' | 'ALL';
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.period) q.set('period', params.period);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiGet<MyTransactionsResponse>(
    `/transactions/me${qs ? `?${qs}` : ''}`,
  );
}
