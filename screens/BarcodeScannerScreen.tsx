import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES } from '../config/theme';
import AnimatedButton from '../components/AnimatedButton';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { useAlert } from '../components/CustomAlert';

export default function BarcodeScannerScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();

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
        safeGoBack(navigation, 'Nutrition');
    };

    const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
        setScanned(true);
        setLoadingProduct(true);
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(data)}.json`);
            const payload = await response.json();
            const product = payload?.product;

            if (!product) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Ürün Bulunamadı' : 'Product Not Found',
                    message: isTurkish ? 'Bu barkod için ürün verisi bulunamadı.' : 'No product data found for this barcode.',
                    buttons: [
                        { text: isTurkish ? 'Tekrar Okut' : 'Scan Again', onPress: () => setScanned(false) },
                        { text: isTurkish ? 'Kapat' : 'Close', onPress: () => safeGoBack(navigation, 'Nutrition') }
                    ],
                });
                return;
            }

            const nutriments = product.nutriments || {};
            const calories = Number(nutriments['energy-kcal_100g'] || nutriments.energy_kcal_100g || 0);
            const protein = Number(nutriments.proteins_100g || 0);
            const carbs = Number(nutriments.carbohydrates_100g || 0);
            const fat = Number(nutriments.fat_100g || 0);
            const foodName = (isTurkish ? (product.product_name_tr || product.product_name) : (product.product_name || product.product_name_tr)) || (isTurkish ? 'Bilinmeyen Ürün' : 'Unknown Product');
            const brand = product.brands || null;
            const imageUrl = product.image_front_url || product.image_url || null;

            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (user) {
                await supabase.logFoodScan(user.id, {
                    barcode: data,
                    food_name: foodName,
                    brand: brand,
                    calories,
                    protein,
                    carbs,
                    fat,
                    image_url: imageUrl,
                    serving_size: '100',
                    serving_unit: 'g',
                });
            }

            showAlert({
                type: 'confirm',
                title: foodName,
                message: `${isTurkish ? '100g için' : 'Per 100g'}: ${Math.round(calories)} kcal • P ${Math.round(protein)}g • K ${Math.round(carbs)}g • Y ${Math.round(fat)}g`,
                buttons: [
                    { text: isTurkish ? 'Tekrar Okut' : 'Scan Again', onPress: () => setScanned(false) },
                    {
                        text: isTurkish ? 'Günlüğe Ekle' : 'Add to Diary',
                        onPress: async () => {
                            try {
                                if (user) {
                                    const { error } = await supabase.getClient()
                                        .from('nutrition_logs')
                                        .insert({
                                            user_id: user.id,
                                            food_name: foodName,
                                            calories: Math.round(calories),
                                            protein: Math.round(protein),
                                            carbs: Math.round(carbs),
                                            fat: Math.round(fat),
                                            source: 'barcode_scan',
                                            logged_at: new Date().toISOString(),
                                        });
                                    if (error) throw error;
                                }
                                showAlert({
                                    type: 'success',
                                    title: isTurkish ? 'Eklendi' : 'Added',
                                    message: isTurkish ? 'Ürün beslenme günlüğüne eklendi.' : 'Product added to nutrition diary.',
                                    buttons: [{ text: 'OK', onPress: () => safeGoBack(navigation, 'Nutrition') }],
                                });
                            } catch {
                                showAlert({
                                    type: 'error',
                                    title: isTurkish ? 'Hata' : 'Error',
                                    message: isTurkish ? 'Günlüğe eklenemedi.' : 'Failed to add to diary.',
                                    buttons: [{ text: 'OK', onPress: () => setScanned(false) }],
                                });
                            }
                        },
                    },
                ],
            });
        } catch {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Tarama Hatası' : 'Scan Error',
                message: isTurkish ? 'Barkod bilgisi alınamadı. Lütfen tekrar deneyin.' : 'Failed to fetch barcode details. Please try again.',
                buttons: [{ text: isTurkish ? 'Tekrar Dene' : 'Try Again', onPress: () => setScanned(false) }],
            });
        } finally {
            setLoadingProduct(false);
        }
    };

    if (hasPermission === null) {
        return <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]} />;
    }
    if (hasPermission === false) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center, { backgroundColor: colors.background }]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg }}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'No access to camera.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => safeGoBack(navigation, 'Nutrition')} />
            </View>
        );
    }

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="barcode_scanner"
                onAccept={handleConsentAccepted}
                onDecline={handleConsentDeclined}
            />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Nutrition')} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? colors.text : colors.textInverse} />
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
                        {loadingProduct ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="small" color={isDark ? colors.text : colors.textInverse} />
                                <Text style={styles.loadingText}>{isTurkish ? 'Ürün bilgisi alınıyor...' : 'Fetching product details...'}</Text>
                            </View>
                        ) : (
                            <AnimatedButton
                                title={isTurkish ? 'Tekrar Okut' : 'Scan Again'}
                                onPress={() => setScanned(false)}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, backgroundColor: colors.background },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent', borderRadius: 16 },
    scanText: { ...TYPOGRAPHY.bodyBold, color: isDark ? colors.text : colors.textInverse, marginTop: SPACING.xl, textAlign: 'center' },
    scannedContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
    loadingText: { ...TYPOGRAPHY.caption, color: isDark ? colors.text : colors.textInverse }
});
