import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

const ClientDetailScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const clientId = route.params?.clientId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [client, setClient] = useState<any>(null);
    const [completed, setCompleted] = useState(0);
    const [total, setTotal] = useState(0);
    const [latestItems, setLatestItems] = useState<any[]>([]);
    const [todayMacros, setTodayMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [todayHealth, setTodayHealth] = useState({ steps: 0, activeCalories: 0 });

    const loadClient = useCallback(async () => {
        if (!clientId) {
            setLoading(false);
            return;
        }
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: profile } = await service.getClient()
                .from('profiles')
                .select('id,first_name,last_name,email,weight,height,updated_at')
                .eq('id', clientId)
                .single();
            setClient(profile);

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            const currentRole = pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(currentRole);

            if (!pro?.id) {
                setCompleted(0);
                setTotal(0);
                setLatestItems([]);
                return;
            }

            if (currentRole === 'dietitian') {
                const { data: plans } = await service.getClient()
                    .from('assigned_nutrition_plans')
                    .select('id,title,is_active,created_at,daily_calories')
                    .eq('dietitian_id', pro.id)
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false });
                const rows = plans || [];
                setLatestItems(rows.slice(0, 5));
                setTotal(rows.length);
                setCompleted(rows.filter((item: any) => item.is_active === true).length);

                const todayStr = new Date().toISOString().split('T')[0];
                const { data: nlogs } = await service.getClient()
                    .from('nutrition_logs')
                    .select('calories, protein, carbs, fat')
                    .eq('user_id', clientId)
                    .eq('log_date', todayStr);
                if (nlogs) {
                    const total = nlogs.reduce((acc, log) => ({
                        calories: acc.calories + (Number(log.calories) || 0),
                        protein: acc.protein + (Number(log.protein) || 0),
                        carbs: acc.carbs + (Number(log.carbs) || 0),
                        fat: acc.fat + (Number(log.fat) || 0),
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                    setTodayMacros(total);
                }
            } else {
                const { data: workouts } = await service.getClient()
                    .from('assigned_workouts')
                    .select('id,title,is_completed,created_at,description')
                    .eq('pt_id', pro.id)
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false });
                const rows = workouts || [];
                setLatestItems(rows.slice(0, 5));
                setTotal(rows.length);
                setCompleted(rows.filter((item: any) => item.is_completed === true).length);

                const todayStr = new Date().toISOString().split('T')[0];
                const { data: hdata } = await service.getClient()
                    .from('health_data')
                    .select('metric_type, metric_value')
                    .eq('user_id', clientId)
                    .eq('date', todayStr);
                if (hdata) {
                    let steps = 0;
                    let activeCalories = 0;
                    hdata.forEach((row: any) => {
                        if (row.metric_type === 'steps') steps += Number(row.metric_value) || 0;
                        if (row.metric_type === 'active_energy') activeCalories += Number(row.metric_value) || 0;
                    });
                    setTodayHealth({ steps, activeCalories });
                }
            }
        } catch {
            setClient(null);
            setCompleted(0);
            setTotal(0);
            setLatestItems([]);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        loadClient();
    }, [loadClient]);

    const rate = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }, [completed, total]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!client) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                    {isTurkish ? 'Üye kaydı bulunamadı.' : 'Member record not found.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
                <TouchableOpacity style={[styles.back, { backgroundColor: colors.surface }]} onPress={() => safeGoBack(navigation, 'ClientsList')}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Üye Detayı' : 'Member Detail'}</Text>
                <TouchableOpacity style={[styles.back, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Chat', { chatPartnerId: client.id })}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="person-outline" size={26} color={colors.primary} />
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {[client.first_name, client.last_name].filter(Boolean).join(' ') || (isTurkish ? 'İsimsiz Üye' : 'Unnamed Member')}
                    </Text>
                    <Text style={[styles.sub, { color: colors.textSecondary }]}>{client.email || '-'}</Text>
                    <Text style={[styles.sub, { color: colors.textSecondary }]}>
                        {client.weight ? `${client.weight} kg` : '-'} • {client.height ? `${client.height} cm` : '-'}
                    </Text>
                </View>

                {role === 'dietitian' ? (
                    <View style={[styles.liveCard, { backgroundColor: colors.surface }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.xs }}>
                            <Ionicons name="restaurant-outline" size={18} color="#FF9600" />
                            <Text style={[styles.liveTitle, { color: colors.text }]}>{isTurkish ? 'Bugün Tüketilen' : 'Consumed Today'}</Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.text, marginBottom: SPACING.sm }]}>
                            {todayMacros.calories} <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kcal</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.sm }}>
                            <View>
                                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Pro</Text>
                                <Text style={[styles.macroValue, { color: '#FF6B6B' }]}>{todayMacros.protein}g</Text>
                            </View>
                            <View>
                                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Karb</Text>
                                <Text style={[styles.macroValue, { color: '#FF9600' }]}>{todayMacros.carbs}g</Text>
                            </View>
                            <View>
                                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Yağ</Text>
                                <Text style={[styles.macroValue, { color: '#1CB0F6' }]}>{todayMacros.fat}g</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.liveCard, { backgroundColor: colors.surface }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.xs }}>
                            <Ionicons name="fitness-outline" size={18} color="#1CB0F6" />
                            <Text style={[styles.liveTitle, { color: colors.text }]}>{isTurkish ? 'Bugünün Aktivitesi' : "Today's Activity"}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.sm }}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Adım' : 'Steps'}</Text>
                                <Text style={[styles.statValue, { color: '#1CB0F6' }]}>{todayHealth.steps}</Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Yakılan' : 'Burned'}</Text>
                                <Text style={[styles.statValue, { color: '#FF9600' }]}>{todayHealth.activeCalories} kcal</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {role === 'dietitian' ? (isTurkish ? 'Toplam Plan' : 'Total Plans') : (isTurkish ? 'Toplam Program' : 'Total Programs')}
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{rate}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Uyum' : 'Adherence'}</Text>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.action, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ProfessionalProgramCreator', { clientId })}>
                        <Ionicons name={role === 'dietitian' ? 'nutrition-outline' : 'barbell-outline'} size={20} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>{isTurkish ? 'Yeni Plan' : 'New Plan'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.action, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Assignments', { clientId })}>
                        <Ionicons name="list-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.text }]}>{isTurkish ? 'Görev Takibi' : 'Assignments'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.logCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.logTitle, { color: colors.text }]}>{isTurkish ? 'Son Atamalar' : 'Latest Assignments'}</Text>
                    {latestItems.length === 0 ? (
                        <Text style={[styles.sub, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Henüz atama yapılmamış.' : 'No assignments yet.'}
                        </Text>
                    ) : (
                        latestItems.map((item) => (
                            <View key={item.id} style={[styles.logRow, { borderBottomColor: colors.borderLight }]}>
                                <Text style={[styles.logName, { color: colors.text }]}>{item.title || (isTurkish ? 'Başlıksız' : 'Untitled')}</Text>
                                <Text style={[styles.logState, { color: colors.textSecondary }]}>
                                    {role === 'dietitian'
                                        ? (item.is_active ? (isTurkish ? 'Aktif' : 'Active') : (isTurkish ? 'Pasif' : 'Inactive'))
                                        : (item.is_completed ? (isTurkish ? 'Tamamlandı' : 'Completed') : (isTurkish ? 'Devam' : 'In Progress'))}
                                </Text>
                            </View>
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
    empty: {
        ...TYPOGRAPHY.body,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    back: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.sm,
    },
    profileCard: {
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.circle,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    name: {
        ...TYPOGRAPHY.h3,
    },
    sub: {
        ...TYPOGRAPHY.caption,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    statCard: {
        flex: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    statValue: {
        ...TYPOGRAPHY.h2,
    },
    statLabel: {
        ...TYPOGRAPHY.caption,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    action: {
        flex: 1,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        gap: SPACING.xs,
    },
    actionText: {
        ...TYPOGRAPHY.captionBold,
    },
    logCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    logTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.sm,
    },
    logRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
    },
    logName: {
        ...TYPOGRAPHY.body,
        flex: 1,
        paddingRight: SPACING.sm,
    },
    logState: {
        ...TYPOGRAPHY.captionBold,
    },
    liveCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    liveTitle: {
        ...TYPOGRAPHY.bodyBold,
    },
    macroLabel: {
        ...TYPOGRAPHY.caption,
        textAlign: 'center',
    },
    macroValue: {
        ...TYPOGRAPHY.bodyBold,
        textAlign: 'center',
    },
});

export default ClientDetailScreen;
