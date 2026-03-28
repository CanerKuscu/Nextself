import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { SupabaseService } from '@nextself/shared';
import { useAlert } from '../components/CustomAlert';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';

export const calculateDepositAmount = (months: number) => {
    if (months === 3) return 750;
    if (months === 6) return 1250;
    if (months === 12) return 2000;
    return 300 * months;
};

export default function ProfessionalCheckoutScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const route = useRoute();
    const { clientId, clientName } = route.params as { clientId: string, clientName: string };

    const [agreedPrice, setAgreedPrice] = useState('');
    const [durationMonths, setDurationMonths] = useState<number>(1);
    const [loading, setLoading] = process.env.NODE_ENV === 'development' ? useState(false) : useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const { showAlert, AlertComponent } = useAlert();

    const handleActivate = async () => {
        if (!agreedPrice || isNaN(Number(agreedPrice)) || Number(agreedPrice) <= 0) {
            showAlert({ title: "Hata", message: "Lütfen geçerli bir aylık tutar giriniz.", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const supabaseClient = SupabaseService.getInstance().getClient();
            const { data, error } = await supabaseClient.functions.invoke('process-client-activation', {
                body: {
                    clientId: clientId,
                    agreedPrice: Number(agreedPrice),
                    durationMonths: durationMonths
                }
            });

            if (error || !data?.success) {
                throw new Error(data?.message || data?.error || error?.message || "Ödeme başlatılamadı");
            }

            // Iyzico Payment URL
            if (data.paymentPageUrl) {
                setPaymentUrl(data.paymentPageUrl);
            } else {
                showAlert({
                    title: "Başarılı",
                    message: "Müşteri başarıyla aktifleştirildi!",
                    type: "success",
                    buttons: [{ text: "OK", onPress: () => safeGoBack(navigation, 'ProfessionalHome') }]
                });
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Ödeme başlatılamadı";
            showAlert({ title: "Aktivasyon Hatası", message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (paymentUrl) {
        return (
            <WebView
                source={{ uri: paymentUrl }}
                style={{ flex: 1 }}
                onNavigationStateChange={(navState) => {
                    // Iyzico dönüş sayfasını yakala
                    if (navState.url.includes('/payment/callback')) {
                        showAlert({
                            title: "Ödeme Tamamlandı",
                            message: `${calculateDepositAmount(durationMonths)} TL Depozito başarıyla tahsil edildi. Müşteriniz aktif!`,
                            type: "success",
                            buttons: [{
                                text: "OK", onPress: () => {
                                    setPaymentUrl(null);
                                    safeGoBack(navigation, 'ProfessionalHome');
                                }
                            }]
                        });
                    }
                }}
            />
        );
    }

    return (
        <View style={styles.container}>
            <AlertComponent />
            <Text style={styles.title}>{clientName} Aktivasyonu</Text>
            <Text style={styles.description}>
                Müşterinizi sisteme dahil etmek için anlaştığınız aylık ücreti giriniz.
                Sistem otomatik olarak %10 komisyon üzerinden minimum 300 TL aktivasyon (peşinat) bedeli çıkaracaktır.
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Anlaşılan Toplam Tutar (TL)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Örn: 6000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={agreedPrice}
                    onChangeText={setAgreedPrice}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Hizmet Süresi (Ay)</Text>
                <View style={styles.durationContainer}>
                    {[1, 3, 6, 12].map(months => (
                        <TouchableOpacity
                            key={months}
                            style={[styles.durationButton, durationMonths === months && styles.durationButtonActive]}
                            onPress={() => setDurationMonths(months)}
                        >
                            <Text style={[styles.durationText, durationMonths === months && styles.durationTextActive]}>
                                {months} Ay
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>Aktivasyon Depozitosu (Peşinat): {calculateDepositAmount(durationMonths)} TL</Text>
                <Text style={styles.summarySubText}>
                    Anlaşılan Toplam Tutarın %10 komisyonu sistem tarafından hesaplanır. Eğer komisyon tutarı bu depozito tutarından fazlaysa, aradaki fark ay sonunda faturanıza yansıtılır.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleActivate}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Ödemeye Geç (Iyzico)</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: colors.background, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: colors.text },
    description: { fontSize: 14, color: colors.textSecondary, marginBottom: 30, textAlign: 'center', lineHeight: 20 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 15, borderRadius: 8, fontSize: 16, textAlignVertical: 'center' },
    summaryContainer: { backgroundColor: colors.primarySoft, padding: 15, borderRadius: 8, marginBottom: 30 },
    summaryText: { fontSize: 16, color: '#4f46e5', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    summarySubText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
    button: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    durationContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    durationButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', backgroundColor: colors.surface },
    durationButtonActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
    durationText: { fontSize: 14, color: colors.textSecondary },
    durationTextActive: { color: '#4f46e5', fontWeight: 'bold' }
});
