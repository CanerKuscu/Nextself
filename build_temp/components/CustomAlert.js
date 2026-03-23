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
exports.useAlert = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const theme_1 = require("../config/theme");
const { width } = react_native_1.Dimensions.get('window');
const ALERT_CONFIG = {
    success: { gradient: ['#10B981', '#34D399'], icon: 'checkmark-circle', iconColor: '#fff' },
    error: { gradient: ['#EF4444', '#F87171'], icon: 'close-circle', iconColor: '#fff' },
    warning: { gradient: ['#F59E0B', '#FBBF24'], icon: 'warning', iconColor: '#fff' },
    info: { gradient: ['#6366F1', '#8B5CF6'], icon: 'information-circle', iconColor: '#fff' },
    confirm: { gradient: ['#6366F1', '#8B5CF6'], icon: 'help-circle', iconColor: '#fff' },
    destructive: { gradient: ['#EF4444', '#DC2626'], icon: 'trash', iconColor: '#fff' },
};
const CustomAlert = ({ visible, title, message, type = 'info', buttons = [{ text: 'OK' }], onDismiss, icon, }) => {
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.8)).current;
    const opacityAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const config = ALERT_CONFIG[type];
    (0, react_1.useEffect)(() => {
        if (visible) {
            react_native_1.Animated.parallel([
                react_native_1.Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
                react_native_1.Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        }
        else {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
                react_native_1.Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);
    const renderButton = (btn, index, total) => {
        const isDestructive = btn.style === 'destructive';
        const isCancel = btn.style === 'cancel';
        if (isCancel) {
            return (<react_native_1.TouchableOpacity key={index} style={[styles.button, styles.cancelButton, total === 1 && styles.fullButton]} onPress={() => { var _a; (_a = btn.onPress) === null || _a === void 0 ? void 0 : _a.call(btn); onDismiss === null || onDismiss === void 0 ? void 0 : onDismiss(); }} activeOpacity={0.7}>
                    <react_native_1.Text style={styles.cancelButtonText}>{btn.text}</react_native_1.Text>
                </react_native_1.TouchableOpacity>);
        }
        return (<react_native_1.TouchableOpacity key={index} style={[styles.button, total === 1 && styles.fullButton]} onPress={() => { var _a; (_a = btn.onPress) === null || _a === void 0 ? void 0 : _a.call(btn); onDismiss === null || onDismiss === void 0 ? void 0 : onDismiss(); }} activeOpacity={0.8}>
                <expo_linear_gradient_1.LinearGradient colors={isDestructive ? ['#EF4444', '#DC2626'] : config.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                    <react_native_1.Text style={[styles.buttonText, isDestructive && { color: '#fff' }]}>{btn.text}</react_native_1.Text>
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>);
    };
    return (<react_native_1.Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
            <react_native_1.Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <react_native_1.Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon Header */}
                    <expo_linear_gradient_1.LinearGradient colors={config.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconHeader}>
                        <vector_icons_1.Ionicons name={(icon || config.icon)} size={36} color={config.iconColor}/>
                    </expo_linear_gradient_1.LinearGradient>

                    {/* Content */}
                    <react_native_1.View style={styles.content}>
                        <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>
                        {message ? <react_native_1.Text style={styles.message}>{message}</react_native_1.Text> : null}
                    </react_native_1.View>

                    {/* Buttons */}
                    <react_native_1.View style={[styles.buttonRow, buttons.length === 1 && styles.singleButton]}>
                        {buttons.map((btn, i) => renderButton(btn, i, buttons.length))}
                    </react_native_1.View>
                </react_native_1.Animated.View>
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
};
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme_1.SPACING.xl,
    },
    container: Object.assign({ backgroundColor: theme_1.COLORS.surface, borderRadius: theme_1.BORDER_RADIUS.xl, overflow: 'hidden', width: '100%', maxWidth: 360 }, theme_1.SHADOWS.xl),
    iconHeader: {
        paddingVertical: theme_1.SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: theme_1.SPACING.xl,
        paddingTop: theme_1.SPACING.xl,
        paddingBottom: theme_1.SPACING.lg,
        alignItems: 'center',
    },
    title: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: theme_1.COLORS.text, textAlign: 'center', marginBottom: theme_1.SPACING.sm }),
    message: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: theme_1.COLORS.textSecondary, textAlign: 'center', lineHeight: 22 }),
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    singleButton: {
        justifyContent: 'center',
    },
    button: {
        flex: 1,
        borderRadius: theme_1.BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    fullButton: {
        flex: 1,
    },
    buttonGradient: {
        paddingVertical: theme_1.SPACING.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme_1.COLORS.surfaceSecondary,
        paddingVertical: theme_1.SPACING.md,
        alignItems: 'center',
        borderRadius: theme_1.BORDER_RADIUS.md,
    },
    cancelButtonText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: theme_1.COLORS.textSecondary }),
    buttonText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: theme_1.COLORS.textInverse }),
});
exports.default = CustomAlert;
// Helper hook for easy usage
const useAlert = () => {
    const [alertConfig, setAlertConfig] = react_1.default.useState({
        visible: false,
        title: '',
    });
    const showAlert = react_1.default.useCallback((config) => {
        setAlertConfig(Object.assign(Object.assign({}, config), { visible: true, onDismiss: () => setAlertConfig(prev => (Object.assign(Object.assign({}, prev), { visible: false }))) }));
    }, []);
    const hideAlert = react_1.default.useCallback(() => setAlertConfig(prev => (Object.assign(Object.assign({}, prev), { visible: false }))), []);
    // Change: return a functional component instead of a static JSX element
    const AlertComponent = react_1.default.useCallback(() => (<CustomAlert {...alertConfig} onDismiss={hideAlert}/>), [alertConfig, hideAlert]);
    return { showAlert, hideAlert, AlertComponent };
};
exports.useAlert = useAlert;
