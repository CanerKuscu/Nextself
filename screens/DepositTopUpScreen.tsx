import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';
import { IyzicoDepositService } from '../services/IyzicoDepositService';

const QUICK_AMOUNTS = [300, 750, 1200, 1800, 3000, 5000];

const DepositTopUpScreen = () => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const bal = await IyzicoDepositService.getInstance().getWalletBalance(user.id);
                    setBalance(bal);
                }
            } catch {}
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleTopUp = async () => {
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 100) {
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Minimum 100 ₺ yükleme yapabilirsiniz.' : 'Minimum top-up is 100 ₺.');
            return;
        }

        setPaying(true);
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (!user) return;

            const success = await IyzicoDepositService.getInstance().openCheckout({
                userId: user.id,
                amount: numAmount,
                description: isTurkish ? 'NextSelf Profesyonel Bakiye Yükleme' : 'NextSelf Professional Balance Top-Up',
            });

            if (success) {
                Alert.alert(
                    isTurkish ? 'Ödeme Sayfası Açıldı' : 'Payment Page Opened',
                    isTurkish
                        ? 'Tarayıcıda ödeme işlemini tamamlayın. Ödeme onaylandığında bakiyeniz otomatik olarak güncellenecektir.'
                        : 'Complete the payment in your browser. Your balance will be updated automatically once the payment is confirmed.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Ödeme sayfası açılamadı.' : 'Could not open payment page.');
            }
        } catch {
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'İşlem başarısız.' : 'Operation failed.');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Bakiye Yükle' : 'Top Up Balance'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {/* Balance Card */}
                <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>{isTurkish ? 'Mevcut Bakiye' : 'Current Balance'}</Text>
                    <Text style={styles.balanceAmount}>{balance.toFixed(2)} ₺</Text>
                    <View style={styles.secureRow}>
                        <Ionicons name="shield-checkmark" size={14} color="#4ADE80" />
                        <Text style={styles.secureText}>{isTurkish ? 'iyzico güvencesiyle' : 'Secured by iyzico'}</Text>
                    </View>
                </LinearGradient>

                {/* Amount Input */}
                <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Yüklenecek Tutar (₺)' : 'Amount to Add (₺)'}</Text>
                <TextInput
                    style={[styles.amountInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor={colors.textTertiary}
                />

                {/* Quick Amount Buttons */}
                <View style={styles.quickGrid}>
                    {QUICK_AMOUNTS.map((amt) => (
                        <TouchableOpacity
                            key={amt}
                            style={[styles.quickBtn, {
                                backgroundColor: amount === String(amt) ? colors.primary : colors.surface,
                                borderColor: amount === String(amt) ? colors.primary : colors.borderLight,
                            }]}
                            onPress={() => setAmount(String(amt))}
                        >
                            <Text style={[styles.quickBtnText, { color: amount === String(amt) ? '#FFF' : colors.text }]}>
                                {amt.toLocaleString()} ₺
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={[styles.infoBox, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="information-circle" size={18} color={colors.warning} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {isTurkish
                            ? 'Ödeme iyzico altyapısı ile güvenli şekilde yapılır. Apple/Google kesintisi yoktur. Bakiyeniz anında güncellenir.'
                            : 'Payment is securely processed via iyzico. No Apple/Google commission. Your balance updates instantly.'}
                    </Text>
                </View>

                {/* Pay Button */}
                <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: colors.primary, opacity: paying ? 0.7 : 1 }]}
                    onPress={handleTopUp}
                    disabled={paying}
                >
                    {paying ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="card-outline" size={20} color="#FFF" />
                            <Text style={styles.payBtnText}>
                                {isTurkish ? `${Number(amount || 0).toLocaleString()} ₺ Yükle` : `Top Up ${Number(amount || 0).toLocaleString()} ₺`}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    content: { flex: 1, padding: SPACING.lg },
    balanceCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl },
    balanceLabel: { ...TYPOGRAPHY.body, color: '#FFFFFFAA', marginBottom: SPACING.xs },
    balanceAmount: { fontSize: 42, fontWeight: '900', color: '#FFF' },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
    secureText: { ...TYPOGRAPHY.caption, color: '#4ADE80' },
    label: { ...TYPOGRAPHY.captionBold, marginBottom: SPACING.sm },
    amountInput: { borderWidth: 1, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, ...TYPOGRAPHY.h2, textAlign: 'center', marginBottom: SPACING.md },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
    quickBtn: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, minWidth: '30%', alignItems: 'center' },
    quickBtnText: { ...TYPOGRAPHY.bodyBold },
    infoBox: { flexDirection: 'row', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm, alignItems: 'flex-start', marginBottom: SPACING.xl },
    infoText: { ...TYPOGRAPHY.caption, flex: 1, lineHeight: 18 },
    payBtn: { flexDirection: 'row', paddingVertical: 18, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
    payBtnText: { ...TYPOGRAPHY.bodyBold, color: '#FFF', fontSize: 18 },
});

export default DepositTopUpScreen;
