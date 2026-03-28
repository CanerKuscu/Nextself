import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { COLORS, DARK_COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, ANIMATION, COMMON_STYLES } from '../config/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: typeof COLORS;
    gradients: typeof GRADIENTS;
    typography: typeof TYPOGRAPHY;
    spacing: typeof SPACING;
    borderRadius: typeof BORDER_RADIUS;
    shadows: typeof SHADOWS;
    animation: typeof ANIMATION;
    commonStyles: typeof COMMON_STYLES;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const themeMode = useAppStore((state) => state.themeMode);
    const setStoreThemeMode = useAppStore((state) => state.setThemeMode);

    const mode: ThemeMode = themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode as ThemeMode;

    const toggleTheme = useCallback(() => {
        const newMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
        setStoreThemeMode(newMode);
    }, [mode, setStoreThemeMode]);

    const setThemeMode = useCallback((newMode: ThemeMode) => {
        setStoreThemeMode(newMode);
    }, [setStoreThemeMode]);

    // Get colors based on current theme
    const isDark = mode === 'dark';
    const colors = isDark ? DARK_COLORS : COLORS;

    // Update common styles with current colors (memoized to prevent unnecessary re-renders)
    const updatedCommonStyles = useMemo(() => ({
        ...COMMON_STYLES,
        screenContainer: {
            ...COMMON_STYLES.screenContainer,
            backgroundColor: colors.background,
        },
        card: {
            ...COMMON_STYLES.card,
            backgroundColor: colors.surface,
        },
        glassCard: {
            ...COMMON_STYLES.glassCard,
            backgroundColor: colors.cardGlass,
            borderColor: colors.borderLight,
        },
        sectionTitle: {
            ...COMMON_STYLES.sectionTitle,
            color: colors.text,
        },
        chip: {
            ...COMMON_STYLES.chip,
            backgroundColor: colors.primarySoft,
        },
        chipText: {
            ...COMMON_STYLES.chipText,
            color: colors.primary,
        },
        chipActive: {
            ...COMMON_STYLES.chipActive,
            backgroundColor: colors.primary,
        },
        chipActiveText: {
            ...COMMON_STYLES.chipActiveText,
            color: colors.textInverse,
        },
        divider: {
            ...COMMON_STYLES.divider,
            backgroundColor: colors.borderLight,
        },
        badge: {
            ...COMMON_STYLES.badge,
            backgroundColor: colors.primary,
        },
        badgeText: {
            ...COMMON_STYLES.badgeText,
            color: colors.textInverse,
        },
    }), [isDark, colors]);

    const value = useMemo<ThemeContextType>(() => ({
        mode,
        isDark,
        colors,
        gradients: GRADIENTS,
        typography: TYPOGRAPHY,
        spacing: SPACING,
        borderRadius: BORDER_RADIUS,
        shadows: SHADOWS,
        animation: ANIMATION,
        commonStyles: updatedCommonStyles,
        toggleTheme,
        setThemeMode,
    }), [mode, isDark, colors, updatedCommonStyles, toggleTheme, setThemeMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook for styled components
export const useThemeStyles = () => {
    const theme = useTheme();

    return {
        // Screen styles
        screen: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },

        // Card styles
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            ...theme.shadows.card,
        },

        glassCard: {
            backgroundColor: theme.colors.cardGlass,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },

        // Text styles
        text: {
            color: theme.colors.text,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
        },

        textSecondary: {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
        },

        textTertiary: {
            color: theme.colors.textTertiary,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
        },

        textInverse: {
            color: theme.colors.textInverse,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
        },

        // Heading styles
        h1: {
            ...theme.typography.h1,
            color: theme.colors.text,
        },

        h2: {
            ...theme.typography.h2,
            color: theme.colors.text,
        },

        h3: {
            ...theme.typography.h3,
            color: theme.colors.text,
        },

        // Button styles
        buttonPrimary: {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
        },

        buttonPrimaryText: {
            ...theme.typography.button,
            color: theme.colors.textInverse,
        },

        buttonSecondary: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },

        buttonSecondaryText: {
            ...theme.typography.button,
            color: theme.colors.text,
        },

        // Input styles
        input: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            fontSize: theme.typography.body.fontSize,
        },

        inputFocused: {
            borderColor: theme.colors.primary,
            borderWidth: 2,
        },

        // List styles
        listItem: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            ...theme.shadows.sm,
        },

        // Badge styles
        badge: {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 2,
        },

        badgeText: {
            ...theme.typography.small,
            color: theme.colors.textInverse,
        },

        // Divider
        divider: {
            height: 1,
            backgroundColor: theme.colors.borderLight,
            marginVertical: theme.spacing.md,
        },
    };
};
