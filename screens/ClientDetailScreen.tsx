import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, useWindowDimensions, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedCard from '../components/AnimatedCard';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES, SHADOWS, COLORS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { useProgressReport, Period } from '../hooks/useProgressReport';

let LineChart: any;
try { const ck = require('react-native-chart-kit'); LineChart = ck.LineChart; } catch { }

export default function ClientDetailScreen({ navigation, route }: any) {
    const { client } = route.params || {};
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish, t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const [period, setPeriod] = useState<Period>('weekly');
    const { loading, refreshing, bodyMetrics, workoutSummary, nutritionSummary, hydrationSummary, goalProgress, onRefresh } = useProgressReport(period, isTurkish, client?.id);

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        decimalPlaces: 1,
        color: () => colors.primary,
        labelColor: () => colors.textSecondary,
        propsForDots: { r: '3', strokeWidth: '2', stroke: colors.primary },
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

    if (!client) {
        return (
            <View style={[COMMON_STYLES.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Client not found</Text>
            </View>
        );
    }

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ClientsList')} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {client.first_name} {client.last_name}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                        {isTurkish ? 'Müşteri Takibi' : 'Client Tracking'}
                    </Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Chat', { chatPartnerId: client.id })}
                    style={[styles.chatBtn, { backgroundColor: COLORS.primarySoft }]}
                >
                    <Ionicons name="chatbubble-ellipses" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('Assignments', { clientId: client.id, type: 'workout' })}
                >
                    <Ionicons name="barbell" size={20} color={COLORS.primary} />
                    <Text style={[styles.actionText, { color: colors.text }]}>{isTurkish ? 'Program Ata' : 'Assign Workout'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('Assignments', { clientId: client.id, type: 'nutrition' })}
                >
                    <Ionicons name="restaurant" size={20} color={COLORS.secondary} />
                    <Text style={[styles.actionText, { color: colors.text }]}>{isTurkish ? 'Diyet Ata' : 'Assign Diet'}</Text>
                </TouchableOpacity>
            </View>

            {/* Period Tabs */}
            <View style={[styles.periodContainer, { backgroundColor: colors.surface }]}>
                {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodTab, period === p && { backgroundColor: COLORS.primary }]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, { color: period === p ? '#fff' : colors.textSecondary }]}>
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

                    {/* Hydration & Micro-nutrients Summary */}
                    {hydrationSummary && (
                        <AnimatedCard style={styles.summaryCard}>
                            <View style={styles.chartHeader}>
                                <Ionicons name="water-outline" size={20} color="#00B7FF" />
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {isTurkish ? 'Sıvı & Sağlık Özeti' : 'Hydration & Health'}
                                </Text>
                            </View>
                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: '#00B7FF' }]}>{hydrationSummary.totalLiters}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Top. Litre' : 'Total Liters'}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: '#00B7FF' }]}>{hydrationSummary.avgLitersPerDay}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Ort. (L/Gün)' : 'Avg. (L/Day)'}</Text>
                                </View>
                            </View>
                            
                            <View style={[styles.summaryGrid, { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: '#8E44AD' }]}>{hydrationSummary.totalVitamins}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Vitamin Alımı' : 'Vitamin Logs'}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: '#2ECC71' }]}>{hydrationSummary.totalMinerals}</Text>
                                    <Text style={styles.summaryLabel}>{isTurkish ? 'Mineral Alımı' : 'Mineral Logs'}</Text>
                                </View>
                            </View>
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
                                    ? 'Müşteri henüz veri girişi yapmamış.'
                                    : 'Client hasn\'t logged any data yet.'}
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
    headerInfo: { flex: 1, alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
    chatBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3, textAlign: 'center' },
    headerSub: { ...TYPOGRAPHY.caption, textAlign: 'center' },
    
    actionsContainer: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
    actionText: { ...TYPOGRAPHY.bodyBold },

    content: { padding: SPACING.lg, paddingBottom: 100 },

    periodContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.pill, padding: 4 },
    periodTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BORDER_RADIUS.pill },
    periodText: { ...TYPOGRAPHY.bodyBold },

    quickStats: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    statCard: { flex: 1, alignItems: 'center', padding: SPACING.md, gap: 6, borderRadius: BORDER_RADIUS.lg },
    statValue: { ...TYPOGRAPHY.h3 },
    statLabel: { ...TYPOGRAPHY.caption },

    chartCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
    chartTitle: { ...TYPOGRAPHY.bodyBold },

    summaryCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryValue: { ...TYPOGRAPHY.h3 },
    summaryLabel: { ...TYPOGRAPHY.caption, marginTop: 4 },
    summaryDivider: { width: 1, height: 40, backgroundColor: colors.borderLight },

    macroRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
    macroItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    macroValue: { ...TYPOGRAPHY.h3 },
    macroUnit: { ...TYPOGRAPHY.caption },
    macroLabel: { ...TYPOGRAPHY.caption, marginTop: 2 },

    adherenceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    adherenceLabel: { ...TYPOGRAPHY.caption, flex: 0.3 },
    adherenceBarBg: { flex: 1, height: 8, backgroundColor: colors.borderLight, borderRadius: 4, overflow: 'hidden' },
    adherenceBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    adherenceValue: { ...TYPOGRAPHY.bodyBold, width: 40, textAlign: 'right' },

    emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
    emptyTitle: { ...TYPOGRAPHY.h3, marginTop: SPACING.md },
    emptySub: { ...TYPOGRAPHY.body, marginTop: 4, textAlign: 'center' },
});
