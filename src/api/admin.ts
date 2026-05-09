import { apiGet } from './client';

export type AdminDashboardResponse = {
  pendingApprovalsCount: number;
  pendingOpsAdminApprovalsCount: number;
  pointsIssued: {
    totalLast7Days: number;
    percentVsPriorWeek: number;
  };
  pointsRedeemed: {
    totalLast7Days: number;
    percentVsPriorWeek: number;
  };
  activeUsers: {
    countLast7Days: number;
    dailyActiveUsersLast5Days: number[];
  };
  couponsScannedToday: {
    count: number;
    last5MinutesCount: number;
  };
};

export async function getAdminDashboard() {
  return apiGet<AdminDashboardResponse>('/admin/dashboard');
}
