"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BarcodeScannerScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_camera_1 = require("expo-camera");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const BiometricConsentModal_1 = __importDefault(require("../components/BiometricConsentModal"));
const agreementService_1 = require("../services/agreementService");
const supabase_1 = require("../services/supabase");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const CustomAlert_1 = require("../components/CustomAlert");
function BarcodeScannerScreen({ navigation }) {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [hasPermission, setHasPermission] = (0, react_1.useState)(null);
    const [scanned, setScanned] = (0, react_1.useState)(false);
    const [loadingProduct, setLoadingProduct] = (0, react_1.useState)(false);
    const [showConsentModal, setShowConsentModal] = (0, react_1.useState)(false);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    (0, react_1.useEffect)(() => {
        const checkConsentAndPermission = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = yield agreementService_1.AgreementService.getInstance().hasBiometricConsent(user.id, 'barcode_scanner');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                        return;
                    }
                }
            }
            catch (err) {
                console.warn('Consent check error:', err);
            }
            const { status } = yield expo_camera_1.Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        });
        checkConsentAndPermission();
    }, []);
    const handleConsentAccepted = () => __awaiter(this, void 0, void 0, function* () {
        setShowConsentModal(false);
        const { status } = yield expo_camera_1.Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    });
    const handleConsentDeclined = () => {
        setShowConsentModal(false);
        (0, navigation_1.safeGoBack)(navigation, 'Nutrition');
    };
    const handleBarcodeScanned = (_a) => __awaiter(this, [_a], void 0, function* ({ data }) {
        setScanned(true);
        setLoadingProduct(true);
        try {
            const response = yield fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(data)}.json`);
            const payload = yield response.json();
            const product = payload === null || payload === void 0 ? void 0 : payload.product;
            if (!product) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Ürün Bulunamadı' : 'Product Not Found',
                    message: isTurkish ? 'Bu barkod için ürün verisi bulunamadı.' : 'No product data found for this barcode.',
                    buttons: [
                        { text: isTurkish ? 'Tekrar Okut' : 'Scan Again', onPress: () => setScanned(false) },
                        { text: isTurkish ? 'Kapat' : 'Close', onPress: () => (0, navigation_1.safeGoBack)(navigation, 'Nutrition') }
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
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                yield supabase.logFoodScan(user.id, {
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
                        onPress: () => __awaiter(this, void 0, void 0, function* () {
                            try {
                                if (user) {
                                    const { error } = yield supabase.getClient()
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
                                    if (error)
                                        throw error;
                                }
                                showAlert({
                                    type: 'success',
                                    title: isTurkish ? 'Eklendi' : 'Added',
                                    message: isTurkish ? 'Ürün beslenme günlüğüne eklendi.' : 'Product added to nutrition diary.',
                                    buttons: [{ text: 'OK', onPress: () => (0, navigation_1.safeGoBack)(navigation, 'Nutrition') }],
                                });
                            }
                            catch (_a) {
                                showAlert({
                                    type: 'error',
                                    title: isTurkish ? 'Hata' : 'Error',
                                    message: isTurkish ? 'Günlüğe eklenemedi.' : 'Failed to add to diary.',
                                    buttons: [{ text: 'OK', onPress: () => setScanned(false) }],
                                });
                            }
                        }),
                    },
                ],
            });
        }
        catch (_b) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Tarama Hatası' : 'Scan Error',
                message: isTurkish ? 'Barkod bilgisi alınamadı. Lütfen tekrar deneyin.' : 'Failed to fetch barcode details. Please try again.',
                buttons: [{ text: isTurkish ? 'Tekrar Dene' : 'Try Again', onPress: () => setScanned(false) }],
            });
        }
        finally {
            setLoadingProduct(false);
        }
    });
    if (hasPermission === null) {
        return <react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}/>;
    }
    if (hasPermission === false) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}>
                <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { textAlign: 'center', padding: theme_1.SPACING.lg })}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'No access to camera.'}
                </react_native_1.Text>
                <AnimatedButton_1.default title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Nutrition')}/>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            <BiometricConsentModal_1.default visible={showConsentModal} consentType="barcode_scanner" onAccept={handleConsentAccepted} onDecline={handleConsentDeclined}/>

            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Nutrition')} style={styles.backBtn} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Ürün Okut' : 'Scan Product'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            <react_native_1.View style={styles.cameraContainer}>
                <expo_camera_1.CameraView style={react_native_1.StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={scanned ? undefined : handleBarcodeScanned} barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'],
        }}/>

                {/* Scanner Overlay UI */}
                <react_native_1.View style={styles.overlay}>
                    <react_native_1.View style={styles.scanFrame}/>
                    <react_native_1.Text style={styles.scanText}>
                        {isTurkish ? 'Barkodu çerçeve içine yerleştirin' : 'Place barcode inside the frame'}
                    </react_native_1.Text>
                </react_native_1.View>

                {scanned && (<react_native_1.View style={styles.scannedContainer}>
                        {loadingProduct ? (<react_native_1.View style={styles.loadingWrap}>
                                <react_native_1.ActivityIndicator size="small" color="#fff"/>
                                <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Ürün bilgisi alınıyor...' : 'Fetching product details...'}</react_native_1.Text>
                            </react_native_1.View>) : (<AnimatedButton_1.default title={isTurkish ? 'Tekrar Okut' : 'Scan Again'} onPress={() => setScanned(false)}/>)}
                    </react_native_1.View>)}
            </react_native_1.View>
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.md, backgroundColor: colors.background },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    overlay: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }),
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent', borderRadius: 16 },
    scanText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', marginTop: theme_1.SPACING.xl, textAlign: 'center' }),
    scannedContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
    loadingText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: '#fff' })
});
