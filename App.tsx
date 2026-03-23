import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import { enableScreens } from 'react-native-screens';
import { initLogFilter } from './utils/logFilter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CONFIG, validateEnvironment } from '@nextself/shared';

import * as Notifications from 'expo-notifications';
import { WaterTrackingService } from './services/waterTrackingService';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

const setupBackgroundNotificationTask = () => {
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const ownership = Constants.appOwnership;
  if (!isNative || ownership === 'expo') return;
  let TaskManager: typeof import('expo-task-manager') | undefined;
  try {
    TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  } catch {
    return;
  }
  if (!TaskManager) return;
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Background notification task error:', error);
      return;
    }
    if (data) {
      const response = (data as any)?.notificationResponse as Notifications.NotificationResponse;
      const action = response?.actionIdentifier;
      const contentData = response?.notification?.request?.content?.data as any;
      if (action === 'drank_water' && contentData?.type === 'water') {
        const ml = Number(contentData?.mlAmount || 0);
        try {
          await WaterTrackingService.getInstance().drinkWater(ml > 0 ? ml : undefined);
        } catch (e) {
          console.error('Background water track failed', e);
        }
      }
    }
  });
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
};

setupBackgroundNotificationTask();

// Enable react-native-screens for better navigation perf
enableScreens();

// Initialize selective log filtering early to reduce noisy dev output
if (__DEV__) initLogFilter();

if (CONFIG.IS_PRODUCTION) {
  validateEnvironment();
}

// Initialize Sentry only when a DSN is provided for production builds.
// Also keep `debug` off to avoid SDK internal logging in development,
// and avoid performance tracing in non-production to reduce noise.
if (CONFIG.SENTRY_DSN && CONFIG.IS_PRODUCTION) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    debug: false,
    enabled: true,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Drop low severity info events from being sent
      if (event.level === 'info') return null;
      return event;
    },
  });
} else {
  // Ensure SDK does not emit debug logs when not configured for production
  Sentry.init({ dsn: '', debug: false, enabled: false, tracesSampleRate: 0 });
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <SupabaseProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <ThemeProvider>
                  <AppNavigator />
                  <StatusBar style="auto" translucent={false} />
                </ThemeProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </SupabaseProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
