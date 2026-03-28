import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';

// Deposit pricing per month based on duration
const DEPOSIT_TIERS: { months: number; perMonth: number; labelTr: string; labelEn: string }[] = [
    { months: 1,  perMonth: 300, labelTr: '1 Ay',    labelEn: '1 Month' },
    { months: 3,  perMonth: 250, labelTr: '3 Ay',    labelEn: '3 Months' },
    { months: 6,  perMonth: 200, labelTr: '6 Ay',    labelEn: '6 Months' },
    { months: 12, perMonth: 150, labelTr: '1 Yıl',   labelEn: '1 Year' },
];

const SendProposalScreen = () => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [price, setPrice] = useState('');
    const [selectedTier, setSelectedTier] = useState(DEPOSIT_TIERS[0]);
    const [sessionsPerWeek, setSessionsPerWeek] = useState('3');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number>(0);

    useEffect(() => {
        loadWalletBalance();
    }, []);

    const loadWalletBalance = async () => {
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;
            const { data } = await SupabaseService.getInstance().getClient()
                .from('professional_wallets')
                .select('balance')
                .eq('user_id', user.id)
                .maybeSingle();
            setWalletBalance(Number(data?.balance || 0));
        } catch { setWalletBalance(0); }
    };

    const searchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const { data } = await SupabaseService.getInstance().getClient()
                .from('profiles')
                .select('id, first_name, last_name, email, user_type')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
                .eq('user_type', 'user')
                .limit(10);
            setSearchResults(data || []);
        } catch { setSearchResults([]); }
        finally { setSearching(false); }
    };

    const depositTotal = selectedTier.perMonth * selectedTier.months;
    const commissionRate = 0.10;
    const rawCommission = Number(price || 0) * commissionRate;
    const effectiveCommission = Math.max(rawCommission, selectedTier.perMonth);
    const needsTopUp = walletBalance < depositTotal;

    const handleSendProposal = async () => {
        if (!selectedUser) {
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Lütfen bir kullanıcı seçin.' : 'Please select a user.');
            return;
        }
        if (!price || Number(price) <= 0) {
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Geçerli bir fiyat girin.' : 'Enter a valid price.');
            return;
        }
        if (needsTopUp) {
            Alert.alert(
                isTurkish ? 'Yetersiz Bakiye' : 'Insufficient Balance',
                isTurkish
                    ? `Bu teklif için ${depositTotal} ₺ depozito gereklidir. Mevcut bakiyeniz: ${walletBalance} ₺. Lütfen önce bakiye yükleyin.`
                    : `This proposal requires ${depositTotal} ₺ deposit. Your balance: ${walletBalance} ₺. Please top up first.`,
                [
                    { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                    { text: isTurkish ? 'Bakiye Yükle' : 'Top Up', onPress: () => navigation.navigate('DepositTopUp') }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;

            const { data: pro } = await SupabaseService.getInstance().getClient()
                .from('professional_profiles')
                .select('id, professional_type')
                .eq('user_id', user.id)
                .maybeSingle();

            await SupabaseService.getInstance().getClient()
                .from('service_proposals')
                .insert({
                    professional_user_id: user.id,
                    professional_profile_id: pro?.id,
                    professional_type: pro?.professional_type || 'pt',
                    client_user_id: selectedUser.id,
                    agreed_price: Number(price),
                    duration_months: selectedTier.months,
                    sessions_per_week: Number(sessionsPerWeek || 0),
                    deposit_per_month: selectedTier.perMonth,
                    deposit_total: depositTotal,
                    note: note.trim(),
                    status: 'pending',
                });

            // Deduct deposit from wallet
            await SupabaseService.getInstance().getClient()
                .from('professional_wallets')
                .update({ balance: walletBalance - depositTotal })
                .eq('user_id', user.id);

            Alert.alert(
                isTurkish ? 'Teklif Gönderildi!' : 'Proposal Sent!',
                isTurkish
                    ? `${selectedUser.first_name || ''} adlı kullanıcıya teklifiniz iletildi. Onayladığında takip sisteminize eklenecektir.`
                    : `Your proposal has been sent to ${selectedUser.first_name || ''}. They will be added to your tracking once approved.`,
                [{ text: 'OK', onPress: () => safeGoBack(navigation, 'ProfessionalHome') }]
            );
        } catch (err) {
            console.warn(err);
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Teklif gönderilemedi.' : 'Failed to send proposal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isTurkish ? 'Üyeye Teklif Gönder' : 'Send Proposal'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Wallet Balance */}
                <TouchableOpacity
                    style={[styles.walletCard, { backgroundColor: colors.surface, borderColor: needsTopUp ? '#DC2626' : '#16A34A' }]}
                    onPress={() => navigation.navigate('DepositTopUp')}
                >
                    <View style={styles.walletRow}>
                        <Ionicons name="wallet-outline" size={22} color={needsTopUp ? '#DC2626' : '#16A34A'} />
                        <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Bakiyeniz' : 'Your Balance'}</Text>
                    </View>
                    <Text style={[styles.walletAmount, { color: needsTopUp ? '#DC2626' : '#16A34A' }]}>{walletBalance.toFixed(2)} ₺</Text>
                </TouchableOpacity>

                {/* User Search */}
                <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kullanıcı Ara' : 'Search User'}</Text>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={isTurkish ? 'Üye adı ile arayın...' : 'Search member by name...'}
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={searchUsers}
                    />
                    {searching && <ActivityIndicator size="small" color={colors.primary} />}
                </View>

                {selectedUser ? (
                    <View style={[styles.selectedUser, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        <Text style={[styles.selectedUserText, { color: colors.text }]}>
                            {selectedUser.first_name} {selectedUser.last_name}
                        </Text>
                        <TouchableOpacity onPress={() => { setSelectedUser(null); setSearchQuery(''); }}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ) : searchResults.length > 0 ? (
                    <View style={[styles.resultsList, { backgroundColor: colors.surface }]}>
                        {searchResults.map((u) => (
                            <TouchableOpacity
                                key={u.id}
                                style={[styles.resultRow, { borderBottomColor: colors.borderLight }]}
                                onPress={() => { setSelectedUser(u); setSearchResults([]); setSearchQuery(`${u.first_name || ''} ${u.last_name || ''}`); }}
                            >
                                <Ionicons name="person-outline" size={18} color={colors.primary} />
                                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                                    <Text style={[styles.resultName, { color: colors.text }]}>{u.first_name || ''} {u.last_name || ''}</Text>
                                    <Text style={[styles.resultEmail, { color: colors.textSecondary }]}>{u.email || ''}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : null}

                {/* Price */}
                <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Hizmet Bedeli (₺)' : 'Service Price (₺)'}</Text>
                <TextInput
                    style={[styles.input, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="4000"
                    placeholderTextColor={colors.textTertiary}
                />

                {/* Duration */}
                <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                <View style={styles.tierRow}>
                    {DEPOSIT_TIERS.map((tier) => {
                        const isActive = selectedTier.months === tier.months;
                        return (
                            <TouchableOpacity
                                key={tier.months}
                                style={[styles.tierChip, {
                                    backgroundColor: isActive ? colors.primary : colors.surface,
                                    borderColor: isActive ? colors.primary : colors.borderLight,
                                }]}
                                onPress={() => setSelectedTier(tier)}
                            >
                                <Text style={[styles.tierText, { color: isActive ? '#FFF' : colors.text }]}>
                                    {isTurkish ? tier.labelTr : tier.labelEn}
                                </Text>
                                <Text style={[styles.tierPrice, { color: isActive ? '#FFFFFFCC' : colors.textSecondary }]}>
                                    {tier.perMonth} ₺/ay
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Sessions per week */}
                <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Haftalık Ders Sayısı' : 'Sessions per Week'}</Text>
                <TextInput
                    style={[styles.input, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
                    value={sessionsPerWeek}
                    onChangeText={setSessionsPerWeek}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={colors.textTertiary}
                />

                {/* Note */}
                <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Not (Opsiyonel)' : 'Note (Optional)'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { borderColor: colors.borderLight, color: colors.text, backgroundColor: colors.surface }]}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    placeholder={isTurkish ? 'Programa dahil detaylar...' : 'Details about the program...'}
                    placeholderTextColor={colors.textTertiary}
                />

                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>{isTurkish ? 'Özet' : 'Summary'}</Text>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Hizmet Bedeli' : 'Service Price'}</Text>
                        <Text style={[styles.sumVal, { color: colors.text }]}>{Number(price || 0).toFixed(2)} ₺</Text>
                    </View>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                        <Text style={[styles.sumVal, { color: colors.text }]}>{isTurkish ? selectedTier.labelTr : selectedTier.labelEn}</Text>
                    </View>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Platform Komisyonu' : 'Platform Fee'}</Text>
                        <Text style={[styles.sumVal, { color: colors.text }]}>{effectiveCommission.toFixed(2)} ₺ ({isTurkish ? 'min' : 'min'} {selectedTier.perMonth} ₺)</Text>
                    </View>
                    <View style={[styles.sumDivider, { backgroundColor: colors.borderLight }]} />
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.text, fontWeight: '700' }]}>{isTurkish ? 'Ön Ödeme (Depozito)' : 'Upfront Deposit'}</Text>
                        <Text style={[styles.sumVal, { color: '#DC2626', fontWeight: '800' }]}>{depositTotal} ₺</Text>
                    </View>
                </View>

                {/* Info Box */}
                <View style={[styles.infoBox, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.warning} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {isTurkish
                            ? `Depozito (${depositTotal} ₺) bakiyenizden düşülecektir. Kullanıcı teklifi onayladığında takip sisteminize eklenecektir. Uzun süreli anlaşmalarda aylık depozito düşer.`
                            : `Deposit (${depositTotal} ₺) will be deducted from your balance. The user will be added to your tracking once they approve. Longer commitments have lower monthly deposits.`}
                    </Text>
                </View>

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSendProposal}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.sendBtnText}>{isTurkish ? 'Teklif Gönder' : 'Send Proposal'}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.section },
    walletCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, marginBottom: SPACING.lg, ...SHADOWS.sm },
    walletRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    walletLabel: { ...TYPOGRAPHY.bodyBold },
    walletAmount: { ...TYPOGRAPHY.h2 },
    label: { ...TYPOGRAPHY.captionBold, marginBottom: SPACING.xs },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 48, gap: SPACING.sm },
    searchInput: { flex: 1, ...TYPOGRAPHY.body },
    selectedUser: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, marginTop: SPACING.sm, gap: SPACING.sm },
    selectedUserText: { ...TYPOGRAPHY.bodyBold, flex: 1 },
    resultsList: { borderRadius: BORDER_RADIUS.md, marginTop: SPACING.xs, ...SHADOWS.sm, maxHeight: 200 },
    resultRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1 },
    resultName: { ...TYPOGRAPHY.bodyBold },
    resultEmail: { ...TYPOGRAPHY.caption },
    input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, ...TYPOGRAPHY.body },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    tierRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
    tierChip: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, alignItems: 'center', minWidth: 75 },
    tierText: { ...TYPOGRAPHY.captionBold },
    tierPrice: { ...TYPOGRAPHY.small, marginTop: 2 },
    summaryCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl, gap: SPACING.sm, ...SHADOWS.sm },
    summaryTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.xs },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sumLabel: { ...TYPOGRAPHY.body },
    sumVal: { ...TYPOGRAPHY.bodyBold },
    sumDivider: { height: 1, marginVertical: SPACING.xs },
    infoBox: { flexDirection: 'row', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md, gap: SPACING.sm, alignItems: 'flex-start' },
    infoText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
    sendBtn: { paddingVertical: 18, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.xl },
    sendBtnText: { ...TYPOGRAPHY.bodyBold, color: '#FFF', fontSize: 18 },
});

export default SendProposalScreen;
