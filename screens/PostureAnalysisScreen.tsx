import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { DeepSeekService } from '../services/deepseek';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '../services/supabase';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function PostureAnalysisScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const checkConsentAndPermission = async () => {
            // Check biometric consent first (KVKK Md. 6)
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'posture_analysis');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Consent check error:', err);
            }
            // If consent already granted, request camera permission
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

    const handleRecord = async () => {
        if (!cameraRef.current) return;

        setIsRecording(true);
        try {
            // Instead of recording 5 seconds of video, we capture a single high-quality
            // frame and send it to the Vision AI via the Edge function for real analysis.
            const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });

            setIsRecording(false);
            setIsAnalyzing(true);

            if (!photo || !photo.base64) {
                throw new Error("Görüntü alınamadı");
            }

            const exerciseName = 'squat';

            const response = await DeepSeekService.getInstance().analyzePostureData(photo.base64, exerciseName);

            setAnalysisResult(response);
            setIsAnalyzing(false);
        } catch (error) {
            setIsRecording(false);
            setIsAnalyzing(false);
            console.error("Recording error:", error);
            alert(isTurkish ? 'Analiz başarısız' : 'Analysis failed');
        }
    };

    if (hasPermission === null) return <View style={COMMON_STYLES.screenContainer} />;

    if (hasPermission === false) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg, color: colors.textSecondary }}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'Camera permission not granted.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => navigation.goBack()} />
            </View>
        );
    }

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <BiometricConsentModal
                visible={showConsentModal}
                consentType="posture_analysis"
                onAccept={handleConsentAccepted}
                onDecline={handleConsentDeclined}
            />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Postür Form Analizi' : 'Posture Form Analysis'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.cameraContainer}>
                {!analysisResult && !isAnalyzing && (
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        mode="picture"
                    />
                )}

                {!analysisResult && !isAnalyzing && (
                    <View style={styles.recordOverlay}>
                        <Text style={styles.promptText}>
                            {isTurkish ? 'Pozisyonunuzu vizöre sığdırın' : 'Fit your position in the frame'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                            onPress={handleRecord}
                            activeOpacity={0.7}
                            disabled={isRecording}
                        >
                            {!isRecording && <Ionicons name="camera" size={32} color={colors.primary} />}
                        </TouchableOpacity>
                        {!isRecording && (
                            <Text style={{ ...TYPOGRAPHY.small, color: colors.textInverse, marginTop: SPACING.md }}>
                                {isTurkish ? 'Fotoğraf Çek' : 'Take Photo'}
                            </Text>
                        )}
                    </View>
                )}

                {isAnalyzing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>
                            {isTurkish ? 'DeepSeek Açılarınızı Yorumluyor...' : 'DeepSeek is Analyzing Angles...'}
                        </Text>
                    </View>
                )}

                {analysisResult && (
                    <View style={styles.resultContainer}>
                        <AnimatedCard style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="body" size={32} color={colors.primary} />
                                <Text style={styles.resultTitle}>{isTurkish ? 'DeepSeek Raporu' : 'DeepSeek Report'}</Text>
                            </View>
                            <Text style={styles.resultText}>{analysisResult}</Text>
                        </AnimatedCard>

                        <AnimatedButton
                            title={isTurkish ? 'Yeni Fotoğraf Çek' : 'Take New Photo'}
                            onPress={() => setAnalysisResult(null)}
                            style={{ width: '80%' }}
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
    cameraContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
    recordOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
    promptText: { ...TYPOGRAPHY.bodyBold, color: '#fff', marginBottom: SPACING.xxl, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
    recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    recordBtnActive: { borderColor: colors.error },
    recordInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.error },
    recordInnerActive: { width: 30, height: 30, borderRadius: 6, backgroundColor: colors.error },
    recordingText: { ...TYPOGRAPHY.captionBold, color: colors.error, marginTop: SPACING.md },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loadingText: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginTop: SPACING.md },
    resultContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: SPACING.lg },
    resultCard: { width: '100%', marginBottom: SPACING.xxl },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
    resultTitle: { ...TYPOGRAPHY.h2, color: colors.text },
    resultText: { ...TYPOGRAPHY.body, color: colors.textSecondary, lineHeight: 24 }
});
