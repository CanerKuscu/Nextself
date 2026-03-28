import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { runOnJS } from 'react-native-reanimated';
import { z } from 'zod';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import BiometricConsentModal from '../components/BiometricConsentModal';
import { DeepSeekService } from '../services/deepseek';
import { AgreementService } from '../services/agreementService';
import { SupabaseService } from '@nextself/shared';
import { TYPOGRAPHY, SPACING, COMMON_STYLES, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { extractAnglesFromLandmarks, KinematicAngles, processRecordedVideo, PoseSample } from '../services/poseProcessor';

type VisionCameraModule = typeof import('react-native-vision-camera');

const visionCameraModule: VisionCameraModule | null = (() => {
    try {
        return require('react-native-vision-camera') as VisionCameraModule;
    } catch {
        return null;
    }
})();

const Camera = (visionCameraModule?.Camera ?? View) as any;
const useCameraDevice: (position: 'back' | 'front') => any = visionCameraModule?.useCameraDevice ?? (() => undefined);
const useCameraPermission: () => { hasPermission: boolean; requestPermission: () => Promise<boolean> } =
    visionCameraModule?.useCameraPermission ?? (() => ({
        hasPermission: false,
        requestPermission: async () => false,
    }));
const useFrameProcessor: (processor: any, deps?: React.DependencyList) => any =
    visionCameraModule?.useFrameProcessor ?? (() => undefined);
const VisionCameraProxy: { initFrameProcessorPlugin: (name: string) => { call: (frame: any, options?: Record<string, any>) => any } | null } = visionCameraModule?.VisionCameraProxy ?? {
    initFrameProcessorPlugin: () => null,
};
const isVisionCameraAvailable = Boolean(visionCameraModule?.Camera && visionCameraModule?.VisionCameraProxy);
const poseDetectorPlugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose');

const EXERCISE_OPTIONS = [
    { key: 'squat', tr: 'Squat', en: 'Squat' },
    { key: 'deadlift', tr: 'Deadlift', en: 'Deadlift' },
    { key: 'lunge', tr: 'Lunge', en: 'Lunge' },
    { key: 'pushup', tr: 'Push-up', en: 'Push-up' },
];

const postureAnalysisSchema = z.object({
    DetectedExercise: z.string().min(1).catch('unknown'),
    FormScore: z.coerce.number().min(0).max(100).catch(0),
    BiomechanicalMetrics: z.object({
        SymmetryScore: z.coerce.number().min(0).max(100).catch(0),
        StabilityIndex: z.enum(['Stable', 'Wobbly', 'Critical']).catch('Critical'),
        RangeOfMotion: z.enum(['Full', 'Partial', 'Limited']).catch('Limited'),
    }).catch({
        SymmetryScore: 0,
        StabilityIndex: 'Critical',
        RangeOfMotion: 'Limited',
    }),
    CriticalFlaws: z.array(
        z.object({
            flaw: z.string().min(1).catch('Unknown issue'),
            timestamp: z.coerce.number().min(0).catch(0),
            severity: z.enum(['High', 'Medium']).catch('Medium'),
        }),
    ).catch([]),
    PhaseFeedback: z.object({
        Eccentric: z.string().catch(''),
        Apex: z.string().catch(''),
        Concentric: z.string().catch(''),
    }).catch({
        Eccentric: '',
        Apex: '',
        Concentric: '',
    }),
    CorrectionCues: z.array(z.string()).catch([]),
    SafetyWarning: z.object({
        isWarning: z.coerce.boolean().catch(true),
        reason: z.string().catch('Analysis response was malformed'),
    }).catch({
        isWarning: true,
        reason: 'Analysis response was malformed',
    }),
}).passthrough();

type PostureAnalysisReport = z.infer<typeof postureAnalysisSchema>;

const DEBUG_UPDATE_INTERVAL_MS = 120;
const NO_PERSON_HINT_DELAY_MS = 3000;
const ANALYSIS_FRAME_LIMIT = 20;
const DEBUG_SMOOTHING_WINDOW = 3;

export default function PostureAnalysisScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [analysisMeta, setAnalysisMeta] = useState<{ frameCount: number; durationMs: number; qualityHint: string; sampleRate: number } | null>(null);
    const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState('squat');
    const [showDebugOverlay, setShowDebugOverlay] = useState(false);
    const [debugAngles, setDebugAngles] = useState<KinematicAngles | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [detectorHint, setDetectorHint] = useState<string | null>(null);
    const cameraRef = useRef<any>(null);
    const recordingStartedAtRef = useRef<number | null>(null);
    const poseSamplesRef = useRef<PoseSample[]>([]);
    const noPersonSinceRef = useRef<number | null>(null);
    const debugAngleHistoryRef = useRef<KinematicAngles[]>([]);
    const lastDebugUpdateRef = useRef(0);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const sampleRate = 8;

    useEffect(() => {
        const checkConsent = async () => {
            try {
                const { user } = await SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = await AgreementService.getInstance().hasBiometricConsent(user.id, 'posture_analysis');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                    } else {
                        // Request permission if not already granted
                        if (!hasPermission) {
                            requestPermission();
                        }
                    }
                } else {
                    if (!hasPermission) requestPermission();
                }
            } catch (err) {
                console.warn('Consent check error:', err);
                if (!hasPermission) requestPermission();
            }
        };
        checkConsent();
    }, [hasPermission, requestPermission]);

    useEffect(() => {
        return () => {
            try {
                cameraRef.current?.stopRecording();
            } catch {
            }
            poseSamplesRef.current = [];
            debugAngleHistoryRef.current = [];
            noPersonSinceRef.current = null;
            lastDebugUpdateRef.current = 0;
        };
    }, []);

    const handleConsentAccepted = async () => {
        setShowConsentModal(false);
        if (!hasPermission) {
            await requestPermission();
        }
    };

    const handleConsentDeclined = () => {
        setShowConsentModal(false);
        safeGoBack(navigation, 'Workout');
    };

    const appendPoseSample = useCallback((payload: any, frameTimestampMs: number) => {
        const candidate = Array.isArray(payload)
            ? payload[0]
            : payload?.poses?.[0] || payload?.pose?.[0] || payload?.pose || payload;
        const landmarks = candidate?.landmarks || candidate?.keypoints || candidate?.poseLandmarks || candidate;
        if (!landmarks || (Array.isArray(landmarks) && landmarks.length === 0)) {
            const now = Date.now();
            if (!noPersonSinceRef.current) {
                noPersonSinceRef.current = now;
            }
            if (now - noPersonSinceRef.current >= NO_PERSON_HINT_DELAY_MS) {
                setDetectorHint(
                    isTurkish
                        ? 'Kişi algılanamadı. Lütfen pozisyonunu ayarla.'
                        : 'No person detected. Please adjust your position.',
                );
            }
            return;
        }
        noPersonSinceRef.current = null;
        if (detectorHint) {
            setDetectorHint(null);
        }
        poseSamplesRef.current.push({
            timestampMs: Math.max(0, Math.floor(frameTimestampMs)),
            landmarks,
        });
        if (showDebugOverlay) {
            const now = Date.now();
            if ((now - lastDebugUpdateRef.current) >= DEBUG_UPDATE_INTERVAL_MS) {
                lastDebugUpdateRef.current = now;
                const nextAngles = extractAnglesFromLandmarks(landmarks);
                const history = [...debugAngleHistoryRef.current, nextAngles].slice(-DEBUG_SMOOTHING_WINDOW);
                debugAngleHistoryRef.current = history;
                setDebugAngles(averageAngles(history));
            }
        }
    }, [detectorHint, isTurkish, showDebugOverlay]);

    const frameProcessor = useFrameProcessor((frame: { timestamp: number }) => {
        'worklet';
        if (!poseDetectorPlugin || !isRecording) {
            return;
        }
        const poses = poseDetectorPlugin.call(frame, {
            numPoses: 1,
            mode: 'stream',
            runClassification: false,
        });
        const rawTimestamp = Number(frame.timestamp);
        const normalizedTimestamp = rawTimestamp > 1000000 ? rawTimestamp / 1000000 : rawTimestamp;
        runOnJS(appendPoseSample)(poses, normalizedTimestamp);
    }, [isRecording, appendPoseSample]);

    const analyzeRecordedVideo = useCallback(async (videoPath: string) => {
        setIsAnalyzing(true);
        const durationMs = Math.max(1000, Date.now() - (recordingStartedAtRef.current || Date.now()));
        const videoUri = videoPath.startsWith('file://') ? videoPath : `file://${videoPath}`;
        const kinematicReport = processRecordedVideo(videoUri, selectedExercise, poseSamplesRef.current, {
            targetFps: sampleRate,
            durationMs,
            maxFrames: ANALYSIS_FRAME_LIMIT,
            smoothingWindow: 5,
            minVisibility: 0.35,
        });
        if (kinematicReport.frames_data.length === 0) {
            throw new Error(isTurkish ? 'Videodan pose noktaları çıkarılamadı' : 'Failed to extract pose landmarks');
        }
        const qualityHint = getQualityHint(kinematicReport.frames_data.length, durationMs, isTurkish);
        const response = await DeepSeekService.getInstance().analyzePostureKinematicReport(
            kinematicReport,
            isTurkish ? 'tr' : 'en',
            {
                durationMs,
                cameraHint: isTurkish ? 'yan açı tercih edilir' : 'side view preferred',
                qualityHint,
                selectedExercise,
                supportedExercises: EXERCISE_OPTIONS.map(option => option.key),
            },
        );
        const { report: parsed, isValid } = parseValidatedKinematicResponse(response, selectedExercise, isTurkish);
        if (!isValid) {
            setAnalysisNotice(
                isTurkish
                    ? 'Analiz başarısız, lütfen tekrar dene.'
                    : 'Analysis failed, please try again.',
            );
        }
        if (parsed.DetectedExercise && parsed.DetectedExercise !== 'unknown' && EXERCISE_OPTIONS.some(option => option.key === parsed.DetectedExercise)) {
            if (parsed.DetectedExercise !== selectedExercise) {
                setSelectedExercise(parsed.DetectedExercise);
            }
            if (isValid) {
                setAnalysisNotice(null);
            }
        } else {
            setAnalysisNotice(
                isTurkish
                    ? 'Hareket sınıflandırması düşük güvenle tespit edildi. Daha net yan açı ile tekrar çekim önerilir.'
                    : 'Movement classification confidence is low. Retake with a clearer side angle.',
            );
        }
        setAnalysisResult(JSON.stringify(parsed, null, 2));
        setAnalysisMeta({ frameCount: kinematicReport.frames_data.length, durationMs, qualityHint, sampleRate });
        setIsAnalyzing(false);
    }, [isTurkish, sampleRate, selectedExercise]);

    const handleRecord = async () => {
        if (!cameraRef.current || !device) return;
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                alert(isTurkish ? 'Kamera izni gerekli.' : 'Camera permission is required.');
                return;
            }
        }
        if (isRecording) {
            setIsRecording(false);
            try {
                cameraRef.current.stopRecording();
            } catch (e) {
                console.warn('Stop recording error:', e);
            }
            return;
        }

        try {
            poseSamplesRef.current = [];
            recordingStartedAtRef.current = Date.now();
            setIsRecording(true);
            setDebugAngles(null);
            debugAngleHistoryRef.current = [];
            setDetectorHint(null);
            setAnalysisNotice(isTurkish ? 'Pose çıkarımı cihaz üzerinde çalışıyor' : 'Pose extraction is running on-device');
            cameraRef.current.startRecording({
                flash: 'off',
                onRecordingFinished: async (video: { path: string }) => {
                    setIsRecording(false);
                    await analyzeRecordedVideo(video.path);
                },
                onRecordingError: (error: unknown) => {
                    setIsRecording(false);
                    setIsAnalyzing(false);
                    console.error('Recording error:', error);
                    setAnalysisNotice(isTurkish ? 'Analiz başarısız, lütfen tekrar dene.' : 'Analysis failed, please try again.');
                },
            });
        } catch (error) {
            setIsRecording(false);
            setIsAnalyzing(false);
            console.error('Recording error:', error);
            alert(isTurkish ? 'Analiz başarısız' : 'Analysis failed');
        }
    };

    if (!isVisionCameraAvailable) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center, { backgroundColor: colors.background }]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg, color: colors.textSecondary }}>
                    {isTurkish
                        ? 'Bu sürümde native kamera modülü bulunamadı. Development build uygulamasını yeniden derleyip yükleyin.'
                        : 'Native camera module is missing in this build. Rebuild and reinstall the development build app.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => safeGoBack(navigation, 'Workout')} variant="secondary" />
            </View>
        );
    }

    if (!hasPermission) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center, { backgroundColor: colors.background }]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg, color: colors.textSecondary }}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'Camera permission not granted.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'İzin Ver' : 'Grant Permission'} onPress={requestPermission} style={{ marginBottom: 10 }} />
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => safeGoBack(navigation, 'Workout')} variant="secondary" />
            </View>
        );
    }

    if (!device) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center, { backgroundColor: colors.background }]}>
                <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', padding: SPACING.lg, color: colors.textSecondary }}>
                    {isTurkish ? 'Arka kamera bulunamadı.' : 'Back camera device not available.'}
                </Text>
                <AnimatedButton title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => safeGoBack(navigation, 'Workout')} variant="secondary" />
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
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Workout')} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Postür Form Analizi' : 'Posture Form Analysis'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.cameraContainer}>
                {!analysisResult && !isAnalyzing && (
                    <View style={styles.exerciseSelector}>
                        {EXERCISE_OPTIONS.map((option) => {
                            const active = selectedExercise === option.key;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[styles.exerciseChip, active && styles.exerciseChipActive, { borderColor: active ? colors.primary : 'rgba(255,255,255,0.35)' }]}
                                    onPress={() => setSelectedExercise(option.key)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.exerciseChipText, { color: active ? (isDark ? colors.text : colors.textInverse) : colors.textTertiary }]}>
                                        {isTurkish ? option.tr : option.en}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {!analysisResult && !isAnalyzing && (
                    <TouchableOpacity
                        style={styles.debugToggle}
                        onPress={() => setShowDebugOverlay(prev => !prev)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.debugToggleText}>
                            {showDebugOverlay ? (isTurkish ? 'Debug Gizle' : 'Hide Debug') : (isTurkish ? 'Debug Göster' : 'Show Debug')}
                        </Text>
                    </TouchableOpacity>
                )}

                {!analysisResult && !isAnalyzing && (
                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        device={device}
                        isActive
                        video
                        audio={false}
                        frameProcessor={frameProcessor}
                        frameProcessorFps={sampleRate}
                    />
                )}

                {!analysisResult && !isAnalyzing && showDebugOverlay && debugAngles && (
                    <View style={styles.debugPanel}>
                        <Text style={styles.debugTitle}>{isTurkish ? 'Canlı Açı İzleme' : 'Live Angle Monitor'}</Text>
                        <Text style={styles.debugValue}>{`L Knee: ${formatAngle(debugAngles.left_knee_angle)}`}</Text>
                        <Text style={styles.debugValue}>{`R Knee: ${formatAngle(debugAngles.right_knee_angle)}`}</Text>
                        <Text style={styles.debugValue}>{`L Hip: ${formatAngle(debugAngles.left_hip_angle)}`}</Text>
                        <Text style={styles.debugValue}>{`R Hip: ${formatAngle(debugAngles.right_hip_angle)}`}</Text>
                        <Text style={styles.debugValue}>{`Trunk: ${formatAngle(debugAngles.trunk_lean_angle)}`}</Text>
                    </View>
                )}

                {!analysisResult && !isAnalyzing && detectorHint && (
                    <View style={styles.detectorHintBox}>
                        <Text style={styles.detectorHintText}>{detectorHint}</Text>
                    </View>
                )}

                {!analysisResult && !isAnalyzing && (
                    <View style={styles.recordOverlay}>
                        <Text style={styles.promptText}>
                            {isTurkish ? (isRecording ? 'Kaydediliyor...' : 'Kaydı Başlat') : (isRecording ? 'Recording...' : 'Start Recording')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                            onPress={handleRecord}
                            activeOpacity={0.7}
                        >
                            {isRecording ? (
                                <View style={{ width: 24, height: 24, backgroundColor: colors.error, borderRadius: 4 }} />
                            ) : (
                                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error, borderWidth: 4, borderColor: '#fff' }} />
                            )}
                        </TouchableOpacity>
                        {!isRecording && (
                            <Text style={{ ...TYPOGRAPHY.small, color: colors.textInverse, marginTop: SPACING.md }}>
                                {isTurkish ? 'Videoyu Kaydet ve Analiz Et' : 'Record Video and Analyze'}
                            </Text>
                        )}
                    </View>
                )}

                {isAnalyzing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>
                            {isTurkish ? 'Koordinat raporu hazırlanıyor...' : 'Building coordinate report...'}
                        </Text>
                        <Text style={styles.loadingSubText}>
                            {isTurkish ? 'Cihaza özel pose noktaları ve açılar çıkarılıyor' : 'Extracting on-device pose landmarks and angles'}
                        </Text>
                    </View>
                )}

                {analysisResult && (
                    <View style={styles.resultContainer}>
                        {analysisMeta && (
                            <View style={styles.metaBar}>
                                <Text style={styles.metaText}>
                                    {isTurkish
                                        ? `${analysisMeta.frameCount} kare • ${(analysisMeta.durationMs / 1000).toFixed(1)} sn`
                                        : `${analysisMeta.frameCount} frames • ${(analysisMeta.durationMs / 1000).toFixed(1)} sec`}
                                </Text>
                                <Text style={styles.metaText}>
                                    {isTurkish ? `Örnekleme: ${analysisMeta.sampleRate} FPS` : `Sampling: ${analysisMeta.sampleRate} FPS`}
                                </Text>
                                <Text style={styles.metaText}>{analysisMeta.qualityHint}</Text>
                                {analysisNotice ? <Text style={styles.noticeText}>{analysisNotice}</Text> : null}
                            </View>
                        )}
                        <AnimatedCard style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="body" size={32} color={colors.primary} />
                                <Text style={styles.resultTitle}>{isTurkish ? 'DeepSeek Raporu' : 'DeepSeek Report'}</Text>
                            </View>
                            <Text style={styles.resultText}>{analysisResult}</Text>
                        </AnimatedCard>

                        <AnimatedButton
                            title={isTurkish ? 'Yeni Video Çek' : 'Record New Video'}
                            onPress={() => {
                                setAnalysisResult(null);
                                setAnalysisMeta(null);
                                setAnalysisNotice(null);
                            }}
                            style={{ width: '80%' }}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const getQualityHint = (frameCount: number, durationMs: number, isTurkish: boolean) => {
    if (durationMs < 2500) {
        return isTurkish ? 'Kalite düşük: video çok kısa, en az 5-8 sn önerilir.' : 'Low quality: video too short, use at least 5-8 sec.';
    }
    if (frameCount < 8) {
        return isTurkish ? 'Kalite orta: tüm vücut kadraja girsin ve ışığı artır.' : 'Medium quality: keep full body in frame and improve lighting.';
    }
    return isTurkish ? 'Kalite iyi: landmark takibi stabil.' : 'Good quality: landmark tracking is stable.';
};

const parseValidatedKinematicResponse = (response: string, selectedExercise: string, isTurkish: boolean): { report: PostureAnalysisReport; isValid: boolean } => {
    try {
        const parsed = JSON.parse(response);
        const result = postureAnalysisSchema.safeParse(parsed);
        if (result.success) {
            return { report: result.data, isValid: true };
        }
        return {
            isValid: false,
            report: {
                DetectedExercise: selectedExercise || 'unknown',
                FormScore: 0,
                BiomechanicalMetrics: {
                    SymmetryScore: 0,
                    StabilityIndex: 'Critical',
                    RangeOfMotion: 'Limited',
                },
                CriticalFlaws: [
                    {
                        flaw: isTurkish ? 'Yanıt şema doğrulamasından geçmedi' : 'Response did not pass schema validation',
                        timestamp: 0,
                        severity: 'High',
                    },
                ],
                PhaseFeedback: {
                    Eccentric: isTurkish ? 'Doğrulama hatası' : 'Validation error',
                    Apex: isTurkish ? 'Doğrulama hatası' : 'Validation error',
                    Concentric: isTurkish ? 'Doğrulama hatası' : 'Validation error',
                },
                CorrectionCues: isTurkish ? ['Analizi tekrar başlat', 'Kamerayı daha sabit tut'] : ['Retry the analysis', 'Keep the camera more stable'],
                SafetyWarning: {
                    isWarning: true,
                    reason: isTurkish ? 'Geçersiz analiz formatı alındı.' : 'Invalid analysis format received.',
                },
            },
        };
    } catch {
        return {
            isValid: false,
            report: {
                DetectedExercise: selectedExercise || 'unknown',
                FormScore: 0,
                BiomechanicalMetrics: {
                    SymmetryScore: 0,
                    StabilityIndex: 'Critical',
                    RangeOfMotion: 'Limited',
                },
                CriticalFlaws: [
                    {
                        flaw: isTurkish ? 'JSON ayrıştırma başarısız' : 'JSON parsing failed',
                        timestamp: 0,
                        severity: 'High',
                    },
                ],
                PhaseFeedback: {
                    Eccentric: isTurkish ? 'Yanıt ayrıştırılamadı' : 'Response could not be parsed',
                    Apex: isTurkish ? 'Yanıt ayrıştırılamadı' : 'Response could not be parsed',
                    Concentric: isTurkish ? 'Yanıt ayrıştırılamadı' : 'Response could not be parsed',
                },
                CorrectionCues: isTurkish ? ['Kayıt kalitesini artır', 'Analizi tekrar dene'] : ['Improve capture quality', 'Retry analysis'],
                SafetyWarning: {
                    isWarning: true,
                    reason: isTurkish ? 'Geçersiz JSON yanıtı alındı.' : 'Invalid JSON response received.',
                },
            },
        };
    }
};

const formatAngle = (value: number | null) => (value === null || Number.isNaN(value) ? '-' : `${Math.round(value)}°`);

const averageAngles = (history: KinematicAngles[]): KinematicAngles => {
    const average = (values: Array<number | null>) => {
        const valid = values.filter((value): value is number => Number.isFinite(value as number));
        if (valid.length === 0) return null;
        return Number((valid.reduce((acc, value) => acc + value, 0) / valid.length).toFixed(2));
    };
    return {
        left_knee_angle: average(history.map(item => item.left_knee_angle)),
        right_knee_angle: average(history.map(item => item.right_knee_angle)),
        left_hip_angle: average(history.map(item => item.left_hip_angle)),
        right_hip_angle: average(history.map(item => item.right_hip_angle)),
        left_ankle_angle: average(history.map(item => item.left_ankle_angle)),
        right_ankle_angle: average(history.map(item => item.right_ankle_angle)),
        trunk_lean_angle: average(history.map(item => item.trunk_lean_angle)),
    };
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, backgroundColor: colors.background },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    cameraContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
    exerciseSelector: { position: 'absolute', zIndex: 5, top: 10, left: 12, right: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exerciseChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(17,24,39,0.45)' },
    exerciseChipActive: { backgroundColor: 'rgba(79,70,229,0.85)' },
    exerciseChipText: { ...TYPOGRAPHY.captionBold, fontSize: 12 },
    debugToggle: { position: 'absolute', zIndex: 6, right: 12, top: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(17,24,39,0.65)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    debugToggleText: { ...TYPOGRAPHY.captionBold, color: isDark ? colors.text : colors.textInverse, fontSize: 11 },
    debugPanel: { position: 'absolute', zIndex: 6, left: 12, bottom: 130, paddingHorizontal: 10, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(17,24,39,0.72)' },
    debugTitle: { ...TYPOGRAPHY.captionBold, color: isDark ? colors.text : colors.textInverse, marginBottom: 4 },
    debugValue: { ...TYPOGRAPHY.caption, color: colors.textTertiary, lineHeight: 18 },
    detectorHintBox: { position: 'absolute', zIndex: 6, left: 12, right: 12, bottom: 90, paddingHorizontal: 10, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(127,29,29,0.78)' },
    detectorHintText: { ...TYPOGRAPHY.captionBold, color: '#FEE2E2', textAlign: 'center' },
    recordOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
    promptText: { ...TYPOGRAPHY.bodyBold, color: isDark ? colors.text : colors.textInverse, marginBottom: SPACING.xxl, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
    recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: isDark ? colors.text : colors.textInverse, justifyContent: 'center', alignItems: 'center' },
    recordBtnActive: { borderColor: colors.error },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loadingText: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginTop: SPACING.md },
    loadingSubText: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.lg },
    resultContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: SPACING.lg },
    metaBar: { width: '100%', marginBottom: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surface },
    metaText: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    noticeText: { ...TYPOGRAPHY.captionBold, color: colors.primary, marginTop: SPACING.xs },
    resultCard: { width: '100%', marginBottom: SPACING.xxl },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
    resultTitle: { ...TYPOGRAPHY.h2, color: colors.text },
    resultText: { ...TYPOGRAPHY.body, color: colors.textSecondary, lineHeight: 24 }
});
