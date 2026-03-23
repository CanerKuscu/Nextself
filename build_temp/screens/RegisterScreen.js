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
const dateUtils_1 = require("../utils/dateUtils");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const useDebounce_1 = require("../hooks/useDebounce");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const security_1 = require("../utils/security");
const agreementService_1 = require("../services/agreementService");
const datetimepicker_1 = __importDefault(require("@react-native-community/datetimepicker"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const { width } = react_native_1.Dimensions.get('window');
const STEP_WIDTH = width;
const RegisterScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [step, setStep] = (0, react_1.useState)(1);
    const [role, setRole] = (0, react_1.useState)('user');
    // Account details
    const [username, setUsername] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    // Personal details
    const [firstName, setFirstName] = (0, react_1.useState)('');
    const [lastName, setLastName] = (0, react_1.useState)('');
    const [gender, setGender] = (0, react_1.useState)('');
    const [dateOfBirth, setDateOfBirth] = (0, react_1.useState)('');
    const [showDatePicker, setShowDatePicker] = (0, react_1.useState)(false);
    const [userHeight, setUserHeight] = (0, react_1.useState)('');
    const [weight, setWeight] = (0, react_1.useState)('');
    // Agreements
    const [agreedTerms, setAgreedTerms] = (0, react_1.useState)(false);
    const [agreedPrivacy, setAgreedPrivacy] = (0, react_1.useState)(false);
    const [agreedKVKK, setAgreedKVKK] = (0, react_1.useState)(false);
    const [agreedSubscription, setAgreedSubscription] = (0, react_1.useState)(false);
    // Status hooks
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [errors, setErrors] = (0, react_1.useState)({});
    const [usernameAvailable, setUsernameAvailable] = (0, react_1.useState)(null);
    const [emailAvailable, setEmailAvailable] = (0, react_1.useState)(null);
    const [checkingUsername, setCheckingUsername] = (0, react_1.useState)(false);
    const [checkingEmail, setCheckingEmail] = (0, react_1.useState)(false);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const debouncedUsername = (0, useDebounce_1.useDebounce)(username, 500);
    const debouncedEmail = (0, useDebounce_1.useDebounce)(email, 500);
    // Animations
    const slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const ROLES = [
        { id: 'user', title: isTurkish ? 'Sporcu' : 'Athlete', icon: 'flash', desc: isTurkish ? 'Kendi antrenmanını takip et' : 'Track my fitness journey' },
        { id: 'pt', title: isTurkish ? 'Antrenör' : 'Trainer', icon: 'barbell', desc: isTurkish ? 'Öğrencilere koçluk yap' : 'Coach clients to success' },
        { id: 'dietitian', title: isTurkish ? 'Diyetisyen' : 'Dietitian', icon: 'nutrition', desc: isTurkish ? 'Beslenme planları oluştur' : 'Provide expert meal plans' }
    ];
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);
    (0, react_1.useEffect)(() => {
        if (debouncedUsername && debouncedUsername.length >= 3) {
            checkUsername(debouncedUsername);
        }
        else {
            setUsernameAvailable(null);
        }
    }, [debouncedUsername]);
    (0, react_1.useEffect)(() => {
        if (debouncedEmail && debouncedEmail.includes('@')) {
            checkEmail(debouncedEmail);
        }
        else {
            setEmailAvailable(null);
        }
    }, [debouncedEmail]);
    const checkUsername = (name) => __awaiter(void 0, void 0, void 0, function* () {
        setCheckingUsername(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const available = yield supabase.checkUsernameAvailability(name);
            setUsernameAvailable(available);
        }
        catch (err) {
            console.error('Username check failed');
        }
        finally {
            setCheckingUsername(false);
        }
    });
    const checkEmail = (mail) => __awaiter(void 0, void 0, void 0, function* () {
        setCheckingEmail(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const available = yield supabase.checkEmailAvailability(mail);
            setEmailAvailable(available);
        }
        catch (err) {
            console.error('Email check failed');
        }
        finally {
            setCheckingEmail(false);
        }
    });
    const animateStep = (newStep) => {
        react_native_1.Animated.spring(slideAnim, {
            toValue: (newStep - 1) * -STEP_WIDTH,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
        }).start();
        setStep(newStep);
    };
    const validatePassword = (pass) => {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return re.test(pass);
    };
    const validateStep1 = () => {
        const newErrors = {};
        if (!role)
            newErrors.role = isTurkish ? 'Devam etmek için bir rol seçin' : 'Select a role to continue';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateStep2 = () => {
        const newErrors = {};
        if (!firstName)
            newErrors.firstName = t('required_field');
        if (!lastName)
            newErrors.lastName = t('required_field');
        if (!username || username.length < 3) {
            newErrors.username = isTurkish ? 'En az 3 karakter' : 'Min 3 chars';
        }
        else if (usernameAvailable === false) {
            newErrors.username = isTurkish ? 'Kullanılamaz' : 'Unavailable';
        }
        if (!email || !email.includes('@'))
            newErrors.email = t('invalid_email');
        if (emailAvailable === false)
            newErrors.email = isTurkish ? 'Kullanılamaz' : 'Unavailable';
        if (!password) {
            newErrors.password = t('required_field');
        }
        else if (!validatePassword(password)) {
            newErrors.password = isTurkish ? 'Şifre zayıf (8+ hane, Büyük/Küçük harf, Sayı, Sembol).' : 'Weak password (8+ chars, upper/lower/num/symbol).';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = isTurkish ? 'Şifreler eşleşmiyor' : 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateStep3 = () => {
        const newErrors = {};
        if (!gender)
            newErrors.gender = t('required_field');
        if (!dateOfBirth)
            newErrors.dateOfBirth = t('required_field');
        if (!userHeight)
            newErrors.height = t('required_field');
        if (!weight)
            newErrors.weight = t('required_field');
        if (!agreedTerms)
            newErrors.agreedTerms = isTurkish ? 'Zorunlu' : 'Required';
        if (!agreedPrivacy)
            newErrors.agreedPrivacy = isTurkish ? 'Zorunlu' : 'Required';
        if (!agreedKVKK)
            newErrors.agreedKVKK = isTurkish ? 'Zorunlu' : 'Required';
        if (!agreedSubscription)
            newErrors.agreedSubscription = isTurkish ? 'Zorunlu' : 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleNextToStep2 = () => { if (validateStep1())
        animateStep(2); };
    const handleNextToStep3 = () => { if (validateStep2())
        animateStep(3); };
    const handleRegister = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (!validateStep3())
            return;
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { data, error } = yield supabase.signUp(email.trim().toLowerCase(), password, {
                username: security_1.SecurityUtils.sanitizeInput(username.trim().toLowerCase()),
                full_name: security_1.SecurityUtils.sanitizeInput(firstName.trim() + ' ' + lastName.trim()),
                date_of_birth: dateOfBirth,
                height_cm: userHeight ? parseFloat(userHeight) : null,
                weight_kg: weight ? parseFloat(weight) : null,
                user_type: role,
                gender: gender,
            });
            if (error) {
                showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: error.message, buttons: [{ text: 'OK' }] });
            }
            else {
                // Save all 5 user agreements to Supabase
                if ((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.id) {
                    try {
                        const agreementService = agreementService_1.AgreementService.getInstance();
                        yield agreementService.acceptAllRegistrationAgreements(data.user.id);
                    }
                    catch (e) {
                        console.warn('Agreement save error:', e);
                    }
                }
                navigation.navigate('EmailVerification', { email, type: 'signup' });
            }
        }
        catch (err) {
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || 'Something went wrong.', buttons: [{ text: 'OK' }] });
        }
        finally {
            setLoading(false);
        }
    });
    return (<react_native_safe_area_context_1.SafeAreaView style={theme_1.COMMON_STYLES.screenContainer}>
      <AlertComponent />
      <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardArea}>

        {/* Header Block */}
        <react_native_1.View style={[styles.headerArea, { paddingTop: theme_1.SPACING.md }]}>
          <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Auth')} style={styles.backBtn}>
            <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
          </react_native_1.TouchableOpacity>
          <react_native_1.View style={styles.headerTitleWrap}>
            <react_native_1.Text style={styles.titleText}>{isTurkish ? 'Kayıt Ol' : 'Register'}</react_native_1.Text>
            <react_native_1.View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (<react_native_1.View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}/>))}
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <react_native_1.Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>

            {/* STEP 1: ROLE */}
            <react_native_1.ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <react_native_1.Text style={styles.stepTitle}>{isTurkish ? 'Hesap Türü' : 'Account Type'}</react_native_1.Text>
              <react_native_1.Text style={styles.stepSubtitle}>{isTurkish ? 'Profilinizi nasıl kullanacaksınız?' : 'How will you use the app?'}</react_native_1.Text>

              <react_native_1.View style={styles.roleContainer}>
                {ROLES.map((r) => {
            const isActive = role === r.id;
            return (<react_native_1.TouchableOpacity key={r.id} style={[
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                ]} onPress={() => setRole(r.id)} activeOpacity={0.7}>
                      <react_native_1.View style={[styles.roleIconWrap, isActive && styles.roleIconWrapActive]}>
                        <vector_icons_1.Ionicons name={r.icon} size={28} color={isActive ? colors.background : colors.textSecondary}/>
                      </react_native_1.View>
                      <react_native_1.View style={styles.roleTextWrap}>
                        <react_native_1.Text style={[styles.roleTitle, isActive && { color: colors.primary }]}>{r.title}</react_native_1.Text>
                        <react_native_1.Text style={styles.roleDesc}>{r.desc}</react_native_1.Text>
                      </react_native_1.View>
                      {isActive && (<vector_icons_1.Ionicons name="checkmark-circle" size={24} color={colors.primary}/>)}
                    </react_native_1.TouchableOpacity>);
        })}
              </react_native_1.View>

              {errors.role && <react_native_1.Text style={styles.errorText}>{errors.role}</react_native_1.Text>}

              <react_native_1.View style={styles.bottomBtnWrap}>
                <AnimatedButton_1.default title={isTurkish ? 'Devam Et' : 'Continue'} onPress={handleNextToStep2} size="large"/>
              </react_native_1.View>
            </react_native_1.ScrollView>

            {/* STEP 2: DETAILS */}
            <react_native_1.ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <react_native_1.Text style={styles.stepTitle}>{isTurkish ? 'Kimlik Bilgileri' : 'Personal Details'}</react_native_1.Text>
              <react_native_1.Text style={styles.stepSubtitle}>{isTurkish ? 'Temel bilgilerinizi girin.' : 'Enter your basic information.'}</react_native_1.Text>

              <react_native_1.View style={styles.row}>
                <react_native_1.View style={{ flex: 1, marginRight: theme_1.SPACING.md }}>
                  <FloatingInput_1.default label={isTurkish ? "AD" : "FIRST NAME"} value={firstName} onChangeText={setFirstName} error={errors.firstName}/>
                </react_native_1.View>
                <react_native_1.View style={{ flex: 1 }}>
                  <FloatingInput_1.default label={isTurkish ? "SOYAD" : "LAST NAME"} value={lastName} onChangeText={setLastName} error={errors.lastName}/>
                </react_native_1.View>
              </react_native_1.View>

              <FloatingInput_1.default label={isTurkish ? "KULLANICI ADI" : "USERNAME"} value={username} onChangeText={text => setUsername(text.replace(/[^a-z0-9_]/gi, '').toLowerCase())} error={errors.username} autoCapitalize="none"/>
              <FloatingInput_1.default label={isTurkish ? "E-POSTA" : "EMAIL"} value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none"/>
              <FloatingInput_1.default label={isTurkish ? "ŞİFRE" : "PASSWORD"} value={password} onChangeText={setPassword} error={errors.password} secureTextEntry/>
              <FloatingInput_1.default label={isTurkish ? "ŞİFREYİ ONAYLA" : "CONFIRM PASSWORD"} value={confirmPassword} onChangeText={setConfirmPassword} error={errors.confirmPassword} secureTextEntry/>

              <react_native_1.View style={styles.rowBtns}>
                <AnimatedButton_1.default title={isTurkish ? 'Geri' : 'Back'} onPress={() => animateStep(1)} variant="secondary" size="medium" style={{ flex: 1, marginRight: theme_1.SPACING.sm }}/>
                <AnimatedButton_1.default title={isTurkish ? 'İleri' : 'Next'} onPress={handleNextToStep3} size="medium" style={{ flex: 1, marginLeft: theme_1.SPACING.sm }}/>
              </react_native_1.View>
            </react_native_1.ScrollView>

            {/* STEP 3: METRICS */}
            <react_native_1.ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <react_native_1.Text style={styles.stepTitle}>{isTurkish ? 'Fiziksel Veriler' : 'Metrics'}</react_native_1.Text>
              <react_native_1.Text style={styles.stepSubtitle}>{isTurkish ? 'Son adımı tamamlayın.' : 'Complete the final step.'}</react_native_1.Text>

              <react_native_1.View style={styles.genderRow}>
                <react_native_1.TouchableOpacity onPress={() => setGender('male')} style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}>
                  <react_native_1.Text style={[styles.genderBtnText, gender === 'male' && { color: colors.primary }]}>{isTurkish ? 'ERKEK' : 'MALE'}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity onPress={() => setGender('female')} style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}>
                  <react_native_1.Text style={[styles.genderBtnText, gender === 'female' && { color: colors.primary }]}>{isTurkish ? 'KADIN' : 'FEMALE'}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
              {errors.gender && <react_native_1.Text style={styles.errorText}>{errors.gender}</react_native_1.Text>}

              <react_native_1.TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                <react_native_1.View pointerEvents="none">
                  <FloatingInput_1.default label={isTurkish ? "DOĞUM TARİHİ (YYYY-AA-GG)" : "DATE OF BIRTH (YYYY-MM-DD)"} value={dateOfBirth} onChangeText={setDateOfBirth} error={errors.dateOfBirth}/>
                </react_native_1.View>
              </react_native_1.TouchableOpacity>
              {showDatePicker && (<datetimepicker_1.default value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)} mode="date" display="default" maximumDate={new Date()} onChange={(event, selectedDate) => {
                setShowDatePicker(react_native_1.Platform.OS === 'ios');
                if (selectedDate) {
                    setDateOfBirth((0, dateUtils_1.getLocalDateString)(selectedDate));
                }
            }}/>)}

              <react_native_1.View style={styles.row}>
                <react_native_1.View style={{ flex: 1, marginRight: theme_1.SPACING.md }}>
                  <FloatingInput_1.default label={isTurkish ? "BOY (CM)" : "HEIGHT (CM)"} value={userHeight} onChangeText={setUserHeight} keyboardType="numeric" error={errors.height}/>
                </react_native_1.View>
                <react_native_1.View style={{ flex: 1 }}>
                  <FloatingInput_1.default label={isTurkish ? "KİLO (KG)" : "WEIGHT (KG)"} value={weight} onChangeText={setWeight} keyboardType="numeric" error={errors.weight}/>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.View style={styles.agreementBox}>
                <react_native_1.TouchableOpacity style={styles.checkRow} onPress={() => setAgreedKVKK(!agreedKVKK)}>
                  <react_native_1.View style={[styles.checkSquare, agreedKVKK && styles.checkSquareActive]}>
                    {agreedKVKK && <vector_icons_1.Ionicons name="checkmark" size={16} color={colors.textInverse}/>}
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.checkText, { fontWeight: '600' }]}>
                    {isTurkish
            ? 'Kişisel verilerimin işlenmesine, KVKK kapsamında sağlık verilerimin analiz edilmesine ve yurt dışına aktarımına açık rıza veriyorum. '
            : 'I give my explicit consent to the processing of my personal data, health data analysis, and cross-border data transfer. '}
                    <react_native_1.Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Terms', { section: 'consent' })}>
                      {isTurkish ? '(Açık Rıza Metni)' : '(Consent Form)'}
                    </react_native_1.Text>
                    {' '}
                    <react_native_1.Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Terms', { section: 'kvkk' })}>
                      {isTurkish ? '(KVKK)' : '(KVKK)'}
                    </react_native_1.Text>
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                {errors.agreedKVKK && <react_native_1.Text style={styles.errorText}>{errors.agreedKVKK}</react_native_1.Text>}

                <react_native_1.TouchableOpacity style={styles.checkRow} onPress={() => setAgreedTerms(!agreedTerms)}>
                  <react_native_1.View style={[styles.checkSquare, agreedTerms && styles.checkSquareActive]}>
                    {agreedTerms && <vector_icons_1.Ionicons name="checkmark" size={16} color={colors.textInverse}/>}
                  </react_native_1.View>
                  <react_native_1.Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <react_native_1.Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'terms' })}>
                      {isTurkish ? 'Kullanım Koşulları' : 'Terms of Service'}
                    </react_native_1.Text>
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                {errors.agreedTerms && <react_native_1.Text style={styles.errorText}>{errors.agreedTerms}</react_native_1.Text>}

                <react_native_1.TouchableOpacity style={styles.checkRow} onPress={() => setAgreedPrivacy(!agreedPrivacy)}>
                  <react_native_1.View style={[styles.checkSquare, agreedPrivacy && styles.checkSquareActive]}>
                    {agreedPrivacy && <vector_icons_1.Ionicons name="checkmark" size={16} color={colors.textInverse}/>}
                  </react_native_1.View>
                  <react_native_1.Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <react_native_1.Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'privacy' })}>
                      {isTurkish ? 'Gizlilik Politikası' : 'Privacy Policy'}
                    </react_native_1.Text>
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                {errors.agreedPrivacy && <react_native_1.Text style={styles.errorText}>{errors.agreedPrivacy}</react_native_1.Text>}

                <react_native_1.TouchableOpacity style={styles.checkRow} onPress={() => setAgreedSubscription(!agreedSubscription)}>
                  <react_native_1.View style={[styles.checkSquare, agreedSubscription && styles.checkSquareActive]}>
                    {agreedSubscription && <vector_icons_1.Ionicons name="checkmark" size={16} color={colors.textInverse}/>}
                  </react_native_1.View>
                  <react_native_1.Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <react_native_1.Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'subscription' })}>
                      {isTurkish ? 'Abonelik ve İade Politikası' : 'Subscription & Refund Policy'}
                    </react_native_1.Text>
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                {errors.agreedSubscription && <react_native_1.Text style={styles.errorText}>{errors.agreedSubscription}</react_native_1.Text>}
              </react_native_1.View>

              <react_native_1.View style={styles.rowBtns}>
                <AnimatedButton_1.default title={isTurkish ? 'Geri' : 'Back'} onPress={() => animateStep(2)} variant="secondary" size="medium" style={{ flex: 1, marginRight: theme_1.SPACING.sm }}/>
                <AnimatedButton_1.default title={isTurkish ? 'Kayıt Ol' : 'Register'} onPress={handleRegister} loading={loading} size="medium" style={{ flex: 1, marginLeft: theme_1.SPACING.sm }}/>
              </react_native_1.View>
            </react_native_1.ScrollView>

          </react_native_1.Animated.View>
        </react_native_1.Animated.View>
      </react_native_1.KeyboardAvoidingView>
    </react_native_safe_area_context_1.SafeAreaView>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    keyboardArea: {
        flex: 1,
    },
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
    titleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
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
    slider: {
        flexDirection: 'row',
        width: STEP_WIDTH * 3,
        flex: 1,
    },
    stepPage: {
        width: STEP_WIDTH,
        flex: 1,
    },
    scrollPage: {
        paddingHorizontal: theme_1.SPACING.xl,
        paddingTop: theme_1.SPACING.xl,
        paddingBottom: theme_1.SPACING.xxxl,
        flexGrow: 1,
    },
    stepTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.text, marginBottom: 4 }),
    stepSubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginBottom: theme_1.SPACING.xxl }),
    roleContainer: {
        gap: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.xxl,
    },
    roleCard: Object.assign({ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.lg, flexDirection: 'row', alignItems: 'center' }, theme_1.SHADOWS.sm),
    roleCardActive: {
        borderColor: colors.primary,
        // Keep card surface subtle; highlight via icon color instead of full card fill
        backgroundColor: colors.surface,
    },
    roleIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleIconWrapActive: {
        backgroundColor: colors.primary,
        // make icon container circular when active for a cleaner look
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleTextWrap: {
        marginLeft: theme_1.SPACING.lg,
        flex: 1,
    },
    roleTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginBottom: 2 }),
    roleDesc: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    bottomBtnWrap: {
        marginTop: 'auto',
    },
    row: {
        flexDirection: 'row',
    },
    rowBtns: {
        flexDirection: 'row',
        marginTop: theme_1.SPACING.xl,
        paddingBottom: 40,
    },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.error, marginTop: -8, marginBottom: 16 }),
    genderRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.xl,
    },
    genderBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        padding: theme_1.SPACING.md,
        alignItems: 'center',
        borderRadius: theme_1.BORDER_RADIUS.md,
        backgroundColor: colors.surface,
    },
    genderBtnActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    genderBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: colors.textSecondary }),
    agreementBox: {
        marginTop: theme_1.SPACING.md,
        padding: theme_1.SPACING.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: theme_1.BORDER_RADIUS.md,
        backgroundColor: colors.surfaceElevated,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme_1.SPACING.sm,
    },
    checkSquare: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: colors.textTertiary,
        borderRadius: theme_1.BORDER_RADIUS.sm,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkSquareActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.text, flex: 1 })
});
exports.default = RegisterScreen;
