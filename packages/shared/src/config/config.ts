import Constants from 'expo-constants';

// For React Native/Expo, we use expo-constants instead of dotenv
// dotenv uses Node.js core modules which are not available in React Native

// Environment — use __DEV__ which is reliably set by the bundler in React Native
const IS_DEV = __DEV__;
const IS_PRODUCTION = !__DEV__;

export const CONFIG = {
  // Supabase Configuration — read from env variables via app.config.js
  SUPABASE_URL: (() => {
    const url = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      if (__DEV__) {
        console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not set. Please set it in your .env file.');
        return '';
      } else {
        throw new Error('EXPO_PUBLIC_SUPABASE_URL is required in production.');
      }
    }
    return url.trim();
  })(),
  SUPABASE_PUBLISHABLE_KEY: (() => {
    const key = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) {
      if (__DEV__) {
        console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Please set it in your .env file.');
        return '';
      } else {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required in production.');
      }
    }
    return key.trim();
  })(),
  ENCRYPTION_KEY: (() => {
    // NOTE: Client-side encryption keys MUST NOT be embedded in production client builds.
    // Prefer server-side encryption (Edge Functions / KMS). If a key is provided during
    // development via `EXPO_PUBLIC_ENCRYPTION_KEY`, allow it for tests/dev only but
    // do NOT crash production builds here. Consumers should perform sensitive encryption
    // server-side.
    const envKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

    if (!envKey) {
      if (IS_DEV) {
        console.warn('⚠️ EXPO_PUBLIC_ENCRYPTION_KEY is not set. Client-side encryption disabled; use server-side encryption for production.');
      } else {
        console.warn('⚠️ EXPO_PUBLIC_ENCRYPTION_KEY is not set. Client-side encryption should not be used in production. Use server-side encryption (Edge Functions/KMS).');
      }
      return '';
    }

    // Protection: Do NOT allow embedding an encryption key into production client builds.
    if (IS_PRODUCTION) {
      throw new Error('EXPO_PUBLIC_ENCRYPTION_KEY must NOT be set in production builds. Use server-side encryption (Edge Functions/KMS) and a secure key store.');
    }

    // Validate key length (should be 32 bytes for AES-256)
    if (envKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long for AES-256 encryption.');
    }

    return envKey;
  })(),

  // App Configuration
  APP_NAME: 'NextSelf',
  SUPPORTED_LANGUAGES: ['en', 'tr', 'ru'] as const,
  DEFAULT_LANGUAGE: 'en',
  FREE_FOOD_SCANS_PER_DAY: 2,
  COMMISSION_RATE: 0.1,

  // Environment flags
  IS_DEV: IS_DEV,
  IS_PRODUCTION: IS_PRODUCTION,
  MOCK_PAYMENTS: process.env.EXPO_PUBLIC_MOCK_PAYMENTS === 'true' || IS_DEV,

  // Security - HTTPS enabled by default in production
  REQUIRE_HTTPS: !__DEV__,

  // API Configuration
  API_BASE_URL: (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.nextself.com').trim(),

  // Database table names (allow overriding via expo config or env for different schemas)
  SUBSCRIPTIONS_TABLE: (() => {
    return Constants.expoConfig?.extra?.subscriptionsTable || process.env.EXPO_PUBLIC_SUBSCRIPTIONS_TABLE || 'user_subscriptions';
  })(),
  SUBSCRIPTION_PLANS_TABLE: (() => {
    return Constants.expoConfig?.extra?.subscriptionPlansTable || process.env.EXPO_PUBLIC_SUBSCRIPTION_PLANS_TABLE || 'subscription_plans';
  })(),

  // Analytics
  ANALYTICS_ENABLED: !__DEV__,
  ANALYTICS_API_KEY: process.env.EXPO_PUBLIC_ANALYTICS_API_KEY || '',

  // Sentry — DSN must be set via EXPO_PUBLIC_SENTRY_DSN environment variable
  SENTRY_DSN: (() => {
    const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      if (IS_PRODUCTION) {
        throw new Error('EXPO_PUBLIC_SENTRY_DSN is required in production for error tracking.');
      }
      // Development: allow empty but warn
      console.warn('⚠️ EXPO_PUBLIC_SENTRY_DSN is not set. Sentry error tracking is disabled.');
      return '';
    }
    return dsn.trim();
  })(),
};

/**
 * Runtime environment validation.
 * Call this function early in app startup to ensure required environment variables are set.
 */
export function validateEnvironment() {
  if (!CONFIG.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured.');
  }
  if (!CONFIG.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY is not configured.');
  }
  // Client-side encryption keys should not be required here. Ensure server-side
  // encryption and key management (Edge Functions/KMS) are configured for production.
  if (CONFIG.IS_PRODUCTION && !process.env.EXPO_PUBLIC_ENCRYPTION_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_ENCRYPTION_KEY is not configured. Ensure server-side encryption is configured.');
  }
  // In production, ensure Sentry DSN is set for error tracking
  if (CONFIG.IS_PRODUCTION && !CONFIG.SENTRY_DSN) {
    throw new Error('EXPO_PUBLIC_SENTRY_DSN is required in production for crash reporting.');
  }
}
