import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as Localization from 'expo-localization';
import PlatformStorage from '../utils/platformStorage';
import { translations, Language, TranslationKey } from '../locales/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'biosync_language';
const SUPPORTED_LANGUAGES: Language[] = ['en', 'tr', 'ru'];

const getDeviceLanguage = (): Language => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode?.toLowerCase();
      if (deviceLang && SUPPORTED_LANGUAGES.includes(deviceLang as Language)) {
        return deviceLang as Language;
      }
    }
  } catch { }
  return 'en';
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await PlatformStorage.getItem(STORAGE_KEY);
      if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
        setLanguageState(savedLanguage as Language);
      } else {
        // First launch: detect device language
        const deviceLang = getDeviceLanguage();
        setLanguageState(deviceLang);
        await PlatformStorage.setItem(STORAGE_KEY, deviceLang);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      await PlatformStorage.setItem(STORAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const translation = (translations[language] as Record<TranslationKey, string>)[key] || translations.en[key] || key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replaceAll(`{${param}}`, String(value)),
        translation
      );
    }

    return translation;
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
    isLoading,
  }), [language, setLanguage, t, isLoading]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
