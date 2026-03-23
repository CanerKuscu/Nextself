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
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingInput from '../components/FloatingInput';
import AnimatedButton from '../components/AnimatedButton';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

type Phase = 'email' | 'code' | 'newPassword';

const ForgotPasswordScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const insets = useSafeAreaInsets();

    const [phase, setPhase] = useState<Phase>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);
    const { t, isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const inputs = useRef<(TextInput | null)[]>([]);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
        return () => { };
    }, [timer]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const animatePhaseChange = (newPhase: Phase) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setPhase(newPhase);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };

    // Phase 1: Send OTP to email
    const handleSendCode = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !trimmedEmail.includes('@')) {
            setError(isTurkish ? 'Geçerli bir e-posta adresi girin.' : 'Enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const supabase = SupabaseService.getInstance();
            await supabase.sendOTP(trimmedEmail);
            setTimer(60);
            animatePhaseChange('code');
        } catch (err: any) {
            // Don't reveal whether email exists
            setTimer(60);
            animatePhaseChange('code');
        } finally {
            setLoading(false);
        }
    };

    // Phase 2: Verify OTP code
    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }

        if (index === 5 && text) {
            const fullCode = newCode.join('');
            if (fullCode.length === 6) {
                handleVerifyCode(fullCode);
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

    const handleVerifyCode = async (fullCode?: string) => {
        const verificationCode = fullCode || code.join('');
        if (verificationCode.length !== 6) return;

        setLoading(true);
        setError('');
        try {
            const supabase = SupabaseService.getInstance();
            const { error: verifyError } = await supabase.verifyOTP(email.trim().toLowerCase(), verificationCode, 'email');
            if (verifyError) throw verifyError;
            animatePhaseChange('newPassword');
        } catch (err: any) {
            shake();
            setError(isTurkish ? 'Geçersiz veya süresi dolmuş kod.' : 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setTimer(60);
        setCode(['', '', '', '', '', '']);
        try {
            const supabase = SupabaseService.getInstance();
            await supabase.sendOTP(email.trim().toLowerCase());
        } catch (err: any) {
            // Silent fail
        }
    };

    // Phase 3: Set new password
    const validatePassword = (pass: string) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass);
    };

    const handleResetPassword = async () => {
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
            const supabase = SupabaseService.getInstance();
            const { error: updateError } = await supabase.updatePassword(newPassword);
            if (updateError) throw updateError;

            showAlert({
                type: 'success',
                title: isTurkish ? 'Başarılı' : 'Success',
                message: isTurkish ? 'Şifreniz başarıyla güncellendi.' : 'Your password has been updated.',
                buttons: [{
                    text: 'OK',
                    onPress: () => navigation.navigate('Auth'),
                }],
            });
        } catch (err: any) {
            setError(err.message || (isTurkish ? 'Şifre güncellenirken hata oluştu.' : 'Failed to update password.'));
        } finally {
            setLoading(false);
        }
    };

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

    const getPhaseIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (phase) {
            case 'email': return 'mail-outline';
            case 'code': return 'keypad-outline';
            case 'newPassword': return 'lock-open-outline';
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={COMMON_STYLES.screenContainer}>
                <AlertComponent />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                    {/* Header */}
                    <View style={[styles.headerArea, { paddingTop: insets.top + SPACING.md }]}>
                        <TouchableOpacity onPress={() => phase === 'email' ? safeGoBack(navigation, 'Auth') : animatePhaseChange(phase === 'code' ? 'email' : 'code')} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>{getPhaseTitle()}</Text>
                            <View style={styles.stepIndicator}>
                                {(['email', 'code', 'newPassword'] as Phase[]).map((p, i) => (
                                    <View key={i} style={[styles.stepDot, (['email', 'code', 'newPassword'].indexOf(phase) >= i) && styles.stepDotActive]} />
                                ))}
                            </View>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <Animated.View style={{ opacity: fadeAnim }}>

                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name={getPhaseIcon()} size={40} color={colors.primary} />
                                </View>
                            </View>

                            <Text style={styles.titleText}>{getPhaseTitle()}</Text>
                            <Text style={styles.subtitleText}>{getPhaseSubtitle()}</Text>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="warning-outline" size={18} color={colors.error} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Phase 1: Email Input */}
                            {phase === 'email' && (
                                <View>
                                    <FloatingInput
                                        label={isTurkish ? 'E-POSTA' : 'EMAIL'}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                                    />
                                    <AnimatedButton
                                        title={isTurkish ? 'Kod Gönder' : 'Send Code'}
                                        onPress={handleSendCode}
                                        loading={loading}
                                        size="large"
                                        style={styles.actionBtn}
                                    />
                                </View>
                            )}

                            {/* Phase 2: OTP Code Input */}
                            {phase === 'code' && (
                                <View>
                                    <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
                                        {code.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={ref => { inputs.current[index] = ref; }}
                                                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
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
                                        onPress={() => handleVerifyCode()}
                                        loading={loading}
                                        disabled={code.join('').length !== 6}
                                        size="large"
                                        style={styles.actionBtn}
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
                            )}

                            {/* Phase 3: New Password */}
                            {phase === 'newPassword' && (
                                <View>
                                    <FloatingInput
                                        label={isTurkish ? 'YENİ ŞİFRE' : 'NEW PASSWORD'}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                        icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                                    />
                                    <FloatingInput
                                        label={isTurkish ? 'ŞİFREYİ ONAYLA' : 'CONFIRM PASSWORD'}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                                    />
                                    <AnimatedButton
                                        title={isTurkish ? 'Şifreyi Güncelle' : 'Update Password'}
                                        onPress={handleResetPassword}
                                        loading={loading}
                                        size="large"
                                        style={styles.actionBtn}
                                    />
                                </View>
                            )}

                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
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
    headerTitle: {
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
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxl,
        paddingBottom: SPACING.xxxl,
        flexGrow: 1,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
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
        marginBottom: SPACING.xxl,
        lineHeight: 22,
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
    actionBtn: {
        width: '100%',
        marginTop: SPACING.xl,
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
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
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.xl,
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

export default ForgotPasswordScreen;
