import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Refetch when the screen is focused or the app returns to the foreground,
 * so updates from other devices/sessions are picked up without a cold restart.
 */
export function useRefreshOnFocusAndForeground(
  refresh: () => void | Promise<void>,
): void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const run = useCallback(() => {
    void Promise.resolve(refreshRef.current());
  }, []);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') run();
    });
    return () => sub.remove();
  }, [run]);
}
