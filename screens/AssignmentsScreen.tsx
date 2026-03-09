import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '../services/supabase';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function AssignmentsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [nutrition, setNutrition] = useState<any[]>([]);
    const [supplements, setSupplements] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'workout' | 'nutrition' | 'supplement'>('workout');
    const locale = isTurkish ? 'tr-TR' : 'en-US';

    const formatDate = (value?: string) => {
        if (!value) return isTurkish ? 'Tarih yok' : 'No date';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return isTurkish ? 'Geçersiz tarih' : 'Invalid date';
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

            const [workoutRes, nutritionRes, suppRes] = await Promise.all([
                supabase.getAssignedWorkouts(user.id),
                supabase.getAssignedNutritionPlans(user.id),
                supabase.getAssignedSupplements(user.id).catch(() => ({ data: [] }))
            ]);

            if (workoutRes.data) setWorkouts(workoutRes.data);
            if (nutritionRes.data) setNutrition(nutritionRes.data);
            if (suppRes?.data) {
                setSupplements(suppRes.data);
                setupReminders(suppRes.data);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupReminders = async (data: any[]) => {
        const notifService = NotificationService.getInstance();
        const hasPermission = await notifService.requestPermissions();
        if (!hasPermission) return;

        for (const item of data) {
            if (item.reminder_time) {
                // assume "08:30" format from DB
                const [h, m] = item.reminder_time.split(':');
                if (h && m) {
                    await notifService.scheduleDailyReminder(
                        isTurkish ? 'Takviye Hatırlatıcı' : 'Supplement Reminder',
                        isTurkish ? `${item.title} alma vaktin geldi!` : `Time to take your ${item.title}!`,
                        parseInt(h),
                        parseInt(m),
                        `supp_reminder_${item.id}`,
                        'Assignments'
                    );
                }
            }
        }
    };

    const handleCompleteWorkout = async (id: string) => {
        try {
            const supabase = SupabaseService.getInstance();
            await supabase.completeWorkout(id, 'Completed from mobile app');
            // Refresh
            loadAssignments();
        } catch (e) {
            console.error('Error completing workout', e);
        }
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <LinearGradient colors={GRADIENTS.primary as any} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Atanan Programlar' : 'My Assignments'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'workout' && styles.activeTab]}
                    onPress={() => setActiveTab('workout')}
                >
                    <Text style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}>
                        {isTurkish ? 'Antrenman' : 'Workout'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
                    onPress={() => setActiveTab('nutrition')}
                >
                    <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
                        {isTurkish ? 'Beslenme' : 'Nutrition'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'supplement' && styles.activeTab]}
                    onPress={() => setActiveTab('supplement')}
                >
                    <Text style={[styles.tabText, activeTab === 'supplement' && styles.activeTabText]}>
                        {isTurkish ? 'Takviye' : 'Supplements'}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{workouts.length}</Text>
                            <Text style={styles.summaryLabel}>{isTurkish ? 'Toplam Antrenman' : 'Total Workouts'}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{workoutCompletionRate}%</Text>
                            <Text style={styles.summaryLabel}>{isTurkish ? 'Tamamlanma Oranı' : 'Completion Rate'}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{activeNutritionPlans}</Text>
                            <Text style={styles.summaryLabel}>{isTurkish ? 'Aktif Beslenme' : 'Active Nutrition'}</Text>
                        </View>
                    </View>

                    {activeTab === 'workout' ? (
                        workouts.length > 0 ? workouts.map(item => (
                            <GlassCard key={item.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardDate}>{formatDate(item.scheduled_date)}</Text>
                                    </View>
                                    {item.is_completed ? (
                                        <View style={styles.badgeSuccess}>
                                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                            <Text style={styles.badgeTextSuccess}>{isTurkish ? 'Tamamlandı' : 'Done'}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.badgePending}>
                                            <Ionicons name="time-outline" size={14} color={colors.warning} />
                                            <Text style={styles.badgeTextPending}>{isTurkish ? 'Bekliyor' : 'Pending'}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.cardDesc}>{item.description || (isTurkish ? 'Açıklama yok' : 'No description')}</Text>
                                <View style={styles.proInfo}>
                                    <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                    <Text style={styles.proText}>
                                        {item.pt?.first_name} {item.pt?.last_name}
                                    </Text>
                                </View>
                                {!item.is_completed && (
                                    <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteWorkout(item.id)}>
                                        <Text style={styles.completeBtnText}>{isTurkish ? 'Tamamla' : 'Mark Complete'}</Text>
                                    </TouchableOpacity>
                                )}
                            </GlassCard>
                        )) : (
                            <Text style={styles.emptyText}>{isTurkish ? 'Henüz antrenman atanmadı.' : 'No workouts assigned yet.'}</Text>
                        )
                    ) : activeTab === 'nutrition' ? (
                        nutrition.length > 0 ? nutrition.map(item => (
                            <GlassCard key={item.id} style={styles.card}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardDesc}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</Text>

                                <View style={styles.macrosContainer}>
                                    <View style={styles.macroBox}>
                                        <Text style={styles.macroValue}>{item.target_calories || 0}</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Kalori' : 'Calories'}</Text>
                                    </View>
                                    <View style={styles.macroBox}>
                                        <Text style={styles.macroValue}>{item.target_protein || 0}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Protein' : 'Protein'}</Text>
                                    </View>
                                    <View style={styles.macroBox}>
                                        <Text style={styles.macroValue}>{item.target_carbs || 0}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Karb' : 'Carbs'}</Text>
                                    </View>
                                    <View style={styles.macroBox}>
                                        <Text style={styles.macroValue}>{item.target_fats || 0}g</Text>
                                        <Text style={styles.macroLabel}>{isTurkish ? 'Yağ' : 'Fats'}</Text>
                                    </View>
                                </View>

                                {item.notes && <Text style={[styles.cardDesc, { marginTop: 8 }]}>{item.notes}</Text>}
                                <View style={[styles.proInfo, { marginTop: 12 }]}>
                                    <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                    <Text style={styles.proText}>
                                        {item.dietitian?.first_name} {item.dietitian?.last_name}
                                    </Text>
                                </View>
                            </GlassCard>
                        )) : (
                            <Text style={styles.emptyText}>{isTurkish ? 'Henüz beslenme programı atanmadı.' : 'No nutrition plans assigned yet.'}</Text>
                        )
                    ) : (
                        supplements.length > 0 ? supplements.map(item => (
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
                                    {isTurkish ? 'Dozaj: ' : 'Dosage: '} {item.dosage || '-'}
                                </Text>
                                {item.notes && <Text style={[styles.cardDesc, { marginTop: 4 }]}>{item.notes}</Text>}
                                <View style={styles.proInfo}>
                                    <Ionicons name="person-circle-outline" size={18} color={colors.textTertiary} />
                                    <Text style={styles.proText}>
                                        {item.dietitian?.first_name || item.pt?.first_name} {item.dietitian?.last_name || item.pt?.last_name}
                                    </Text>
                                </View>
                            </GlassCard>
                        )) : (
                            <Text style={styles.emptyText}>{isTurkish ? 'Henüz takviye atanmadı.' : 'No supplements assigned yet.'}</Text>
                        )
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', flex: 1, textAlign: 'center' },
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
});
