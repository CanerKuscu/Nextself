"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = void 0;
const LanguageContext_1 = require("../contexts/LanguageContext");
const useTranslation = () => {
    const { t, language, setLanguage, isLoading } = (0, LanguageContext_1.useLanguage)();
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
exports.useTranslation = useTranslation;
