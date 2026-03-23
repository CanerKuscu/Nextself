import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, FlatList, useWindowDimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { HealthService } from '../services/healthService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

let LineChart: any;
try { const ck = require('react-native-chart-kit'); LineChart = ck.LineChart; } catch { }

export default function SmartScaleScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    // Form state
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [muscleMass, setMuscleMass] = useState('');
    const [waterPercent, setWaterPercent] = useState('');
    const [boneMass, setBoneMass] = useState('');
    const [visceralFat, setVisceralFat] = useState('');
    const [bmr, setBmr] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Auto-sync status
    const [isSyncingHealth, setIsSyncingHealth] = useState(true);
    const [healthSource, setHealthSource] = useState<'apple_health' | 'google_health' | 'manual'>('manual');

    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
    const [refreshing, setRefreshing] = useState(false);

    const healthService = HealthService.getInstance();

    // Load history and sync health on mount
    useEffect(() => {
        loadHistory();
        syncHealthWeight();
    }, []);

    const syncHealthWeight = async () => {
        setIsSyncingHealth(true);
        try {
            const latest = await healthService.fetchLatestWeight();
            if (latest && latest.weight) {
                setWeight(latest.weight.toFixed(1));
                if (typeof latest.bodyFat === 'number' && Number.isFinite(latest.bodyFat)) {
                    const percent = latest.bodyFat <= 1 ? latest.bodyFat * 100 : latest.bodyFat;
                    setBodyFat(percent.toFixed(1));
                }
                if (typeof latest.muscleMass === 'number' && Number.isFinite(latest.muscleMass) && latest.weight > 0) {
                    const musclePercent = (latest.muscleMass / latest.weight) * 100;
                    if (Number.isFinite(musclePercent) && musclePercent > 0) {
                        setMuscleMass(musclePercent.toFixed(1));
                    }
                }
                setHealthSource(latest.source);
                showAlert({
                    title: isTurkish ? 'Senkronize Edildi' : 'Synced',
                    message: isTurkish
                        ? `Sağlık uygulamasından son kilonuz (${latest.weight.toFixed(1)} kg) başarıyla çekildi.`
                        : `Your latest weight (${latest.weight.toFixed(1)} kg) was successfully pulled from your health app.`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.warn('Failed to sync health weight:', error);
        } finally {
            setIsSyncingHealth(false);
        }
    };

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (user) {
                const { data, error } = await supabase.getClient()
                    .from('health_data')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('weight', 'is', null)
                    .order('timestamp', { ascending: false })
                    .limit(50);

                if (!error && data) {
                    // Map to expected history format
                    const formattedHistory = data.map(item => ({
                        id: item.id,
                        weight: item.weight,
                        bodyFat: item.body_fat_percentage,
                        muscleMass: item.muscle_mass_percentage,
                        waterPercentage: item.water_percentage,
                        boneMass: item.bone_mass_kg,
                        source: item.source || 'smart_scale_manual',
                        recordedAt: item.timestamp
                    }));
                    setHistory(formattedHistory);
                }
            }
        } catch (err) {
            console.warn('Load history error:', err);
        } finally {
            setLoadingHistory(false);
            setRefreshing(false);
        }
    }, []);

    // ─── Save ───────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!weight || !bodyFat || !muscleMass) {
            showAlert({
                title: isTurkish ? 'Eksik Bilgi' : 'Missing Info',
                message: isTurkish ? 'Lütfen en az Kilo, Yağ ve Kas oranlarını giriniz.' : 'Please enter at least Weight, Body Fat, and Muscle Mass.',
                type: 'warning'
            });
            return;
        }

        setIsSaving(true);
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();

            if (user) {
                const { error } = await supabase.getClient()
                    .from('health_data')
                    .insert({
                        user_id: user.id,
                        weight: parseFloat(weight),
                        body_fat_percentage: parseFloat(bodyFat),
                        muscle_mass_percentage: parseFloat(muscleMass),
                        water_percentage: waterPercent ? parseFloat(waterPercent) : null,
                        bone_mass_kg: boneMass ? parseFloat(boneMass) : null,
                        visceral_fat: visceralFat ? parseInt(visceralFat) : null,
                        basal_metabolism: bmr ? parseInt(bmr) : null,
                        timestamp: new Date().toISOString(),
                        source: healthSource,
                    });

                if (error) throw error;

                showAlert({
                    title: isTurkish ? 'Başarılı' : 'Success',
                    message: isTurkish ? 'Tartı verileriniz kaydedildi.' : 'Scale data saved successfully.',
                    type: 'success',
                    buttons: [{ text: 'OK', onPress: () => { loadHistory(); setActiveTab('history'); } }]
                });

                // Reset form
                setWeight(''); setBodyFat(''); setMuscleMass('');
                setWaterPercent(''); setBoneMass(''); setVisceralFat(''); setBmr('');
            }
        } catch (error) {
            console.error('Save scale data error:', error);
            showAlert({ title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Kaydedilirken bir hata oluştu.' : 'Failed to save data.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── BMI Calculator ─────────────────────────────────────────────
    const calculateBMI = (): string | null => {
        const w = parseFloat(weight);
        if (!w || w <= 0) return null;
        // Use a default height or could fetch from profile
        const heightM = 1.75;
        const bmi = w / (heightM * heightM);
        return bmi.toFixed(1);
    };

    const getBMICategory = (bmiVal: number): { label: string; color: string } => {
        if (bmiVal < 18.5) return { label: isTurkish ? 'Zayıf' : 'Underweight', color: '#3498db' };
        if (bmiVal < 25) return { label: isTurkish ? 'Normal' : 'Normal', color: '#2ecc71' };
        if (bmiVal < 30) return { label: isTurkish ? 'Fazla Kilolu' : 'Overweight', color: '#f39c12' };
        return { label: isTurkish ? 'Obez' : 'Obese', color: '#e74c3c' };
    };

    const bmiValue = calculateBMI();

    // ─── Chart Data ─────────────────────────────────────────────────
    const getChartData = () => {
        const recent = history.slice(0, 10).reverse();
        if (recent.length < 2) return null;
        return {
            labels: recent.map(h => {
                const d = new Date(h.recordedAt);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [{
                data: recent.map(h => h.weight),
                color: () => colors.primary,
                strokeWidth: 2,
            }],
        };
    };

    // ─── Render ─────────────────────────────────────────────────────
    const renderAutoSyncPanel = () => (
        <AnimatedCard style={styles.bleConnectCard}>
            <View style={styles.bleConnectBtn}>
                <View style={[styles.bleConnectIcon, { backgroundColor: isSyncingHealth ? colors.primarySoft : colors.primary }]}>
                    {isSyncingHealth ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Ionicons name="sync-circle" size={28} color="#fff" />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.bleConnectTitle, { color: colors.text }]}>
                        {isTurkish ? 'Sağlık Senkronizasyonu' : 'Health Sync'}
                    </Text>
                    <Text style={styles.bleConnectSub}>
                        {isSyncingHealth
                            ? (isTurkish ? 'Veriler kontrol ediliyor...' : 'Checking health data...')
                            : (healthSource !== 'manual'
                                ? (isTurkish ? 'Kilonuz sağlık uygulamasından çekildi' : 'Weight pulled from health app')
                                : (isTurkish ? 'Veri bulunamadı, manuel girebilirsiniz' : 'No recent data, please enter manually')
                            )}
                    </Text>
                </View>
                {!isSyncingHealth && (
                    <TouchableOpacity onPress={syncHealthWeight} style={{ padding: 8 }}>
                        <Ionicons name="refresh" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </AnimatedCard>
    );

    const renderInputTab = () => (
        <View>
            {/* Health Sync Status */}
            {renderAutoSyncPanel()}

            {/* Manual Input Card */}
            <AnimatedCard style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="scale-outline" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isTurkish ? 'Vücut Analizini Girin' : 'Enter Body Analysis'}
                </Text>
                <Text style={styles.subtitle}>
                    {isTurkish
                        ? healthSource !== 'manual'
                            ? 'Tartıdan okunan veriler otomatik dolduruldu. Düzenleyebilirsiniz.'
                            : 'Tartınızdan aldığınız detaylı vücut kompozisyonu verilerini buraya kaydedin.'
                        : healthSource !== 'manual'
                            ? 'Scale data auto-filled. You can edit the values.'
                            : 'Log the detailed body composition data from your scale here.'}
                </Text>

                {/* BMI Display */}
                {bmiValue && (
                    <View style={[styles.bmiContainer, { backgroundColor: getBMICategory(parseFloat(bmiValue)).color + '15' }]}>
                        <Text style={[styles.bmiValue, { color: getBMICategory(parseFloat(bmiValue)).color }]}>
                            BMI: {bmiValue}
                        </Text>
                        <Text style={[styles.bmiLabel, { color: getBMICategory(parseFloat(bmiValue)).color }]}>
                            {getBMICategory(parseFloat(bmiValue)).label}
                        </Text>
                    </View>
                )}

                {/* Input Fields */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kilo (kg) *' : 'Weight (kg) *'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        keyboardType="numeric"
                        placeholder="75.5"
                        placeholderTextColor={colors.textSecondary}
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Yağ Oranı (%) *' : 'Body Fat (%) *'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        keyboardType="numeric"
                        placeholder="15.2"
                        placeholderTextColor={colors.textSecondary}
                        value={bodyFat}
                        onChangeText={setBodyFat}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kas Oranı (%) *' : 'Muscle Mass (%) *'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        keyboardType="numeric"
                        placeholder="45.5"
                        placeholderTextColor={colors.textSecondary}
                        value={muscleMass}
                        onChangeText={setMuscleMass}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                        <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Su Oranı (%)' : 'Water (%)'}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            keyboardType="numeric"
                            placeholder="55.0"
                            placeholderTextColor={colors.textSecondary}
                            value={waterPercent}
                            onChangeText={setWaterPercent}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                        <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kemik Kütlesi (kg)' : 'Bone Mass (kg)'}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            keyboardType="numeric"
                            placeholder="3.2"
                            placeholderTextColor={colors.textSecondary}
                            value={boneMass}
                            onChangeText={setBoneMass}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                        <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Visseral Yağ' : 'Visceral Fat'}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            keyboardType="numeric"
                            placeholder="8"
                            placeholderTextColor={colors.textSecondary}
                            value={visceralFat}
                            onChangeText={setVisceralFat}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                        <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Bazal Metabolizma' : 'BMR (kcal)'}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                            keyboardType="numeric"
                            placeholder="1800"
                            placeholderTextColor={colors.textSecondary}
                            value={bmr}
                            onChangeText={setBmr}
                        />
                    </View>
                </View>
            </AnimatedCard>

            <AnimatedButton
                title={isSaving ? (isTurkish ? 'Kaydediliyor...' : 'Saving...') : (isTurkish ? 'Verileri Kaydet' : 'Save Data')}
                onPress={handleSave}
                disabled={isSaving}
                style={styles.saveBtn}
            />
        </View>
    );

    const renderHistoryTab = () => (
        <View>
            {/* Weight Trend Chart */}
            {LineChart && getChartData() && (
                <AnimatedCard style={styles.chartCard}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                        {isTurkish ? 'Kilo Trendi' : 'Weight Trend'}
                    </Text>
                    <LineChart
                        data={getChartData()}
                        width={screenWidth - 64}
                        height={180}
                        chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: colors.background,
                            backgroundGradientTo: colors.background,
                            decimalPlaces: 1,
                            color: () => colors.primary,
                            labelColor: () => colors.textSecondary,
                            propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                        }}
                        bezier
                        style={{ borderRadius: BORDER_RADIUS.lg }}
                    />
                </AnimatedCard>
            )}

            {/* Body Composition Summary */}
            {history.length > 0 && history[0].bodyFat && (
                <AnimatedCard style={styles.compositionCard}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                        {isTurkish ? 'Son Vücut Kompozisyonu' : 'Latest Body Composition'}
                    </Text>
                    <View style={styles.compositionGrid}>
                        {[
                            { label: isTurkish ? 'Yağ' : 'Fat', val: `${history[0].bodyFat}%`, icon: 'flame', color: '#e74c3c' },
                            { label: isTurkish ? 'Kas' : 'Muscle', val: `${history[0].muscleMass}%`, icon: 'fitness', color: '#3498db' },
                            { label: isTurkish ? 'Su' : 'Water', val: `${history[0].waterPercentage || '-'}%`, icon: 'water', color: '#2ecc71' },
                            { label: isTurkish ? 'Kemik' : 'Bone', val: `${history[0].boneMass || '-'} kg`, icon: 'body', color: '#f39c12' },
                        ].map((item, idx) => (
                            <View key={idx} style={[styles.compositionItem, { backgroundColor: item.color + '12' }]}>
                                <Ionicons name={item.icon as any} size={22} color={item.color} />
                                <Text style={[styles.compositionValue, { color: item.color }]}>{item.val}</Text>
                                <Text style={styles.compositionLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </AnimatedCard>
            )}

            {/* History List */}
            {loadingHistory ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : history.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <Ionicons name="analytics-outline" size={60} color={colors.textSecondary} />
                    <Text style={[styles.emptyHistoryText, { color: colors.text }]}>
                        {isTurkish ? 'Henüz kayıt yok' : 'No records yet'}
                    </Text>
                    <Text style={styles.emptyHistorySub}>
                        {isTurkish ? 'İlk ölçümünüzü kaydedin' : 'Save your first measurement'}
                    </Text>
                </View>
            ) : (
                history.map((item, index) => (
                    <AnimatedCard key={item.id} style={styles.historyItem}>
                        <View style={styles.historyHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.sourceIcon, {
                                    backgroundColor: item.source !== 'smart_scale_manual' ? colors.primarySoft : colors.surfaceSecondary,
                                }]}>
                                    <Ionicons
                                        name={item.source === 'apple_health' ? 'logo-apple' : item.source === 'google_health' ? 'logo-google' : 'create-outline'}
                                        size={14}
                                        color={item.source !== 'smart_scale_manual' ? colors.primary : colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.historyWeight, { color: colors.text }]}>
                                    {item.weight} kg
                                </Text>
                                {index > 0 && (
                                    <View style={[styles.changeTag, {
                                        backgroundColor: item.weight < history[index - 1].weight
                                            ? colors.successSoft : item.weight > history[index - 1].weight
                                                ? colors.errorSoft : colors.surfaceSecondary,
                                    }]}>
                                        <Ionicons
                                            name={item.weight < history[index - 1].weight ? 'trending-down' : item.weight > history[index - 1].weight ? 'trending-up' : 'remove'}
                                            size={12}
                                            color={item.weight < history[index - 1].weight ? colors.success : item.weight > history[index - 1].weight ? colors.error : colors.textSecondary}
                                        />
                                        <Text style={[styles.changeText, {
                                            color: item.weight < history[index - 1].weight ? colors.success : item.weight > history[index - 1].weight ? colors.error : colors.textSecondary,
                                        }]}>
                                            {Math.abs(item.weight - history[index - 1].weight).toFixed(1)} kg
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.historyDate}>
                                {new Date(item.recordedAt).toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </Text>
                        </View>

                        {item.bodyFat && (
                            <View style={styles.historyMetrics}>
                                <View style={styles.historyMetric}>
                                    <Text style={styles.historyMetricLabel}>{isTurkish ? 'Yağ' : 'Fat'}</Text>
                                    <Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.bodyFat}%</Text>
                                </View>
                                <View style={styles.historyMetricDivider} />
                                <View style={styles.historyMetric}>
                                    <Text style={styles.historyMetricLabel}>{isTurkish ? 'Kas' : 'Muscle'}</Text>
                                    <Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.muscleMass}%</Text>
                                </View>
                                {item.waterPercentage && (
                                    <>
                                        <View style={styles.historyMetricDivider} />
                                        <View style={styles.historyMetric}>
                                            <Text style={styles.historyMetricLabel}>{isTurkish ? 'Su' : 'Water'}</Text>
                                            <Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.waterPercentage}%</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </AnimatedCard>
                ))
            )}
        </View>
    );

    return (
        <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.text + '15' }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Profile')} style={[styles.backBtn, { backgroundColor: colors.text + '10' }]} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Akıllı Tartı' : 'Smart Scale'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabContainer, { backgroundColor: colors.text + '08' }]}>
                {(['input', 'history'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={tab === 'input' ? 'add-circle-outline' : 'analytics-outline'}
                            size={18}
                            color={activeTab === tab ? '#fff' : colors.textSecondary}
                        />
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'input' ? (isTurkish ? 'Ölçüm Gir' : 'New Entry') : (isTurkish ? 'Geçmiş' : 'History')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />
                }
            >
                {activeTab === 'input' ? renderInputTab() : renderHistoryTab()}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h3 },
    content: { padding: SPACING.lg, paddingBottom: 100 },

    // Tabs
    tabContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.pill, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: BORDER_RADIUS.pill, gap: 6 },
    tabActive: { backgroundColor: colors.primary, ...SHADOWS.sm },
    tabText: { ...TYPOGRAPHY.bodyBold, color: colors.textSecondary },
    tabTextActive: { color: '#fff' },

    // BLE Connect Card
    bleConnectCard: { padding: 0, marginBottom: SPACING.md, overflow: 'hidden' },
    bleConnectBtn: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
    bleConnectBtnDisabled: { opacity: 0.5 },
    bleConnectIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
    bleConnectTitle: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    bleConnectSub: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },

    // BLE Panel
    blePanel: { padding: SPACING.lg, marginBottom: SPACING.md },
    blePanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    blePanelTitle: { ...TYPOGRAPHY.bodyBold, marginLeft: 8 },
    statusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, gap: 6 },
    statusText: { ...TYPOGRAPHY.caption },
    deviceList: { gap: 8 },
    deviceItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight },
    deviceItemConnected: { borderColor: colors.success, backgroundColor: colors.successSoft },
    deviceName: { ...TYPOGRAPHY.bodyBold },
    deviceSignal: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
    scanHint: { ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: SPACING.md },
    reScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm, gap: 6 },
    reScanText: { ...TYPOGRAPHY.bodyBold, color: colors.primary },

    // Input Card
    card: { padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    title: { ...TYPOGRAPHY.h2, marginBottom: SPACING.sm, textAlign: 'center' },
    subtitle: { ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    inputGroup: { width: '100%', marginBottom: SPACING.md },
    label: { ...TYPOGRAPHY.bodyBold, marginBottom: SPACING.xs },
    input: { ...TYPOGRAPHY.body, borderWidth: 1, borderColor: colors.borderLight, borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
    row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    saveBtn: { marginTop: SPACING.md },

    // BMI
    bmiContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.pill, marginBottom: SPACING.lg, gap: 8 },
    bmiValue: { ...TYPOGRAPHY.h3 },
    bmiLabel: { ...TYPOGRAPHY.bodyBold },

    // Charts
    chartCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    chartTitle: { ...TYPOGRAPHY.bodyBold, marginBottom: SPACING.md },

    // Composition
    compositionCard: { padding: SPACING.lg, marginBottom: SPACING.md },
    compositionGrid: { flexDirection: 'row', gap: 8 },
    compositionItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: 4 },
    compositionValue: { ...TYPOGRAPHY.bodyBold },
    compositionLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary },

    // History
    emptyHistory: { alignItems: 'center', paddingVertical: SPACING.xxl },
    emptyHistoryText: { ...TYPOGRAPHY.h3, marginTop: SPACING.md },
    emptyHistorySub: { ...TYPOGRAPHY.body, color: colors.textSecondary, marginTop: 4 },
    historyItem: { padding: SPACING.md, marginBottom: SPACING.sm },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sourceIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    historyWeight: { ...TYPOGRAPHY.h3 },
    changeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, marginLeft: 8, gap: 4 },
    changeText: { ...TYPOGRAPHY.caption },
    historyDate: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    historyMetrics: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
    historyMetric: { flex: 1, alignItems: 'center' },
    historyMetricLabel: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    historyMetricValue: { ...TYPOGRAPHY.bodyBold, marginTop: 2 },
    historyMetricDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
});
