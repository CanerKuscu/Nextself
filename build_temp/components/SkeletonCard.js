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
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const SkeletonCard = ({ style, height = 200 }) => {
    const { isDark } = (0, ThemeContext_1.useTheme)();
    const opacityAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.3)).current;
    (0, react_1.useEffect)(() => {
        const pulse = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(opacityAnim, {
                toValue: 0.7,
                duration: 800,
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(opacityAnim, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
            }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, []);
    const backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    return (<react_native_1.Animated.View style={[
            styles.card,
            {
                height,
                backgroundColor,
                opacity: opacityAnim,
            },
            style,
        ]}/>);
};
const styles = react_native_1.StyleSheet.create({
    card: {
        borderRadius: theme_1.BORDER_RADIUS.xl,
        marginBottom: theme_1.SPACING.md,
        width: '100%',
    },
});
exports.default = SkeletonCard;
