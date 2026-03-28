import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

const ProfessionalBillingScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);
    const [activeRelationships, setActiveRelationships] = useState<any[]>([]);

    const loadBilling = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            const professionalId = pro?.id;
            if (!professionalId) {
                setRows([]);
                setActiveRelationships([]);
                return;
            }

            const { data: billingCycles } = await service.getClient()
                .from('billing_cycles')
                .select('*')
                .eq('professional_id', professionalId)
                .order('created_at', { ascending: false });
            setRows(billingCycles || []);

            const { data: relationships } = await service.getClient()
                .from('client_relationships')
                .select('agreed_price,platform_fee_percent,deposit_paid_amount,status')
                .or(`professional_id.eq.${professionalId},trainer_id.eq.${professionalId},dietitian_id.eq.${professionalId}`)
                .eq('status', 'active');
            setActiveRelationships(relationships || []);
        } catch {
            setRows([]);
            setActiveRelationships([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBilling();
    }, [loadBilling]);

    const summary = useMemo(() => {
        let estimatedRevenue = 0;
        let expectedCommission = 0;
        let paidDeposit = 0;
        activeRelationships.forEach((item) => {
            const price = Number(item.agreed_price || 0);
            const feePercent = Number(item.platform_fee_percent || 10);
            const deposit = Number(item.deposit_paid_amount || 0);
            estimatedRevenue += price;
            expectedCommission += (price * feePercent) / 100;
            paidDeposit += deposit;
        });
        return {
            estimatedRevenue,
            expectedCommission,
            paidDeposit,
            remainder: Math.max(expectedCommission - paidDeposit, 0),
        };
    }, [activeRelationships]);

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Gelir ve Faturalar' : 'Revenue & Billing'}</Text>
                <View style={styles.iconBtn} />
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>{isTurkish ? 'Bu Ay Özet' : 'This Month Summary'}</Text>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Tahmini Ciro' : 'Estimated Revenue'}</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.estimatedRevenue.toFixed(2)} ₺</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Toplam Komisyon' : 'Total Commission'}</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.expectedCommission.toFixed(2)} ₺</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Ödenen Depozito' : 'Paid Deposit'}</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.paidDeposit.toFixed(2)} ₺</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Kalan Borç' : 'Outstanding'}</Text>
                    <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{summary.remainder.toFixed(2)} ₺</Text>
                </View>
            </View>

            <FlatList
                data={rows}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const status = String(item.status || 'pending');
                    const statusColor = status === 'paid' ? '#16A34A' : status === 'overdue' ? '#DC2626' : '#D97706';
                    return (
                        <View style={[styles.billCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.billTop}>
                                <Text style={[styles.billMonth, { color: colors.text }]}>{item.month_year || '-'}</Text>
                                <Text style={[styles.billStatus, { color: statusColor }]}>{status.toUpperCase()}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Komisyon' : 'Commission'}</Text>
                                <Text style={[styles.billNumber, { color: colors.text }]}>{Number(item.total_commission_owed || 0).toFixed(2)} ₺</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Depozito' : 'Deposit'}</Text>
                                <Text style={[styles.billNumber, { color: colors.text }]}>{Number(item.total_deposit_paid || 0).toFixed(2)} ₺</Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            {isTurkish ? 'Henüz fatura kaydı yok.' : 'No billing records yet.'}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 38,
        height: 38,
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
    },
    summaryCard: {
        marginHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
        gap: SPACING.xs,
    },
    summaryTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.xs,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        ...TYPOGRAPHY.caption,
    },
    summaryValue: {
        ...TYPOGRAPHY.bodyBold,
    },
    list: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
        paddingBottom: SPACING.section,
    },
    billCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
        gap: SPACING.xs,
    },
    billTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    billMonth: {
        ...TYPOGRAPHY.bodyBold,
    },
    billStatus: {
        ...TYPOGRAPHY.captionBold,
    },
    billNumber: {
        ...TYPOGRAPHY.body,
    },
});

export default ProfessionalBillingScreen;
