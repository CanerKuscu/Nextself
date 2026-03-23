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
exports.default = ActiveWorkoutScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
const useTranslation_1 = require("../hooks/useTranslation");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const missionService_1 = require("../services/missionService");
const leagueService_1 = require("../services/leagueService");
const streakService_1 = require("../services/streakService");
const healthService_1 = require("../services/healthService");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
function ActiveWorkoutScreen({ navigation, route }) {
    var _a, _b;
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    // Workout State
    const [elapsedTime, setElapsedTime] = (0, react_1.useState)(0);
    const [heartRate, setHeartRate] = (0, react_1.useState)(null);
    const [calories, setCalories] = (0, react_1.useState)(0);
    const [isPaused, setIsPaused] = (0, react_1.useState)(false);
    const [sensorSource, setSensorSource] = (0, react_1.useState)(null);
    const workoutName = ((_a = route.params) === null || _a === void 0 ? void 0 : _a.workoutName) || (isTurkish ? 'Serbest İdman' : 'Freestyle Workout');
    const muscleGroups = ((_b = route.params) === null || _b === void 0 ? void 0 : _b.muscleGroups) || [];
    const [saving, setSaving] = (0, react_1.useState)(false);
    const workoutStartRef = react_1.default.useRef(new Date());
    // Heartbeat Animation
    const scale = (0, react_native_reanimated_1.useSharedValue)(1);
    (0, react_1.useEffect)(() => {
        // Start Heartbeat Animation
        scale.value = (0, react_native_reanimated_1.withRepeat)((0, react_native_reanimated_1.withSequence)((0, react_native_reanimated_1.withTiming)(1.2, { duration: 200, easing: react_native_reanimated_1.Easing.ease }), (0, react_native_reanimated_1.withTiming)(1, { duration: 200, easing: react_native_reanimated_1.Easing.ease }), (0, react_native_reanimated_1.withTiming)(1.1, { duration: 200, easing: react_native_reanimated_1.Easing.ease }), (0, react_native_reanimated_1.withTiming)(1, { duration: 400, easing: react_native_reanimated_1.Easing.ease })), -1, // infinite
        false);
        return () => {
            // Cleanup infinite animation on unmount
            (0, react_native_reanimated_1.cancelAnimation)(scale);
        };
    }, []);
    const animatedHeartStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => {
        return { transform: [{ scale: scale.value }] };
    });
    (0, react_1.useEffect)(() => {
        let interval;
        if (!isPaused) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPaused]);
    (0, react_1.useEffect)(() => {
        const healthService = healthService_1.HealthService.getInstance();
        if (isPaused)
            return;
        const stopStream = healthService.startWorkoutMetricsStream(workoutStartRef.current, (metrics) => {
            setSensorSource(metrics.source);
            setHeartRate(metrics.heartRate);
            setCalories(metrics.calories);
        }, { intervalMs: 3000 });
        return () => {
            stopStream();
        };
    }, [isPaused]);
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const h = Math.floor(seconds / 3600);
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };
    const handleFinish = () => __awaiter(this, void 0, void 0, function* () {
        if (saving)
            return;
        setSaving(true);
        let saveSuccess = true;
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                // Save workout to Supabase
                yield supabase.getClient().from('workout_sessions').insert({
                    user_id: user.id,
                    start_time: workoutStartRef.current.toISOString(),
                    end_time: new Date().toISOString(),
                    duration: elapsedTime,
                    calories_burned: calories,
                    exercises: Array.isArray(muscleGroups) ? muscleGroups : [],
                    notes: workoutName,
                });
                // Log streak
                try {
                    yield streakService_1.StreakService.getInstance().logWorkout();
                }
                catch (_a) { }
                // Award XP (10 base + 1 per minute + 1 per 50 cal)
                const xpAmount = 10 + Math.round(elapsedTime / 60) + Math.round(calories / 50);
                try {
                    yield leagueService_1.LeagueService.getInstance().addXP(xpAmount, 'workout', workoutName);
                }
                catch (_b) { }
                // Update Missions
                try {
                    yield missionService_1.MissionService.getInstance().updateProgressByCategory('workout', 1);
                }
                catch (_c) { }
            }
        }
        catch (err) {
            console.warn('Workout save error:', err);
            saveSuccess = false;
        }
        finally {
            setSaving(false);
        }
        if (saveSuccess) {
            showAlert({
                type: 'success',
                title: isTurkish ? 'İdman Tamamlandı!' : 'Workout Complete!',
                message: isTurkish
                    ? `Süre: ${formatTime(elapsedTime)}\nYakılan: ${calories} kcal\nOrtalama Nabız: ${heartRate !== null && heartRate !== void 0 ? heartRate : '-'} BPM`
                    : `Duration: ${formatTime(elapsedTime)}\nBurned: ${calories} kcal\nAvg HR: ${heartRate !== null && heartRate !== void 0 ? heartRate : '-'} BPM`,
                buttons: [{ text: isTurkish ? 'Harika!' : 'Awesome!', onPress: () => (0, navigation_1.safeGoBack)(navigation, 'Workout') }],
            });
        }
        else {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Kaydetme Hatası' : 'Save Error',
                message: isTurkish
                    ? 'İdman kaydedilemedi. Lütfen tekrar deneyin.'
                    : 'Failed to save workout. Please try again.',
                buttons: [{ text: isTurkish ? 'Tamam' : 'OK' }],
            });
        }
    });
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => {
            showAlert({
                type: 'confirm',
                title: isTurkish ? 'İdmanı Bırak' : 'Quit Workout',
                message: isTurkish ? 'İdmanı bitirmek istediğinize emin misiniz? İlerleme kaydedilmeyecek.' : 'Are you sure you want to quit? Progress will not be saved.',
                buttons: [
                    { text: isTurkish ? 'İptal' : 'Cancel', style: 'cancel' },
                    { text: isTurkish ? 'Bırak' : 'Quit', style: 'destructive', onPress: () => (0, navigation_1.safeGoBack)(navigation, 'Workout') },
                ],
            });
        }} style={styles.iconBtn}>
                    <vector_icons_1.Ionicons name="close" size={28} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.View style={[styles.statusBadge, isPaused && { backgroundColor: colors.warning + '20' }]}>
                    <react_native_1.View style={[styles.statusDot, isPaused && { backgroundColor: colors.warning }]}/>
                    <react_native_1.Text style={[styles.statusText, isPaused && { color: colors.warning }]}>
                        {isPaused
            ? (isTurkish ? 'Duraklatıldı' : 'Paused')
            : sensorSource
                ? (isTurkish ? 'Canlı Sensör Verisi' : 'Live Sensor Data')
                : (isTurkish ? 'Sensör Bağlantısı Bekleniyor' : 'Waiting for Sensor Connection')}
                    </react_native_1.Text>
                </react_native_1.View>
                <react_native_1.TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Spotify')}>
                    <vector_icons_1.Ionicons name="musical-notes" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.View style={styles.content}>
                <react_native_1.Text style={styles.workoutName}>{workoutName}</react_native_1.Text>
                <react_native_1.Text style={styles.timerLarge}>{formatTime(elapsedTime)}</react_native_1.Text>

                <react_native_1.View style={styles.metricsGrid}>
                    {/* Heart Rate Metric */}
                    <react_native_1.View style={styles.metricCard}>
                        <react_native_reanimated_1.default.View style={[styles.heartContainer, animatedHeartStyle]}>
                            <vector_icons_1.Ionicons name="heart" size={48} color={colors.error}/>
                        </react_native_reanimated_1.default.View>
                        <react_native_1.Text style={styles.metricValue}>{heartRate !== null && heartRate !== void 0 ? heartRate : '--'} <react_native_1.Text style={styles.metricUnit}>BPM</react_native_1.Text></react_native_1.Text>
                        <react_native_1.Text style={styles.metricLabel}>{isTurkish ? 'Nabız' : 'Heart Rate'}</react_native_1.Text>
                    </react_native_1.View>

                    {/* Calories Metric */}
                    <react_native_1.View style={styles.metricCard}>
                        <react_native_1.View style={styles.iconContainer}>
                            <vector_icons_1.Ionicons name="flame" size={32} color={colors.streak}/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.metricValue}>{calories} <react_native_1.Text style={styles.metricUnit}>kcal</react_native_1.Text></react_native_1.Text>
                        <react_native_1.Text style={styles.metricLabel}>{isTurkish ? 'Yakılan' : 'Burned'}</react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>
            </react_native_1.View>

            <react_native_1.View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                <react_native_1.TouchableOpacity style={[styles.playPauseBtn, isPaused && { backgroundColor: colors.success }]} onPress={() => setIsPaused(!isPaused)}>
                    <vector_icons_1.Ionicons name={isPaused ? "play" : "pause"} size={32} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>

                <AnimatedButton_1.default title={isTurkish ? 'İdmanı Bitir' : 'Finish Workout'} onPress={handleFinish} style={styles.finishBtn}/>
            </react_native_1.View>
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: theme_1.SPACING.md, paddingVertical: 6, borderRadius: theme_1.BORDER_RADIUS.pill },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
    statusText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.success }),
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme_1.SPACING.xl },
    workoutName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.textSecondary, marginBottom: theme_1.SPACING.sm }),
    timerLarge: { fontSize: 72, fontWeight: '800', color: colors.text, fontFamily: 'monospace', marginBottom: theme_1.SPACING.xxl },
    metricsGrid: { flexDirection: 'row', gap: theme_1.SPACING.lg, width: '100%', paddingHorizontal: theme_1.SPACING.md },
    metricCard: Object.assign({ flex: 1, backgroundColor: colors.surface, padding: theme_1.SPACING.lg, borderRadius: theme_1.BORDER_RADIUS.xl, alignItems: 'center' }, theme_1.SHADOWS.sm),
    heartContainer: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: theme_1.SPACING.sm },
    iconContainer: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: theme_1.SPACING.sm },
    metricValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text }),
    metricUnit: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary }),
    metricLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, marginTop: 4 }),
    controls: { paddingHorizontal: theme_1.SPACING.xl, gap: theme_1.SPACING.lg },
    playPauseBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.warning, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: theme_1.SPACING.md },
    finishBtn: { backgroundColor: colors.error }
});
