import { isApiError } from '../api/client';
import { getAccessToken, setAccessToken } from '../api/storage';
import { getAuthMe, getMyProfile } from '../api/users';
import type { RootStackParamList } from '../navigation/types';
import { isProfileComplete } from './profileCompletion';
import { pickHomeRoute } from './roleRouting';

export type AuthInitialRoute = keyof Pick<
  RootStackParamList,
  | 'Main'
  | 'AdminMain'
  | 'AdminProfileSetup'
  | 'CustomerAuth'
>;

async function meSnapshot() {
  try {
    return (await getAuthMe()).user;
  } catch {
    return null;
  }
}

/**
 * Decides first screen after splash: session + profile completeness + network.
 */
export async function resolveInitialRoute(): Promise<AuthInitialRoute> {
  const token = await getAccessToken();

  if (!token) {
    return 'CustomerAuth';
  }

  try {
    const profile = await getMyProfile();
    const me = await meSnapshot();
    const home = pickHomeRoute(profile, me ?? undefined);
    if (home === 'AdminMain') {
      return isProfileComplete(profile) ? home : 'AdminProfileSetup';
    }
    return home;
  } catch (e) {
    if (isApiError(e) && e.status === 401) {
      await setAccessToken(null);
      return 'CustomerAuth';
    }
    try {
      const me = await meSnapshot();
      if (me) return pickHomeRoute(me);
    } catch {
      /* ignore */
    }
    return 'Main';
  }
}
