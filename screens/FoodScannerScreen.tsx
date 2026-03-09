import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { AIService, AIScanResult } from '../services/aiService';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const FoodScannerScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIScanResult | null>(null);
    const [weight, setWeight] = useState<string>('100');
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingSource, setPendingSource] = useState<'camera' | 'gallery' | null>(null);

    const aiService = AIService.getInstance();

    const checkConsentAndPick = async (source: 'camera' | 'gallery') => {
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (user) {
                const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'food_scanner');
                if (!hasConsent) {
                    setPendingSource(source);
                    setShowConsentModal(true);
                    return;
                }
            }
        } catch (err) {
            console.warn('Consent check error:', err);
        }
        pickImage(source);
    };

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

    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert(isTurkish ? 'Kamera izni gerekiyor!' : 'Camera permission is required!');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert(isTurkish ? 'Galeri izni gerekiyor!' : 'Gallery permission is required!');
                    return;
                }
            }

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                analyzeImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picking error:', error);
        }
    };

    const analyzeImage = async (uri: string) => {
        setLoading(true);
        setResult(null);
        try {
            const scanResult = await aiService.scanFood(uri);
            setResult(scanResult);
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setImageUri(null);
        setResult(null);
        setWeight('100');
    };

    const parsedWeight = parseFloat(weight) || 100;
    const macroMultiplier = parsedWeight / 100;

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="food_scanner"
                onAccept={handleConsentAccepted}
                onDecline={handleConsentDeclined}
            />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'AI Besin Tarama' : 'AI Food Scanner'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {!imageUri ? (
                    <View style={styles.emptyState}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="scan" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {isTurkish ? 'Ne yediğinizi merak mı ediyorsunuz?' : 'Wondering what you\'re eating?'}
                        </Text>
                        <Text style={styles.emptySub}>
                            {isTurkish
                                ? 'Yemeğinizin fotoğrafını çekin, kalori ve makrolarını yapay zeka saniyeler içinde analiz etsin.'
                                : 'Snap a picture of your food and let AI analyze calories and macros in seconds.'}
                        </Text>

                        <View style={styles.actionButtons}>
                            <AnimatedButton
                                title={isTurkish ? 'Kamera ile Çek' : 'Take a Photo'}
                                onPress={() => checkConsentAndPick('camera')}
                                style={{ marginBottom: SPACING.md }}
                            />
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => checkConsentAndPick('gallery')} activeOpacity={1}>
                                <Ionicons name="image-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.secondaryBtnText}>{isTurkish ? 'Galeriden Seç' : 'Choose from Gallery'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: SPACING.md, backgroundColor: colors.surfaceSecondary }]} onPress={() => navigation.navigate('BarcodeScanner')} activeOpacity={1}>
                                <Ionicons name="barcode-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{isTurkish ? 'Barkod Okut' : 'Scan Barcode'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: imageUri }} style={styles.image} />
                            {loading && (
                                <View style={styles.loadingOverlay}>
                                    <View style={styles.scanLine} />
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.loadingText}>{isTurkish ? 'Analiz ediliyor...' : 'Analyzing...'}</Text>
                                </View>
                            )}
                        </View>

                        {result && !loading && (
                            <AnimatedCard style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    <View>
                                        <Text style={styles.foodName}>{result.name}</Text>
                                        <Text style={styles.confidenceText}>
                                            {result.confidence}% {isTurkish ? 'Eşleşme' : 'Match'}
                                        </Text>
                                    </View>
                                    <View style={[styles.healthScore, { backgroundColor: result.healthScore > 7 ? colors.successSoft : colors.warningSoft }]}>
                                        <Text style={[styles.healthScoreText, { color: result.healthScore > 7 ? colors.success : colors.warning }]}>
                                            {result.healthScore}/10
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.weightInputContainer}>
                                    <Text style={styles.weightLabel}>{isTurkish ? 'Porsiyon (Gram):' : 'Portion (Grams):'}</Text>
                                    <View style={styles.weightInputWrapper}>
                                        <TextInput
                                            style={[styles.weightInput, { backgroundColor: colors.background, color: colors.text }]}
                                            keyboardType="numeric"
                                            value={weight}
                                            onChangeText={setWeight}
                                            maxLength={4}
                                        />
                                        <Text style={styles.weightUnit}>g</Text>
                                    </View>
                                </View>

                                <View style={styles.macrosContainer}>
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroVal}>{Math.round(result.calories * macroMultiplier)}</Text>
                                        <Text style={styles.macroLabel}>kcal</Text>
                                    </View>
                                    <View style={styles.macroDivider} />
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroVal}>{Math.round(result.protein * macroMultiplier)}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Protein' : 'Protein'}</Text>
                                    </View>
                                    <View style={styles.macroDivider} />
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroVal}>{Math.round(result.carbs * macroMultiplier)}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Karb' : 'Carbs'}</Text>
                                    </View>
                                    <View style={styles.macroDivider} />
                                    <View style={styles.macroItem}>
                                        <Text style={styles.macroVal}>{Math.round(result.fats * macroMultiplier)}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Yağ' : 'Fat'}</Text>
                                    </View>
                                </View>

                                {result.ingredients && result.ingredients.length > 0 && (
                                    <View style={styles.ingredientsSection}>
                                        <Text style={styles.sectionTitle}>{isTurkish ? 'Tespit Edilen İçerikler' : 'Detected Ingredients'}</Text>
                                        <View style={styles.tagsContainer}>
                                            {result.ingredients.map((ing, idx) => (
                                                <View key={idx} style={styles.tag}>
                                                    <Text style={styles.tagText}>{ing}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Micro-nutrients */}
                                {(result.fiber || result.sugar || result.sodium || (result.vitamins && result.vitamins.length > 0)) && (
                                    <View style={styles.ingredientsSection}>
                                        <Text style={styles.sectionTitle}>{isTurkish ? 'Mikro Besinler' : 'Micro-nutrients'}</Text>
                                        <View style={styles.microGrid}>
                                            {result.fiber != null && result.fiber > 0 && (
                                                <View style={styles.microItem}>
                                                    <Ionicons name="leaf-outline" size={16} color="#58CC02" />
                                                    <Text style={styles.microValue}>{Math.round(result.fiber * macroMultiplier)}g</Text>
                                                    <Text style={styles.microLabel}>{isTurkish ? 'Lif' : 'Fiber'}</Text>
                                                </View>
                                            )}
                                            {result.sugar != null && result.sugar > 0 && (
                                                <View style={styles.microItem}>
                                                    <Ionicons name="cube-outline" size={16} color="#FF9600" />
                                                    <Text style={styles.microValue}>{Math.round(result.sugar * macroMultiplier)}g</Text>
                                                    <Text style={styles.microLabel}>{isTurkish ? 'Şeker' : 'Sugar'}</Text>
                                                </View>
                                            )}
                                            {result.sodium != null && result.sodium > 0 && (
                                                <View style={styles.microItem}>
                                                    <Ionicons name="water-outline" size={16} color="#1CB0F6" />
                                                    <Text style={styles.microValue}>{Math.round(result.sodium * macroMultiplier)}mg</Text>
                                                    <Text style={styles.microLabel}>{isTurkish ? 'Sodyum' : 'Sodium'}</Text>
                                                </View>
                                            )}
                                        </View>
                                        {result.vitamins && result.vitamins.length > 0 && (
                                            <View style={[styles.tagsContainer, { marginTop: SPACING.sm }]}>
                                                {result.vitamins.map((vit, idx) => (
                                                    <View key={idx} style={[styles.tag, { backgroundColor: '#E8FFE0', borderColor: '#58CC02' }]}>
                                                        <Text style={[styles.tagText, { color: '#58CC02' }]}>{vit}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                <View style={styles.resultActions}>
                                    <AnimatedButton
                                        title={isTurkish ? 'Günlüğe Ekle' : 'Add to Diary'}
                                        onPress={async () => {
                                            try {
                                                const supabase = SupabaseService.getInstance();
                                                const { user } = await supabase.getCurrentUser();
                                                if (user && result) {
                                                    const { error } = await supabase.getClient()
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
                                                    if (error) {
                                                        console.error('Save error:', error);
                                                        alert(isTurkish ? 'Kaydedilemedi. Tekrar deneyin.' : 'Failed to save. Try again.');
                                                        return;
                                                    }
                                                }
                                                alert(isTurkish ? 'Beslenme günlüğüne eklendi!' : 'Added to nutrition diary!');
                                                navigation.goBack();
                                            } catch (err) {
                                                console.error('Diary save error:', err);
                                                alert(isTurkish ? 'Bir hata oluştu.' : 'An error occurred.');
                                            }
                                        }}
                                        style={{ flex: 1, marginRight: SPACING.md }}
                                    />
                                    <TouchableOpacity style={styles.retakeBtn} onPress={resetScan} activeOpacity={1}>
                                        <Ionicons name="refresh" size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Save as Custom Food */}
                                <TouchableOpacity
                                    style={styles.saveCustomBtn}
                                    onPress={async () => {
                                        try {
                                            const supabase = SupabaseService.getInstance();
                                            const { user } = await supabase.getCurrentUser();
                                            if (user && result) {
                                                const { error } = await supabase.getClient()
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
                                        } catch (err) {
                                            console.error('Custom food error:', err);
                                            alert(isTurkish ? 'Bir hata oluştu.' : 'An error occurred.');
                                        }
                                    }}
                                    activeOpacity={1}
                                >
                                    <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
                                    <Text style={styles.saveCustomBtnText}>
                                        {isTurkish ? 'Özel Besin Olarak Kaydet' : 'Save as Custom Food'}
                                    </Text>
                                </TouchableOpacity>
                            </AnimatedCard>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    content: { flexGrow: 1, padding: SPACING.lg },

    // Empty state
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xxl },
    iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
    emptyTitle: { ...TYPOGRAPHY.h2, color: colors.text, textAlign: 'center', marginBottom: SPACING.md },
    emptySub: { ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl, paddingHorizontal: SPACING.lg },
    actionButtons: { width: '100%', paddingHorizontal: SPACING.md },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.pill, backgroundColor: colors.primarySoft },
    secondaryBtnText: { ...TYPOGRAPHY.bodyBold, color: colors.primary },

    // Results
    resultContainer: { flex: 1 },
    imageWrapper: { width: '100%', height: 300, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.lg, backgroundColor: colors.surfaceSecondary },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
    loadingText: { ...TYPOGRAPHY.bodyBold, color: '#fff', marginTop: SPACING.md },

    resultCard: { padding: SPACING.lg },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
    foodName: { ...TYPOGRAPHY.h3, color: colors.text, flex: 1, marginRight: SPACING.sm },
    confidenceText: { ...TYPOGRAPHY.small, color: colors.textSecondary, marginTop: 4 },
    healthScore: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
    healthScoreText: { ...TYPOGRAPHY.captionBold },

    weightInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
    weightLabel: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    weightInputWrapper: { flexDirection: 'row', alignItems: 'center' },
    weightInput: { ...TYPOGRAPHY.h3, width: 80, textAlign: 'center', borderRadius: BORDER_RADIUS.sm, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8 },
    weightUnit: { ...TYPOGRAPHY.body, color: colors.textSecondary },

    macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
    macroItem: { flex: 1, alignItems: 'center' },
    macroVal: { ...TYPOGRAPHY.h3, color: colors.text },
    macroLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
    macroDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },

    ingredientsSection: { marginBottom: SPACING.xl },
    sectionTitle: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginBottom: SPACING.sm },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    tag: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.pill },
    tagText: { ...TYPOGRAPHY.caption, color: colors.textSecondary },

    resultActions: { flexDirection: 'row', alignItems: 'center' },
    retakeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderLight, justifyContent: 'center', alignItems: 'center' },

    // Micro-nutrients
    microGrid: { flexDirection: 'row', gap: SPACING.md },
    microItem: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, gap: 4 },
    microValue: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    microLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary },

    // Save as custom food
    saveCustomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.pill, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
    saveCustomBtnText: { ...TYPOGRAPHY.bodyBold, color: colors.primary },
});

export default FoodScannerScreen;
