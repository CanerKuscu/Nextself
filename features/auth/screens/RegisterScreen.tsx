import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingInput from '../../../components/FloatingInput';
import AnimatedButton from '../../../components/AnimatedButton';
import { getLocalDateString } from '../../../utils/dateUtils';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDebounce } from '../../../hooks/useDebounce';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../../../config/theme';
import { useAlert } from '../../../components/CustomAlert';
import { SecurityUtils } from '../../../utils/security';
import { AgreementService } from '../../../services/agreementService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../contexts/ThemeContext';
import { safeGoBack } from '../../../utils/navigation';

const { width } = Dimensions.get('window');
const STEP_WIDTH = width;

type RoleType = 'user' | 'pt' | 'dietitian';

const RegisterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<RoleType>('user');

  // Account details
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personal details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userHeight, setUserHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Agreements
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedKVKK, setAgreedKVKK] = useState(false);
  const [agreedSubscription, setAgreedSubscription] = useState(false);

  // Status hooks
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { t, isTurkish } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const debouncedUsername = useDebounce(username, 500);
  const debouncedEmail = useDebounce(email, 500);

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const ROLES = [
    { id: 'user', title: isTurkish ? 'Sporcu' : 'Athlete', icon: 'flash', desc: isTurkish ? 'Kendi antrenmanını takip et' : 'Track my fitness journey' },
    { id: 'pt', title: isTurkish ? 'Antrenör' : 'Trainer', icon: 'barbell', desc: isTurkish ? 'Öğrencilere koçluk yap' : 'Coach clients to success' },
    { id: 'dietitian', title: isTurkish ? 'Diyetisyen' : 'Dietitian', icon: 'nutrition', desc: isTurkish ? 'Beslenme planları oluştur' : 'Provide expert meal plans' }
  ] as const;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkUsername(debouncedUsername);
    } else {
      setUsernameAvailable(null);
    }
  }, [debouncedUsername]);

  useEffect(() => {
    if (debouncedEmail && debouncedEmail.includes('@')) {
      checkEmail(debouncedEmail);
    } else {
      setEmailAvailable(null);
    }
  }, [debouncedEmail]);

  const checkUsername = async (name: string) => {
    setCheckingUsername(true);
    try {
      const supabase = SupabaseService.getInstance();
      const available = await supabase.checkUsernameAvailability(name);
      setUsernameAvailable(available);
    } catch (err) {
      console.error('Username check failed');
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmail = async (mail: string) => {
    setCheckingEmail(true);
    try {
      const supabase = SupabaseService.getInstance();
      const available = await supabase.checkEmailAvailability(mail);
      setEmailAvailable(available);
    } catch (err) {
      console.error('Email check failed');
    } finally {
      setCheckingEmail(false);
    }
  };

  const animateStep = (newStep: number) => {
    Animated.spring(slideAnim, {
      toValue: (newStep - 1) * -STEP_WIDTH,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setStep(newStep);
  };

  const validatePassword = (pass: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return re.test(pass);
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!role) newErrors.role = isTurkish ? 'Devam etmek için bir rol seçin' : 'Select a role to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName) newErrors.firstName = t('required_field');
    if (!lastName) newErrors.lastName = t('required_field');
    if (!username || username.length < 3) {
      newErrors.username = isTurkish ? 'En az 3 karakter' : 'Min 3 chars';
    } else if (usernameAvailable === false) {
      newErrors.username = isTurkish ? 'Kullanılamaz' : 'Unavailable';
    }
    if (!email || !email.includes('@')) newErrors.email = t('invalid_email');
    if (emailAvailable === false) newErrors.email = isTurkish ? 'Kullanılamaz' : 'Unavailable';

    if (!password) {
      newErrors.password = t('required_field');
    } else if (!validatePassword(password)) {
      newErrors.password = isTurkish ? 'Şifre zayıf (8+ hane, Büyük/Küçük harf, Sayı, Sembol).' : 'Weak password (8+ chars, upper/lower/num/symbol).';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = isTurkish ? 'Şifreler eşleşmiyor' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!gender) newErrors.gender = t('required_field');
    if (!dateOfBirth) newErrors.dateOfBirth = t('required_field');
    if (!userHeight) newErrors.height = t('required_field');
    if (!weight) newErrors.weight = t('required_field');
    if (!agreedTerms) newErrors.agreedTerms = isTurkish ? 'Zorunlu' : 'Required';
    if (!agreedPrivacy) newErrors.agreedPrivacy = isTurkish ? 'Zorunlu' : 'Required';
    if (!agreedKVKK) newErrors.agreedKVKK = isTurkish ? 'Zorunlu' : 'Required';
    if (!agreedSubscription) newErrors.agreedSubscription = isTurkish ? 'Zorunlu' : 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToStep2 = () => { if (validateStep1()) animateStep(2); };
  const handleNextToStep3 = () => { if (validateStep2()) animateStep(3); };
  const handleDateOfBirthInput = (value: string) => {
    const cleaned = value.replace(/[^\d-]/g, '').slice(0, 10);
    setDateOfBirth(cleaned);
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const supabase = SupabaseService.getInstance();
      const { data, error } = await supabase.signUp(email.trim().toLowerCase(), password, {
        username: SecurityUtils.sanitizeInput(username.trim().toLowerCase()),
        full_name: SecurityUtils.sanitizeInput(firstName.trim() + ' ' + lastName.trim()),
        date_of_birth: dateOfBirth,
        height_cm: userHeight ? parseFloat(userHeight) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        user_type: role,
        gender: gender,
      });

      if (error) {
        showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: error.message, buttons: [{ text: 'OK' }] });
      } else {
        // Only save agreements if session exists (user is authenticated).
        // Otherwise, save them after email verification.
        if (data?.session && data?.user?.id) {
          try {
            const agreementService = AgreementService.getInstance();
            const saved = await agreementService.acceptAllRegistrationAgreements(data.user.id);
            if (!saved.success) {
              throw new Error(saved.error || (isTurkish ? 'Yasal sözleşmeler kaydedilemedi.' : 'Failed to persist legal agreements.'));
            }
          } catch (e) { console.warn('Agreement save error:', e); }
        }
        navigation.navigate('EmailVerification', { email, type: 'signup' });
      }
    } catch (err: any) {
      showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || 'Something went wrong.', buttons: [{ text: 'OK' }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
      <AlertComponent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardArea}>

        {/* Header Block */}
        <View style={[styles.headerArea, { paddingTop: SPACING.md }]}>
          <TouchableOpacity onPress={() => safeGoBack(navigation, 'Auth')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.titleText}>{isTurkish ? 'Kayıt Ol' : 'Register'}</Text>
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>

            {/* STEP 1: ROLE */}
            <ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <Text style={styles.stepTitle}>{isTurkish ? 'Hesap Türü' : 'Account Type'}</Text>
              <Text style={styles.stepSubtitle}>{isTurkish ? 'Profilinizi nasıl kullanacaksınız?' : 'How will you use the app?'}</Text>

              <View style={styles.roleContainer}>
                {ROLES.map((r) => {
                  const isActive = role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.roleCard,
                        isActive && styles.roleCardActive,
                      ]}
                      onPress={() => setRole(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.roleIconWrap, isActive && styles.roleIconWrapActive]}>
                        <Ionicons name={r.icon as any} size={28} color={isActive ? colors.background : colors.textSecondary} />
                      </View>
                      <View style={styles.roleTextWrap}>
                        <Text style={[styles.roleTitle, isActive && { color: colors.primary }]}>{r.title}</Text>
                        <Text style={styles.roleDesc}>{r.desc}</Text>
                      </View>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

              <View style={styles.bottomBtnWrap}>
                <AnimatedButton title={isTurkish ? 'Devam Et' : 'Continue'} onPress={handleNextToStep2} size="large" />
              </View>
            </ScrollView>

            {/* STEP 2: DETAILS */}
            <ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <Text style={styles.stepTitle}>{isTurkish ? 'Kimlik Bilgileri' : 'Personal Details'}</Text>
              <Text style={styles.stepSubtitle}>{isTurkish ? 'Temel bilgilerinizi girin.' : 'Enter your basic information.'}</Text>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: SPACING.md }}>
                  <FloatingInput label={isTurkish ? "AD" : "FIRST NAME"} value={firstName} onChangeText={setFirstName} error={errors.firstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <FloatingInput label={isTurkish ? "SOYAD" : "LAST NAME"} value={lastName} onChangeText={setLastName} error={errors.lastName} />
                </View>
              </View>

              <FloatingInput
                label={isTurkish ? "KULLANICI ADI" : "USERNAME"}
                value={username}
                onChangeText={text => setUsername(text.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                error={errors.username}
                autoCapitalize="none"
              />
              <FloatingInput
                label={isTurkish ? "E-POSTA" : "EMAIL"}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FloatingInput
                label={isTurkish ? "ŞİFRE" : "PASSWORD"}
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
              />
              <FloatingInput
                label={isTurkish ? "ŞİFREYİ ONAYLA" : "CONFIRM PASSWORD"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <View style={styles.rowBtns}>
                <AnimatedButton title={isTurkish ? 'Geri' : 'Back'} onPress={() => animateStep(1)} variant="secondary" size="medium" style={{ flex: 1, marginRight: SPACING.sm }} />
                <AnimatedButton title={isTurkish ? 'İleri' : 'Next'} onPress={handleNextToStep3} size="medium" style={{ flex: 1, marginLeft: SPACING.sm }} />
              </View>
            </ScrollView>

            {/* STEP 3: METRICS */}
            <ScrollView style={styles.stepPage} contentContainerStyle={styles.scrollPage}>
              <Text style={styles.stepTitle}>{isTurkish ? 'Fiziksel Veriler' : 'Metrics'}</Text>
              <Text style={styles.stepSubtitle}>{isTurkish ? 'Son adımı tamamlayın.' : 'Complete the final step.'}</Text>

              <View style={styles.genderRow}>
                <TouchableOpacity onPress={() => setGender('male')} style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}>
                  <Text style={[styles.genderBtnText, gender === 'male' && { color: colors.primary }]}>{isTurkish ? 'ERKEK' : 'MALE'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGender('female')} style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}>
                  <Text style={[styles.genderBtnText, gender === 'female' && { color: colors.primary }]}>{isTurkish ? 'KADIN' : 'FEMALE'}</Text>
                </TouchableOpacity>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

              {Platform.OS === 'web' ? (
                <FloatingInput
                  label={isTurkish ? "DOĞUM TARİHİ (YYYY-AA-GG)" : "DATE OF BIRTH (YYYY-MM-DD)"}
                  value={dateOfBirth}
                  onChangeText={handleDateOfBirthInput}
                  error={errors.dateOfBirth}
                  placeholder={isTurkish ? "2000-12-31" : "2000-12-31"}
                  autoCapitalize="none"
                />
              ) : (
                <>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                    <View pointerEvents="none">
                      <FloatingInput label={isTurkish ? "DOĞUM TARİHİ (YYYY-AA-GG)" : "DATE OF BIRTH (YYYY-MM-DD)"} value={dateOfBirth} onChangeText={setDateOfBirth} error={errors.dateOfBirth} />
                    </View>
                  </TouchableOpacity>
                  {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDateOfBirth(getLocalDateString(selectedDate));
                    }
                  }}
                />
                  )}
                </>
              )}

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: SPACING.md }}>
                  <FloatingInput label={isTurkish ? "BOY (CM)" : "HEIGHT (CM)"} value={userHeight} onChangeText={setUserHeight} keyboardType="numeric" error={errors.height} />
                </View>
                <View style={{ flex: 1 }}>
                  <FloatingInput label={isTurkish ? "KİLO (KG)" : "WEIGHT (KG)"} value={weight} onChangeText={setWeight} keyboardType="numeric" error={errors.weight} />
                </View>
              </View>

              <View style={styles.agreementBox}>
                <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedKVKK(!agreedKVKK)}>
                  <View style={[styles.checkSquare, agreedKVKK && styles.checkSquareActive]}>
                    {agreedKVKK && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
                  </View>
                  <Text style={[styles.checkText, { fontWeight: '600' }]}>
                    {isTurkish
                      ? 'Kişisel verilerimin işlenmesine, KVKK kapsamında sağlık verilerimin analiz edilmesine ve yurt dışına aktarımına açık rıza veriyorum. '
                      : 'I give my explicit consent to the processing of my personal data, health data analysis, and cross-border data transfer. '}
                    <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Terms', { section: 'consent' })}>
                      {isTurkish ? '(Açık Rıza Metni)' : '(Consent Form)'}
                    </Text>
                    {' '}
                    <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => navigation.navigate('Terms', { section: 'kvkk' })}>
                      {isTurkish ? '(KVKK)' : '(KVKK)'}
                    </Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreedKVKK && <Text style={styles.errorText}>{errors.agreedKVKK}</Text>}

                <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedTerms(!agreedTerms)}>
                  <View style={[styles.checkSquare, agreedTerms && styles.checkSquareActive]}>
                    {agreedTerms && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
                  </View>
                  <Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'terms' })}>
                      {isTurkish ? 'Kullanım Koşulları' : 'Terms of Service'}
                    </Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreedTerms && <Text style={styles.errorText}>{errors.agreedTerms}</Text>}

                <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedPrivacy(!agreedPrivacy)}>
                  <View style={[styles.checkSquare, agreedPrivacy && styles.checkSquareActive]}>
                    {agreedPrivacy && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
                  </View>
                  <Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'privacy' })}>
                      {isTurkish ? 'Gizlilik Politikası' : 'Privacy Policy'}
                    </Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreedPrivacy && <Text style={styles.errorText}>{errors.agreedPrivacy}</Text>}

                <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedSubscription(!agreedSubscription)}>
                  <View style={[styles.checkSquare, agreedSubscription && styles.checkSquareActive]}>
                    {agreedSubscription && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
                  </View>
                  <Text style={styles.checkText}>
                    {isTurkish ? 'Okudum, onaylıyorum: ' : 'I have read and agree to the '}
                    <Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Terms', { section: 'subscription' })}>
                      {isTurkish ? 'Abonelik ve İade Politikası' : 'Subscription & Refund Policy'}
                    </Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreedSubscription && <Text style={styles.errorText}>{errors.agreedSubscription}</Text>}
              </View>

              <View style={styles.rowBtns}>
                <AnimatedButton title={isTurkish ? 'Geri' : 'Back'} onPress={() => animateStep(2)} variant="secondary" size="medium" style={{ flex: 1, marginRight: SPACING.sm }} />
                <AnimatedButton title={isTurkish ? 'Kayıt Ol' : 'Register'} onPress={handleRegister} loading={loading} size="medium" style={{ flex: 1, marginLeft: SPACING.sm }} />
              </View>
            </ScrollView>

          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    padding: SPACING.sm,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  titleText: {
    ...TYPOGRAPHY.h3,
    color: colors.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 24,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: BORDER_RADIUS.pill,
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.h1,
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.body,
    color: colors.textSecondary,
    marginBottom: SPACING.xxl,
  },
  roleContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
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
    marginLeft: SPACING.lg,
    flex: 1,
  },
  roleTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  roleDesc: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
  },
  bottomBtnWrap: {
    marginTop: 'auto',
  },
  row: {
    flexDirection: 'row',
  },
  rowBtns: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    paddingBottom: 40,
  },
  errorText: {
    ...TYPOGRAPHY.captionBold,
    color: colors.error,
    marginTop: -8,
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  genderBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.surface,
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  genderBtnText: {
    ...TYPOGRAPHY.button,
    color: colors.textSecondary,
  },
  agreementBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.surfaceElevated,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  checkSquare: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkSquareActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkText: {
    ...TYPOGRAPHY.caption,
    color: colors.text,
    flex: 1,
  }
});

export default RegisterScreen;
