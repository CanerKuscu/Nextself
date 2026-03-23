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
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const ProfessionalHomeScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { width } = (0, react_native_1.useWindowDimensions)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [userName, setUserName] = (0, react_1.useState)('');
    const [role, setRole] = (0, react_1.useState)('pt');
    const [clients, setClients] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)({ totalClients: 0, activeToday: 0, pendingMessages: 0 });
    const [recentActivities, setRecentActivities] = (0, react_1.useState)([]);
    const loadData = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user)
                return;
            // Get profile and professional ID
            const { data: profile } = yield supabase.getUserProfile(user.id);
            let professionalProfileId = '';
            // Get professional profile ID
            try {
                const { data: profProfile } = yield supabase.getClient()
                    .from('professional_profiles')
                    .select('id, professional_type')
                    .eq('user_id', user.id)
                    .single();
                if (profProfile) {
                    professionalProfileId = profProfile.id;
                    setRole(profProfile.professional_type === 'dietitian' ? 'dietitian' : 'pt');
                }
            }
            catch (e) {
                console.error('Error fetching professional profile:', e);
            }
            if (profile) {
                setUserName(profile.first_name || profile.full_name || 'Professional');
            }
            // Get clients from client_relationships
            const client = supabase.getClient();
            let clientIds = [];
            try {
                if (professionalProfileId) {
                    const { data: relationships, error: relError } = yield client
                        .from('client_relationships')
                        .select('client_id')
                        .or(`professional_id.eq.${professionalProfileId},trainer_id.eq.${professionalProfileId},dietitian_id.eq.${professionalProfileId}`)
                        .eq('status', 'active');
                    if (!relError && relationships) {
                        clientIds = [...new Set(relationships.map((r) => r.client_id))];
                    }
                }
                // If no clients found with new method, try legacy fallback
                if (clientIds.length === 0) {
                    // Fallback to old method if relationship query fails or returns empty (migration transition)
                    console.log('Fallback to legacy client fetch');
                    if ((profile === null || profile === void 0 ? void 0 : profile.professional_type) === 'dietitian') {
                        const { data: plans } = yield client
                            .from('assigned_nutrition_plans')
                            .select('client_id')
                            .eq('dietitian_id', user.id)
                            .eq('is_active', true);
                        clientIds = [...new Set((plans || []).map((p) => p.client_id))];
                    }
                    else {
                        const { data: workouts } = yield client
                            .from('assigned_workouts')
                            .select('client_id')
                            .eq('pt_id', user.id);
                        clientIds = [...new Set((workouts || []).map((w) => w.client_id))];
                    }
                }
            }
            catch (e) {
                console.error('Error fetching clients:', e);
            }
            // Fetch client profiles
            if (clientIds.length > 0) {
                const { data: clientProfiles } = yield client
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, updated_at')
                    .in('id', clientIds);
                if (clientProfiles) {
                    setClients(clientProfiles.map((c) => ({
                        id: c.id,
                        first_name: c.first_name || '',
                        last_name: c.last_name || '',
                        avatar_url: c.avatar_url,
                        last_active: c.updated_at,
                    })));
                }
            }
            // Get pending messages count
            const { data: chats } = yield supabase.getChats(user.id);
            const pendingMessages = (chats || []).length;
            // Get recent notifications (Client Activities)
            const { data: notifications } = yield client
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentActivities(notifications || []);
            setStats({
                totalClients: clientIds.length,
                activeToday: Math.min(clientIds.length, 3), // placeholder
                pendingMessages,
            });
        }
        catch (err) {
            console.error('Error loading professional data:', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }), []);
    (0, react_1.useEffect)(() => {
        loadData();
    }, [loadData]);
    const onRefresh = (0, react_1.useCallback)(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);
    const getRoleTitle = () => {
        if (role === 'dietitian')
            return isTurkish ? 'Diyetisyen Paneli' : 'Dietitian Dashboard';
        return isTurkish ? 'Antrenör Paneli' : 'Trainer Dashboard';
    };
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return isTurkish ? 'Günaydın' : 'Good Morning';
        if (hour < 18)
            return isTurkish ? 'İyi Günler' : 'Good Afternoon';
        return isTurkish ? 'İyi Akşamlar' : 'Good Evening';
    };
    const styles = (0, react_1.useMemo)(() => getStyles(colors, isDark), [colors, isDark]);
    if (loading) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <react_native_1.ActivityIndicator size="large" color={theme_1.COLORS.primary}/>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
            <react_native_1.ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme_1.COLORS.primary}/>} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <react_native_1.View style={styles.header}>
                    <react_native_1.View>
                        <react_native_1.Text style={styles.greeting}>{getGreeting()},</react_native_1.Text>
                        <react_native_1.Text style={styles.userName}>{userName}</react_native_1.Text>
                        <react_native_1.Text style={styles.roleLabel}>{getRoleTitle()}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
                        <vector_icons_1.Ionicons name="settings-outline" size={24} color={colors.text}/>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>

                {/* Stats Cards */}
                <AnimatedCard_1.default animationType="slideUp" delay={100} duration={500} style={styles.statsRow}>
                    <expo_linear_gradient_1.LinearGradient colors={[theme_1.COLORS.primary, theme_1.COLORS.primaryDark || '#4A00E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
                        <vector_icons_1.Ionicons name="people" size={28} color="#fff"/>
                        <react_native_1.Text style={styles.statNumber}>{stats.totalClients}</react_native_1.Text>
                        <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Toplam Danışan' : 'Total Clients'}</react_native_1.Text>
                    </expo_linear_gradient_1.LinearGradient>

                    <react_native_1.View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <vector_icons_1.Ionicons name="pulse" size={28} color={theme_1.COLORS.success}/>
                        <react_native_1.Text style={[styles.statNumber, { color: colors.text }]}>{stats.activeToday}</react_native_1.Text>
                        <react_native_1.Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Bugün Aktif' : 'Active Today'}
                        </react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ChatList')}>
                        <vector_icons_1.Ionicons name="chatbubbles" size={28} color={theme_1.COLORS.warning}/>
                        <react_native_1.Text style={[styles.statNumber, { color: colors.text }]}>{stats.pendingMessages}</react_native_1.Text>
                        <react_native_1.Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Mesajlar' : 'Messages'}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                </AnimatedCard_1.default>

                {/* Quick Actions */}
                <AnimatedCard_1.default animationType="slideUp" delay={200} duration={500}>
                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Hızlı İşlemler' : 'Quick Actions'}</react_native_1.Text>
                    <react_native_1.View style={styles.actionsRow}>
                        <react_native_1.TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ClientsList')}>
                            <react_native_1.View style={[styles.actionIcon, { backgroundColor: theme_1.COLORS.primarySoft }]}>
                                <vector_icons_1.Ionicons name="people-outline" size={22} color={theme_1.COLORS.primary}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.actionText}>{isTurkish ? 'Danışanlar' : 'Clients'}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ProfessionalProgramCreator')}>
                            <react_native_1.View style={[styles.actionIcon, { backgroundColor: `${theme_1.COLORS.success}20` }]}>
                                <vector_icons_1.Ionicons name="clipboard-outline" size={22} color={theme_1.COLORS.success}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.actionText}>{isTurkish ? 'Programlar' : 'Programs'}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ChatList')}>
                            <react_native_1.View style={[styles.actionIcon, { backgroundColor: `${theme_1.COLORS.warning}20` }]}>
                                <vector_icons_1.Ionicons name="chatbubble-outline" size={22} color={theme_1.COLORS.warning}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.actionText}>{isTurkish ? 'Mesajlar' : 'Messages'}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')}>
                            <react_native_1.View style={[styles.actionIcon, { backgroundColor: `${theme_1.COLORS.info || '#2196F3'}20` }]}>
                                <vector_icons_1.Ionicons name="person-outline" size={22} color={theme_1.COLORS.info || '#2196F3'}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.actionText}>{isTurkish ? 'Profilim' : 'My Profile'}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                </AnimatedCard_1.default>

                {/* Client List Preview */}
                <AnimatedCard_1.default animationType="slideUp" delay={300} duration={500}>
                    <react_native_1.View style={styles.sectionHeader}>
                        <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Son Danışanlar' : 'Recent Clients'}</react_native_1.Text>
                        <react_native_1.TouchableOpacity onPress={() => navigation.navigate('ClientsList')}>
                            <react_native_1.Text style={styles.seeAllText}>{isTurkish ? 'Tümünü Gör' : 'See All'}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>

                    {clients.length === 0 ? (<react_native_1.View style={styles.emptyState}>
                            <vector_icons_1.Ionicons name="people-outline" size={48} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.emptyText}>
                                {isTurkish ? 'Henüz danışanınız yok' : 'No clients yet'}
                            </react_native_1.Text>
                        </react_native_1.View>) : (clients.slice(0, 5).map((client) => (<react_native_1.TouchableOpacity key={client.id} style={styles.clientRow} onPress={() => navigation.navigate('Chat', { chatPartnerId: client.id })}>
                                <react_native_1.View style={styles.clientAvatar}>
                                    <vector_icons_1.Ionicons name="person" size={20} color={theme_1.COLORS.primary}/>
                                </react_native_1.View>
                                <react_native_1.View style={styles.clientInfo}>
                                    <react_native_1.Text style={styles.clientName}>
                                        {client.first_name} {client.last_name}
                                    </react_native_1.Text>
                                    <react_native_1.Text style={styles.clientSub}>
                                        {client.last_active
                ? `${isTurkish ? 'Son aktivite: ' : 'Last active: '}${new Date(client.last_active).toLocaleDateString()}`
                : isTurkish ? 'Bilgi yok' : 'No info'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
                            </react_native_1.TouchableOpacity>)))}
                </AnimatedCard_1.default>

                {/* Recent Activities */}
                <AnimatedCard_1.default animationType="slideUp" delay={400} duration={500} style={{ marginTop: theme_1.SPACING.lg }}>
                    <react_native_1.View style={styles.sectionHeader}>
                        <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Son Aktiviteler' : 'Recent Activities'}</react_native_1.Text>
                    </react_native_1.View>

                    {recentActivities.length === 0 ? (<react_native_1.View style={styles.emptyState}>
                            <vector_icons_1.Ionicons name="notifications-outline" size={48} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.emptyText}>
                                {isTurkish ? 'Yeni aktivite yok' : 'No recent activities'}
                            </react_native_1.Text>
                        </react_native_1.View>) : (recentActivities.map((activity) => (<react_native_1.View key={activity.id} style={styles.activityRow}>
                                <react_native_1.View style={styles.activityIcon}>
                                    <vector_icons_1.Ionicons name={activity.type === 'workout_completed' ? 'fitness' : 'notifications'} size={20} color={theme_1.COLORS.success}/>
                                </react_native_1.View>
                                <react_native_1.View style={styles.activityInfo}>
                                    <react_native_1.Text style={styles.activityTitle}>{activity.title}</react_native_1.Text>
                                    <react_native_1.Text style={styles.activityMessage}>{activity.message}</react_native_1.Text>
                                    <react_native_1.Text style={styles.activityTime}>
                                        {new Date(activity.created_at).toLocaleString()}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>)))}
                </AnimatedCard_1.default>

                <react_native_1.View style={{ height: 100 }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors, isDark) => react_native_1.StyleSheet.create({
    scrollContent: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme_1.SPACING.xl,
    },
    greeting: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary }),
    userName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.text, marginTop: 2 }),
    roleLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: theme_1.COLORS.primary, fontWeight: '600', marginTop: 4 }),
    settingsBtn: {
        padding: theme_1.SPACING.sm,
        borderRadius: theme_1.BORDER_RADIUS.md,
        backgroundColor: colors.surface,
    },
    statsRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.lg,
        padding: 0,
        backgroundColor: 'transparent',
    },
    statCard: Object.assign({ flex: 1, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.md, alignItems: 'center', gap: 6 }, theme_1.SHADOWS.card),
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: 'rgba(255,255,255,0.85)', textAlign: 'center' }),
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginBottom: theme_1.SPACING.md }),
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    seeAllText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: theme_1.COLORS.primary, fontWeight: '600' }),
    actionsRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.sm,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.text, textAlign: 'center' }),
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme_1.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        gap: theme_1.SPACING.md,
    },
    clientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme_1.COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { fontWeight: '600', color: colors.text }),
    clientSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary, marginTop: 2 }),
    emptyState: {
        alignItems: 'center',
        paddingVertical: theme_1.SPACING.xxl,
        gap: theme_1.SPACING.sm,
    },
    emptyText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textTertiary }),
    activityRow: {
        flexDirection: 'row',
        paddingVertical: theme_1.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        gap: theme_1.SPACING.md,
        alignItems: 'flex-start',
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${theme_1.COLORS.success}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { fontWeight: '600', color: colors.text }),
    activityMessage: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary, marginTop: 2 }),
    activityTime: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, marginTop: 4 }),
});
exports.default = ProfessionalHomeScreen;
