"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const theme_1 = require("../config/theme");
const PremiumBadge = ({ locked = true, label = 'Premium', onPress, size = 'sm', }) => {
    const content = (<expo_linear_gradient_1.LinearGradient colors={locked ? theme_1.GRADIENTS.premium : theme_1.GRADIENTS.health} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.badge, size === 'md' && styles.badgeMd]}>
            <vector_icons_1.Ionicons name={locked ? 'lock-closed' : 'star'} size={size === 'sm' ? 10 : 12} color={theme_1.COLORS.textInverse}/>
            <react_native_1.Text style={[styles.text, size === 'md' && styles.textMd]}>
                {label}
            </react_native_1.Text>
        </expo_linear_gradient_1.LinearGradient>);
    if (onPress) {
        return (<react_native_1.TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </react_native_1.TouchableOpacity>);
    }
    return content;
};
const styles = react_native_1.StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: theme_1.SPACING.sm,
        paddingVertical: 3,
        borderRadius: theme_1.BORDER_RADIUS.pill,
    },
    badgeMd: {
        paddingHorizontal: theme_1.SPACING.md,
        paddingVertical: 5,
    },
    text: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: theme_1.COLORS.textInverse, fontWeight: '700', fontSize: 9 }),
    textMd: {
        fontSize: 11,
    },
});
exports.default = PremiumBadge;
