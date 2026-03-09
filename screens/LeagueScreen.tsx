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
import { SupabaseService } from '../services/supabase';
import GlassCard from '../components/GlassCard';
import LeagueTierIcon from '../components/LeagueTierIcon';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

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

    const tierInfo = userLeague ? LeagueService.getInstance().getTierInfo(userLeague.current_tier) : LEAGUE_TIERS[0];
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
            <LinearGradient colors={[tierInfo.color, tierInfo.color + 'CC']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Haftalık Lig' : 'Weekly League'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Current League Badge */}
                <GlassCard style={styles.leagueCard}>
                    <LeagueTierIcon tier={tierInfo.tier} size={56} />
                    <Text style={styles.leagueName}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</Text>
                    <Text style={styles.leagueSub}>
                        {isTurkish ? `Hafta ${userLeague?.weeks_in_current_league || 1}` : `Week ${userLeague?.weeks_in_current_league || 1}`}
                    </Text>

                    {/* XP Display */}
                    <View style={styles.xpRow}>
                        <View style={styles.xpItem}>
                            <Text style={styles.xpValue}>{userLeague?.weekly_xp || 0}</Text>
                            <Text style={styles.xpLabel}>{isTurkish ? 'Haftalık XP' : 'Weekly XP'}</Text>
                        </View>
                        <View style={[styles.xpDivider, { backgroundColor: tierInfo.color }]} />
                        <View style={styles.xpItem}>
                            <Text style={styles.xpValue}>{userLeague?.total_xp || 0}</Text>
                            <Text style={styles.xpLabel}>{isTurkish ? 'Toplam XP' : 'Total XP'}</Text>
                        </View>
                        <View style={[styles.xpDivider, { backgroundColor: tierInfo.color }]} />
                        <View style={styles.xpItem}>
                            <Text style={styles.xpValue}>#{userLeague?.rank_in_group || '-'}</Text>
                            <Text style={styles.xpLabel}>{isTurkish ? 'Sıralama' : 'Rank'}</Text>
                        </View>
                    </View>

                    {/* Time Remaining */}
                    <View style={styles.timerRow}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.timerText}>
                            {isTurkish
                                ? `${timeRemaining.days}g ${timeRemaining.hours}s ${timeRemaining.minutes}dk kaldı`
                                : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`}
                        </Text>
                    </View>
                </GlassCard>

                {/* League Tiers Overview */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Lig Seviyeleri' : 'League Tiers'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiersScroll} contentContainerStyle={styles.tiersContainer}>
                    {LEAGUE_TIERS.map((tier) => (
                        <View
                            key={tier.tier}
                            style={[
                                styles.tierBadge,
                                { borderColor: tier.color },
                                userLeague?.current_tier === tier.tier && { backgroundColor: tier.color + '20', borderWidth: 2 },
                            ]}
                        >
                            <LeagueTierIcon tier={tier.tier} size={28} />
                            <Text style={[styles.tierName, userLeague?.current_tier === tier.tier && { fontWeight: 'bold', color: tier.color }]}>
                                {isTurkish ? tier.nameTr : tier.name}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Leaderboard */}
                <Text style={styles.sectionTitle}>{isTurkish ? 'Liderlik Tablosu' : 'Leaderboard'}</Text>
                <Text style={styles.sectionSub}>
                    {isTurkish ? '30 kişilik grubunuz - Haftalık sıralama' : 'Your 30-person group - Weekly ranking'}
                </Text>

                {leaderboard && leaderboard.members.length > 0 ? (
                    <View style={styles.leaderboardContainer}>
                        {/* Zone Legend */}
                        <View style={styles.zoneLegend}>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: '#58CC02' }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Terfi Bölgesi' : 'Promotion Zone'}</Text>
                            </View>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: colors.textTertiary }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Güvenli Bölge' : 'Safe Zone'}</Text>
                            </View>
                            <View style={styles.zoneItem}>
                                <View style={[styles.zoneDot, { backgroundColor: '#FF4B4B' }]} />
                                <Text style={styles.zoneText}>{isTurkish ? 'Düşme Bölgesi' : 'Demotion Zone'}</Text>
                            </View>
                        </View>

                        {leaderboard.members.map((member, index) => {
                            const rankDisplay = getRankDisplay(member.rank);
                            const isCurrentUser = member.user_id === currentUserId;
                            return (
                                <View
                                    key={member.user_id}
                                    style={[
                                        styles.memberRow,
                                        isCurrentUser && styles.currentUserRow,
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
                                            {member.full_name || member.username}{isCurrentUser ? (isTurkish ? ' (Sen)' : ' (You)') : ''}
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
                                            {member.weekly_xp}
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
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', flex: 1, textAlign: 'center' },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    leagueCard: { padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
    leagueIcon: { marginBottom: SPACING.sm },
    leagueName: { ...TYPOGRAPHY.h2, color: colors.text },
    leagueSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginBottom: SPACING.lg },
    xpRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
    xpItem: { alignItems: 'center' },
    xpValue: { ...TYPOGRAPHY.h3, color: colors.text },
    xpLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
    xpDivider: { width: 1, height: 30 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.lg, backgroundColor: colors.background, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.pill },
    timerText: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    sectionTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.sm, marginTop: SPACING.lg },
    sectionSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginBottom: SPACING.md },
    tiersScroll: { marginBottom: SPACING.lg },
    tiersContainer: { gap: SPACING.sm, paddingRight: SPACING.lg },
    tierBadge: { alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: colors.borderLight, minWidth: 70 },
    tierIcon: { marginBottom: 4 },
    tierName: { ...TYPOGRAPHY.small, color: colors.textSecondary },
    leaderboardContainer: { marginBottom: SPACING.lg },
    zoneLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md, backgroundColor: colors.surface, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    zoneItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    zoneDot: { width: 8, height: 8, borderRadius: 4 },
    zoneText: { ...TYPOGRAPHY.small, color: colors.textSecondary },
    memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: SPACING.md, marginBottom: 2, borderRadius: BORDER_RADIUS.sm, gap: SPACING.sm },
    currentUserRow: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30' },
    rankContainer: { width: 32, alignItems: 'center' },

    rankNumber: { ...TYPOGRAPHY.bodyBold, color: colors.textSecondary },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    memberInfo: { flex: 1 },
    memberName: { ...TYPOGRAPHY.body, color: colors.text },
    currentUserName: { ...TYPOGRAPHY.bodyBold, color: colors.primary },
    zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
    zoneBadgeText: { fontSize: 10, fontWeight: '600' },
    memberXP: { alignItems: 'flex-end' },
    xpAmount: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    xpUnit: { ...TYPOGRAPHY.small, color: colors.textTertiary },
    emptyCard: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.md },
    emptyText: { ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' },
    infoCard: { padding: SPACING.lg, marginBottom: SPACING.xl },
    infoTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.md },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    infoIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    infoText: { ...TYPOGRAPHY.body, color: colors.textSecondary, flex: 1 },
});

export default LeagueScreen;
