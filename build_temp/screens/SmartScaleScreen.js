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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SmartScaleScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useTranslation_1 = require("../hooks/useTranslation");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const CustomAlert_1 = require("../components/CustomAlert");
const supabase_1 = require("../services/supabase");
const healthService_1 = require("../services/healthService");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
let LineChart;
try {
    const ck = require('react-native-chart-kit');
    LineChart = ck.LineChart;
}
catch (_a) { }
function SmartScaleScreen({ navigation }) {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { width: screenWidth } = (0, react_native_1.useWindowDimensions)();
    // Form state
    const [weight, setWeight] = (0, react_1.useState)('');
    const [bodyFat, setBodyFat] = (0, react_1.useState)('');
    const [muscleMass, setMuscleMass] = (0, react_1.useState)('');
    const [waterPercent, setWaterPercent] = (0, react_1.useState)('');
    const [boneMass, setBoneMass] = (0, react_1.useState)('');
    const [visceralFat, setVisceralFat] = (0, react_1.useState)('');
    const [bmr, setBmr] = (0, react_1.useState)('');
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    // Auto-sync status
    const [isSyncingHealth, setIsSyncingHealth] = (0, react_1.useState)(true);
    const [healthSource, setHealthSource] = (0, react_1.useState)('manual');
    // History state
    const [history, setHistory] = (0, react_1.useState)([]);
    const [loadingHistory, setLoadingHistory] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('input');
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const healthService = healthService_1.HealthService.getInstance();
    // Load history and sync health on mount
    (0, react_1.useEffect)(() => {
        loadHistory();
        syncHealthWeight();
    }, []);
    const syncHealthWeight = () => __awaiter(this, void 0, void 0, function* () {
        setIsSyncingHealth(true);
        try {
            const latest = yield healthService.fetchLatestWeight();
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
        }
        catch (error) {
            console.warn('Failed to sync health weight:', error);
        }
        finally {
            setIsSyncingHealth(false);
        }
    });
    const loadHistory = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        setLoadingHistory(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                const { data, error } = yield supabase.getClient()
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
        }
        catch (err) {
            console.warn('Load history error:', err);
        }
        finally {
            setLoadingHistory(false);
            setRefreshing(false);
        }
    }), []);
    // ─── Save ───────────────────────────────────────────────────────
    const handleSave = () => __awaiter(this, void 0, void 0, function* () {
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
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                const { error } = yield supabase.getClient()
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
                if (error)
                    throw error;
                showAlert({
                    title: isTurkish ? 'Başarılı' : 'Success',
                    message: isTurkish ? 'Tartı verileriniz kaydedildi.' : 'Scale data saved successfully.',
                    type: 'success',
                    buttons: [{ text: 'OK', onPress: () => { loadHistory(); setActiveTab('history'); } }]
                });
                // Reset form
                setWeight('');
                setBodyFat('');
                setMuscleMass('');
                setWaterPercent('');
                setBoneMass('');
                setVisceralFat('');
                setBmr('');
            }
        }
        catch (error) {
            console.error('Save scale data error:', error);
            showAlert({ title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Kaydedilirken bir hata oluştu.' : 'Failed to save data.', type: 'error' });
        }
        finally {
            setIsSaving(false);
        }
    });
    // ─── BMI Calculator ─────────────────────────────────────────────
    const calculateBMI = () => {
        const w = parseFloat(weight);
        if (!w || w <= 0)
            return null;
        // Use a default height or could fetch from profile
        const heightM = 1.75;
        const bmi = w / (heightM * heightM);
        return bmi.toFixed(1);
    };
    const getBMICategory = (bmiVal) => {
        if (bmiVal < 18.5)
            return { label: isTurkish ? 'Zayıf' : 'Underweight', color: '#3498db' };
        if (bmiVal < 25)
            return { label: isTurkish ? 'Normal' : 'Normal', color: '#2ecc71' };
        if (bmiVal < 30)
            return { label: isTurkish ? 'Fazla Kilolu' : 'Overweight', color: '#f39c12' };
        return { label: isTurkish ? 'Obez' : 'Obese', color: '#e74c3c' };
    };
    const bmiValue = calculateBMI();
    // ─── Chart Data ─────────────────────────────────────────────────
    const getChartData = () => {
        const recent = history.slice(0, 10).reverse();
        if (recent.length < 2)
            return null;
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
    const renderAutoSyncPanel = () => (<AnimatedCard_1.default style={styles.bleConnectCard}>
            <react_native_1.View style={styles.bleConnectBtn}>
                <react_native_1.View style={[styles.bleConnectIcon, { backgroundColor: isSyncingHealth ? colors.primarySoft : colors.primary }]}>
                    {isSyncingHealth ? (<react_native_1.ActivityIndicator size="small" color={colors.primary}/>) : (<vector_icons_1.Ionicons name="sync-circle" size={28} color="#fff"/>)}
                </react_native_1.View>
                <react_native_1.View style={{ flex: 1 }}>
                    <react_native_1.Text style={[styles.bleConnectTitle, { color: colors.text }]}>
                        {isTurkish ? 'Sağlık Senkronizasyonu' : 'Health Sync'}
                    </react_native_1.Text>
                    <react_native_1.Text style={styles.bleConnectSub}>
                        {isSyncingHealth
            ? (isTurkish ? 'Veriler kontrol ediliyor...' : 'Checking health data...')
            : (healthSource !== 'manual'
                ? (isTurkish ? 'Kilonuz sağlık uygulamasından çekildi' : 'Weight pulled from health app')
                : (isTurkish ? 'Veri bulunamadı, manuel girebilirsiniz' : 'No recent data, please enter manually'))}
                    </react_native_1.Text>
                </react_native_1.View>
                {!isSyncingHealth && (<react_native_1.TouchableOpacity onPress={syncHealthWeight} style={{ padding: 8 }}>
                        <vector_icons_1.Ionicons name="refresh" size={24} color={colors.primary}/>
                    </react_native_1.TouchableOpacity>)}
            </react_native_1.View>
        </AnimatedCard_1.default>);
    const renderInputTab = () => (<react_native_1.View>
            {/* Health Sync Status */}
            {renderAutoSyncPanel()}

            {/* Manual Input Card */}
            <AnimatedCard_1.default style={styles.card}>
                <react_native_1.View style={styles.iconContainer}>
                    <vector_icons_1.Ionicons name="scale-outline" size={40} color={colors.primary}/>
                </react_native_1.View>
                <react_native_1.Text style={[styles.title, { color: colors.text }]}>
                    {isTurkish ? 'Vücut Analizini Girin' : 'Enter Body Analysis'}
                </react_native_1.Text>
                <react_native_1.Text style={styles.subtitle}>
                    {isTurkish
            ? healthSource !== 'manual'
                ? 'Tartıdan okunan veriler otomatik dolduruldu. Düzenleyebilirsiniz.'
                : 'Tartınızdan aldığınız detaylı vücut kompozisyonu verilerini buraya kaydedin.'
            : healthSource !== 'manual'
                ? 'Scale data auto-filled. You can edit the values.'
                : 'Log the detailed body composition data from your scale here.'}
                </react_native_1.Text>

                {/* BMI Display */}
                {bmiValue && (<react_native_1.View style={[styles.bmiContainer, { backgroundColor: getBMICategory(parseFloat(bmiValue)).color + '15' }]}>
                        <react_native_1.Text style={[styles.bmiValue, { color: getBMICategory(parseFloat(bmiValue)).color }]}>
                            BMI: {bmiValue}
                        </react_native_1.Text>
                        <react_native_1.Text style={[styles.bmiLabel, { color: getBMICategory(parseFloat(bmiValue)).color }]}>
                            {getBMICategory(parseFloat(bmiValue)).label}
                        </react_native_1.Text>
                    </react_native_1.View>)}

                {/* Input Fields */}
                <react_native_1.View style={styles.inputGroup}>
                    <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kilo (kg) *' : 'Weight (kg) *'}</react_native_1.Text>
                    <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="75.5" placeholderTextColor={colors.textSecondary} value={weight} onChangeText={setWeight}/>
                </react_native_1.View>

                <react_native_1.View style={styles.inputGroup}>
                    <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Yağ Oranı (%) *' : 'Body Fat (%) *'}</react_native_1.Text>
                    <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="15.2" placeholderTextColor={colors.textSecondary} value={bodyFat} onChangeText={setBodyFat}/>
                </react_native_1.View>

                <react_native_1.View style={styles.inputGroup}>
                    <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kas Oranı (%) *' : 'Muscle Mass (%) *'}</react_native_1.Text>
                    <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="45.5" placeholderTextColor={colors.textSecondary} value={muscleMass} onChangeText={setMuscleMass}/>
                </react_native_1.View>

                <react_native_1.View style={styles.row}>
                    <react_native_1.View style={[styles.inputGroup, { flex: 1, marginRight: theme_1.SPACING.sm }]}>
                        <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Su Oranı (%)' : 'Water (%)'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="55.0" placeholderTextColor={colors.textSecondary} value={waterPercent} onChangeText={setWaterPercent}/>
                    </react_native_1.View>
                    <react_native_1.View style={[styles.inputGroup, { flex: 1, marginLeft: theme_1.SPACING.sm }]}>
                        <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Kemik Kütlesi (kg)' : 'Bone Mass (kg)'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="3.2" placeholderTextColor={colors.textSecondary} value={boneMass} onChangeText={setBoneMass}/>
                    </react_native_1.View>
                </react_native_1.View>

                <react_native_1.View style={styles.row}>
                    <react_native_1.View style={[styles.inputGroup, { flex: 1, marginRight: theme_1.SPACING.sm }]}>
                        <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Visseral Yağ' : 'Visceral Fat'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="8" placeholderTextColor={colors.textSecondary} value={visceralFat} onChangeText={setVisceralFat}/>
                    </react_native_1.View>
                    <react_native_1.View style={[styles.inputGroup, { flex: 1, marginLeft: theme_1.SPACING.sm }]}>
                        <react_native_1.Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Bazal Metabolizma' : 'BMR (kcal)'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} keyboardType="numeric" placeholder="1800" placeholderTextColor={colors.textSecondary} value={bmr} onChangeText={setBmr}/>
                    </react_native_1.View>
                </react_native_1.View>
            </AnimatedCard_1.default>

            <AnimatedButton_1.default title={isSaving ? (isTurkish ? 'Kaydediliyor...' : 'Saving...') : (isTurkish ? 'Verileri Kaydet' : 'Save Data')} onPress={handleSave} disabled={isSaving} style={styles.saveBtn}/>
        </react_native_1.View>);
    const renderHistoryTab = () => (<react_native_1.View>
            {/* Weight Trend Chart */}
            {LineChart && getChartData() && (<AnimatedCard_1.default style={styles.chartCard}>
                    <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                        {isTurkish ? 'Kilo Trendi' : 'Weight Trend'}
                    </react_native_1.Text>
                    <LineChart data={getChartData()} width={screenWidth - 64} height={180} chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                decimalPlaces: 1,
                color: () => colors.primary,
                labelColor: () => colors.textSecondary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
            }} bezier style={{ borderRadius: theme_1.BORDER_RADIUS.lg }}/>
                </AnimatedCard_1.default>)}

            {/* Body Composition Summary */}
            {history.length > 0 && history[0].bodyFat && (<AnimatedCard_1.default style={styles.compositionCard}>
                    <react_native_1.Text style={[styles.chartTitle, { color: colors.text }]}>
                        {isTurkish ? 'Son Vücut Kompozisyonu' : 'Latest Body Composition'}
                    </react_native_1.Text>
                    <react_native_1.View style={styles.compositionGrid}>
                        {[
                { label: isTurkish ? 'Yağ' : 'Fat', val: `${history[0].bodyFat}%`, icon: 'flame', color: '#e74c3c' },
                { label: isTurkish ? 'Kas' : 'Muscle', val: `${history[0].muscleMass}%`, icon: 'fitness', color: '#3498db' },
                { label: isTurkish ? 'Su' : 'Water', val: `${history[0].waterPercentage || '-'}%`, icon: 'water', color: '#2ecc71' },
                { label: isTurkish ? 'Kemik' : 'Bone', val: `${history[0].boneMass || '-'} kg`, icon: 'body', color: '#f39c12' },
            ].map((item, idx) => (<react_native_1.View key={idx} style={[styles.compositionItem, { backgroundColor: item.color + '12' }]}>
                                <vector_icons_1.Ionicons name={item.icon} size={22} color={item.color}/>
                                <react_native_1.Text style={[styles.compositionValue, { color: item.color }]}>{item.val}</react_native_1.Text>
                                <react_native_1.Text style={styles.compositionLabel}>{item.label}</react_native_1.Text>
                            </react_native_1.View>))}
                    </react_native_1.View>
                </AnimatedCard_1.default>)}

            {/* History List */}
            {loadingHistory ? (<react_native_1.ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }}/>) : history.length === 0 ? (<react_native_1.View style={styles.emptyHistory}>
                    <vector_icons_1.Ionicons name="analytics-outline" size={60} color={colors.textSecondary}/>
                    <react_native_1.Text style={[styles.emptyHistoryText, { color: colors.text }]}>
                        {isTurkish ? 'Henüz kayıt yok' : 'No records yet'}
                    </react_native_1.Text>
                    <react_native_1.Text style={styles.emptyHistorySub}>
                        {isTurkish ? 'İlk ölçümünüzü kaydedin' : 'Save your first measurement'}
                    </react_native_1.Text>
                </react_native_1.View>) : (history.map((item, index) => (<AnimatedCard_1.default key={item.id} style={styles.historyItem}>
                        <react_native_1.View style={styles.historyHeader}>
                            <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <react_native_1.View style={[styles.sourceIcon, {
                    backgroundColor: item.source !== 'smart_scale_manual' ? colors.primarySoft : colors.surfaceSecondary,
                }]}>
                                    <vector_icons_1.Ionicons name={item.source === 'apple_health' ? 'logo-apple' : item.source === 'google_health' ? 'logo-google' : 'create-outline'} size={14} color={item.source !== 'smart_scale_manual' ? colors.primary : colors.textSecondary}/>
                                </react_native_1.View>
                                <react_native_1.Text style={[styles.historyWeight, { color: colors.text }]}>
                                    {item.weight} kg
                                </react_native_1.Text>
                                {index > 0 && (<react_native_1.View style={[styles.changeTag, {
                        backgroundColor: item.weight < history[index - 1].weight
                            ? colors.successSoft : item.weight > history[index - 1].weight
                            ? colors.errorSoft : colors.surfaceSecondary,
                    }]}>
                                        <vector_icons_1.Ionicons name={item.weight < history[index - 1].weight ? 'trending-down' : item.weight > history[index - 1].weight ? 'trending-up' : 'remove'} size={12} color={item.weight < history[index - 1].weight ? colors.success : item.weight > history[index - 1].weight ? colors.error : colors.textSecondary}/>
                                        <react_native_1.Text style={[styles.changeText, {
                        color: item.weight < history[index - 1].weight ? colors.success : item.weight > history[index - 1].weight ? colors.error : colors.textSecondary,
                    }]}>
                                            {Math.abs(item.weight - history[index - 1].weight).toFixed(1)} kg
                                        </react_native_1.Text>
                                    </react_native_1.View>)}
                            </react_native_1.View>
                            <react_native_1.Text style={styles.historyDate}>
                                {new Date(item.recordedAt).toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
                day: 'numeric', month: 'short', year: 'numeric',
            })}
                            </react_native_1.Text>
                        </react_native_1.View>

                        {item.bodyFat && (<react_native_1.View style={styles.historyMetrics}>
                                <react_native_1.View style={styles.historyMetric}>
                                    <react_native_1.Text style={styles.historyMetricLabel}>{isTurkish ? 'Yağ' : 'Fat'}</react_native_1.Text>
                                    <react_native_1.Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.bodyFat}%</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.historyMetricDivider}/>
                                <react_native_1.View style={styles.historyMetric}>
                                    <react_native_1.Text style={styles.historyMetricLabel}>{isTurkish ? 'Kas' : 'Muscle'}</react_native_1.Text>
                                    <react_native_1.Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.muscleMass}%</react_native_1.Text>
                                </react_native_1.View>
                                {item.waterPercentage && (<>
                                        <react_native_1.View style={styles.historyMetricDivider}/>
                                        <react_native_1.View style={styles.historyMetric}>
                                            <react_native_1.Text style={styles.historyMetricLabel}>{isTurkish ? 'Su' : 'Water'}</react_native_1.Text>
                                            <react_native_1.Text style={[styles.historyMetricValue, { color: colors.text }]}>{item.waterPercentage}%</react_native_1.Text>
                                        </react_native_1.View>
                                    </>)}
                            </react_native_1.View>)}
                    </AnimatedCard_1.default>)))}
        </react_native_1.View>);
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
            <AlertComponent />
            {/* Header */}
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.text + '15' }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={[styles.backBtn, { backgroundColor: colors.text + '10' }]} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Akıllı Tartı' : 'Smart Scale'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            {/* Tab Selector */}
            <react_native_1.View style={[styles.tabContainer, { backgroundColor: colors.text + '08' }]}>
                {['input', 'history'].map(tab => (<react_native_1.TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
                        <vector_icons_1.Ionicons name={tab === 'input' ? 'add-circle-outline' : 'analytics-outline'} size={18} color={activeTab === tab ? '#fff' : colors.textSecondary}/>
                        <react_native_1.Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'input' ? (isTurkish ? 'Ölçüm Gir' : 'New Entry') : (isTurkish ? 'Geçmiş' : 'History')}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>))}
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.content} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }}/>}>
                {activeTab === 'input' ? renderInputTab() : renderHistoryTab()}
            </react_native_1.ScrollView>
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.md, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    content: { padding: theme_1.SPACING.lg, paddingBottom: 100 },
    // Tabs
    tabContainer: { flexDirection: 'row', marginHorizontal: theme_1.SPACING.lg, marginTop: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.pill, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme_1.BORDER_RADIUS.pill, gap: 6 },
    tabActive: Object.assign({ backgroundColor: colors.primary }, theme_1.SHADOWS.sm),
    tabText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textSecondary }),
    tabTextActive: { color: '#fff' },
    // BLE Connect Card
    bleConnectCard: { padding: 0, marginBottom: theme_1.SPACING.md, overflow: 'hidden' },
    bleConnectBtn: { flexDirection: 'row', alignItems: 'center', padding: theme_1.SPACING.lg },
    bleConnectBtnDisabled: { opacity: 0.5 },
    bleConnectIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: theme_1.SPACING.md },
    bleConnectTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    bleConnectSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    // BLE Panel
    blePanel: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    blePanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme_1.SPACING.md },
    blePanelTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { marginLeft: 8 }),
    statusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme_1.SPACING.md, paddingVertical: 8, borderRadius: theme_1.BORDER_RADIUS.md, marginBottom: theme_1.SPACING.md, gap: 6 },
    statusText: Object.assign({}, theme_1.TYPOGRAPHY.caption),
    deviceList: { gap: 8 },
    deviceItem: { flexDirection: 'row', alignItems: 'center', padding: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight },
    deviceItemConnected: { borderColor: colors.success, backgroundColor: colors.successSoft },
    deviceName: Object.assign({}, theme_1.TYPOGRAPHY.bodyBold),
    deviceSignal: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    scanHint: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', paddingVertical: theme_1.SPACING.md }),
    reScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme_1.SPACING.sm, gap: 6 },
    reScanText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.primary }),
    // Input Card
    card: { padding: theme_1.SPACING.xl, alignItems: 'center', marginBottom: theme_1.SPACING.xl },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: theme_1.SPACING.md },
    title: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { marginBottom: theme_1.SPACING.sm, textAlign: 'center' }),
    subtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', marginBottom: theme_1.SPACING.xl }),
    inputGroup: { width: '100%', marginBottom: theme_1.SPACING.md },
    label: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { marginBottom: theme_1.SPACING.xs }),
    input: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { borderWidth: 1, borderColor: colors.borderLight, borderRadius: theme_1.BORDER_RADIUS.md, padding: theme_1.SPACING.md }),
    row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    saveBtn: { marginTop: theme_1.SPACING.md },
    // BMI
    bmiContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: theme_1.SPACING.lg, borderRadius: theme_1.BORDER_RADIUS.pill, marginBottom: theme_1.SPACING.lg, gap: 8 },
    bmiValue: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    bmiLabel: Object.assign({}, theme_1.TYPOGRAPHY.bodyBold),
    // Charts
    chartCard: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    chartTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { marginBottom: theme_1.SPACING.md }),
    // Composition
    compositionCard: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    compositionGrid: { flexDirection: 'row', gap: 8 },
    compositionItem: { flex: 1, alignItems: 'center', paddingVertical: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.lg, gap: 4 },
    compositionValue: Object.assign({}, theme_1.TYPOGRAPHY.bodyBold),
    compositionLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    // History
    emptyHistory: { alignItems: 'center', paddingVertical: theme_1.SPACING.xxl },
    emptyHistoryText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { marginTop: theme_1.SPACING.md }),
    emptyHistorySub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginTop: 4 }),
    historyItem: { padding: theme_1.SPACING.md, marginBottom: theme_1.SPACING.sm },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sourceIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    historyWeight: Object.assign({}, theme_1.TYPOGRAPHY.h3),
    changeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme_1.BORDER_RADIUS.sm, marginLeft: 8, gap: 4 },
    changeText: Object.assign({}, theme_1.TYPOGRAPHY.caption),
    historyDate: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    historyMetrics: { flexDirection: 'row', marginTop: theme_1.SPACING.sm, paddingTop: theme_1.SPACING.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
    historyMetric: { flex: 1, alignItems: 'center' },
    historyMetricLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    historyMetricValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { marginTop: 2 }),
    historyMetricDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
});
