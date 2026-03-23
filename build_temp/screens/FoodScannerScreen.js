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
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const ImagePicker = __importStar(require("expo-image-picker"));
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const BiometricConsentModal_1 = __importDefault(require("../components/BiometricConsentModal"));
const aiService_1 = require("../services/aiService");
const agreementService_1 = require("../services/agreementService");
const supabase_1 = require("../services/supabase");
const missionService_1 = require("../services/missionService");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const FoodScannerScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [imageUri, setImageUri] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [weight, setWeight] = (0, react_1.useState)('100');
    const [weightError, setWeightError] = (0, react_1.useState)(null);
    const [showConsentModal, setShowConsentModal] = (0, react_1.useState)(false);
    const [pendingSource, setPendingSource] = (0, react_1.useState)(null);
    const validateWeight = (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            setWeightError(isTurkish ? 'Geçerli bir ağırlık girin' : 'Enter a valid weight');
            return false;
        }
        if (num > 5000) {
            setWeightError(isTurkish ? 'Maksimum 5000g' : 'Maximum 5000g');
            return false;
        }
        setWeightError(null);
        return true;
    };
    const checkConsentAndPick = (source) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            if (user) {
                const hasConsent = yield agreementService_1.AgreementService.getInstance().hasBiometricConsent(user.id, 'food_scanner');
                if (!hasConsent) {
                    setPendingSource(source);
                    setShowConsentModal(true);
                    return;
                }
            }
        }
        catch (err) {
            console.warn('Consent check error:', err);
        }
        pickImage(source);
    });
    const handleConsentAccepted = () => {
        setShowConsentModal(false);
        if (pendingSource) {
            pickImage(pendingSource);
            setPendingSource(null);
        }
    };
    const handleConsentDeclined = () => {
        setShowConsentModal(false);
        setPendingSource(null);
    };
    const pickImage = (source) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (source === 'camera') {
                const { status } = yield ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert(isTurkish ? 'Kamera izni gerekiyor!' : 'Camera permission is required!');
                    return;
                }
            }
            else {
                const { status } = yield ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert(isTurkish ? 'Galeri izni gerekiyor!' : 'Gallery permission is required!');
                    return;
                }
            }
            const result = source === 'camera'
                ? yield ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                })
                : yield ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                analyzeImage(result.assets[0].uri);
            }
        }
        catch (error) {
            console.error('Image picking error:', error);
        }
    });
    const analyzeImage = (uri) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setResult(null);
        try {
            const scanResult = yield aiService_1.AIService.getInstance().scanFood(uri, isTurkish ? 'tr' : 'en');
            setResult(scanResult);
        }
        catch (error) {
            console.error('Scan failed:', error);
            alert(isTurkish ? 'Tarama başarısız oldu, lütfen tekrar deneyin.' : 'Scan failed, please try again.');
        }
        finally {
            setLoading(false);
        }
    });
    const resetScan = () => {
        setImageUri(null);
        setResult(null);
        setWeight('100');
    };
    const parsedWeight = parseFloat(weight) || 100;
    const macroMultiplier = parsedWeight / 100;
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <BiometricConsentModal_1.default visible={showConsentModal} consentType="food_scanner" onAccept={handleConsentAccepted} onDecline={handleConsentDeclined}/>

            {/* Header */}
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Nutrition')} style={styles.backBtn} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'AI Besin Tarama' : 'AI Food Scanner'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {!imageUri ? (<react_native_1.View style={styles.emptyState}>
                        <react_native_1.View style={styles.iconCircle}>
                            <vector_icons_1.Ionicons name="scan" size={48} color={colors.primary}/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.emptyTitle}>
                            {isTurkish ? 'Ne yediğinizi merak mı ediyorsunuz?' : 'Wondering what you\'re eating?'}
                        </react_native_1.Text>
                        <react_native_1.Text style={styles.emptySub}>
                            {isTurkish
                ? 'Yemeğinizin fotoğrafını çekin, kalori ve makrolarını yapay zeka saniyeler içinde analiz etsin.'
                : 'Snap a picture of your food and let AI analyze calories and macros in seconds.'}
                        </react_native_1.Text>

                        <react_native_1.View style={styles.actionButtons}>
                            <AnimatedButton_1.default title={isTurkish ? 'Kamera ile Çek' : 'Take a Photo'} onPress={() => checkConsentAndPick('camera')} style={{ marginBottom: theme_1.SPACING.md }}/>
                            <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={() => checkConsentAndPick('gallery')} activeOpacity={1}>
                                <vector_icons_1.Ionicons name="image-outline" size={20} color={colors.primary} style={{ marginRight: 8 }}/>
                                <react_native_1.Text style={styles.secondaryBtnText}>{isTurkish ? 'Galeriden Seç' : 'Choose from Gallery'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.secondaryBtn, { marginTop: theme_1.SPACING.md, backgroundColor: colors.surfaceSecondary }]} onPress={() => navigation.navigate('BarcodeScanner')} activeOpacity={1}>
                                <vector_icons_1.Ionicons name="barcode-outline" size={20} color={colors.text} style={{ marginRight: 8 }}/>
                                <react_native_1.Text style={[styles.secondaryBtnText, { color: colors.text }]}>{isTurkish ? 'Barkod Okut' : 'Scan Barcode'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>) : (<react_native_1.View style={styles.resultContainer}>
                        <react_native_1.View style={styles.imageWrapper}>
                            <react_native_1.Image source={{ uri: imageUri }} style={styles.image}/>
                            {loading && (<react_native_1.View style={styles.loadingOverlay}>
                                    <react_native_1.View style={styles.scanLine}/>
                                    <react_native_1.ActivityIndicator size="large" color="#fff"/>
                                    <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Analiz ediliyor...' : 'Analyzing...'}</react_native_1.Text>
                                </react_native_1.View>)}
                        </react_native_1.View>

                        {result && !loading && (<AnimatedCard_1.default style={styles.resultCard}>
                                <react_native_1.View style={styles.resultHeader}>
                                    <react_native_1.View>
                                        <react_native_1.Text style={styles.foodName}>{result.name}</react_native_1.Text>
                                        <react_native_1.Text style={styles.confidenceText}>
                                            {result.confidence}% {isTurkish ? 'Eşleşme' : 'Match'}
                                        </react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={[styles.healthScore, { backgroundColor: result.healthScore > 7 ? colors.successSoft : colors.warningSoft }]}>
                                        <react_native_1.Text style={[styles.healthScoreText, { color: result.healthScore > 7 ? colors.success : colors.warning }]}>
                                            {result.healthScore}/10
                                        </react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>

                                <react_native_1.View style={styles.weightInputContainer}>
                                    <react_native_1.Text style={styles.weightLabel}>{isTurkish ? 'Porsiyon (Gram):' : 'Portion (Grams):'}</react_native_1.Text>
                                    <react_native_1.View style={styles.weightInputWrapper}>
                                        <react_native_1.TextInput style={[styles.weightInput, { backgroundColor: colors.background, color: colors.text }, weightError && styles.weightInputError]} keyboardType="numeric" value={weight} onChangeText={(text) => {
                    setWeight(text);
                    validateWeight(text);
                }} maxLength={4}/>
                                        <react_native_1.Text style={styles.weightUnit}>g</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>
                                {weightError && (<react_native_1.Text style={styles.errorText}>{weightError}</react_native_1.Text>)}

                                <react_native_1.View style={styles.macrosContainer}>
                                    <react_native_1.View style={styles.macroItem}>
                                        <react_native_1.Text style={styles.macroVal}>{Math.round(result.calories * macroMultiplier)}</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>kcal</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroDivider}/>
                                    <react_native_1.View style={styles.macroItem}>
                                        <react_native_1.Text style={styles.macroVal}>{Math.round(result.protein * macroMultiplier)}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{isTurkish ? 'Protein' : 'Protein'}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroDivider}/>
                                    <react_native_1.View style={styles.macroItem}>
                                        <react_native_1.Text style={styles.macroVal}>{Math.round(result.carbs * macroMultiplier)}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{isTurkish ? 'Karb' : 'Carbs'}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroDivider}/>
                                    <react_native_1.View style={styles.macroItem}>
                                        <react_native_1.Text style={styles.macroVal}>{Math.round(result.fats * macroMultiplier)}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{isTurkish ? 'Yağ' : 'Fat'}</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>

                                {result.ingredients && result.ingredients.length > 0 && (<react_native_1.View style={styles.ingredientsSection}>
                                        <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Tespit Edilen İçerikler' : 'Detected Ingredients'}</react_native_1.Text>
                                        <react_native_1.View style={styles.tagsContainer}>
                                            {result.ingredients.map((ing, idx) => (<react_native_1.View key={idx} style={styles.tag}>
                                                    <react_native_1.Text style={styles.tagText}>{ing}</react_native_1.Text>
                                                </react_native_1.View>))}
                                        </react_native_1.View>
                                    </react_native_1.View>)}

                                {/* Micro-nutrients */}
                                {(result.fiber || result.sugar || result.sodium || (result.vitamins && result.vitamins.length > 0)) && (<react_native_1.View style={styles.ingredientsSection}>
                                        <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Mikro Besinler' : 'Micro-nutrients'}</react_native_1.Text>
                                        <react_native_1.View style={styles.microGrid}>
                                            {result.fiber != null && result.fiber > 0 && (<react_native_1.View style={styles.microItem}>
                                                    <vector_icons_1.Ionicons name="leaf-outline" size={16} color="#58CC02"/>
                                                    <react_native_1.Text style={styles.microValue}>{Math.round(result.fiber * macroMultiplier)}g</react_native_1.Text>
                                                    <react_native_1.Text style={styles.microLabel}>{isTurkish ? 'Lif' : 'Fiber'}</react_native_1.Text>
                                                </react_native_1.View>)}
                                            {result.sugar != null && result.sugar > 0 && (<react_native_1.View style={styles.microItem}>
                                                    <vector_icons_1.Ionicons name="cube-outline" size={16} color="#FF9600"/>
                                                    <react_native_1.Text style={styles.microValue}>{Math.round(result.sugar * macroMultiplier)}g</react_native_1.Text>
                                                    <react_native_1.Text style={styles.microLabel}>{isTurkish ? 'Şeker' : 'Sugar'}</react_native_1.Text>
                                                </react_native_1.View>)}
                                            {result.sodium != null && result.sodium > 0 && (<react_native_1.View style={styles.microItem}>
                                                    <vector_icons_1.Ionicons name="water-outline" size={16} color="#1CB0F6"/>
                                                    <react_native_1.Text style={styles.microValue}>{Math.round(result.sodium * macroMultiplier)}mg</react_native_1.Text>
                                                    <react_native_1.Text style={styles.microLabel}>{isTurkish ? 'Sodyum' : 'Sodium'}</react_native_1.Text>
                                                </react_native_1.View>)}
                                        </react_native_1.View>
                                        {result.vitamins && result.vitamins.length > 0 && (<react_native_1.View style={[styles.tagsContainer, { marginTop: theme_1.SPACING.sm }]}>
                                                {result.vitamins.map((vit, idx) => (<react_native_1.View key={idx} style={[styles.tag, { backgroundColor: '#E8FFE0', borderColor: '#58CC02' }]}>
                                                        <react_native_1.Text style={[styles.tagText, { color: '#58CC02' }]}>{vit}</react_native_1.Text>
                                                    </react_native_1.View>))}
                                            </react_native_1.View>)}
                                    </react_native_1.View>)}

                                <react_native_1.View style={styles.resultActions}>
                                    <AnimatedButton_1.default title={isTurkish ? 'Günlüğe Ekle' : 'Add to Diary'} onPress={() => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const supabase = supabase_1.SupabaseService.getInstance();
                        const { user } = yield supabase.getCurrentUser();
                        if (user && result) {
                            const { error } = yield supabase.getClient()
                                .from('nutrition_logs')
                                .insert({
                                user_id: user.id,
                                food_name: result.name,
                                calories: Math.round(result.calories * macroMultiplier),
                                protein: Math.round(result.protein * macroMultiplier),
                                carbs: Math.round(result.carbs * macroMultiplier),
                                fat: Math.round(result.fats * macroMultiplier),
                                source: 'ai_scan',
                                logged_at: new Date().toISOString(),
                            });
                            if (error)
                                throw error;
                            // Update Missions
                            try {
                                yield missionService_1.MissionService.getInstance().updateProgressByCategory('nutrition', 1);
                            }
                            catch (_a) { }
                            alert(isTurkish ? 'Beslenme günlüğüne eklendi!' : 'Added to nutrition diary!');
                            (0, navigation_1.safeGoBack)(navigation, 'Nutrition');
                        }
                    }
                    catch (err) {
                        console.error('Diary save error:', err);
                        alert(isTurkish ? 'Kaydedilemedi. Tekrar deneyin.' : 'Failed to save. Try again.');
                    }
                })} style={{ flex: 1, marginRight: theme_1.SPACING.md }}/>
                                    <react_native_1.TouchableOpacity style={styles.retakeBtn} onPress={resetScan} activeOpacity={1}>
                                        <vector_icons_1.Ionicons name="refresh" size={24} color={colors.textSecondary}/>
                                    </react_native_1.TouchableOpacity>
                                </react_native_1.View>

                                {/* Save as Custom Food */}
                                <react_native_1.TouchableOpacity style={styles.saveCustomBtn} onPress={() => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const supabase = supabase_1.SupabaseService.getInstance();
                        const { user } = yield supabase.getCurrentUser();
                        if (user && result) {
                            const { error } = yield supabase.getClient()
                                .from('custom_foods')
                                .insert({
                                user_id: user.id,
                                name: result.name,
                                calories_per_100g: result.calories,
                                protein_per_100g: result.protein,
                                carbs_per_100g: result.carbs,
                                fat_per_100g: result.fats,
                                fiber_per_100g: result.fiber || 0,
                                sugar_per_100g: result.sugar || 0,
                                sodium_per_100g: result.sodium || 0,
                                source: 'ai_scan',
                            });
                            if (error) {
                                console.error('Custom food save error:', error);
                                alert(isTurkish ? 'Kaydedilemedi.' : 'Failed to save.');
                                return;
                            }
                            alert(isTurkish ? 'Özel besin olarak kaydedildi!' : 'Saved as custom food!');
                        }
                    }
                    catch (err) {
                        console.error('Custom food error:', err);
                        alert(isTurkish ? 'Bir hata oluştu.' : 'An error occurred.');
                    }
                })} activeOpacity={1}>
                                    <vector_icons_1.Ionicons name="bookmark-outline" size={18} color={colors.primary}/>
                                    <react_native_1.Text style={styles.saveCustomBtnText}>
                                        {isTurkish ? 'Özel Besin Olarak Kaydet' : 'Save as Custom Food'}
                                    </react_native_1.Text>
                                </react_native_1.TouchableOpacity>
                            </AnimatedCard_1.default>)}
                    </react_native_1.View>)}
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    content: { flexGrow: 1, padding: theme_1.SPACING.lg },
    // Empty state
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: theme_1.SPACING.xxl },
    iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: theme_1.SPACING.xl },
    emptyTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text, textAlign: 'center', marginBottom: theme_1.SPACING.md }),
    emptySub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', marginBottom: theme_1.SPACING.xxl, paddingHorizontal: theme_1.SPACING.lg }),
    actionButtons: { width: '100%', paddingHorizontal: theme_1.SPACING.md },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.pill, backgroundColor: colors.primarySoft },
    secondaryBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.primary }),
    // Results
    resultContainer: { flex: 1 },
    imageWrapper: { width: '100%', height: 300, borderRadius: theme_1.BORDER_RADIUS.xl, overflow: 'hidden', marginBottom: theme_1.SPACING.lg, backgroundColor: colors.surfaceSecondary },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    loadingOverlay: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }),
    scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
    loadingText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', marginTop: theme_1.SPACING.md }),
    resultCard: { padding: theme_1.SPACING.lg },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme_1.SPACING.lg },
    foodName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, flex: 1, marginRight: theme_1.SPACING.sm }),
    confidenceText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary, marginTop: 4 }),
    healthScore: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme_1.BORDER_RADIUS.sm },
    healthScoreText: Object.assign({}, theme_1.TYPOGRAPHY.captionBold),
    weightInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSecondary, padding: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.lg, marginBottom: theme_1.SPACING.md },
    weightLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    weightInputWrapper: { flexDirection: 'row', alignItems: 'center' },
    weightInput: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { width: 80, textAlign: 'center', borderRadius: theme_1.BORDER_RADIUS.sm, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8, borderWidth: 1, borderColor: 'transparent', textAlignVertical: 'center' }),
    weightInputError: { borderColor: '#FF4B4B', borderWidth: 1 },
    errorText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: '#FF4B4B', marginTop: 4, marginLeft: theme_1.SPACING.md }),
    weightUnit: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary }),
    macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.md, marginBottom: theme_1.SPACING.lg },
    macroItem: { flex: 1, alignItems: 'center' },
    macroVal: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    macroLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    macroDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
    ingredientsSection: { marginBottom: theme_1.SPACING.xl },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginBottom: theme_1.SPACING.sm }),
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: theme_1.SPACING.sm },
    tag: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: theme_1.SPACING.md, paddingVertical: 6, borderRadius: theme_1.BORDER_RADIUS.pill },
    tagText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    resultActions: { flexDirection: 'row', alignItems: 'center' },
    retakeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    // Micro-nutrients
    microGrid: { flexDirection: 'row', gap: theme_1.SPACING.md },
    microItem: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.md, gap: 4 },
    microValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    microLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    // Save as custom food
    saveCustomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme_1.SPACING.sm, marginTop: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
    saveCustomBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.primary }),
});
exports.default = FoodScannerScreen;
