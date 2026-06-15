import { NavigationProp, ParamListBase, createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/**
 * Safely navigate back, or navigate to a fallback screen if can't go back.
 * This prevents the "GO_BACK was not handled by any navigator" error.
 */
export function safeGoBack(
  navigation: NavigationProp<ParamListBase>,
  fallbackRoute?: string,
  fallbackParams?: object
): void {
  const nav: any = navigation as any;
  let current: any = nav;

  while (current) {
    try {
      const state = current.getState?.();
      const hasStackHistory = typeof state?.index === 'number' && state.index > 0;

      if (hasStackHistory || current.canGoBack?.()) {
        current.goBack?.();
        return;
      }
    } catch (e) {
      // Some navigators throw if getState/canGoBack are not available — try the parent.
      console.warn('[navigation] safeGoBack: navigator getState/canGoBack failed, trying parent:', e);
    }

    current = current.getParent?.();
  }

  if (fallbackRoute) {
    try {
      nav.navigate?.(fallbackRoute, fallbackParams);
      return;
    } catch (e) {
      console.warn(`[navigation] safeGoBack: fallback navigate('${fallbackRoute}') failed:`, e);
    }
  }

  if (navigationRef.isReady()) {
    const rootState = navigationRef.getRootState();
    if (rootState?.routeNames?.includes('Main')) {
      navigationRef.navigate('Main');
    } else if (rootState?.routeNames?.includes('Auth')) {
      navigationRef.navigate('Auth');
    }
  }
}

export function handleUnhandledNavigationAction(action: { type?: string }) {
  if (action?.type !== 'GO_BACK') {
    return;
  }

  if (!navigationRef.isReady()) {
    return;
  }

  const rootState = navigationRef.getRootState();
  if (rootState?.routeNames?.includes('Main')) {
    navigationRef.navigate('Main');
    return;
  }

  if (rootState?.routeNames?.includes('Auth')) {
    navigationRef.navigate('Auth');
  }
}
