import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Animated, Dimensions, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { WaterTrackingService, WaterConfig } from '../services/waterTrackingService';

const { width } = Dimensions.get('window');

const WaterTrackingScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const waterService = WaterTrackingService.getInstance();
    const [config, setConfig] = useState<WaterConfig | null>(null);

    const [showSettings, setShowSettings] = useState(false);
    const [tempGoal, setTempGoal] = useState('2.5');
    const [tempNotifications, setTempNotifications] = useState('8');
    const [tempStartHour, setTempStartHour] = useState('8');
    const [tempEndHour, setTempEndHour] = useState('22');
    const { t, language } = useLanguage();
    const insets = useSafeAreaInsets();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { showAlert, AlertComponent } = useAlert();
    const isTurkish = language === 'tr';

    const loadData = async () => {
        const data = await waterService.getConfig();
        setConfig(data);
        setTempGoal(data.dailyGoalLiters.toString());
        // Derive notification count from mlPerSip
        const notifs = Math.ceil((data.dailyGoalLiters * 1000) / (data.mlPerSip || 250));
        setTempNotifications(notifs.toString());
        setTempStartHour((data.startHour ?? 8).toString());
        setTempEndHour((data.endHour ?? 22).toString());
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        if (!config) return;
        const goalMl = config.dailyGoalLiters * 1000;
        const progress = Math.min(config.currentIntakeMl / goalMl, 1);
        Animated.timing(progressAnim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
    }, [config?.currentIntakeMl, config?.dailyGoalLiters]);

    const saveSettings = async () => {
        const goal = parseFloat(tempGoal) || 2.5;
        const notifs = parseInt(tempNotifications) || 8;
        const startHour = Math.max(0, Math.min(23, parseInt(tempStartHour) || 8));
        const endHour = Math.max(startHour + 1, Math.min(23, parseInt(tempEndHour) || 22));
        // Calculate mlPerSip based on notification count
        const mlPerSip = Math.round((goal * 1000) / Math.max(notifs, 1));
        
        if (!config) return;
        
        const newConfig: WaterConfig = {
            ...config,
            dailyGoalLiters: goal,
            mlPerSip: mlPerSip,
            startHour,
            endHour,
        };
        
        await waterService.saveConfig(newConfig);
        // We might need gender for scheduling, passing null for now as it's optional/unknown here
        await waterService.scheduleWaterNotifications(newConfig, null, isTurkish);
        setConfig(newConfig);
        setShowSettings(false);
    };

    const drinkWater = async () => {
        const updated = await waterService.drinkWater();
        setConfig(updated);

        // Button pulse animation
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();

        const goalMl = updated.dailyGoalLiters * 1000;
        if (updated.currentIntakeMl >= goalMl && (updated.currentIntakeMl - updated.mlPerSip) < goalMl) {
            showAlert({
                type: 'success',
                title: t('goal_reached'),
                message: t('goal_reached_desc'),
                buttons: [{ text: 'OK' }],
            });
        }
    };

    const removeWater = async () => {
        const updated = await waterService.undoLastDrink();
        setConfig(updated);
    };

    const handleAddWaterProgram = async () => {
        if (!config) return;
        try {
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add a program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }
            
            const notifs = Math.ceil((config.dailyGoalLiters * 1000) / config.mlPerSip);

            const { error } = await supabase.createAiProgram({
                userId: user.id,
                type: 'water',
                title: isTurkish ? 'Su Programı' : 'Water Program',
                content: `${isTurkish ? 'Günlük hedef' : 'Daily goal'}: ${config.dailyGoalLiters}L\n${isTurkish ? 'Hatırlatıcı sayısı' : 'Reminder count'}: ${notifs}`,
            });
            if (error) throw error;

            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? 'Su planı programına eklendi.' : 'Water plan added to your program.',
                buttons: [{ text: 'OK' }],
            });
        } catch {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program eklenemedi. Tekrar deneyin.' : 'Could not add program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
    };

    if (!config) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

    const goalMl = (config.dailyGoalLiters || 2.5) * 1000;
    const currentIntakeMl = config.currentIntakeMl || 0;
    const progress = Math.min(currentIntakeMl / goalMl, 1);
    const remaining = Math.max(goalMl - currentIntakeMl, 0);
    const perDrink = config.mlPerSip || 250;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AlertComponent />
            <ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>{t('water_tracking')}</Text>
                    <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={st.settingsBtn}>
                        <Ionicons name="settings-outline" size={22} color="#1CB0F6" />
                    </TouchableOpacity>
                </View>

                {/* Settings Panel */}
                {showSettings && (
                    <View style={st.settingsPanel}>
                        <Text style={st.settingsTitle}>{t('settings')}</Text>
                        <View style={st.settingsRow}>
                            <Text style={st.settingsLabel}>{t('daily_goal_l')}</Text>
                        <TextInput style={st.settingsInput} value={tempGoal} onChangeText={setTempGoal}
                            keyboardType="decimal-pad" placeholder="2.5" placeholderTextColor={colors.textTertiary} />
                        </View>
                        <View style={st.settingsRow}>
                            <Text style={st.settingsLabel}>{t('notification_count')}</Text>
                        <TextInput style={st.settingsInput} value={tempNotifications} onChangeText={setTempNotifications}
                            keyboardType="number-pad" placeholder="8" placeholderTextColor={colors.textTertiary} />
                        </View>
                        <View style={st.settingsRow}>
                            <Text style={st.settingsLabel}>{isTurkish ? 'Başlangıç Saati' : 'Start Hour'}</Text>
                        <TextInput style={st.settingsInput} value={tempStartHour} onChangeText={setTempStartHour}
                            keyboardType="number-pad" placeholder="8" placeholderTextColor={colors.textTertiary} />
                        </View>
                        <View style={st.settingsRow}>
                            <Text style={st.settingsLabel}>{isTurkish ? 'Bitiş Saati' : 'End Hour'}</Text>
                        <TextInput style={st.settingsInput} value={tempEndHour} onChangeText={setTempEndHour}
                            keyboardType="number-pad" placeholder="22" placeholderTextColor={colors.textTertiary} />
                        </View>
                        <Text style={st.settingsHint}>
                            {(isTurkish ? 'Bildirim aralığı' : 'Reminder range') + `: ${tempStartHour || '8'}:00 - ${tempEndHour || '22'}:00`}
                        </Text>
                        <Text style={st.settingsHint}>
                            {t('each_notification_adds', { ml: Math.round((parseFloat(tempGoal || '2.5') * 1000) / Math.max(parseInt(tempNotifications || '8'), 1)) })}
                        </Text>
                        <TouchableOpacity onPress={saveSettings} style={st.saveBtn}>
                            <LinearGradient colors={['#1CB0F6', '#0099DD']} style={st.saveBtnGrad}>
                                <Text style={st.saveBtnText}>{t('save')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Progress Circle */}
                <View style={st.circleWrap}>
                    <View style={st.circleOuter}>
                        <Animated.View style={[st.circleFill, {
                            height: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        }]} />
                        <View style={st.circleContent}>
                            <Ionicons name="water" size={32} color="#1CB0F6" />
                            <Text style={st.circleValue}>{(currentIntakeMl / 1000).toFixed(1)}L</Text>
                            <Text style={st.circleGoal}>/ {(goalMl / 1000).toFixed(1)}L</Text>
                            <Text style={st.circlePercent}>{Math.round(progress * 100)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={st.statsRow}>
                    <View style={st.statCard}>
                        <Ionicons name="water-outline" size={20} color="#1CB0F6" />
                        <Text style={st.statValue}>{config.drinkCount || 0}</Text>
                        <Text style={st.statLabel}>{t('drinks')}</Text>
                    </View>
                    <View style={st.statCard}>
                        <Ionicons name="add-circle-outline" size={20} color="#58CC02" />
                        <Text style={st.statValue}>{perDrink} ml</Text>
                        <Text style={st.statLabel}>{t('per_drink')}</Text>
                    </View>
                    <View style={st.statCard}>
                        <Ionicons name="trending-down-outline" size={20} color="#FF9600" />
                        <Text style={st.statValue}>{(remaining / 1000).toFixed(1)}L</Text>
                        <Text style={st.statLabel}>{t('remaining')}</Text>
                    </View>
                </View>

                {/* Drink Button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 20 }}>
                    <TouchableOpacity onPress={removeWater} style={st.removeBtn}>
                        <Ionicons name="remove" size={24} color="#FF6B6B" />
                    </TouchableOpacity>

                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity onPress={drinkWater} activeOpacity={0.8}>
                            <LinearGradient colors={['#1CB0F6', '#0077CC']} style={st.drinkBtn}>
                                <Ionicons name="water" size={28} color={colors.background} />
                                <Text style={st.drinkBtnText}>{t('i_drank_water')}</Text>
                                <Text style={st.drinkBtnSub}>+{perDrink} ml</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Tips */}
                <View style={st.tipsCard}>
                    <Ionicons name="bulb-outline" size={22} color="#FF9600" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={st.tipsTitle}>{t('tip')}</Text>
                        <Text style={st.tipsText}>
                            {t('water_tip_desc')}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
    addProgramBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#58CC02', justifyContent: 'center', alignItems: 'center' },
    settingsBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },

    settingsPanel: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
    settingsTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
    settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    settingsLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    settingsInput: { width: 80, height: 40, backgroundColor: colors.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
    settingsHint: { fontSize: 12, color: colors.textTertiary, marginTop: 4, marginBottom: 14 },
    saveBtn: { alignSelf: 'center' },
    saveBtnGrad: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.background },

    circleWrap: { alignItems: 'center', marginBottom: 30 },
    circleOuter: {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: colors.accentSoft, overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: colors.accent,
    },
    circleFill: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(28,176,246,0.2)',
    },
    circleContent: { alignItems: 'center', zIndex: 1 },
    circleValue: { fontSize: 36, fontWeight: '900', color: colors.text, marginTop: 4 },
    circleGoal: { fontSize: 14, color: colors.textTertiary, fontWeight: '600' },
    circlePercent: { fontSize: 13, fontWeight: '700', color: colors.accent, marginTop: 4 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },

    drinkBtn: { width: width * 0.65, paddingVertical: 20, borderRadius: 24, alignItems: 'center', gap: 4, elevation: 6, shadowColor: '#1CB0F6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    drinkBtnText: { fontSize: 18, fontWeight: '800', color: colors.background },
    drinkBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    
    removeBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.errorSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.error + '55' },

    tipsCard: { flexDirection: 'row', backgroundColor: colors.warningSoft, borderRadius: 18, padding: 16, marginTop: 30, borderWidth: 1, borderColor: colors.warning + '55' },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: '#FF9600', marginBottom: 4 },
    tipsText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});

export default WaterTrackingScreen;
