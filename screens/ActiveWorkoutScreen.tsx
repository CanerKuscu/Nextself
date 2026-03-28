import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedButton from '../components/AnimatedButton';
import { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { MissionService } from '../services/missionService';
import { LeagueService } from '../services/leagueService';
import { StreakService } from '../services/streakService';
import { HealthService } from '../services/healthService';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { AdService } from '../services/AdService';

export default function ActiveWorkoutScreen({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();

    // Workout State
    const [elapsedTime, setElapsedTime] = useState(0);
    const [heartRate, setHeartRate] = useState<number | null>(null);
    const [calories, setCalories] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [sensorSource, setSensorSource] = useState<'apple_health' | 'google_health' | 'manual' | null>(null);

    const workoutName = route.params?.workoutName || (isTurkish ? 'Serbest İdman' : 'Freestyle Workout');
    const muscleGroups = route.params?.muscleGroups || [];
    const [saving, setSaving] = useState(false);
    const workoutStartRef = React.useRef(new Date());

    // Accurate Timer Refs
    const accumulatedTimeRef = React.useRef(0);
    const lastTickRef = React.useRef(Date.now());
    const animRef = React.useRef<number | undefined>(undefined);

    // Heartbeat Animation
    const scale = useSharedValue(1);

    useEffect(() => {
        // Start Heartbeat Animation
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 200, easing: Easing.ease }),
                withTiming(1, { duration: 200, easing: Easing.ease }),
                withTiming(1.1, { duration: 200, easing: Easing.ease }),
                withTiming(1, { duration: 400, easing: Easing.ease })
            ),
            -1, // infinite
            false
        );

        return () => {
            // Cleanup infinite animation on unmount
            cancelAnimation(scale);
        };
    }, [scale]);

    const animatedHeartStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: scale.value }] };
    });

    useEffect(() => {
        if (!isPaused) {
            lastTickRef.current = Date.now();
            const tick = () => {
                const now = Date.now();
                const delta = Math.floor((now - lastTickRef.current) / 1000);
                if (delta >= 1) {
                    accumulatedTimeRef.current += delta;
                    lastTickRef.current = now - ((now - lastTickRef.current) % 1000);
                    setElapsedTime(accumulatedTimeRef.current);
                }
                animRef.current = requestAnimationFrame(tick);
            };
            animRef.current = requestAnimationFrame(tick);
        } else {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        }
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isPaused]);

    useEffect(() => {
        const healthService = HealthService.getInstance();
        if (isPaused) return;
        const stopStream = healthService.startWorkoutMetricsStream(
            workoutStartRef.current,
            (metrics) => {
                setSensorSource(metrics.source);
                setHeartRate(metrics.heartRate);
                setCalories(metrics.calories);
            },
            { intervalMs: 3000 }
        );

        return () => {
            stopStream();
        };
    }, [isPaused]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const h = Math.floor(seconds / 3600);
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const handleFinish = async () => {
        if (saving) return;
        setSaving(true);
        let saveSuccess = true;
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (user) {
                // Save workout to Supabase
                await supabase.getClient().from('workout_sessions').insert({
                    user_id: user.id,
                    start_time: workoutStartRef.current.toISOString(),
                    end_time: new Date().toISOString(),
                    duration: elapsedTime,
                    calories_burned: calories,
                    exercises: Array.isArray(muscleGroups) ? muscleGroups : [],
                    notes: workoutName,
                });
                // Log streak
                try { await StreakService.getInstance().logWorkout(); } catch { }
                // Award XP (10 base + 1 per minute + 1 per 50 cal)
                const xpAmount = 10 + Math.round(elapsedTime / 60) + Math.round(calories / 50);
                try { await LeagueService.getInstance().addXP(xpAmount, 'workout', workoutName); } catch { }
                
                // Update Missions
                try { await MissionService.getInstance().updateProgressByCategory('workout', 1); } catch { }
            }
        } catch (err) {
            console.warn('Workout save error:', err);
            saveSuccess = false;
        } finally {
            setSaving(false);
        }
        if (saveSuccess) {
            showAlert({
                type: 'success',
                title: isTurkish ? 'İdman Tamamlandı!' : 'Workout Complete!',
                message: isTurkish
                    ? `Süre: ${formatTime(elapsedTime)}\nYakılan: ${calories} kcal\nOrtalama Nabız: ${heartRate ?? '-'} BPM`
                    : `Duration: ${formatTime(elapsedTime)}\nBurned: ${calories} kcal\nAvg HR: ${heartRate ?? '-'} BPM`,
                buttons: [{ 
                    text: isTurkish ? 'Harika!' : 'Awesome!', 
                    onPress: async () => {
                        safeGoBack(navigation, 'Workout');
                        await AdService.getInstance().showInterstitialIfAvailable();
                    }
                }],
            });
        } else {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Kaydetme Hatası' : 'Save Error',
                message: isTurkish
                    ? 'İdman kaydedilemedi. Lütfen tekrar deneyin.'
                    : 'Failed to save workout. Please try again.',
                buttons: [{ text: isTurkish ? 'Tamam' : 'OK' }],
            });
        }
    };

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => {
                    showAlert({
                        type: 'confirm',
                        title: isTurkish ? 'İdmanı Bırak' : 'Quit Workout',
                        message: isTurkish ? 'İdmanı bitirmek istediğinize emin misiniz? İlerleme kaydedilmeyecek.' : 'Are you sure you want to quit? Progress will not be saved.',
                        buttons: [
                            { text: isTurkish ? 'İptal' : 'Cancel', style: 'cancel' },
                            { text: isTurkish ? 'Bırak' : 'Quit', style: 'destructive', onPress: () => safeGoBack(navigation, 'Workout') },
                        ],
                    });
                }} style={styles.iconBtn}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.statusBadge, isPaused && { backgroundColor: colors.warning + '20' }]}>
                    <View style={[styles.statusDot, isPaused && { backgroundColor: colors.warning }]} />
                    <Text style={[styles.statusText, isPaused && { color: colors.warning }]}>
                        {isPaused
                            ? (isTurkish ? 'Duraklatıldı' : 'Paused')
                            : sensorSource
                                ? (isTurkish ? 'Canlı Sensör Verisi' : 'Live Sensor Data')
                                : (isTurkish ? 'Sensör Bağlantısı Bekleniyor' : 'Waiting for Sensor Connection')}
                    </Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Spotify')}>
                    <Ionicons name="musical-notes" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.workoutName}>{workoutName}</Text>
                <Text style={styles.timerLarge}>{formatTime(elapsedTime)}</Text>

                <View style={styles.metricsGrid}>
                    {/* Heart Rate Metric */}
                    <View style={styles.metricCard}>
                        <Animated.View style={[styles.heartContainer, animatedHeartStyle]}>
                            <Ionicons name="heart" size={48} color={colors.error} />
                        </Animated.View>
                        <Text style={styles.metricValue}>{heartRate ?? '--'} <Text style={styles.metricUnit}>BPM</Text></Text>
                        <Text style={styles.metricLabel}>{isTurkish ? 'Nabız' : 'Heart Rate'}</Text>
                    </View>

                    {/* Calories Metric */}
                    <View style={styles.metricCard}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flame" size={32} color={colors.streak} />
                        </View>
                        <Text style={styles.metricValue}>{calories} <Text style={styles.metricUnit}>kcal</Text></Text>
                        <Text style={styles.metricLabel}>{isTurkish ? 'Yakılan' : 'Burned'}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[styles.playPauseBtn, isPaused && { backgroundColor: colors.success }]}
                    onPress={() => setIsPaused(!isPaused)}
                >
                    <Ionicons name={isPaused ? "play" : "pause"} size={32} color={colors.textInverse} />
                </TouchableOpacity>

                <AnimatedButton
                    title={isTurkish ? 'İdmanı Bitir' : 'Finish Workout'}
                    onPress={handleFinish}
                    style={styles.finishBtn}
                />
            </View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.pill },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
    statusText: { ...TYPOGRAPHY.captionBold, color: colors.success },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
    workoutName: { ...TYPOGRAPHY.h2, color: colors.textSecondary, marginBottom: SPACING.sm },
    timerLarge: { fontSize: 72, fontWeight: '800', color: colors.text, fontFamily: 'monospace', marginBottom: SPACING.xxl },
    metricsGrid: { flexDirection: 'row', gap: SPACING.lg, width: '100%', paddingHorizontal: SPACING.md },
    metricCard: { flex: 1, backgroundColor: colors.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, alignItems: 'center', ...SHADOWS.sm },
    heartContainer: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
    iconContainer: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
    metricValue: { ...TYPOGRAPHY.h2, color: colors.text },
    metricUnit: { ...TYPOGRAPHY.body, color: colors.textSecondary },
    metricLabel: { ...TYPOGRAPHY.caption, color: colors.textTertiary, marginTop: 4 },
    controls: { paddingHorizontal: SPACING.xl, gap: SPACING.lg },
    playPauseBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.warning, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.md },
    finishBtn: { backgroundColor: colors.error }
});
