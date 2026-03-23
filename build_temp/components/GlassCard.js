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
const ThemeContext_1 = require("../contexts/ThemeContext");
const GlassCard = ({ children, style, elevated = false, noPadding = false, onLayout, variant = 'default', gradientColors, delay = 0, onPress, }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(20)).current;
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    (0, react_1.useEffect)(() => {
        const timeout = setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);
    const handlePressIn = () => {
        react_native_1.Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        react_native_1.Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };
    const getGradientColors = () => {
        if (gradientColors)
            return gradientColors;
        if (isDark) {
            switch (variant) {
                case 'premium': return ['rgba(30, 30, 50, 0.8)', 'rgba(40, 40, 70, 0.4)'];
                case 'subtle': return ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'];
                default: return ['rgba(26, 26, 46, 0.7)', 'rgba(26, 26, 46, 0.4)'];
            }
        }
        else {
            switch (variant) {
                case 'premium': return ['rgba(255, 255, 255, 0.9)', 'rgba(240, 240, 255, 0.6)'];
                case 'subtle': return ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)'];
                default: return ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.5)'];
            }
        }
    };
    const getBorderColor = () => {
        if (isDark) {
            return variant === 'premium' ? 'rgba(206, 130, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        }
        return variant === 'premium' ? 'rgba(206, 130, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)';
    };
    const Container = onPress ? react_native_1.TouchableOpacity : react_native_1.View;
    const containerProps = onPress ? {
        onPress,
        activeOpacity: 0.9,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut
    } : {};
    return (<react_native_1.Animated.View onLayout={onLayout} style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                ],
            },
            style,
        ]}>
            <Container {...containerProps} style={styles.touchable}>
                <expo_linear_gradient_1.LinearGradient colors={getGradientColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[
            styles.card,
            elevated && styles.elevated,
            noPadding && styles.noPadding,
            { borderColor: getBorderColor() }
        ]}>
                    {children}
                </expo_linear_gradient_1.LinearGradient>
            </Container>
        </react_native_1.Animated.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        marginBottom: theme_1.SPACING.md,
    },
    touchable: {
        flex: 1,
    },
    card: {
        flex: 1,
        borderRadius: theme_1.BORDER_RADIUS.xl,
        padding: theme_1.SPACING.lg,
        borderWidth: 1,
        overflow: 'hidden',
        // Glassmorphism backdrop filter is not supported natively in RN without specific libraries,
        // but semi-transparent background + blur (if available) creates the effect.
        // We rely on the parent View background color showing through slightly.
    },
    elevated: Object.assign({}, theme_1.SHADOWS.md),
    noPadding: {
        padding: 0,
    },
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(GlassCard);
