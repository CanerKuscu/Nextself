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
const useTranslation_1 = require("../hooks/useTranslation");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const PRIVACY_KEY = 'NextSelf_data_privacy';
const DEFAULT_PRIVACY = {
    showWeight: true,
    showHeight: true,
    showBMI: true,
    showWorkouts: true,
    showNutrition: true,
    showSleep: false,
    showSteps: false,
    showHeartRate: false,
    showWater: true,
    showProgress: true,
};
const DATA_FIELDS = [
    // Body
    { key: 'showWeight', icon: 'barbell', label_tr: 'Kilo', label_en: 'Weight', desc_tr: 'Mevcut kilonuz', desc_en: 'Your current weight', category: 'body' },
    { key: 'showHeight', icon: 'resize', label_tr: 'Boy', label_en: 'Height', desc_tr: 'Boyunuz', desc_en: 'Your height', category: 'body' },
    { key: 'showBMI', icon: 'analytics', label_tr: 'BMI / BMR / TDEE', label_en: 'BMI / BMR / TDEE', desc_tr: 'Vücut analiz verileri', desc_en: 'Body analysis data', category: 'body' },
    // Fitness
    { key: 'showWorkouts', icon: 'fitness', label_tr: 'Antrenmanlar', label_en: 'Workouts', desc_tr: 'Antrenman geçmişiniz ve programınız', desc_en: 'Your workout history and program', category: 'fitness' },
    { key: 'showNutrition', icon: 'restaurant', label_tr: 'Beslenme', label_en: 'Nutrition', desc_tr: 'Yemek ve makro takibi', desc_en: 'Food and macro tracking', category: 'fitness' },
    { key: 'showProgress', icon: 'trending-up', label_tr: 'İlerleme', label_en: 'Progress', desc_tr: 'Haftalık/aylık ilerleme grafikleri', desc_en: 'Weekly/monthly progress charts', category: 'fitness' },
    { key: 'showWater', icon: 'water', label_tr: 'Su Takibi', label_en: 'Water Tracking', desc_tr: 'Günlük su içme verisi', desc_en: 'Daily water intake data', category: 'fitness' },
    // Health
    { key: 'showSleep', icon: 'bed', label_tr: 'Uyku', label_en: 'Sleep', desc_tr: 'Uyku süreniz ve kalitesi', desc_en: 'Your sleep duration and quality', category: 'health' },
    { key: 'showSteps', icon: 'footsteps', label_tr: 'Adımlar', label_en: 'Steps', desc_tr: 'Günlük adım sayısı', desc_en: 'Daily step count', category: 'health' },
    { key: 'showHeartRate', icon: 'pulse', label_tr: 'Nabız', label_en: 'Heart Rate', desc_tr: 'Kalp atış hızı verisi', desc_en: 'Heart rate data', category: 'health' },
];
const CATEGORIES = [
    { key: 'body', label_tr: 'Vücut Bilgileri', label_en: 'Body Info', color: '#1CB0F6' },
    { key: 'fitness', label_tr: 'Fitness Verileri', label_en: 'Fitness Data', color: '#58CC02' },
    { key: 'health', label_tr: 'Sağlık Verileri', label_en: 'Health Data', color: '#FF6B6B' },
];
const DataPrivacyScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const st = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [settings, setSettings] = (0, react_1.useState)(DEFAULT_PRIVACY);
    const [connectedPros, setConnectedPros] = (0, react_1.useState)([]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    (0, react_1.useEffect)(() => { loadSettings(); loadConnections(); }, []);
    const loadSettings = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield platformStorage_1.default.getItem(PRIVACY_KEY);
            if (data)
                setSettings(JSON.parse(data));
        }
        catch (_a) { }
    });
    const loadConnections = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supa = supabase_1.SupabaseService.getInstance();
            const { user } = yield supa.getCurrentUser();
            if (user) {
                const { data } = yield supa.getClient()
                    .from('client_relationships')
                    .select('*, professional:professional_id(id, full_name, specialization)')
                    .eq('client_id', user.id)
                    .eq('status', 'active');
                if (data)
                    setConnectedPros(data);
            }
        }
        catch (_a) { }
    });
    const toggleSetting = (key) => __awaiter(void 0, void 0, void 0, function* () {
        const newSettings = Object.assign(Object.assign({}, settings), { [key]: !settings[key] });
        setSettings(newSettings);
        yield platformStorage_1.default.setItem(PRIVACY_KEY, JSON.stringify(newSettings));
        // Sync to Supabase
        try {
            const supa = supabase_1.SupabaseService.getInstance();
            const { user } = yield supa.getCurrentUser();
            if (user) {
                yield supa.getClient().from('profiles').update({ data_privacy: newSettings }).eq('id', user.id);
            }
        }
        catch (_a) { }
    });
    const toggleAll = (on) => __awaiter(void 0, void 0, void 0, function* () {
        const newSettings = {};
        for (const key of Object.keys(DEFAULT_PRIVACY)) {
            newSettings[key] = on;
        }
        setSettings(newSettings);
        yield platformStorage_1.default.setItem(PRIVACY_KEY, JSON.stringify(newSettings));
        // Sync to Supabase (same as toggleSetting)
        try {
            const supa = supabase_1.SupabaseService.getInstance();
            const { user } = yield supa.getCurrentUser();
            if (user) {
                yield supa.getClient().from('profiles').update({ data_privacy: newSettings }).eq('id', user.id);
            }
        }
        catch (_a) { }
    });
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
            <react_native_1.ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <react_native_1.View style={st.header}>
                    <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={st.backBtn}>
                        <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.Text style={st.headerTitle}>{isTurkish ? 'Veri Gizliliği' : 'Data Privacy'}</react_native_1.Text>
                    <react_native_1.View style={{ width: 40 }}/>
                </react_native_1.View>

                {/* Info Box */}
                <react_native_1.View style={st.infoBox}>
                    <vector_icons_1.Ionicons name="shield-checkmark" size={22} color="#1CB0F6"/>
                    <react_native_1.Text style={st.infoText}>
                        {isTurkish
            ? 'PT ve diyetisyenlerinizin hangi verilerinizi görebileceğini buradan kontrol edin.'
            : 'Control which data your PT and dietitians can view.'}
                    </react_native_1.Text>
                </react_native_1.View>

                {/* Connected Professionals */}
                {connectedPros.length > 0 && (<react_native_1.View style={{ marginBottom: 20 }}>
                        <react_native_1.Text style={st.sectionTitle}>{isTurkish ? 'Bağlı Uzmanlar' : 'Connected Professionals'}</react_native_1.Text>
                        {connectedPros.map((c, i) => {
                var _a, _b;
                return (<react_native_1.View key={i} style={st.proCard}>
                                <react_native_1.View style={st.proAvatar}>
                                    <vector_icons_1.Ionicons name="person" size={18} color="#58CC02"/>
                                </react_native_1.View>
                                <react_native_1.View style={{ flex: 1 }}>
                                    <react_native_1.Text style={st.proName}>{((_a = c.professional) === null || _a === void 0 ? void 0 : _a.full_name) || 'Professional'}</react_native_1.Text>
                                    <react_native_1.Text style={st.proSpec}>{((_b = c.professional) === null || _b === void 0 ? void 0 : _b.specialization) || ''}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={[st.statusBadge, { backgroundColor: '#E8FFE0' }]}>
                                    <react_native_1.Text style={[st.statusText, { color: '#58CC02' }]}>{isTurkish ? 'Aktif' : 'Active'}</react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>);
            })}
                    </react_native_1.View>)}

                {/* Quick toggle */}
                <react_native_1.View style={st.quickToggle}>
                    <react_native_1.TouchableOpacity style={st.toggleAllBtn} onPress={() => toggleAll(true)}>
                        <react_native_1.Text style={st.toggleAllText}>{isTurkish ? 'Tümünü Aç' : 'Enable All'}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={[st.toggleAllBtn, { backgroundColor: '#FFF5F0' }]} onPress={() => toggleAll(false)}>
                        <react_native_1.Text style={[st.toggleAllText, { color: '#FF6B6B' }]}>{isTurkish ? 'Tümünü Kapat' : 'Disable All'}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>

                {/* Data Fields by Category */}
                {CATEGORIES.map(cat => (<react_native_1.View key={cat.key} style={{ marginBottom: 20 }}>
                        <react_native_1.Text style={[st.sectionTitle, { color: cat.color }]}>{isTurkish ? cat.label_tr : cat.label_en}</react_native_1.Text>
                        {DATA_FIELDS.filter(f => f.category === cat.key).map(field => (<react_native_1.View key={field.key} style={st.fieldRow}>
                                <vector_icons_1.Ionicons name={field.icon} size={20} color={cat.color}/>
                                <react_native_1.View style={{ flex: 1, marginLeft: 12 }}>
                                    <react_native_1.Text style={st.fieldLabel}>{isTurkish ? field.label_tr : field.label_en}</react_native_1.Text>
                                    <react_native_1.Text style={st.fieldDesc}>{isTurkish ? field.desc_tr : field.desc_en}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.Switch value={settings[field.key]} onValueChange={() => toggleSetting(field.key)} trackColor={{ false: '#E5E5E5', true: cat.color + '50' }} thumbColor={settings[field.key] ? cat.color : colors.textTertiary}/>
                            </react_native_1.View>))}
                    </react_native_1.View>))}

                <react_native_1.View style={{ height: 100 }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
    infoBox: { flexDirection: 'row', backgroundColor: '#E6F7FF', borderRadius: 16, padding: 16, marginBottom: 20, gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#B3E5FC' },
    infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    proCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0', gap: 12 },
    proAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#58CC02' },
    proName: { fontSize: 14, fontWeight: '700', color: colors.text },
    proSpec: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },
    quickToggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    toggleAllBtn: { flex: 1, backgroundColor: '#E8FFE0', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    toggleAllText: { fontSize: 13, fontWeight: '700', color: '#58CC02' },
    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    fieldDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
});
exports.default = DataPrivacyScreen;
