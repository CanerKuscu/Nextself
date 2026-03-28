import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

type Role = 'pt' | 'dietitian';

type ClientRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    updated_at: string | null;
};

const ProfessionalHomeScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [role, setRole] = useState<Role>('pt');
    const [name, setName] = useState('');
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [assignmentCount, setAssignmentCount] = useState(0);

    const baseColor = role === 'dietitian' ? '#16A34A' : '#EA580C';
    const gradient = role === 'dietitian' ? ['#22C55E', '#166534'] as const : ['#F97316', '#9A3412'] as const;

    const loadDashboard = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: profile } = await service.getClient()
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single();

            const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
            setName(displayName || (isTurkish ? 'Uzman' : 'Professional'));

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            const currentRole: Role = pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(currentRole);

            const proId = pro?.id;
            if (!proId) {
                setClients([]);
                setPendingCount(0);
                setCompletedCount(0);
                setAssignmentCount(0);
                return;
            }

            const { data: relationships } = await service.getClient()
                .from('client_relationships')
                .select('client_id,status')
                .or(`professional_id.eq.${proId},trainer_id.eq.${proId},dietitian_id.eq.${proId}`);

            const allRelationships = relationships || [];
            const activeClientIds = allRelationships.filter((item: any) => item.status === 'active').map((item: any) => item.client_id);
            setPendingCount(allRelationships.filter((item: any) => item.status === 'pending').length);

            if (activeClientIds.length === 0) {
                setClients([]);
                setCompletedCount(0);
                setAssignmentCount(0);
                return;
            }

            const uniqueClientIds = [...new Set(activeClientIds)];
            const { data: profiles } = await service.getClient()
                .from('profiles')
                .select('id,first_name,last_name,email,updated_at')
                .in('id', uniqueClientIds);

            const mappedClients = (profiles || []) as ClientRow[];
            setClients(mappedClients);

            if (currentRole === 'dietitian') {
                const { data: plans } = await service.getClient()
                    .from('assigned_nutrition_plans')
                    .select('id,is_active,client_id')
                    .eq('dietitian_id', proId)
                    .in('client_id', uniqueClientIds);

                const rows = plans || [];
                setAssignmentCount(rows.length);
                setCompletedCount(rows.filter((item: any) => item.is_active === true).length);
            } else {
                const { data: workouts } = await service.getClient()
                    .from('assigned_workouts')
                    .select('id,is_completed,client_id')
                    .eq('pt_id', proId)
                    .in('client_id', uniqueClientIds);

                const rows = workouts || [];
                setAssignmentCount(rows.length);
                setCompletedCount(rows.filter((item: any) => item.is_completed === true).length);
            }
        } catch (error) {
            setClients([]);
            setPendingCount(0);
            setCompletedCount(0);
            setAssignmentCount(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isTurkish]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, [loadDashboard]);

    const adherence = useMemo(() => {
        if (assignmentCount === 0) return 0;
        return Math.round((completedCount / assignmentCount) * 100);
    }, [assignmentCount, completedCount]);

    const staleClients = useMemo(() => {
        const now = Date.now();
        return clients.filter((item) => {
            if (!item.updated_at) return true;
            const days = (now - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24);
            return days > 7;
        }).length;
    }, [clients]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={baseColor} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={gradient} style={[styles.hero, { paddingTop: insets.top + SPACING.sm }]}>
                <Text style={styles.heroOverline}>
                    {role === 'dietitian' ? (isTurkish ? 'Diyetisyen Paneli' : 'Dietitian Desk') : (isTurkish ? 'PT Paneli' : 'PT Desk')}
                </Text>
                <Text style={styles.heroTitle}>
                    {isTurkish ? `Merhaba ${name}` : `Welcome ${name}`}
                </Text>
                <Text style={styles.heroSub}>
                    {isTurkish ? 'Üye takibi, görev atama ve kritik riskleri tek ekranda yönetin.' : 'Track members, assign tasks, and manage risks from one place.'}
                </Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={baseColor} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.metricsRow}>
                    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{clients.length}</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Aktif Üye' : 'Active Members'}</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{pendingCount}</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Bekleyen Talep' : 'Pending Requests'}</Text>
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{adherence}%</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Uyum Oranı' : 'Adherence Rate'}</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{staleClients}</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Riskli Üye' : 'At Risk Members'}</Text>
                    </View>
                </View>

                <View style={[styles.block, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.blockTitle, { color: colors.text }]}>{isTurkish ? 'Hızlı İşlemler' : 'Quick Actions'}</Text>
                    <View style={styles.quickGrid}>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('ClientsList')}>
                            <Ionicons name="people-outline" size={22} color={baseColor} />
                            <Text style={[styles.quickText, { color: colors.text }]}>{isTurkish ? 'Üyelerim' : 'Members'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('ProfessionalProgramCreator')}>
                            <Ionicons name={role === 'dietitian' ? 'nutrition-outline' : 'barbell-outline'} size={22} color={baseColor} />
                            <Text style={[styles.quickText, { color: colors.text }]}>{isTurkish ? 'Plan Yaz' : 'Create Plan'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('ProfessionalBilling')}>
                            <Ionicons name="card-outline" size={22} color={baseColor} />
                            <Text style={[styles.quickText, { color: colors.text }]}>{isTurkish ? 'Gelir Takibi' : 'Revenue'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('QRInvite')}>
                            <Ionicons name="qr-code-outline" size={22} color={baseColor} />
                            <Text style={[styles.quickText, { color: colors.text }]}>{isTurkish ? 'Üye Davet' : 'Invite'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.block, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.blockTitle, { color: colors.text }]}>{isTurkish ? 'Son Güncelleme Bekleyenler' : 'Members Requiring Follow-up'}</Text>
                    {clients.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Henüz aktif üye bulunmuyor.' : 'No active members yet.'}
                        </Text>
                    ) : (
                        clients.slice(0, 5).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.memberRow, { borderBottomColor: colors.borderLight }]}
                                onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
                            >
                                <View style={[styles.avatar, { backgroundColor: `${baseColor}15` }]}>
                                    <Ionicons name="person-outline" size={18} color={baseColor} />
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>
                                        {[item.first_name, item.last_name].filter(Boolean).join(' ') || (isTurkish ? 'İsimsiz Üye' : 'Unnamed Member')}
                                    </Text>
                                    <Text style={[styles.memberSub, { color: colors.textSecondary }]}>
                                        {item.email || (isTurkish ? 'E-posta yok' : 'No email')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hero: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: BORDER_RADIUS.xxl,
        borderBottomRightRadius: BORDER_RADIUS.xxl,
    },
    heroOverline: {
        ...TYPOGRAPHY.smallBold,
        color: '#FFFFFFCC',
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
    },
    heroTitle: {
        ...TYPOGRAPHY.h1,
        color: '#fff',
        marginBottom: SPACING.xs,
    },
    heroSub: {
        ...TYPOGRAPHY.caption,
        color: '#FFFFFFDD',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.md,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    metricCard: {
        flex: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    metricValue: {
        ...TYPOGRAPHY.h2,
    },
    metricLabel: {
        ...TYPOGRAPHY.caption,
    },
    block: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        ...SHADOWS.sm,
    },
    blockTitle: {
        ...TYPOGRAPHY.h3,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    quickItem: {
        width: '47%',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: `${COLORS.primary}20`,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        gap: SPACING.xs,
    },
    quickText: {
        ...TYPOGRAPHY.captionBold,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        gap: SPACING.sm,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        ...TYPOGRAPHY.bodyBold,
    },
    memberSub: {
        ...TYPOGRAPHY.caption,
    },
});

export default ProfessionalHomeScreen;
