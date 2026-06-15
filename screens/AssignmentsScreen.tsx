import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { parseHHMM, formatHHMMKey } from '../utils/timeValidation';

export default function AssignmentsScreen({ navigation, route }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    const { t, isTurkish, language } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [nutrition, setNutrition] = useState<any[]>([]);
    const [supplements, setSupplements] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'workout' | 'nutrition' | 'supplement'>('workout');
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [isProfessionalView, setIsProfessionalView] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
    const [weeklyAction, setWeeklyAction] = useState<'increase' | 'decrease' | 'stable'>('stable');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [exerciseFeedback, setExerciseFeedback] = useState<Array<{ name: string; sets: string; reps: string; weight: string; action: 'increase' | 'decrease' | 'stable' }>>([]);
    const locale = isTurkish ? 'tr-TR' : 'en-US';

    useEffect(() => {
        if (route.params?.tab) {
            setActiveTab(route.params.tab);
        }
    }, [route.params]);

    const formatDate = (value?: string) => {
        if (!value) return t('no_date');
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return t('invalid_date');
        return parsed.toLocaleDateString(locale);
    };

    const completedWorkouts = workouts.filter(item => item.is_completed).length;
    const workoutCompletionRate = workouts.length > 0 ? Math.round((completedWorkouts / workouts.length) * 100) : 0;
    const activeNutritionPlans = nutrition.filter(item => item.is_active !== false).length;

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) return;

            const targetUserId = route.params?.clientId || user.id;
            setIsProfessionalView(!!route.params?.clientId && route.params?.clientId !== user.id);

            const [workoutRes, nutritionRes, suppRes] = await Promise.all([
                supabase.getAssignedWorkouts(targetUserId),
                supabase.getAssignedNutritionPlans(targetUserId),
                supabase.getAssignedSupplements(targetUserId).catch(() => ({ data: [] }))
            ]);

            if (workoutRes.data) {
                setWorkouts(workoutRes.data);
                setupReminders(workoutRes.data, 'workout');
            }
            if (nutritionRes.data) {
                setNutrition(nutritionRes.data);
                setupReminders(nutritionRes.data, 'nutrition');
            }
            if (suppRes?.data) {
                setSupplements(suppRes.data);
                setupReminders(suppRes.data, 'supplement');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupReminders = async (data: any[], type: 'supplement' | 'workout' | 'nutrition' = 'supplement') => {
        const notifService = NotificationService.getInstance();
        const hasPermission = await notifService.requestPermissions();

        // Also try calendar sync
        const CalendarService = require('../services/calendarService').CalendarService;
        const calendarService = CalendarService.getInstance();
        const hasCalendarPermission = await calendarService.requestPermissions();

        if (!hasPermission && !hasCalendarPermission) return;

        for (const item of data) {
            if (item.reminder_time) {
                // Handle both array (text[]) and string formats
                const times = Array.isArray(item.reminder_time) ? item.reminder_time : [item.reminder_time];

                for (const timeStr of times) {
                    const parsed = parseHHMM(timeStr);
                    if (!parsed) {
                        // Skip malformed/out-of-range reminders rather than scheduling a 99:99 alarm
                        // (the old code accepted any parseInt() output and silently shifted the day).
                        continue;
                    }
                    const keySuffix = formatHHMMKey(parsed);
                    if (hasPermission) {
                        await notifService.scheduleSmartReminder(
                            type === 'supplement' ? 'supplement' : (type === 'workout' ? 'workout' : 'nutrition'),
                            parsed.hour,
                            parsed.minute,
                            `${type}_reminder_${item.id}_${keySuffix}`,
                            'Assignments',
                            { screen: 'Assignments', params: { tab: type } },
                            language,
                            { name: item.title || item.name || item.description }
                        );
                    }

                    if (hasCalendarPermission) {
                        // Create a calendar event for today at that time
                        const startDate = new Date();
                        startDate.setHours(parsed.hour, parsed.minute, 0, 0);
                        const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 mins later

                        await calendarService.syncEventToCalendar(
                            `NextSelf: ${item.title || item.name || 'Reminder'}`,
                            startDate,
                            endDate,
                            item.notes || item.description || ''
                        );
                    }
                }
            } else if (item.scheduled_date && type === 'workout' && hasCalendarPermission) {
                // Sync workout to calendar if it has a date
                const startDate = new Date(item.scheduled_date);
                startDate.setHours(10, 0, 0, 0); // Default to 10 AM if no specific time
                const endDate = new Date(startDate.getTime() + 60 * 60000); // 1 hour

                await calendarService.syncEventToCalendar(
                    `NextSelf Workout: ${item.title}`,
                    startDate,
                    endDate,
                    item.description || ''
                );
            }
        }
    };

    const openWorkoutFeedback = (workout: any) => {
        const exercises = Array.isArray(workout?.exercises) && workout.exercises.length > 0
            ? workout.exercises
            : [{ name: isTurkish ? 'Genel Antrenman' : 'General Workout', sets: '', reps: '', weight: '' }];
        const normalized = exercises.map((exercise: any, index: number) => ({
            name: exercise?.name || exercise?.exercise_name || `${isTurkish ? 'Hareket' : 'Exercise'} ${index + 1}`,
            sets: exercise?.sets ? String(exercise.sets) : '',
            reps: exercise?.reps ? String(exercise.reps) : '',
            weight: exercise?.weight ? String(exercise.weight) : '',
            action: 'stable' as const,
        }));
        setSelectedWorkout(workout);
        setExerciseFeedback(normalized);
        setWeeklyAction('stable');
        setFeedbackNotes('');
        setFeedbackVisible(true);
    };

    const updateExerciseField = (index: number, field: 'sets' | 'reps' | 'weight' | 'action', value: string) => {
        setExerciseFeedback((prev) => prev.map((row, rowIndex) => (
            rowIndex === index
                ? { ...row, [field]: value }
                : row
        )));
    };

    const handleCompleteWorkout = async (id: string, feedbackPayload?: any) => {
        try {
            const supabase = SupabaseService.getInstance();
            await supabase.completeWorkout(
                id,
                feedbackPayload ? JSON.stringify(feedbackPayload) : 'Completed from mobile app'
            );
            // Refresh
            loadAssignments();
        } catch (e) {
            console.error('Error completing workout', e);
        }
    };

    const submitWorkoutFeedback = async () => {
        if (!selectedWorkout?.id) return;
        const payload = {
            weeklyAction,
            notes: feedbackNotes.trim(),
            exerciseFeedback,
            submittedAt: new Date().toISOString(),
            weeklyAutoUpdate: true,
        };
        await handleCompleteWorkout(selectedWorkout.id, payload);
        setFeedbackVisible(false);
        setSelectedWorkout(null);
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <LinearGradient colors={GRADIENTS.primary as any} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Profile')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? colors.text : colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('my_assignments')}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'workout' && styles.activeTab]}
                    onPress={() => setActiveTab('workout')}
                >
                    <Text style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}>
                        {t('workout')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
                    onPress={() => setActiveTab('nutrition')}
                >
                    <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
                        {t('nutrition')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'supplement' && styles.activeTab]}
                    onPress={() => setActiveTab('supplement')}
                >
                    <Text style={[styles.tabText, activeTab === 'supplement' && styles.activeTabText]}>
                        {t('supplements')}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    data={activeTab === 'workout' ? workouts : activeTab === 'nutrition' ? nutrition : supplements}
                    keyExtractor={(item) => String(item.id)}
                    ListHeaderComponent={
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{workouts.length}</Text>
                                <Text style={styles.summaryLabel}>{t('total_workouts')}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{workoutCompletionRate}%</Text>
                                <Text style={styles.summaryLabel}>{t('completion_rate')}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{activeNutritionPlans}</Text>
                                <Text style={styles.summaryLabel}>{t('active_nutrition')}</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{t(activeTab === 'workout' ? 'no_workouts_assigned' : activeTab === 'supplement' ? 'no_supplements_assigned' : 'no_nutrition_assigned')}</Text>
                    }
                    renderItem={({ item }) => {
                        if (activeTab === 'workout') {
                            return (
                                <GlassCard key={item.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            <Text style={styles.cardDate}>{formatDate(item.scheduled_date)}</Text>
                                        </View>
                                        {item.is_completed ? (
                                            <View style={styles.badgeSuccess}>
                                                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                                <Text style={styles.badgeTextSuccess}>{t('completed')}</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.badgePending}>
                                                <Ionicons name="time-outline" size={14} color={colors.warning} />
                                                <Text style={styles.badgeTextPending}>{t('pending')}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.cardDesc}>{item.description || t('no_description')}</Text>
                                    <View style={styles.proInfo}>
                                        <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                        <Text style={styles.proText}>
                                            {item.pt?.first_name} {item.pt?.last_name}
                                        </Text>
                                    </View>
                                    {!item.is_completed && !isProfessionalView && (
                                        <TouchableOpacity style={styles.completeBtn} onPress={() => openWorkoutFeedback(item)}>
                                            <Text style={styles.completeBtnText}>{t('mark_complete')}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {isProfessionalView && item.exercises && item.exercises.length > 0 && (
                                        <View style={{ marginTop: SPACING.md, backgroundColor: colors.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md }}>
                                            <Text style={{ ...TYPOGRAPHY.captionBold, color: colors.text, marginBottom: SPACING.xs }}>{isTurkish ? 'Egzersizler' : 'Exercises'}</Text>
                                            {item.exercises.map((ex: any, idx: number) => (
                                                <Text key={idx} style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
                                                    • {ex.name} ({ex.sets} {isTurkish ? 'set' : 'sets'} x {ex.reps} {isTurkish ? 'tekrar' : 'reps'} {ex.weight ? `- ${ex.weight}kg` : ''})
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </GlassCard>
                            )
                        } else if (activeTab === 'nutrition') {
                            return (
                                <GlassCard key={item.id} style={styles.card}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDesc}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</Text>

                                    <View style={styles.macrosContainer}>
                                        <View style={styles.macroBox}>
                                            <Text style={styles.macroValue}>{item.target_calories || 0}</Text>
                                            <Text style={styles.macroLabel}>{t('calories')}</Text>
                                        </View>
                                        <View style={styles.macroBox}>
                                            <Text style={styles.macroValue}>{item.target_protein || 0}g</Text>
                                            <Text style={styles.macroLabel}>{t('protein')}</Text>
                                        </View>
                                        <View style={styles.macroBox}>
                                            <Text style={styles.macroValue}>{item.target_carbs || 0}g</Text>
                                            <Text style={styles.macroLabel}>{t('carbs')}</Text>
                                        </View>
                                        <View style={styles.macroBox}>
                                            <Text style={styles.macroValue}>{item.target_fats || 0}g</Text>
                                            <Text style={styles.macroLabel}>{t('fat')}</Text>
                                        </View>
                                    </View>

                                    {item.notes && <Text style={[styles.cardDesc, { marginTop: 8 }]}>{item.notes}</Text>}
                                    <View style={[styles.proInfo, { marginTop: 12 }]}>
                                        <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                        <Text style={styles.proText}>
                                            {item.dietitian?.first_name} {item.dietitian?.last_name}
                                        </Text>
                                    </View>
                                    {isProfessionalView && item.meals && item.meals.length > 0 && (
                                        <View style={{ marginTop: SPACING.md, backgroundColor: colors.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md }}>
                                            <Text style={{ ...TYPOGRAPHY.captionBold, color: colors.text, marginBottom: SPACING.xs }}>{isTurkish ? 'Öğünler' : 'Meals'}</Text>
                                            {item.meals.map((meal: any, idx: number) => (
                                                <Text key={idx} style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
                                                    • {meal.type || (isTurkish ? 'Öğün' : 'Meal')}: {meal.foods?.map((f: any) => f.name).join(', ') || meal.description || ''}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </GlassCard>
                            )
                        } else {
                            return (
                                <GlassCard key={item.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                                        </View>
                                        {item.reminder_time && (
                                            <View style={styles.badgePending}>
                                                <Ionicons name="notifications-outline" size={14} color={colors.warning} />
                                                <Text style={styles.badgeTextPending}>{item.reminder_time}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.cardDesc}>
                                        {t('dosage')}: {item.dosage || '-'}
                                    </Text>
                                    {item.notes && <Text style={[styles.cardDesc, { marginTop: 4 }]}>{item.notes}</Text>}
                                    <View style={styles.proInfo}>
                                        <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                        <Text style={styles.proText}>
                                            {item.dietitian?.first_name || item.pt?.first_name} {item.dietitian?.last_name || item.pt?.last_name}
                                        </Text>
                                    </View>
                                </GlassCard>
                            )
                        }
                    }}
                />
            )}

            <Modal visible={feedbackVisible} transparent animationType="slide" onRequestClose={() => setFeedbackVisible(false)}>
                <View style={styles.feedbackOverlay}>
                    <View style={styles.feedbackSheet}>
                        <Text style={styles.feedbackTitle}>{isTurkish ? 'Antrenman Geri Bildirimi' : 'Workout Feedback'}</Text>
                        <Text style={styles.feedbackSubtitle}>
                            {isTurkish ? 'Programı haftalık güncellemek için kısa geri bildirim ver.' : 'Give quick feedback for weekly plan updates.'}
                        </Text>

                        <Text style={styles.feedbackSectionLabel}>{isTurkish ? 'Haftalık genel karar' : 'Weekly overall action'}</Text>
                        <View style={styles.feedbackActionRow}>
                            {[
                                { key: 'increase', label: isTurkish ? 'Artır' : 'Increase' },
                                { key: 'stable', label: isTurkish ? 'Sabit' : 'Stable' },
                                { key: 'decrease', label: isTurkish ? 'Azalt' : 'Decrease' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.actionChip, weeklyAction === opt.key && styles.actionChipActive]}
                                    onPress={() => setWeeklyAction(opt.key as 'increase' | 'decrease' | 'stable')}
                                >
                                    <Text style={[styles.actionChipText, weeklyAction === opt.key && styles.actionChipTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            style={styles.feedbackExerciseList}
                            contentContainerStyle={{ paddingBottom: SPACING.md }}
                            data={exerciseFeedback}
                            keyExtractor={(item, idx) => `${item.name}_${idx}`}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item: exercise, index }) => (
                                <View key={`${exercise.name}_${index}`} style={styles.exerciseFeedbackCard}>
                                    <Text style={styles.exerciseFeedbackName}>{exercise.name}</Text>
                                    <View style={styles.exerciseFieldsRow}>
                                        <TextInput
                                            value={exercise.sets}
                                            onChangeText={(value) => updateExerciseField(index, 'sets', value)}
                                            placeholder={isTurkish ? 'Set' : 'Sets'}
                                            keyboardType="number-pad"
                                            style={styles.exerciseInput}
                                        />
                                        <TextInput
                                            value={exercise.reps}
                                            onChangeText={(value) => updateExerciseField(index, 'reps', value)}
                                            placeholder={isTurkish ? 'Tekrar' : 'Reps'}
                                            keyboardType="number-pad"
                                            style={styles.exerciseInput}
                                        />
                                        <TextInput
                                            value={exercise.weight}
                                            onChangeText={(value) => updateExerciseField(index, 'weight', value)}
                                            placeholder={isTurkish ? 'Ağırlık' : 'Weight'}
                                            keyboardType="decimal-pad"
                                            style={styles.exerciseInput}
                                        />
                                    </View>
                                    <View style={styles.feedbackActionRow}>
                                        {[
                                            { key: 'increase', label: isTurkish ? '↑ Artır' : '↑ Increase' },
                                            { key: 'stable', label: isTurkish ? '→ Sabit' : '→ Stable' },
                                            { key: 'decrease', label: isTurkish ? '↓ Azalt' : '↓ Decrease' },
                                        ].map((opt) => (
                                            <TouchableOpacity
                                                key={opt.key}
                                                style={[styles.actionChipSmall, exercise.action === opt.key && styles.actionChipSmallActive]}
                                                onPress={() => updateExerciseField(index, 'action', opt.key)}
                                            >
                                                <Text style={[styles.actionChipSmallText, exercise.action === opt.key && styles.actionChipSmallTextActive]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        />

                        <TextInput
                            value={feedbackNotes}
                            onChangeText={setFeedbackNotes}
                            placeholder={isTurkish ? 'Notlar (opsiyonel)' : 'Notes (optional)'}
                            multiline
                            style={styles.feedbackNotesInput}
                        />

                        <View style={styles.feedbackFooter}>
                            <TouchableOpacity style={styles.feedbackCancelBtn} onPress={() => setFeedbackVisible(false)}>
                                <Text style={styles.feedbackCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.feedbackSaveBtn} onPress={submitWorkoutFeedback}>
                                <Text style={styles.feedbackSaveText}>{isTurkish ? 'Bitir ve Kaydet' : 'Finish & Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: isDark ? colors.text : colors.textInverse, flex: 1, textAlign: 'center' },
    tabContainer: { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: SPACING.lg, marginTop: -20, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.sm },
    tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { ...TYPOGRAPHY.bodyBold, color: colors.textTertiary },
    activeTabText: { color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, alignItems: 'center' },
    summaryValue: { ...TYPOGRAPHY.h3, color: colors.text },
    summaryLabel: { ...TYPOGRAPHY.caption, color: colors.textTertiary, textAlign: 'center', marginTop: 2 },
    card: { marginBottom: SPACING.md, padding: SPACING.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
    cardTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    cardDate: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
    cardDesc: { ...TYPOGRAPHY.body, color: colors.textSecondary, marginBottom: SPACING.md },
    badgeSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeTextSuccess: { fontSize: 12, fontWeight: 'bold', color: colors.success },
    badgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeTextPending: { fontSize: 12, fontWeight: 'bold', color: colors.warning },
    proInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: SPACING.sm },
    proText: { ...TYPOGRAPHY.small, color: colors.textTertiary },
    completeBtn: { marginTop: SPACING.md, backgroundColor: colors.primarySoft, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    completeBtnText: { ...TYPOGRAPHY.bodyBold, color: colors.primary },
    emptyText: { ...TYPOGRAPHY.body, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING.xxxl },
    macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, backgroundColor: colors.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    macroBox: { alignItems: 'center' },
    macroValue: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    macroLabel: { ...TYPOGRAPHY.caption, color: colors.textTertiary },
    feedbackOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    feedbackSheet: { backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: SPACING.lg, maxHeight: '88%' },
    feedbackTitle: { ...TYPOGRAPHY.h3, color: colors.text },
    feedbackSubtitle: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 4, marginBottom: SPACING.md },
    feedbackSectionLabel: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginBottom: 8 },
    feedbackActionRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md, flexWrap: 'wrap' },
    actionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface },
    actionChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    actionChipText: { ...TYPOGRAPHY.caption, color: colors.textSecondary, fontWeight: '700' },
    actionChipTextActive: { color: colors.primary },
    feedbackExerciseList: { maxHeight: 280, marginBottom: SPACING.md },
    exerciseFeedbackCard: { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.borderLight },
    exerciseFeedbackName: { ...TYPOGRAPHY.bodyBold, color: colors.text, marginBottom: 8 },
    exerciseFieldsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    exerciseInput: { flex: 1, backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, textAlign: 'center' },
    actionChipSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight },
    actionChipSmallActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    actionChipSmallText: { ...TYPOGRAPHY.caption, color: colors.textSecondary, fontWeight: '700' },
    actionChipSmallTextActive: { color: colors.primary },
    feedbackNotesInput: { minHeight: 72, maxHeight: 120, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight, padding: SPACING.sm, color: colors.text, textAlignVertical: 'top', marginBottom: SPACING.md },
    feedbackFooter: { flexDirection: 'row', gap: SPACING.sm },
    feedbackCancelBtn: { flex: 1, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight, paddingVertical: 12, alignItems: 'center' },
    feedbackCancelText: { ...TYPOGRAPHY.bodyBold, color: colors.textSecondary },
    feedbackSaveBtn: { flex: 1, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
    feedbackSaveText: { ...TYPOGRAPHY.bodyBold, color: isDark ? colors.text : colors.textInverse },
});
