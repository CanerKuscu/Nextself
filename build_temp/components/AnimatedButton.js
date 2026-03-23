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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const Animations_1 = require("../animations/Animations");
const theme_1 = require("../config/theme");
const AnimatedButton = ({ title, onPress, style, textStyle, disabled = false, icon, iconSize = 20, iconColor = '#FFFFFF', loading = false, variant = 'primary', size = 'medium', }) => {
    const { value, springPress, springRelease } = (0, Animations_1.useAnimation)();
    const isPressed = (0, react_1.useRef)(false);
    const animationRef = (0, react_1.useRef)(null);
    const [isTouchActive, setIsTouchActive] = (0, react_1.useState)(false);
    const handlePressIn = (0, react_1.useCallback)(() => {
        if (!disabled && !loading) {
            isPressed.current = true;
            setIsTouchActive(true);
            const animation = springPress();
            animationRef.current = animation;
            animation.start();
        }
    }, [disabled, loading, springPress]);
    const handlePressOut = (0, react_1.useCallback)(() => {
        setIsTouchActive(false);
        if (!disabled && !loading && isPressed.current) {
            isPressed.current = false;
            const animation = springRelease();
            animationRef.current = animation;
            animation.start();
            onPress();
        }
    }, [disabled, loading, springRelease, onPress]);
    // Cleanup animation on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
                animationRef.current = null;
            }
        };
    }, []);
    // Memoize button style to prevent recalculation on every render
    const buttonStyle = (0, react_1.useMemo)(() => {
        const baseStyle = {
            transform: [{ scale: value }],
            opacity: disabled ? 0.5 : 1,
        };
        const variantStyles = {
            primary: Object.assign({ backgroundColor: isTouchActive ? theme_1.COLORS.primaryDark : theme_1.COLORS.primary }, theme_1.SHADOWS.glow),
            secondary: {
                backgroundColor: isTouchActive ? theme_1.COLORS.primarySoft : theme_1.COLORS.surfaceElevated,
                borderWidth: 1,
                borderColor: isTouchActive ? theme_1.COLORS.primary : theme_1.COLORS.borderFocus,
            },
            danger: {
                backgroundColor: isTouchActive ? '#E53935' : theme_1.COLORS.error,
            },
            success: {
                backgroundColor: isTouchActive ? theme_1.COLORS.primaryDark : theme_1.COLORS.success,
            },
        };
        // 8px grid aligned size styles
        const sizeStyles = {
            small: {
                paddingHorizontal: theme_1.SPACING.md,
                paddingVertical: theme_1.SPACING.xs,
                borderRadius: theme_1.BORDER_RADIUS.md,
            },
            medium: {
                paddingHorizontal: theme_1.SPACING.lg,
                paddingVertical: theme_1.SPACING.sm,
                borderRadius: theme_1.BORDER_RADIUS.lg,
            },
            large: {
                paddingHorizontal: theme_1.SPACING.xl,
                paddingVertical: theme_1.SPACING.md,
                borderRadius: theme_1.BORDER_RADIUS.xl,
            },
        };
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseStyle), variantStyles[variant]), sizeStyles[size]), style);
    }, [value, disabled, variant, size, style, isTouchActive]);
    // Memoize text style to prevent recalculation on every render
    const textStyleMemo = (0, react_1.useMemo)(() => {
        const baseStyle = Object.assign({}, theme_1.TYPOGRAPHY.button);
        const sizeStyles = {
            small: { fontSize: 14 },
            medium: { fontSize: 16 },
            large: { fontSize: 18 },
        };
        const variantStyles = {
            primary: { color: theme_1.COLORS.textInverse },
            secondary: { color: theme_1.COLORS.text },
            danger: { color: theme_1.COLORS.textInverse },
            success: { color: theme_1.COLORS.textInverse },
        };
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseStyle), sizeStyles[size]), variantStyles[variant]), textStyle);
    }, [size, variant, textStyle]);
    return (<react_native_1.TouchableOpacity style={[styles.button, buttonStyle]} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled || loading} activeOpacity={1}>
      {loading ? (<react_native_1.Text style={[styles.text, textStyleMemo]}>Loading...</react_native_1.Text>) : (<>
          {icon && (<vector_icons_1.Ionicons name={icon} size={iconSize} color={iconColor} style={styles.icon}/>)}
          <react_native_1.Text style={[styles.text, textStyleMemo]}>{title}</react_native_1.Text>
        </>)}
    </react_native_1.TouchableOpacity>);
};
const styles = react_native_1.StyleSheet.create({
    button: Object.assign({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, theme_1.SHADOWS.sm),
    text: {
        textAlign: 'center',
    },
    // Icon alignment with 8px grid spacing
    icon: {
        marginRight: theme_1.SPACING.xs,
    },
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(AnimatedButton);
