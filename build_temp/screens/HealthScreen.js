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
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const CustomAlert_1 = require("../components/CustomAlert");
const useTranslation_1 = require("../hooks/useTranslation");
const healthService_1 = require("../services/healthService");
const notificationService_1 = require("../services/notificationService");
const Sentry = __importStar(require("@sentry/react-native"));
const waterTrackingService_1 = require("../services/waterTrackingService");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
let LineChart, BarChart;
try {
    const ck = require('react-native-chart-kit');
    LineChart = ck.LineChart;
    BarChart = ck.BarChart;
}
catch (_a) { }
const HealthScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const METRIC_W = (width - 40 - 12) / 2;
    const { t, isTurkish, language } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const [healthData, setHealthData] = (0, react_1.useState)(null);
    const [waterConfig, setWaterConfig] = (0, react_1.useState)(null);
    const [insights, setInsights] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [connectionStatus, setConnectionStatus] = (0, react_1.useState)({ apple: false, google: false });
    const [weeklySteps, setWeeklySteps] = (0, react_1.useState)(Array(7).fill(0));
    const [weeklySleepHours, setWeeklySleepHours] = (0, react_1.useState)(Array(7).fill(0));
    const [latestWeight, setLatestWeight] = (0, react_1.useState)(null);
    const [showWaterSetup, setShowWaterSetup] = (0, react_1.useState)(false);
    const [waterGoalInput, setWaterGoalInput] = (0, react_1.useState)('2.5');
    const [mlPerSipInput, setMlPerSipInput] = (0, react_1.useState)('250');
    const [waterStartHourInput, setWaterStartHourInput] = (0, react_1.useState)('8');
    const [waterEndHourInput, setWaterEndHourInput] = (0, react_1.useState)('22');
    const [userGender, setUserGender] = (0, react_1.useState)(null);
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const healthService = healthService_1.HealthService.getInstance();
    const waterService = waterTrackingService_1.WaterTrackingService.getInstance();
    (0, react_1.useEffect)(() => { loadAll(); }, [language]);
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(() => {
        const refreshWater = () => __awaiter(void 0, void 0, void 0, function* () {
            const wConfig = yield waterService.getConfig();
            setWaterConfig(wConfig);
        });
        refreshWater();
    }, []));
    (0, react_1.useEffect)(() => {
        const stopStream = healthService.startHealthDataStream((payload) => __awaiter(void 0, void 0, void 0, function* () {
            setHealthData(payload.healthData);
            setWeeklySteps(Array.isArray(payload.weeklySteps) && payload.weeklySteps.length === 7 ? payload.weeklySteps : Array(7).fill(0));
            setWeeklySleepHours(Array.isArray(payload.weeklySleepHours) && payload.weeklySleepHours.length === 7 ? payload.weeklySleepHours : Array(7).fill(0));
            setInsights(healthService.generateHealthInsights(payload.healthData, userGender));
        }), { intervalMs: 15000, includeWeeklySteps: true, includeWeeklySleep: true });
        return () => {
            stopStream();
        };
    }, [language, userGender]);
    const loadAll = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        setLoading(true);
        try {
            yield healthService.initialize();
            const [hData, wConfig, connStatus] = yield Promise.all([
                healthService.getTodayHealthData(), waterService.getConfig(), healthService.getConnectionStatus(),
            ]);
            const [weeklyStepsData, weeklySleepData] = yield Promise.all([
                healthService.getWeeklyStepsData(),
                healthService.getWeeklySleepData(),
            ]);
            const weightRecord = yield healthService.fetchLatestWeight();
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            let gender = null;
            if (user) {
                const { data: profile } = yield supabase.getUserProfile(user.id);
                if (profile === null || profile === void 0 ? void 0 : profile.gender) {
                    gender = profile.gender;
                    setUserGender(gender);
                }
            }
            setHealthData(hData);
            setWaterConfig(wConfig);
            setConnectionStatus(connStatus);
            setWaterGoalInput(((_a = wConfig === null || wConfig === void 0 ? void 0 : wConfig.dailyGoalLiters) !== null && _a !== void 0 ? _a : 2.5).toString());
            setMlPerSipInput(((_b = wConfig === null || wConfig === void 0 ? void 0 : wConfig.mlPerSip) !== null && _b !== void 0 ? _b : 250).toString());
            setWaterStartHourInput(((_c = wConfig === null || wConfig === void 0 ? void 0 : wConfig.startHour) !== null && _c !== void 0 ? _c : 8).toString());
            setWaterEndHourInput(((_d = wConfig === null || wConfig === void 0 ? void 0 : wConfig.endHour) !== null && _d !== void 0 ? _d : 22).toString());
            setWeeklySteps(Array.isArray(weeklyStepsData) && weeklyStepsData.length === 7 ? weeklyStepsData : Array(7).fill(0));
            setWeeklySleepHours(Array.isArray(weeklySleepData) && weeklySleepData.length === 7 ? weeklySleepData : Array(7).fill(0));
            setLatestWeight((_e = weightRecord === null || weightRecord === void 0 ? void 0 : weightRecord.weight) !== null && _e !== void 0 ? _e : null);
            setInsights(healthService.generateHealthInsights(hData, gender));
            yield notificationService_1.NotificationService.getInstance().checkSmartReminders(hData, language);
        }
        catch (err) {
            Sentry.captureException(err);
        }
        finally {
            setLoading(false);
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        }
    });
    const handleConnectApple = () => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS !== 'ios') {
            showAlert({ type: 'info', title: isTurkish ? 'iOS Gerekli' : 'iOS Required', message: isTurkish ? "Apple Health yalnızca iPhone'da kullanılabilir." : 'Apple Health is only available on iPhone.', buttons: [{ text: 'OK' }] });
            return;
        }
        const result = yield healthService.connectAppleHealth();
        if (result.success) {
            setConnectionStatus(prev => (Object.assign(Object.assign({}, prev), { apple: true })));
            showAlert({ type: 'success', title: isTurkish ? 'Bağlandı' : 'Connected', message: isTurkish ? 'Apple Health bağlandı!' : 'Apple Health connected!', buttons: [{ text: 'OK' }] });
            loadAll();
        }
    });
    const handleConnectGoogle = () => __awaiter(void 0, void 0, void 0, function* () {
        if (react_native_1.Platform.OS !== 'android') {
            showAlert({ type: 'info', title: isTurkish ? 'Android Gerekli' : 'Android Required', message: isTurkish ? "Google Health yalnızca Android'de kullanılabilir." : 'Google Health is only available on Android.', buttons: [{ text: 'OK' }] });
            return;
        }
        const result = yield healthService.connectGoogleHealth();
        if (result.success) {
            setConnectionStatus(prev => (Object.assign(Object.assign({}, prev), { google: true })));
            showAlert({ type: 'success', title: isTurkish ? 'Bağlandı' : 'Connected', message: isTurkish ? 'Google Health bağlandı!' : 'Google Health connected!', buttons: [{ text: 'OK' }] });
            loadAll();
        }
        else if (result.needsInstall) {
            showAlert({
                type: 'warning',
                title: isTurkish ? 'Health Connect Gerekli' : 'Health Connect Required',
                message: isTurkish
                    ? 'Google Health Connect uygulaması cihazınızda yüklü değil. Sağlık verilerinizi takip edebilmek için Play Store\'dan yüklemeniz gerekiyor.'
                    : 'Google Health Connect app is not installed on your device. You need to install it from the Play Store to track your health data.',
                buttons: [
                    {
                        text: isTurkish ? 'Yükle' : 'Install',
                        onPress: () => healthService.openHealthConnectInstall(),
                    },
                    { text: isTurkish ? 'Vazgeç' : 'Cancel' },
                ],
            });
        }
        else if (result.needsPermission) {
            showAlert({
                type: 'confirm',
                title: isTurkish ? 'İzin Gerekli' : 'Permission Required',
                message: isTurkish
                    ? 'Google Health verilerini okuyabilmek için Health Connect izinlerini açmanız gerekiyor.'
                    : 'You need to enable Health Connect permissions to read Google Health data.',
                buttons: [
                    {
                        text: isTurkish ? 'Ayarları Aç' : 'Open Settings',
                        onPress: () => healthService.openHealthConnectSettings(),
                    },
                    { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                ],
            });
        }
        else {
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: result.error || (isTurkish ? 'Bağlantı kurulamadı.' : 'Connection failed.'), buttons: [{ text: 'OK' }] });
        }
    });
    const drinkWater = () => __awaiter(void 0, void 0, void 0, function* () { const updated = yield waterService.drinkWater(); setWaterConfig(updated); });
    const undoWater = () => __awaiter(void 0, void 0, void 0, function* () { const updated = yield waterService.undoLastDrink(); setWaterConfig(updated); });
    const saveWaterSetup = () => __awaiter(void 0, void 0, void 0, function* () {
        const goal = parseFloat(waterGoalInput);
        const mlSip = parseInt(mlPerSipInput);
        if (isNaN(goal) || goal <= 0 || isNaN(mlSip) || mlSip <= 0) {
            showAlert({ type: 'warning', title: '!', message: isTurkish ? 'Geçerli değerler girin.' : 'Enter valid values.', buttons: [{ text: 'OK' }] });
            return;
        }
        const startHour = Math.max(0, Math.min(23, parseInt(waterStartHourInput) || 8));
        const endHour = Math.max(startHour + 1, Math.min(23, parseInt(waterEndHourInput) || 22));
        const existing = waterConfig || { dailyGoalLiters: 2.5, mlPerSip: 250, startHour: 8, endHour: 22, currentIntakeMl: 0, date: new Date().toDateString(), drinkCount: 0 };
        const updated = Object.assign(Object.assign({}, existing), { dailyGoalLiters: goal, mlPerSip: mlSip, startHour, endHour });
        yield waterService.saveConfig(updated);
        yield waterService.scheduleWaterNotifications(updated, userGender, isTurkish);
        setWaterConfig(updated);
        setShowWaterSetup(false);
        showAlert({ type: 'success', title: isTurkish ? 'Su Hedefi' : 'Water Goal', message: isTurkish ? `${goal}L hedef ayarlandı.` : `${goal}L goal set.`, buttons: [{ text: 'OK' }] });
    });
    const waterStats = waterConfig ? waterService.getStats(waterConfig) : null;
    const insightColor = (s) => s === 'good' ? '#58CC02' : s === 'warning' ? '#FF9600' : '#FF4B4B';
    const walkingDistanceKm = healthData ? Number(((healthData.steps * 0.78) / 1000).toFixed(2)) : 0;
    const healthMetrics = healthData ? [
        { icon: 'bed', label: isTurkish ? 'Uyku' : 'Sleep', value: healthData.sleepHours > 0 ? `${healthData.sleepHours.toFixed(1)}h` : '--', color: '#7C3AED', bg: colors.secondarySoft },
        { icon: 'footsteps', label: isTurkish ? 'Adım' : 'Steps', value: healthData.steps > 0 ? healthData.steps.toLocaleString() : '--', color: '#58CC02', bg: colors.successSoft },
        { icon: 'walk', label: isTurkish ? 'Yürüyüş' : 'Walk', value: healthData.steps > 0 ? `${walkingDistanceKm} km` : '--', color: '#0EA5E9', bg: colors.infoSoft },
        { icon: 'pulse', label: isTurkish ? 'Nabız' : 'Heart Rate', value: healthData.heartRate > 0 ? `${healthData.heartRate}` : '--', color: '#FF4B4B', bg: colors.errorSoft },
        { icon: 'flame', label: isTurkish ? 'Kalori' : 'Calories', value: healthData.calories > 0 ? healthData.calories.toString() : '--', color: '#FF9600', bg: colors.warningSoft },
        { icon: 'scale', label: isTurkish ? 'Kilo' : 'Weight', value: latestWeight ? `${latestWeight.toFixed(1)} kg` : '--', color: '#9333EA', bg: colors.secondarySoft },
    ] : [];
    const weeklyLabels = Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - index));
        const locale = isTurkish ? 'tr-TR' : 'en-US';
        return day.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
    });
    const weeklyStepsData = {
        labels: weeklyLabels,
        datasets: [{ data: weeklySteps.map(v => Math.max(0, Math.round(v / 100) * 100)) }],
    };
    const weeklySleepChartData = {
        labels: weeklyLabels,
        datasets: [{ data: weeklySleepHours.map(v => Number((v || 0).toFixed(1))) }],
    };
    // Water ring
    const waterProgress = waterStats ? Math.min(waterStats.percentage / 100, 1) : 0;
    const wRingSize = 120;
    const wSw = 12;
    const wR = (wRingSize - wSw) / 2;
    const wCirc = 2 * Math.PI * wR;
    const wOff = wCirc * (1 - waterProgress);
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
      <AlertComponent />
      <react_native_1.ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
        <react_native_1.Animated.View style={{ opacity: fadeAnim }}>

          {/* ─── HEADER ─── */}
          <react_native_1.View style={styles.header}>
            <react_native_1.View>
              <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Sağlık' : 'Health'}</react_native_1.Text>
              <react_native_1.Text style={styles.headerSub}>{isTurkish ? 'Günlük sağlık takibiniz' : 'Your daily health tracking'}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={[styles.connBadge, { backgroundColor: connectionStatus.apple || connectionStatus.google ? colors.successSoft : colors.surfaceSecondary }]}>
              <vector_icons_1.Ionicons name={connectionStatus.apple || connectionStatus.google ? 'checkmark-circle' : 'sync-outline'} size={14} color={connectionStatus.apple || connectionStatus.google ? '#58CC02' : colors.textTertiary}/>
              <react_native_1.Text style={[styles.connBadgeText, { color: connectionStatus.apple || connectionStatus.google ? '#58CC02' : colors.textTertiary }]}>
                {connectionStatus.apple || connectionStatus.google ? (isTurkish ? 'Bağlı' : 'OK') : (isTurkish ? 'Bağla' : 'Connect')}
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* ─── METRICS GRID (2x2) ─── */}
          <react_native_1.View style={styles.metricsGrid}>
            {healthMetrics.map((m, i) => (<react_native_1.View key={i} style={[styles.metricCard, { backgroundColor: m.bg, width: METRIC_W }]}>
                <react_native_1.View style={[styles.metricIcon, { backgroundColor: m.color + '20' }]}>
                  <vector_icons_1.Ionicons name={m.icon} size={20} color={m.color}/>
                </react_native_1.View>
                <react_native_1.Text style={[styles.metricValue, m.value === '--' && { color: colors.textTertiary }]}>{m.value}</react_native_1.Text>
                <react_native_1.Text style={styles.metricLabel}>{m.label}</react_native_1.Text>
              </react_native_1.View>))}
          </react_native_1.View>

          {/* ─── INSIGHTS ─── */}
          {insights.length > 0 && (<>
              <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'İçgörüler' : 'Insights'}</react_native_1.Text>
              {insights.map((ins, i) => (<react_native_1.View key={i} style={styles.insightCard}>
                  <react_native_1.View style={[styles.insightAccent, { backgroundColor: insightColor(ins.severity) }]}/>
                  <react_native_1.View style={[styles.insightIcon, { backgroundColor: insightColor(ins.severity) + '15' }]}>
                    <vector_icons_1.Ionicons name={ins.icon} size={18} color={insightColor(ins.severity)}/>
                  </react_native_1.View>
                  <react_native_1.View style={{ flex: 1 }}>
                    <react_native_1.Text style={styles.insightTitle}>{isTurkish ? ins.title_tr : ins.title_en}</react_native_1.Text>
                    <react_native_1.Text style={styles.insightMsg}>{isTurkish ? ins.message_tr : ins.message_en}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>))}
            </>)}

          {/* ─── STEPS CHART ─── */}
          {BarChart && (<>
              <react_native_1.Text style={styles.sectionTitle}><vector_icons_1.Ionicons name="trending-up" size={16} color="#58CC02"/> {isTurkish ? 'Haftalık Adım' : 'Weekly Steps'}</react_native_1.Text>
              <react_native_1.View style={styles.chartCard}>
                <BarChart data={weeklyStepsData} width={width - 40 - 32} height={150} chartConfig={{ backgroundColor: colors.surface, backgroundGradientFrom: colors.surface, backgroundGradientTo: colors.surface, decimalPlaces: 0, color: (o) => `rgba(88, 204, 2, ${o})`, labelColor: () => colors.textTertiary, barPercentage: 0.6 }} style={{ borderRadius: 12 }} showValuesOnTopOfBars/>
              </react_native_1.View>
            </>)}

          {LineChart && (<>
              <react_native_1.Text style={styles.sectionTitle}><vector_icons_1.Ionicons name="moon" size={16} color="#7C3AED"/> {isTurkish ? 'Haftalık Uyku (Saat)' : 'Weekly Sleep (Hours)'}</react_native_1.Text>
              <react_native_1.View style={styles.chartCard}>
                <LineChart data={weeklySleepChartData} width={width - 40 - 32} height={150} chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 1,
                color: (o) => `rgba(124, 58, 237, ${o})`,
                labelColor: () => colors.textTertiary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#7C3AED' },
            }} bezier style={{ borderRadius: 12 }}/>
              </react_native_1.View>
            </>)}

          {/* ─── WATER TRACKER ─── */}
          <react_native_1.View style={styles.waterHeader}>
            <react_native_1.Text style={styles.sectionTitle}><vector_icons_1.Ionicons name="water" size={16} color="#1CB0F6"/> {isTurkish ? 'Su Takibi' : 'Water'}</react_native_1.Text>
            <react_native_1.TouchableOpacity style={styles.setupBtn} onPress={() => setShowWaterSetup(true)}>
              <vector_icons_1.Ionicons name="settings" size={14} color="#1CB0F6"/>
              <react_native_1.Text style={styles.setupBtnText}>{isTurkish ? 'Ayarla' : 'Setup'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <react_native_1.View style={styles.waterCard}>
            {waterStats ? (<react_native_1.View style={styles.waterRow}>
                {/* Water Ring */}
                <react_native_1.View style={{ alignItems: 'center' }}>
                  <react_native_1.View style={{ width: wRingSize, height: wRingSize, alignItems: 'center', justifyContent: 'center' }}>
                    <react_native_svg_1.default width={wRingSize} height={wRingSize} style={{ position: 'absolute' }}>
                      <react_native_svg_1.Circle cx={wRingSize / 2} cy={wRingSize / 2} r={wR} stroke={colors.infoSoft} strokeWidth={wSw} fill="none"/>
                      <react_native_svg_1.Circle cx={wRingSize / 2} cy={wRingSize / 2} r={wR} stroke="#1CB0F6" strokeWidth={wSw} fill="none" strokeDasharray={`${wCirc} ${wCirc}`} strokeDashoffset={wOff} strokeLinecap="round" transform={`rotate(-90 ${wRingSize / 2} ${wRingSize / 2})`}/>
                    </react_native_svg_1.default>
                    <react_native_1.Text style={{ fontSize: 14, fontWeight: '800', color: colors.accent }}>{waterStats.percentage.toFixed(0)}%</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>

                {/* Water Info */}
                <react_native_1.View style={{ flex: 1, marginLeft: 18 }}>
                  <react_native_1.Text style={styles.waterAmountText}>
                    {(waterStats.currentIntakeMl / 1000).toFixed(1)}L / {waterConfig.dailyGoalLiters}L
                  </react_native_1.Text>
                  <react_native_1.Text style={styles.waterRemaining}>
                    {isTurkish ? 'Kalan:' : 'Remaining:'} {(waterStats.remainingMl / 1000).toFixed(1)}L
                  </react_native_1.Text>
                  <react_native_1.View style={styles.waterActions}>
                    <react_native_1.TouchableOpacity style={styles.undoBtn} onPress={undoWater}>
                      <vector_icons_1.Ionicons name="arrow-undo" size={16} color={colors.textTertiary}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={styles.drinkBtn} onPress={drinkWater}>
                      <react_native_1.Text style={styles.drinkBtnText}>+{waterConfig.mlPerSip}ml</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>) : (<react_native_1.TouchableOpacity onPress={() => setShowWaterSetup(true)} style={styles.waterEmpty}>
                <vector_icons_1.Ionicons name="water" size={32} color={colors.accent}/>
                <react_native_1.Text style={styles.waterEmptyText}>{isTurkish ? 'Hedef belirle' : 'Set a goal'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>

          {/* Glass Row */}
          {waterStats && waterConfig && (<react_native_1.View style={styles.glassRow}>
              {Array.from({ length: Math.ceil((waterConfig.dailyGoalLiters * 1000) / waterConfig.mlPerSip) }, (_, i) => {
                const filled = i < Math.floor(waterStats.currentIntakeMl / waterConfig.mlPerSip);
                return <vector_icons_1.Ionicons key={i} name={filled ? 'water' : 'water-outline'} size={20} color={filled ? colors.accent : colors.border}/>;
            })}
            </react_native_1.View>)}

          {/* ─── HEALTH CONNECT ─── */}
          <react_native_1.Text style={styles.sectionTitle}><vector_icons_1.Ionicons name="link" size={16} color="#58CC02"/> {isTurkish ? 'Bağlantılar' : 'Connections'}</react_native_1.Text>
          {[
            { name: 'Apple Health', icon: 'logo-apple', iconBg: '#000000', connected: connectionStatus.apple, onPress: handleConnectApple },
            { name: 'Google Health', icon: 'logo-google', iconBg: '#4285F4', connected: connectionStatus.google, onPress: handleConnectGoogle },
            { name: 'Strava', icon: 'bicycle', iconBg: '#FC4C02', connected: false, onPress: () => {
                    showAlert({
                        type: 'info',
                        title: 'Strava',
                        message: isTurkish ? 'Strava entegrasyonu yakında aktif olacak.' : 'Strava integration is coming soon.',
                        buttons: [{ text: 'OK' }]
                    });
                } },
            { name: 'MyFitnessPal', icon: 'nutrition', iconBg: '#0066EE', connected: false, onPress: () => {
                    showAlert({
                        type: 'info',
                        title: 'MyFitnessPal',
                        message: isTurkish ? 'MyFitnessPal entegrasyonu yakında aktif olacak.' : 'MyFitnessPal integration is coming soon.',
                        buttons: [{ text: 'OK' }]
                    });
                } },
        ].map((src, i) => (<react_native_1.View key={i} style={styles.connectCard}>
              <react_native_1.View style={[styles.connectIcon, { backgroundColor: src.iconBg }]}>
                <vector_icons_1.Ionicons name={src.icon} size={18} color={colors.background}/>
              </react_native_1.View>
              <react_native_1.View style={{ flex: 1 }}>
                <react_native_1.Text style={styles.connectName}>{src.name}</react_native_1.Text>
                <react_native_1.Text style={[styles.connectStatus, { color: src.connected ? '#58CC02' : colors.textTertiary }]}>
                  {src.connected ? (isTurkish ? 'Bağlı' : 'Connected') : (isTurkish ? 'Bağlı değil' : 'Not connected')}
                </react_native_1.Text>
              </react_native_1.View>
              <react_native_1.TouchableOpacity style={[styles.connectBtn, { backgroundColor: src.connected ? colors.successSoft : '#58CC02' }]} onPress={src.onPress}>
                <react_native_1.Text style={[styles.connectBtnText, { color: src.connected ? '#58CC02' : colors.background }]}>
                  {src.connected ? '✓' : (isTurkish ? 'Bağla' : 'Connect')}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>))}

          {/* ─── MANUAL INPUT ─── */}
          {!connectionStatus.apple && !connectionStatus.google && (<>
              <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Manuel Giriş' : 'Manual Entry'}</react_native_1.Text>
              <react_native_1.View style={styles.manualRow}>
                {[
                { label: isTurkish ? 'Adım' : 'Steps', field: 'steps' },
                { label: isTurkish ? 'Uyku (h)' : 'Sleep (h)', field: 'sleepHours' },
                { label: isTurkish ? 'Nabız' : 'HR', field: 'heartRate' },
            ].map(f => (<react_native_1.View key={f.field} style={styles.manualItem}>
                    <react_native_1.Text style={styles.manualLabel}>{f.label}</react_native_1.Text>
                    <react_native_1.TextInput style={styles.manualInput} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} onEndEditing={(e) => __awaiter(void 0, void 0, void 0, function* () {
                    const val = parseFloat(e.nativeEvent.text);
                    if (!isNaN(val)) {
                        const updated = yield healthService.updateManualData(f.field, val);
                        setHealthData(updated);
                        setInsights(healthService.generateHealthInsights(updated, userGender));
                    }
                })}/>
                  </react_native_1.View>))}
              </react_native_1.View>

              <react_native_1.TouchableOpacity style={styles.smartScaleBtn} onPress={() => navigation === null || navigation === void 0 ? void 0 : navigation.navigate('SmartScale')}>
                <vector_icons_1.Ionicons name="scale-outline" size={20} color={colors.background}/>
                <react_native_1.Text style={styles.smartScaleBtnText}>
                  {isTurkish ? 'Detaylı Vücut Analizi Gir (Akıllı Tartı)' : 'Log Full Body Analysis (Smart Scale)'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </>)}

          <react_native_1.View style={{ height: 120 }}/>
        </react_native_1.Animated.View>
      </react_native_1.ScrollView>

      {/* ─── WATER SETUP MODAL ─── */}
      <react_native_1.Modal visible={showWaterSetup} animationType="slide" presentationStyle="pageSheet">
        <react_native_1.View style={[styles.modal, { paddingTop: 16, paddingBottom: insets.bottom + 24 }]}>
          <react_native_1.View style={styles.modalHeader}>
            <react_native_1.TouchableOpacity onPress={() => setShowWaterSetup(false)} style={styles.modalClose}>
              <vector_icons_1.Ionicons name="close" size={22} color={colors.text}/>
            </react_native_1.TouchableOpacity>
            <react_native_1.Text style={styles.modalTitle}>{isTurkish ? 'Su Ayarları' : 'Water Setup'}</react_native_1.Text>
            <react_native_1.View style={{ width: 36 }}/>
          </react_native_1.View>

          <react_native_1.ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <react_native_1.View style={styles.setupCard}>
              <react_native_1.Text style={styles.setupLabel}>{isTurkish ? 'Günlük Hedef (L)' : 'Daily Goal (L)'}</react_native_1.Text>
              <react_native_1.TextInput style={styles.setupInput} value={waterGoalInput} onChangeText={setWaterGoalInput} keyboardType="numeric" placeholder="2.5" placeholderTextColor={colors.textTertiary}/>

              <react_native_1.Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Her İçişte (ml)' : 'Per Drink (ml)'}</react_native_1.Text>
              <react_native_1.TextInput style={styles.setupInput} value={mlPerSipInput} onChangeText={setMlPerSipInput} keyboardType="numeric" placeholder="250" placeholderTextColor={colors.textTertiary}/>

              <react_native_1.Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Başlangıç Saati (0-23)' : 'Start Hour (0-23)'}</react_native_1.Text>
              <react_native_1.TextInput style={styles.setupInput} value={waterStartHourInput} onChangeText={setWaterStartHourInput} keyboardType="numeric" placeholder="8" placeholderTextColor={colors.textTertiary}/>

              <react_native_1.Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Bitiş Saati (0-23)' : 'End Hour (0-23)'}</react_native_1.Text>
              <react_native_1.TextInput style={styles.setupInput} value={waterEndHourInput} onChangeText={setWaterEndHourInput} keyboardType="numeric" placeholder="22" placeholderTextColor={colors.textTertiary}/>

              <react_native_1.View style={styles.calcCard}>
                <react_native_1.Text style={styles.calcText}>{waterGoalInput}L ÷ {mlPerSipInput}ml = {Math.ceil((parseFloat(waterGoalInput) * 1000) / parseInt(mlPerSipInput)) || 0} {isTurkish ? 'bildirim' : 'reminders'}</react_native_1.Text>
                <react_native_1.Text style={[styles.calcText, { marginTop: 6 }]}>{(isTurkish ? 'Saat aralığı' : 'Time range') + `: ${waterStartHourInput || '8'}:00 - ${waterEndHourInput || '22'}:00`}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>

            <react_native_1.TouchableOpacity style={styles.saveBtn} onPress={saveWaterSetup} activeOpacity={0.8}>
              <react_native_1.Text style={styles.saveBtnText}>{isTurkish ? 'Kaydet & Planla' : 'Save & Schedule'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.ScrollView>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
    connBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    connBadgeText: { fontSize: 11, fontWeight: '700' },
    // Metrics 2x2
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    metricCard: { borderRadius: 20, padding: 16, alignItems: 'center' },
    metricIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    metricValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    metricLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    // Sections
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 4 },
    // Insights
    insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 16, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
    insightAccent: { width: 4, height: '100%' },
    insightIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
    insightTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
    insightMsg: { fontSize: 11, color: colors.textTertiary, marginTop: 2, lineHeight: 16 },
    // Chart
    chartCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
    // Water
    waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.infoSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    setupBtnText: { fontSize: 11, fontWeight: '700', color: colors.accent },
    waterCard: { backgroundColor: colors.infoSoft, borderRadius: 20, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
    waterRow: { flexDirection: 'row', alignItems: 'center' },
    waterAmountText: { fontSize: 18, fontWeight: '800', color: colors.accent },
    waterRemaining: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    waterActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    undoBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
    drinkBtn: { backgroundColor: '#1CB0F6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
    drinkBtnText: { fontSize: 13, fontWeight: '700', color: colors.background },
    waterEmpty: { alignItems: 'center', paddingVertical: 30 },
    waterEmptyText: { fontSize: 13, color: colors.textTertiary, marginTop: 8 },
    glassRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 20, paddingHorizontal: 4 },
    // Connect
    connectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: colors.borderLight },
    connectIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    connectName: { fontSize: 14, fontWeight: '700', color: colors.text },
    connectStatus: { fontSize: 11, marginTop: 1 },
    connectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    connectBtnText: { fontSize: 12, fontWeight: '700' },
    // Manual
    manualRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    manualItem: { flex: 1 },
    manualLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginBottom: 6, textAlign: 'center' },
    manualInput: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', textAlignVertical: 'center' },
    smartScaleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)' },
    smartScaleBtnText: { fontSize: 14, fontWeight: '700', color: colors.background },
    // Modal
    modal: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    setupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderLight },
    setupLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
    setupInput: { backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontWeight: '700', color: colors.text, borderWidth: 1, borderColor: colors.borderLight, textAlignVertical: 'center' },
    calcCard: { backgroundColor: colors.infoSoft, borderRadius: 14, padding: 14, marginTop: 18 },
    calcText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
exports.default = HealthScreen;
