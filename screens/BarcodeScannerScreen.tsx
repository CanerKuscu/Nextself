import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES } from '../config/theme';
import AnimatedButton from '../components/AnimatedButton';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';

export default function BarcodeScannerScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const checkConsentAndPermission = async () => {
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'barcode_scanner');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Consent check error:', err);
            }
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        checkConsentAndPermission();
    }, []);

    const handleConsentAccepted = async () => {
        setShowConsentModal(false);
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleConsentDeclined = () => {
        setShowConsentModal(false);
        navigation.goBack();
    };

    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        // In a real app, you would fetch product data using this barcode from an API (e.g. OpenFoodFacts)
        alert((isTurkish ? 'Barkod okundu: ' : 'Barcode scanned: ') + data);

        // Mock returning to previous screen after a delay
        setTimeout(() => {
            navigation.goBack();
        }, 1500);
    };

    if (hasPermission === null) {
        return <View style={COMMON_STYLES.screenContainer} />;
    }
    if (hasPermission === false) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg }}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'No access to camera.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => navigation.goBack()} />
            </View>
        );
    }

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="barcode_scanner"
                onAccept={handleConsentAccepted}
                onDecline={handleConsentDeclined}
            />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Ürün Okut' : 'Scan Product'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'],
                    }}
                />

                {/* Scanner Overlay UI */}
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.scanText}>
                        {isTurkish ? 'Barkodu çerçeve içine yerleştirin' : 'Place barcode inside the frame'}
                    </Text>
                </View>

                {scanned && (
                    <View style={styles.scannedContainer}>
                        <AnimatedButton
                            title={isTurkish ? 'Tekrar Okut' : 'Scan Again'}
                            onPress={() => setScanned(false)}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, backgroundColor: colors.background },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent', borderRadius: 16 },
    scanText: { ...TYPOGRAPHY.bodyBold, color: '#fff', marginTop: SPACING.xl, textAlign: 'center' },
    scannedContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' }
});
