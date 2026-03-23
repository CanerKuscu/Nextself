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
exports.useThemeStyles = exports.ThemeProvider = exports.useTheme = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const theme_1 = require("../config/theme");
const ThemeContext = (0, react_1.createContext)(undefined);
const THEME_STORAGE_KEY = 'NextSelf_theme_mode';
const useTheme = () => {
    const context = (0, react_1.useContext)(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
exports.useTheme = useTheme;
const ThemeProvider = ({ children }) => {
    const systemColorScheme = (0, react_native_1.useColorScheme)();
    const [mode, setMode] = (0, react_1.useState)('light');
    // Load saved theme preference
    (0, react_1.useEffect)(() => {
        loadThemePreference();
    }, []);
    const loadThemePreference = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const savedMode = yield platformStorage_1.default.getItem(THEME_STORAGE_KEY);
            if (savedMode === 'light' || savedMode === 'dark') {
                setMode(savedMode);
                return;
            }
            if (savedMode === 'system') {
                const migratedMode = systemColorScheme === 'dark' ? 'dark' : 'light';
                setMode(migratedMode);
                saveThemePreference(migratedMode);
            }
        }
        catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    });
    const saveThemePreference = (newMode) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield platformStorage_1.default.setItem(THEME_STORAGE_KEY, newMode);
        }
        catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    });
    const toggleTheme = (0, react_1.useCallback)(() => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        saveThemePreference(newMode);
    }, [mode]);
    const setThemeMode = (0, react_1.useCallback)((newMode) => {
        setMode(newMode);
        saveThemePreference(newMode);
    }, []);
    // Get colors based on current theme
    const isDark = mode === 'dark';
    const colors = isDark ? theme_1.DARK_COLORS : theme_1.COLORS;
    // Update common styles with current colors (memoized to prevent unnecessary re-renders)
    const updatedCommonStyles = (0, react_1.useMemo)(() => (Object.assign(Object.assign({}, theme_1.COMMON_STYLES), { screenContainer: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.screenContainer), { backgroundColor: colors.background }), card: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.card), { backgroundColor: colors.surface }), glassCard: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.glassCard), { backgroundColor: colors.cardGlass, borderColor: colors.borderLight }), sectionTitle: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.sectionTitle), { color: colors.text }), chip: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.chip), { backgroundColor: colors.primarySoft }), chipText: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.chipText), { color: colors.primary }), chipActive: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.chipActive), { backgroundColor: colors.primary }), chipActiveText: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.chipActiveText), { color: colors.textInverse }), divider: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.divider), { backgroundColor: colors.borderLight }), badge: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.badge), { backgroundColor: colors.primary }), badgeText: Object.assign(Object.assign({}, theme_1.COMMON_STYLES.badgeText), { color: colors.textInverse }) })), [isDark, colors]);
    const value = (0, react_1.useMemo)(() => ({
        mode,
        isDark,
        colors,
        gradients: theme_1.GRADIENTS,
        typography: theme_1.TYPOGRAPHY,
        spacing: theme_1.SPACING,
        borderRadius: theme_1.BORDER_RADIUS,
        shadows: theme_1.SHADOWS,
        animation: theme_1.ANIMATION,
        commonStyles: updatedCommonStyles,
        toggleTheme,
        setThemeMode,
    }), [mode, isDark, colors, updatedCommonStyles, toggleTheme, setThemeMode]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
exports.ThemeProvider = ThemeProvider;
// Custom hook for styled components
const useThemeStyles = () => {
    const theme = (0, exports.useTheme)();
    return {
        // Screen styles
        screen: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        // Card styles
        card: Object.assign({ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg }, theme.shadows.card),
        glassCard: Object.assign({ backgroundColor: theme.colors.cardGlass, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.borderLight }, theme.shadows.sm),
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
        h1: Object.assign(Object.assign({}, theme.typography.h1), { color: theme.colors.text }),
        h2: Object.assign(Object.assign({}, theme.typography.h2), { color: theme.colors.text }),
        h3: Object.assign(Object.assign({}, theme.typography.h3), { color: theme.colors.text }),
        // Button styles
        buttonPrimary: {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonPrimaryText: Object.assign(Object.assign({}, theme.typography.button), { color: theme.colors.textInverse }),
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
        buttonSecondaryText: Object.assign(Object.assign({}, theme.typography.button), { color: theme.colors.text }),
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
        listItem: Object.assign({ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center' }, theme.shadows.sm),
        // Badge styles
        badge: {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 2,
        },
        badgeText: Object.assign(Object.assign({}, theme.typography.small), { color: theme.colors.textInverse }),
        // Divider
        divider: {
            height: 1,
            backgroundColor: theme.colors.borderLight,
            marginVertical: theme.spacing.md,
        },
    };
};
exports.useThemeStyles = useThemeStyles;
