import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as Localization from 'expo-localization';
import PlatformStorage from '../utils/platformStorage';

export type CurrencyCode = 'USD' | 'TRY' | 'EUR' | 'GBP' | 'RUB' | 'AED';

interface CurrencyInfo {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    TRY: { code: 'TRY', symbol: '₺', name: 'Türk Lirası', locale: 'tr-TR' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    RUB: { code: 'RUB', symbol: '₽', name: 'Российский рубль', locale: 'ru-RU' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
};

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    formatPrice: (amount: number, overrideCurrency?: CurrencyCode) => string;
    currencyInfo: CurrencyInfo;
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

const STORAGE_KEY = 'biosync_currency';

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

const getDeviceCurrency = (): CurrencyCode => {
    try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
            // Try region-based detection first
            const region = locales[0].regionCode?.toUpperCase();
            if (region === 'TR') return 'TRY';
            if (region === 'RU') return 'RUB';
            if (region === 'GB') return 'GBP';
            if (region === 'AE') return 'AED';
            if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT', 'IE', 'GR'].includes(region || '')) return 'EUR';

            // Fallback to language
            const lang = locales[0].languageCode?.toLowerCase();
            if (lang && LANGUAGE_TO_CURRENCY[lang]) {
                return LANGUAGE_TO_CURRENCY[lang];
            }
        }
    } catch { }
    return 'USD';
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCurrency();
    }, []);

    const loadCurrency = async () => {
        try {
            const saved = await PlatformStorage.getItem(STORAGE_KEY);
            if (saved && saved in CURRENCIES) {
                setCurrencyState(saved as CurrencyCode);
            } else {
                const detected = getDeviceCurrency();
                setCurrencyState(detected);
                await PlatformStorage.setItem(STORAGE_KEY, detected);
            }
        } catch (error) {
            console.error('Failed to load currency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrency = useCallback(async (code: CurrencyCode) => {
        try {
            setCurrencyState(code);
            await PlatformStorage.setItem(STORAGE_KEY, code);
        } catch (error) {
            console.error('Failed to save currency:', error);
        }
    }, []);

    const formatPrice = useCallback((amount: number, overrideCurrency?: CurrencyCode): string => {
        const code = overrideCurrency || currency;
        const info = CURRENCIES[code];
        try {
            return new Intl.NumberFormat(info.locale, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${info.symbol}${amount.toFixed(2)}`;
        }
    }, [currency]);

    const currencyInfo = useMemo(() => CURRENCIES[currency], [currency]);

    const value = useMemo<CurrencyContextType>(() => ({
        currency,
        setCurrency,
        formatPrice,
        currencyInfo,
        isLoading,
    }), [currency, setCurrency, formatPrice, currencyInfo, isLoading]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
