import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, TouchableOpacity, Keyboard, Alert } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import FloatingInput from '../components/FloatingInput';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { ContentModerationService } from '../services/contentModerationService';
import { useSupabaseAuth } from '../contexts/SupabaseContext';
import { useTranslation } from '../hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { ValidationUtils } from '../utils/validation';

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

    const passwordValidation = ValidationUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(isTurkish ? 'Şifre en az 8 karakter uzunluğunda olmalı ve harf, sayı içermelidir.' : 'Password must be at least 8 characters long and contain letters and numbers.');
      return;
    }

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
      const { signIn, signOut } = useSupabaseAuth();
      if (!signIn) throw new Error('Auth provider not ready');

      const result: any = await signIn(email, password);

      // supabase-js style result: { data, error } or wrapped exchange result
      const authError = result?.error || (result?.data && result.data.error) || null;
      if (authError) {
        failedAttempts.current += 1;
        if (failedAttempts.current >= MAX_ATTEMPTS) {
          const lockMs = BASE_LOCKOUT_MS * Math.pow(2, Math.floor(failedAttempts.current / MAX_ATTEMPTS) - 1);
          lockedUntil.current = Date.now() + lockMs;
        }
        setError(sanitizeAuthError((authError && authError.message) || String(authError), isTurkish));
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

      navigation.replace('Main');
    } catch (err: any) {
      failedAttempts.current += 1;
      setError(sanitizeAuthError(err?.message || String(err || ''), isTurkish));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={COMMON_STYLES.screenContainer}>
      <AlertComponent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 20, height * 0.08) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image source={require('../assets/icon.png')} style={styles.logoImage} contentFit="contain" cachePolicy="memory-disk" transition={500} />
            <Text style={styles.appName}>BIOSYNC</Text>
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
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: SPACING.sm,
  },
  appName: {
    ...TYPOGRAPHY.h1,
    letterSpacing: 1,
  },
  tagline: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardWrapper: {
    padding: SPACING.xl,
  },
  welcomeText: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
    textAlign: 'left',
  },
  subText: {
    ...TYPOGRAPHY.body,
    color: colors.textSecondary,
    marginBottom: SPACING.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.captionBold,
    color: colors.error,
    flex: 1,
  },
  inputGroup: {
    gap: SPACING.lg,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xs,
  },
  forgotText: {
    ...TYPOGRAPHY.small,
    color: colors.primary,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...TYPOGRAPHY.small,
    color: colors.textTertiary,
    paddingHorizontal: SPACING.md,
  },
  registerBtn: {
    width: '100%',
  },
});

export default AuthScreen;
