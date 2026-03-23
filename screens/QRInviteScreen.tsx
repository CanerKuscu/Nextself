import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useLanguage } from '../contexts/LanguageContext';
import { useAlert } from '../components/CustomAlert';
import { safeGoBack } from '../utils/navigation';

export default function QRInviteScreen() {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { t } = useLanguage();
    const { showAlert, AlertComponent } = useAlert();

    const [agreedPrice, setAgreedPrice] = useState('');
    const [durationMonths, setDurationMonths] = useState<number>(1);
    const [serviceType, setServiceType] = useState<'online' | 'face_to_face' | 'hybrid'>('online');
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<string | null>(null);

    const generateInviteQR = async () => {
        if (!agreedPrice || isNaN(Number(agreedPrice)) || Number(agreedPrice) <= 0) {
            showAlert({ title: "Hata", message: "Lütfen geçerli bir tutar girin.", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await SupabaseService.getInstance().getClient().auth.getUser();
            if (!user) throw new Error("Kullanıcı bulunamadı");

            // QR Datası: Davet eden PT, Süre ve Fiyat
            const inviteData = {
                type: 'invite',
                ptId: user.id,
                price: Number(agreedPrice),
                duration: durationMonths,
                serviceType: serviceType,
                timestamp: Date.now()
            };

            setQrData(JSON.stringify(inviteData));

        } catch (error: any) {
            showAlert({ title: "Hata", message: error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const getServiceTypeLabel = (type: string) => {
        switch(type) {
            case 'online': return 'Uzaktan (Online)';
            case 'face_to_face': return 'Yüz Yüze';
            case 'hybrid': return 'Hibrit';
            default: return type;
        }
    };

    return (
        <View style={styles.container}>
            <AlertComponent />
            <Text style={styles.title}>Yeni Müşteri Davet Et</Text>

            {!qrData ? (
                <>
                    <Text style={styles.description}>
                        Müşteriniz ile anlaştığınız tutar, süre ve hizmet tipini girerek bir davet QR kodu oluşturun.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Hizmet Tipi</Text>
                        <View style={styles.durationContainer}>
                            {(['online', 'face_to_face', 'hybrid'] as const).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.durationButton, serviceType === type && styles.durationButtonActive]}
                                    onPress={() => setServiceType(type)}
                                >
                                    <Text style={[styles.durationText, serviceType === type && styles.durationTextActive]}>
                                        {type === 'online' ? 'Uzaktan' : type === 'face_to_face' ? 'Yüz Yüze' : 'Hibrit'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Anlaşılan Toplam Tutar (TL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: 6000"
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

                    <TouchableOpacity style={styles.button} onPress={generateInviteQR} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>QR Kod Oluştur</Text>}
                    </TouchableOpacity>
                </>
            ) : (
                <View style={styles.qrContainer}>
                    <Text style={styles.qrInstruction}>Müşterinizden NextSelf uygulamasını açarak "QR Okut" bölümünden aşağıdaki kodu okutmasını isteyin.</Text>

                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrData}
                            size={250}
                            color="black"
                            backgroundColor="white"
                        />
                    </View>

                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>Hizmet: {getServiceTypeLabel(serviceType)}</Text>
                        <Text style={styles.summaryText}>Tutar: {agreedPrice} TL</Text>
                        <Text style={styles.summaryText}>Süre: {durationMonths} Ay</Text>
                    </View>

                    <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => safeGoBack(navigation, 'ProfessionalHome')}>
                        <Text style={[styles.buttonText, styles.outlineButtonText]}>Kapat ve Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1f2937' },
    description: { fontSize: 14, color: '#4b5563', marginBottom: 30, textAlign: 'center', lineHeight: 22 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#374151' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', padding: 15, borderRadius: 8, fontSize: 16 },
    durationContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    durationButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginHorizontal: 4, alignItems: 'center', backgroundColor: '#fff' },
    durationButtonActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
    durationText: { fontSize: 14, color: '#4b5563' },
    durationTextActive: { color: '#4f46e5', fontWeight: 'bold' },
    button: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    qrContainer: { alignItems: 'center', padding: 10 },
    qrInstruction: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    qrWrapper: { padding: 20, backgroundColor: '#fff', borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 30 },
    summaryContainer: { width: '100%', backgroundColor: '#eef2ff', padding: 15, borderRadius: 10, marginBottom: 30, alignItems: 'center' },
    summaryText: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5', marginVertical: 4 },
    outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4f46e5', width: '100%' },
    outlineButtonText: { color: '#4f46e5' }
});
