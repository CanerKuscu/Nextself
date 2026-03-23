import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from '../hooks/useTranslation';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { SupabaseService } from '@nextself/shared';

interface LeaderboardUser {
    id: string; name: string; points: number; avatar?: string;
    rank: number; trend: 'up' | 'down' | 'same'; isMe: boolean; streak: number;
}

const LEAGUES = [
    { id: 1, name: 'Çaylak', nameEn: 'Rookie', color: '#888888', icon: 'walk' },
    { id: 2, name: 'Kararlı', nameEn: 'Committed', color: '#6ab04c', icon: 'bicycle' },
    { id: 3, name: 'Aktif', nameEn: 'Active', color: '#3498db', icon: 'fitness' },
    { id: 4, name: 'Direnç', nameEn: 'Endurance', color: '#e67e22', icon: 'heart' },
    { id: 5, name: 'Atlet', nameEn: 'Athlete', color: '#e74c3c', icon: 'flash' },
    { id: 6, name: 'Savaşçı', nameEn: 'Warrior', color: '#9b59b6', icon: 'body' },
    { id: 7, name: 'Elit', nameEn: 'Elite', color: '#34495e', icon: 'star' },
    { id: 8, name: 'Titan', nameEn: 'Titan', color: '#f1c40f', icon: 'bonfire' },
    { id: 9, name: 'Efsane', nameEn: 'Legend', color: '#e84393', icon: 'flame' },
    { id: 10, name: 'Ölümsüz', nameEn: 'Immortal', color: '#00cec9', icon: 'trophy' }
];

// Leaderboard data from Supabase league_group_members, profiles, user_leagues tables
const useLeaderboard = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const supabase = SupabaseService.getInstance();

                // Get current user's ID for isMe flag
                const { user: currentUser } = await supabase.getCurrentUser();
                const currentUserId = currentUser?.id;

                // Fetch leaderboard data from league_group_members joined with profiles and user_leagues
                const { data, error: queryError } = await supabase.getClient()
                    .from('league_group_members')
                    .select(`
                        user_id,
                        weekly_xp,
                        rank,
                        zone,
                        profiles!inner(id, full_name, avatar_url),
                        user_leagues!inner(total_xp)
                    `)
                    .order('rank', { ascending: true })
                    .limit(30);

                if (queryError) {
                    console.error('Leaderboard fetch error:', queryError);
                    setError(queryError.message);
                    setLeaderboardData([]);
                    return;
                }

                if (data && data.length > 0) {
                    // Map database results to LeaderboardUser interface
                    const mappedData: LeaderboardUser[] = data.map((item: any, index: number) => ({
                        id: item.user_id,
                        name: item.profiles?.full_name || 'Anonymous',
                        points: item.weekly_xp || 0,
                        avatar: item.profiles?.avatar_url,
                        rank: item.rank || index + 1,
                        trend: item.zone === 'promotion' ? 'up' : item.zone === 'demotion' ? 'down' : 'same',
                        isMe: item.user_id === currentUserId,
                        streak: 0, // Streak data can be added if available
                    }));
                    setLeaderboardData(mappedData);
                } else {
                    // Fallback: Fetch from user_leagues if no group data
                    const { data: userLeaguesData, error: userLeaguesError } = await supabase.getClient()
                        .from('user_leagues')
                        .select(`
                            user_id,
                            weekly_xp,
                            total_xp,
                            profiles!inner(id, full_name, avatar_url)
                        `)
                        .order('weekly_xp', { ascending: false })
                        .limit(30);

                    if (userLeaguesError) {
                        console.error('User leagues fetch error:', userLeaguesError);
                        setLeaderboardData([]);
                        return;
                    }

                    if (userLeaguesData && userLeaguesData.length > 0) {
                        const mappedData: LeaderboardUser[] = userLeaguesData.map((item: any, index: number) => ({
                            id: item.user_id,
                            name: item.profiles?.full_name || 'Anonymous',
                            points: item.weekly_xp || 0,
                            avatar: item.profiles?.avatar_url,
                            rank: index + 1,
                            trend: index < 7 ? 'up' : index >= 25 ? 'down' : 'same',
                            isMe: item.user_id === currentUserId,
                            streak: 0,
                        }));
                        setLeaderboardData(mappedData);
                    } else {
                        setLeaderboardData([]);
                    }
                }
            } catch (err: any) {
                console.error('Leaderboard fetch exception:', err);
                setError(err.message);
                setLeaderboardData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        // Set up realtime subscription for leaderboard updates
        const supabase = SupabaseService.getInstance();
        const channel = supabase.getClient()
            .channel('leaderboard_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'league_group_members' },
                () => {
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    return { leaderboardData, loading, error } as { leaderboardData: LeaderboardUser[]; loading: boolean; error: string | null };
};

export default function CommunityScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends' | 'missions' | 'store'>('leaderboard');
    const [currentLeagueId] = useState(3);
    const currentLeague = LEAGUES.find(l => l.id === currentLeagueId) || LEAGUES[2];

    // Fetch real leaderboard data from API
    const { leaderboardData, loading: leaderboardLoading } = useLeaderboard();

    // Memoize leaderboard data processing to prevent unnecessary re-renders
    const processedLeaderboardData = useMemo(() => {
        return leaderboardData.map((item: LeaderboardUser, index: number) => ({
            ...item,
            // Ensure stable references for FlatList optimization
            key: `${item.id}-${index}`,
        }));
    }, [leaderboardData]);

    const getZoneColor = useCallback((rank: number) => {
        if (rank <= 7) return '#58CC02'; if (rank >= 25) return '#FF4B4B'; return 'transparent';
    }, []);

    const tabs = [
        { id: 'leaderboard' as const, label: t('league'), icon: 'trophy' },
        { id: 'missions' as const, label: t('ai_missions'), icon: 'flag' },
        { id: 'store' as const, label: t('store'), icon: 'cart' },
        { id: 'friends' as const, label: t('friends'), icon: 'people' },
    ];

    const missions = [
        { icon: 'footsteps', title: isTurkish ? '10.000 Adım At' : '10K Steps', pts: 50, color: '#58CC02', progress: 0.6 },
        { icon: 'water', title: isTurkish ? '2 Litre Su İç' : 'Drink 2L Water', pts: 20, color: '#1CB0F6', progress: 0.4 },
        { icon: 'body', title: isTurkish ? '15 Dk Esneklik' : '15 Min Mobility', pts: 30, color: '#CE82FF', progress: 0 },
    ];

    const storeItems = [
        { emoji: 'flame', title: t('streak_freeze'), desc: t('streak_freeze_desc'), price: 200, color: '#FF6B6B' },
        { emoji: 'shirt', title: t('premium_avatar'), desc: t('premium_avatar_desc'), price: 5000, color: '#1CB0F6' },
        { emoji: 'flash', title: t('double_points'), desc: t('double_points_desc'), price: 1200, color: '#FF9600' },
    ];

    const renderUser = useCallback(({ item }: { item: LeaderboardUser }) => {
        const zoneColor = getZoneColor(item.rank);
        return (
            <View style={[styles.userCard, item.isMe && styles.userCardMe, zoneColor !== 'transparent' && { borderLeftWidth: 3, borderLeftColor: zoneColor }]}>
                <Text style={[styles.rankNum, item.isMe && { color: colors.background }]}>{item.rank}</Text>
                <View style={[styles.userAvatar, item.isMe && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="person" size={18} color={item.isMe ? colors.background : '#58CC02'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, item.isMe && { color: colors.background }]}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Text style={[styles.userPts, item.isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                            {item.points.toLocaleString()} {isTurkish ? 'Puan' : 'Pts'}
                        </Text>
                        <Ionicons name="flame" size={12} color="#FF9600" />
                        <Text style={[styles.userStreak, item.isMe && { color: 'rgba(255,255,255,0.7)' }]}>{item.streak}</Text>
                    </View>
                </View>
                <Ionicons
                    name={item.trend === 'up' ? "trending-up" : item.trend === 'down' ? "trending-down" : "remove"}
                    size={20}
                    color={item.isMe ? colors.background : item.trend === 'up' ? '#58CC02' : item.trend === 'down' ? '#FF4B4B' : colors.textTertiary}
                />
            </View>
        );
    }, [styles, colors, isTurkish, getZoneColor]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* ─── HEADER ─── */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerTitle}>{t('community')}</Text>
                <Text style={styles.headerSub}>{t('compete_friends')}</Text>
            </View>

            {/* ─── LEAGUE BANNER (gradient) ─── */}
            <LinearGradient
                colors={[currentLeague.color, currentLeague.color + 'CC']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.leagueBanner}
            >
                <View style={styles.leagueIcon}>
                    <Ionicons name={currentLeague.icon as any} size={28} color={colors.background} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.leagueTitle}>
                        {isTurkish ? currentLeague.name + ' Ligi' : currentLeague.nameEn + ' League'}
                    </Text>
                    <Text style={styles.leagueDesc}>
                        {isTurkish ? 'Terfi bölgesi hedefleniyor' : 'Aiming for Promotion Zone'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </LinearGradient>

            {/* ─── TABS ─── */}
            <View style={styles.tabRow}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? '#58CC02' : colors.textTertiary} />
                        <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ─── CONTENT ─── */}
            {activeTab === 'leaderboard' ? (
                leaderboardLoading ? (
                    <View style={[COMMON_STYLES.center, { paddingTop: 60 }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.emptySubtitle}>
                            {isTurkish ? 'Yükleniyor...' : 'Loading...'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        // Optimize FlatList performance with windowing and batching
                        initialNumToRender={8}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        updateCellsBatchingPeriod={50}
                        getItemLayout={(data, index) => ({
                            length: 70, // Estimated user card height
                            offset: 70 * index,
                            index,
                        })}
                        data={processedLeaderboardData}
                        renderItem={renderUser}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={[COMMON_STYLES.center, { paddingTop: 60 }]}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="trophy-outline" size={48} color={colors.textTertiary} />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {isTurkish ? 'Henüz Veri Yok' : 'No Data Yet'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {isTurkish ? 'Liderlik tablosu yakında aktif olacak.' : 'Leaderboard will be active soon.'}
                                </Text>
                            </View>
                        }
                        ListHeaderComponent={
                            <View style={styles.legend}>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#58CC02' }]} /><Text style={styles.legendText}>{t('promotion')}</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F0F0F0' }]} /><Text style={styles.legendText}>{t('safe_zone')}</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF4B4B' }]} /><Text style={styles.legendText}>{t('demotion')}</Text></View>
                            </View>
                        }
                    />
                )
            ) : activeTab === 'missions' ? (
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>{t('daily_ai_missions')}</Text>
                    <Text style={styles.sectionSub}>{t('ai_missions_desc')}</Text>
                    {missions.map((m, i) => {
                        const ringSize = 48; const sw = 5; const r = (ringSize - sw) / 2;
                        const circ = 2 * Math.PI * r; const off = circ * (1 - m.progress);
                        return (
                            <View key={i} style={styles.missionCard}>
                                <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                                    <Svg width={ringSize} height={ringSize} style={{ position: 'absolute' }}>
                                        <Circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={m.color + '20'} strokeWidth={sw} fill="none" />
                                        <Circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={m.color} strokeWidth={sw} fill="none"
                                            strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off} strokeLinecap="round"
                                            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`} />
                                    </Svg>
                                    <Ionicons name={m.icon as any} size={18} color={m.color} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.missionTitle}>{m.title}</Text>
                                    <Text style={[styles.missionPts, { color: m.color }]}>+{m.pts} {isTurkish ? 'Puan' : 'Pts'}</Text>
                                </View>
                                <TouchableOpacity style={[styles.missionBtn, { backgroundColor: m.color }]}>
                                    <Text style={styles.missionBtnText}>{isTurkish ? 'Topla' : 'Claim'}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            ) : activeTab === 'store' ? (
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {/* Balance */}
                    <View style={styles.balanceCard}>
                        <Ionicons name="diamond" size={20} color="#CE82FF" />
                        <Text style={styles.balanceValue}>9,800</Text>
                        <Text style={styles.balanceLabel}>{t('points_vault')}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>{t('profile_customization')}</Text>
                    {storeItems.map((item, i) => (
                        <View key={i} style={styles.storeCard}>
                            <View style={[styles.storeCardAccent, { backgroundColor: item.color }]} />
                            <View style={[styles.storeEmoji, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.emoji as any} size={26} color={item.color} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.storeItemTitle}>{item.title}</Text>
                                <Text style={styles.storeItemDesc}>{item.desc}</Text>
                            </View>
                            <TouchableOpacity style={[styles.storeBuyBtn, { backgroundColor: item.color }]}>
                                <Text style={styles.storeBuyText}>{item.price}</Text>
                                <Ionicons name="diamond" size={12} color="#A855F7" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}><Ionicons name="people" size={36} color={colors.textTertiary} /></View>
                    <Text style={styles.emptyTitle}>{t('no_friends_yet')}</Text>
                    <TouchableOpacity style={styles.addFriendBtn}>
                        <Ionicons name="person-add" size={18} color={colors.background} />
                        <Text style={styles.addFriendText}>{t('add_friend')}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    // Header
    header: { paddingHorizontal: 20, marginBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },

    // League Banner
    leagueBanner: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20, padding: 18, borderRadius: 20, marginBottom: 16, gap: 14,
    },
    leagueIcon: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    },
    leagueTitle: { fontSize: 17, fontWeight: '700', color: colors.background },
    leagueDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    // Tabs
    tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F5F5F5', borderRadius: 14, padding: 3, marginBottom: 12 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12 },
    tabActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    tabText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    tabTextActive: { color: '#58CC02' },

    // Legend
    legend: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: colors.textTertiary },

    listContent: { paddingHorizontal: 20, paddingBottom: 120 },

    // User Cards
    userCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 16, padding: 12,
        marginBottom: 6, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden',
    },
    userCardMe: { backgroundColor: '#58CC02', borderColor: '#58CC02' },
    rankNum: { fontSize: 14, fontWeight: '800', color: colors.textTertiary, width: 28, textAlign: 'center' },
    userAvatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8,
    },
    userName: { fontSize: 13, fontWeight: '700', color: colors.text },
    userPts: { fontSize: 11, color: colors.textTertiary },
    userStreak: { fontSize: 11, fontWeight: '600', color: '#FF6B6B' },

    // Missions
    sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
    sectionSub: { fontSize: 13, color: colors.textTertiary, marginBottom: 18, lineHeight: 20 },
    missionCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 18, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    },
    missionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    missionPts: { fontSize: 13, fontWeight: '800', marginTop: 2 },
    missionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
    missionBtnText: { fontSize: 12, fontWeight: '700', color: colors.background },

    // Store
    balanceCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFFBEB', borderRadius: 18, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#FFF0C1',
    },
    balanceValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    balanceLabel: { fontSize: 12, color: colors.textTertiary },
    storeCard: {
        flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
        backgroundColor: colors.background, borderRadius: 18, marginBottom: 10,
        borderWidth: 1, borderColor: '#F0F0F0', paddingRight: 14,
    },
    storeCardAccent: { width: 4, height: '100%' },
    storeEmoji: {
        width: 52, height: 52, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginLeft: 12, marginVertical: 12,
    },
    storeItemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    storeItemDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    storeBuyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
    storeBuyText: { fontSize: 13, fontWeight: '700', color: colors.background },

    // Empty
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.textTertiary, marginBottom: 8 },
    emptySubtitle: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 20 },
    addFriendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#58CC02', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 16 },
    addFriendText: { fontSize: 14, fontWeight: '700', color: colors.background },
});
