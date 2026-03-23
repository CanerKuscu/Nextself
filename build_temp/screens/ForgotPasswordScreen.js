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
const FloatingInput_1 = __importDefault(require("../components/FloatingInput"));
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const ForgotPasswordScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [phase, setPhase] = (0, react_1.useState)('email');
    const [email, setEmail] = (0, react_1.useState)('');
    const [code, setCode] = (0, react_1.useState)(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [timer, setTimer] = (0, react_1.useState)(0);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const inputs = (0, react_1.useRef)([]);
    const shakeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    (0, react_1.useEffect)(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
        return () => { };
    }, [timer]);
    const shake = () => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            react_native_1.Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };
    const animatePhaseChange = (newPhase) => {
        react_native_1.Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setPhase(newPhase);
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };
    // Phase 1: Send OTP to email
    const handleSendCode = () => __awaiter(void 0, void 0, void 0, function* () {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !trimmedEmail.includes('@')) {
            setError(isTurkish ? 'Geçerli bir e-posta adresi girin.' : 'Enter a valid email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            yield supabase.sendOTP(trimmedEmail);
            setTimer(60);
            animatePhaseChange('code');
        }
        catch (err) {
            // Don't reveal whether email exists
            setTimer(60);
            animatePhaseChange('code');
        }
        finally {
            setLoading(false);
        }
    });
    // Phase 2: Verify OTP code
    const handleCodeChange = (text, index) => {
        var _a;
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);
        if (text && index < 5) {
            (_a = inputs.current[index + 1]) === null || _a === void 0 ? void 0 : _a.focus();
        }
        if (index === 5 && text) {
            const fullCode = newCode.join('');
            if (fullCode.length === 6) {
                handleVerifyCode(fullCode);
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
    const handleVerifyCode = (fullCode) => __awaiter(void 0, void 0, void 0, function* () {
        const verificationCode = fullCode || code.join('');
        if (verificationCode.length !== 6)
            return;
        setLoading(true);
        setError('');
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { error: verifyError } = yield supabase.verifyOTP(email.trim().toLowerCase(), verificationCode, 'email');
            if (verifyError)
                throw verifyError;
            animatePhaseChange('newPassword');
        }
        catch (err) {
            shake();
            setError(isTurkish ? 'Geçersiz veya süresi dolmuş kod.' : 'Invalid or expired code.');
        }
        finally {
            setLoading(false);
        }
    });
    const handleResend = () => __awaiter(void 0, void 0, void 0, function* () {
        if (timer > 0)
            return;
        setTimer(60);
        setCode(['', '', '', '', '', '']);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            yield supabase.sendOTP(email.trim().toLowerCase());
        }
        catch (err) {
            // Silent fail
        }
    });
    // Phase 3: Set new password
    const validatePassword = (pass) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass);
    };
    const handleResetPassword = () => __awaiter(void 0, void 0, void 0, function* () {
        setError('');
        if (!validatePassword(newPassword)) {
            setError(isTurkish ? 'Şifre zayıf (8+ hane, Büyük/Küçük harf, Sayı, Sembol).' : 'Weak password (8+ chars, upper/lower/num/symbol).');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(isTurkish ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { error: updateError } = yield supabase.updatePassword(newPassword);
            if (updateError)
                throw updateError;
            showAlert({
                type: 'success',
                title: isTurkish ? 'Başarılı' : 'Success',
                message: isTurkish ? 'Şifreniz başarıyla güncellendi.' : 'Your password has been updated.',
                buttons: [{
                        text: 'OK',
                        onPress: () => navigation.navigate('Auth'),
                    }],
            });
        }
        catch (err) {
            setError(err.message || (isTurkish ? 'Şifre güncellenirken hata oluştu.' : 'Failed to update password.'));
        }
        finally {
            setLoading(false);
        }
    });
    const getPhaseTitle = () => {
        switch (phase) {
            case 'email': return isTurkish ? 'Şifremi Unuttum' : 'Forgot Password';
            case 'code': return isTurkish ? 'Doğrulama Kodu' : 'Verification Code';
            case 'newPassword': return isTurkish ? 'Yeni Şifre' : 'New Password';
        }
    };
    const getPhaseSubtitle = () => {
        switch (phase) {
            case 'email': return isTurkish ? 'Hesabınıza kayıtlı e-posta adresinizi girin.' : 'Enter the email address linked to your account.';
            case 'code': return isTurkish ? `Şu adrese 6 haneli bir kod gönderdik: ${email}` : `We sent a 6-digit code to: ${email}`;
            case 'newPassword': return isTurkish ? 'Yeni şifrenizi oluşturun.' : 'Create your new password.';
        }
    };
    const getPhaseIcon = () => {
        switch (phase) {
            case 'email': return 'mail-outline';
            case 'code': return 'keypad-outline';
            case 'newPassword': return 'lock-open-outline';
        }
    };
    return (<react_native_1.TouchableWithoutFeedback onPress={react_native_1.Keyboard.dismiss}>
            <react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
                <AlertComponent />
                <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                    {/* Header */}
                    <react_native_1.View style={[styles.headerArea, { paddingTop: insets.top + theme_1.SPACING.md }]}>
                        <react_native_1.TouchableOpacity onPress={() => phase === 'email' ? (0, navigation_1.safeGoBack)(navigation, 'Auth') : animatePhaseChange(phase === 'code' ? 'email' : 'code')} style={styles.backBtn}>
                            <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                        </react_native_1.TouchableOpacity>
                        <react_native_1.View style={styles.headerTitleWrap}>
                            <react_native_1.Text style={styles.headerTitle}>{getPhaseTitle()}</react_native_1.Text>
                            <react_native_1.View style={styles.stepIndicator}>
                                {['email', 'code', 'newPassword'].map((p, i) => (<react_native_1.View key={i} style={[styles.stepDot, (['email', 'code', 'newPassword'].indexOf(phase) >= i) && styles.stepDotActive]}/>))}
                            </react_native_1.View>
                        </react_native_1.View>
                    </react_native_1.View>

                    <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <react_native_1.Animated.View style={{ opacity: fadeAnim }}>

                            {/* Icon */}
                            <react_native_1.View style={styles.iconContainer}>
                                <react_native_1.View style={styles.iconCircle}>
                                    <vector_icons_1.Ionicons name={getPhaseIcon()} size={40} color={colors.primary}/>
                                </react_native_1.View>
                            </react_native_1.View>

                            <react_native_1.Text style={styles.titleText}>{getPhaseTitle()}</react_native_1.Text>
                            <react_native_1.Text style={styles.subtitleText}>{getPhaseSubtitle()}</react_native_1.Text>

                            {error ? (<react_native_1.View style={styles.errorBox}>
                                    <vector_icons_1.Ionicons name="warning-outline" size={18} color={colors.error}/>
                                    <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>
                                </react_native_1.View>) : null}

                            {/* Phase 1: Email Input */}
                            {phase === 'email' && (<react_native_1.View>
                                    <FloatingInput_1.default label={isTurkish ? 'E-POSTA' : 'EMAIL'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon={<vector_icons_1.Ionicons name="mail-outline" size={20} color={colors.textSecondary}/>}/>
                                    <AnimatedButton_1.default title={isTurkish ? 'Kod Gönder' : 'Send Code'} onPress={handleSendCode} loading={loading} size="large" style={styles.actionBtn}/>
                                </react_native_1.View>)}

                            {/* Phase 2: OTP Code Input */}
                            {phase === 'code' && (<react_native_1.View>
                                    <react_native_1.Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
                                        {code.map((digit, index) => (<react_native_1.TextInput key={index} ref={ref => { inputs.current[index] = ref; }} style={[styles.codeInput, digit ? styles.codeInputFilled : null]} value={digit} onChangeText={text => handleCodeChange(text, index)} onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)} keyboardType="number-pad" maxLength={1} selectTextOnFocus/>))}
                                    </react_native_1.Animated.View>

                                    <AnimatedButton_1.default title={isTurkish ? 'Doğrula' : 'Verify'} onPress={() => handleVerifyCode()} loading={loading} disabled={code.join('').length !== 6} size="large" style={styles.actionBtn}/>

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
                                </react_native_1.View>)}

                            {/* Phase 3: New Password */}
                            {phase === 'newPassword' && (<react_native_1.View>
                                    <FloatingInput_1.default label={isTurkish ? 'YENİ ŞİFRE' : 'NEW PASSWORD'} value={newPassword} onChangeText={setNewPassword} secureTextEntry icon={<vector_icons_1.Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary}/>}/>
                                    <FloatingInput_1.default label={isTurkish ? 'ŞİFREYİ ONAYLA' : 'CONFIRM PASSWORD'} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon={<vector_icons_1.Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary}/>}/>
                                    <AnimatedButton_1.default title={isTurkish ? 'Şifreyi Güncelle' : 'Update Password'} onPress={handleResetPassword} loading={loading} size="large" style={styles.actionBtn}/>
                                </react_native_1.View>)}

                        </react_native_1.Animated.View>
                    </react_native_1.ScrollView>
                </react_native_1.KeyboardAvoidingView>
            </react_native_1.View>
        </react_native_1.TouchableWithoutFeedback>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backBtn: {
        padding: theme_1.SPACING.sm,
    },
    headerTitleWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: theme_1.SPACING.sm,
        marginRight: theme_1.SPACING.md,
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    stepIndicator: {
        flexDirection: 'row',
        gap: 8,
    },
    stepDot: {
        width: 24,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: theme_1.BORDER_RADIUS.pill,
    },
    stepDotActive: {
        backgroundColor: colors.primary,
    },
    scrollContent: {
        paddingHorizontal: theme_1.SPACING.xl,
        paddingTop: theme_1.SPACING.xxl,
        paddingBottom: theme_1.SPACING.xxxl,
        flexGrow: 1,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: theme_1.SPACING.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    titleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.text, textAlign: 'center', marginBottom: theme_1.SPACING.sm }),
    subtitleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', marginBottom: theme_1.SPACING.xxl, lineHeight: 22 }),
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorSoft,
        padding: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.md,
        marginBottom: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.error, flex: 1 }),
    actionBtn: {
        width: '100%',
        marginTop: theme_1.SPACING.xl,
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme_1.SPACING.sm,
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
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme_1.SPACING.xs,
        marginTop: theme_1.SPACING.xl,
    },
    resendText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    resendLink: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary }),
    resendDisabled: {
        color: colors.textTertiary,
    },
});
exports.default = ForgotPasswordScreen;
