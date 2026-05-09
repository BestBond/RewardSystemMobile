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

export function isOperationalAdmin(
  snap: AdminRoleSnapshot | null | undefined,
) {
  const perms = new Set((snap?.permissions ?? []).map(p => String(p)));
  return (
    hasRole(snap, 'OPERATIONAL_ADMIN') ||
    perms.has('users.manage') ||
    perms.has('redemptions.deliver')
  );
}

export function isOperationalOnly(
  snap: AdminRoleSnapshot | null | undefined,
) {
  return isOperationalAdmin(snap) && !isSuperAdmin(snap);
}
