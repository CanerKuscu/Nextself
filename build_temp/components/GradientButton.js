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
const expo_linear_gradient_1 = require("expo-linear-gradient");
const theme_1 = require("../config/theme");
const GradientButton = ({ title, onPress, gradient = theme_1.GRADIENTS.primary, style, textStyle, disabled = false, loading = false, icon, size = 'md', variant = 'filled', }) => {
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    // glowAnim removed — was running an infinite JS-thread animation loop
    // that was never referenced in the JSX, wasting CPU resources
    const handlePressIn = (0, react_1.useCallback)(() => {
        react_native_1.Animated.spring(scaleAnim, Object.assign(Object.assign({ toValue: 0.96 }, theme_1.ANIMATION.bouncy), { useNativeDriver: true })).start();
    }, [scaleAnim]);
    const handlePressOut = (0, react_1.useCallback)(() => {
        react_native_1.Animated.spring(scaleAnim, Object.assign(Object.assign({ toValue: 1 }, theme_1.ANIMATION.spring), { useNativeDriver: true })).start();
    }, [scaleAnim]);
    // Memoize size styles to prevent recalculation on every render
    const sizeStyles = (0, react_1.useMemo)(() => ({
        sm: { paddingVertical: theme_1.SPACING.xs, paddingHorizontal: theme_1.SPACING.md },
        md: { paddingVertical: theme_1.SPACING.sm, paddingHorizontal: theme_1.SPACING.lg },
        lg: { paddingVertical: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.xl },
    }), []);
    // Memoize text sizes to prevent recalculation on every render
    const textSizes = (0, react_1.useMemo)(() => ({
        sm: { fontSize: 14 },
        md: { fontSize: 16 },
        lg: { fontSize: 18 },
    }), []);
    if (variant === 'outline') {
        return (<react_native_1.Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
                <react_native_1.TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled || loading} activeOpacity={0.8} style={[
                styles.outlineButton,
                sizeStyles[size],
                disabled && styles.disabled,
            ]}>
                    {loading ? (<react_native_1.ActivityIndicator size="small" color={theme_1.COLORS.primary}/>) : (<>
                            {icon && <>{icon}</>}
                            <react_native_1.Text style={[styles.outlineText, textSizes[size], textStyle]}>
                                {title}
                            </react_native_1.Text>
                        </>)}
                </react_native_1.TouchableOpacity>
            </react_native_1.Animated.View>);
    }
    return (<react_native_1.Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <react_native_1.TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled || loading} activeOpacity={0.8}>
                <expo_linear_gradient_1.LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[
            styles.gradient,
            sizeStyles[size],
            disabled && styles.disabled,
        ]}>
                    {loading ? (<react_native_1.ActivityIndicator size="small" color={theme_1.COLORS.textInverse}/>) : (<>
                            {icon && <>{icon}</>}
                            <react_native_1.Text style={[styles.text, textSizes[size], textStyle]}>
                                {title}
                            </react_native_1.Text>
                        </>)}
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>
        </react_native_1.Animated.View>);
};
const styles = react_native_1.StyleSheet.create({
    gradient: Object.assign({ borderRadius: theme_1.BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: theme_1.SPACING.xs }, theme_1.SHADOWS.lg),
    text: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: theme_1.COLORS.textInverse }),
    outlineButton: {
        borderRadius: theme_1.BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: theme_1.SPACING.xs,
        borderWidth: 2,
        borderColor: theme_1.COLORS.primary,
        backgroundColor: 'transparent',
    },
    outlineText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: theme_1.COLORS.primary }),
    disabled: {
        opacity: 0.5,
    },
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(GradientButton);
