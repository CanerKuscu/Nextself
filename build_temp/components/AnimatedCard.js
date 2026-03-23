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
const Animations_1 = require("../animations/Animations");
const theme_1 = require("../config/theme");
const AnimatedCard = ({ children, style, onPress, animationType = 'fadeIn', delay = 0, duration = 300, disabled = false, }) => {
    const { value, fadeIn, slideUp, scale, bounce } = (0, Animations_1.useAnimation)(0);
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const animationRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // Clear any ongoing animation
        if (animationRef.current) {
            animationRef.current.stop();
            animationRef.current = null;
        }
        const timer = setTimeout(() => {
            let animation;
            switch (animationType) {
                case 'fadeIn':
                    animation = fadeIn(1, duration);
                    opacity.setValue(1);
                    break;
                case 'slideUp':
                    animation = slideUp(0, duration);
                    opacity.setValue(1);
                    break;
                case 'scale':
                    animation = scale({ x: 1, y: 1 }, duration);
                    opacity.setValue(1);
                    break;
                case 'bounce':
                    animation = bounce(duration);
                    opacity.setValue(1);
                    break;
                default:
                    animation = fadeIn(1, duration);
                    opacity.setValue(1);
            }
            animationRef.current = animation;
            animation.start();
        }, delay);
        return () => {
            clearTimeout(timer);
            if (animationRef.current) {
                animationRef.current.stop();
                animationRef.current = null;
            }
        };
    }, [animationType, delay, duration, fadeIn, slideUp, scale, bounce, opacity]);
    // Memoize card style to prevent recalculation on every render
    const cardStyle = (0, react_1.useMemo)(() => ({
        opacity,
        transform: [
            {
                translateY: animationType === 'slideUp' ? value : 0,
            },
            {
                scale: animationType === 'scale' ? value : 1,
            },
            {
                translateY: animationType === 'bounce' ? value : 0,
            },
        ],
    }), [opacity, animationType, value]);
    // Memoize CardComponent to prevent re-creation on every render
    const CardComponent = (0, react_1.useMemo)(() => (<react_native_1.Animated.View style={[styles.card, cardStyle, style]}>
      {children}
    </react_native_1.Animated.View>), [styles.card, cardStyle, style, children]);
    if (onPress && !disabled) {
        return (<react_native_1.TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={style}>
        {CardComponent}
      </react_native_1.TouchableOpacity>);
    }
    return CardComponent;
};
const styles = react_native_1.StyleSheet.create({
    // 8px grid aligned card
    card: Object.assign({ backgroundColor: '#FFFFFF', borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.lg, borderWidth: 1, borderColor: theme_1.COLORS.borderLight }, theme_1.SHADOWS.card),
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(AnimatedCard);
