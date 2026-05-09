import { CommonActions } from '@react-navigation/native';
import type { MyProfile } from '../api/users';
import { rootNavigationRef } from '../navigation/rootNavigation';
import { pickHomeRoute } from './roleRouting';

/**
 * If the session belongs to staff (superadmin / ops admin), force the admin tab
 * shell. Call from consumer screens so older sessions self-heal without re-login.
 */
export function redirectStaffToAdminShellIfNeeded(
  profile: MyProfile,
  me?: { roles?: string[]; permissions?: string[] } | null,
): boolean {
  if (pickHomeRoute(profile, me ?? undefined) !== 'AdminMain') return false;
  if (!rootNavigationRef.isReady()) return false;
  rootNavigationRef.dispatch(
    CommonActions.reset({ index: 0, routes: [{ name: 'AdminMain' }] }),
  );
  return true;
}
