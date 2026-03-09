import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Animated, Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformStorage from '../utils/platformStorage';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { getLocalDateString } from '../utils/dateUtils';

const { width } = Dimensions.get('window');
const WATER_KEY = 'biosync_water_tracking';
const WATER_SETTINGS_KEY = 'biosync_water_settings';

type WaterData = {
    date: string;
    current: number; // ml
    goal: number; // ml
    drinkCount: number;
};

type WaterSettings = {
    dailyGoalLiters: number;
    notificationCount: number;
};

const WaterTrackingScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const [waterData, setWaterData] = useState<WaterData>({
        date: new Date().toDateString(),
        current: 0,
        goal: 2500,
        drinkCount: 0,
    });
    const [settings, setSettings] = useState<WaterSettings>({
        dailyGoalLiters: 2.5,
        notificationCount: 8,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [tempGoal, setTempGoal] = useState('2.5');
    const [tempNotifications, setTempNotifications] = useState('8');
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { showAlert, AlertComponent } = useAlert();

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const progress = Math.min(waterData.current / waterData.goal, 1);
        Animated.timing(progressAnim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
    }, [waterData.current, waterData.goal]);

    const syncToSupabase = async (data: WaterData) => {
        try {
            const supabase = SupabaseService.getInstance().getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const dateStr = getLocalDateString();
            await supabase.from('water_logs').upsert({
                user_id: user.id,
                date: dateStr,
                amount_ml: data.current,
                goal_ml: data.goal,
                drink_count: data.drinkCount,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,date' });
        } catch (err) { console.warn('Water sync error:', err); }
    };

    const loadData = async () => {
        try {
            const sData = await PlatformStorage.getItem(WATER_SETTINGS_KEY);
            if (sData) {
                const parsed: WaterSettings = JSON.parse(sData);
                setSettings(parsed);
                setTempGoal(parsed.dailyGoalLiters.toString());
                setTempNotifications(parsed.notificationCount.toString());
            }

            // Try loading from Supabase first
            const today = new Date().toDateString();
            const dateStr = getLocalDateString();
            let loaded = false;
            try {
                const supabase = SupabaseService.getInstance().getClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: dbData } = await supabase
                        .from('water_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('date', dateStr)
                        .single();
                    if (dbData) {
                        const newData: WaterData = {
                            date: today,
                            current: dbData.amount_ml || 0,
                            goal: dbData.goal_ml || 2500,
                            drinkCount: dbData.drink_count || 0,
                        };
                        setWaterData(newData);
                        await PlatformStorage.setItem(WATER_KEY, JSON.stringify(newData));
                        loaded = true;
                    }
                }
            } catch { /* fallback to local */ }

            if (!loaded) {
                const wData = await PlatformStorage.getItem(WATER_KEY);
                if (wData) {
                    const parsed: WaterData = JSON.parse(wData);
                    if (parsed.date === today) {
                        setWaterData(parsed);
                    } else {
                        const goalMl = (sData ? JSON.parse(sData).dailyGoalLiters : 2.5) * 1000;
                        const newData = { date: today, current: 0, goal: goalMl, drinkCount: 0 };
                        setWaterData(newData);
                        await PlatformStorage.setItem(WATER_KEY, JSON.stringify(newData));
                    }
                }
            }
        } catch (err) { console.error(err); }
    };

    const saveSettings = async () => {
        const goal = parseFloat(tempGoal) || 2.5;
        const notifs = parseInt(tempNotifications) || 8;
        const newSettings = { dailyGoalLiters: goal, notificationCount: notifs };
        setSettings(newSettings);
        await PlatformStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(newSettings));

        const goalMl = goal * 1000;
        const newData = { ...waterData, goal: goalMl };
        setWaterData(newData);
        await PlatformStorage.setItem(WATER_KEY, JSON.stringify(newData));
        syncToSupabase(newData);
        setShowSettings(false);
    };

    const drinkWater = async () => {
        // Each drink = goal / notificationCount
        const perDrink = waterData.goal / Math.max(settings.notificationCount, 1);
        const newCurrent = Math.min(waterData.current + perDrink, waterData.goal * 1.5);
        const newData: WaterData = {
            ...waterData,
            current: Math.round(newCurrent),
            drinkCount: waterData.drinkCount + 1,
        };
        setWaterData(newData);
        await PlatformStorage.setItem(WATER_KEY, JSON.stringify(newData));
        syncToSupabase(newData);

        // Button pulse animation
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, friction: 3 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();

        if (newCurrent >= waterData.goal && waterData.current < waterData.goal) {
            showAlert({
                type: 'success',
                title: t('goal_reached'),
                message: t('goal_reached_desc'),
                buttons: [{ text: 'OK' }],
            });
        }
    };

    const perDrink = Math.round(waterData.goal / Math.max(settings.notificationCount, 1));
    const progress = Math.min(waterData.current / waterData.goal, 1);
    const remaining = Math.max(waterData.goal - waterData.current, 0);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AlertComponent />
            <ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
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
                                keyboardType="decimal-pad" placeholder="2.5" />
                        </View>
                        <View style={st.settingsRow}>
                            <Text style={st.settingsLabel}>{t('notification_count')}</Text>
                            <TextInput style={st.settingsInput} value={tempNotifications} onChangeText={setTempNotifications}
                                keyboardType="number-pad" placeholder="8" />
                        </View>
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
                            <Text style={st.circleValue}>{(waterData.current / 1000).toFixed(1)}L</Text>
                            <Text style={st.circleGoal}>/ {(waterData.goal / 1000).toFixed(1)}L</Text>
                            <Text style={st.circlePercent}>{Math.round(progress * 100)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={st.statsRow}>
                    <View style={st.statCard}>
                        <Ionicons name="water-outline" size={20} color="#1CB0F6" />
                        <Text style={st.statValue}>{waterData.drinkCount}</Text>
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
                <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 30, alignItems: 'center' }}>
                    <TouchableOpacity onPress={drinkWater} activeOpacity={0.8}>
                        <LinearGradient colors={['#1CB0F6', '#0077CC']} style={st.drinkBtn}>
                            <Ionicons name="water" size={28} color={colors.background} />
                            <Text style={st.drinkBtnText}>{t('i_drank_water')}</Text>
                            <Text style={st.drinkBtnSub}>+{perDrink} ml</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

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
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
    settingsBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E6F7FF', justifyContent: 'center', alignItems: 'center' },

    settingsPanel: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5E5' },
    settingsTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
    settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    settingsLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
    settingsInput: { width: 80, height: 40, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
    settingsHint: { fontSize: 12, color: colors.textTertiary, marginTop: 4, marginBottom: 14 },
    saveBtn: { alignSelf: 'center' },
    saveBtnGrad: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.background },

    circleWrap: { alignItems: 'center', marginBottom: 30 },
    circleOuter: {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#E6F7FF', overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: '#1CB0F6',
    },
    circleFill: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(28,176,246,0.2)',
    },
    circleContent: { alignItems: 'center', zIndex: 1 },
    circleValue: { fontSize: 36, fontWeight: '900', color: colors.text, marginTop: 4 },
    circleGoal: { fontSize: 14, color: colors.textTertiary, fontWeight: '600' },
    circlePercent: { fontSize: 13, fontWeight: '700', color: '#1CB0F6', marginTop: 4 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0', gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },

    drinkBtn: { width: width * 0.65, paddingVertical: 20, borderRadius: 24, alignItems: 'center', gap: 4, elevation: 6, shadowColor: '#1CB0F6', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    drinkBtnText: { fontSize: 18, fontWeight: '800', color: colors.background },
    drinkBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

    tipsCard: { flexDirection: 'row', backgroundColor: '#FFF8F0', borderRadius: 18, padding: 16, marginTop: 30, borderWidth: 1, borderColor: '#FFE0CC' },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: '#FF9600', marginBottom: 4 },
    tipsText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
});

export default WaterTrackingScreen;
