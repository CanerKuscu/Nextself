import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import CustomAlert, { useAlert } from '../components/CustomAlert';

interface Client {
    id: string;
    relationshipId?: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    email?: string;
    weight?: number;
    height?: number;
}

const ClientsListScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const { showAlert, AlertComponent } = useAlert();

    const loadClients = useCallback(async () => {
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) return;

            const { data: profile } = await supabase.getUserProfile(user.id);
            let professionalProfileId = '';

            // Get professional profile ID
            try {
                const { data: profProfile } = await supabase.getClient()
                    .from('professional_profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                
                if (profProfile) {
                    professionalProfileId = profProfile.id;
                }
            } catch (e) {
                console.error('Error fetching professional profile:', e);
            }

            // Get clients from client_relationships
            const client = supabase.getClient();
            let clientIds: string[] = [];
            let relationshipsMap = new Map<string, string>(); // clientId -> relationshipId

            try {
                if (professionalProfileId) {
                    const { data: relationships, error: relError } = await client
                        .from('client_relationships')
                        .select('id, client_id')
                        .or(`professional_id.eq.${professionalProfileId},trainer_id.eq.${professionalProfileId},dietitian_id.eq.${professionalProfileId}`)
                        .eq('status', 'active');

                    if (!relError && relationships) {
                        relationships.forEach((r: any) => {
                            relationshipsMap.set(r.client_id, r.id);
                        });
                        clientIds = [...new Set(relationships.map((r: any) => r.client_id))];
                    }
                }

                if (clientIds.length === 0) {
                    console.log('Fallback to legacy client fetch in ClientsList');
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
                }
            } catch (e) {
                console.error('Error fetching clients:', e);
            }

            if (clientIds.length > 0) {
                const { data: clientProfiles } = await client
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, email, weight, height')
                    .in('id', clientIds);

                if (clientProfiles) {
                    const mapped = clientProfiles.map((c: any) => ({
                        id: c.id,
                        relationshipId: relationshipsMap.get(c.id),
                        first_name: c.first_name || '',
                        last_name: c.last_name || '',
                        avatar_url: c.avatar_url,
                        email: c.email,
                        weight: c.weight,
                        height: c.height,
                    }));
                    setClients(mapped);
                    setFilteredClients(mapped);
                }
            }
        } catch (err) {
            console.error('Error loading clients:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleStartSession = useCallback(async (client: Client) => {
        if (!client.relationshipId) {
            showAlert({
                title: t('error'),
                message: isTurkish ? 'İstemci bağlantısı bulunamadı.' : 'Client relationship not found.',
                type: 'error'
            });
            return;
        }

        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance().getClient();
            // Use a specific prefix to identify requests initiated by professional
            const requestId = `REQ-${Date.now()}`;
            
            const { error } = await supabase
                .from('session_checkins')
                .insert({
                    client_relationship_id: client.relationshipId,
                    qr_token: requestId,
                    is_verified: false,
                });

            if (error) throw error;

            showAlert({
                title: isTurkish ? 'İstek Gönderildi' : 'Request Sent',
                message: isTurkish ? 'Onay isteği gönderildi. Müşterinin onayı bekleniyor.' : 'Request sent. Waiting for client approval.',
                type: 'success',
                buttons: [{ text: 'OK', onPress: () => { } }]
            });

        } catch (error: any) {
            console.error('Start session error:', error);
            showAlert({
                title: t('error'),
                message: error.message || 'Failed to start session',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [isTurkish, t, showAlert]);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    useEffect(() => {
        if (search.trim()) {
            const q = search.toLowerCase();
            setFilteredClients(clients.filter(c =>
                (c.first_name + ' ' + c.last_name).toLowerCase().includes(q)
            ));
        } else {
            setFilteredClients(clients);
        }
    }, [search, clients]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadClients();
    }, [loadClients]);

    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    const renderClient = useCallback(({ item }: { item: Client }) => (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => navigation.navigate('ClientDetail', { client: item })}
        >
            <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.first_name} {item.last_name}</Text>
                {item.weight && item.height ? (
                    <Text style={styles.clientDetail}>
                        {item.weight}kg · {item.height}cm
                    </Text>
                ) : null}
            </View>
            <View style={styles.clientActions}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleStartSession(item)}
                >
                    <Ionicons name="play-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('Chat', { chatPartnerId: item.id })}
                >
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    ), [navigation, styles, handleStartSession]);

    return (
        <View style={COMMON_STYLES.screenContainer}>
            <AlertComponent />
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('my_clients')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('search_clients')}
                    placeholderTextColor={colors.textTertiary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <View style={styles.centerView}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderClient}
                    // Optimize FlatList performance with windowing and batching
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    updateCellsBatchingPeriod={50}
                    getItemLayout={(data, index) => ({
                        length: 80, // Estimated client card height
                        offset: 80 * index,
                        index,
                    })}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    ListEmptyComponent={
                        <View style={styles.centerView}>
                            <Ionicons name="people-outline" size={60} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>
                                {t('no_clients_yet')}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
        ...SHADOWS.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        ...TYPOGRAPHY.body,
        color: colors.text,
        textAlignVertical: 'center',
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        gap: SPACING.md,
        ...SHADOWS.card,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    clientDetail: {
        ...TYPOGRAPHY.small,
        color: colors.textSecondary,
        marginTop: 2,
    },
    clientActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        gap: SPACING.md,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: colors.textTertiary,
    },
});

export default ClientsListScreen;
