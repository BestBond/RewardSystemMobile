import { apiGet, apiPut } from './client';

/**
 * Authenticated profile (JWT from pin flow or email login).
 * Used after OTP/PIN onboarding and from Home / Profile tabs.
 *
 * - GET  /users/me/profile — read profile
 * - PUT  /users/me/profile — update (Profile setup screen)
 */

export type MyProfile = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  profession: string | null;
  deliveryAddress: string | null;
  loyaltyPoints: number;
  memberSinceYear: number | null;
  /** From GET/PUT /users/me/profile — authoritative when present. */
  profileComplete?: boolean;
  /** RBAC role names, e.g. SUPERADMIN, CUSTOMER */
  roles?: string[];
  permissions?: string[];
};

export async function getMyProfile() {
  return apiGet<MyProfile>('/users/me/profile');
}

export type AuthMeUser = {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
};

/** Lightweight RBAC snapshot (same as JWT `req.user`). */
export async function getAuthMe() {
  return apiGet<{ user: AuthMeUser | null }>('/users/me');
}

export async function updateMyProfile(params: {
  fullName?: string;
  profession?: string;
  deliveryAddress?: string;
}) {
  return apiPut<MyProfile>('/users/me/profile', params);
}

