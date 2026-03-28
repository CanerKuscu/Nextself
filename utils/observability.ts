import * as Sentry from '@sentry/react-native';
import { CONFIG } from '@nextself/shared';
import { initLogFilter } from './logFilter';

export const Observability = {
  init: () => {
    if (__DEV__) initLogFilter();

    if (CONFIG.SENTRY_DSN && CONFIG.IS_PRODUCTION) {
      Sentry.init({
        dsn: CONFIG.SENTRY_DSN,
        debug: false,
        enabled: true,
        tracesSampleRate: 0.2,
        beforeSend(event) {
          if (event.level === 'info') return null;
          return event;
        },
      });
    } else {
      Sentry.init({ dsn: '', debug: false, enabled: false, tracesSampleRate: 0 });
    }
  },

  wrapApp: (AppContent: any) => {
    return Sentry.wrap(AppContent);
  },
  
  captureException: (error: any) => {
    console.error(error);
    Sentry.captureException(error);
  },

  captureMessage: (message: string) => {
    console.log(message);
    Sentry.captureMessage(message);
  }
};
