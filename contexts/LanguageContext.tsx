import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { translations, Language, TranslationKey } from '../locales/i18n';
import { useAppStore } from '../store/appStore';

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

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const language = useAppStore((state) => state.language);
  const setStoreLanguage = useAppStore((state) => state.setLanguage);
  const [isLoading, setIsLoading] = useState(false); // Hydration is handled by Zustand

  const setLanguage = useCallback((newLanguage: Language) => {
    void setStoreLanguage(newLanguage);
  }, [setStoreLanguage]);

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
