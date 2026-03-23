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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const authStore_1 = require("../store/authStore");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const EmailVerificationScreen = ({ route, navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { email, type = 'email' } = route.params || {};
    const [code, setCode] = (0, react_1.useState)(['', '', '', '', '', '']);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [timer, setTimer] = (0, react_1.useState)(60);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { setSession } = (0, authStore_1.useAuthStore)();
    const inputs = (0, react_1.useRef)([]);
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const shakeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, []);
    (0, react_1.useEffect)(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
        return () => { };
    }, [timer]);
    const handleCodeChange = (text, index) => {
        var _a;
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);
        // Auto-focus next input
        if (text && index < 5) {
            (_a = inputs.current[index + 1]) === null || _a === void 0 ? void 0 : _a.focus();
        }
        // Auto-verify when all digits filled
        if (index === 5 && text) {
            const fullCode = newCode.join('');
            if (fullCode.length === 6) {
                handleVerify(fullCode);
            }
        }
    };
    const handleKeyPress = (key, index) => {
        var _a;
        if (key === 'Backspace' && !code[index] && index > 0) {
            (_a = inputs.current[index - 1]) === null || _a === void 0 ? void 0 : _a.focus();
            const newCode = [...code];
            newCode[index - 1] = '';
            setCode(newCode);
        }
    };
    const shake = () => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };
    const handleVerify = (fullCode) => __awaiter(void 0, void 0, void 0, function* () {
        const verificationCode = fullCode || code.join('');
        if (verificationCode.length !== 6)
            return;
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { data, error } = yield supabase.verifyOTP(email, verificationCode, type);
            if (error)
                throw error;
            if (data.session) {
                setSession(data.session);
            }
            setLoading(false);
            navigation.replace('Main');
        }
        catch (err) {
            shake();
            setLoading(false);
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || (isTurkish ? 'Geçersiz kod.' : 'Invalid code.'), buttons: [{ text: 'OK' }] });
        }
    });
    const handleResend = () => __awaiter(void 0, void 0, void 0, function* () {
        if (timer > 0)
            return;
        setTimer(60);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            // Use resend API – works for both signup and email change without needing password
            yield supabase.resendVerification(email, type === 'signup' ? 'signup' : 'email_change');
        }
        catch (err) {
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message, buttons: [{ text: 'OK' }] });
        }
    });
    return (<react_native_1.TouchableWithoutFeedback onPress={react_native_1.Keyboard.dismiss}>
      <react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
        <AlertComponent />
        <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* Header */}
          <react_native_1.View style={[styles.headerArea, { paddingTop: insets.top }]}>
            <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Auth')} style={styles.backBtn}>
              <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <react_native_1.View style={styles.content}>
            <react_native_1.Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
              <react_native_1.View style={styles.iconCircle}>
                <vector_icons_1.Ionicons name="mail-unread-outline" size={48} color={colors.primary}/>
              </react_native_1.View>
            </react_native_1.Animated.View>

            <react_native_1.Text style={styles.titleText}>{isTurkish ? 'E-postanızı Doğrulayın' : 'Verify Email'}</react_native_1.Text>
            <react_native_1.Text style={styles.subtitleText}>
              {isTurkish ? 'Şu adrese 6 haneli bir kod gönderdik:' : 'We sent a 6-digit code to:'}{'\n'}
              <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text })}>{email}</react_native_1.Text>
            </react_native_1.Text>

            <react_native_1.Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
              {code.map((digit, index) => (<react_native_1.TextInput key={index} ref={ref => { inputs.current[index] = ref; }} style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
            ]} value={digit} onChangeText={text => handleCodeChange(text, index)} onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)} keyboardType="number-pad" maxLength={1} selectTextOnFocus/>))}
            </react_native_1.Animated.View>

            <AnimatedButton_1.default title={isTurkish ? 'Doğrula' : 'Verify'} onPress={() => handleVerify()} loading={loading} disabled={code.join('').length !== 6} size="large" style={styles.verifyBtn}/>

            <react_native_1.View style={styles.resendRow}>
              <react_native_1.Text style={styles.resendText}>
                {isTurkish ? 'Kodu almadınız mı?' : "Didn't receive the code?"}
              </react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                <react_native_1.Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `${isTurkish ? 'Tekrar Gönder' : 'Resend'} (${timer}s)` : isTurkish ? 'Tekrar Gönder' : 'Resend'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.KeyboardAvoidingView>
      </react_native_1.View>
    </react_native_1.TouchableWithoutFeedback>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    headerArea: {
        paddingHorizontal: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.sm,
    },
    backBtn: {
        padding: theme_1.SPACING.sm,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: theme_1.SPACING.xl,
        paddingTop: theme_1.SPACING.xxl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: theme_1.SPACING.xxl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    titleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.text, textAlign: 'center', marginBottom: theme_1.SPACING.sm }),
    subtitleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', marginBottom: theme_1.SPACING.xxxl, paddingHorizontal: theme_1.SPACING.md, lineHeight: 24 }),
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.xxxl,
    },
    codeInput: {
        width: 50,
        height: 60,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    codeInputFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    verifyBtn: {
        width: '100%',
        marginBottom: theme_1.SPACING.xl,
    },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme_1.SPACING.xs,
    },
    resendText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    resendLink: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary }),
    resendDisabled: {
        color: colors.textTertiary,
    },
});
exports.default = EmailVerificationScreen;
