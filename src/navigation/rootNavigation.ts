import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

function loginRouteAfterSessionLoss(): keyof RootStackParamList {
  const state = rootNavigationRef.getRootState();
  const name = state?.routes[state?.index ?? 0]?.name;
  if (
    name === 'AdminMain' ||
    name === 'AdminProfileSetup' ||
    name === 'PendingApproval' ||
    name === 'OpsAdminSignUp'
  ) {
    return 'AdminLogin';
  }
  return 'CustomerAuth';
}

/**
 * After the backend rejects the JWT (401), send the user to the right login stack.
 * Retries briefly if the container is not mounted yet.
 */
export function resetAuthAfterSessionExpired() {
  const dispatch = () => {
    if (!rootNavigationRef.isReady()) return false;
    rootNavigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: loginRouteAfterSessionLoss() }],
      }),
    );
    return true;
  };

  if (dispatch()) return;

  const started = Date.now();
  const id = setInterval(() => {
    if (dispatch() || Date.now() - started > 4000) clearInterval(id);
  }, 50);
}

export function resetToLogin() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] }),
    );
  }
}

/** Account Management → Edit profile (same form as onboarding). */
export function navigateToProfileEdit() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate('ProfileSetup', { edit: true });
  }
}
