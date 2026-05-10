import { apiPost } from './client';

/**
 * OTP-only authentication (new system).
 *
 * - request OTP: POST /auth/otp/request
 * - customer signup: POST /auth/customer/otp/signup
 * - customer login:  POST /auth/customer/otp/login
 * - ops admin signup: POST /auth/admin/otp/signup (returns pending approval)
 * - staff login (superadmin/ops): POST /auth/admin/otp/login — Super Admin sends OTP + password; Ops sends OTP only
 * - superadmin signup exists but is web-only (mobile should not expose it):
 *   POST /auth/superadmin/otp/signup
 */

export type RequestOtpResponse = {
  requestId: string;
  otpSent: boolean;
  devCode?: string;
};

export type AdminOtpSignupResponse = {
  pendingApproval: boolean;
};

export type AdminOtpLoginResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export type CustomerOtpSignupResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export type CustomerOtpLoginResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export async function requestOtp(params: { phone: string; countryCode: string }) {
  return apiPost<RequestOtpResponse>('/auth/otp/request', params);
}

export async function signupAdminWithOtp(params: {
  phone: string;
  countryCode: string;
  code: string;
  fullName?: string | null;
  email?: string | null;
}) {
  return apiPost<AdminOtpSignupResponse>('/auth/admin/otp/signup', params);
}

export async function loginAdminWithOtp(params: {
  phone: string;
  countryCode: string;
  code: string;
  /** Super Admin only (min 8 chars). Omit or empty for Ops Admin. */
  password?: string;
}) {
  const { password, ...rest } = params;
  const body =
    password != null && password.trim().length > 0
      ? { ...rest, password: password.trim() }
      : rest;
  return apiPost<AdminOtpLoginResponse>('/auth/admin/otp/login', body);
}

export async function signupCustomerWithOtp(params: {
  phone: string;
  countryCode: string;
  code: string;
  fullName?: string | null;
  email?: string | null;
  profession?: string | null;
  deliveryAddress?: string | null;
}) {
  return apiPost<CustomerOtpSignupResponse>('/auth/customer/otp/signup', params);
}

export async function loginCustomerWithOtp(params: {
  phone: string;
  countryCode: string;
  code: string;
}) {
  return apiPost<CustomerOtpLoginResponse>('/auth/customer/otp/login', params);
}
