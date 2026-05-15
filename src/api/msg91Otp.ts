/**
 * MSG91-backed OTP login (server routes: POST /otp/send, POST /otp/verify).
 *
 * Mobile format: 91 + 10-digit Indian number, e.g. 919876543210 (no + prefix).
 * On success, persist the token with `setAccessToken` from `./storage`.
 */

import { apiPost } from './client';

export type Msg91SendResponse = {
  success: true;
  data: { sent: true };
};

export type Msg91VerifyResponse = {
  success: true;
  data: {
    accessToken: string;
    roles: string[];
    permissions: string[];
    isNewUser: boolean;
  };
};

/** Request MSG91 OTP SMS for the given Indian mobile (91XXXXXXXXXX). */
export async function sendMsg91Otp(mobile: string) {
  return apiPost<Msg91SendResponse>('/otp/send', { mobile });
}

/** Verify OTP with MSG91; returns JWT + roles on success. */
export async function verifyMsg91Otp(params: { mobile: string; otp: string }) {
  return apiPost<Msg91VerifyResponse>('/otp/verify', {
    mobile: params.mobile,
    otp: params.otp.trim(),
  });
}
