"use strict";
// NextSelf — Clean White Light Theme (Duolingo-Inspired)
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_STYLES = exports.ANIMATION = exports.SHADOWS = exports.BORDER_RADIUS = exports.SPACING = exports.GRID = exports.TYPOGRAPHY = exports.GRADIENTS = exports.DARK_COLORS = exports.COLORS = void 0;
exports.COLORS = {
    // Primary — Fresh Green
    primary: '#58CC02',
    primaryLight: '#89E219',
    primaryDark: '#46A302',
    primaryGlow: 'rgba(88, 204, 2, 0.20)',
    primarySoft: 'rgba(88, 204, 2, 0.08)',
    // Secondary — Vivid Purple
    secondary: '#CE82FF',
    secondaryLight: '#DDA0FF',
    secondaryDark: '#A855F7',
    secondarySoft: 'rgba(206, 130, 255, 0.10)',
    // Accent — Sky Blue
    accent: '#1CB0F6',
    accentLight: '#4FC3F7',
    accentDark: '#0D8ECF',
    accentSoft: 'rgba(28, 176, 246, 0.10)',
    // Backgrounds — Pure White
    background: '#FFFFFF',
    surface: '#F7F7F7',
    surfaceElevated: '#F0F0F5',
    surfaceSecondary: '#FAFAFA',
    cardGlass: '#FFFFFF',
    // Text — Dark Navy
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#AFAFBF',
    textInverse: '#FFFFFF',
    textAccent: '#58CC02',
    // Borders
    border: '#E5E5EA',
    borderLight: '#F0F0F5',
    borderFocus: '#58CC02',
    // Status
    success: '#58CC02',
    warning: '#FFC800',
    error: '#FF4B4B',
    info: '#1CB0F6',
    successSoft: 'rgba(88, 204, 2, 0.10)',
    warningSoft: 'rgba(255, 200, 0, 0.10)',
    errorSoft: 'rgba(255, 75, 75, 0.10)',
    infoSoft: 'rgba(28, 176, 246, 0.10)',
    // Premium & Accents
    customPurple: '#CE82FF',
    orange: '#FF9600',
    pink: '#FF86D0',
    teal: '#00CD9C',
    gold: '#FFC800',
    // Dashboard specifics
    streak: '#FF9600',
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.15)',
};
exports.DARK_COLORS = {
    // Primary — Fresh Green (keep same)
    primary: '#58CC02',
    primaryLight: '#89E219',
    primaryDark: '#46A302',
    primaryGlow: 'rgba(88, 204, 2, 0.25)',
    primarySoft: 'rgba(88, 204, 2, 0.12)',
    // Secondary — Vivid Purple (keep same)
    secondary: '#CE82FF',
    secondaryLight: '#DDA0FF',
    secondaryDark: '#A855F7',
    secondarySoft: 'rgba(206, 130, 255, 0.12)',
    // Accent — Sky Blue (keep same)
    accent: '#1CB0F6',
    accentLight: '#4FC3F7',
    accentDark: '#0D8ECF',
    accentSoft: 'rgba(28, 176, 246, 0.12)',
    // Backgrounds — Dark
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceElevated: '#252540',
    surfaceSecondary: '#16162B',
    cardGlass: '#1E1E35',
    // Text — Light
    text: '#F0F0F5',
    textSecondary: '#A0A0B8',
    textTertiary: '#6B6B80',
    textInverse: '#0F0F1A',
    textAccent: '#58CC02',
    // Borders
    border: '#2D2D45',
    borderLight: '#252540',
    borderFocus: '#58CC02',
    // Status
    success: '#58CC02',
    warning: '#FFC800',
    error: '#FF4B4B',
    info: '#1CB0F6',
    successSoft: 'rgba(88, 204, 2, 0.15)',
    warningSoft: 'rgba(255, 200, 0, 0.15)',
    errorSoft: 'rgba(255, 75, 75, 0.15)',
    infoSoft: 'rgba(28, 176, 246, 0.15)',
    // Premium & Accents
    customPurple: '#CE82FF',
    orange: '#FF9600',
    pink: '#FF86D0',
    teal: '#00CD9C',
    gold: '#FFC800',
    // Dashboard specifics
    streak: '#FF9600',
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
};
exports.GRADIENTS = {
    primary: ['#58CC02', '#46A302'],
    secondary: ['#CE82FF', '#A855F7'],
    accent: ['#1CB0F6', '#0D8ECF'],
    hero: ['rgba(88, 204, 2, 0.08)', 'rgba(255,255,255,0)'],
    warm: ['#FF9600', '#FF6B00'],
    cardio: ['#FF4B4B', '#E11D48'],
    health: ['#00CD9C', '#10B981'],
    streak: ['#FF9600', '#FF6B00'],
    water: ['#1CB0F6', '#0D8ECF'],
    premium: ['#CE82FF', '#A855F7'],
    sunset: ['#FFC800', '#FF9600'],
    // Category card gradients
    workout: ['#A78BFA', '#7C3AED'],
    nutrition: ['#60A5FA', '#1CB0F6'],
    healthCard: ['#34D399', '#00CD9C'],
    aiTools: ['#F472B6', '#EC4899'],
};
exports.TYPOGRAPHY = {
    hero: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        lineHeight: 34,
    },
    h1: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.3,
        lineHeight: 30,
    },
    h2: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
        lineHeight: 26,
    },
    h3: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.2,
        lineHeight: 22,
    },
    body: {
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 22,
    },
    bodyBold: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0,
        lineHeight: 22,
    },
    caption: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 18,
    },
    captionBold: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0,
        lineHeight: 18,
    },
    small: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.2,
        lineHeight: 14,
    },
    smallBold: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
        lineHeight: 14,
    },
    button: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
        lineHeight: 22,
    },
};
// NextSelf — Clean White Light Theme (Duolingo-Inspired)
// STRICT 8PX GRID SYSTEM — All spacing values must be multiples of 8
exports.GRID = {
    unit: 8,
    get: (multiplier) => multiplier * 8,
};
exports.SPACING = {
    // Strict 8px grid system
    xs: 8, // 8px — minimal spacing
    sm: 16, // 16px — tight spacing
    md: 24, // 24px — standard spacing
    lg: 32, // 32px — comfortable spacing
    xl: 40, // 40px — large spacing
    xxl: 48, // 48px — extra large
    xxxl: 64, // 64px — section breaks
    section: 80, // 80px — major section divisions
    // Half-unit for fine-tuning (use sparingly)
    half: 4,
    quarter: 2,
};
exports.BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    pill: 999,
    circle: 999,
};
exports.SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
        elevation: 6,
    },
    glow: {
        shadowColor: '#58CC02',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
};
exports.ANIMATION = {
    fast: 200,
    normal: 300,
    slow: 500,
    spring: {
        damping: 14,
        stiffness: 150,
    },
    bouncy: {
        damping: 12,
        stiffness: 180,
    },
};
exports.COMMON_STYLES = {
    screenContainer: {
        flex: 1,
        backgroundColor: exports.COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: exports.SPACING.md,
        paddingBottom: exports.SPACING.section,
    },
    card: Object.assign({ backgroundColor: exports.COLORS.cardGlass, borderRadius: exports.BORDER_RADIUS.lg, padding: exports.SPACING.lg, borderWidth: 1, borderColor: exports.COLORS.borderLight }, exports.SHADOWS.card),
    glassCard: Object.assign({ backgroundColor: exports.COLORS.cardGlass, borderRadius: exports.BORDER_RADIUS.xl, padding: exports.SPACING.lg, borderWidth: 1, borderColor: exports.COLORS.borderLight }, exports.SHADOWS.md),
    sectionTitle: Object.assign(Object.assign({}, exports.TYPOGRAPHY.h2), { color: exports.COLORS.text, marginBottom: exports.SPACING.md, marginTop: exports.SPACING.xl }),
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 8px Grid aligned chip
    chip: {
        paddingHorizontal: exports.SPACING.md,
        paddingVertical: exports.SPACING.xs,
        borderRadius: exports.BORDER_RADIUS.pill,
        backgroundColor: exports.COLORS.surface,
        borderWidth: 1,
        borderColor: exports.COLORS.border,
    },
    chipText: Object.assign(Object.assign({}, exports.TYPOGRAPHY.captionBold), { color: exports.COLORS.textSecondary }),
    chipActive: {
        backgroundColor: exports.COLORS.primarySoft,
        borderColor: exports.COLORS.primary,
    },
    chipActiveText: {
        color: exports.COLORS.primary,
    },
    // 8px Grid aligned divider
    divider: {
        height: 1,
        backgroundColor: exports.COLORS.border,
        marginVertical: exports.SPACING.md,
    },
    // 8px Grid aligned badge
    badge: {
        paddingHorizontal: exports.SPACING.sm,
        paddingVertical: exports.SPACING.half,
        borderRadius: exports.BORDER_RADIUS.pill,
        backgroundColor: exports.COLORS.primary,
    },
    badgeText: Object.assign(Object.assign({}, exports.TYPOGRAPHY.small), { color: exports.COLORS.textInverse, fontWeight: '700' }),
    // Visual hierarchy helpers
    stackXs: { gap: exports.SPACING.xs },
    stackSm: { gap: exports.SPACING.sm },
    stackMd: { gap: exports.SPACING.md },
    stackLg: { gap: exports.SPACING.lg },
    stackXl: { gap: exports.SPACING.xl },
    // Inset helpers for consistent padding
    insetXs: { padding: exports.SPACING.xs },
    insetSm: { padding: exports.SPACING.sm },
    insetMd: { padding: exports.SPACING.md },
    insetLg: { padding: exports.SPACING.lg },
    insetXl: { padding: exports.SPACING.xl },
};
