import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

type ClientItem = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    updated_at: string | null;
    assignmentCount: number;
    completedCount: number;
};

const ClientsListScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [query, setQuery] = useState('');
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');

    const loadClients = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            const currentRole = pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(currentRole);

            const professionalId = pro?.id;
            if (!professionalId) {
                setClients([]);
                return;
            }

            const { data: relationships } = await service.getClient()
                .from('client_relationships')
                .select('client_id,status')
                .or(`professional_id.eq.${professionalId},trainer_id.eq.${professionalId},dietitian_id.eq.${professionalId}`)
                .eq('status', 'active');

            const activeClientIds = [...new Set((relationships || []).map((item: any) => item.client_id))];
            if (activeClientIds.length === 0) {
                setClients([]);
                return;
            }

            const { data: profileRows } = await service.getClient()
                .from('profiles')
                .select('id,first_name,last_name,email,updated_at')
                .in('id', activeClientIds);

            if (!profileRows || profileRows.length === 0) {
                setClients([]);
                return;
            }

            let assignmentRows: any[] = [];
            if (currentRole === 'dietitian') {
                const { data: plans } = await service.getClient()
                    .from('assigned_nutrition_plans')
                    .select('client_id,is_active')
                    .eq('dietitian_id', professionalId)
                    .in('client_id', activeClientIds);
                assignmentRows = plans || [];
            } else {
                const { data: workouts } = await service.getClient()
                    .from('assigned_workouts')
                    .select('client_id,is_completed')
                    .eq('pt_id', professionalId)
                    .in('client_id', activeClientIds);
                assignmentRows = workouts || [];
            }

            const totals = new Map<string, { total: number; done: number }>();
            assignmentRows.forEach((row) => {
                const current = totals.get(row.client_id) || { total: 0, done: 0 };
                current.total += 1;
                const done = currentRole === 'dietitian' ? row.is_active === true : row.is_completed === true;
                if (done) current.done += 1;
                totals.set(row.client_id, current);
            });

            const list: ClientItem[] = profileRows.map((item: any) => ({
                id: item.id,
                first_name: item.first_name,
                last_name: item.last_name,
                email: item.email,
                updated_at: item.updated_at,
                assignmentCount: totals.get(item.id)?.total || 0,
                completedCount: totals.get(item.id)?.done || 0,
            }));

            setClients(list);
        } catch {
            setClients([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clients;
        return clients.filter((item) => {
            const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ').toLowerCase();
            return fullName.includes(q) || (item.email || '').toLowerCase().includes(q);
        });
    }, [clients, query]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadClients();
    }, [loadClients]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => safeGoBack(navigation, 'ProfessionalHome')}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Üye Takibi' : 'Member Tracking'}</Text>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('QRInvite')}>
                    <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: SPACING.lg }}>
                <View style={[styles.search, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={isTurkish ? 'Üye ara...' : 'Search member...'}
                        placeholderTextColor={colors.textTertiary}
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const completionRate = item.assignmentCount > 0 ? Math.round((item.completedCount / item.assignmentCount) * 100) : 0;
                    const stale = !item.updated_at || (Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24) > 7;
                    return (
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
                        >
                            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                                <Ionicons name="person-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.info}>
                                <Text style={[styles.name, { color: colors.text }]}>
                                    {[item.first_name, item.last_name].filter(Boolean).join(' ') || (isTurkish ? 'İsimsiz Üye' : 'Unnamed Member')}
                                </Text>
                                <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.email || '-'}</Text>
                                <Text style={[styles.sub, { color: stale ? '#DC2626' : colors.textSecondary }]}>
                                    {stale
                                        ? (isTurkish ? '7+ gündür güncelleme yok' : 'No update for 7+ days')
                                        : (isTurkish ? 'Takip güncel' : 'Tracking up to date')}
                                </Text>
                            </View>
                            <View style={styles.right}>
                                <Text style={[styles.rate, { color: colors.text }]}>{completionRate}%</Text>
                                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                                    {role === 'dietitian' ? (isTurkish ? 'Plan uyumu' : 'Plan adherence') : (isTurkish ? 'Antrenman uyumu' : 'Workout adherence')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Henüz aktif üye yok.' : 'No active members yet.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
    },
    search: {
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        ...TYPOGRAPHY.body,
        paddingVertical: SPACING.sm,
    },
    list: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.sm,
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        ...SHADOWS.sm,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    right: {
        alignItems: 'flex-end',
    },
    name: {
        ...TYPOGRAPHY.bodyBold,
    },
    sub: {
        ...TYPOGRAPHY.caption,
    },
    rate: {
        ...TYPOGRAPHY.h3,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxxl,
        gap: SPACING.xs,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
    },
});

export default ClientsListScreen;
