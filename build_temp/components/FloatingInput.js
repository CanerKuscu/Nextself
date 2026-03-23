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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const FloatingInput = (_a) => {
    var { label, error, containerStyle, icon, rightIcon, value, onFocus, onBlur } = _a, props = __rest(_a, ["label", "error", "containerStyle", "icon", "rightIcon", "value", "onFocus", "onBlur"]);
    const { colors } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    const labelAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(value ? 1 : 0)).current;
    // Handle external value changes (e.g., autofill, programmatic updates)
    react_1.default.useEffect(() => {
        if (value && !isFocused) {
            react_native_1.Animated.timing(labelAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
        }
        else if (!value && !isFocused) {
            react_native_1.Animated.timing(labelAnim, { toValue: 0, duration: 0, useNativeDriver: false }).start();
        }
    }, [value, isFocused, labelAnim]);
    const handleFocus = (0, react_1.useCallback)((e) => {
        setIsFocused(true);
        react_native_1.Animated.timing(labelAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus === null || onFocus === void 0 ? void 0 : onFocus(e);
    }, [labelAnim, onFocus]);
    const handleBlur = (0, react_1.useCallback)((e) => {
        setIsFocused(false);
        if (!value) {
            react_native_1.Animated.timing(labelAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        onBlur === null || onBlur === void 0 ? void 0 : onBlur(e);
    }, [labelAnim, value, onBlur]);
    // Memoize interpolated values to prevent recalculation on every render
    const labelTop = (0, react_1.useMemo)(() => labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 6],
    }), [labelAnim]);
    const labelSize = (0, react_1.useMemo)(() => labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 11],
    }), [labelAnim]);
    return (<react_native_1.View style={[styles.container]}>
            <react_native_1.View style={[
            styles.inputContainer,
            isFocused && styles.focused,
            error && styles.errorBorder,
            containerStyle,
        ]}>
                {icon && <react_native_1.View style={styles.iconLeft}>{icon}</react_native_1.View>}
                <react_native_1.View style={styles.inputWrapper}>
                    <react_native_1.Animated.Text style={[
            styles.label,
            {
                top: labelTop,
                fontSize: labelSize,
                color: isFocused
                    ? colors.primary
                    : error
                        ? colors.error
                        : colors.textTertiary,
            },
        ]}>
                        {label}
                    </react_native_1.Animated.Text>
                    <react_native_1.TextInput {...props} value={value} onFocus={handleFocus} onBlur={handleBlur} style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            { color: colors.text },
            props.style,
        ]} placeholderTextColor={colors.textTertiary}/>
                </react_native_1.View>
                {rightIcon && <react_native_1.View style={styles.iconRight}>{rightIcon}</react_native_1.View>}
            </react_native_1.View>
            {error && <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>}
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: {
        marginBottom: theme_1.SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        minHeight: 56,
    },
    focused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    errorBorder: {
        borderColor: colors.error,
    },
    inputWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    label: Object.assign(Object.assign({ position: 'absolute', left: theme_1.SPACING.md }, theme_1.TYPOGRAPHY.caption), { fontWeight: '500', zIndex: 1 }),
    input: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { paddingHorizontal: theme_1.SPACING.md, paddingVertical: 12, minHeight: 56, textAlignVertical: 'center' }),
    inputWithIcon: {
        paddingLeft: 0,
    },
    // 8px grid aligned icons
    iconLeft: {
        paddingLeft: theme_1.SPACING.md,
        paddingRight: theme_1.SPACING.xs,
    },
    iconRight: {
        paddingRight: theme_1.SPACING.md,
        paddingLeft: theme_1.SPACING.xs,
    },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.error, marginTop: theme_1.SPACING.xs, paddingLeft: theme_1.SPACING.md }),
});
// Memoize component to prevent re-renders when props don't change
exports.default = react_1.default.memo(FloatingInput);
