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
const expo_image_1 = require("expo-image");
const vector_icons_1 = require("@expo/vector-icons");
const FloatingInput_1 = __importDefault(require("../components/FloatingInput"));
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const CustomAlert_1 = require("../components/CustomAlert");
const contentModerationService_1 = require("../services/contentModerationService");
const agreementService_1 = require("../services/agreementService");
const SupabaseContext_1 = require("../contexts/SupabaseContext");
const useTranslation_1 = require("../hooks/useTranslation");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const validation_1 = require("../utils/validation");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const PremiumFeaturesModal_1 = __importDefault(require("../components/PremiumFeaturesModal"));
// --- Login rate limiting ---
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30000; // 30 seconds
/** Map raw Supabase auth errors to user-friendly messages (no internal details exposed). */
const sanitizeAuthError = (msg, isTurkish) => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login') || lower.includes('invalid_credentials') || lower.includes('wrong password'))
        return isTurkish ? 'E-posta veya şifre hatalı.' : 'Invalid email or password.';
    if (lower.includes('email not confirmed'))
        return isTurkish ? 'Lütfen e-postanızı doğrulayın.' : 'Please verify your email first.';
    if (lower.includes('rate') || lower.includes('too many'))
        return isTurkish ? 'Çok fazla deneme. Lütfen bekleyin.' : 'Too many attempts. Please wait.';
    if (lower.includes('network') || lower.includes('fetch'))
        return isTurkish ? 'Bağlantı hatası. İnternetinizi kontrol edin.' : 'Connection error. Check your internet.';
    // Generic fallback – never expose raw error text
    return isTurkish ? 'Giriş yapılamadı. Tekrar deneyin.' : 'Login failed. Please try again.';
};
const AuthScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { width, height } = (0, react_native_1.useWindowDimensions)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const { signIn, signOut } = (0, SupabaseContext_1.useSupabaseAuth)(); // Move hook to top level
    const PREMIUM_POPUP_SHOWN_KEY = 'NextSelf_premium_popup_shown';
    const [showPremiumModal, setShowPremiumModal] = react_1.default.useState(false);
    // Show premium popup only on the login screen (first launch)
    (0, react_1.useEffect)(() => {
        let timeoutId = null;
        const checkPremiumPopup = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const shown = yield platformStorage_1.default.getItem(PREMIUM_POPUP_SHOWN_KEY);
                if (!shown) {
                    timeoutId = setTimeout(() => setShowPremiumModal(true), 800);
                    yield platformStorage_1.default.setItem(PREMIUM_POPUP_SHOWN_KEY, 'true');
                }
            }
            catch (_a) { }
        });
        checkPremiumPopup();
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
        };
    }, []);
    // Rate-limiting state
    const failedAttempts = (0, react_1.useRef)(0);
    const lockedUntil = (0, react_1.useRef)(0);
    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };
    const handleLogin = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        react_native_1.Keyboard.dismiss();
        if (!email || !password) {
            setError(isTurkish ? 'Lütfen tüm alanları doldurun.' : 'Please fill all fields.');
            return;
        }
        const emailValidation = validation_1.ValidationUtils.validateEmail(email);
        if (!emailValidation.isValid) {
            setError(isTurkish ? 'Geçerli bir e-posta adresi girin.' : 'Please enter a valid email address.');
            return;
        }
        // For login, don't enforce registration-strength password rules.
        // Only ensure the field is present (checked above). Server will verify credentials.
        // Enforce rate-limit lockout
        const now = Date.now();
        if (now < lockedUntil.current) {
            const remaining = Math.ceil((lockedUntil.current - now) / 1000);
            setError(isTurkish
                ? `Çok fazla deneme. ${remaining} saniye bekleyin.`
                : `Too many attempts. Wait ${remaining} seconds.`);
            return;
        }
        setLoading(true);
        setError('');
        try {
            // signIn and signOut are now available from top-level hook destructuring
            if (!signIn)
                throw new Error('Auth provider not ready');
            const result = yield signIn(email, password);
            // supabase-js style result: { data, error } or wrapped exchange result
            const authError = (result === null || result === void 0 ? void 0 : result.error) || ((result === null || result === void 0 ? void 0 : result.data) && result.data.error) || null;
            // Debug: log full result to help diagnose server-side failures
            if (__DEV__) {
                try {
                    console.warn('[Auth] signIn result:', result);
                }
                catch (_) { }
            }
            if (authError) {
                failedAttempts.current += 1;
                if (failedAttempts.current >= MAX_ATTEMPTS) {
                    const lockMs = BASE_LOCKOUT_MS * Math.pow(2, Math.floor(failedAttempts.current / MAX_ATTEMPTS) - 1);
                    lockedUntil.current = Date.now() + lockMs;
                }
                const friendly = sanitizeAuthError((authError && (authError.message || String(authError))) || String(authError), isTurkish);
                if (__DEV__) {
                    // In development show the raw message to aid debugging
                    const raw = (authError && (authError.message || JSON.stringify(authError))) || String(authError);
                    setError(`${friendly} (${raw})`);
                }
                else {
                    setError(friendly);
                }
                setLoading(false);
                return;
            }
            failedAttempts.current = 0;
            // Determine returned user (may be in result.data.user or result.user)
            const user = ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.user) || (result === null || result === void 0 ? void 0 : result.user) || ((result === null || result === void 0 ? void 0 : result.data) && result.data.user) || null;
            if (user) {
                const modService = contentModerationService_1.ContentModerationService.getInstance();
                const banStatus = yield modService.checkBanStatus(user.id);
                if (banStatus.isBanned) {
                    const msg = modService.getBanMessage(banStatus, isTurkish);
                    // best-effort sign out to clear any lingering session state
                    try {
                        yield signOut();
                    }
                    catch (_b) { }
                    ;
                    setError(msg.message);
                    setLoading(false);
                    return;
                }
            }
            // Check if user has accepted all required agreements
            if (user) {
                const agreementService = agreementService_1.AgreementService.getInstance();
                const { allAccepted } = yield agreementService.hasAcceptedAll(user.id);
                if (!allAccepted) {
                    // Redirect to Terms screen to accept agreements
                    navigation.replace('Terms', { fromAuth: true, userId: user.id });
                    return;
                }
            }
            navigation.replace('Main');
        }
        catch (err) {
            failedAttempts.current += 1;
            setError(sanitizeAuthError((err === null || err === void 0 ? void 0 : err.message) || String(err || ''), isTurkish));
        }
        finally {
            setLoading(false);
        }
    });
    return (<react_native_safe_area_context_1.SafeAreaView style={theme_1.COMMON_STYLES.screenContainer}>
      <PremiumFeaturesModal_1.default visible={showPremiumModal} onClose={() => setShowPremiumModal(false)}/>
      <AlertComponent />
      <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardArea}>
        <react_native_1.ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: theme_1.SPACING.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header Section */}
          <react_native_1.View style={styles.headerSection}>
            <expo_image_1.Image source={require('../assets/icon.png')} style={styles.logoImage} contentFit="contain" cachePolicy="memory-disk" transition={500}/>
            <react_native_1.Text style={styles.appName}>NEXTSELF</react_native_1.Text>
            <react_native_1.Text style={styles.tagline}>
              {isTurkish ? 'Wellness & Performans' : 'Wellness & Performance'}
            </react_native_1.Text>
          </react_native_1.View>

          {/* Form Section */}
          <AnimatedCard_1.default animationType="slideUp" delay={100} duration={600} style={styles.cardWrapper}>
            <react_native_1.Text style={styles.welcomeText}>
              {isTurkish ? 'Hoş Geldiniz' : 'Welcome Back'}
            </react_native_1.Text>
            <react_native_1.Text style={styles.subText}>
              {isTurkish ? 'Lütfen hesabınıza giriş yapın.' : 'Please sign in to your account.'}
            </react_native_1.Text>

            {error ? (<react_native_1.View style={styles.errorBox}>
                <vector_icons_1.Ionicons name="warning-outline" size={20} color={colors.error}/>
                <react_native_1.Text style={styles.errorText} numberOfLines={2}>{error}</react_native_1.Text>
              </react_native_1.View>) : null}

            <react_native_1.View style={styles.inputGroup}>
              <FloatingInput_1.default label={isTurkish ? 'E-POSTA' : 'EMAIL'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon={<vector_icons_1.Ionicons name="mail-outline" size={20} color={colors.textSecondary}/>}/>
              <FloatingInput_1.default label={isTurkish ? 'ŞİFRE' : 'PASSWORD'} value={password} onChangeText={setPassword} secureTextEntry icon={<vector_icons_1.Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary}/>}/>
            </react_native_1.View>

            <react_native_1.TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <react_native_1.Text style={styles.forgotText}>
                {isTurkish ? 'Şifremi Unuttum' : 'Forgot Password?'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <AnimatedButton_1.default title={isTurkish ? 'Giriş Yap' : 'Sign In'} onPress={handleLogin} loading={loading} size="large" style={styles.loginBtn}/>

            <react_native_1.View style={styles.dividerBox}>
              <react_native_1.View style={styles.dividerLine}/>
              <react_native_1.Text style={styles.dividerText}>OR</react_native_1.Text>
              <react_native_1.View style={styles.dividerLine}/>
            </react_native_1.View>

            <AnimatedButton_1.default title={isTurkish ? 'Yeni Hesap Oluştur' : 'Create Account'} onPress={() => navigation.navigate('Register')} variant="secondary" size="large" style={styles.registerBtn}/>
          </AnimatedCard_1.default>
        </react_native_1.ScrollView>
      </react_native_1.KeyboardAvoidingView>
    </react_native_safe_area_context_1.SafeAreaView>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    keyboardArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme_1.SPACING.md,
        paddingTop: theme_1.SPACING.xxl,
        paddingBottom: theme_1.SPACING.xxxl,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: theme_1.SPACING.xl,
    },
    // Optically centered logo with proper padding
    logoImage: {
        width: 88,
        height: 88,
        borderRadius: theme_1.BORDER_RADIUS.xl,
        marginBottom: theme_1.SPACING.sm,
    },
    appName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { letterSpacing: 2, textAlign: 'center' }),
    tagline: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: theme_1.SPACING.xs, textAlign: 'center' }),
    cardWrapper: {
        padding: theme_1.SPACING.lg,
    },
    welcomeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { marginBottom: theme_1.SPACING.xs, textAlign: 'left' }),
    subText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginBottom: theme_1.SPACING.lg }),
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorSoft,
        padding: theme_1.SPACING.sm,
        borderRadius: theme_1.BORDER_RADIUS.md,
        marginBottom: theme_1.SPACING.md,
        gap: theme_1.SPACING.xs,
    },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.error, flex: 1 }),
    // 8px grid aligned input group
    inputGroup: {
        gap: theme_1.SPACING.sm,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: theme_1.SPACING.xs,
        marginBottom: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.xs,
        paddingHorizontal: theme_1.SPACING.xs,
    },
    forgotText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.primary, fontWeight: '600' }),
    loginBtn: {
        width: '100%',
    },
    // 8px grid aligned divider
    dividerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
    },
    dividerText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, paddingHorizontal: theme_1.SPACING.xs }),
    registerBtn: {
        width: '100%',
    },
});
exports.default = AuthScreen;
