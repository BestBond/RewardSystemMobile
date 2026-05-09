import type { MyProfile } from '../api/users';

const ADMIN_ROLES = new Set(['SUPERADMIN', 'OPERATIONAL_ADMIN']);

/** Same gate as admin dashboard API (`users.manage`). */
const STAFF_PERMISSIONS = new Set(['users.manage', 'rbac.manage']);

export function isStaffAdmin(
  profile: Pick<MyProfile, 'roles' | 'permissions'>,
): boolean {
  const perms = profile.permissions ?? [];
  if (perms.some(p => STAFF_PERMISSIONS.has(String(p)))) return true;
  const roles = profile.roles;
  if (!roles?.length) return false;
  return roles.some(r => ADMIN_ROLES.has(String(r).toUpperCase()));
}

export function homeStackRoute(profile: MyProfile): 'Main' | 'AdminMain' {
  return isStaffAdmin(profile) ? 'AdminMain' : 'Main';
}

/** Merge multiple RBAC snapshots (e.g. login body + GET profile). */
export function pickHomeRoute(
  ...parts: Array<
    { roles?: string[]; permissions?: string[] } | null | undefined
  >
): 'Main' | 'AdminMain' {
  const roles = [...new Set(parts.flatMap(p => p?.roles ?? []))];
  const permissions = [...new Set(parts.flatMap(p => p?.permissions ?? []))];
  return isStaffAdmin({ roles, permissions }) ? 'AdminMain' : 'Main';
}
