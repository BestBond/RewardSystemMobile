import { apiGet, apiPut } from './client';

export type AdminPreferences = {
  quickLoginPinEnabled: boolean;
  notifications: {
    highValueRedemptions: boolean;
    couponExportFailures: boolean;
    suspiciousUserActivity: boolean;
  };
};

export async function getAdminPreferences() {
  return apiGet<AdminPreferences>('/users/me/admin-preferences');
}

export async function updateAdminPreferences(patch: {
  quickLoginPinEnabled?: boolean;
  highValueRedemptions?: boolean;
  couponExportFailures?: boolean;
  suspiciousUserActivity?: boolean;
}) {
  return apiPut<AdminPreferences>('/users/me/admin-preferences', patch);
}

export async function changeMyPassword(params: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiPut<{ ok: true }>('/users/me/password', params);
}
