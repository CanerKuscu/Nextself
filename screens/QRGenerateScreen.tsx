import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SupabaseService } from '../services/supabase';
import { useRoute } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';

export default function QRGenerateScreen() {
    const route = useRoute();
    const { relationshipId, clientName } = route.params as { relationshipId: string, clientName: string };

    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const { t } = useLanguage();
    const { showAlert, AlertComponent } = useAlert();

    useEffect(() => {
        generateQRToken();
    }, []);

    // QR Okutuldu mu diye düzenli kontrol et
    useEffect(() => {
        if (!qrToken) return;

        const interval = setInterval(async () => {
            const { data, error } = await SupabaseService.getInstance().getClient()
                .from('session_checkins')
                .select('is_verified')
                .eq('qr_token', qrToken)
                .single();

            if (data && data.is_verified) {
                setIsVerified(true);
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [qrToken]);

    const generateQRToken = async () => {
        setLoading(true);
        try {
            const uniqueToken = `BIO-QR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            const { error } = await SupabaseService.getInstance().getClient()
                .from('session_checkins')
                .insert({
                    client_relationship_id: relationshipId,
                    qr_token: uniqueToken,
                    is_verified: false
                });

            if (error) throw error;
            setQrToken(uniqueToken);
        } catch (error: any) {
            showAlert({
                title: t('error_title'),
                message: t('qr_generation_failed') + error.message,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AlertComponent />
            <Text style={styles.title}>{clientName} - {t('session_start')}</Text>

            {isVerified ? (
                <View style={styles.successContainer}>
                    <Text style={styles.successText}>{t('face_to_face_verified')}</Text>
                    <Text style={styles.subText}>{t('you_can_start_session')}</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.instruction}>
                        {t('instruction_qr_scan')}
                    </Text>

                    <View style={styles.qrContainer}>
                        {loading || !qrToken ? (
                            <ActivityIndicator size="large" color="#4f46e5" />
                        ) : (
                            <QRCode
                                value={qrToken}
                                size={250}
                                color="black"
                                backgroundColor="white"
                            />
                        )}
                    </View>
                    <Text style={styles.waitingText}>{t('waiting_for_client_scan')}</Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    instruction: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 40, paddingHorizontal: 20 },
    qrContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    waitingText: { marginTop: 30, fontSize: 16, color: '#4f46e5', fontStyle: 'italic' },
    successContainer: { padding: 30, backgroundColor: '#eef2ff', borderRadius: 15, alignItems: 'center' },
    successText: { fontSize: 20, fontWeight: 'bold', color: '#16a34a', marginBottom: 10 },
    subText: { fontSize: 16, color: '#666' }
});
