import { apiPost } from './client';

/**
 * OTP-only authentication (new system).
 *
 * - request OTP: POST /auth/otp/request
 * - customer signup: POST /auth/customer/otp/signup
 * - customer login:  POST /auth/customer/otp/login
 * - ops admin signup: POST /auth/admin/otp/signup (returns pending approval)
 * - staff login (superadmin/ops): POST /auth/admin/otp/login (ops gated by approval)
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
}) {
  return apiPost<AdminOtpLoginResponse>('/auth/admin/otp/login', params);
}

export async function signupCustomerWithOtp(params: {
  phone: string;
  countryCode: string;
  code: string;
  fullName?: string | null;
  email?: string | null;
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

