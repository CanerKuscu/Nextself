import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';

const ProposalInboxScreen = () => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadProposals = useCallback(async () => {
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;

            const { data } = await SupabaseService.getInstance().getClient()
                .from('service_proposals')
                .select(`
                    *,
                    professional:professional_profile_id (
                        id, professional_type, average_rating, total_ratings,
                        users:user_id ( first_name, last_name )
                    )
                `)
                .eq('client_user_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setProposals(data || []);
        } catch { setProposals([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProposals(); }, [loadProposals]);

    const handleAction = async (proposalId: string, accept: boolean) => {
        setActionLoading(proposalId);
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;

            if (accept) {
                // Update proposal status
                await supabase.from('service_proposals').update({ status: 'accepted' }).eq('id', proposalId);

                // Get the proposal details for creating the relationship
                const proposal = proposals.find(p => p.id === proposalId);
                if (proposal) {
                    const insertData: any = {
                        client_id: user.id,
                        professional_id: proposal.professional_profile_id,
                        status: 'active',
                        start_date: new Date().toISOString(),
                        agreed_price: proposal.agreed_price,
                        platform_fee_percent: 10,
                        deposit_paid_amount: proposal.deposit_total,
                    };

                    if (proposal.professional_type === 'pt') {
                        insertData.trainer_id = proposal.professional_profile_id;
                    } else if (proposal.professional_type === 'dietitian') {
                        insertData.dietitian_id = proposal.professional_profile_id;
                    }

                    await supabase.from('client_relationships').insert(insertData);
                }

                Alert.alert(
                    isTurkish ? 'Teklif Onaylandı!' : 'Proposal Accepted!',
                    isTurkish ? 'Artık bu uzmanın takip sistemine dahil oldunuz.' : 'You are now part of this professional\'s tracking system.'
                );
            } else {
                await supabase.from('service_proposals').update({ status: 'rejected' }).eq('id', proposalId);
                Alert.alert(isTurkish ? 'Reddedildi' : 'Rejected', isTurkish ? 'Teklif reddedildi.' : 'Proposal rejected.');
            }

            loadProposals();
        } catch (err) {
            console.warn(err);
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'İşlem başarısız.' : 'Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const getDurationLabel = (months: number) => {
        if (months === 1) return isTurkish ? '1 Ay' : '1 Month';
        if (months === 3) return isTurkish ? '3 Ay' : '3 Months';
        if (months === 6) return isTurkish ? '6 Ay' : '6 Months';
        if (months === 12) return isTurkish ? '1 Yıl' : '1 Year';
        return `${months} ${isTurkish ? 'Ay' : 'Months'}`;
    };

    const renderProposal = ({ item }: { item: any }) => {
        const profName = item.professional?.users
            ? `${item.professional.users.first_name || ''} ${item.professional.users.last_name || ''}`.trim()
            : (isTurkish ? 'Uzman' : 'Professional');
        const isPt = item.professional_type === 'pt';
        const isProcessing = actionLoading === item.id;

        return (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={[styles.cardAccent, { backgroundColor: isPt ? '#F97316' : '#16A34A' }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatar, { backgroundColor: isPt ? '#F9731620' : '#16A34A20' }]}>
                            <Ionicons name={isPt ? 'barbell' : 'nutrition'} size={22} color={isPt ? '#F97316' : '#16A34A'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.profName, { color: colors.text }]}>{profName}</Text>
                            <Text style={[styles.profType, { color: colors.textSecondary }]}>
                                {isPt ? (isTurkish ? 'Personal Trainer' : 'Personal Trainer') : (isTurkish ? 'Diyetisyen' : 'Dietitian')}
                            </Text>
                        </View>
                        {item.professional?.average_rating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingText}>{Number(item.professional.average_rating).toFixed(1)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={[styles.detailItem, { backgroundColor: colors.background }]}>
                            <Ionicons name="cash-outline" size={16} color={colors.primary} />
                            <Text style={[styles.detailValue, { color: colors.text }]}>{Number(item.agreed_price || 0).toLocaleString()} ₺</Text>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Fiyat' : 'Price'}</Text>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: colors.background }]}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={[styles.detailValue, { color: colors.text }]}>{getDurationLabel(item.duration_months)}</Text>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: colors.background }]}>
                            <Ionicons name="fitness-outline" size={16} color={colors.primary} />
                            <Text style={[styles.detailValue, { color: colors.text }]}>{item.sessions_per_week || '-'}</Text>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Ders/Hafta' : 'Sessions/Wk'}</Text>
                        </View>
                    </View>

                    {item.note ? (
                        <View style={[styles.noteBox, { backgroundColor: colors.background }]}>
                            <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.noteText, { color: colors.textSecondary }]}>{item.note}</Text>
                        </View>
                    ) : null}

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.rejectBtn, { borderColor: '#DC2626' }]}
                            onPress={() => handleAction(item.id, false)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <ActivityIndicator size="small" color="#DC2626" /> : (
                                <Text style={styles.rejectText}>{isTurkish ? 'Reddet' : 'Reject'}</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleAction(item.id, true)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <Text style={styles.acceptText}>{isTurkish ? 'Onayla' : 'Accept'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'More')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Gelen Teklifler' : 'Proposals'}</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={proposals}
                    renderItem={renderProposal}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="mail-open-outline" size={60} color={colors.borderLight} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {isTurkish ? 'Bekleyen teklif yok' : 'No pending proposals'}
                            </Text>
                            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                                {isTurkish ? 'PT veya Diyetisyenlerden gelen teklifler burada görünecek.' : 'Proposals from PTs or Dietitians will appear here.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    list: { padding: SPACING.lg, paddingBottom: SPACING.section, gap: SPACING.md },
    card: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOWS.sm },
    cardAccent: { height: 4 },
    cardContent: { padding: SPACING.lg, gap: SPACING.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    profName: { ...TYPOGRAPHY.bodyBold, fontSize: 16 },
    profType: { ...TYPOGRAPHY.caption },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    ratingText: { ...TYPOGRAPHY.small, color: '#92400E', fontWeight: '700' },
    detailsGrid: { flexDirection: 'row', gap: SPACING.sm },
    detailItem: { flex: 1, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
    detailValue: { ...TYPOGRAPHY.bodyBold },
    detailLabel: { ...TYPOGRAPHY.small },
    noteBox: { flexDirection: 'row', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm, alignItems: 'flex-start' },
    noteText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
    actionRow: { flexDirection: 'row', gap: SPACING.md },
    rejectBtn: { flex: 1, paddingVertical: 14, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, alignItems: 'center' },
    rejectText: { ...TYPOGRAPHY.bodyBold, color: '#DC2626' },
    acceptBtn: { flex: 2, paddingVertical: 14, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    acceptText: { ...TYPOGRAPHY.bodyBold, color: '#FFF' },
    emptyTitle: { ...TYPOGRAPHY.h3, marginTop: SPACING.lg },
    emptySub: { ...TYPOGRAPHY.body, textAlign: 'center', marginTop: SPACING.sm },
});

export default ProposalInboxScreen;
