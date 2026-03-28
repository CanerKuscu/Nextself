import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

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

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const currency = useAppStore((state) => state.currency);
    const setStoreCurrency = useAppStore((state) => state.setCurrency);
    const isLoading = false; // Hydration is handled by Zustand

    const setCurrency = useCallback((code: CurrencyCode) => {
        setStoreCurrency(code);
    }, [setStoreCurrency]);

    const formatPrice = useCallback((amount: number, overrideCurrency?: CurrencyCode) => {
        const targetCurrency = overrideCurrency || currency;
        const info = CURRENCIES[targetCurrency];
        try {
            return new Intl.NumberFormat(info.locale, {
                style: 'currency',
                currency: info.code,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${info.symbol}${amount.toFixed(2)}`;
        }
    }, [currency]);

    const value = useMemo(() => ({
        currency,
        setCurrency,
        formatPrice,
        currencyInfo: CURRENCIES[currency],
        isLoading,
    }), [currency, setCurrency, formatPrice, isLoading]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
