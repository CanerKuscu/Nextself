"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnimation = exports.Animations = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
class Animations {
}
exports.Animations = Animations;
// Fade in animation
Animations.fadeIn = (value, toValue = 1, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.ease,
        useNativeDriver: true,
    });
};
// Fade out animation
Animations.fadeOut = (value, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue: 0,
        duration,
        easing: react_native_1.Easing.ease,
        useNativeDriver: true,
    });
};
// Slide up animation
Animations.slideUp = (value, toValue = 0, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
    });
};
// Slide down animation
Animations.slideDown = (value, toValue = 100, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
    });
};
// Scale animation
Animations.scale = (value, toValue, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
    });
};
// Rotate animation
Animations.rotate = (value, toValue, duration = 300) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.linear,
        useNativeDriver: true,
    });
};
// Spring animation for buttons
Animations.springPress = (value, toValue = 0.95) => {
    return react_native_1.Animated.spring(value, {
        toValue,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
    });
};
// Spring release
Animations.springRelease = (value, toValue = 1) => {
    return react_native_1.Animated.spring(value, {
        toValue,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
    });
};
// Pulse animation
Animations.pulse = (value, duration = 1000) => {
    return react_native_1.Animated.loop(react_native_1.Animated.sequence([
        react_native_1.Animated.timing(value, {
            toValue: 1.1,
            duration: duration / 2,
            easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
        react_native_1.Animated.timing(value, {
            toValue: 1,
            duration: duration / 2,
            easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
    ]));
};
// Shake animation
Animations.shake = (value, duration = 500) => {
    return react_native_1.Animated.sequence([
        react_native_1.Animated.timing(value, {
            toValue: 10,
            duration: duration / 8,
            easing: react_native_1.Easing.out(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
        react_native_1.Animated.timing(value, {
            toValue: -10,
            duration: duration / 4,
            easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
        react_native_1.Animated.timing(value, {
            toValue: 10,
            duration: duration / 4,
            easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
        react_native_1.Animated.timing(value, {
            toValue: 0,
            duration: duration / 8,
            easing: react_native_1.Easing.in(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
    ]);
};
// Bounce animation
Animations.bounce = (value, duration = 600) => {
    return react_native_1.Animated.sequence([
        react_native_1.Animated.timing(value, {
            toValue: -20,
            duration: duration / 6,
            easing: react_native_1.Easing.out(react_native_1.Easing.ease),
            useNativeDriver: true,
        }),
        react_native_1.Animated.timing(value, {
            toValue: 0,
            duration: duration / 6,
            easing: react_native_1.Easing.bounce,
            useNativeDriver: true,
        }),
    ]);
};
// Stagger animation for lists
Animations.stagger = (values, delay = 100, animation) => {
    return react_native_1.Animated.stagger(delay, values.map(animation));
};
// Parallax effect
Animations.parallax = (scrollY, inputRange, outputRange) => {
    return scrollY.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
    });
};
// Progress bar animation
Animations.progress = (value, toValue, duration = 1000) => {
    return react_native_1.Animated.timing(value, {
        toValue,
        duration,
        easing: react_native_1.Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
    });
};
const useAnimation = (initialValue = 1) => {
    const animatedValue = react_1.default.useRef(new react_native_1.Animated.Value(typeof initialValue === 'number' ? initialValue : initialValue.x)).current;
    const animatedValueXY = react_1.default.useRef(new react_native_1.Animated.ValueXY(typeof initialValue === 'object' ? initialValue : { x: initialValue, y: initialValue })).current;
    return {
        value: animatedValue,
        valueXY: animatedValueXY,
        fadeIn: (toValue, duration) => Animations.fadeIn(animatedValue, toValue, duration),
        fadeOut: (duration) => Animations.fadeOut(animatedValue, duration),
        slideUp: (toValue, duration) => Animations.slideUp(animatedValue, toValue, duration),
        slideDown: (toValue, duration) => Animations.slideDown(animatedValue, toValue, duration),
        scale: (toValue, duration) => Animations.scale(animatedValueXY, toValue, duration),
        rotate: (toValue, duration) => Animations.rotate(animatedValue, toValue, duration),
        springPress: (toValue) => Animations.springPress(animatedValue, toValue),
        springRelease: (toValue) => Animations.springRelease(animatedValue, toValue),
        pulse: (duration) => Animations.pulse(animatedValue, duration),
        shake: (duration) => Animations.shake(animatedValue, duration),
        bounce: (duration) => Animations.bounce(animatedValue, duration),
        progress: (toValue, duration) => Animations.progress(animatedValue, toValue, duration),
    };
};
exports.useAnimation = useAnimation;
