import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SupabaseService } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomAlert, { useAlert } from '../components/CustomAlert';

export default function ProfessionalBillingScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [billingData, setBillingData] = useState<any[]>([]);
    const [activeClients, setActiveClients] = useState<any[]>([]);
    const { showAlert, AlertComponent } = useAlert();

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        setLoading(true);
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { session } } = await supabase.auth.getSession();
            const professionalId = session?.user?.id;

            if (!professionalId) throw new Error("Giriş yapmanız gerekiyor");

            // 1. Geçmiş Faturaları Çek
            const { data: cycles, error: cyclesError } = await supabase
                .from('billing_cycles')
                .select('*')
                .eq('professional_id', professionalId)
                .order('created_at', { ascending: false });

            if (cyclesError) throw cyclesError;
            setBillingData(cycles || []);

            // 2. Aktif Müşterileri Çek (Şu anki tahmini kazanç/kesinti için)
            const { data: clients, error: clientsError } = await supabase
                .from('client_relationships')
                .select(`
                    id, agreed_price, platform_fee_percent, deposit_paid_amount,
                    client:users!client_relationships_client_id_fkey(first_name, last_name)
                `)
                .eq('professional_id', professionalId)
                .eq('billing_status', 'active');

            if (clientsError) throw clientsError;
            setActiveClients(clients || []);

        } catch (error: any) {
            showAlert({ title: "Hata", message: "Fatura verileri yüklenemedi: " + error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const renderBillingItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.monthText}>{item.month_year}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? '#dcfce7' : item.status === 'overdue' ? '#fee2e2' : '#fef9c3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'paid' ? '#166534' : item.status === 'overdue' ? '#991b1b' : '#854d0e' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Ödenen Depozito:</Text>
                    <Text style={styles.statValue}>{item.total_deposit_paid} TL</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Kalan Komisyon Borcu:</Text>
                    <Text style={styles.statValueBold}>{item.total_commission_owed} TL</Text>
                </View>
            </View>
            {item.status === 'pending' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => showAlert({ title: "Ödeme", message: "Iyzico ödeme sayfasına yönlendirilecek...", type: "info" })}>
                    <Text style={styles.payBtnText}>Faturayı Öde</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const calculateCurrentMonthEstimate = () => {
        let totalOwed = 0;
        let totalDeposit = 0;

        activeClients.forEach(client => {
            const expectedCommission = (client.agreed_price || 0) * ((client.platform_fee_percent || 10) / 100);
            totalDeposit += (client.deposit_paid_amount || 300);
            if (expectedCommission > (client.deposit_paid_amount || 300)) {
                totalOwed += (expectedCommission - (client.deposit_paid_amount || 300));
            }
        });

        return { totalOwed, totalDeposit };
    };

    const estimate = calculateCurrentMonthEstimate();

    return (
        <View style={styles.container}>
            <AlertComponent />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fatura ve Komisyonlar</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={billingData}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={() => (
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryTitle}>Bu Ayki Tahmini Durum</Text>
                            <Text style={styles.summarySub}>Aktif {activeClients.length} müşterinize göre hesaplanmıştır.</Text>
                            <View style={styles.summaryDivider} />
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Toplanan Peşinat (Depozito):</Text>
                                <Text style={styles.statValue}>{estimate.totalDeposit.toFixed(2)} TL</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Ay Sonu Beklenen Ek Fatura:</Text>
                                <Text style={[styles.statValueBold, { color: '#ef4444' }]}>{estimate.totalOwed.toFixed(2)} TL</Text>
                            </View>
                        </View>
                    )}
                    renderItem={renderBillingItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Henüz fatura kaydı bulunmuyor.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContainer: { padding: 15 },
    summaryBox: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#c7d2fe' },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#3730a3', marginBottom: 5 },
    summarySub: { fontSize: 12, color: '#4f46e5', marginBottom: 15 },
    summaryDivider: { height: 1, backgroundColor: '#c7d2fe', marginBottom: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    monthText: { fontSize: 16, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { gap: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    statLabel: { fontSize: 14, color: '#666' },
    statValue: { fontSize: 14, fontWeight: '500' },
    statValueBold: { fontSize: 16, fontWeight: 'bold' },
    payBtn: { backgroundColor: '#4f46e5', marginTop: 15, padding: 10, borderRadius: 8, alignItems: 'center' },
    payBtnText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 30, color: '#666' }
});
