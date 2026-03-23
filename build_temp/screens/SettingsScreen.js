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
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const notificationService_1 = require("../services/notificationService");
const calendarService_1 = require("../services/calendarService");
const useTranslation_1 = require("../hooks/useTranslation");
const CurrencyContext_1 = require("../contexts/CurrencyContext");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const theme_1 = require("../config/theme");
const NOTIF_PREFS_KEY = 'nextself_notification_prefs';
const DEFAULT_NOTIF_PREFS = {
    water: true,
    workout: true,
    health: true,
    tips: false,
    supplement: false,
    meal: false,
    calendar_sync: false,
};
const SettingsScreen = ({ navigation }) => {
    const { colors, isDark, setThemeMode } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const { t, isTurkish, language, setLanguage } = (0, useTranslation_1.useTranslation)();
    const { currency, setCurrency, currencyInfo } = (0, CurrencyContext_1.useCurrency)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const [notifPrefs, setNotifPrefs] = (0, react_1.useState)(DEFAULT_NOTIF_PREFS);
    // Load notification preferences from SecureStore (and optionally Supabase) on mount
    (0, react_1.useEffect)(() => {
        const loadNotifPrefs = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Try Supabase first
                const supabase = supabase_1.SupabaseService.getInstance();
                const { user } = yield supabase.getCurrentUser();
                if (user) {
                    const { data } = yield supabase.getClient()
                        .from('profiles')
                        .select('notification_preferences')
                        .eq('id', user.id)
                        .single();
                    if (data === null || data === void 0 ? void 0 : data.notification_preferences) {
                        const merged = Object.assign(Object.assign({}, DEFAULT_NOTIF_PREFS), data.notification_preferences);
                        setNotifPrefs(merged);
                        yield platformStorage_1.default.setItem(NOTIF_PREFS_KEY, JSON.stringify(merged));
                        return;
                    }
                }
            }
            catch (_a) { }
            // Fallback to SecureStore
            try {
                const stored = yield platformStorage_1.default.getItem(NOTIF_PREFS_KEY);
                if (stored)
                    setNotifPrefs(JSON.parse(stored));
            }
            catch (_b) { }
        });
        loadNotifPrefs();
    }, []);
    // Persist a notification preference change to SecureStore + Supabase
    const toggleNotifPref = (key) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = Object.assign(Object.assign({}, notifPrefs), { [key]: !notifPrefs[key] });
        setNotifPrefs(updated);
        try {
            yield platformStorage_1.default.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
        }
        catch (_a) { }
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                yield supabase.getClient()
                    .from('profiles')
                    .update({ notification_preferences: updated })
                    .eq('id', user.id);
            }
        }
        catch (_b) { }
        // Schedule or cancel notifications based on toggle
        if (key === 'calendar_sync') {
            if (updated.calendar_sync) {
                const calendarService = calendarService_1.CalendarService.getInstance();
                const granted = yield calendarService.requestPermissions();
                if (!granted) {
                    setNotifPrefs(prev => (Object.assign(Object.assign({}, prev), { calendar_sync: false })));
                    showAlert({
                        type: 'error',
                        title: 'Permission Denied',
                        message: 'Calendar permission is required to sync events.',
                        buttons: [{ text: 'OK' }]
                    });
                    return;
                }
            }
        }
        const notifService = notificationService_1.NotificationService.getInstance();
        try {
            yield notifService.requestPermissions();
            const schedules = {
                workout: { hour: 10, minute: 0, screen: 'Main', params: { screen: 'Sports' } },
                supplement: { hour: 9, minute: 0, screen: 'Supplements' },
                meal: { hour: 12, minute: 30, screen: 'Main', params: { screen: 'Nutrition' } },
            };
            if (schedules[key]) {
                if (updated[key]) {
                    const s = schedules[key];
                    const typeMap = {
                        workout: 'workout',
                        meal: 'nutrition',
                        supplement: 'supplement',
                    };
                    yield notifService.scheduleSmartReminder(typeMap[key], s.hour, s.minute, `nextself_${key}_reminder`, s.screen, s.params, language);
                }
                else {
                    yield notifService.cancelNotification(`nextself_${key}_reminder`);
                }
            }
        }
        catch (_c) { }
    });
    // Re-auth modal state for account deletion
    const [showReAuthModal, setShowReAuthModal] = (0, react_1.useState)(false);
    const [reAuthPassword, setReAuthPassword] = (0, react_1.useState)('');
    const [reAuthLoading, setReAuthLoading] = (0, react_1.useState)(false);
    const [reAuthError, setReAuthError] = (0, react_1.useState)('');
    // Clear password from state when modal closes  
    (0, react_1.useEffect)(() => {
        if (!showReAuthModal) {
            setReAuthPassword('');
            setReAuthError('');
        }
    }, [showReAuthModal]);
    const handleDeleteAccount = () => {
        showAlert({
            type: 'destructive',
            title: t('delete_account_confirm_title'),
            message: t('delete_account_confirm_msg'),
            buttons: [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('continue'),
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
    const handleConfirmDelete = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!reAuthPassword.trim()) {
            setReAuthError(t('enter_password'));
            return;
        }
        setReAuthLoading(true);
        setReAuthError('');
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!(user === null || user === void 0 ? void 0 : user.email))
                throw new Error('No user');
            // Re-authenticate to prove identity
            const { error: authError } = yield supabase.signInWithEmail(user.email, reAuthPassword);
            if (authError) {
                setReAuthError(t('incorrect_password'));
                setReAuthLoading(false);
                return;
            }
            // Proceed with deletion
            yield supabase.softDeleteUser(user.id);
            yield supabase.signOut();
            setShowReAuthModal(false);
            navigation.replace('Auth');
        }
        catch (err) {
            setReAuthError(t('error_occurred'));
        }
        finally {
            setReAuthLoading(false);
        }
    });
    return (<react_native_1.View style={[styles.container, { backgroundColor: colors.background }]}>
            <AlertComponent />

            {/* Header */}
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={styles.backBtn} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{t('settings')}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Language */}
                <react_native_1.Text style={styles.sectionTitle}>{t('language')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    <react_native_1.View style={styles.langCardContent}>
                        <react_native_1.View style={styles.langToggle}>
                            <react_native_1.TouchableOpacity style={[styles.langOption, language === 'tr' && styles.langOptionActive]} onPress={() => setLanguage('tr')}>
                                <react_native_1.Text style={{ fontSize: 13 }}>🇹🇷</react_native_1.Text>
                                <react_native_1.Text style={[styles.langOptionText, language === 'tr' && styles.langOptionTextActive]}>TR</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.langOption, language === 'en' && styles.langOptionActive]} onPress={() => setLanguage('en')}>
                                <react_native_1.Text style={{ fontSize: 13 }}>🇬🇧</react_native_1.Text>
                                <react_native_1.Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>EN</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.langOption, language === 'ru' && styles.langOptionActive]} onPress={() => setLanguage('ru')}>
                                <react_native_1.Text style={{ fontSize: 13 }}>🇷🇺</react_native_1.Text>
                                <react_native_1.Text style={[styles.langOptionText, language === 'ru' && styles.langOptionTextActive]}>RU</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>
                </AnimatedCard_1.default>

                {/* Currency */}
                <react_native_1.Text style={styles.sectionTitle}>{t('currency')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    <react_native_1.View style={styles.langCardContent}>
                        <react_native_1.View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 8 }}>
                            {['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'AED'].map((code) => (<react_native_1.TouchableOpacity key={code} style={[styles.langOption, currency === code && styles.langOptionActive, { minWidth: 60 }]} onPress={() => setCurrency(code)}>
                                    <react_native_1.Text style={{ fontSize: 13 }}>{CurrencyContext_1.CURRENCIES[code].symbol}</react_native_1.Text>
                                    <react_native_1.Text style={[styles.langOptionText, currency === code && styles.langOptionTextActive]}>{code}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>))}
                        </react_native_1.View>
                    </react_native_1.View>
                </AnimatedCard_1.default>

                {/* Dark Theme */}
                <react_native_1.Text style={styles.sectionTitle}>{t('appearance')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    <react_native_1.View style={[styles.switchRow]}>
                        <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <vector_icons_1.Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#CE82FF' : '#FFC800'}/>
                            <react_native_1.Text style={styles.switchLabel}>{t('dark_theme')}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.Switch value={isDark} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} trackColor={{ false: isDark ? colors.surfaceElevated : '#E9E9EA', true: colors.primary }} thumbColor={'#FFFFFF'}/>
                    </react_native_1.View>
                </AnimatedCard_1.default>

                {/* Notifications */}
                <react_native_1.Text style={styles.sectionTitle}>{t('notification_preferences')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    {[
            { label: t('water_reminder'), key: 'water' },
            { label: t('workout_reminder'), key: 'workout' },
            { label: t('health_alerts'), key: 'health' },
            { label: t('supplement_reminder'), key: 'supplement' },
            { label: t('meal_reminder'), key: 'meal' },
            { label: t('health_tips'), key: 'tips' },
            { label: isTurkish ? 'Takvim Senkronizasyonu' : 'Calendar Sync', key: 'calendar_sync' },
        ].map((item, i, arr) => (<react_native_1.View key={i} style={[styles.switchRow, i < arr.length - 1 && styles.itemBorder]}>
                            <react_native_1.Text style={styles.switchLabel}>{item.label}</react_native_1.Text>
                            <react_native_1.Switch value={notifPrefs[item.key]} onValueChange={() => toggleNotifPref(item.key)} trackColor={{ false: colors.borderLight, true: colors.primarySoft }} thumbColor={notifPrefs[item.key] ? colors.primary : colors.textTertiary}/>
                        </react_native_1.View>))}
                </AnimatedCard_1.default>

                {/* PT/Dietitian Data Sharing */}
                <react_native_1.Text style={styles.sectionTitle}>{t('pt_data_sharing')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    <react_native_1.TouchableOpacity style={[styles.menuItem, { paddingHorizontal: 16 }]} onPress={() => navigation.navigate('PrivacySettings')} activeOpacity={0.7}>
                        <react_native_1.View style={styles.menuIcon}>
                            <vector_icons_1.Ionicons name="lock-closed-outline" size={20} color={colors.primary}/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.menuLabel}>{t('manage_privacy_settings')}</react_native_1.Text>
                        <vector_icons_1.Ionicons name="chevron-forward" size={18} color={colors.textTertiary}/>
                    </react_native_1.TouchableOpacity>
                </AnimatedCard_1.default>

                {/* Privacy & Legal */}
                <react_native_1.Text style={styles.sectionTitle}>{t('privacy_legal')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.card}>
                    {[
            { icon: 'shield-checkmark-outline', label: t('privacyPolicy'), screen: 'Terms', param: 'privacy' },
            { icon: 'document-text-outline', label: t('termsOfService'), screen: 'Terms', param: 'terms' },
            { icon: 'flag-outline', label: t('kvkk_text'), screen: 'Terms', param: 'kvkk' },
            { icon: 'hand-left-outline', label: t('explicit_consent'), screen: 'Terms', param: 'consent' },
            { icon: 'card-outline', label: t('subscription_refund'), screen: 'Terms', param: 'subscription' },
            { icon: 'globe-outline', label: t('legal_agreements_web'), screen: '__web__', param: 'https://YOUR_DOMAIN.com/legal.html' },
            { icon: 'help-circle-outline', label: t('helpSupport'), screen: '__web__', param: 'mailto:app.nextself@gmail.com' },
        ].map((item, i, arr) => (<react_native_1.TouchableOpacity key={i} style={[styles.menuItem, i < arr.length - 1 && styles.itemBorder]} onPress={() => item.screen === '__web__' ? react_native_1.Linking.openURL(item.param) : item.screen ? navigation.navigate(item.screen, { section: item.param }) : null} activeOpacity={0.7}>
                            <react_native_1.View style={styles.menuIcon}>
                                <vector_icons_1.Ionicons name={item.icon} size={20} color={colors.secondary}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.menuLabel}>{item.label}</react_native_1.Text>
                            <vector_icons_1.Ionicons name="chevron-forward" size={18} color={colors.textTertiary}/>
                        </react_native_1.TouchableOpacity>))}
                </AnimatedCard_1.default>

                {/* Danger Zone */}
                <react_native_1.Text style={[styles.sectionTitle, { color: colors.error }]}>{t('danger_zone')}</react_native_1.Text>
                <AnimatedCard_1.default style={styles.dangerCard}>
                    <react_native_1.Pressable style={({ pressed }) => [
            styles.deleteRow,
            { backgroundColor: pressed ? colors.error + '10' : 'transparent' }
        ]} onPress={handleDeleteAccount}>
                        <react_native_1.View style={[styles.deleteIcon, { backgroundColor: colors.errorSoft }]}>
                            <vector_icons_1.Ionicons name="trash-outline" size={20} color={colors.error}/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.deleteLabel}>
                            {t('deleteAccount')}
                        </react_native_1.Text>
                        <vector_icons_1.Ionicons name="chevron-forward" size={18} color={colors.textTertiary}/>
                    </react_native_1.Pressable>
                    <react_native_1.Text style={styles.deleteHint}>
                        {t('delete_account_hint')}
                    </react_native_1.Text>
                </AnimatedCard_1.default>
            </react_native_1.ScrollView>

            {/* Re-Authentication Modal for Account Deletion */}
            <react_native_1.Modal visible={showReAuthModal} transparent animationType="none">
                <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <react_native_1.View style={styles.modalCard}>
                        <react_native_1.Text style={styles.modalTitle}>
                            {t('verify_identity')}
                        </react_native_1.Text>
                        <react_native_1.Text style={styles.modalDesc}>
                            {t('enter_password_delete')}
                        </react_native_1.Text>
                        <react_native_1.TextInput style={styles.modalInput} placeholder={t('password')} placeholderTextColor={colors.textTertiary} secureTextEntry value={reAuthPassword} onChangeText={setReAuthPassword} autoFocus/>
                        {reAuthError ? <react_native_1.Text style={styles.modalError}>{reAuthError}</react_native_1.Text> : null}
                        <react_native_1.View style={styles.modalButtons}>
                            <react_native_1.TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowReAuthModal(false)}>
                                <react_native_1.Text style={styles.modalBtnCancelText}>{t('cancel')}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.modalBtn, styles.modalBtnDelete]} onPress={handleConfirmDelete} disabled={reAuthLoading}>
                                <react_native_1.Text style={styles.modalBtnDeleteText}>
                                    {reAuthLoading
            ? t('loading')
            : t('deleteAccount')}
                                </react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.KeyboardAvoidingView>
            </react_native_1.Modal>
        </react_native_1.View>);
};
const getStyles = (colors, isDark) => react_native_1.StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text, flex: 1, textAlign: 'center' }),
    content: { paddingHorizontal: theme_1.SPACING.lg, paddingBottom: 100 },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginTop: theme_1.SPACING.xxl, marginBottom: theme_1.SPACING.md }),
    card: { paddingVertical: theme_1.SPACING.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
    langCardContent: { padding: theme_1.SPACING.md, alignItems: 'center' },
    langToggle: { flexDirection: 'row', backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 3, gap: 4, width: '100%' },
    langOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    langOptionActive: { backgroundColor: colors.primary },
    langOptionText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textSecondary }),
    langOptionTextActive: { color: colors.background },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.md },
    switchLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, flex: 1 }),
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme_1.SPACING.md, gap: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.md },
    menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    menuLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, flex: 1 }),
    itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    dangerCard: { paddingVertical: theme_1.SPACING.xs, borderWidth: 1, borderColor: colors.errorSoft, backgroundColor: isDark ? colors.error + '12' : colors.error + '05' },
    deleteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme_1.SPACING.md, gap: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.md },
    deleteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorSoft, justifyContent: 'center', alignItems: 'center' },
    deleteLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.error, flex: 1 }),
    deleteHint: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: 4, paddingHorizontal: theme_1.SPACING.md, paddingBottom: theme_1.SPACING.md, lineHeight: 16 }),
    // Re-auth modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: theme_1.SPACING.xl },
    modalCard: { backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.xl, width: '100%', maxWidth: 400 },
    modalTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginBottom: theme_1.SPACING.sm, textAlign: 'center' }),
    modalDesc: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginBottom: theme_1.SPACING.lg, textAlign: 'center' }),
    modalInput: Object.assign(Object.assign({ backgroundColor: colors.background, borderRadius: theme_1.BORDER_RADIUS.md, paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.md }, theme_1.TYPOGRAPHY.body), { color: colors.text, borderWidth: 1, borderColor: colors.borderLight, marginBottom: theme_1.SPACING.sm }),
    modalError: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.error, marginBottom: theme_1.SPACING.sm }),
    modalButtons: { flexDirection: 'row', gap: theme_1.SPACING.md, marginTop: theme_1.SPACING.md },
    modalBtn: { flex: 1, paddingVertical: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.md, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: colors.surfaceSecondary },
    modalBtnCancelText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, fontWeight: '600' }),
    modalBtnDelete: { backgroundColor: colors.error },
    modalBtnDeleteText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: '#fff', fontWeight: '600' }),
});
exports.default = SettingsScreen;
