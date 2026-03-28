import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';

const PACKAGES = [
    { id: '1_month', months: 1, price: 99.99, titleTr: '1 Aylık Plan', titleEn: '1 Month Plan' },
    { id: '3_months', months: 3, price: 249.99, titleTr: '3 Aylık Plan', titleEn: '3 Months Plan', popular: true },
    { id: '6_months', months: 6, price: 399.99, titleTr: '6 Aylık Plan', titleEn: '6 Months Plan' },
];

const HireProfessionalScreen = () => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const professional = route.params?.professional;

    const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);
    const [loading, setLoading] = useState(false);

    if (!professional) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Professional not found.</Text>
            </View>
        );
    }

    const fullName = `${professional.users?.first_name || ''} ${professional.users?.last_name || ''}`.trim();
    const roleName = professional.professional_type === 'dietitian' ? (isTurkish ? 'Diyetisyen' : 'Dietitian') : (isTurkish ? 'Personal Trainer' : 'Personal Trainer');

    const handleHire = async () => {
        setLoading(true);
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) {
                Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Lütfen giriş yapın.' : 'Please log in.');
                return;
            }

            // Pseudo logical payment checkout simulation here...
            // If RevenueCat or Stripe was fully integrated for PTs, we would trigger it here.
            // For now, we simulate success and insert a client_relationship

            setTimeout(async () => {
                const agreedPrice = selectedPackage.price;
                const rawCommission = agreedPrice * 0.10;
                const platformCommission = Math.max(rawCommission, 300);

                const insertData: any = {
                    client_id: user.id,
                    professional_id: professional.id,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    agreed_price: agreedPrice,
                    platform_fee_percent: 10,
                    deposit_paid_amount: 300, // upfront minimum deposit
                };
                
                if (professional.professional_type === 'pt') {
                    insertData.trainer_id = professional.id;
                } else if (professional.professional_type === 'dietitian') {
                    insertData.dietitian_id = professional.id;
                }

                await supabase.getClient().from('client_relationships').insert(insertData);

                setLoading(false);
                Alert.alert(
                    isTurkish ? 'Başarılı!' : 'Success!',
                    isTurkish ? `${fullName} ile çalışmaya başladınız.` : `You started working with ${fullName}.`,
                    [{ text: 'OK', onPress: () => safeGoBack(navigation, 'Main') }]
                );
            }, 1500);

        } catch (error) {
            console.warn(error);
            setLoading(false);
            Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'İşlem tamamlanamadı.' : 'Could not complete the transaction.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalDetail')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Kirala' : 'Hire'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.profCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Ionicons name="person-circle" size={60} color={colors.primary} />
                    <View style={styles.profInfo}>
                        <Text style={[styles.profName, { color: colors.text }]}>{fullName || 'Professional'}</Text>
                        <Text style={[styles.profRole, { color: colors.textSecondary }]}>{roleName}</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {isTurkish ? 'Bir Plan Seçin' : 'Select a Plan'}
                </Text>

                <View style={styles.packagesContainer}>
                    {PACKAGES.map((pkg) => {
                        const isSelected = selectedPackage.id === pkg.id;
                        return (
                            <TouchableOpacity
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.borderLight },
                                    isSelected && { backgroundColor: `${colors.primary}10`, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedPackage(pkg)}
                            >
                                {pkg.popular && (
                                    <View style={[styles.popularBadge, { backgroundColor: colors.streak }]}>
                                        <Text style={styles.popularText}>{isTurkish ? 'EN POPÜLER' : 'MOST POPULAR'}</Text>
                                    </View>
                                )}
                                <View style={styles.pkgRow}>
                                    <Text style={[styles.pkgTitle, { color: isSelected ? colors.primary : colors.text }]}>
                                        {isTurkish ? pkg.titleTr : pkg.titleEn}
                                    </Text>
                                    <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                                        {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                                    </View>
                                </View>
                                <Text style={[styles.pkgPrice, { color: colors.text }]}>${pkg.price.toFixed(2)}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={[styles.summary, { backgroundColor: colors.surface }]}>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Hizmet Bedeli' : 'Service Fee'}</Text>
                        <Text style={[styles.sumValue, { color: colors.text }]}>{selectedPackage.price.toFixed(2)} ₺</Text>
                    </View>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Platform Komisyonu (%10, min 300₺)' : 'Platform Fee (10%, min 300₺)'}</Text>
                        <Text style={[styles.sumValue, { color: colors.textSecondary }]}>
                            {Math.max(selectedPackage.price * 0.10, 300).toFixed(2)} ₺
                        </Text>
                    </View>
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Ön Ödeme (Depozito)' : 'Upfront Deposit'}</Text>
                        <Text style={[styles.sumValue, { color: '#16A34A' }]}>-300.00 ₺</Text>
                    </View>
                    <View style={[styles.sumDivider, { backgroundColor: colors.borderLight }]} />
                    <View style={styles.sumRow}>
                        <Text style={[styles.sumTotal, { color: colors.text }]}>{isTurkish ? 'Kullanıcının Ödeyeceği' : 'Client Pays'}</Text>
                        <Text style={[styles.sumTotalValue, { color: colors.primary }]}>{selectedPackage.price.toFixed(2)} ₺</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.payBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleHire}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.payBtnText}>
                            {isTurkish ? 'Ödemeyi Tamamla ve Başla' : 'Complete Payment & Start'}
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={[styles.terms, { color: colors.textSecondary }]}>
                    {isTurkish 
                        ? 'Güvenli ödeme yapıyorsunuz. İhtilaf durumunda NextSelf güvencesi altındasınız.' 
                        : 'Secure payment. You are under NextSelf protection in case of dispute.'}
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.section },
    profCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        marginBottom: SPACING.xl,
        ...SHADOWS.sm,
    },
    profInfo: { marginLeft: SPACING.md, flex: 1 },
    profName: { ...TYPOGRAPHY.h3 },
    profRole: { ...TYPOGRAPHY.body },
    sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
    packagesContainer: { gap: SPACING.md, marginBottom: SPACING.xl },
    packageCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    popularText: { ...TYPOGRAPHY.small, color: '#FFF', fontWeight: 'bold', fontSize: 10 },
    pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pkgTitle: { ...TYPOGRAPHY.h3 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    pkgPrice: { ...TYPOGRAPHY.h2, marginTop: SPACING.xs },
    summary: {
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sumLabel: { ...TYPOGRAPHY.body },
    sumValue: { ...TYPOGRAPHY.bodyBold },
    sumDivider: { height: 1, marginVertical: SPACING.xs },
    sumTotal: { ...TYPOGRAPHY.h3 },
    sumTotalValue: { ...TYPOGRAPHY.h2 },
    payBtn: {
        paddingVertical: 18,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    payBtnText: { ...TYPOGRAPHY.bodyBold, color: '#FFF', fontSize: 18 },
    terms: { ...TYPOGRAPHY.caption, textAlign: 'center', lineHeight: 20 },
});

export default HireProfessionalScreen;
