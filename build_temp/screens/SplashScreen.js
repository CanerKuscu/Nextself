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
const vector_icons_1 = require("@expo/vector-icons");
const theme_1 = require("../config/theme");
const { width, height } = react_native_1.Dimensions.get('window');
const SplashScreen = ({ onFinish }) => {
    // Animation Values
    const iconScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const textOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const textTranslateY = (0, react_1.useRef)(new react_native_1.Animated.Value(20)).current;
    const ringScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0.8)).current;
    const ringOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0.3)).current;
    (0, react_1.useEffect)(() => {
        // 1. Icon pop in
        react_native_1.Animated.spring(iconScale, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
        }).start();
        // 2. Ripple effect behind icon
        react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(ringScale, { toValue: 1.5, duration: 1500, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }),
                react_native_1.Animated.timing(ringOpacity, { toValue: 0, duration: 1500, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }),
            ]),
            react_native_1.Animated.timing(ringScale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            react_native_1.Animated.timing(ringOpacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ])).start();
        // 3. Text slide & fade in
        setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                react_native_1.Animated.timing(textTranslateY, { toValue: 0, duration: 600, easing: react_native_1.Easing.out(react_native_1.Easing.back(1.5)), useNativeDriver: true }),
            ]).start();
        }, 400);
        const timer = setTimeout(() => onFinish(), 2500);
        return () => clearTimeout(timer);
    }, []);
    return (<react_native_1.View style={styles.container}>
            {/* Background elements */}
            <react_native_1.View style={styles.bgTopRight}/>
            <react_native_1.View style={styles.bgBottomLeft}/>

            {/* Icon with Ripple */}
            <react_native_1.View style={styles.iconContainer}>
                <react_native_1.Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}/>
                <react_native_1.Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
                    <expo_linear_gradient_1.LinearGradient colors={[theme_1.COLORS.primary, theme_1.COLORS.primaryDark]} style={styles.iconGradient}>
                        <vector_icons_1.Ionicons name="sparkles" size={40} color="#FFFFFF"/>
                    </expo_linear_gradient_1.LinearGradient>
                </react_native_1.Animated.View>
            </react_native_1.View>

            {/* Logo Text */}
            <react_native_1.Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
                <react_native_1.Text style={styles.logoNext}>Next</react_native_1.Text>
                <react_native_1.Text style={styles.logoSelf}>Self</react_native_1.Text>
                <react_native_1.Text style={styles.logoDot}>.</react_native_1.Text>
            </react_native_1.Animated.View>

            {/* Tagline */}
            <react_native_1.Animated.View style={[styles.taglineContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
                <react_native_1.Text style={styles.tagline}>EVOLVE EVERY DAY</react_native_1.Text>
            </react_native_1.Animated.View>
        </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bgTopRight: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: theme_1.COLORS.primarySoft,
    },
    bgBottomLeft: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.2,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: theme_1.COLORS.secondarySoft,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme_1.COLORS.primary,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        shadowColor: theme_1.COLORS.primary,
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 15,
        backgroundColor: theme_1.COLORS.background,
    },
    iconGradient: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    logoNext: {
        fontSize: 48,
        fontWeight: '800',
        color: theme_1.COLORS.text,
        letterSpacing: -1.5,
    },
    logoSelf: {
        fontSize: 48,
        fontWeight: '800',
        color: theme_1.COLORS.primary,
        letterSpacing: -1.5,
    },
    logoDot: {
        fontSize: 48,
        fontWeight: '800',
        color: theme_1.COLORS.secondary,
    },
    taglineContainer: {
        marginTop: 12,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '700',
        color: theme_1.COLORS.textTertiary,
        letterSpacing: 4,
    },
});
exports.default = SplashScreen;
