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
exports.default = PrivacySettingsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const native_1 = require("@react-navigation/native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
function PrivacySettingsScreen() {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [currentUserId, setCurrentUserId] = (0, react_1.useState)(null);
    const [settings, setSettings] = (0, react_1.useState)({
        share_steps_with_pt: false,
        share_workouts_with_pt: true,
        share_weight_with_pt: true,
        share_calories_with_dietitian: true,
        share_macros_with_dietitian: true,
        share_water_with_dietitian: true,
        share_weight_with_dietitian: true,
        professional_permissions: {}
    });
    const [professionals, setProfessionals] = (0, react_1.useState)([]);
    const navigation = (0, native_1.useNavigation)();
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    (0, react_1.useEffect)(() => {
        loadSettings();
    }, []);
    const loadSettings = () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = yield supabase.getPrivacySettings(user.id);
                if (error)
                    console.error('Error fetching privacy settings');
                if (data) {
                    setSettings({
                        share_steps_with_pt: (_a = data.share_steps_with_pt) !== null && _a !== void 0 ? _a : false,
                        share_workouts_with_pt: (_b = data.share_workouts_with_pt) !== null && _b !== void 0 ? _b : true,
                        share_weight_with_pt: (_c = data.share_weight_with_pt) !== null && _c !== void 0 ? _c : true,
                        share_calories_with_dietitian: (_d = data.share_calories_with_dietitian) !== null && _d !== void 0 ? _d : true,
                        share_macros_with_dietitian: (_e = data.share_macros_with_dietitian) !== null && _e !== void 0 ? _e : true,
                        share_water_with_dietitian: (_f = data.share_water_with_dietitian) !== null && _f !== void 0 ? _f : true,
                        share_weight_with_dietitian: (_g = data.share_weight_with_dietitian) !== null && _g !== void 0 ? _g : true,
                        professional_permissions: data.professional_permissions || {}
                    });
                }
                // Fetch connected professionals from active chats
                try {
                    const { data: chats } = yield supabase.getChats(user.id);
                    if (chats) {
                        const prosMap = new Map();
                        chats.forEach((c) => {
                            var _a;
                            const parts = ((_a = c.chats) === null || _a === void 0 ? void 0 : _a.chat_participants) || [];
                            parts.forEach((p) => {
                                if (p.users && p.users.id !== user.id && p.users.professional_type) {
                                    if (!prosMap.has(p.users.id))
                                        prosMap.set(p.users.id, p.users);
                                }
                            });
                        });
                        setProfessionals(Array.from(prosMap.values()));
                    }
                }
                catch (e) {
                    console.error('Error fetching professionals:', e);
                }
            }
        }
        catch (err) {
            console.error('Privacy settings error');
        }
        finally {
            setLoading(false);
        }
    });
    const handleToggle = (key) => {
        setSettings((prev) => (Object.assign(Object.assign({}, prev), { [key]: !prev[key] })));
    };
    const handleProToggle = (proId, type, key) => {
        setSettings((prev) => {
            const perms = prev.professional_permissions || {};
            const proPerms = perms[proId] || {};
            const globalKey = type === 'pt' ? key + '_with_pt' : key + '_with_dietitian';
            const currentVal = proPerms[key] !== undefined ? proPerms[key] : prev[globalKey];
            return Object.assign(Object.assign({}, prev), { professional_permissions: Object.assign(Object.assign({}, perms), { [proId]: Object.assign(Object.assign({}, proPerms), { [key]: !currentVal }) }) });
        });
    };
    const saveSettings = () => __awaiter(this, void 0, void 0, function* () {
        if (!currentUserId)
            return;
        try {
            setSaving(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { error } = yield supabase.updatePrivacySettings(currentUserId, settings);
            if (error)
                throw error;
            alert(isTurkish ? 'Ayarlar kaydedildi.' : 'Settings saved successfully.');
        }
        catch (err) {
            console.error('Save error:', err);
            alert(isTurkish ? 'Kaydedilemedi.' : 'Failed to save.');
        }
        finally {
            setSaving(false);
        }
    });
    const renderSettingRow = (key, titleTr, titleEn, icon, color) => (<react_native_1.View style={styles.settingRow}>
            <react_native_1.View style={styles.settingInfo}>
                <react_native_1.View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <vector_icons_1.Ionicons name={icon} size={20} color={color}/>
                </react_native_1.View>
                <react_native_1.Text style={styles.settingTitle}>{isTurkish ? titleTr : titleEn}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.Switch value={settings[key]} onValueChange={() => handleToggle(key)} trackColor={{ false: colors.borderLight, true: colors.primary }} thumbColor={react_native_1.Platform.OS === 'ios' ? colors.background : (settings[key] ? colors.background : '#f4f3f4')}/>
        </react_native_1.View>);
    const renderProSettingRow = (pro, key, titleTr, titleEn, globalKey) => {
        var _a;
        const perms = ((_a = settings.professional_permissions) === null || _a === void 0 ? void 0 : _a[pro.id]) || {};
        const isEnabled = perms[key] !== undefined ? perms[key] : settings[globalKey];
        return (<react_native_1.View style={styles.proSettingRow}>
                <react_native_1.Text style={styles.proSettingTitle}>{isTurkish ? titleTr : titleEn}</react_native_1.Text>
                <react_native_1.Switch value={isEnabled} onValueChange={() => handleProToggle(pro.id, pro.professional_type, key)} trackColor={{ false: colors.borderLight, true: colors.primary }} thumbColor={react_native_1.Platform.OS === 'ios' ? colors.background : (isEnabled ? colors.background : '#f4f3f4')}/>
            </react_native_1.View>);
    };
    return (<react_native_1.View style={styles.container}>
            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + theme_1.SPACING.md }]}>
                <react_native_1.TouchableOpacity style={styles.backButton} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Settings')}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Veri Gizliliği' : 'Privacy Settings'}</react_native_1.Text>
                <react_native_1.TouchableOpacity onPress={saveSettings} style={styles.saveButton} disabled={saving}>
                    {saving ? (<react_native_1.ActivityIndicator size="small" color={colors.textInverse}/>) : (<react_native_1.Text style={styles.saveText}>{isTurkish ? 'Kaydet' : 'Save'}</react_native_1.Text>)}
                </react_native_1.TouchableOpacity>
            </expo_linear_gradient_1.LinearGradient>

            {loading ? (<react_native_1.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                </react_native_1.View>) : (<react_native_1.ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Antrenör (PT) ile Paylaşım' : 'Share with Trainer (PT)'}</react_native_1.Text>
                    <GlassCard_1.default style={styles.card}>
                        {renderSettingRow('share_workouts_with_pt', 'Antrenman Sonuçları', 'Workout Results', 'fitness', colors.primary)}
                        <react_native_1.View style={styles.divider}/>
                        {renderSettingRow('share_steps_with_pt', 'Günlük Adımlar', 'Daily Steps', 'walk', colors.warning)}
                        <react_native_1.View style={styles.divider}/>
                        {renderSettingRow('share_weight_with_pt', 'Vücut Ağırlığı', 'Body Weight', 'scale', colors.secondary)}
                    </GlassCard_1.default>

                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Diyetisyen ile Paylaşım (Genel)' : 'Share with Dietitians (Global)'}</react_native_1.Text>
                    <GlassCard_1.default style={styles.card}>
                        {renderSettingRow('share_calories_with_dietitian', 'Kalori Tüketimi', 'Calorie Intake', 'flame', colors.error)}
                        <react_native_1.View style={styles.divider}/>
                        {renderSettingRow('share_macros_with_dietitian', 'Makro Besinler', 'Macronutrients', 'pie-chart', colors.success)}
                        <react_native_1.View style={styles.divider}/>
                        {renderSettingRow('share_water_with_dietitian', 'Su Tüketimi', 'Water Intake', 'water', colors.info)}
                        <react_native_1.View style={styles.divider}/>
                        {renderSettingRow('share_weight_with_dietitian', 'Vücut Ağırlığı', 'Body Weight', 'scale', colors.secondary)}
                    </GlassCard_1.default>

                    {professionals.length > 0 && (<>
                            <react_native_1.Text style={[styles.sectionTitle, { marginTop: theme_1.SPACING.xl, color: colors.primary }]}>
                                {isTurkish ? 'Özel Uzman İzinleri' : 'Specific Professional Permissions'}
                            </react_native_1.Text>
                            <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginHorizontal: theme_1.SPACING.xs, marginBottom: theme_1.SPACING.md })}>
                                {isTurkish ? 'Buradaki ayarlar yukarıdaki genel ayarları ezer.' : 'These settings override the global settings above.'}
                            </react_native_1.Text>
                            {professionals.map(pro => (<GlassCard_1.default key={pro.id} style={[styles.card, { marginBottom: theme_1.SPACING.md, padding: theme_1.SPACING.md }]}>
                                    <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme_1.SPACING.md }}>
                                        <react_native_1.View style={[styles.iconContainer, { backgroundColor: colors.primary + '20', marginRight: 10 }]}>
                                            <vector_icons_1.Ionicons name="person" size={18} color={colors.primary}/>
                                        </react_native_1.View>
                                        <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { flex: 1 })}>{pro.first_name} {pro.last_name}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginBottom: 8, marginTop: -15, marginLeft: 46 })}>
                                        {isTurkish ? (pro.professional_type === 'pt' ? 'Antrenör' : 'Diyetisyen') : (pro.professional_type === 'pt' ? 'Trainer' : 'Dietitian')}
                                    </react_native_1.Text>

                                    {pro.professional_type === 'pt' && (<>
                                            {renderProSettingRow(pro, 'share_workouts', 'Antrenman Paylaşımı', 'Share Workouts', 'share_workouts_with_pt')}
                                            {renderProSettingRow(pro, 'share_steps', 'Adım Paylaşımı', 'Share Steps', 'share_steps_with_pt')}
                                            {renderProSettingRow(pro, 'share_weight', 'Ağırlık Paylaşımı', 'Share Weight', 'share_weight_with_pt')}
                                        </>)}

                                    {pro.professional_type === 'dietitian' && (<>
                                            {renderProSettingRow(pro, 'share_calories', 'Kalori Paylaşımı', 'Share Calories', 'share_calories_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_macros', 'Makro Paylaşımı', 'Share Macros', 'share_macros_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_water', 'Su Paylaşımı', 'Share Water', 'share_water_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_weight', 'Ağırlık Paylaşımı', 'Share Weight', 'share_weight_with_dietitian')}
                                        </>)}
                                </GlassCard_1.default>))}
                        </>)}

                    <react_native_1.Text style={styles.infoText}>
                        {isTurkish
                ? 'Kapattığınız veriler bağlantı kurduğunuz profesyoneller tarafından görüntülenemez. Atanan programlarınızı daha iyi takip etmeleri için temel verileri açık tutmanız önerilir.'
                : 'Data turned off cannot be viewed by the professionals you connected with. It is recommended to keep basic data enabled for better tracking of assigned plans.'}
                    </react_native_1.Text>
                </react_native_1.ScrollView>)}
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: theme_1.SPACING.lg, paddingHorizontal: theme_1.SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backButton: { padding: theme_1.SPACING.xs },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.textInverse, flex: 1, textAlign: 'center' }),
    saveButton: { paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.xs, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: theme_1.BORDER_RADIUS.pill },
    saveText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textInverse }),
    content: { padding: theme_1.SPACING.lg },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginTop: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.sm, marginLeft: theme_1.SPACING.xs }),
    card: { padding: 0, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme_1.SPACING.md },
    settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: theme_1.SPACING.md },
    settingTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, fontWeight: '500' }),
    divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 68 }, // align with text
    infoText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: theme_1.SPACING.xl, marginBottom: 40, textAlign: 'center', paddingHorizontal: theme_1.SPACING.md, lineHeight: 20 }),
    proSettingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    proSettingTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, fontSize: 13, fontWeight: '500' }),
});
