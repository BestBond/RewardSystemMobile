import { apiPost } from './client';

export type CreateOperationalAdminResponse = {
  userId: string;
  email: string;
  tempPassword: string;
  role: string;
};

export async function createOperationalAdmin(params: {
  email: string;
  tempPassword?: string;
}) {
  return apiPost<CreateOperationalAdminResponse>('/admin/operational-admins', {
    email: params.email,
    ...(params.tempPassword ? { tempPassword: params.tempPassword } : {}),
  });
}
