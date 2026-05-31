export type AdminRoleSnapshot = {
  roles?: string[];
  permissions?: string[];
};

export function hasRole(
  snap: AdminRoleSnapshot | null | undefined,
  role: string,
) {
  const roles = snap?.roles ?? [];
  return roles.some(r => String(r).toUpperCase() === role.toUpperCase());
}

export function isSuperAdmin(
  snap: AdminRoleSnapshot | null | undefined,
) {
  const perms = new Set((snap?.permissions ?? []).map(p => String(p)));
  return (
    hasRole(snap, 'SUPERADMIN') ||
    perms.has('rbac.manage') ||
    perms.has('users.manage') ||
    perms.has('rewards.manage') ||
    perms.has('coupons.manage')
  );
}

/** Matches backend full-admin gate: worker-app + dealer queues (not ops-only). */
export function canManageAllRedemptionChannels(
  snap: AdminRoleSnapshot | null | undefined,
) {
  const perms = new Set((snap?.permissions ?? []).map(p => String(p)));
  return perms.has('users.manage') || perms.has('rbac.manage');
}

export function isOperationalAdmin(
  snap: AdminRoleSnapshot | null | undefined,
) {
  const perms = new Set((snap?.permissions ?? []).map(p => String(p)));
  return (
    hasRole(snap, 'OPERATIONAL_ADMIN') ||
    hasRole(snap, 'SUPERADMIN') ||
    perms.has('users.manage') ||
    perms.has('dealer.redemptions.manage') ||
    perms.has('redemptions.deliver')
  );
}

export function isOperationalOnly(
  snap: AdminRoleSnapshot | null | undefined,
) {
  return isOperationalAdmin(snap) && !isSuperAdmin(snap);
}

/**
 * User profile UI: profession labels for staff accounts that cannot be suspended
 * (aligned with backend SUPERADMIN / OPERATIONAL_ADMIN roles).
 */
export function isStaffAdminProfessionLabel(
  profession: string | null | undefined,
): boolean {
  if (!profession?.trim()) return false;
  const n = profession.trim().toLowerCase();
  if (n.includes('super admin')) return true;
  if (n.includes('superadmin')) return true;
  if (n.includes('operational admin')) return true;
  if (n.includes('operational_admin')) return true;
  return false;
}

/** Matches GET /admin/dashboard — backend allows users.manage, dealer.redemptions.manage, or rbac.manage. */
export function canAccessAdminDashboardApi(
  snap: AdminRoleSnapshot | null | undefined,
) {
  const perms = new Set((snap?.permissions ?? []).map(p => String(p)));
  return (
    perms.has('users.manage') ||
    perms.has('dealer.redemptions.manage') ||
    perms.has('rbac.manage')
  );
}
