import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

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
