import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../locales/i18n';

export const useTranslation = () => {
  const { t, language, setLanguage, isLoading } = useLanguage();

  return {
    t,
    language,
    setLanguage,
    isLoading,
    isTurkish: language === 'tr',
    isEnglish: language === 'en',
    isRussian: language === 'ru',
  };
};
