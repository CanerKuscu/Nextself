import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeagueService, LEAGUE_TIERS, LeagueUser, LeagueGroupData, UserLeagueData } from '../services/leagueService';
import { useTranslation } from '../hooks/useTranslation';
import { SupabaseService } from '@nextself/shared';
import GlassCard from '../components/GlassCard';
import LeagueTierIcon from '../components/LeagueTierIcon';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

const { width } = Dimensions.get('window');

const LeagueScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userLeague, setUserLeague] = useState<UserLeagueData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeagueGroupData | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const loadData = useCallback(async () => {
        try {
            const leagueService = LeagueService.getInstance();
            const [league, board] = await Promise.all([
                leagueService.getUserLeague(),
                leagueService.getLeaderboard(),
            ]);
            setUserLeague(league);
            setLeaderboard(board);

            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        } catch (err) {
            console.warn('League load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const tierInfo = userLeague ? LeagueService.getInstance().getTierInfo(userLeague.currentTier) : LEAGUE_TIERS[0];
    const timeRemaining = LeagueService.getInstance().getTimeRemaining();

    const getZoneColor = (zone: string) => {
        switch (zone) {
            case 'promotion': return '#58CC02';
            case 'demotion': return '#FF4B4B';
            default: return colors.textTertiary;
        }
    };

    const getZoneLabel = (zone: string) => {
        switch (zone) {
            case 'promotion': return isTurkish ? 'Terfi' : 'Promotion';
            case 'demotion': return isTurkish ? 'Düşme' : 'Demotion';
            default: return isTurkish ? 'Güvenli' : 'Safe';
        }
    };

    const getRankDisplay = (rank: number) => {
        if (rank === 1) return { ionicon: 'trophy' as const, color: '#FFD700' };
        if (rank === 2) return { ionicon: 'medal' as const, color: '#C0C0C0' };
        if (rank === 3) return { ionicon: 'ribbon' as const, color: '#CD7F32' };
        return { ionicon: null, color: colors.textSecondary };
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient colors={[tierInfo.color, tierInfo.color + '99', colors.background]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Haftalık Lig' : 'Weekly League'}</Text>
                <View style={{ width: 44 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tierInfo.color} />}
            >
                {/* Header Banner */}
                <View style={[styles.bannerContainer, { borderColor: tierInfo.color + '40' }]}>
                    <View style={[styles.bannerIconWrap, { backgroundColor: tierInfo.color + '15' }]}>
                        <LeagueTierIcon tier={tierInfo.tier} size={60} />
                    </View>
                    <View style={styles.bannerTextWrap}>
                        <Text style={styles.bannerTitle}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</Text>
                        <View style={styles.bannerSubWrap}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.bannerSubText}>
                                {isTurkish
                                    ? `${timeRemaining.days}g ${timeRemaining.hours}s ${timeRemaining.minutes}dk kaldı`
                                    : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`}
                            </Text>
                        </View>
                        <View style={styles.bannerSubWrap}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.bannerSubText}>
                                {isTurkish ? `Hafta ${userLeague?.weeksInCurrentLeague || 1}` : `Week ${userLeague?.weeksInCurrentLeague || 1}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Leaderboard */}
                {leaderboard && leaderboard.members.length > 0 ? (
                    <View style={styles.leaderboardContainer}>
                        {/* Zone Legend */}
                        <View style={styles.zoneLegend}>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: '#58CC02' }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Terfi' : 'Promotion'}</Text>
                            </View>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: colors.textTertiary }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Güvenli' : 'Safe'}</Text>
                            </View>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: '#FF4B4B' }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Düşme' : 'Demotion'}</Text>
                            </View>
                        </View>

                        {leaderboard.members.map((member, index) => {
                            const rankDisplay = getRankDisplay(member.rank);
                            const isCurrentUser = member.userId === currentUserId;
                            return (
                                <View
                                    key={member.userId}
                                    style={[
                                        styles.memberRow,
                                        isCurrentUser && styles.currentUserRow,
                                        member.rank <= 3 && styles.topMemberRow,
                                        { borderLeftColor: getZoneColor(member.zone), borderLeftWidth: 3 },
                                    ]}
                                >
                                    {/* Rank */}
                                    <View style={styles.rankContainer}>
                                        {member.rank <= 3 && rankDisplay.ionicon ? (
                                            <Ionicons name={rankDisplay.ionicon} size={20} color={rankDisplay.color} />
                                        ) : (
                                            <Text style={styles.rankNumber}>{member.rank}</Text>
                                        )}
                                    </View>

                                    {/* Avatar */}
                                    <View style={[styles.memberAvatar, isCurrentUser && { backgroundColor: colors.primarySoft }]}>
                                        <Ionicons name="person" size={18} color={isCurrentUser ? colors.primary : colors.textTertiary} />
                                    </View>

                                    {/* Info */}
                                    <View style={styles.memberInfo}>
                                        <Text style={[styles.memberName, isCurrentUser && styles.currentUserName]}>
                                            {member.fullName || member.username}{isCurrentUser ? (isTurkish ? ' (Sen)' : ' (You)') : ''}
                                        </Text>
                                        <View style={[styles.zoneBadge, { backgroundColor: getZoneColor(member.zone) + '20' }]}>
                                            <Text style={[styles.zoneBadgeText, { color: getZoneColor(member.zone) }]}>
                                                {getZoneLabel(member.zone)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* XP */}
                                    <View style={styles.memberXP}>
                                        <Text style={[styles.xpAmount, isCurrentUser && { color: colors.primary }]}>
                                            {member.weeklyXp}
                                        </Text>
                                        <Text style={styles.xpUnit}>XP</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <GlassCard style={styles.emptyCard}>
                        <Ionicons name="trophy-outline" size={40} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>
                            {isTurkish ? 'Henüz bir gruba atanmadınız. XP kazanmaya başlayın!' : 'You haven\'t been assigned to a group yet. Start earning XP!'}
                        </Text>
                    </GlassCard>
                )}

                {/* How it works */}
                <GlassCard style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{isTurkish ? 'Nasıl Çalışır?' : 'How It Works?'}</Text>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconWrap, { backgroundColor: '#FFF5EB' }]}><Ionicons name="calendar" size={16} color="#FF9600" /></View>
                        <Text style={styles.infoText}>{isTurkish ? 'Ligler her Pazartesi başlar, Pazar biter' : 'Leagues start Monday, end Sunday'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconWrap, { backgroundColor: '#E0F4FF' }]}><Ionicons name="people" size={16} color="#1CB0F6" /></View>
                        <Text style={styles.infoText}>{isTurkish ? 'Rastgele 30 kişilik gruplara ayrılırsınız' : 'You\'re placed in random 30-person groups'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconWrap, { backgroundColor: '#E8FFE0' }]}><Ionicons name="arrow-up-circle" size={16} color="#58CC02" /></View>
                        <Text style={styles.infoText}>{isTurkish ? 'İlk %33 bir üst lige çıkar' : 'Top 33% get promoted to next league'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconWrap, { backgroundColor: '#FFF0F0' }]}><Ionicons name="arrow-down-circle" size={16} color="#FF4B4B" /></View>
                        <Text style={styles.infoText}>{isTurkish ? 'Son %17 bir alt lige düşer' : 'Bottom 17% get relegated'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconWrap, { backgroundColor: '#F0EAFF' }]}><Ionicons name="diamond" size={16} color="#CE82FF" /></View>
                        <Text style={styles.infoText}>{isTurkish ? 'XP kazanmak için antrenman yap, öğün kaydet, görevleri tamamla' : 'Earn XP by working out, logging meals, completing missions'}</Text>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, zIndex: 10 },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22 },
    headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', flex: 1, textAlign: 'center', fontWeight: '800', letterSpacing: 0.5 },
    content: { padding: SPACING.lg, paddingBottom: 120 },
    bannerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, marginBottom: SPACING.xl, marginTop: -SPACING.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    bannerIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg },
    bannerTextWrap: { flex: 1, justifyContent: 'center' },
    bannerTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 8, letterSpacing: -0.5 },
    bannerSubWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    bannerSubText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: SPACING.xs, marginTop: SPACING.xl, letterSpacing: -0.5 },
    sectionSub: { fontSize: 13, color: colors.textTertiary, marginBottom: SPACING.lg },
    leaderboardContainer: { marginBottom: SPACING.xxl, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 4 },
    zoneLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.lg, backgroundColor: 'transparent', padding: SPACING.sm },
    zoneItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    zoneDot: { width: 10, height: 10, borderRadius: 5 },
    zoneText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: SPACING.lg, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.xl, gap: SPACING.md },
    topMemberRow: { backgroundColor: colors.primarySoft, borderWidth: 0 },
    currentUserRow: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary + '80', transform: [{scale: 1.02}], shadowColor: colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
    rankNumber: { fontSize: 18, fontWeight: '800', color: colors.textSecondary },
    memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.borderLight },
    memberInfo: { flex: 1, justifyContent: 'center' },
    memberName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    currentUserName: { color: colors.primary, fontWeight: '800' },
    zoneBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    zoneBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    memberXP: { alignItems: 'flex-end', justifyContent: 'center' },
    xpAmount: { fontSize: 18, fontWeight: '800', color: colors.text },
    xpUnit: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, marginTop: 2 },
    emptyCard: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.lg, borderRadius: BORDER_RADIUS.xxl },
    emptyText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    infoCard: { padding: SPACING.xl, marginBottom: SPACING.xl, borderRadius: BORDER_RADIUS.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
    infoTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: SPACING.lg },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
    infoIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, flex: 1, lineHeight: 20 },
});

export default LeagueScreen;
