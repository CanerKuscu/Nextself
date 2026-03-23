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
exports.default = ProgressReportScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useTranslation_1 = require("../hooks/useTranslation");
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const useProgressReport_1 = require("../hooks/useProgressReport");
let LineChart;
try {
    const ck = require('react-native-chart-kit');
    LineChart = ck.LineChart;
}
catch (_a) { }
function ProgressReportScreen({ navigation }) {
    var _a;
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { width: screenWidth } = (0, react_native_1.useWindowDimensions)();
    const [period, setPeriod] = (0, react_1.useState)('weekly');
    const { loading, refreshing, bodyMetrics, workoutSummary, nutritionSummary, goalProgress, onRefresh } = (0, useProgressReport_1.useProgressReport)(period, isTurkish);
    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        decimalPlaces: 1,
        color: () => colors.primary,
        labelColor: () => colors.textSecondary,
        propsForDots: { r: '3', strokeWidth: '2', stroke: colors.primary },
    };
    const shareReport = () => __awaiter(this, void 0, void 0, function* () {
        const latest = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1] : null;
        const reportText = [
            `📊 NextSelf ${isTurkish ? 'İlerleme Raporu' : 'Progress Report'}`,
            `📅 ${period === 'weekly' ? (isTurkish ? 'Haftalık' : 'Weekly') : period === 'monthly' ? (isTurkish ? 'Aylık' : 'Monthly') : (isTurkish ? 'Yıllık' : 'Yearly')}`,
            '',
            latest ? `⚖️ ${isTurkish ? 'Kilo' : 'Weight'}: ${latest.weight} kg` : '',
            (latest === null || latest === void 0 ? void 0 : latest.bodyFat) ? `🔥 ${isTurkish ? 'Yağ' : 'Fat'}: ${latest.bodyFat}%` : '',
            (latest === null || latest === void 0 ? void 0 : latest.muscleMass) ? `💪 ${isTurkish ? 'Kas' : 'Muscle'}: ${latest.muscleMass}%` : '',
            '',
            workoutSummary ? `🏋️ ${isTurkish ? 'Antrenman' : 'Workouts'}: ${workoutSummary.totalWorkouts}` : '',
            workoutSummary ? `🔥 ${isTurkish ? 'Yakılan Kalori' : 'Calories Burned'}: ${workoutSummary.caloriesBurned}` : '',
            nutritionSummary ? `🍽️ ${isTurkish ? 'Ort. Kalori' : 'Avg. Calories'}: ${nutritionSummary.avgCalories}` : '',
        ].filter(Boolean).join('\n');
        try {
            yield react_native_1.Share.share({ message: reportText, title: isTurkish ? 'İlerleme Raporum' : 'My Progress Report' });
        }
        catch (err) {
            console.warn('Share error:', err);
        }
    });
    const weightChartData = react_1.default.useMemo(() => {
        if (bodyMetrics.length < 2)
            return null;
        const recent = bodyMetrics.slice(-10);
        return {
            labels: recent.map(m => {
                const d = new Date(m.recordedAt);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [{ data: recent.map(m => m.weight), color: () => '#3498db', strokeWidth: 2 }],
        };
    }, [bodyMetrics]);
    const bodyFatChartData = react_1.default.useMemo(() => {
        const withFat = bodyMetrics.filter(m => m.bodyFat).slice(-10);
        if (withFat.length < 2)
            return null;
        return {
            labels: withFat.map(m => {
                const d = new Date(m.recordedAt);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [
                { data: withFat.map(m => m.bodyFat), color: () => '#e74c3c', strokeWidth: 2 },
                ...(withFat[0].muscleMass ? [{ data: withFat.map(m => m.muscleMass), color: () => '#2ecc71', strokeWidth: 2 }] : []),
            ],
            legend: withFat[0].muscleMass
                ? [isTurkish ? 'Yağ %' : 'Fat %', isTurkish ? 'Kas %' : 'Muscle %']
                : [isTurkish ? 'Yağ %' : 'Fat %'],
        };
    }, [bodyMetrics, isTurkish]);
    const weightChange = bodyMetrics.length >= 2
        ? Math.round((bodyMetrics[bodyMetrics.length - 1].weight - bodyMetrics[0].weight) * 10) / 10
        : null;
    // ─── Render ─────────────────────────────────────────────────────
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.text + '15' }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={[styles.backBtn, { backgroundColor: colors.text + '10' }]}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isTurkish ? 'İlerleme Raporu' : 'Progress Report'}
                </react_native_1.Text>
                <react_native_1.TouchableOpacity onPress={shareReport} style={[styles.shareBtn, { backgroundColor: colors.primarySoft }]}>
                    <vector_icons_1.Ionicons name="share-outline" size={20} color={colors.primary}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {/* Period Tabs */}
            <react_native_1.View style={[styles.periodContainer, { backgroundColor: colors.text + '08' }]}>
                {['weekly', 'monthly', 'yearly'].map(p => (<react_native_1.TouchableOpacity key={p} style={[styles.periodTab, period === p && styles.periodTabActive]} onPress={() => setPeriod(p)}>
                        <react_native_1.Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                            {p === 'weekly' ? (isTurkish ? 'Haftalık' : 'Weekly')
                : p === 'monthly' ? (isTurkish ? 'Aylık' : 'Monthly')
                    : (isTurkish ? 'Yıllık' : 'Yearly')}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>))}
            </react_native_1.View>

            {loading ? (<react_native_1.ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }}/>) : (<react_native_1.ScrollView contentContainerStyle={styles.content} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
                    {/* Quick Stats */}
                    <react_native_1.View style={styles.quickStats}>
                        {[
                {
                    label: isTurkish ? 'Ölçüm' : 'Measurements',
                    value: bodyMetrics.length.toString(),
                    icon: 'analytics-outline',
                    color: '#3498db',
                },
                {
                    label: isTurkish ? 'Antrenman' : 'Workouts',
                    value: ((_a = workoutSummary === null || workoutSummary === void 0 ? void 0 : workoutSummary.totalWorkouts) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                    icon: 'barbell-outline',
                    color: '#9b59b6',
                },
                {
                    label: isTurkish ? 'Kilo Değ.' : 'Weight Δ',
                    value: weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '-',
                    icon: 'trending-down-outline',
                    color: weightChange && weightChange < 0 ? '#2ecc71' : '#e74c3c',
                },
            ].map((stat, idx) => (<AnimatedCard_1.default key={idx} style={Object.assign(Object.assign({}, styles.statCard), { backgroundColor: stat.color + '12' })}>
                                <vector_icons_1.Ionicons name={stat.icon} size={22} color={stat.color}/>
                                <react_native_1.Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</react_native_1.Text>
                                <react_native_1.Text style={styles.statLabel}>{stat.label}</react_native_1.Text>
                            </AnimatedCard_1.default>))}
                    </react_native_1.View>

                    {/* Weight Trend Chart */}
                    {LineChart && weightChartData && (<AnimatedCard_1.default style={styles.chartCard}>
                            <react_native_1.View style={styles.chartHeader}>
                                <vector_icons_1.Ionicons name="scale-outline" size={20} color="#3498db"/>
                                <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Kilo Trendi' : 'Weight Trend'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            <LineChart data={weightChartData} width={screenWidth - 64} height={180} chartConfig={Object.assign(Object.assign({}, chartConfig), { color: () => '#3498db' })} bezier style={{ borderRadius: theme_1.BORDER_RADIUS.lg }}/>
                        </AnimatedCard_1.default>)}

                    {/* Body Composition Chart */}
                    {LineChart && bodyFatChartData && (<AnimatedCard_1.default style={styles.chartCard}>
                            <react_native_1.View style={styles.chartHeader}>
                                <vector_icons_1.Ionicons name="body-outline" size={20} color="#e74c3c"/>
                                <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Vücut Kompozisyonu' : 'Body Composition'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            <LineChart data={bodyFatChartData} width={screenWidth - 64} height={180} chartConfig={chartConfig} bezier style={{ borderRadius: theme_1.BORDER_RADIUS.lg }}/>
                        </AnimatedCard_1.default>)}

                    {/* Workout Summary */}
                    {workoutSummary && workoutSummary.totalWorkouts > 0 && (<AnimatedCard_1.default style={styles.summaryCard}>
                            <react_native_1.View style={styles.chartHeader}>
                                <vector_icons_1.Ionicons name="barbell-outline" size={20} color="#9b59b6"/>
                                <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Antrenman Özeti' : 'Workout Summary'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.summaryGrid}>
                                <react_native_1.View style={styles.summaryItem}>
                                    <react_native_1.Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.totalWorkouts}</react_native_1.Text>
                                    <react_native_1.Text style={styles.summaryLabel}>{isTurkish ? 'Antrenman' : 'Workouts'}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.summaryDivider}/>
                                <react_native_1.View style={styles.summaryItem}>
                                    <react_native_1.Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.avgDuration} min</react_native_1.Text>
                                    <react_native_1.Text style={styles.summaryLabel}>{isTurkish ? 'Ort. Süre' : 'Avg. Duration'}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.summaryDivider}/>
                                <react_native_1.View style={styles.summaryItem}>
                                    <react_native_1.Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.caloriesBurned}</react_native_1.Text>
                                    <react_native_1.Text style={styles.summaryLabel}>{isTurkish ? 'Kalori' : 'Calories'}</react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>
                        </AnimatedCard_1.default>)}

                    {/* Nutrition Summary */}
                    {nutritionSummary && (<AnimatedCard_1.default style={styles.summaryCard}>
                            <react_native_1.View style={styles.chartHeader}>
                                <vector_icons_1.Ionicons name="nutrition-outline" size={20} color="#f39c12"/>
                                <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Beslenme Özeti' : 'Nutrition Summary'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.macroRow}>
                                {[
                    { label: isTurkish ? 'Kalori' : 'Calories', val: nutritionSummary.avgCalories, unit: 'kcal', color: '#f39c12' },
                    { label: isTurkish ? 'Protein' : 'Protein', val: nutritionSummary.avgProtein, unit: 'g', color: '#e74c3c' },
                    { label: isTurkish ? 'Karb' : 'Carbs', val: nutritionSummary.avgCarbs, unit: 'g', color: '#3498db' },
                    { label: isTurkish ? 'Yağ' : 'Fat', val: nutritionSummary.avgFat, unit: 'g', color: '#f1c40f' },
                ].map((macro, idx) => (<react_native_1.View key={idx} style={[styles.macroItem, { backgroundColor: macro.color + '12' }]}>
                                        <react_native_1.Text style={[styles.macroValue, { color: macro.color }]}>{macro.val}</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroUnit}>{macro.unit}</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{macro.label}</react_native_1.Text>
                                    </react_native_1.View>))}
                            </react_native_1.View>
                            {/* Adherence Bar */}
                            <react_native_1.View style={styles.adherenceContainer}>
                                <react_native_1.Text style={styles.adherenceLabel}>
                                    {isTurkish ? 'Kayıt Tutma Oranı' : 'Logging Adherence'}
                                </react_native_1.Text>
                                <react_native_1.View style={styles.adherenceBarBg}>
                                    <react_native_1.View style={[styles.adherenceBar, { width: `${nutritionSummary.adherenceRate}%` }]}/>
                                </react_native_1.View>
                                <react_native_1.Text style={[styles.adherenceValue, { color: colors.text }]}>
                                    {nutritionSummary.adherenceRate}%
                                </react_native_1.Text>
                            </react_native_1.View>
                        </AnimatedCard_1.default>)}

                    {/* Goal Progress */}
                    {goalProgress.length > 0 && (<AnimatedCard_1.default style={styles.summaryCard}>
                            <react_native_1.View style={styles.chartHeader}>
                                <vector_icons_1.Ionicons name="flag-outline" size={20} color="#2ecc71"/>
                                <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Hedef İlerlemesi' : 'Goal Progress'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            {goalProgress.map((goal, idx) => {
                    const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                    return (<react_native_1.View key={idx} style={styles.goalItem}>
                                        <react_native_1.View style={styles.goalHeader}>
                                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <vector_icons_1.Ionicons name={goal.icon} size={18} color={goal.color}/>
                                                <react_native_1.Text style={[styles.goalLabel, { color: colors.text }]}>{goal.label}</react_native_1.Text>
                                            </react_native_1.View>
                                            <react_native_1.Text style={styles.goalValues}>
                                                {goal.current}{goal.unit} / {goal.target}{goal.unit}
                                            </react_native_1.Text>
                                        </react_native_1.View>
                                        <react_native_1.View style={styles.goalBarBg}>
                                            <react_native_1.View style={[styles.goalBar, { width: `${progress}%`, backgroundColor: goal.color }]}/>
                                        </react_native_1.View>
                                    </react_native_1.View>);
                })}
                        </AnimatedCard_1.default>)}

                    {/* Empty State */}
                    {bodyMetrics.length === 0 && !workoutSummary && (<react_native_1.View style={styles.emptyState}>
                            <vector_icons_1.Ionicons name="stats-chart-outline" size={64} color={colors.textSecondary}/>
                            <react_native_1.Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {isTurkish ? 'Henüz veri yok' : 'No data yet'}
                            </react_native_1.Text>
                            <react_native_1.Text style={styles.emptySub}>
                                {isTurkish
                    ? 'Antrenman yapın, tartılın ve beslenmenizi kaydedin'
                    : 'Log workouts, weigh yourself, and track nutrition'}
                            </react_native_1.Text>
                        </react_native_1.View>)}
                </react_native_1.ScrollView>)}
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.md, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    shareBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    content: { padding: theme_1.SPACING.lg, paddingBottom: 100 },
    periodContainer: { flexDirection: 'row', marginHorizontal: theme_1.SPACING.lg, marginTop: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.pill, padding: 4 },
    periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: theme_1.BORDER_RADIUS.pill },
    periodTabActive: Object.assign({ backgroundColor: colors.primary }, theme_1.SHADOWS.sm),
    periodText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textSecondary }),
    periodTextActive: { color: '#fff' },
    quickStats: { flexDirection: 'row', gap: 8, marginBottom: theme_1.SPACING.md },
    statCard: { flex: 1, alignItems: 'center', padding: theme_1.SPACING.md, gap: 6 },
    statValue: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    statLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    chartCard: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme_1.SPACING.md },
    chartTitle: Object.assign({}, theme_1.TYPOGRAPHY.bodyBold),
    summaryCard: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryValue: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    summaryLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 4 }),
    summaryDivider: { width: 1, height: 40, backgroundColor: colors.borderLight },
    macroRow: { flexDirection: 'row', gap: 8, marginBottom: theme_1.SPACING.md },
    macroItem: { flex: 1, alignItems: 'center', paddingVertical: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.md },
    macroValue: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    macroUnit: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    macroLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    adherenceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    adherenceLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, flex: 0.3 }),
    adherenceBarBg: { flex: 1, height: 8, backgroundColor: colors.borderLight, borderRadius: 4, overflow: 'hidden' },
    adherenceBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    adherenceValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { width: 40, textAlign: 'right' }),
    goalItem: { marginBottom: theme_1.SPACING.md },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    goalLabel: Object.assign({}, theme_1.TYPOGRAPHY.bodyBold),
    goalValues: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    goalBarBg: { height: 10, backgroundColor: colors.borderLight, borderRadius: 5, overflow: 'hidden' },
    goalBar: { height: '100%', borderRadius: 5 },
    emptyState: { alignItems: 'center', paddingVertical: theme_1.SPACING.xxl },
    emptyTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { marginTop: theme_1.SPACING.md }),
    emptySub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }),
});
