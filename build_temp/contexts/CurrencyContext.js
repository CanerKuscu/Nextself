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
exports.CurrencyProvider = exports.useCurrency = exports.CURRENCIES = void 0;
const react_1 = __importStar(require("react"));
const Localization = __importStar(require("expo-localization"));
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
exports.CURRENCIES = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    TRY: { code: 'TRY', symbol: '₺', name: 'Türk Lirası', locale: 'tr-TR' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    RUB: { code: 'RUB', symbol: '₽', name: 'Российский рубль', locale: 'ru-RU' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
};
const CurrencyContext = (0, react_1.createContext)(undefined);
const useCurrency = () => {
    const context = (0, react_1.useContext)(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
exports.useCurrency = useCurrency;
const STORAGE_KEY = 'NextSelf_currency';
const LANGUAGE_TO_CURRENCY = {
    tr: 'TRY',
    ru: 'RUB',
    en: 'USD',
    de: 'EUR',
    fr: 'EUR',
    es: 'EUR',
    it: 'EUR',
    ar: 'AED',
};
const getDeviceCurrency = () => {
    var _a, _b;
    try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
            // Try region-based detection first
            const region = (_a = locales[0].regionCode) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            if (region === 'TR')
                return 'TRY';
            if (region === 'RU')
                return 'RUB';
            if (region === 'GB')
                return 'GBP';
            if (region === 'AE')
                return 'AED';
            if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT', 'IE', 'GR'].includes(region || ''))
                return 'EUR';
            // Fallback to language
            const lang = (_b = locales[0].languageCode) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            if (lang && LANGUAGE_TO_CURRENCY[lang]) {
                return LANGUAGE_TO_CURRENCY[lang];
            }
        }
    }
    catch (_c) { }
    return 'USD';
};
const CurrencyProvider = ({ children }) => {
    const [currency, setCurrencyState] = (0, react_1.useState)('USD');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        loadCurrency();
    }, []);
    const loadCurrency = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const saved = yield platformStorage_1.default.getItem(STORAGE_KEY);
            if (saved && saved in exports.CURRENCIES) {
                setCurrencyState(saved);
            }
            else {
                const detected = getDeviceCurrency();
                setCurrencyState(detected);
                yield platformStorage_1.default.setItem(STORAGE_KEY, detected);
            }
        }
        catch (error) {
            console.error('Failed to load currency:', error);
        }
        finally {
            setIsLoading(false);
        }
    });
    const setCurrency = (0, react_1.useCallback)((code) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setCurrencyState(code);
            yield platformStorage_1.default.setItem(STORAGE_KEY, code);
        }
        catch (error) {
            console.error('Failed to save currency:', error);
        }
    }), []);
    const formatPrice = (0, react_1.useCallback)((amount, overrideCurrency) => {
        const code = overrideCurrency || currency;
        const info = exports.CURRENCIES[code];
        try {
            return new Intl.NumberFormat(info.locale, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        }
        catch (_a) {
            return `${info.symbol}${amount.toFixed(2)}`;
        }
    }, [currency]);
    const currencyInfo = (0, react_1.useMemo)(() => exports.CURRENCIES[currency], [currency]);
    const value = (0, react_1.useMemo)(() => ({
        currency,
        setCurrency,
        formatPrice,
        currencyInfo,
        isLoading,
    }), [currency, setCurrency, formatPrice, currencyInfo, isLoading]);
    return (<CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>);
};
exports.CurrencyProvider = CurrencyProvider;
