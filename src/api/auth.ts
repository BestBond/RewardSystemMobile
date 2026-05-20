import { apiPost } from './client';

/**
 * Mobile + 6-digit passcode authentication.
 *
 * - customer signup: POST /auth/customer/passcode/signup
 * - customer login:  POST /auth/customer/passcode/login
 * - ops admin signup: POST /auth/admin/passcode/signup (returns pending approval)
 * - staff login (superadmin/ops): POST /auth/admin/passcode/login
 * - superadmin signup exists but is web-only (mobile should not expose it):
 *   POST /auth/superadmin/passcode/signup
 */

export type AdminPasscodeSignupResponse = {
  pendingApproval: boolean;
};

export type AdminPasscodeLoginResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export type CustomerPasscodeSignupResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export type CustomerPasscodeLoginResponse = {
  accessToken: string;
  roles?: string[];
  permissions?: string[];
};

export async function signupAdminWithPasscode(params: {
  phone: string;
  countryCode: string;
  passcode: string;
  confirmPasscode: string;
  fullName?: string | null;
  email?: string | null;
}) {
  return apiPost<AdminPasscodeSignupResponse>('/auth/admin/passcode/signup', params);
}

export async function loginAdminWithPasscode(params: {
  phone: string;
  countryCode: string;
  passcode: string;
}) {
  return apiPost<AdminPasscodeLoginResponse>('/auth/admin/passcode/login', params);
}

export async function signupCustomerWithPasscode(params: {
  phone: string;
  countryCode: string;
  passcode: string;
  confirmPasscode: string;
  fullName?: string | null;
  email?: string | null;
  profession?: string | null;
  deliveryAddress?: string | null;
}) {
  return apiPost<CustomerPasscodeSignupResponse>(
    '/auth/customer/passcode/signup',
    params,
  );
}

export async function loginCustomerWithPasscode(params: {
  phone: string;
  countryCode: string;
  passcode: string;
}) {
  return apiPost<CustomerPasscodeLoginResponse>(
    '/auth/customer/passcode/login',
    params,
  );
}
