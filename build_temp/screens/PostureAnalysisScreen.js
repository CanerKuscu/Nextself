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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PostureAnalysisScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_reanimated_1 = require("react-native-reanimated");
const zod_1 = require("zod");
const useTranslation_1 = require("../hooks/useTranslation");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const BiometricConsentModal_1 = __importDefault(require("../components/BiometricConsentModal"));
const deepseek_1 = require("../services/deepseek");
const agreementService_1 = require("../services/agreementService");
const supabase_1 = require("../services/supabase");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const poseProcessor_1 = require("../services/poseProcessor");
const visionCameraModule = (() => {
    try {
        return require('react-native-vision-camera');
    }
    catch (_a) {
        return null;
    }
})();
const Camera = ((_a = visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.Camera) !== null && _a !== void 0 ? _a : react_native_1.View);
const useCameraDevice = (_b = visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.useCameraDevice) !== null && _b !== void 0 ? _b : (() => undefined);
const useCameraPermission = (_c = visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.useCameraPermission) !== null && _c !== void 0 ? _c : (() => ({
    hasPermission: false,
    requestPermission: () => __awaiter(void 0, void 0, void 0, function* () { return false; }),
}));
const useFrameProcessor = (_d = visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.useFrameProcessor) !== null && _d !== void 0 ? _d : (() => undefined);
const VisionCameraProxy = (_e = visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.VisionCameraProxy) !== null && _e !== void 0 ? _e : {
    initFrameProcessorPlugin: () => null,
};
const isVisionCameraAvailable = Boolean((visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.Camera) && (visionCameraModule === null || visionCameraModule === void 0 ? void 0 : visionCameraModule.VisionCameraProxy));
const poseDetectorPlugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose');
const EXERCISE_OPTIONS = [
    { key: 'squat', tr: 'Squat', en: 'Squat' },
    { key: 'deadlift', tr: 'Deadlift', en: 'Deadlift' },
    { key: 'lunge', tr: 'Lunge', en: 'Lunge' },
    { key: 'pushup', tr: 'Push-up', en: 'Push-up' },
];
const postureAnalysisSchema = zod_1.z.object({
    DetectedExercise: zod_1.z.string().min(1).catch('unknown'),
    FormScore: zod_1.z.coerce.number().min(0).max(100).catch(0),
    BiomechanicalMetrics: zod_1.z.object({
        SymmetryScore: zod_1.z.coerce.number().min(0).max(100).catch(0),
        StabilityIndex: zod_1.z.enum(['Stable', 'Wobbly', 'Critical']).catch('Critical'),
        RangeOfMotion: zod_1.z.enum(['Full', 'Partial', 'Limited']).catch('Limited'),
    }).catch({
        SymmetryScore: 0,
        StabilityIndex: 'Critical',
        RangeOfMotion: 'Limited',
    }),
    CriticalFlaws: zod_1.z.array(zod_1.z.object({
        flaw: zod_1.z.string().min(1).catch('Unknown issue'),
        timestamp: zod_1.z.coerce.number().min(0).catch(0),
        severity: zod_1.z.enum(['High', 'Medium']).catch('Medium'),
    })).catch([]),
    PhaseFeedback: zod_1.z.object({
        Eccentric: zod_1.z.string().catch(''),
        Apex: zod_1.z.string().catch(''),
        Concentric: zod_1.z.string().catch(''),
    }).catch({
        Eccentric: '',
        Apex: '',
        Concentric: '',
    }),
    CorrectionCues: zod_1.z.array(zod_1.z.string()).catch([]),
    SafetyWarning: zod_1.z.object({
        isWarning: zod_1.z.coerce.boolean().catch(true),
        reason: zod_1.z.string().catch('Analysis response was malformed'),
    }).catch({
        isWarning: true,
        reason: 'Analysis response was malformed',
    }),
}).passthrough();
const DEBUG_UPDATE_INTERVAL_MS = 120;
const NO_PERSON_HINT_DELAY_MS = 3000;
const ANALYSIS_FRAME_LIMIT = 20;
const DEBUG_SMOOTHING_WINDOW = 3;
function PostureAnalysisScreen({ navigation }) {
    const { colors } = (0, ThemeContext_1.useTheme)();
    const styles = (0, react_1.useMemo)(() => getStyles(colors), [colors]);
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const [isAnalyzing, setIsAnalyzing] = (0, react_1.useState)(false);
    const [analysisResult, setAnalysisResult] = (0, react_1.useState)(null);
    const [analysisMeta, setAnalysisMeta] = (0, react_1.useState)(null);
    const [analysisNotice, setAnalysisNotice] = (0, react_1.useState)(null);
    const [selectedExercise, setSelectedExercise] = (0, react_1.useState)('squat');
    const [showDebugOverlay, setShowDebugOverlay] = (0, react_1.useState)(false);
    const [debugAngles, setDebugAngles] = (0, react_1.useState)(null);
    const [showConsentModal, setShowConsentModal] = (0, react_1.useState)(false);
    const [detectorHint, setDetectorHint] = (0, react_1.useState)(null);
    const cameraRef = (0, react_1.useRef)(null);
    const recordingStartedAtRef = (0, react_1.useRef)(null);
    const poseSamplesRef = (0, react_1.useRef)([]);
    const noPersonSinceRef = (0, react_1.useRef)(null);
    const debugAngleHistoryRef = (0, react_1.useRef)([]);
    const lastDebugUpdateRef = (0, react_1.useRef)(0);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const sampleRate = 8;
    (0, react_1.useEffect)(() => {
        const checkConsent = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const hasConsent = yield agreementService_1.AgreementService.getInstance().hasBiometricConsent(user.id, 'posture_analysis');
                    if (!hasConsent) {
                        setShowConsentModal(true);
                    }
                    else {
                        // Request permission if not already granted
                        if (!hasPermission) {
                            requestPermission();
                        }
                    }
                }
                else {
                    if (!hasPermission)
                        requestPermission();
                }
            }
            catch (err) {
                console.warn('Consent check error:', err);
                if (!hasPermission)
                    requestPermission();
            }
        });
        checkConsent();
    }, [hasPermission, requestPermission]);
    (0, react_1.useEffect)(() => {
        return () => {
            var _a;
            try {
                (_a = cameraRef.current) === null || _a === void 0 ? void 0 : _a.stopRecording();
            }
            catch (_b) {
            }
            poseSamplesRef.current = [];
            debugAngleHistoryRef.current = [];
            noPersonSinceRef.current = null;
            lastDebugUpdateRef.current = 0;
        };
    }, []);
    const handleConsentAccepted = () => __awaiter(this, void 0, void 0, function* () {
        setShowConsentModal(false);
        if (!hasPermission) {
            yield requestPermission();
        }
    });
    const handleConsentDeclined = () => {
        setShowConsentModal(false);
        (0, navigation_1.safeGoBack)(navigation, 'Workout');
    };
    const appendPoseSample = (0, react_1.useCallback)((payload, frameTimestampMs) => {
        var _a, _b;
        const candidate = Array.isArray(payload)
            ? payload[0]
            : ((_a = payload === null || payload === void 0 ? void 0 : payload.poses) === null || _a === void 0 ? void 0 : _a[0]) || ((_b = payload === null || payload === void 0 ? void 0 : payload.pose) === null || _b === void 0 ? void 0 : _b[0]) || (payload === null || payload === void 0 ? void 0 : payload.pose) || payload;
        const landmarks = (candidate === null || candidate === void 0 ? void 0 : candidate.landmarks) || (candidate === null || candidate === void 0 ? void 0 : candidate.keypoints) || (candidate === null || candidate === void 0 ? void 0 : candidate.poseLandmarks) || candidate;
        if (!landmarks || (Array.isArray(landmarks) && landmarks.length === 0)) {
            const now = Date.now();
            if (!noPersonSinceRef.current) {
                noPersonSinceRef.current = now;
            }
            if (now - noPersonSinceRef.current >= NO_PERSON_HINT_DELAY_MS) {
                setDetectorHint(isTurkish
                    ? 'Kişi algılanamadı. Lütfen pozisyonunu ayarla.'
                    : 'No person detected. Please adjust your position.');
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
                const nextAngles = (0, poseProcessor_1.extractAnglesFromLandmarks)(landmarks);
                const history = [...debugAngleHistoryRef.current, nextAngles].slice(-DEBUG_SMOOTHING_WINDOW);
                debugAngleHistoryRef.current = history;
                setDebugAngles(averageAngles(history));
            }
        }
    }, [detectorHint, isTurkish, showDebugOverlay]);
    const frameProcessor = useFrameProcessor((frame) => {
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
        (0, react_native_reanimated_1.runOnJS)(appendPoseSample)(poses, normalizedTimestamp);
    }, [isRecording, appendPoseSample]);
    const analyzeRecordedVideo = (0, react_1.useCallback)((videoPath) => __awaiter(this, void 0, void 0, function* () {
        setIsAnalyzing(true);
        const durationMs = Math.max(1000, Date.now() - (recordingStartedAtRef.current || Date.now()));
        const videoUri = videoPath.startsWith('file://') ? videoPath : `file://${videoPath}`;
        const kinematicReport = (0, poseProcessor_1.processRecordedVideo)(videoUri, selectedExercise, poseSamplesRef.current, {
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
        const response = yield deepseek_1.DeepSeekService.getInstance().analyzePostureKinematicReport(kinematicReport, isTurkish ? 'tr' : 'en', {
            durationMs,
            cameraHint: isTurkish ? 'yan açı tercih edilir' : 'side view preferred',
            qualityHint,
            selectedExercise,
            supportedExercises: EXERCISE_OPTIONS.map(option => option.key),
        });
        const { report: parsed, isValid } = parseValidatedKinematicResponse(response, selectedExercise, isTurkish);
        if (!isValid) {
            setAnalysisNotice(isTurkish
                ? 'Analiz başarısız, lütfen tekrar dene.'
                : 'Analysis failed, please try again.');
        }
        if (parsed.DetectedExercise && parsed.DetectedExercise !== 'unknown' && EXERCISE_OPTIONS.some(option => option.key === parsed.DetectedExercise)) {
            if (parsed.DetectedExercise !== selectedExercise) {
                setSelectedExercise(parsed.DetectedExercise);
            }
            if (isValid) {
                setAnalysisNotice(null);
            }
        }
        else {
            setAnalysisNotice(isTurkish
                ? 'Hareket sınıflandırması düşük güvenle tespit edildi. Daha net yan açı ile tekrar çekim önerilir.'
                : 'Movement classification confidence is low. Retake with a clearer side angle.');
        }
        setAnalysisResult(JSON.stringify(parsed, null, 2));
        setAnalysisMeta({ frameCount: kinematicReport.frames_data.length, durationMs, qualityHint, sampleRate });
        setIsAnalyzing(false);
    }), [isTurkish, sampleRate, selectedExercise]);
    const handleRecord = () => __awaiter(this, void 0, void 0, function* () {
        if (!cameraRef.current || !device)
            return;
        if (!hasPermission) {
            const granted = yield requestPermission();
            if (!granted) {
                alert(isTurkish ? 'Kamera izni gerekli.' : 'Camera permission is required.');
                return;
            }
        }
        if (isRecording) {
            setIsRecording(false);
            try {
                cameraRef.current.stopRecording();
            }
            catch (e) {
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
                onRecordingFinished: (video) => __awaiter(this, void 0, void 0, function* () {
                    setIsRecording(false);
                    yield analyzeRecordedVideo(video.path);
                }),
                onRecordingError: (error) => {
                    setIsRecording(false);
                    setIsAnalyzing(false);
                    console.error('Recording error:', error);
                    setAnalysisNotice(isTurkish ? 'Analiz başarısız, lütfen tekrar dene.' : 'Analysis failed, please try again.');
                },
            });
        }
        catch (error) {
            setIsRecording(false);
            setIsAnalyzing(false);
            console.error('Recording error:', error);
            alert(isTurkish ? 'Analiz başarısız' : 'Analysis failed');
        }
    });
    if (!isVisionCameraAvailable) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}>
                <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { textAlign: 'center', padding: theme_1.SPACING.lg, color: colors.textSecondary })}>
                    {isTurkish
                ? 'Bu sürümde native kamera modülü bulunamadı. Development build uygulamasını yeniden derleyip yükleyin.'
                : 'Native camera module is missing in this build. Rebuild and reinstall the development build app.'}
                </react_native_1.Text>
                <AnimatedButton_1.default title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} variant="secondary"/>
            </react_native_1.View>);
    }
    if (!hasPermission) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}>
                <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { textAlign: 'center', padding: theme_1.SPACING.lg, color: colors.textSecondary })}>
                    {isTurkish ? 'Kamera izni verilmedi.' : 'Camera permission not granted.'}
                </react_native_1.Text>
                <AnimatedButton_1.default title={isTurkish ? 'İzin Ver' : 'Grant Permission'} onPress={requestPermission} style={{ marginBottom: 10 }}/>
                <AnimatedButton_1.default title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} variant="secondary"/>
            </react_native_1.View>);
    }
    if (!device) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}>
                <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { textAlign: 'center', padding: theme_1.SPACING.lg, color: colors.textSecondary })}>
                    {isTurkish ? 'Arka kamera bulunamadı.' : 'Back camera device not available.'}
                </react_native_1.Text>
                <AnimatedButton_1.default title={isTurkish ? 'Geri Dön' : 'Go Back'} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} variant="secondary"/>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <BiometricConsentModal_1.default visible={showConsentModal} consentType="posture_analysis" onAccept={handleConsentAccepted} onDecline={handleConsentDeclined}/>

            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} style={styles.backBtn} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Postür Form Analizi' : 'Posture Form Analysis'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            <react_native_1.View style={styles.cameraContainer}>
                {!analysisResult && !isAnalyzing && (<react_native_1.View style={styles.exerciseSelector}>
                        {EXERCISE_OPTIONS.map((option) => {
                const active = selectedExercise === option.key;
                return (<react_native_1.TouchableOpacity key={option.key} style={[styles.exerciseChip, active && styles.exerciseChipActive, { borderColor: active ? colors.primary : 'rgba(255,255,255,0.35)' }]} onPress={() => setSelectedExercise(option.key)} activeOpacity={0.8}>
                                    <react_native_1.Text style={[styles.exerciseChipText, { color: active ? '#fff' : '#E5E7EB' }]}>
                                        {isTurkish ? option.tr : option.en}
                                    </react_native_1.Text>
                                </react_native_1.TouchableOpacity>);
            })}
                    </react_native_1.View>)}

                {!analysisResult && !isAnalyzing && (<react_native_1.TouchableOpacity style={styles.debugToggle} onPress={() => setShowDebugOverlay(prev => !prev)} activeOpacity={0.8}>
                        <react_native_1.Text style={styles.debugToggleText}>
                            {showDebugOverlay ? (isTurkish ? 'Debug Gizle' : 'Hide Debug') : (isTurkish ? 'Debug Göster' : 'Show Debug')}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>)}

                {!analysisResult && !isAnalyzing && (<Camera ref={cameraRef} style={react_native_1.StyleSheet.absoluteFillObject} device={device} isActive video audio={false} frameProcessor={frameProcessor} frameProcessorFps={sampleRate}/>)}

                {!analysisResult && !isAnalyzing && showDebugOverlay && debugAngles && (<react_native_1.View style={styles.debugPanel}>
                        <react_native_1.Text style={styles.debugTitle}>{isTurkish ? 'Canlı Açı İzleme' : 'Live Angle Monitor'}</react_native_1.Text>
                        <react_native_1.Text style={styles.debugValue}>{`L Knee: ${formatAngle(debugAngles.left_knee_angle)}`}</react_native_1.Text>
                        <react_native_1.Text style={styles.debugValue}>{`R Knee: ${formatAngle(debugAngles.right_knee_angle)}`}</react_native_1.Text>
                        <react_native_1.Text style={styles.debugValue}>{`L Hip: ${formatAngle(debugAngles.left_hip_angle)}`}</react_native_1.Text>
                        <react_native_1.Text style={styles.debugValue}>{`R Hip: ${formatAngle(debugAngles.right_hip_angle)}`}</react_native_1.Text>
                        <react_native_1.Text style={styles.debugValue}>{`Trunk: ${formatAngle(debugAngles.trunk_lean_angle)}`}</react_native_1.Text>
                    </react_native_1.View>)}

                {!analysisResult && !isAnalyzing && detectorHint && (<react_native_1.View style={styles.detectorHintBox}>
                        <react_native_1.Text style={styles.detectorHintText}>{detectorHint}</react_native_1.Text>
                    </react_native_1.View>)}

                {!analysisResult && !isAnalyzing && (<react_native_1.View style={styles.recordOverlay}>
                        <react_native_1.Text style={styles.promptText}>
                            {isTurkish ? (isRecording ? 'Kaydediliyor...' : 'Kaydı Başlat') : (isRecording ? 'Recording...' : 'Start Recording')}
                        </react_native_1.Text>
                        <react_native_1.TouchableOpacity style={[styles.recordBtn, isRecording && styles.recordBtnActive]} onPress={handleRecord} activeOpacity={0.7}>
                            {isRecording ? (<react_native_1.View style={{ width: 24, height: 24, backgroundColor: colors.error, borderRadius: 4 }}/>) : (<react_native_1.View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error, borderWidth: 4, borderColor: '#fff' }}/>)}
                        </react_native_1.TouchableOpacity>
                        {!isRecording && (<react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textInverse, marginTop: theme_1.SPACING.md })}>
                                {isTurkish ? 'Videoyu Kaydet ve Analiz Et' : 'Record Video and Analyze'}
                            </react_native_1.Text>)}
                    </react_native_1.View>)}

                {isAnalyzing && (<react_native_1.View style={styles.loadingOverlay}>
                        <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                        <react_native_1.Text style={styles.loadingText}>
                            {isTurkish ? 'Koordinat raporu hazırlanıyor...' : 'Building coordinate report...'}
                        </react_native_1.Text>
                        <react_native_1.Text style={styles.loadingSubText}>
                            {isTurkish ? 'Cihaza özel pose noktaları ve açılar çıkarılıyor' : 'Extracting on-device pose landmarks and angles'}
                        </react_native_1.Text>
                    </react_native_1.View>)}

                {analysisResult && (<react_native_1.View style={styles.resultContainer}>
                        {analysisMeta && (<react_native_1.View style={styles.metaBar}>
                                <react_native_1.Text style={styles.metaText}>
                                    {isTurkish
                    ? `${analysisMeta.frameCount} kare • ${(analysisMeta.durationMs / 1000).toFixed(1)} sn`
                    : `${analysisMeta.frameCount} frames • ${(analysisMeta.durationMs / 1000).toFixed(1)} sec`}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.metaText}>
                                    {isTurkish ? `Örnekleme: ${analysisMeta.sampleRate} FPS` : `Sampling: ${analysisMeta.sampleRate} FPS`}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.metaText}>{analysisMeta.qualityHint}</react_native_1.Text>
                                {analysisNotice ? <react_native_1.Text style={styles.noticeText}>{analysisNotice}</react_native_1.Text> : null}
                            </react_native_1.View>)}
                        <AnimatedCard_1.default style={styles.resultCard}>
                            <react_native_1.View style={styles.resultHeader}>
                                <vector_icons_1.Ionicons name="body" size={32} color={colors.primary}/>
                                <react_native_1.Text style={styles.resultTitle}>{isTurkish ? 'DeepSeek Raporu' : 'DeepSeek Report'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.resultText}>{analysisResult}</react_native_1.Text>
                        </AnimatedCard_1.default>

                        <AnimatedButton_1.default title={isTurkish ? 'Yeni Video Çek' : 'Record New Video'} onPress={() => {
                setAnalysisResult(null);
                setAnalysisMeta(null);
                setAnalysisNotice(null);
            }} style={{ width: '80%' }}/>
                    </react_native_1.View>)}
            </react_native_1.View>
        </react_native_1.View>);
}
const getQualityHint = (frameCount, durationMs, isTurkish) => {
    if (durationMs < 2500) {
        return isTurkish ? 'Kalite düşük: video çok kısa, en az 5-8 sn önerilir.' : 'Low quality: video too short, use at least 5-8 sec.';
    }
    if (frameCount < 8) {
        return isTurkish ? 'Kalite orta: tüm vücut kadraja girsin ve ışığı artır.' : 'Medium quality: keep full body in frame and improve lighting.';
    }
    return isTurkish ? 'Kalite iyi: landmark takibi stabil.' : 'Good quality: landmark tracking is stable.';
};
const parseValidatedKinematicResponse = (response, selectedExercise, isTurkish) => {
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
    }
    catch (_a) {
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
const formatAngle = (value) => (value === null || Number.isNaN(value) ? '-' : `${Math.round(value)}°`);
const averageAngles = (history) => {
    const average = (values) => {
        const valid = values.filter((value) => Number.isFinite(value));
        if (valid.length === 0)
            return null;
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
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.md, backgroundColor: colors.background },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    cameraContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
    exerciseSelector: { position: 'absolute', zIndex: 5, top: 10, left: 12, right: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exerciseChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(17,24,39,0.45)' },
    exerciseChipActive: { backgroundColor: 'rgba(79,70,229,0.85)' },
    exerciseChipText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { fontSize: 12 }),
    debugToggle: { position: 'absolute', zIndex: 6, right: 12, top: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(17,24,39,0.65)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    debugToggleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#fff', fontSize: 11 }),
    debugPanel: { position: 'absolute', zIndex: 6, left: 12, bottom: 130, paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme_1.BORDER_RADIUS.md, backgroundColor: 'rgba(17,24,39,0.72)' },
    debugTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#fff', marginBottom: 4 }),
    debugValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: '#E5E7EB', lineHeight: 18 }),
    detectorHintBox: { position: 'absolute', zIndex: 6, left: 12, right: 12, bottom: 90, paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme_1.BORDER_RADIUS.md, backgroundColor: 'rgba(127,29,29,0.78)' },
    detectorHintText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#FEE2E2', textAlign: 'center' }),
    recordOverlay: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }),
    promptText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', marginBottom: theme_1.SPACING.xxl, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }),
    recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    recordBtnActive: { borderColor: colors.error },
    loadingOverlay: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }),
    loadingText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginTop: theme_1.SPACING.md }),
    loadingSubText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: theme_1.SPACING.sm, textAlign: 'center', paddingHorizontal: theme_1.SPACING.lg }),
    resultContainer: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: theme_1.SPACING.lg }),
    metaBar: { width: '100%', marginBottom: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.md, backgroundColor: colors.surface },
    metaText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    noticeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, marginTop: theme_1.SPACING.xs }),
    resultCard: { width: '100%', marginBottom: theme_1.SPACING.xxl },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme_1.SPACING.md, gap: theme_1.SPACING.sm },
    resultTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text }),
    resultText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, lineHeight: 24 })
});
