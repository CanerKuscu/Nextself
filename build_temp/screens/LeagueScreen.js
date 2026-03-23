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
const expo_linear_gradient_1 = require("expo-linear-gradient");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const leagueService_1 = require("../services/leagueService");
const useTranslation_1 = require("../hooks/useTranslation");
const supabase_1 = require("../services/supabase");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const LeagueTierIcon_1 = __importDefault(require("../components/LeagueTierIcon"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const { width } = react_native_1.Dimensions.get('window');
const LeagueScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [userLeague, setUserLeague] = (0, react_1.useState)(null);
    const [leaderboard, setLeaderboard] = (0, react_1.useState)(null);
    const [currentUserId, setCurrentUserId] = (0, react_1.useState)('');
    const loadData = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const leagueService = leagueService_1.LeagueService.getInstance();
            const [league, board] = yield Promise.all([
                leagueService.getUserLeague(),
                leagueService.getLeaderboard(),
            ]);
            setUserLeague(league);
            setLeaderboard(board);
            const supabase = supabase_1.SupabaseService.getInstance().getClient();
            const { data: { user } } = yield supabase.auth.getUser();
            if (user)
                setCurrentUserId(user.id);
        }
        catch (err) {
            console.warn('League load error:', err);
        }
        finally {
            setLoading(false);
        }
    }), []);
    (0, react_1.useEffect)(() => { loadData(); }, [loadData]);
    const onRefresh = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        setRefreshing(true);
        yield loadData();
        setRefreshing(false);
    }), [loadData]);
    const tierInfo = userLeague ? leagueService_1.LeagueService.getInstance().getTierInfo(userLeague.currentTier) : leagueService_1.LEAGUE_TIERS[0];
    const timeRemaining = leagueService_1.LeagueService.getInstance().getTimeRemaining();
    const getZoneColor = (zone) => {
        switch (zone) {
            case 'promotion': return '#58CC02';
            case 'demotion': return '#FF4B4B';
            default: return colors.textTertiary;
        }
    };
    const getZoneLabel = (zone) => {
        switch (zone) {
            case 'promotion': return isTurkish ? 'Terfi' : 'Promotion';
            case 'demotion': return isTurkish ? 'Düşme' : 'Demotion';
            default: return isTurkish ? 'Güvenli' : 'Safe';
        }
    };
    const getRankDisplay = (rank) => {
        if (rank === 1)
            return { ionicon: 'trophy', color: '#FFD700' };
        if (rank === 2)
            return { ionicon: 'medal', color: '#C0C0C0' };
        if (rank === 3)
            return { ionicon: 'ribbon', color: '#CD7F32' };
        return { ionicon: null, color: colors.textSecondary };
    };
    if (loading) {
        return (<react_native_1.View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
            {/* Header */}
            <expo_linear_gradient_1.LinearGradient colors={[tierInfo.color, tierInfo.color + '99', colors.background]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color="#fff"/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Haftalık Lig' : 'Weekly League'}</react_native_1.Text>
                <react_native_1.View style={{ width: 44 }}/>
            </expo_linear_gradient_1.LinearGradient>

            <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tierInfo.color}/>}>
                {/* Header Banner */}
                <react_native_1.View style={[styles.bannerContainer, { borderColor: tierInfo.color + '40' }]}>
                    <react_native_1.View style={[styles.bannerIconWrap, { backgroundColor: tierInfo.color + '15' }]}>
                        <LeagueTierIcon_1.default tier={tierInfo.tier} size={60}/>
                    </react_native_1.View>
                    <react_native_1.View style={styles.bannerTextWrap}>
                        <react_native_1.Text style={styles.bannerTitle}>{isTurkish ? tierInfo.nameTr : tierInfo.name}</react_native_1.Text>
                        <react_native_1.View style={styles.bannerSubWrap}>
                            <vector_icons_1.Ionicons name="time-outline" size={14} color={colors.textSecondary}/>
                            <react_native_1.Text style={styles.bannerSubText}>
                                {isTurkish
            ? `${timeRemaining.days}g ${timeRemaining.hours}s ${timeRemaining.minutes}dk kaldı`
            : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`}
                            </react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.bannerSubWrap}>
                            <vector_icons_1.Ionicons name="calendar-outline" size={14} color={colors.textSecondary}/>
                            <react_native_1.Text style={styles.bannerSubText}>
                                {isTurkish ? `Hafta ${(userLeague === null || userLeague === void 0 ? void 0 : userLeague.weeksInCurrentLeague) || 1}` : `Week ${(userLeague === null || userLeague === void 0 ? void 0 : userLeague.weeksInCurrentLeague) || 1}`}
                            </react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.View>

                {/* Leaderboard */}
                {leaderboard && leaderboard.members.length > 0 ? (<react_native_1.View style={styles.leaderboardContainer}>
                        {/* Zone Legend */}
                        <react_native_1.View style={styles.zoneLegend}>
                            <react_native_1.View style={styles.zoneItem}>
                                <react_native_1.View style={[styles.zoneDot, { backgroundColor: '#58CC02' }]}/>
                                <react_native_1.Text style={styles.zoneText}>{isTurkish ? 'Terfi' : 'Promotion'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.zoneItem}>
                                <react_native_1.View style={[styles.zoneDot, { backgroundColor: colors.textTertiary }]}/>
                                <react_native_1.Text style={styles.zoneText}>{isTurkish ? 'Güvenli' : 'Safe'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.zoneItem}>
                                <react_native_1.View style={[styles.zoneDot, { backgroundColor: '#FF4B4B' }]}/>
                                <react_native_1.Text style={styles.zoneText}>{isTurkish ? 'Düşme' : 'Demotion'}</react_native_1.Text>
                            </react_native_1.View>
                        </react_native_1.View>

                        {leaderboard.members.map((member, index) => {
                const rankDisplay = getRankDisplay(member.rank);
                const isCurrentUser = member.userId === currentUserId;
                return (<react_native_1.View key={member.userId} style={[
                        styles.memberRow,
                        isCurrentUser && styles.currentUserRow,
                        member.rank <= 3 && styles.topMemberRow,
                        { borderLeftColor: getZoneColor(member.zone), borderLeftWidth: 3 },
                    ]}>
                                    {/* Rank */}
                                    <react_native_1.View style={styles.rankContainer}>
                                        {member.rank <= 3 && rankDisplay.ionicon ? (<vector_icons_1.Ionicons name={rankDisplay.ionicon} size={20} color={rankDisplay.color}/>) : (<react_native_1.Text style={styles.rankNumber}>{member.rank}</react_native_1.Text>)}
                                    </react_native_1.View>

                                    {/* Avatar */}
                                    <react_native_1.View style={[styles.memberAvatar, isCurrentUser && { backgroundColor: colors.primarySoft }]}>
                                        <vector_icons_1.Ionicons name="person" size={18} color={isCurrentUser ? colors.primary : colors.textTertiary}/>
                                    </react_native_1.View>

                                    {/* Info */}
                                    <react_native_1.View style={styles.memberInfo}>
                                        <react_native_1.Text style={[styles.memberName, isCurrentUser && styles.currentUserName]}>
                                            {member.fullName || member.username}{isCurrentUser ? (isTurkish ? ' (Sen)' : ' (You)') : ''}
                                        </react_native_1.Text>
                                        <react_native_1.View style={[styles.zoneBadge, { backgroundColor: getZoneColor(member.zone) + '20' }]}>
                                            <react_native_1.Text style={[styles.zoneBadgeText, { color: getZoneColor(member.zone) }]}>
                                                {getZoneLabel(member.zone)}
                                            </react_native_1.Text>
                                        </react_native_1.View>
                                    </react_native_1.View>

                                    {/* XP */}
                                    <react_native_1.View style={styles.memberXP}>
                                        <react_native_1.Text style={[styles.xpAmount, isCurrentUser && { color: colors.primary }]}>
                                            {member.weeklyXp}
                                        </react_native_1.Text>
                                        <react_native_1.Text style={styles.xpUnit}>XP</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>);
            })}
                    </react_native_1.View>) : (<GlassCard_1.default style={styles.emptyCard}>
                        <vector_icons_1.Ionicons name="trophy-outline" size={40} color={colors.textTertiary}/>
                        <react_native_1.Text style={styles.emptyText}>
                            {isTurkish ? 'Henüz bir gruba atanmadınız. XP kazanmaya başlayın!' : 'You haven\'t been assigned to a group yet. Start earning XP!'}
                        </react_native_1.Text>
                    </GlassCard_1.default>)}

                {/* How it works */}
                <GlassCard_1.default style={styles.infoCard}>
                    <react_native_1.Text style={styles.infoTitle}>{isTurkish ? 'Nasıl Çalışır?' : 'How It Works?'}</react_native_1.Text>
                    <react_native_1.View style={styles.infoRow}>
                        <react_native_1.View style={[styles.infoIconWrap, { backgroundColor: '#FFF5EB' }]}><vector_icons_1.Ionicons name="calendar" size={16} color="#FF9600"/></react_native_1.View>
                        <react_native_1.Text style={styles.infoText}>{isTurkish ? 'Ligler her Pazartesi başlar, Pazar biter' : 'Leagues start Monday, end Sunday'}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={styles.infoRow}>
                        <react_native_1.View style={[styles.infoIconWrap, { backgroundColor: '#E0F4FF' }]}><vector_icons_1.Ionicons name="people" size={16} color="#1CB0F6"/></react_native_1.View>
                        <react_native_1.Text style={styles.infoText}>{isTurkish ? 'Rastgele 30 kişilik gruplara ayrılırsınız' : 'You\'re placed in random 30-person groups'}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={styles.infoRow}>
                        <react_native_1.View style={[styles.infoIconWrap, { backgroundColor: '#E8FFE0' }]}><vector_icons_1.Ionicons name="arrow-up-circle" size={16} color="#58CC02"/></react_native_1.View>
                        <react_native_1.Text style={styles.infoText}>{isTurkish ? 'İlk %33 bir üst lige çıkar' : 'Top 33% get promoted to next league'}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={styles.infoRow}>
                        <react_native_1.View style={[styles.infoIconWrap, { backgroundColor: '#FFF0F0' }]}><vector_icons_1.Ionicons name="arrow-down-circle" size={16} color="#FF4B4B"/></react_native_1.View>
                        <react_native_1.Text style={styles.infoText}>{isTurkish ? 'Son %17 bir alt lige düşer' : 'Bottom 17% get relegated'}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={styles.infoRow}>
                        <react_native_1.View style={[styles.infoIconWrap, { backgroundColor: '#F0EAFF' }]}><vector_icons_1.Ionicons name="diamond" size={16} color="#CE82FF"/></react_native_1.View>
                        <react_native_1.Text style={styles.infoText}>{isTurkish ? 'XP kazanmak için antrenman yap, öğün kaydet, görevleri tamamla' : 'Earn XP by working out, logging meals, completing missions'}</react_native_1.Text>
                    </react_native_1.View>
                </GlassCard_1.default>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme_1.SPACING.xl, paddingHorizontal: theme_1.SPACING.lg, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, zIndex: 10 },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22 },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: '#fff', flex: 1, textAlign: 'center', fontWeight: '800', letterSpacing: 0.5 }),
    content: { padding: theme_1.SPACING.lg, paddingBottom: 120 },
    bannerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: theme_1.SPACING.lg, borderRadius: theme_1.BORDER_RADIUS.xl, borderWidth: 1, marginBottom: theme_1.SPACING.xl, marginTop: -theme_1.SPACING.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    bannerIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: theme_1.SPACING.lg },
    bannerTextWrap: { flex: 1, justifyContent: 'center' },
    bannerTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 8, letterSpacing: -0.5 },
    bannerSubWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    bannerSubText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: theme_1.SPACING.xs, marginTop: theme_1.SPACING.xl, letterSpacing: -0.5 },
    sectionSub: { fontSize: 13, color: colors.textTertiary, marginBottom: theme_1.SPACING.lg },
    leaderboardContainer: { marginBottom: theme_1.SPACING.xxl, backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.xxl, padding: theme_1.SPACING.md, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 4 },
    zoneLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: theme_1.SPACING.lg, backgroundColor: 'transparent', padding: theme_1.SPACING.sm },
    zoneItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    zoneDot: { width: 10, height: 10, borderRadius: 5 },
    zoneText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.xl, gap: theme_1.SPACING.md },
    topMemberRow: { backgroundColor: colors.primarySoft, borderWidth: 0 },
    currentUserRow: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary + '80', transform: [{ scale: 1.02 }], shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
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
    emptyCard: { padding: theme_1.SPACING.xxl, alignItems: 'center', gap: theme_1.SPACING.lg, borderRadius: theme_1.BORDER_RADIUS.xxl },
    emptyText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    infoCard: { padding: theme_1.SPACING.xl, marginBottom: theme_1.SPACING.xl, borderRadius: theme_1.BORDER_RADIUS.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
    infoTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: theme_1.SPACING.lg },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme_1.SPACING.md, marginBottom: theme_1.SPACING.md },
    infoIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
exports.default = LeagueScreen;
