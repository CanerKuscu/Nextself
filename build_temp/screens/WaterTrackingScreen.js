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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const LanguageContext_1 = require("../contexts/LanguageContext");
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const waterTrackingService_1 = require("../services/waterTrackingService");
const { width } = react_native_1.Dimensions.get('window');
const WaterTrackingScreen = ({ navigation }) => {
    const { colors } = (0, ThemeContext_1.useTheme)();
    const st = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const waterService = waterTrackingService_1.WaterTrackingService.getInstance();
    const [config, setConfig] = (0, react_1.useState)(null);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [tempGoal, setTempGoal] = (0, react_1.useState)('2.5');
    const [tempNotifications, setTempNotifications] = (0, react_1.useState)('8');
    const [tempStartHour, setTempStartHour] = (0, react_1.useState)('8');
    const [tempEndHour, setTempEndHour] = (0, react_1.useState)('22');
    const { t, language } = (0, LanguageContext_1.useLanguage)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const progressAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const isTurkish = language === 'tr';
    const loadData = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const data = yield waterService.getConfig();
        setConfig(data);
        setTempGoal(data.dailyGoalLiters.toString());
        // Derive notification count from mlPerSip
        const notifs = Math.ceil((data.dailyGoalLiters * 1000) / (data.mlPerSip || 250));
        setTempNotifications(notifs.toString());
        setTempStartHour(((_a = data.startHour) !== null && _a !== void 0 ? _a : 8).toString());
        setTempEndHour(((_b = data.endHour) !== null && _b !== void 0 ? _b : 22).toString());
    });
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(() => {
        loadData();
    }, []));
    (0, react_1.useEffect)(() => {
        if (!config)
            return;
        const goalMl = config.dailyGoalLiters * 1000;
        const progress = Math.min(config.currentIntakeMl / goalMl, 1);
        react_native_1.Animated.timing(progressAnim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
    }, [config === null || config === void 0 ? void 0 : config.currentIntakeMl, config === null || config === void 0 ? void 0 : config.dailyGoalLiters]);
    const saveSettings = () => __awaiter(void 0, void 0, void 0, function* () {
        const goal = parseFloat(tempGoal) || 2.5;
        const notifs = parseInt(tempNotifications) || 8;
        const startHour = Math.max(0, Math.min(23, parseInt(tempStartHour) || 8));
        const endHour = Math.max(startHour + 1, Math.min(23, parseInt(tempEndHour) || 22));
        // Calculate mlPerSip based on notification count
        const mlPerSip = Math.round((goal * 1000) / Math.max(notifs, 1));
        if (!config)
            return;
        const newConfig = Object.assign(Object.assign({}, config), { dailyGoalLiters: goal, mlPerSip: mlPerSip, startHour,
            endHour });
        yield waterService.saveConfig(newConfig);
        // We might need gender for scheduling, passing null for now as it's optional/unknown here
        yield waterService.scheduleWaterNotifications(newConfig, null, isTurkish);
        setConfig(newConfig);
        setShowSettings(false);
    });
    const drinkWater = () => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield waterService.drinkWater();
        setConfig(updated);
        // Button pulse animation
        react_native_1.Animated.sequence([
            react_native_1.Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
            react_native_1.Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();
        const goalMl = updated.dailyGoalLiters * 1000;
        if (updated.currentIntakeMl >= goalMl && (updated.currentIntakeMl - updated.mlPerSip) < goalMl) {
            showAlert({
                type: 'success',
                title: t('goal_reached'),
                message: t('goal_reached_desc'),
                buttons: [{ text: 'OK' }],
            });
        }
    });
    const removeWater = () => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield waterService.undoLastDrink();
        setConfig(updated);
    });
    const handleAddWaterProgram = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!config)
            return;
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add a program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }
            const notifs = Math.ceil((config.dailyGoalLiters * 1000) / config.mlPerSip);
            const { error } = yield supabase.createAiProgram({
                userId: user.id,
                type: 'water',
                title: isTurkish ? 'Su Programı' : 'Water Program',
                content: `${isTurkish ? 'Günlük hedef' : 'Daily goal'}: ${config.dailyGoalLiters}L\n${isTurkish ? 'Hatırlatıcı sayısı' : 'Reminder count'}: ${notifs}`,
            });
            if (error)
                throw error;
            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? 'Su planı programına eklendi.' : 'Water plan added to your program.',
                buttons: [{ text: 'OK' }],
            });
        }
        catch (_a) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program eklenemedi. Tekrar deneyin.' : 'Could not add program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
    });
    if (!config)
        return <react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}/>;
    const goalMl = (config.dailyGoalLiters || 2.5) * 1000;
    const currentIntakeMl = config.currentIntakeMl || 0;
    const progress = Math.min(currentIntakeMl / goalMl, 1);
    const remaining = Math.max(goalMl - currentIntakeMl, 0);
    const perDrink = config.mlPerSip || 250;
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
            <AlertComponent />
            <react_native_1.ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <react_native_1.View style={st.header}>
                    <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')} style={st.backBtn}>
                        <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.Text style={st.headerTitle}>{t('water_tracking')}</react_native_1.Text>
                    <react_native_1.TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={st.settingsBtn}>
                        <vector_icons_1.Ionicons name="settings-outline" size={22} color="#1CB0F6"/>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>

                {/* Settings Panel */}
                {showSettings && (<react_native_1.View style={st.settingsPanel}>
                        <react_native_1.Text style={st.settingsTitle}>{t('settings')}</react_native_1.Text>
                        <react_native_1.View style={st.settingsRow}>
                            <react_native_1.Text style={st.settingsLabel}>{t('daily_goal_l')}</react_native_1.Text>
                        <react_native_1.TextInput style={st.settingsInput} value={tempGoal} onChangeText={setTempGoal} keyboardType="decimal-pad" placeholder="2.5" placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                        <react_native_1.View style={st.settingsRow}>
                            <react_native_1.Text style={st.settingsLabel}>{t('notification_count')}</react_native_1.Text>
                        <react_native_1.TextInput style={st.settingsInput} value={tempNotifications} onChangeText={setTempNotifications} keyboardType="number-pad" placeholder="8" placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                        <react_native_1.View style={st.settingsRow}>
                            <react_native_1.Text style={st.settingsLabel}>{isTurkish ? 'Başlangıç Saati' : 'Start Hour'}</react_native_1.Text>
                        <react_native_1.TextInput style={st.settingsInput} value={tempStartHour} onChangeText={setTempStartHour} keyboardType="number-pad" placeholder="8" placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                        <react_native_1.View style={st.settingsRow}>
                            <react_native_1.Text style={st.settingsLabel}>{isTurkish ? 'Bitiş Saati' : 'End Hour'}</react_native_1.Text>
                        <react_native_1.TextInput style={st.settingsInput} value={tempEndHour} onChangeText={setTempEndHour} keyboardType="number-pad" placeholder="22" placeholderTextColor={colors.textTertiary}/>
                        </react_native_1.View>
                        <react_native_1.Text style={st.settingsHint}>
                            {(isTurkish ? 'Bildirim aralığı' : 'Reminder range') + `: ${tempStartHour || '8'}:00 - ${tempEndHour || '22'}:00`}
                        </react_native_1.Text>
                        <react_native_1.Text style={st.settingsHint}>
                            {t('each_notification_adds', { ml: Math.round((parseFloat(tempGoal || '2.5') * 1000) / Math.max(parseInt(tempNotifications || '8'), 1)) })}
                        </react_native_1.Text>
                        <react_native_1.TouchableOpacity onPress={saveSettings} style={st.saveBtn}>
                            <expo_linear_gradient_1.LinearGradient colors={['#1CB0F6', '#0099DD']} style={st.saveBtnGrad}>
                                <react_native_1.Text style={st.saveBtnText}>{t('save')}</react_native_1.Text>
                            </expo_linear_gradient_1.LinearGradient>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>)}

                {/* Progress Circle */}
                <react_native_1.View style={st.circleWrap}>
                    <react_native_1.View style={st.circleOuter}>
                        <react_native_1.Animated.View style={[st.circleFill, {
                height: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                }),
            }]}/>
                        <react_native_1.View style={st.circleContent}>
                            <vector_icons_1.Ionicons name="water" size={32} color="#1CB0F6"/>
                            <react_native_1.Text style={st.circleValue}>{(currentIntakeMl / 1000).toFixed(1)}L</react_native_1.Text>
                            <react_native_1.Text style={st.circleGoal}>/ {(goalMl / 1000).toFixed(1)}L</react_native_1.Text>
                            <react_native_1.Text style={st.circlePercent}>{Math.round(progress * 100)}%</react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.View>

                {/* Stats Row */}
                <react_native_1.View style={st.statsRow}>
                    <react_native_1.View style={st.statCard}>
                        <vector_icons_1.Ionicons name="water-outline" size={20} color="#1CB0F6"/>
                        <react_native_1.Text style={st.statValue}>{config.drinkCount || 0}</react_native_1.Text>
                        <react_native_1.Text style={st.statLabel}>{t('drinks')}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={st.statCard}>
                        <vector_icons_1.Ionicons name="add-circle-outline" size={20} color="#58CC02"/>
                        <react_native_1.Text style={st.statValue}>{perDrink} ml</react_native_1.Text>
                        <react_native_1.Text style={st.statLabel}>{t('per_drink')}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={st.statCard}>
                        <vector_icons_1.Ionicons name="trending-down-outline" size={20} color="#FF9600"/>
                        <react_native_1.Text style={st.statValue}>{(remaining / 1000).toFixed(1)}L</react_native_1.Text>
                        <react_native_1.Text style={st.statLabel}>{t('remaining')}</react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>

                {/* Drink Button */}
                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 20 }}>
                    <react_native_1.TouchableOpacity onPress={removeWater} style={st.removeBtn}>
                        <vector_icons_1.Ionicons name="remove" size={24} color="#FF6B6B"/>
                    </react_native_1.TouchableOpacity>

                    <react_native_1.Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <react_native_1.TouchableOpacity onPress={drinkWater} activeOpacity={0.8}>
                            <expo_linear_gradient_1.LinearGradient colors={['#1CB0F6', '#0077CC']} style={st.drinkBtn}>
                                <vector_icons_1.Ionicons name="water" size={28} color={colors.background}/>
                                <react_native_1.Text style={st.drinkBtnText}>{t('i_drank_water')}</react_native_1.Text>
                                <react_native_1.Text style={st.drinkBtnSub}>+{perDrink} ml</react_native_1.Text>
                            </expo_linear_gradient_1.LinearGradient>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.Animated.View>
                </react_native_1.View>

                {/* Tips */}
                <react_native_1.View style={st.tipsCard}>
                    <vector_icons_1.Ionicons name="bulb-outline" size={22} color="#FF9600"/>
                    <react_native_1.View style={{ flex: 1, marginLeft: 12 }}>
                        <react_native_1.Text style={st.tipsTitle}>{t('tip')}</react_native_1.Text>
                        <react_native_1.Text style={st.tipsText}>
                            {t('water_tip_desc')}
                        </react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>

                <react_native_1.View style={{ height: 100 }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
    addProgramBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#58CC02', justifyContent: 'center', alignItems: 'center' },
    settingsBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
    settingsPanel: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
    settingsTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
    settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    settingsLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    settingsInput: { width: 80, height: 40, backgroundColor: colors.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
    settingsHint: { fontSize: 12, color: colors.textTertiary, marginTop: 4, marginBottom: 14 },
    saveBtn: { alignSelf: 'center' },
    saveBtnGrad: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.background },
    circleWrap: { alignItems: 'center', marginBottom: 30 },
    circleOuter: {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: colors.accentSoft, overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: colors.accent,
    },
    circleFill: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(28,176,246,0.2)',
    },
    circleContent: { alignItems: 'center', zIndex: 1 },
    circleValue: { fontSize: 36, fontWeight: '900', color: colors.text, marginTop: 4 },
    circleGoal: { fontSize: 14, color: colors.textTertiary, fontWeight: '600' },
    circlePercent: { fontSize: 13, fontWeight: '700', color: colors.accent, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },
    drinkBtn: { width: width * 0.65, paddingVertical: 20, borderRadius: 24, alignItems: 'center', gap: 4, elevation: 6, shadowColor: '#1CB0F6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    drinkBtnText: { fontSize: 18, fontWeight: '800', color: colors.background },
    drinkBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    removeBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.errorSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.error + '55' },
    tipsCard: { flexDirection: 'row', backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, marginTop: 30, borderWidth: 1, borderColor: colors.warning + '55' },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: '#FF9600', marginBottom: 4 },
    tipsText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
exports.default = WaterTrackingScreen;
