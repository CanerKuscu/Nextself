import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator, Platform, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedCard from '../components/AnimatedCard';

interface ClientSummary {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    last_active?: string;
}

const ProfessionalHomeScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('');
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [clients, setClients] = useState<ClientSummary[]>([]);
    const [stats, setStats] = useState({ totalClients: 0, activeToday: 0, pendingMessages: 0 });

    const loadData = useCallback(async () => {
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) return;

            // Get profile
            const { data: profile } = await supabase.getUserProfile(user.id);
            if (profile) {
                setUserName(profile.first_name || profile.full_name || 'Professional');
                setRole(profile.professional_type === 'dietitian' ? 'dietitian' : 'pt');
            }

            // Get clients (from assigned_workouts or assigned_nutrition_plans depending on role)
            const client = supabase.getClient();
            let clientIds: string[] = [];

            if (profile?.professional_type === 'dietitian') {
                const { data: plans } = await client
                    .from('assigned_nutrition_plans')
                    .select('client_id')
                    .eq('dietitian_id', user.id)
                    .eq('is_active', true);
                clientIds = [...new Set((plans || []).map((p: any) => p.client_id))];
            } else {
                const { data: workouts } = await client
                    .from('assigned_workouts')
                    .select('client_id')
                    .eq('pt_id', user.id);
                clientIds = [...new Set((workouts || []).map((w: any) => w.client_id))];
            }

            // Fetch client profiles
            if (clientIds.length > 0) {
                const { data: clientProfiles } = await client
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, updated_at')
                    .in('id', clientIds);

                if (clientProfiles) {
                    setClients(clientProfiles.map((c: any) => ({
                        id: c.id,
                        first_name: c.first_name || '',
                        last_name: c.last_name || '',
                        avatar_url: c.avatar_url,
                        last_active: c.updated_at,
                    })));
                }
            }

            // Get pending messages count
            const { data: chats } = await supabase.getChats(user.id);
            const pendingMessages = (chats || []).length;

            setStats({
                totalClients: clientIds.length,
                activeToday: Math.min(clientIds.length, 3), // placeholder
                pendingMessages,
            });
        } catch (err) {
            console.error('Error loading professional data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const getRoleTitle = () => {
        if (role === 'dietitian') return isTurkish ? 'Diyetisyen Paneli' : 'Dietitian Dashboard';
        return isTurkish ? 'Antrenör Paneli' : 'Trainer Dashboard';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return isTurkish ? 'Günaydın' : 'Good Morning';
        if (hour < 18) return isTurkish ? 'İyi Günler' : 'Good Afternoon';
        return isTurkish ? 'İyi Akşamlar' : 'Good Evening';
    };

    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    if (loading) {
        return (
            <View style={[COMMON_STYLES.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={COMMON_STYLES.screenContainer}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.roleLabel}>{getRoleTitle()}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsBtn}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <AnimatedCard animationType="slideUp" delay={100} duration={500} style={styles.statsRow}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark || '#4A00E0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                    >
                        <Ionicons name="people" size={28} color="#fff" />
                        <Text style={styles.statNumber}>{stats.totalClients}</Text>
                        <Text style={styles.statLabel}>{isTurkish ? 'Toplam Danışan' : 'Total Clients'}</Text>
                    </LinearGradient>

                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="pulse" size={28} color={COLORS.success} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.activeToday}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Bugün Aktif' : 'Active Today'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.statCard, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('ChatList')}
                    >
                        <Ionicons name="chatbubbles" size={28} color={COLORS.warning} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats.pendingMessages}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Mesajlar' : 'Messages'}
                        </Text>
                    </TouchableOpacity>
                </AnimatedCard>

                {/* Quick Actions */}
                <AnimatedCard animationType="slideUp" delay={200} duration={500}>
                    <Text style={styles.sectionTitle}>{isTurkish ? 'Hızlı İşlemler' : 'Quick Actions'}</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('ClientsList')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primarySoft }]}>
                                <Ionicons name="people-outline" size={22} color={COLORS.primary} />
                            </View>
                            <Text style={styles.actionText}>{isTurkish ? 'Danışanlar' : 'Clients'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('ProgramCreator')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.success}20` }]}>
                                <Ionicons name="clipboard-outline" size={22} color={COLORS.success} />
                            </View>
                            <Text style={styles.actionText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('ChatList')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.warning}20` }]}>
                                <Ionicons name="chatbubble-outline" size={22} color={COLORS.warning} />
                            </View>
                            <Text style={styles.actionText}>{isTurkish ? 'Mesajlar' : 'Messages'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.info || '#2196F3'}20` }]}>
                                <Ionicons name="person-outline" size={22} color={COLORS.info || '#2196F3'} />
                            </View>
                            <Text style={styles.actionText}>{isTurkish ? 'Profilim' : 'My Profile'}</Text>
                        </TouchableOpacity>
                    </View>
                </AnimatedCard>

                {/* Client List Preview */}
                <AnimatedCard animationType="slideUp" delay={300} duration={500}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{isTurkish ? 'Son Danışanlar' : 'Recent Clients'}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ClientsList')}>
                            <Text style={styles.seeAllText}>{isTurkish ? 'Tümünü Gör' : 'See All'}</Text>
                        </TouchableOpacity>
                    </View>

                    {clients.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>
                                {isTurkish ? 'Henüz danışanınız yok' : 'No clients yet'}
                            </Text>
                        </View>
                    ) : (
                        clients.slice(0, 5).map((client) => (
                            <TouchableOpacity
                                key={client.id}
                                style={styles.clientRow}
                                onPress={() => navigation.navigate('Chat', { chatPartnerId: client.id })}
                            >
                                <View style={styles.clientAvatar}>
                                    <Ionicons name="person" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.clientInfo}>
                                    <Text style={styles.clientName}>
                                        {client.first_name} {client.last_name}
                                    </Text>
                                    <Text style={styles.clientSub}>
                                        {client.last_active
                                            ? `${isTurkish ? 'Son aktivite: ' : 'Last active: '}${new Date(client.last_active).toLocaleDateString()}`
                                            : isTurkish ? 'Bilgi yok' : 'No info'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                            </TouchableOpacity>
                        ))
                    )}
                </AnimatedCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xl,
    },
    greeting: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
    },
    userName: {
        ...TYPOGRAPHY.h1,
        color: colors.text,
        marginTop: 2,
    },
    roleLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    settingsBtn: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: colors.surface,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        padding: 0,
        backgroundColor: 'transparent',
    },
    statCard: {
        flex: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        gap: 6,
        ...SHADOWS.card,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        ...TYPOGRAPHY.small,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
        marginBottom: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    seeAllText: {
        ...TYPOGRAPHY.small,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
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
    actionText: {
        ...TYPOGRAPHY.small,
        color: colors.text,
        textAlign: 'center',
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        gap: SPACING.md,
    },
    clientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: colors.text,
    },
    clientSub: {
        ...TYPOGRAPHY.small,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        gap: SPACING.sm,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: colors.textTertiary,
    },
});

export default ProfessionalHomeScreen;
