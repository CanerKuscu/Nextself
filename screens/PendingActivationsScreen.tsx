import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';

const PendingActivationsScreen = () => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPendingActivations = useCallback(async () => {
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;

            const { data } = await SupabaseService.getInstance().getClient()
                .from('service_proposals')
                .select(`
                    id, agreed_price, duration_months, deposit_total, created_at,
                    client:client_user_id ( id, first_name, last_name, email )
                `)
                .eq('professional_user_id', user.id)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            setProposals(data || []);
        } catch {
            setProposals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadPendingActivations();
        });
        return unsubscribe;
    }, [navigation, loadPendingActivations]);

    const renderItem = ({ item }: { item: any }) => {
        const clientName = [item.client?.first_name, item.client?.last_name].filter(Boolean).join(' ') || (isTurkish ? 'İsimsiz Üye' : 'Unnamed Member');

        return (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={[styles.cardAccent, { backgroundColor: colors.primary }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.clientName, { color: colors.text }]}>{clientName}</Text>
                            <Text style={[styles.clientEmail, { color: colors.textSecondary }]}>{item.client?.email || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={[styles.detailItem, { backgroundColor: colors.background }]}>
                            <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.detailValue, { color: colors.text }]}>{item.agreed_price} ₺</Text>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Anlaşılan' : 'Agreed'}</Text>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: colors.background }]}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.detailValue, { color: colors.text }]}>{item.duration_months} {isTurkish ? 'Ay' : 'Mo'}</Text>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="wallet-outline" size={16} color="#DC2626" />
                            <Text style={[styles.detailValue, { color: '#DC2626' }]}>{item.deposit_total} ₺</Text>
                            <Text style={[styles.detailLabel, { color: '#DC2626' }]}>{isTurkish ? '%10 Komisyon' : '10% Fee'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {isTurkish 
                            ? `${clientName} teklifinizi kabul etti. Takip sistemini başlatmak için ödemeyi tamamlayın.`
                            : `${clientName} has accepted your proposal. Complete the payment to start tracking.`}
                    </Text>

                    <TouchableOpacity
                        style={[styles.payBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('ProfessionalCheckout', { proposal: item, clientName })}
                    >
                        <Text style={styles.payBtnText}>{isTurkish ? 'Komisyonu Öde / Aktifleştir' : 'Pay Fee / Activate'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isTurkish ? 'Bekleyen Onaylar' : 'Pending Approvals'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={proposals}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.borderLight} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {isTurkish ? 'Bekleyen Onay Yok' : 'No Pending Approvals'}
                            </Text>
                            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                                {isTurkish ? 'Tüm müşterileriniz aktif durumda.' : 'All your clients are active.'}
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
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    clientName: { ...TYPOGRAPHY.bodyBold, fontSize: 16 },
    clientEmail: { ...TYPOGRAPHY.caption },
    detailsGrid: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    detailItem: { flex: 1, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
    detailValue: { ...TYPOGRAPHY.bodyBold },
    detailLabel: { ...TYPOGRAPHY.small },
    infoText: { ...TYPOGRAPHY.caption, marginTop: SPACING.xs, lineHeight: 18 },
    payBtn: { paddingVertical: 14, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.sm },
    payBtnText: { ...TYPOGRAPHY.bodyBold, color: '#FFF' },
    emptyTitle: { ...TYPOGRAPHY.h3, marginTop: SPACING.lg },
    emptySub: { ...TYPOGRAPHY.body, textAlign: 'center', marginTop: SPACING.sm },
});

export default PendingActivationsScreen;
