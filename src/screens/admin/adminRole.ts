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
  return hasRole(snap, 'SUPERADMIN') || perms.has('rbac.manage');
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
