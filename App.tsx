import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CONFIG, validateEnvironment } from './config/config';

// Enable react-native-screens for better navigation perf
enableScreens();

if (CONFIG.IS_PRODUCTION) {
  validateEnvironment();
}

Sentry.init({
  dsn: CONFIG.SENTRY_DSN,
  debug: __DEV__,
  enabled: !__DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
});

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
                  <StatusBar style="auto" />
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
