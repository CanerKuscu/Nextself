import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { SupabaseService } from '../services/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';

export default function QRScannerScreen() {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const { t } = useLanguage();
    const { showAlert, AlertComponent } = useAlert();

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (hasPermission === false) {
        return (
            <View style={styles.centered}>
                <Text style={styles.text}>{t('camera_permission_required')}</Text>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        if (scanned || verifying) return;
        setScanned(true);
        setVerifying(true);

        try {
            // Davet QR kodu mu kontrol et (JSON formatında)
            let isInvite = false;
            let invitePayload = null;
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'invite') {
                    isInvite = true;
                    invitePayload = parsed;
                }
            } catch (e) {
                // JSON değilse check-in token'ı olarak devam et
            }

            if (isInvite) {
                // @ts-ignore
                navigation.navigate('ReviewOffer', { inviteData: invitePayload });
                return;
            }

            const { data: { session } } = await SupabaseService.getInstance().getClient().auth.getSession();

            // Edge Function çağrısı yaparak QR kodunu doğrula
            const response = await fetch('https://[YOUR_PROJECT_REF].supabase.co/functions/v1/verify-qr-checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ qrToken: data })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || result.error || t('verification_failed'));
            }

            showAlert({
                title: t('success_title'),
                message: t('session_verified_desc'),
                type: 'success',
                buttons: [{ text: t('ok'), onPress: () => navigation.goBack() }]
            });

        } catch (error: any) {
            showAlert({
                title: t('error_title'),
                message: error.message,
                type: 'error',
                buttons: [{ text: t('try_again'), onPress: () => { setScanned(false); setVerifying(false); } }]
            });
        }
    };

    // Ekran tekrar odaklandığında kamerayı sıfırla (ReviewOffer'dan dönüldüğünde)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setScanned(false);
            setVerifying(false);
        });
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <AlertComponent />
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            <View style={styles.overlay}>
                <View style={styles.scanArea} />
                <Text style={styles.instructionText}>{t('scan_pt_qr')}</Text>
                {verifying && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={styles.loadingText}>{t('verifying')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    text: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#4f46e5',
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: 'white',
        fontSize: 18,
        marginTop: 40,
        fontWeight: 'bold'
    },
    loadingContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        color: '#4f46e5',
        fontWeight: 'bold'
    }
});
