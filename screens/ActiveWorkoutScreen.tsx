import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedButton from '../components/AnimatedButton';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { LeagueService } from '../services/leagueService';
import { StreakService } from '../services/streakService';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function ActiveWorkoutScreen({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();

    // Workout State
    const [elapsedTime, setElapsedTime] = useState(0);
    const [heartRate, setHeartRate] = useState(85);
    const [calories, setCalories] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const workoutName = route.params?.workoutName || (isTurkish ? 'Serbest İdman' : 'Freestyle Workout');
    const muscleGroups = route.params?.muscleGroups || [];
    const [saving, setSaving] = useState(false);

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
    }, []);

    const animatedHeartStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: scale.value }] };
    });

    // Timer & Mock Data Update — use refs to avoid recreating interval on every tick
    const elapsedTimeRef = React.useRef(elapsedTime);
    const heartRateRef = React.useRef(heartRate);
    elapsedTimeRef.current = elapsedTime;
    heartRateRef.current = heartRate;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isPaused) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                // Simulate Heart Rate fluctuations (100 - 170 BPM based on elapsed time logic)
                if (elapsedTimeRef.current > 5) {
                    setHeartRate(prev => {
                        const target = 130 + Math.random() * 40; // 130-170 Range
                        return Math.round(prev + (target - prev) * 0.1);
                    });
                }

                // Simulate Calorie Burn (approx 10-15 cal per min based on HR)
                if (elapsedTimeRef.current > 0 && elapsedTimeRef.current % 5 === 0) {
                    const hrFactor = Math.max(0, (heartRateRef.current - 60) * 0.03);
                    setCalories(prev => prev + Math.max(1, Math.round(1 + hrFactor)));
                }

            }, 1000);
        }
        return () => clearInterval(interval);
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
                await supabase.getClient().from('workouts').insert({
                    user_id: user.id,
                    name: workoutName,
                    duration_minutes: Math.round(elapsedTime / 60),
                    calories_burned: calories,
                    heart_rate_avg: heartRate,
                    muscle_groups: muscleGroups,
                    completed: true,
                });
                // Log streak
                try { await StreakService.getInstance().logWorkout(); } catch { }
                // Award XP (10 base + 1 per minute + 1 per 50 cal)
                const xpAmount = 10 + Math.round(elapsedTime / 60) + Math.round(calories / 50);
                try { await LeagueService.getInstance().addXP(xpAmount, 'workout', workoutName); } catch { }
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
                    ? `Süre: ${formatTime(elapsedTime)}\nYakılan: ${calories} kcal\nOrtalama Nabız: ${heartRate} BPM`
                    : `Duration: ${formatTime(elapsedTime)}\nBurned: ${calories} kcal\nAvg HR: ${heartRate} BPM`,
                buttons: [{ text: isTurkish ? 'Harika!' : 'Awesome!', onPress: () => navigation.goBack() }],
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
                            { text: isTurkish ? 'Bırak' : 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
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
                            : (isTurkish ? 'Canlı Saat Sensörü' : 'Live Watch Sensor')}
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
                        <Text style={styles.metricValue}>{heartRate} <Text style={styles.metricUnit}>BPM</Text></Text>
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
