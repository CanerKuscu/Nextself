import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformStorage from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { SupabaseService } from '@nextself/shared';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
const PRIVACY_KEY = 'NextSelf_data_privacy';

type PrivacySettings = {
    showWeight: boolean;
    showHeight: boolean;
    showBMI: boolean;
    showWorkouts: boolean;
    showNutrition: boolean;
    showSleep: boolean;
    showSteps: boolean;
    showHeartRate: boolean;
    showWater: boolean;
    showProgress: boolean;
};

const DEFAULT_PRIVACY: PrivacySettings = {
    showWeight: true,
    showHeight: true,
    showBMI: true,
    showWorkouts: true,
    showNutrition: true,
    showSleep: false,
    showSteps: false,
    showHeartRate: false,
    showWater: true,
    showProgress: true,
};

type DataField = {
    key: keyof PrivacySettings;
    icon: string;
    label_tr: string;
    label_en: string;
    desc_tr: string;
    desc_en: string;
    category: 'body' | 'fitness' | 'health';
};

const DATA_FIELDS: DataField[] = [
    // Body
    { key: 'showWeight', icon: 'barbell', label_tr: 'Kilo', label_en: 'Weight', desc_tr: 'Mevcut kilonuz', desc_en: 'Your current weight', category: 'body' },
    { key: 'showHeight', icon: 'resize', label_tr: 'Boy', label_en: 'Height', desc_tr: 'Boyunuz', desc_en: 'Your height', category: 'body' },
    { key: 'showBMI', icon: 'analytics', label_tr: 'BMI / BMR / TDEE', label_en: 'BMI / BMR / TDEE', desc_tr: 'Vücut analiz verileri', desc_en: 'Body analysis data', category: 'body' },
    // Fitness
    { key: 'showWorkouts', icon: 'fitness', label_tr: 'Antrenmanlar', label_en: 'Workouts', desc_tr: 'Antrenman geçmişiniz ve programınız', desc_en: 'Your workout history and program', category: 'fitness' },
    { key: 'showNutrition', icon: 'restaurant', label_tr: 'Beslenme', label_en: 'Nutrition', desc_tr: 'Yemek ve makro takibi', desc_en: 'Food and macro tracking', category: 'fitness' },
    { key: 'showProgress', icon: 'trending-up', label_tr: 'İlerleme', label_en: 'Progress', desc_tr: 'Haftalık/aylık ilerleme grafikleri', desc_en: 'Weekly/monthly progress charts', category: 'fitness' },
    { key: 'showWater', icon: 'water', label_tr: 'Su Takibi', label_en: 'Water Tracking', desc_tr: 'Günlük su içme verisi', desc_en: 'Daily water intake data', category: 'fitness' },
    // Health
    { key: 'showSleep', icon: 'bed', label_tr: 'Uyku', label_en: 'Sleep', desc_tr: 'Uyku süreniz ve kalitesi', desc_en: 'Your sleep duration and quality', category: 'health' },
    { key: 'showSteps', icon: 'footsteps', label_tr: 'Adımlar', label_en: 'Steps', desc_tr: 'Günlük adım sayısı', desc_en: 'Daily step count', category: 'health' },
    { key: 'showHeartRate', icon: 'pulse', label_tr: 'Nabız', label_en: 'Heart Rate', desc_tr: 'Kalp atış hızı verisi', desc_en: 'Heart rate data', category: 'health' },
];

const CATEGORIES = [
    { key: 'body', label_tr: 'Vücut Bilgileri', label_en: 'Body Info', color: '#1CB0F6' },
    { key: 'fitness', label_tr: 'Fitness Verileri', label_en: 'Fitness Data', color: '#58CC02' },
    { key: 'health', label_tr: 'Sağlık Verileri', label_en: 'Health Data', color: '#FF6B6B' },
];

const DataPrivacyScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY);
    const [connectedPros, setConnectedPros] = useState<any[]>([]);
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => { loadSettings(); loadConnections(); }, []);

    const loadSettings = async () => {
        try {
            const data = await PlatformStorage.getItem(PRIVACY_KEY);
            if (data) setSettings(JSON.parse(data));
        } catch { }
    };

    const loadConnections = async () => {
        try {
            const supa = SupabaseService.getInstance();
            const { user } = await supa.getCurrentUser();
            if (user) {
                const { data } = await supa.getClient()
                    .from('client_relationships')
                    .select('*, professional:professional_id(id, full_name, specialization)')
                    .eq('client_id', user.id)
                    .eq('status', 'active');
                if (data) setConnectedPros(data);
            }
        } catch { }
    };

    const toggleSetting = async (key: keyof PrivacySettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        await PlatformStorage.setItem(PRIVACY_KEY, JSON.stringify(newSettings));
        // Sync to Supabase
        try {
            const supa = SupabaseService.getInstance();
            const { user } = await supa.getCurrentUser();
            if (user) {
                await supa.getClient().from('profiles').update({ data_privacy: newSettings }).eq('id', user.id);
            }
        } catch { }
    };

    const toggleAll = async (on: boolean) => {
        const newSettings: PrivacySettings = {} as any;
        for (const key of Object.keys(DEFAULT_PRIVACY) as (keyof PrivacySettings)[]) {
            newSettings[key] = on;
        }
        setSettings(newSettings);
        await PlatformStorage.setItem(PRIVACY_KEY, JSON.stringify(newSettings));
        // Sync to Supabase (same as toggleSetting)
        try {
            const supa = SupabaseService.getInstance();
            const { user } = await supa.getCurrentUser();
            if (user) {
                await supa.getClient().from('profiles').update({ data_privacy: newSettings }).eq('id', user.id);
            }
        } catch { }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => safeGoBack(navigation, 'Profile')} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>{isTurkish ? 'Veri Gizliliği' : 'Data Privacy'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Info Box */}
                <View style={st.infoBox}>
                    <Ionicons name="shield-checkmark" size={22} color="#1CB0F6" />
                    <Text style={st.infoText}>
                        {isTurkish
                            ? 'PT ve diyetisyenlerinizin hangi verilerinizi görebileceğini buradan kontrol edin.'
                            : 'Control which data your PT and dietitians can view.'}
                    </Text>
                </View>

                {/* Connected Professionals */}
                {connectedPros.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={st.sectionTitle}>{isTurkish ? 'Bağlı Uzmanlar' : 'Connected Professionals'}</Text>
                        {connectedPros.map((c, i) => (
                            <View key={i} style={st.proCard}>
                                <View style={st.proAvatar}>
                                    <Ionicons name="person" size={18} color="#58CC02" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.proName}>{c.professional?.full_name || 'Professional'}</Text>
                                    <Text style={st.proSpec}>{c.professional?.specialization || ''}</Text>
                                </View>
                                <View style={[st.statusBadge, { backgroundColor: '#E8FFE0' }]}>
                                    <Text style={[st.statusText, { color: '#58CC02' }]}>{isTurkish ? 'Aktif' : 'Active'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Quick toggle */}
                <View style={st.quickToggle}>
                    <TouchableOpacity style={st.toggleAllBtn} onPress={() => toggleAll(true)}>
                        <Text style={st.toggleAllText}>{isTurkish ? 'Tümünü Aç' : 'Enable All'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.toggleAllBtn, { backgroundColor: '#FFF5F0' }]} onPress={() => toggleAll(false)}>
                        <Text style={[st.toggleAllText, { color: '#FF6B6B' }]}>{isTurkish ? 'Tümünü Kapat' : 'Disable All'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Data Fields by Category */}
                {CATEGORIES.map(cat => (
                    <View key={cat.key} style={{ marginBottom: 20 }}>
                        <Text style={[st.sectionTitle, { color: cat.color }]}>{isTurkish ? cat.label_tr : cat.label_en}</Text>
                        {DATA_FIELDS.filter(f => f.category === cat.key).map(field => (
                            <View key={field.key} style={st.fieldRow}>
                                <Ionicons name={field.icon as any} size={20} color={cat.color} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={st.fieldLabel}>{isTurkish ? field.label_tr : field.label_en}</Text>
                                    <Text style={st.fieldDesc}>{isTurkish ? field.desc_tr : field.desc_en}</Text>
                                </View>
                                <Switch
                                    value={settings[field.key]}
                                    onValueChange={() => toggleSetting(field.key)}
                                    trackColor={{ false: '#E5E5E5', true: cat.color + '50' }}
                                    thumbColor={settings[field.key] ? cat.color : colors.textTertiary}
                                />
                            </View>
                        ))}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },

    infoBox: { flexDirection: 'row', backgroundColor: '#E6F7FF', borderRadius: 16, padding: 16, marginBottom: 20, gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#B3E5FC' },
    infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },

    proCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight, gap: 12 },
    proAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#58CC02' },
    proName: { fontSize: 14, fontWeight: '700', color: colors.text },
    proSpec: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },

    quickToggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    toggleAllBtn: { flex: 1, backgroundColor: '#E8FFE0', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    toggleAllText: { fontSize: 13, fontWeight: '700', color: '#58CC02' },

    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    fieldDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
});

export default DataPrivacyScreen;
