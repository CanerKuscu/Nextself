import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Observability } from './utils/observability';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CONFIG, validateEnvironment } from '@nextself/shared';

import * as Notifications from 'expo-notifications';
import { OfflineSyncService } from './services/offlineSyncService';
import { DeepLinkingService } from './utils/deepLinking';
import { OfflineService } from './utils/offlineService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from './store/authStoreSecure';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes before data is considered stale
      gcTime: 10 * 60 * 1000,    // 10 minutes before inactive queries are garbage collected
      retry: 2,                   // Retry failed queries twice
      refetchOnWindowFocus: false, // Don't refetch when app is foregrounded (mobile best practice)
    },
  },
});

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
          if (Platform.OS !== 'web') {
            const { WaterTrackingService } = require('./services/waterTrackingService');
            await WaterTrackingService.getInstance().drinkWater(ml > 0 ? ml : undefined);
          }
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
try { enableScreens(); } catch (e) { console.warn('enableScreens() failed:', e); }

if (CONFIG.IS_PRODUCTION) {
  try { validateEnvironment(); } catch (e) { console.error('Environment validation failed:', e); }
}

try { Observability.init(); } catch (e) { console.warn('Observability.init() failed:', e); }

// Initialize Offline Sync
try { OfflineSyncService.getInstance(); } catch (e) { console.warn('OfflineSyncService init failed:', e); }

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  React.useEffect(() => {
    useAuthStore.getState().initializeAuth().catch((error) => {
      console.error('Auth initialization failed:', error);
    });
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      try { OfflineService.getInstance().resume(); } catch (e) {}
      try { DeepLinkingService.getInstance().processPendingURLs(); } catch (e) {}
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <ThemeProvider>
                <ErrorBoundary>
                  <AppNavigator />
                  <StatusBar style="auto" translucent={false} />
                </ErrorBoundary>
              </ThemeProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Observability.wrapApp(App);
