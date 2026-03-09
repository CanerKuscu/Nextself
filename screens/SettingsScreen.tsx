import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Linking,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformStorage from '../utils/platformStorage';
import AnimatedCard from '../components/AnimatedCard';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency, CurrencyCode, CURRENCIES } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';

const NOTIF_PREFS_KEY = 'biosync_notification_prefs';

type NotificationPrefs = {
    water: boolean;
    workout: boolean;
    health: boolean;
    tips: boolean;
    supplement: boolean;
    meal: boolean;
};

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
    water: true,
    workout: true,
    health: true,
    tips: false,
    supplement: false,
    meal: false,
};

const SettingsScreen = ({ navigation }: any) => {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { t, isTurkish, language, setLanguage } = useTranslation();
    const { currency, setCurrency, currencyInfo } = useCurrency();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();

    const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);

    // Load notification preferences from SecureStore (and optionally Supabase) on mount
    useEffect(() => {
        const loadNotifPrefs = async () => {
            try {
                // Try Supabase first
                const supabase = SupabaseService.getInstance();
                const { user } = await supabase.getCurrentUser();
                if (user) {
                    const { data } = await supabase.getClient()
                        .from('profiles')
                        .select('notification_preferences')
                        .eq('id', user.id)
                        .single();
                    if (data?.notification_preferences) {
                        const merged = { ...DEFAULT_NOTIF_PREFS, ...data.notification_preferences };
                        setNotifPrefs(merged);
                        await PlatformStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(merged));
                        return;
                    }
                }
            } catch { }
            // Fallback to SecureStore
            try {
                const stored = await PlatformStorage.getItem(NOTIF_PREFS_KEY);
                if (stored) setNotifPrefs(JSON.parse(stored));
            } catch { }
        };
        loadNotifPrefs();
    }, []);

    // Persist a notification preference change to SecureStore + Supabase
    const toggleNotifPref = async (key: keyof NotificationPrefs) => {
        const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
        setNotifPrefs(updated);
        try {
            await PlatformStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
        } catch { }
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (user) {
                await supabase.getClient()
                    .from('profiles')
                    .update({ notification_preferences: updated })
                    .eq('id', user.id);
            }
        } catch { }

        // Schedule or cancel notifications based on toggle
        const notifService = NotificationService.getInstance();
        try {
            await notifService.requestPermissions();
            const schedules: Record<string, { title: string; body: string; hour: number; minute: number }> = {
                workout: { title: isTurkish ? 'Antrenman Zamanı! 💪' : 'Workout Time! 💪', body: isTurkish ? 'Bugünkü antrenmanını tamamla' : 'Complete your workout today', hour: 10, minute: 0 },
                supplement: { title: isTurkish ? 'Supplement Zamanı 💊' : 'Supplement Time 💊', body: isTurkish ? 'Günlük supplementlerini almayı unutma' : "Don't forget your daily supplements", hour: 9, minute: 0 },
                meal: { title: isTurkish ? 'Öğün Zamanı 🍽️' : 'Meal Time 🍽️', body: isTurkish ? 'Öğünlerini kaydetmeyi unutma' : "Don't forget to log your meals", hour: 12, minute: 30 },
            };
            if (schedules[key]) {
                if (updated[key]) {
                    const s = schedules[key];
                    await notifService.scheduleDailyReminder(s.title, s.body, s.hour, s.minute, `biosync_${key}_reminder`);
                } else {
                    await notifService.cancelNotification(`biosync_${key}_reminder`);
                }
            }
        } catch { }
    };

    // Re-auth modal state for account deletion
    const [showReAuthModal, setShowReAuthModal] = useState(false);
    const [reAuthPassword, setReAuthPassword] = useState('');
    const [reAuthLoading, setReAuthLoading] = useState(false);
    const [reAuthError, setReAuthError] = useState('');

    // Clear password from state when modal closes  
    useEffect(() => {
        if (!showReAuthModal) {
            setReAuthPassword('');
            setReAuthError('');
        }
    }, [showReAuthModal]);

    const handleDeleteAccount = () => {
        showAlert({
            type: 'destructive',
            title: isTurkish ? 'Hesabı Sil' : 'Delete Account',
            message: isTurkish
                ? 'Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.'
                : 'Your account and all data will be permanently deleted. This cannot be undone.',
            buttons: [
                { text: isTurkish ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: isTurkish ? 'Devam Et' : 'Continue',
                    style: 'destructive',
                    onPress: () => {
                        setReAuthPassword('');
                        setReAuthError('');
                        setShowReAuthModal(true);
                    },
                },
            ],
        });
    };

    const handleConfirmDelete = async () => {
        if (!reAuthPassword.trim()) {
            setReAuthError(isTurkish ? 'Lütfen şifrenizi girin.' : 'Please enter your password.');
            return;
        }
        setReAuthLoading(true);
        setReAuthError('');
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user?.email) throw new Error('No user');

            // Re-authenticate to prove identity
            const { error: authError } = await supabase.signInWithEmail(user.email, reAuthPassword);
            if (authError) {
                setReAuthError(isTurkish ? 'Şifre hatalı.' : 'Incorrect password.');
                setReAuthLoading(false);
                return;
            }

            // Proceed with deletion
            await supabase.softDeleteUser(user.id);
            await supabase.signOut();
            setShowReAuthModal(false);
            navigation.replace('Auth');
        } catch (err: any) {
            setReAuthError(isTurkish ? 'Bir hata oluştu. Tekrar deneyin.' : 'An error occurred. Try again.');
        } finally {
            setReAuthLoading(false);
        }
    };

    return (
        <View style={COMMON_STYLES.screenContainer}>
            <AlertComponent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Ayarlar' : 'Settings'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Language */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Dil' : 'Language'}</Text>
                <AnimatedCard style={styles.card}>
                    <View style={styles.langCardContent}>
                        <View style={styles.langToggle}>
                            <TouchableOpacity
                                style={[styles.langOption, language === 'tr' && styles.langOptionActive]}
                                onPress={() => setLanguage('tr')}
                            >
                                <Text style={{ fontSize: 13 }}>🇹🇷</Text>
                                <Text style={[styles.langOptionText, language === 'tr' && styles.langOptionTextActive]}>TR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                                onPress={() => setLanguage('en')}
                            >
                                <Text style={{ fontSize: 13 }}>🇬🇧</Text>
                                <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>EN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.langOption, language === 'ru' && styles.langOptionActive]}
                                onPress={() => setLanguage('ru')}
                            >
                                <Text style={{ fontSize: 13 }}>🇷🇺</Text>
                                <Text style={[styles.langOptionText, language === 'ru' && styles.langOptionTextActive]}>RU</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Currency */}
                <Text style={styles.sectionTitle}>{t('currency')}</Text>
                <AnimatedCard style={styles.card}>
                    <View style={styles.langCardContent}>
                        <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 8 }}>
                            {(['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'AED'] as CurrencyCode[]).map((code) => (
                                <TouchableOpacity
                                    key={code}
                                    style={[styles.langOption, currency === code && styles.langOptionActive, { minWidth: 60 }]}
                                    onPress={() => setCurrency(code)}
                                >
                                    <Text style={{ fontSize: 13 }}>{CURRENCIES[code].symbol}</Text>
                                    <Text style={[styles.langOptionText, currency === code && styles.langOptionTextActive]}>{code}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </AnimatedCard>

                {/* Dark Theme */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Görünüm' : (language === 'ru' ? 'Внешний вид' : 'Appearance')}</Text>
                <AnimatedCard style={styles.card}>
                    <View style={[styles.switchRow]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#CE82FF' : '#FFC800'} />
                            <Text style={styles.switchLabel}>{isTurkish ? 'Karanlık Tema' : (language === 'ru' ? 'Темная тема' : 'Dark Theme')}</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.borderLight, true: colors.primarySoft }}
                            thumbColor={isDark ? colors.primary : colors.textTertiary}
                        />
                    </View>
                </AnimatedCard>

                {/* Notifications */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Bildirim Tercihleri' : (language === 'ru' ? 'Настройки уведомлений' : 'Notification Preferences')}</Text>
                <AnimatedCard style={styles.card}>
                    {[
                        { label: isTurkish ? 'Su Hatırlatıcı' : 'Water Reminder', key: 'water' as keyof NotificationPrefs },
                        { label: isTurkish ? 'Antrenman Hatırlatıcı' : 'Workout Reminder', key: 'workout' as keyof NotificationPrefs },
                        { label: isTurkish ? 'Sağlık Uyarıları' : 'Health Alerts', key: 'health' as keyof NotificationPrefs },
                        { label: isTurkish ? 'Supplement Hatırlatıcı' : 'Supplement Reminder', key: 'supplement' as keyof NotificationPrefs },
                        { label: isTurkish ? 'Öğün Hatırlatıcı' : 'Meal Reminder', key: 'meal' as keyof NotificationPrefs },
                        { label: isTurkish ? 'Sağlık İpuçları' : 'Health Tips', key: 'tips' as keyof NotificationPrefs },
                    ].map((item, i, arr) => (
                        <View key={i} style={[styles.switchRow, i < arr.length - 1 && styles.itemBorder]}>
                            <Text style={styles.switchLabel}>{item.label}</Text>
                            <Switch
                                value={notifPrefs[item.key]}
                                onValueChange={() => toggleNotifPref(item.key)}
                                trackColor={{ false: colors.borderLight, true: colors.primarySoft }}
                                thumbColor={notifPrefs[item.key] ? colors.primary : colors.textTertiary}
                            />
                        </View>
                    ))}
                </AnimatedCard>

                {/* PT/Dietitian Data Sharing */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'PT/Diyetisyen Veri Paylaşımı' : 'PT/Dietitian Data Sharing'}</Text>
                <AnimatedCard style={styles.card}>
                    <TouchableOpacity
                        style={[styles.menuItem, { paddingHorizontal: 16 }]}
                        onPress={() => navigation.navigate('PrivacySettings')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuIcon}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>{isTurkish ? 'Gizlilik Tercihlerini Yönet' : 'Manage Privacy Settings'}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </AnimatedCard>

                {/* Privacy & Legal */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Gizlilik & Yasal' : 'Privacy & Legal'}</Text>
                <AnimatedCard style={styles.card}>
                    {[
                        { icon: 'shield-checkmark-outline', label: isTurkish ? 'Gizlilik Politikası' : 'Privacy Policy', screen: 'Terms', param: 'privacy' },
                        { icon: 'document-text-outline', label: isTurkish ? 'Kullanım Koşulları' : 'Terms of Service', screen: 'Terms', param: 'terms' },
                        { icon: 'flag-outline', label: 'KVKK Aydınlatma Metni', screen: 'Terms', param: 'kvkk' },
                        { icon: 'hand-left-outline', label: isTurkish ? 'Açık Rıza Metni' : 'Explicit Consent', screen: 'Terms', param: 'consent' },
                        { icon: 'card-outline', label: isTurkish ? 'Abonelik & İade Politikası' : 'Subscription & Refund', screen: 'Terms', param: 'subscription' },
                        { icon: 'globe-outline', label: isTurkish ? 'Yasal Sözleşmeler (Web)' : 'Legal Agreements (Web)', screen: '__web__', param: 'https://YOUR_DOMAIN.com/legal.html' },
                        { icon: 'help-circle-outline', label: isTurkish ? 'Yardım & Destek' : 'Help & Support', screen: '__web__', param: 'mailto:app.biosync@gmail.com' },
                    ].map((item, i, arr) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.menuItem, i < arr.length - 1 && styles.itemBorder]}
                            onPress={() => item.screen === '__web__' ? Linking.openURL(item.param) : item.screen ? navigation.navigate(item.screen, { section: item.param }) : null}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name={item.icon as any} size={20} color={colors.secondary} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </AnimatedCard>

                {/* Danger Zone */}
                <Text style={[styles.sectionTitle, { color: colors.error }]}>{isTurkish ? 'Tehlike Bölgesi' : 'Danger Zone'}</Text>
                <AnimatedCard style={styles.dangerCard}>
                    <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
                        <View style={styles.deleteIcon}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </View>
                        <Text style={styles.deleteLabel}>
                            {isTurkish ? 'Hesabı Sil' : 'Delete Account'}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <Text style={styles.deleteHint}>
                        {isTurkish
                            ? 'Tüm verileriniz kalıcı olarak silinir. App Store kuralları gereği bu seçenek sunulmaktadır.'
                            : 'All your data will be permanently deleted. Required by App Store guidelines.'}
                    </Text>
                </AnimatedCard>
            </ScrollView>

            {/* Re-Authentication Modal for Account Deletion */}
            <Modal visible={showReAuthModal} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {isTurkish ? 'Kimlik Doğrulama' : 'Verify Identity'}
                        </Text>
                        <Text style={styles.modalDesc}>
                            {isTurkish
                                ? 'Hesabınızı silmek için lütfen şifrenizi girin.'
                                : 'Please enter your password to delete your account.'}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder={isTurkish ? 'Şifreniz' : 'Your password'}
                            placeholderTextColor={colors.textTertiary}
                            secureTextEntry
                            value={reAuthPassword}
                            onChangeText={setReAuthPassword}
                            autoFocus
                        />
                        {reAuthError ? <Text style={styles.modalError}>{reAuthError}</Text> : null}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setShowReAuthModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnDelete]}
                                onPress={handleConfirmDelete}
                                disabled={reAuthLoading}
                            >
                                <Text style={styles.modalBtnDeleteText}>
                                    {reAuthLoading
                                        ? (isTurkish ? 'Siliniyor...' : 'Deleting...')
                                        : (isTurkish ? 'Hesabı Sil' : 'Delete Account')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: colors.text, flex: 1, textAlign: 'center' },
    content: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
    sectionTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginTop: SPACING.xxl, marginBottom: SPACING.md },
    card: { paddingVertical: SPACING.xs },
    langCardContent: { padding: SPACING.md, alignItems: 'center' },
    langToggle: { flexDirection: 'row', backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 3, gap: 4, width: '100%' },
    langOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    langOptionActive: { backgroundColor: colors.primary },
    langOptionText: { ...TYPOGRAPHY.bodyBold, color: colors.textSecondary },
    langOptionTextActive: { color: colors.background },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md },
    switchLabel: { ...TYPOGRAPHY.body, color: colors.text, flex: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, paddingHorizontal: SPACING.md },
    menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { ...TYPOGRAPHY.body, color: colors.text, flex: 1 },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    dangerCard: { paddingVertical: SPACING.xs, borderWidth: 1, borderColor: colors.errorSoft, backgroundColor: colors.error + '05' },
    deleteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, paddingHorizontal: SPACING.md },
    deleteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorSoft, justifyContent: 'center', alignItems: 'center' },
    deleteLabel: { ...TYPOGRAPHY.body, color: colors.error, flex: 1 },
    deleteHint: { ...TYPOGRAPHY.small, color: colors.textTertiary, marginTop: 4, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, lineHeight: 16 },
    // Re-auth modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    modalCard: { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, width: '100%', maxWidth: 400 },
    modalTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.sm, textAlign: 'center' },
    modalDesc: { ...TYPOGRAPHY.body, color: colors.textSecondary, marginBottom: SPACING.lg, textAlign: 'center' },
    modalInput: { backgroundColor: colors.background, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, ...TYPOGRAPHY.body, color: colors.text, borderWidth: 1, borderColor: colors.borderLight, marginBottom: SPACING.sm },
    modalError: { ...TYPOGRAPHY.small, color: colors.error, marginBottom: SPACING.sm },
    modalButtons: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
    modalBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: colors.surfaceSecondary },
    modalBtnCancelText: { ...TYPOGRAPHY.body, color: colors.text, fontWeight: '600' },
    modalBtnDelete: { backgroundColor: colors.error },
    modalBtnDeleteText: { ...TYPOGRAPHY.body, color: '#fff', fontWeight: '600' },
});

export default SettingsScreen;
