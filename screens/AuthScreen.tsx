import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, TouchableOpacity, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import FloatingInput from '../components/FloatingInput';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { ContentModerationService } from '../services/contentModerationService';
import { AgreementService } from '../services/agreementService';
import { useSupabaseAuth } from '../contexts/SupabaseContext';
import { useTranslation } from '../hooks/useTranslation';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { ValidationUtils } from '@nextself/shared';
import PlatformStorage from '@nextself/shared';

// --- Login rate limiting ---
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 seconds

/** Map raw Supabase auth errors to user-friendly messages (no internal details exposed). */
const sanitizeAuthError = (msg: string, isTurkish: boolean): string => {
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

const AuthScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, isTurkish } = useTranslation();
  const { showAlert, AlertComponent } = useAlert();
  const { signIn, signOut } = useSupabaseAuth(); // Move hook to top level

  // Rate-limiting state
  const failedAttempts = useRef(0);
  const lockedUntil = useRef<number>(0);

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      setError(isTurkish ? 'Lütfen tüm alanları doldurun.' : 'Please fill all fields.');
      return;
    }

    const emailValidation = ValidationUtils.validateEmail(email);
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
      setError(
        isTurkish
          ? `Çok fazla deneme. ${remaining} saniye bekleyin.`
          : `Too many attempts. Wait ${remaining} seconds.`
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      // signIn and signOut are now available from top-level hook destructuring
      if (!signIn) throw new Error('Auth provider not ready');

      const result: any = await signIn(email, password);

      // supabase-js style result: { data, error } or wrapped exchange result
      const authError = result?.error || (result?.data && result.data.error) || null;
      // Debug: log full result to help diagnose server-side failures
      if (__DEV__) {
        try { console.warn('[Auth] signIn result:', result); } catch (_) { }
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
        } else {
          setError(friendly);
        }
        setLoading(false);
        return;
      }

      failedAttempts.current = 0;

      // Determine returned user (may be in result.data.user or result.user)
      const user = result?.data?.user || result?.user || (result?.data && result.data.user) || null;
      if (user) {
        const modService = ContentModerationService.getInstance();
        const banStatus = await modService.checkBanStatus(user.id);
        if (banStatus.isBanned) {
          const msg = modService.getBanMessage(banStatus, isTurkish);
          // best-effort sign out to clear any lingering session state
          try { await signOut(); } catch { };
          setError(msg.message);
          setLoading(false);
          return;
        }
      }

      // Check if user has accepted all required agreements
      if (user) {
        const agreementService = AgreementService.getInstance();
        const { allAccepted } = await agreementService.hasAcceptedAll(user.id);
        if (!allAccepted) {
          // Redirect to Terms screen to accept agreements
          navigation.replace('Terms', { fromAuth: true, userId: user.id });
          return;
        }
      }

      navigation.replace('Main');
    } catch (err: any) {
      failedAttempts.current += 1;
      setError(sanitizeAuthError(err?.message || String(err || ''), isTurkish));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={COMMON_STYLES.screenContainer}>
      <AlertComponent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: SPACING.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image source={require('../assets/icon.png')} style={styles.logoImage} contentFit="contain" cachePolicy="memory-disk" transition={500} />
            <Text style={styles.appName}>NEXTSELF</Text>
            <Text style={styles.tagline}>
              {isTurkish ? 'Wellness & Performans' : 'Wellness & Performance'}
            </Text>
          </View>

          {/* Form Section */}
          <AnimatedCard animationType="slideUp" delay={100} duration={600} style={styles.cardWrapper}>
            <Text style={styles.welcomeText}>
              {isTurkish ? 'Hoş Geldiniz' : 'Welcome Back'}
            </Text>
            <Text style={styles.subText}>
              {isTurkish ? 'Lütfen hesabınıza giriş yapın.' : 'Please sign in to your account.'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={20} color={colors.error} />
                <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <FloatingInput
                label={isTurkish ? 'E-POSTA' : 'EMAIL'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
              />
              <FloatingInput
                label={isTurkish ? 'ŞİFRE' : 'PASSWORD'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
              />
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>
                {isTurkish ? 'Şifremi Unuttum' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            <AnimatedButton
              title={isTurkish ? 'Giriş Yap' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              size="large"
              style={styles.loginBtn}
            />

            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <AnimatedButton
              title={isTurkish ? 'Yeni Hesap Oluştur' : 'Create Account'}
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
              size="large"
              style={styles.registerBtn}
            />
          </AnimatedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  // Optically centered logo with proper padding
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
  },
  appName: {
    ...TYPOGRAPHY.h1,
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  cardWrapper: {
    padding: SPACING.lg,
  },
  welcomeText: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
    textAlign: 'left',
  },
  subText: {
    ...TYPOGRAPHY.body,
    color: colors.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.captionBold,
    color: colors.error,
    flex: 1,
  },
  // 8px grid aligned input group
  inputGroup: {
    gap: SPACING.sm,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  forgotText: {
    ...TYPOGRAPHY.small,
    color: colors.primary,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
  },
  // 8px grid aligned divider
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...TYPOGRAPHY.small,
    color: colors.textTertiary,
    paddingHorizontal: SPACING.xs,
  },
  registerBtn: {
    width: '100%',
  },
});

export default AuthScreen;
