import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import PlatformStorage from '@nextself/shared';
import * as Localization from 'expo-localization';
import { translations, Language, TranslationKey } from '../locales/i18n';
import { NotificationService } from '../services/notificationService';
import { CurrencyCode, CURRENCIES } from '../contexts/CurrencyContext';
import { COLORS, DARK_COLORS } from '../config/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  themeMode: ThemeMode;
  currency: CurrencyCode;
  language: Language;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setCurrency: (code: CurrencyCode) => void;
  setLanguage: (lang: Language) => Promise<void>;
  
  // Helpers that don't need to be in state but are useful
  initApp: () => Promise<void>;
}

const SUPPORTED_LANGUAGES: Language[] = ['en', 'tr', 'ru'];
const LANGUAGE_TO_CURRENCY: Record<string, CurrencyCode> = {
    tr: 'TRY',
    ru: 'RUB',
    en: 'USD',
    de: 'EUR',
    fr: 'EUR',
    es: 'EUR',
    it: 'EUR',
    ar: 'AED',
};

const getDeviceLanguage = (): Language => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode?.toLowerCase();
      if (deviceLang && SUPPORTED_LANGUAGES.includes(deviceLang as Language)) {
        return deviceLang as Language;
      }
    }
  } catch {}
  return 'en';
};

const getDeviceCurrency = (): CurrencyCode => {
    try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
            const region = locales[0].regionCode?.toUpperCase();
            if (region === 'TR') return 'TRY';
            if (region === 'RU') return 'RUB';
            if (region === 'GB') return 'GBP';
            if (region === 'AE') return 'AED';
            if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT', 'IE', 'GR'].includes(region || '')) return 'EUR';

            const lang = locales[0].languageCode?.toLowerCase();
            if (lang && LANGUAGE_TO_CURRENCY[lang]) {
                return LANGUAGE_TO_CURRENCY[lang];
            }
        }
    } catch { }
    return 'USD';
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      currency: getDeviceCurrency(),
      language: getDeviceLanguage(),

      setThemeMode: (mode) => set({ themeMode: mode }),
      setCurrency: (code) => set({ currency: code }),
      setLanguage: async (lang) => {
        set({ language: lang });
        try {
          await NotificationService.getInstance().rescheduleAll(lang);
        } catch (e) {
          console.error('Failed to reschedule notifications:', e);
        }
      },
      initApp: async () => {
        // Initialization if needed
      }
    }),
    {
      name: 'NextSelf-app-storage',
      storage: createJSONStorage(() => PlatformStorage),
    }
  )
);
