import { StackActions } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

function stackIndex(navigation: NavigationProp<ParamListBase>): number {
  const state = navigation.getState();
  if (state && typeof state.index === 'number') {
    return state.index;
  }
  return 0;
}

function mainTabNavigator(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<ParamListBase> | undefined {
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  for (let i = 0; i < 6 && nav; i++) {
    const names = nav.getState()?.routeNames ?? [];
    if (names.includes('Home') && names.includes('Cart')) {
      return nav;
    }
    nav = nav.getParent();
  }
  return undefined;
}

/**
 * Reliable back for customer Main tabs: pop within the current stack first;
 * at a tab stack root, switch to Home instead of popping tab history (which
 * often jumps to an arbitrary previous tab or does nothing).
 */
export function goBackInApp(navigation: NavigationProp<ParamListBase>) {
  if (stackIndex(navigation) > 0) {
    navigation.goBack();
    return;
  }

  const tabs = mainTabNavigator(navigation);
  if (tabs) {
    tabs.navigate('Home');
    return;
  }

  if (navigation.canGoBack()) {
    navigation.goBack();
  }
}

/** After redemption success: clear the cart stack and return to Rewards. */
export function dismissRewardSuccess(navigation: NavigationProp<ParamListBase>) {
  if (stackIndex(navigation) > 0) {
    navigation.dispatch(StackActions.popToTop());
  }
  const tabs = mainTabNavigator(navigation);
  if (tabs) {
    tabs.navigate('Rewards');
    return;
  }
  goBackInApp(navigation);
}
