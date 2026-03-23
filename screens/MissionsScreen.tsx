import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Animated, RefreshControl, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionService, WeeklyMission, DailyMission } from '../services/missionService';
import { LeagueService } from '../services/leagueService';
import { useTranslation } from '../hooks/useTranslation';
import { useAlert } from '../components/CustomAlert';
import { COLORS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

const CATEGORY_META: Record<string, { icon: string; color: string; gradient: string[] }> = {
    workout: { icon: 'barbell', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF4757'] },
    nutrition: { icon: 'restaurant', color: '#58CC02', gradient: ['#58CC02', '#46A302'] },
    health: { icon: 'heart', color: '#1CB0F6', gradient: ['#1CB0F6', '#0099DD'] },
    social: { icon: 'people', color: '#CE82FF', gradient: ['#CE82FF', '#A855F7'] },
    streak: { icon: 'flame', color: '#FF9600', gradient: ['#FF9600', '#FF6B00'] },
    mindfulness: { icon: 'leaf', color: '#7C3AED', gradient: ['#7C3AED', '#6D28D9'] },
    hydration: { icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
    supplements: { icon: 'flask', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
};

const MissionsScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();

    const [tab, setTab] = useState<'daily' | 'weekly'>('weekly');
    const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
    const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [generatingNew, setGeneratingNew] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadMissions = useCallback(async () => {
        // Don't set loading true if refreshing, to show refresh control instead
        if (!refreshing) setLoading(true);
        try {
            const service = MissionService.getInstance();
            console.log('MissionsScreen: Fetching missions...');
            const [weekly, daily] = await Promise.all([
                service.getWeeklyMissions(),
                service.getDailyMissions(),
            ]);
            console.log(`MissionsScreen: Loaded ${weekly.length} weekly, ${daily.length} daily`);
            setWeeklyMissions(weekly);
            setDailyMissions(daily);
        } catch (err) {
            console.warn('Load missions error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
    }, [refreshing]);

    useEffect(() => { loadMissions(); }, []);

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

    const handleClaim = async (mission: WeeklyMission | DailyMission, type: 'weekly' | 'daily') => {
        if (!mission.isCompleted) return;
        try {
            const result = await MissionService.getInstance().claimMissionReward(mission.id, type);
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
        } catch { }
    };

    const renderMissionCard = (mission: WeeklyMission | DailyMission, index: number, type: 'weekly' | 'daily') => {
        const meta = CATEGORY_META[mission.category] || CATEGORY_META.workout;
        const progress = Math.min(mission.currentProgress / mission.targetValue, 1);
        const completed = mission.isCompleted;

        // Use safe fallback if titleTr is missing
        const title = isTurkish ? (mission.titleTr || mission.title) : mission.title;
        const description = isTurkish ? ((mission as any).descriptionTr || mission.description) : mission.description;

        return (
            <Animated.View key={mission.id || index} style={[st.missionCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <TouchableOpacity
                    activeOpacity={completed ? 0.7 : 1}
                    onPress={() => completed && handleClaim(mission, type)}
                    style={st.missionInner}
                >
                    {/* Category icon */}
                    <LinearGradient colors={meta.gradient as any} style={st.missionIconBg}>
                        <Ionicons name={meta.icon as any} size={20} color="#FFF" />
                    </LinearGradient>

                    {/* Content */}
                    <View style={st.missionContent}>
                        <View style={st.missionHeader}>
                            <Text style={[st.missionTitle, completed && st.missionTitleDone]} numberOfLines={2}>
                                {title}
                            </Text>
                            {completed && (
                                <View style={st.completedBadge}>
                                    <Ionicons name="checkmark-circle" size={18} color="#58CC02" />
                                </View>
                            )}
                        </View>

                        {description && (
                            <Text style={st.missionDesc} numberOfLines={1}>
                                {description}
                            </Text>
                        )}

                        {/* Progress bar */}
                        <View style={st.progressRow}>
                            <View style={st.progressOuter}>
                                <LinearGradient
                                    colors={completed ? ['#58CC02', '#89E219'] : [meta.color, meta.color + 'CC']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[st.progressInner, { width: `${progress * 100}%` }]}
                                />
                            </View>
                            <Text style={st.progressText}>{mission.currentProgress}/{mission.targetValue}</Text>
                        </View>

                        {/* Rewards */}
                        <View style={st.rewardRow}>
                            <View style={st.rewardBadge}>
                                <Ionicons name="flash" size={11} color="#FFC800" />
                                <Text style={st.rewardText}>{mission.xpReward} XP</Text>
                            </View>
                            <View style={[st.rewardBadge, { backgroundColor: '#F0EAFF' }]}>
                                <Ionicons name="diamond" size={11} color="#CE82FF" />
                                <Text style={[st.rewardText, { color: '#CE82FF' }]}>{mission.pointReward}</Text>
                            </View>
                            <View style={[st.categoryTag, { backgroundColor: meta.color + '15' }]}>
                                <Text style={[st.categoryText, { color: meta.color }]}>
                                    {mission.category.charAt(0).toUpperCase() + mission.category.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={[st.center, { paddingTop: insets.top + 60 }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={st.loadingText}>{isTurkish ? 'AI görevleri oluşturuyor...' : 'AI generating missions...'}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
            <AlertComponent />
            <ScrollView
                contentContainerStyle={[st.scroll, { paddingTop: 8 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Header */}
                <View style={st.headerRow}>
                    <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={st.headerTitle}>{isTurkish ? 'Görevler' : 'Missions'}</Text>
                        <Text style={st.headerSub}>
                            {isTurkish ? 'AI tarafından her hafta özel oluşturulur' : 'AI-generated personalized every week'}
                        </Text>
                    </View>
                </View>

                {/* Tab switcher */}
                <View style={st.tabRow}>
                    <TouchableOpacity
                        style={[st.tabBtn, tab === 'weekly' && st.tabBtnActive]}
                        onPress={() => setTab('weekly')}
                    >
                        <Ionicons name="calendar" size={16} color={tab === 'weekly' ? '#FFF' : '#6B7280'} />
                        <Text style={[st.tabText, tab === 'weekly' && st.tabTextActive]}>
                            {isTurkish ? 'Haftalık' : 'Weekly'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[st.tabBtn, tab === 'daily' && st.tabBtnActive]}
                        onPress={() => setTab('daily')}
                    >
                        <Ionicons name="today" size={16} color={tab === 'daily' ? '#FFF' : '#6B7280'} />
                        <Text style={[st.tabText, tab === 'daily' && st.tabTextActive]}>
                            {isTurkish ? 'Günlük' : 'Daily'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Summary card */}
                <LinearGradient
                    colors={tab === 'weekly' ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={st.summaryCard}
                >
                    <View style={st.summaryTop}>
                        <View>
                            <Text style={st.summaryLabel}>
                                {isTurkish
                                    ? (tab === 'weekly' ? 'Haftalık İlerleme' : 'Günlük İlerleme')
                                    : (tab === 'weekly' ? 'Weekly Progress' : 'Daily Progress')}
                            </Text>
                            <Text style={st.summaryPercent}>{Math.round(overallProgress * 100)}%</Text>
                        </View>
                        <View style={st.summaryCircle}>
                            <Text style={st.summaryCircleText}>{activeCompleted}/{activeMissions.length}</Text>
                            <Text style={st.summaryCircleSub}>{isTurkish ? 'Görev' : 'Tasks'}</Text>
                        </View>
                    </View>
                    {/* XP progress bar */}
                    <View style={st.summaryBarOuter}>
                        <View style={[st.summaryBarInner, { width: `${activeTotal > 0 ? (activeEarned / activeTotal) * 100 : 0}%` }]} />
                    </View>
                    <Text style={st.summaryXpText}>
                        {activeEarned} / {activeTotal} XP {isTurkish ? 'kazanıldı' : 'earned'}
                    </Text>
                </LinearGradient>

                {/* Week dates */}
                {tab === 'weekly' && weeklyMissions.length > 0 && (
                    <View style={st.weekDates}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                        <Text style={st.weekDateText}>
                            {weeklyMissions[0].weekStart} — {weeklyMissions[0].weekEnd}
                        </Text>
                    </View>
                )}

                {/* AI badge */}
                <View style={st.aiBadge}>
                    <LinearGradient colors={['#667eea', '#764ba2']} style={st.aiBadgeGrad}>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                        <Text style={st.aiBadgeText}>
                            {isTurkish
                                ? 'Bu görevler senin seviyene ve aktivitelerine göre AI tarafından oluşturuldu'
                                : 'These missions are AI-generated based on your level and activity'}
                        </Text>
                    </LinearGradient>
                </View>

                {/* Mission cards */}
                {activeMissions.length > 0 ? (
                    activeMissions.map((m, i) => renderMissionCard(m, i, tab))
                ) : (
                    <View style={st.emptyState}>
                        <Ionicons name="sparkles-outline" size={48} color={colors.textTertiary} />
                        <Text style={st.emptyTitle}>{isTurkish ? 'Görev bulunamadı' : 'No missions found'}</Text>
                        <Text style={st.emptyText}>
                            {isTurkish ? 'Sayfayı yenileyerek AI görev oluşturmasını tetikleyin' : 'Pull to refresh to trigger AI mission generation'}
                        </Text>
                    </View>
                )}

                {/* All completed celebration */}
                {activeMissions.length > 0 && activeCompleted === activeMissions.length && (
                    <View style={st.allDoneCard}>
                        <Ionicons name="trophy" size={48} color="#FFC800" />
                        <Text style={st.allDoneTitle}>
                            {isTurkish ? 'Tüm görevler tamamlandı!' : 'All missions completed!'}
                        </Text>
                        <Text style={st.allDoneSub}>
                            {isTurkish
                                ? `Toplam ${activeEarned} XP kazandın! Yeni görevler ${tab === 'weekly' ? 'Pazartesi' : 'yarın'} oluşturulacak.`
                                : `You earned ${activeEarned} XP total! New missions will be generated ${tab === 'weekly' ? 'on Monday' : 'tomorrow'}.`}
                        </Text>
                    </View>
                )}

                <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
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

export default MissionsScreen;
