import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, useWindowDimensions, RefreshControl, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedCard from '../components/AnimatedCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useProgressReport, Period } from '../hooks/useProgressReport';

let LineChart: any;
try { const ck = require('react-native-chart-kit'); LineChart = ck.LineChart; } catch { }

export default function ProgressReportScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const [period, setPeriod] = useState<Period>('weekly');
    const { loading, refreshing, bodyMetrics, workoutSummary, nutritionSummary, goalProgress, onRefresh } = useProgressReport(period, isTurkish);

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        decimalPlaces: 1,
        color: () => colors.primary,
        labelColor: () => colors.textSecondary,
        propsForDots: { r: '3', strokeWidth: '2', stroke: colors.primary },
    };

    const shareReport = async () => {
        const latest = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1] : null;
        const reportText = [
            `📊 BioSync ${isTurkish ? 'İlerleme Raporu' : 'Progress Report'}`,
            `📅 ${period === 'weekly' ? (isTurkish ? 'Haftalık' : 'Weekly') : period === 'monthly' ? (isTurkish ? 'Aylık' : 'Monthly') : (isTurkish ? 'Yıllık' : 'Yearly')}`,
            '',
            latest ? `⚖️ ${isTurkish ? 'Kilo' : 'Weight'}: ${latest.weight} kg` : '',
            latest?.bodyFat ? `🔥 ${isTurkish ? 'Yağ' : 'Fat'}: ${latest.bodyFat}%` : '',
            latest?.muscleMass ? `💪 ${isTurkish ? 'Kas' : 'Muscle'}: ${latest.muscleMass}%` : '',
            '',
            workoutSummary ? `🏋️ ${isTurkish ? 'Antrenman' : 'Workouts'}: ${workoutSummary.totalWorkouts}` : '',
            workoutSummary ? `🔥 ${isTurkish ? 'Yakılan Kalori' : 'Calories Burned'}: ${workoutSummary.caloriesBurned}` : '',
            nutritionSummary ? `🍽️ ${isTurkish ? 'Ort. Kalori' : 'Avg. Calories'}: ${nutritionSummary.avgCalories}` : '',
        ].filter(Boolean).join('\n');

        try {
            await Share.share({ message: reportText, title: isTurkish ? 'İlerleme Raporum' : 'My Progress Report' });
        } catch (err) {
            console.warn('Share error:', err);
        }
    };

    const weightChartData = React.useMemo(() => {
        if (bodyMetrics.length < 2) return null;
        const recent = bodyMetrics.slice(-10);
        return {
            labels: recent.map(m => {
                const d = new Date(m.recordedAt);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [{ data: recent.map(m => m.weight), color: () => '#3498db', strokeWidth: 2 }],
        };
    }, [bodyMetrics]);

    const bodyFatChartData = React.useMemo(() => {
        const withFat = bodyMetrics.filter(m => m.bodyFat).slice(-10);
        if (withFat.length < 2) return null;
        return {
            labels: withFat.map(m => {
                const d = new Date(m.recordedAt);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [
                { data: withFat.map(m => m.bodyFat!), color: () => '#e74c3c', strokeWidth: 2 },
                ...(withFat[0].muscleMass ? [{ data: withFat.map(m => m.muscleMass!), color: () => '#2ecc71', strokeWidth: 2 }] : []),
            ],
            legend: withFat[0].muscleMass
                ? [isTurkish ? 'Yağ %' : 'Fat %', isTurkish ? 'Kas %' : 'Muscle %']
                : [isTurkish ? 'Yağ %' : 'Fat %'],
        };
    }, [bodyMetrics, isTurkish]);

    const weightChange = bodyMetrics.length >= 2
        ? Math.round((bodyMetrics[bodyMetrics.length - 1].weight - bodyMetrics[0].weight) * 10) / 10
        : null;

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.text + '15' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.text + '10' }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isTurkish ? 'İlerleme Raporu' : 'Progress Report'}
                </Text>
                <TouchableOpacity onPress={shareReport} style={[styles.shareBtn, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Period Tabs */}
            <View style={[styles.periodContainer, { backgroundColor: colors.text + '08' }]}>
                {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodTab, period === p && styles.periodTabActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                            {p === 'weekly' ? (isTurkish ? 'Haftalık' : 'Weekly')
                                : p === 'monthly' ? (isTurkish ? 'Aylık' : 'Monthly')
                                    : (isTurkish ? 'Yıllık' : 'Yearly')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Quick Stats */}
                    <View style={styles.quickStats}>
                        {[
                            {
                                label: isTurkish ? 'Ölçüm' : 'Measurements',
                                value: bodyMetrics.length.toString(),
                                icon: 'analytics-outline' as const,
                                color: '#3498db',
                            },
                            {
                                label: isTurkish ? 'Antrenman' : 'Workouts',
                                value: workoutSummary?.totalWorkouts?.toString() || '0',
                                icon: 'barbell-outline' as const,
                                color: '#9b59b6',
                            },
                            {
                                label: isTurkish ? 'Kilo Değ.' : 'Weight Δ',
                                value: weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '-',
                                icon: 'trending-down-outline' as const,
                                color: weightChange && weightChange < 0 ? '#2ecc71' : '#e74c3c',
                            },
                        ].map((stat, idx) => (
                            <AnimatedCard key={idx} style={{ ...styles.statCard, backgroundColor: stat.color + '12' }}>
                                <Ionicons name={stat.icon} size={22} color={stat.color} />
                                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </AnimatedCard>
                        ))}
                    </View>

                    {/* Weight Trend Chart */}
                    {LineChart && weightChartData && (
                        <AnimatedCard style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="scale-outline" size={20} color="#3498db" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Kilo Trendi' : 'Weight Trend'}
                                </Text>
                            </View>
                            <LineChart
                                data={weightChartData}
                                width={screenWidth - 64}
                                height={180}
                                chartConfig={{ ...chartConfig, color: () => '#3498db' }}
                                bezier
                                style={{ borderRadius: BORDER_RADIUS.lg }}
                            />
                        </AnimatedCard>
                    )}

                    {/* Body Composition Chart */}
                    {LineChart && bodyFatChartData && (
                        <AnimatedCard style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="body-outline" size={20} color="#e74c3c" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Vücut Kompozisyonu' : 'Body Composition'}
                                </Text>
                            </View>
                            <LineChart
                                data={bodyFatChartData}
                                width={screenWidth - 64}
                                height={180}
                                chartConfig={chartConfig}
                                bezier
                                style={{ borderRadius: BORDER_RADIUS.lg }}
                            />
                        </AnimatedCard>
                    )}

                    {/* Workout Summary */}
                    {workoutSummary && workoutSummary.totalWorkouts > 0 && (
                        <AnimatedCard style={styles.summaryCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="barbell-outline" size={20} color="#9b59b6" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Antrenman Özeti' : 'Workout Summary'}
                                </Text>
                            </View>
                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.totalWorkouts}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Antrenman' : 'Workouts'}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.avgDuration} min</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Ort. Süre' : 'Avg. Duration'}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{workoutSummary.caloriesBurned}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Kalori' : 'Calories'}</Text>
                                </View>
                            </View>
                        </AnimatedCard>
                    )}

                    {/* Nutrition Summary */}
                    {nutritionSummary && (
                        <AnimatedCard style={styles.summaryCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="nutrition-outline" size={20} color="#f39c12" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Beslenme Özeti' : 'Nutrition Summary'}
                                </Text>
                            </View>
                            <View style={styles.macroRow}>
                                {[
                                    { label: isTurkish ? 'Kalori' : 'Calories', val: nutritionSummary.avgCalories, unit: 'kcal', color: '#f39c12' },
                                    { label: isTurkish ? 'Protein' : 'Protein', val: nutritionSummary.avgProtein, unit: 'g', color: '#e74c3c' },
                                    { label: isTurkish ? 'Karb' : 'Carbs', val: nutritionSummary.avgCarbs, unit: 'g', color: '#3498db' },
                                    { label: isTurkish ? 'Yağ' : 'Fat', val: nutritionSummary.avgFat, unit: 'g', color: '#f1c40f' },
                                ].map((macro, idx) => (
                                    <View key={idx} style={[styles.macroItem, { backgroundColor: macro.color + '12' }]}>
                                        <Text style={[styles.macroValue, { color: macro.color }]}>{macro.val}</Text>
                                        <Text style={styles.macroUnit}>{macro.unit}</Text>
                                        <Text style={styles.macroLabel}>{macro.label}</Text>
                                    </View>
                                ))}
                            </View>
                            {/* Adherence Bar */}
                            <View style={styles.adherenceContainer}>
                                <Text style={styles.adherenceLabel}>
                                    {isTurkish ? 'Kayıt Tutma Oranı' : 'Logging Adherence'}
                                </Text>
                                <View style={styles.adherenceBarBg}>
                                    <View style={[styles.adherenceBar, { width: `${nutritionSummary.adherenceRate}%` }]} />
                                </View>
                                <Text style={[styles.adherenceValue, { color: colors.text }]}>
                                    {nutritionSummary.adherenceRate}%
                                </Text>
                            </View>
                        </AnimatedCard>
                    )}

                    {/* Goal Progress */}
                    {goalProgress.length > 0 && (
                        <AnimatedCard style={styles.summaryCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="flag-outline" size={20} color="#2ecc71" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Hedef İlerlemesi' : 'Goal Progress'}
                                </Text>
                            </View>
                            {goalProgress.map((goal, idx) => {
                                const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                                return (
                                    <View key={idx} style={styles.goalItem}>
                                        <View style={styles.goalHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Ionicons name={goal.icon as any} size={18} color={goal.color} />
                                                <Text style={[styles.goalLabel, { color: colors.text }]}>{goal.label}</Text>
                                            </View>
                                            <Text style={styles.goalValues}>
                                                {goal.current}{goal.unit} / {goal.target}{goal.unit}
                                            </Text>
                                        </View>
                                        <View style={styles.goalBarBg}>
                                            <View style={[styles.goalBar, { width: `${progress}%`, backgroundColor: goal.color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </AnimatedCard>
                    )}

                    {/* Empty State */}
                    {bodyMetrics.length === 0 && !workoutSummary && (
                        <View style={styles.emptyState}>
                            <Ionicons name="stats-chart-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {isTurkish ? 'Henüz veri yok' : 'No data yet'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {isTurkish
                                    ? 'Antrenman yapın, tartılın ve beslenmenizi kaydedin'
                                    : 'Log workouts, weigh yourself, and track nutrition'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    shareBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    content: { padding: SPACING.lg, paddingBottom: 100 },

    periodContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.pill, padding: 4 },
    periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: BORDER_RADIUS.pill },
    periodTabActive: { backgroundColor: colors.primary, ...SHADOWS.sm },
    periodText: { ...TYPOGRAPHY.bodyBold, color: colors.textSecondary },
    periodTextActive: { color: '#fff' },

    quickStats: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    statCard: { flex: 1, alignItems: 'center', padding: SPACING.md, gap: 6 },
    statValue: { ...TYPOGRAPHY.h3 },
    statLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary },

    chartCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
    chartTitle: { ...TYPOGRAPHY.bodyBold },

    summaryCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryValue: { ...TYPOGRAPHY.h3 },
    summaryLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 4 },
    summaryDivider: { width: 1, height: 40, backgroundColor: colors.borderLight },

    macroRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    macroItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    macroValue: { ...TYPOGRAPHY.h3 },
    macroUnit: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    macroLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },

    adherenceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    adherenceLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary, flex: 0.3 },
    adherenceBarBg: { flex: 1, height: 8, backgroundColor: colors.borderLight, borderRadius: 4, overflow: 'hidden' },
    adherenceBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    adherenceValue: { ...TYPOGRAPHY.bodyBold, width: 40, textAlign: 'right' },

    goalItem: { marginBottom: SPACING.md },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    goalLabel: { ...TYPOGRAPHY.bodyBold },
    goalValues: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    goalBarBg: { height: 10, backgroundColor: colors.borderLight, borderRadius: 5, overflow: 'hidden' },
    goalBar: { height: '100%', borderRadius: 5 },

    emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
    emptyTitle: { ...TYPOGRAPHY.h3, marginTop: SPACING.md },
    emptySub: { ...TYPOGRAPHY.body, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
});
