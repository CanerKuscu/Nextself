import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useAlert } from '../components/CustomAlert';

import { SupabaseService } from '@nextself/shared';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

const EmailVerificationScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { email, type = 'email' } = route.params || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const { t, isTurkish } = useTranslation();
  const { setSession } = useAuthStore();
  const inputs = useRef<(TextInput | null)[]>([]);
  const { showAlert, AlertComponent } = useAlert();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
    return () => { };
  }, [timer]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits filled
    if (index === 5 && text) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async (fullCode?: string) => {
    const verificationCode = fullCode || code.join('');
    if (verificationCode.length !== 6) return;

    setLoading(true);
    try {
      const supabase = SupabaseService.getInstance();
      const { data, error } = await supabase.verifyOTP(email, verificationCode, type);
      if (error) throw error;

      if (data.session) {
        setSession(data.session);
      }
      setLoading(false);
      navigation.replace('Main');
    } catch (err: any) {
      shake();
      setLoading(false);
      showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message || (isTurkish ? 'Geçersiz kod.' : 'Invalid code.'), buttons: [{ text: 'OK' }] });
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(60);
    try {
      const supabase = SupabaseService.getInstance();
      // Use resend API – works for both signup and email change without needing password
      await supabase.resendVerification(email, type === 'signup' ? 'signup' : 'email_change');
    } catch (err: any) {
      showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: err.message, buttons: [{ text: 'OK' }] });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={COMMON_STYLES.screenContainer}>
        <AlertComponent />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* Header */}
          <View style={[styles.headerArea, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => safeGoBack(navigation, 'Auth')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-unread-outline" size={48} color={colors.primary} />
              </View>
            </Animated.View>

            <Text style={styles.titleText}>{isTurkish ? 'E-postanızı Doğrulayın' : 'Verify Email'}</Text>
            <Text style={styles.subtitleText}>
              {isTurkish ? 'Şu adrese 6 haneli bir kod gönderdik:' : 'We sent a 6-digit code to:'}{'\n'}
              <Text style={{ ...TYPOGRAPHY.bodyBold, color: colors.text }}>{email}</Text>
            </Text>

            <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => { inputs.current[index] = ref; }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={text => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </Animated.View>

            <AnimatedButton
              title={isTurkish ? 'Doğrula' : 'Verify'}
              onPress={() => handleVerify()}
              loading={loading}
              disabled={code.join('').length !== 6}
              size="large"
              style={styles.verifyBtn}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>
                {isTurkish ? 'Kodu almadınız mı?' : "Didn't receive the code?"}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `${isTurkish ? 'Tekrar Gönder' : 'Resend'} (${timer}s)` : isTurkish ? 'Tekrar Gönder' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  headerArea: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.sm,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xxl,
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
  titleText: {
    ...TYPOGRAPHY.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitleText: {
    ...TYPOGRAPHY.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
    lineHeight: 24,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxxl,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
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
    marginBottom: SPACING.xl,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  resendText: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
  },
  resendLink: {
    ...TYPOGRAPHY.captionBold,
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.textTertiary,
  },
});

export default EmailVerificationScreen;
