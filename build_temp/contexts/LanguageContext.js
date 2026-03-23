"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageProvider = exports.useLanguage = void 0;
const react_1 = __importStar(require("react"));
const Localization = __importStar(require("expo-localization"));
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const i18n_1 = require("../locales/i18n");
const notificationService_1 = require("../services/notificationService");
const LanguageContext = (0, react_1.createContext)(undefined);
const useLanguage = () => {
    const context = (0, react_1.useContext)(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
exports.useLanguage = useLanguage;
const STORAGE_KEY = 'NextSelf_language';
const SUPPORTED_LANGUAGES = ['en', 'tr', 'ru'];
const getDeviceLanguage = () => {
    var _a;
    try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
            const deviceLang = (_a = locales[0].languageCode) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (deviceLang && SUPPORTED_LANGUAGES.includes(deviceLang)) {
                return deviceLang;
            }
        }
    }
    catch (_b) { }
    return 'en';
};
const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = (0, react_1.useState)('en');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        loadLanguage();
    }, []);
    const loadLanguage = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const savedLanguage = yield platformStorage_1.default.getItem(STORAGE_KEY);
            if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
                setLanguageState(savedLanguage);
            }
            else {
                // First launch: detect device language
                const deviceLang = getDeviceLanguage();
                setLanguageState(deviceLang);
                yield platformStorage_1.default.setItem(STORAGE_KEY, deviceLang);
            }
        }
        catch (error) {
            console.error('Failed to load language:', error);
        }
        finally {
            setIsLoading(false);
        }
    });
    const setLanguage = (0, react_1.useCallback)((newLanguage) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLanguageState(newLanguage);
            yield platformStorage_1.default.setItem(STORAGE_KEY, newLanguage);
            // Reschedule notifications in new language
            yield notificationService_1.NotificationService.getInstance().rescheduleAll(newLanguage);
        }
        catch (error) {
            console.error('Failed to save language:', error);
        }
    }), []);
    const t = (0, react_1.useCallback)((key, params) => {
        const translation = i18n_1.translations[language][key] || i18n_1.translations.en[key] || key;
        if (params) {
            return Object.entries(params).reduce((str, [param, value]) => str.replaceAll(`{${param}}`, String(value)), translation);
        }
        return translation;
    }, [language]);
    const value = (0, react_1.useMemo)(() => ({
        language,
        setLanguage,
        t,
        isLoading,
    }), [language, setLanguage, t, isLoading]);
    return (<LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>);
};
exports.LanguageProvider = LanguageProvider;
