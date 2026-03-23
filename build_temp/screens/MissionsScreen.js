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
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const missionService_1 = require("../services/missionService");
const useTranslation_1 = require("../hooks/useTranslation");
const CustomAlert_1 = require("../components/CustomAlert");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const CATEGORY_META = {
    workout: { icon: 'barbell', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF4757'] },
    nutrition: { icon: 'restaurant', color: '#58CC02', gradient: ['#58CC02', '#46A302'] },
    health: { icon: 'heart', color: '#1CB0F6', gradient: ['#1CB0F6', '#0099DD'] },
    social: { icon: 'people', color: '#CE82FF', gradient: ['#CE82FF', '#A855F7'] },
    streak: { icon: 'flame', color: '#FF9600', gradient: ['#FF9600', '#FF6B00'] },
    mindfulness: { icon: 'leaf', color: '#7C3AED', gradient: ['#7C3AED', '#6D28D9'] },
    hydration: { icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
    supplements: { icon: 'flask', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
};
const MissionsScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const st = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const [tab, setTab] = (0, react_1.useState)('weekly');
    const [weeklyMissions, setWeeklyMissions] = (0, react_1.useState)([]);
    const [dailyMissions, setDailyMissions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [generatingNew, setGeneratingNew] = (0, react_1.useState)(false);
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const loadMissions = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Don't set loading true if refreshing, to show refresh control instead
        if (!refreshing)
            setLoading(true);
        try {
            const service = missionService_1.MissionService.getInstance();
            console.log('MissionsScreen: Fetching missions...');
            const [weekly, daily] = yield Promise.all([
                service.getWeeklyMissions(),
                service.getDailyMissions(),
            ]);
            console.log(`MissionsScreen: Loaded ${weekly.length} weekly, ${daily.length} daily`);
            setWeeklyMissions(weekly);
            setDailyMissions(daily);
        }
        catch (err) {
            console.warn('Load missions error:', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
    }), [refreshing]);
    (0, react_1.useEffect)(() => { loadMissions(); }, []);
    const onRefresh = () => { setRefreshing(true); loadMissions(); };
    // Calculate totals
    const weeklyTotal = weeklyMissions.reduce((s, m) => s + m.xpReward, 0);
    const weeklyEarned = weeklyMissions.filter(m => m.isCompleted).reduce((s, m) => s + m.xpReward, 0);
    const weeklyCompleted = weeklyMissions.filter(m => m.isCompleted).length;
    const dailyTotal = dailyMissions.reduce((s, m) => s + m.xpReward, 0);
    const dailyEarned = dailyMissions.filter(m => m.isCompleted).reduce((s, m) => s + m.xpReward, 0);
    const dailyCompleted = dailyMissions.filter(m => m.isCompleted).length;
    const activeMissions = tab === 'weekly' ? weeklyMissions : dailyMissions;
    const activeCompleted = tab === 'weekly' ? weeklyCompleted : dailyCompleted;
    const activeTotal = tab === 'weekly' ? weeklyTotal : dailyTotal;
    const activeEarned = tab === 'weekly' ? weeklyEarned : dailyEarned;
    const overallProgress = activeMissions.length > 0
        ? activeMissions.reduce((s, m) => s + Math.min(m.currentProgress / m.targetValue, 1), 0) / activeMissions.length
        : 0;
    const handleClaim = (mission, type) => __awaiter(void 0, void 0, void 0, function* () {
        if (!mission.isCompleted)
            return;
        try {
            const result = yield missionService_1.MissionService.getInstance().claimMissionReward(mission.id, type);
            if (result.xp > 0) {
                showAlert({
                    type: 'success',
                    title: isTurkish ? 'Ödül Toplandı!' : 'Reward Claimed!',
                    message: isTurkish
                        ? `+${result.xp} XP ve +${result.points} puan kazandın!`
                        : `You earned +${result.xp} XP and +${result.points} points!`,
                    buttons: [{ text: 'OK' }],
                });
            }
        }
        catch (_a) { }
    });
    const renderMissionCard = (mission, index, type) => {
        const meta = CATEGORY_META[mission.category] || CATEGORY_META.workout;
        const progress = Math.min(mission.currentProgress / mission.targetValue, 1);
        const completed = mission.isCompleted;
        // Use safe fallback if titleTr is missing
        const title = isTurkish ? (mission.titleTr || mission.title) : mission.title;
        const description = isTurkish ? (mission.descriptionTr || mission.description) : mission.description;
        return (<react_native_1.Animated.View key={mission.id || index} style={[st.missionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <react_native_1.TouchableOpacity activeOpacity={completed ? 0.7 : 1} onPress={() => completed && handleClaim(mission, type)} style={st.missionInner}>
                    {/* Category icon */}
                    <expo_linear_gradient_1.LinearGradient colors={meta.gradient} style={st.missionIconBg}>
                        <vector_icons_1.Ionicons name={meta.icon} size={20} color="#FFF"/>
                    </expo_linear_gradient_1.LinearGradient>

                    {/* Content */}
                    <react_native_1.View style={st.missionContent}>
                        <react_native_1.View style={st.missionHeader}>
                            <react_native_1.Text style={[st.missionTitle, completed && st.missionTitleDone]} numberOfLines={2}>
                                {title}
                            </react_native_1.Text>
                            {completed && (<react_native_1.View style={st.completedBadge}>
                                    <vector_icons_1.Ionicons name="checkmark-circle" size={18} color="#58CC02"/>
                                </react_native_1.View>)}
                        </react_native_1.View>

                        {description && (<react_native_1.Text style={st.missionDesc} numberOfLines={1}>
                                {description}
                            </react_native_1.Text>)}

                        {/* Progress bar */}
                        <react_native_1.View style={st.progressRow}>
                            <react_native_1.View style={st.progressOuter}>
                                <expo_linear_gradient_1.LinearGradient colors={completed ? ['#58CC02', '#89E219'] : [meta.color, meta.color + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.progressInner, { width: `${progress * 100}%` }]}/>
                            </react_native_1.View>
                            <react_native_1.Text style={st.progressText}>{mission.currentProgress}/{mission.targetValue}</react_native_1.Text>
                        </react_native_1.View>

                        {/* Rewards */}
                        <react_native_1.View style={st.rewardRow}>
                            <react_native_1.View style={st.rewardBadge}>
                                <vector_icons_1.Ionicons name="flash" size={11} color="#FFC800"/>
                                <react_native_1.Text style={st.rewardText}>{mission.xpReward} XP</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={[st.rewardBadge, { backgroundColor: '#F0EAFF' }]}>
                                <vector_icons_1.Ionicons name="diamond" size={11} color="#CE82FF"/>
                                <react_native_1.Text style={[st.rewardText, { color: '#CE82FF' }]}>{mission.pointReward}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={[st.categoryTag, { backgroundColor: meta.color + '15' }]}>
                                <react_native_1.Text style={[st.categoryText, { color: meta.color }]}>
                                    {mission.category.charAt(0).toUpperCase() + mission.category.slice(1)}
                                </react_native_1.Text>
                            </react_native_1.View>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.TouchableOpacity>
            </react_native_1.Animated.View>);
    };
    if (loading && !refreshing) {
        return (<react_native_1.View style={[st.center, { paddingTop: insets.top + 60 }]}>
                <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                <react_native_1.Text style={st.loadingText}>{isTurkish ? 'AI görevleri oluşturuyor...' : 'AI generating missions...'}</react_native_1.Text>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
            <AlertComponent />
            <react_native_1.ScrollView contentContainerStyle={[st.scroll, { paddingTop: 8 }]} showsVerticalScrollIndicator={false} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/>}>
                {/* Header */}
                <react_native_1.View style={st.headerRow}>
                    <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')} style={st.backBtn}>
                        <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.View style={{ flex: 1 }}>
                        <react_native_1.Text style={st.headerTitle}>{isTurkish ? 'Görevler' : 'Missions'}</react_native_1.Text>
                        <react_native_1.Text style={st.headerSub}>
                            {isTurkish ? 'AI tarafından her hafta özel oluşturulur' : 'AI-generated personalized every week'}
                        </react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>

                {/* Tab switcher */}
                <react_native_1.View style={st.tabRow}>
                    <react_native_1.TouchableOpacity style={[st.tabBtn, tab === 'weekly' && st.tabBtnActive]} onPress={() => setTab('weekly')}>
                        <vector_icons_1.Ionicons name="calendar" size={16} color={tab === 'weekly' ? '#FFF' : '#6B7280'}/>
                        <react_native_1.Text style={[st.tabText, tab === 'weekly' && st.tabTextActive]}>
                            {isTurkish ? 'Haftalık' : 'Weekly'}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={[st.tabBtn, tab === 'daily' && st.tabBtnActive]} onPress={() => setTab('daily')}>
                        <vector_icons_1.Ionicons name="today" size={16} color={tab === 'daily' ? '#FFF' : '#6B7280'}/>
                        <react_native_1.Text style={[st.tabText, tab === 'daily' && st.tabTextActive]}>
                            {isTurkish ? 'Günlük' : 'Daily'}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>

                {/* Summary card */}
                <expo_linear_gradient_1.LinearGradient colors={tab === 'weekly' ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.summaryCard}>
                    <react_native_1.View style={st.summaryTop}>
                        <react_native_1.View>
                            <react_native_1.Text style={st.summaryLabel}>
                                {isTurkish
            ? (tab === 'weekly' ? 'Haftalık İlerleme' : 'Günlük İlerleme')
            : (tab === 'weekly' ? 'Weekly Progress' : 'Daily Progress')}
                            </react_native_1.Text>
                            <react_native_1.Text style={st.summaryPercent}>{Math.round(overallProgress * 100)}%</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={st.summaryCircle}>
                            <react_native_1.Text style={st.summaryCircleText}>{activeCompleted}/{activeMissions.length}</react_native_1.Text>
                            <react_native_1.Text style={st.summaryCircleSub}>{isTurkish ? 'Görev' : 'Tasks'}</react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>
                    {/* XP progress bar */}
                    <react_native_1.View style={st.summaryBarOuter}>
                        <react_native_1.View style={[st.summaryBarInner, { width: `${activeTotal > 0 ? (activeEarned / activeTotal) * 100 : 0}%` }]}/>
                    </react_native_1.View>
                    <react_native_1.Text style={st.summaryXpText}>
                        {activeEarned} / {activeTotal} XP {isTurkish ? 'kazanıldı' : 'earned'}
                    </react_native_1.Text>
                </expo_linear_gradient_1.LinearGradient>

                {/* Week dates */}
                {tab === 'weekly' && weeklyMissions.length > 0 && (<react_native_1.View style={st.weekDates}>
                        <vector_icons_1.Ionicons name="calendar-outline" size={14} color={colors.textTertiary}/>
                        <react_native_1.Text style={st.weekDateText}>
                            {weeklyMissions[0].weekStart} — {weeklyMissions[0].weekEnd}
                        </react_native_1.Text>
                    </react_native_1.View>)}

                {/* AI badge */}
                <react_native_1.View style={st.aiBadge}>
                    <expo_linear_gradient_1.LinearGradient colors={['#667eea', '#764ba2']} style={st.aiBadgeGrad}>
                        <vector_icons_1.Ionicons name="sparkles" size={14} color="#FFF"/>
                        <react_native_1.Text style={st.aiBadgeText}>
                            {isTurkish
            ? 'Bu görevler senin seviyene ve aktivitelerine göre AI tarafından oluşturuldu'
            : 'These missions are AI-generated based on your level and activity'}
                        </react_native_1.Text>
                    </expo_linear_gradient_1.LinearGradient>
                </react_native_1.View>

                {/* Mission cards */}
                {activeMissions.length > 0 ? (activeMissions.map((m, i) => renderMissionCard(m, i, tab))) : (<react_native_1.View style={st.emptyState}>
                        <vector_icons_1.Ionicons name="sparkles-outline" size={48} color={colors.textTertiary}/>
                        <react_native_1.Text style={st.emptyTitle}>{isTurkish ? 'Görev bulunamadı' : 'No missions found'}</react_native_1.Text>
                        <react_native_1.Text style={st.emptyText}>
                            {isTurkish ? 'Sayfayı yenileyerek AI görev oluşturmasını tetikleyin' : 'Pull to refresh to trigger AI mission generation'}
                        </react_native_1.Text>
                    </react_native_1.View>)}

                {/* All completed celebration */}
                {activeMissions.length > 0 && activeCompleted === activeMissions.length && (<react_native_1.View style={st.allDoneCard}>
                        <vector_icons_1.Ionicons name="trophy" size={48} color="#FFC800"/>
                        <react_native_1.Text style={st.allDoneTitle}>
                            {isTurkish ? 'Tüm görevler tamamlandı!' : 'All missions completed!'}
                        </react_native_1.Text>
                        <react_native_1.Text style={st.allDoneSub}>
                            {isTurkish
                ? `Toplam ${activeEarned} XP kazandın! Yeni görevler ${tab === 'weekly' ? 'Pazartesi' : 'yarın'} oluşturulacak.`
                : `You earned ${activeEarned} XP total! New missions will be generated ${tab === 'weekly' ? 'on Monday' : 'tomorrow'}.`}
                        </react_native_1.Text>
                    </react_native_1.View>)}

                <react_native_1.View style={{ height: insets.bottom + 40 }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    loadingText: { marginTop: 16, fontSize: 15, color: '#6B7280', fontWeight: '600' },
    scroll: { paddingHorizontal: 20 },
    // Header
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: colors.textTertiary, fontWeight: '500', marginTop: 2 },
    // Tabs
    tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tabBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 16, backgroundColor: '#F5F5F5',
    },
    tabBtnActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    tabTextActive: { color: colors.background },
    // Summary card
    summaryCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    summaryPercent: { fontSize: 42, fontWeight: '900', color: '#FFF', marginTop: 4 },
    summaryCircle: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    summaryCircleText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    summaryCircleSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    summaryBarOuter: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
    summaryBarInner: { height: 8, borderRadius: 4, backgroundColor: '#FFF' },
    summaryXpText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 8, textAlign: 'center' },
    // Week dates
    weekDates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    weekDateText: { fontSize: 12, color: colors.textTertiary, fontWeight: '600' },
    // AI badge
    aiBadge: { marginBottom: 18 },
    aiBadgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
    aiBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '500', flex: 1 },
    // Mission card
    missionCard: { marginBottom: 12 },
    missionInner: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: colors.surface, borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    missionIconBg: {
        width: 44, height: 44, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    missionContent: { flex: 1 },
    missionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    missionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
    missionTitleDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
    completedBadge: { marginTop: 1 },
    missionDesc: { fontSize: 11, color: colors.textTertiary, fontWeight: '500', marginTop: 4, marginBottom: 8 },
    // Progress
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 8 },
    progressOuter: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E5E5EA', overflow: 'hidden' },
    progressInner: { height: 6, borderRadius: 3 },
    progressText: { fontSize: 11, fontWeight: '700', color: '#6B7280', minWidth: 30 },
    // Rewards
    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    rewardBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: '#FFF8E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    rewardText: { fontSize: 11, fontWeight: '700', color: '#FF9600' },
    categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    categoryText: { fontSize: 10, fontWeight: '700' },
    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
    emptyText: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    // All done
    allDoneCard: {
        alignItems: 'center', backgroundColor: '#E8FFE0', borderRadius: 24,
        padding: 28, marginTop: 8, borderWidth: 1, borderColor: '#C5F0A5',
    },
    allDoneEmoji: { fontSize: 48 },
    allDoneTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
    allDoneSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
exports.default = MissionsScreen;
