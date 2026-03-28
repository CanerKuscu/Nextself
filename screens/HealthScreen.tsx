import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useWindowDimensions, Animated, TextInput, Modal, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAlert } from '../components/CustomAlert';
import { useTranslation } from '../hooks/useTranslation';
import { HealthService, HealthData, HealthInsight, HealthStreamPayload } from '../services/healthService';
import { NotificationService } from '../services/notificationService';
import { Observability } from '../utils/observability';
import { WaterTrackingService, WaterConfig } from '../services/waterTrackingService';
import { SupabaseService } from '@nextself/shared';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

let LineChart: any, BarChart: any;
try { const ck = require('react-native-chart-kit'); LineChart = ck.LineChart; BarChart = ck.BarChart; } catch { }

const HealthScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { width } = useWindowDimensions();
  const METRIC_W = (width - 40 - 12) / 2;
  const { t, isTurkish, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [waterConfig, setWaterConfig] = useState<WaterConfig | null>(null);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ apple: false, google: false });
  const [weeklySteps, setWeeklySteps] = useState<number[]>(Array(7).fill(0));
  const [weeklySleepHours, setWeeklySleepHours] = useState<number[]>(Array(7).fill(0));
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [showWaterSetup, setShowWaterSetup] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('2.5');
  const [mlPerSipInput, setMlPerSipInput] = useState('250');
  const [waterStartHourInput, setWaterStartHourInput] = useState('8');
  const [waterEndHourInput, setWaterEndHourInput] = useState('22');
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const healthService = HealthService.getInstance();
  const waterService = WaterTrackingService.getInstance();

  useEffect(() => { loadAll(); }, [language]);

  useFocusEffect(
    useCallback(() => {
      const refreshWater = async () => {
        const wConfig = await waterService.getConfig();
        setWaterConfig(wConfig);
      };
      refreshWater();
    }, [])
  );

  useEffect(() => {
    const stopStream = healthService.startHealthDataStream(
      async (payload: HealthStreamPayload) => {
        setHealthData(payload.healthData);
        setWeeklySteps(Array.isArray(payload.weeklySteps) && payload.weeklySteps.length === 7 ? payload.weeklySteps : Array(7).fill(0));
        setWeeklySleepHours(Array.isArray(payload.weeklySleepHours) && payload.weeklySleepHours.length === 7 ? payload.weeklySleepHours : Array(7).fill(0));
        setInsights(healthService.generateHealthInsights(payload.healthData, userGender));
      },
      { intervalMs: 15000, includeWeeklySteps: true, includeWeeklySleep: true }
    );

    return () => {
      stopStream();
    };
  }, [language, userGender]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await healthService.initialize();
      const [hData, wConfig, connStatus] = await Promise.all([
        healthService.getTodayHealthData(), waterService.getConfig(), healthService.getConnectionStatus(),
      ]);
      const [weeklyStepsData, weeklySleepData] = await Promise.all([
        healthService.getWeeklyStepsData(),
        healthService.getWeeklySleepData(),
      ]);
      const weightRecord = await healthService.fetchLatestWeight();
      const supabase = SupabaseService.getInstance();
      const { user } = await supabase.getCurrentUser();
      let gender: 'male' | 'female' | null = null;
      if (user) { const { data: profile } = await supabase.getUserProfile(user.id); if (profile?.gender) { gender = profile.gender; setUserGender(gender); } }
      setHealthData(hData); setWaterConfig(wConfig); setConnectionStatus(connStatus);
      setWaterGoalInput((wConfig?.dailyGoalLiters ?? 2.5).toString());
      setMlPerSipInput((wConfig?.mlPerSip ?? 250).toString());
      setWaterStartHourInput((wConfig?.startHour ?? 8).toString());
      setWaterEndHourInput((wConfig?.endHour ?? 22).toString());
      setWeeklySteps(Array.isArray(weeklyStepsData) && weeklyStepsData.length === 7 ? weeklyStepsData : Array(7).fill(0));
      setWeeklySleepHours(Array.isArray(weeklySleepData) && weeklySleepData.length === 7 ? weeklySleepData : Array(7).fill(0));
      setLatestWeight(weightRecord?.weight ?? null);
      setInsights(healthService.generateHealthInsights(hData, gender));
      await NotificationService.getInstance().checkSmartReminders(hData, language);
    } catch (err) { Observability.captureException(err); }
    finally { setLoading(false); Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }
  };

  const handleConnectApple = async () => {
    if (Platform.OS !== 'ios') { showAlert({ type: 'info', title: isTurkish ? 'iOS Gerekli' : 'iOS Required', message: isTurkish ? "Apple Health yalnızca iPhone'da kullanılabilir." : 'Apple Health is only available on iPhone.', buttons: [{ text: 'OK' }] }); return; }
    const result = await healthService.connectAppleHealth();
    if (result.success) { setConnectionStatus(prev => ({ ...prev, apple: true })); showAlert({ type: 'success', title: isTurkish ? 'Bağlandı' : 'Connected', message: isTurkish ? 'Apple Health bağlandı!' : 'Apple Health connected!', buttons: [{ text: 'OK' }] }); loadAll(); }
  };

  const handleConnectGoogle = async () => {
    if (Platform.OS !== 'android') { showAlert({ type: 'info', title: isTurkish ? 'Android Gerekli' : 'Android Required', message: isTurkish ? "Google Health yalnızca Android'de kullanılabilir." : 'Google Health is only available on Android.', buttons: [{ text: 'OK' }] }); return; }
    const result = await healthService.connectGoogleHealth();
    if (result.success) {
      setConnectionStatus(prev => ({ ...prev, google: true }));
      showAlert({ type: 'success', title: isTurkish ? 'Bağlandı' : 'Connected', message: isTurkish ? 'Google Health bağlandı!' : 'Google Health connected!', buttons: [{ text: 'OK' }] });
      loadAll();
    } else if (result.needsInstall) {
      showAlert({
        type: 'warning',
        title: isTurkish ? 'Health Connect Gerekli' : 'Health Connect Required',
        message: isTurkish
          ? 'Google Health Connect uygulaması cihazınızda yüklü değil. Sağlık verilerinizi takip edebilmek için Play Store\'dan yüklemeniz gerekiyor.'
          : 'Google Health Connect app is not installed on your device. You need to install it from the Play Store to track your health data.',
        buttons: [
          {
            text: isTurkish ? 'Yükle' : 'Install',
            onPress: () => healthService.openHealthConnectInstall(),
          },
          { text: isTurkish ? 'Vazgeç' : 'Cancel' },
        ],
      });
    } else if (result.needsPermission) {
      showAlert({
        type: 'confirm',
        title: isTurkish ? 'İzin Gerekli' : 'Permission Required',
        message: isTurkish
          ? 'Google Health verilerini okuyabilmek için Health Connect izinlerini açmanız gerekiyor.'
          : 'You need to enable Health Connect permissions to read Google Health data.',
        buttons: [
          {
            text: isTurkish ? 'Ayarları Aç' : 'Open Settings',
            onPress: () => healthService.openHealthConnectSettings(),
          },
          { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
        ],
      });
    } else {
      showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: result.error || (isTurkish ? 'Bağlantı kurulamadı.' : 'Connection failed.'), buttons: [{ text: 'OK' }] });
    }
  };

  const drinkWater = async () => { const updated = await waterService.drinkWater(); setWaterConfig(updated); };
  const undoWater = async () => { const updated = await waterService.undoLastDrink(); setWaterConfig(updated); };

  const saveWaterSetup = async () => {
    const goal = parseFloat(waterGoalInput); const mlSip = parseInt(mlPerSipInput);
    if (isNaN(goal) || goal <= 0 || isNaN(mlSip) || mlSip <= 0) { showAlert({ type: 'warning', title: '!', message: isTurkish ? 'Geçerli değerler girin.' : 'Enter valid values.', buttons: [{ text: 'OK' }] }); return; }
    const startHour = Math.max(0, Math.min(23, parseInt(waterStartHourInput) || 8));
    const endHour = Math.max(startHour + 1, Math.min(23, parseInt(waterEndHourInput) || 22));
    const existing = waterConfig || { dailyGoalLiters: 2.5, mlPerSip: 250, startHour: 8, endHour: 22, currentIntakeMl: 0, date: new Date().toDateString(), drinkCount: 0 };
    const updated = { ...existing, dailyGoalLiters: goal, mlPerSip: mlSip, startHour, endHour };
    await waterService.saveConfig(updated);
    await waterService.scheduleWaterNotifications(updated, userGender, isTurkish);
    setWaterConfig(updated); setShowWaterSetup(false);
    showAlert({ type: 'success', title: isTurkish ? 'Su Hedefi' : 'Water Goal', message: isTurkish ? `${goal}L hedef ayarlandı.` : `${goal}L goal set.`, buttons: [{ text: 'OK' }] });
  };

  const waterStats = waterConfig ? waterService.getStats(waterConfig) : null;
  const insightColor = (s: string) => s === 'good' ? '#58CC02' : s === 'warning' ? '#FF9600' : '#FF4B4B';
  const walkingDistanceKm = healthData ? Number(((healthData.steps * 0.78) / 1000).toFixed(2)) : 0;

  const healthMetrics = healthData ? [
    { icon: 'bed', label: isTurkish ? 'Uyku' : 'Sleep', value: healthData.sleepHours > 0 ? `${healthData.sleepHours.toFixed(1)}h` : '--', color: '#7C3AED', bg: colors.secondarySoft },
    { icon: 'footsteps', label: isTurkish ? 'Adım' : 'Steps', value: healthData.steps > 0 ? healthData.steps.toLocaleString() : '--', color: '#58CC02', bg: colors.successSoft },
    { icon: 'walk', label: isTurkish ? 'Yürüyüş' : 'Walk', value: healthData.steps > 0 ? `${walkingDistanceKm} km` : '--', color: '#0EA5E9', bg: colors.infoSoft },
    { icon: 'pulse', label: isTurkish ? 'Nabız' : 'Heart Rate', value: healthData.heartRate > 0 ? `${healthData.heartRate}` : '--', color: '#FF4B4B', bg: colors.errorSoft },
    { icon: 'flame', label: isTurkish ? 'Kalori' : 'Calories', value: healthData.calories > 0 ? healthData.calories.toString() : '--', color: '#FF9600', bg: colors.warningSoft },
    { icon: 'scale', label: isTurkish ? 'Kilo' : 'Weight', value: latestWeight ? `${latestWeight.toFixed(1)} kg` : '--', color: '#9333EA', bg: colors.secondarySoft },
  ] : [];

  const weeklyLabels = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const locale = isTurkish ? 'tr-TR' : 'en-US';
    return day.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
  });

  const weeklyStepsData = {
    labels: weeklyLabels,
    datasets: [{ data: weeklySteps.map(v => Math.max(0, Math.round(v / 100) * 100)) }],
  };
  const weeklySleepChartData = {
    labels: weeklyLabels,
    datasets: [{ data: weeklySleepHours.map(v => Number((v || 0).toFixed(1))) }],
  };

  // Water ring
  const waterProgress = waterStats ? Math.min(waterStats.percentage / 100, 1) : 0;
  const wRingSize = 120; const wSw = 12; const wR = (wRingSize - wSw) / 2;
  const wCirc = 2 * Math.PI * wR; const wOff = wCirc * (1 - waterProgress);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AlertComponent />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ─── HEADER ─── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{isTurkish ? 'Sağlık' : 'Health'}</Text>
              <Text style={styles.headerSub}>{isTurkish ? 'Günlük sağlık takibiniz' : 'Your daily health tracking'}</Text>
            </View>
            <View style={[styles.connBadge, { backgroundColor: connectionStatus.apple || connectionStatus.google ? colors.successSoft : colors.surfaceSecondary }]}>
              <Ionicons name={connectionStatus.apple || connectionStatus.google ? 'checkmark-circle' : 'sync-outline'} size={14} color={connectionStatus.apple || connectionStatus.google ? '#58CC02' : colors.textTertiary} />
              <Text style={[styles.connBadgeText, { color: connectionStatus.apple || connectionStatus.google ? '#58CC02' : colors.textTertiary }]}>
                {connectionStatus.apple || connectionStatus.google ? (isTurkish ? 'Bağlı' : 'OK') : (isTurkish ? 'Bağla' : 'Connect')}
              </Text>
            </View>
          </View>

          {/* ─── METRICS GRID (2x2) ─── */}
          <View style={styles.metricsGrid}>
            {healthMetrics.map((m, i) => (
              <View key={i} style={[styles.metricCard, { backgroundColor: m.bg, width: METRIC_W }]}>
                <View style={[styles.metricIcon, { backgroundColor: m.color + '20' }]}>
                  <Ionicons name={m.icon as any} size={20} color={m.color} />
                </View>
                <Text style={[styles.metricValue, m.value === '--' && { color: colors.textTertiary }]}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* ─── INSIGHTS ─── */}
          {insights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{isTurkish ? 'İçgörüler' : 'Insights'}</Text>
              {insights.map((ins, i) => (
                <View key={i} style={styles.insightCard}>
                  <View style={[styles.insightAccent, { backgroundColor: insightColor(ins.severity) }]} />
                  <View style={[styles.insightIcon, { backgroundColor: insightColor(ins.severity) + '15' }]}>
                    <Ionicons name={ins.icon as any} size={18} color={insightColor(ins.severity)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>{isTurkish ? ins.title_tr : ins.title_en}</Text>
                    <Text style={styles.insightMsg}>{isTurkish ? ins.message_tr : ins.message_en}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ─── STEPS CHART ─── */}
          {BarChart && (
            <>
              <Text style={styles.sectionTitle}><Ionicons name="trending-up" size={16} color="#58CC02" /> {isTurkish ? 'Haftalık Adım' : 'Weekly Steps'}</Text>
              <View style={styles.chartCard}>
                <BarChart
                  data={weeklyStepsData} width={width - 40 - 32} height={150}
                  chartConfig={{ backgroundColor: colors.surface, backgroundGradientFrom: colors.surface, backgroundGradientTo: colors.surface, decimalPlaces: 0, color: (o: number) => `rgba(88, 204, 2, ${o})`, labelColor: () => colors.textTertiary, barPercentage: 0.6 }}
                  style={{ borderRadius: 12 }} showValuesOnTopOfBars
                />
              </View>
            </>
          )}

          {LineChart && (
            <>
              <Text style={styles.sectionTitle}><Ionicons name="moon" size={16} color="#7C3AED" /> {isTurkish ? 'Haftalık Uyku (Saat)' : 'Weekly Sleep (Hours)'}</Text>
              <View style={styles.chartCard}>
                <LineChart
                  data={weeklySleepChartData}
                  width={width - 40 - 32}
                  height={150}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 1,
                    color: (o: number) => `rgba(124, 58, 237, ${o})`,
                    labelColor: () => colors.textTertiary,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#7C3AED' },
                  }}
                  bezier
                  style={{ borderRadius: 12 }}
                />
              </View>
            </>
          )}

          {/* ─── WATER TRACKER ─── */}
          <View style={styles.waterHeader}>
            <Text style={styles.sectionTitle}><Ionicons name="water" size={16} color="#1CB0F6" /> {isTurkish ? 'Su Takibi' : 'Water'}</Text>
            <TouchableOpacity style={styles.setupBtn} onPress={() => setShowWaterSetup(true)}>
              <Ionicons name="settings" size={14} color="#1CB0F6" />
              <Text style={styles.setupBtnText}>{isTurkish ? 'Ayarla' : 'Setup'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.waterCard}>
            {waterStats ? (
              <View style={styles.waterRow}>
                {/* Water Ring */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: wRingSize, height: wRingSize, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={wRingSize} height={wRingSize} style={{ position: 'absolute' }}>
                      <Circle cx={wRingSize / 2} cy={wRingSize / 2} r={wR} stroke={colors.infoSoft} strokeWidth={wSw} fill="none" />
                      <Circle cx={wRingSize / 2} cy={wRingSize / 2} r={wR} stroke="#1CB0F6" strokeWidth={wSw} fill="none"
                        strokeDasharray={`${wCirc} ${wCirc}`} strokeDashoffset={wOff} strokeLinecap="round"
                        transform={`rotate(-90 ${wRingSize / 2} ${wRingSize / 2})`} />
                    </Svg>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.accent }}>{waterStats.percentage.toFixed(0)}%</Text>
                  </View>
                </View>

                {/* Water Info */}
                <View style={{ flex: 1, marginLeft: 18 }}>
                  <Text style={styles.waterAmountText}>
                    {(waterStats.currentIntakeMl / 1000).toFixed(1)}L / {waterConfig!.dailyGoalLiters}L
                  </Text>
                  <Text style={styles.waterRemaining}>
                    {isTurkish ? 'Kalan:' : 'Remaining:'} {(waterStats.remainingMl / 1000).toFixed(1)}L
                  </Text>
                  <View style={styles.waterActions}>
                    <TouchableOpacity style={styles.undoBtn} onPress={undoWater}>
                      <Ionicons name="arrow-undo" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.drinkBtn} onPress={drinkWater}>
                      <Text style={styles.drinkBtnText}>+{waterConfig!.mlPerSip}ml</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowWaterSetup(true)} style={styles.waterEmpty}>
                <Ionicons name="water" size={32} color={colors.accent} />
                <Text style={styles.waterEmptyText}>{isTurkish ? 'Hedef belirle' : 'Set a goal'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Glass Row */}
          {waterStats && waterConfig && (
            <View style={styles.glassRow}>
              {Array.from({ length: Math.ceil((waterConfig.dailyGoalLiters * 1000) / waterConfig.mlPerSip) }, (_, i) => {
                const filled = i < Math.floor(waterStats.currentIntakeMl / waterConfig.mlPerSip);
                return <Ionicons key={i} name={filled ? 'water' : 'water-outline'} size={20} color={filled ? colors.accent : colors.border} />;
              })}
            </View>
          )}

          {/* ─── HEALTH CONNECT ─── */}
          <Text style={styles.sectionTitle}><Ionicons name="link" size={16} color="#58CC02" /> {isTurkish ? 'Bağlantılar' : 'Connections'}</Text>
          {[
            { name: 'Apple Health', icon: 'logo-apple', iconBg: '#000000', connected: connectionStatus.apple, onPress: handleConnectApple },
            { name: 'Google Health', icon: 'logo-google', iconBg: '#4285F4', connected: connectionStatus.google, onPress: handleConnectGoogle },
            { name: 'Strava', icon: 'bicycle', iconBg: '#FC4C02', connected: false, onPress: () => {
              showAlert({
                type: 'info',
                title: 'Strava',
                message: isTurkish ? 'Strava entegrasyonu yakında aktif olacak.' : 'Strava integration is coming soon.',
                buttons: [{ text: 'OK' }]
              });
            }},
            { name: 'MyFitnessPal', icon: 'nutrition', iconBg: '#0066EE', connected: false, onPress: () => {
              showAlert({
                type: 'info',
                title: 'MyFitnessPal',
                message: isTurkish ? 'MyFitnessPal entegrasyonu yakında aktif olacak.' : 'MyFitnessPal integration is coming soon.',
                buttons: [{ text: 'OK' }]
              });
            }},
          ].map((src, i) => (
            <View key={i} style={styles.connectCard}>
              <View style={[styles.connectIcon, { backgroundColor: src.iconBg }]}>
                <Ionicons name={src.icon as any} size={18} color={colors.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connectName}>{src.name}</Text>
                <Text style={[styles.connectStatus, { color: src.connected ? '#58CC02' : colors.textTertiary }]}>
                  {src.connected ? (isTurkish ? 'Bağlı' : 'Connected') : (isTurkish ? 'Bağlı değil' : 'Not connected')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: src.connected ? colors.successSoft : '#58CC02' }]}
                onPress={src.onPress}
              >
                <Text style={[styles.connectBtnText, { color: src.connected ? '#58CC02' : colors.background }]}>
                  {src.connected ? '✓' : (isTurkish ? 'Bağla' : 'Connect')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* ─── MANUAL INPUT ─── */}
          {!connectionStatus.apple && !connectionStatus.google && (
            <>
              <Text style={styles.sectionTitle}>{isTurkish ? 'Manuel Giriş' : 'Manual Entry'}</Text>
              <View style={styles.manualRow}>
                {[
                  { label: isTurkish ? 'Adım' : 'Steps', field: 'steps' },
                  { label: isTurkish ? 'Uyku (h)' : 'Sleep (h)', field: 'sleepHours' },
                  { label: isTurkish ? 'Nabız' : 'HR', field: 'heartRate' },
                ].map(f => (
                  <View key={f.field} style={styles.manualItem}>
                    <Text style={styles.manualLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.manualInput}
                      keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary}
                      onEndEditing={async (e) => {
                        const val = parseFloat(e.nativeEvent.text);
                        if (!isNaN(val)) {
                          const updated = await healthService.updateManualData(f.field as any, val);
                          setHealthData(updated); setInsights(healthService.generateHealthInsights(updated, userGender));
                        }
                      }}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.smartScaleBtn}
                onPress={() => (navigation as any)?.navigate('SmartScale')}
              >
                <Ionicons name="scale-outline" size={20} color={colors.background} />
                <Text style={styles.smartScaleBtnText}>
                  {isTurkish ? 'Detaylı Vücut Analizi Gir (Akıllı Tartı)' : 'Log Full Body Analysis (Smart Scale)'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ─── WATER SETUP MODAL ─── */}
      <Modal visible={showWaterSetup} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: 16, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWaterSetup(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isTurkish ? 'Su Ayarları' : 'Water Setup'}</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={styles.setupCard}>
              <Text style={styles.setupLabel}>{isTurkish ? 'Günlük Hedef (L)' : 'Daily Goal (L)'}</Text>
              <TextInput style={styles.setupInput} value={waterGoalInput} onChangeText={setWaterGoalInput}
                keyboardType="numeric" placeholder="2.5" placeholderTextColor={colors.textTertiary} />

              <Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Her İçişte (ml)' : 'Per Drink (ml)'}</Text>
              <TextInput style={styles.setupInput} value={mlPerSipInput} onChangeText={setMlPerSipInput}
                keyboardType="numeric" placeholder="250" placeholderTextColor={colors.textTertiary} />

              <Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Başlangıç Saati (0-23)' : 'Start Hour (0-23)'}</Text>
              <TextInput style={styles.setupInput} value={waterStartHourInput} onChangeText={setWaterStartHourInput}
                keyboardType="numeric" placeholder="8" placeholderTextColor={colors.textTertiary} />

              <Text style={[styles.setupLabel, { marginTop: 20 }]}>{isTurkish ? 'Bitiş Saati (0-23)' : 'End Hour (0-23)'}</Text>
              <TextInput style={styles.setupInput} value={waterEndHourInput} onChangeText={setWaterEndHourInput}
                keyboardType="numeric" placeholder="22" placeholderTextColor={colors.textTertiary} />

              <View style={styles.calcCard}>
                <Text style={styles.calcText}>{waterGoalInput}L ÷ {mlPerSipInput}ml = {Math.ceil((parseFloat(waterGoalInput) * 1000) / parseInt(mlPerSipInput)) || 0} {isTurkish ? 'bildirim' : 'reminders'}</Text>
                <Text style={[styles.calcText, { marginTop: 6 }]}>{(isTurkish ? 'Saat aralığı' : 'Time range') + `: ${waterStartHourInput || '8'}:00 - ${waterEndHourInput || '22'}:00`}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveWaterSetup} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>{isTurkish ? 'Kaydet & Planla' : 'Save & Schedule'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  connBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  connBadgeText: { fontSize: 11, fontWeight: '700' },

  // Metrics 2x2
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { borderRadius: 20, padding: 16, alignItems: 'center' },
  metricIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  metricLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  // Sections
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 4 },

  // Insights
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 16, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
  insightAccent: { width: 4, height: '100%' },
  insightIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  insightMsg: { fontSize: 11, color: colors.textTertiary, marginTop: 2, lineHeight: 16 },

  // Chart
  chartCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },

  // Water
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.infoSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  setupBtnText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  waterCard: { backgroundColor: colors.infoSoft, borderRadius: 20, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
  waterRow: { flexDirection: 'row', alignItems: 'center' },
  waterAmountText: { fontSize: 18, fontWeight: '800', color: colors.accent },
  waterRemaining: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  waterActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  undoBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  drinkBtn: { backgroundColor: '#1CB0F6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  drinkBtnText: { fontSize: 13, fontWeight: '700', color: colors.background },
  waterEmpty: { alignItems: 'center', paddingVertical: 30 },
  waterEmptyText: { fontSize: 13, color: colors.textTertiary, marginTop: 8 },
  glassRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 20, paddingHorizontal: 4 },

  // Connect
  connectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: colors.borderLight },
  connectIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  connectName: { fontSize: 14, fontWeight: '700', color: colors.text },
  connectStatus: { fontSize: 11, marginTop: 1 },
  connectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  connectBtnText: { fontSize: 12, fontWeight: '700' },

  // Manual
  manualRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  manualItem: { flex: 1 },
  manualLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginBottom: 6, textAlign: 'center' },
  manualInput: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', textAlignVertical: 'center' },
  smartScaleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)' },
  smartScaleBtnText: { fontSize: 14, fontWeight: '700', color: colors.background },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  setupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderLight },
  setupLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  setupInput: { backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontWeight: '700', color: colors.text, borderWidth: 1, borderColor: colors.borderLight, textAlignVertical: 'center' },
  calcCard: { backgroundColor: colors.infoSoft, borderRadius: 14, padding: 14, marginTop: 18 },
  calcText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
});

export default HealthScreen;
