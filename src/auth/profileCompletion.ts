import type { MyProfile } from '../api/users';

/**
 * Prefer server `profileComplete` from GET /users/me/profile; fall back to field
 * checks for older API builds.
 */
export function isProfileComplete(p: MyProfile): boolean {
  if (typeof p.profileComplete === 'boolean') {
    return p.profileComplete;
  }
  return (
    Boolean(p.fullName?.trim()) && Boolean(p.deliveryAddress?.trim())
  );
}
