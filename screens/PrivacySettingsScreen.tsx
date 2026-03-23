import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

export default function PrivacySettingsScreen() {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>({
        share_steps_with_pt: false,
        share_workouts_with_pt: true,
        share_weight_with_pt: true,
        share_calories_with_dietitian: true,
        share_macros_with_dietitian: true,
        share_water_with_dietitian: true,
        share_weight_with_dietitian: true,
        professional_permissions: {}
    });
    const [professionals, setProfessionals] = useState<any[]>([]);

    const navigation = useNavigation<any>();
    const { isTurkish } = useTranslation();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();

            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = await supabase.getPrivacySettings(user.id);
                if (error) console.error('Error fetching privacy settings');

                if (data) {
                    setSettings({
                        share_steps_with_pt: data.share_steps_with_pt ?? false,
                        share_workouts_with_pt: data.share_workouts_with_pt ?? true,
                        share_weight_with_pt: data.share_weight_with_pt ?? true,
                        share_calories_with_dietitian: data.share_calories_with_dietitian ?? true,
                        share_macros_with_dietitian: data.share_macros_with_dietitian ?? true,
                        share_water_with_dietitian: data.share_water_with_dietitian ?? true,
                        share_weight_with_dietitian: data.share_weight_with_dietitian ?? true,
                        professional_permissions: data.professional_permissions || {}
                    });
                }

                // Fetch connected professionals from active chats
                try {
                    const { data: chats } = await supabase.getChats(user.id);
                    if (chats) {
                        const prosMap = new Map();
                        chats.forEach((c: any) => {
                            const parts = c.chats?.chat_participants || [];
                            parts.forEach((p: any) => {
                                if (p.users && p.users.id !== user.id && p.users.professional_type) {
                                    if (!prosMap.has(p.users.id)) prosMap.set(p.users.id, p.users);
                                }
                            });
                        });
                        setProfessionals(Array.from(prosMap.values()));
                    }
                } catch (e) { console.error('Error fetching professionals:', e); }
            }
        } catch (err) {
            console.error('Privacy settings error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    const handleProToggle = (proId: string, type: 'pt' | 'dietitian', key: string) => {
        setSettings((prev: any) => {
            const perms = prev.professional_permissions || {};
            const proPerms = perms[proId] || {};
            const globalKey = type === 'pt' ? key + '_with_pt' : key + '_with_dietitian';
            const currentVal = proPerms[key] !== undefined ? proPerms[key] : prev[globalKey];

            return {
                ...prev,
                professional_permissions: {
                    ...perms,
                    [proId]: { ...proPerms, [key]: !currentVal }
                }
            };
        });
    };

    const saveSettings = async () => {
        if (!currentUserId) return;
        try {
            setSaving(true);
            const supabase = SupabaseService.getInstance();
            const { error } = await supabase.updatePrivacySettings(currentUserId, settings);

            if (error) throw error;
            alert(isTurkish ? 'Ayarlar kaydedildi.' : 'Settings saved successfully.');
        } catch (err) {
            console.error('Save error:', err);
            alert(isTurkish ? 'Kaydedilemedi.' : 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const renderSettingRow = (key: string, titleTr: string, titleEn: string, icon: keyof typeof Ionicons.glyphMap, color: string) => (
        <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.settingTitle}>{isTurkish ? titleTr : titleEn}</Text>
            </View>
            <Switch
                value={settings[key as keyof typeof settings] as boolean}
                onValueChange={() => handleToggle(key)}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={Platform.OS === 'ios' ? colors.background : (settings[key as keyof typeof settings] ? colors.background : '#f4f3f4')}
            />
        </View>
    );

    const renderProSettingRow = (pro: any, key: string, titleTr: string, titleEn: string, globalKey: string) => {
        const perms = settings.professional_permissions?.[pro.id] || {};
        const isEnabled = perms[key] !== undefined ? perms[key] : settings[globalKey as keyof typeof settings];

        return (
            <View style={styles.proSettingRow}>
                <Text style={styles.proSettingTitle}>{isTurkish ? titleTr : titleEn}</Text>
                <Switch
                    value={isEnabled as boolean}
                    onValueChange={() => handleProToggle(pro.id, pro.professional_type, key)}
                    trackColor={{ false: colors.borderLight, true: colors.primary }}
                    thumbColor={Platform.OS === 'ios' ? colors.background : (isEnabled ? colors.background : '#f4f3f4')}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={GRADIENTS.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => safeGoBack(navigation, 'Settings')}>
                    <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Veri Gizliliği' : 'Privacy Settings'}</Text>
                <TouchableOpacity onPress={saveSettings} style={styles.saveButton} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                        <Text style={styles.saveText}>{isTurkish ? 'Kaydet' : 'Save'}</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>{isTurkish ? 'Antrenör (PT) ile Paylaşım' : 'Share with Trainer (PT)'}</Text>
                    <GlassCard style={styles.card}>
                        {renderSettingRow('share_workouts_with_pt', 'Antrenman Sonuçları', 'Workout Results', 'fitness', colors.primary)}
                        <View style={styles.divider} />
                        {renderSettingRow('share_steps_with_pt', 'Günlük Adımlar', 'Daily Steps', 'walk', colors.warning)}
                        <View style={styles.divider} />
                        {renderSettingRow('share_weight_with_pt', 'Vücut Ağırlığı', 'Body Weight', 'scale', colors.secondary)}
                    </GlassCard>

                    <Text style={styles.sectionTitle}>{isTurkish ? 'Diyetisyen ile Paylaşım (Genel)' : 'Share with Dietitians (Global)'}</Text>
                    <GlassCard style={styles.card}>
                        {renderSettingRow('share_calories_with_dietitian', 'Kalori Tüketimi', 'Calorie Intake', 'flame', colors.error)}
                        <View style={styles.divider} />
                        {renderSettingRow('share_macros_with_dietitian', 'Makro Besinler', 'Macronutrients', 'pie-chart', colors.success)}
                        <View style={styles.divider} />
                        {renderSettingRow('share_water_with_dietitian', 'Su Tüketimi', 'Water Intake', 'water', colors.info)}
                        <View style={styles.divider} />
                        {renderSettingRow('share_weight_with_dietitian', 'Vücut Ağırlığı', 'Body Weight', 'scale', colors.secondary)}
                    </GlassCard>

                    {professionals.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: SPACING.xl, color: colors.primary }]}>
                                {isTurkish ? 'Özel Uzman İzinleri' : 'Specific Professional Permissions'}
                            </Text>
                            <Text style={{ ...TYPOGRAPHY.small, color: colors.textTertiary, marginHorizontal: SPACING.xs, marginBottom: SPACING.md }}>
                                {isTurkish ? 'Buradaki ayarlar yukarıdaki genel ayarları ezer.' : 'These settings override the global settings above.'}
                            </Text>
                            {professionals.map(pro => (
                                <GlassCard key={pro.id} style={[styles.card, { marginBottom: SPACING.md, padding: SPACING.md }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
                                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20', marginRight: 10 }]}>
                                            <Ionicons name="person" size={18} color={colors.primary} />
                                        </View>
                                        <Text style={{ ...TYPOGRAPHY.h3, flex: 1 }}>{pro.first_name} {pro.last_name}</Text>
                                    </View>
                                    <Text style={{ ...TYPOGRAPHY.small, color: colors.textTertiary, marginBottom: 8, marginTop: -15, marginLeft: 46 }}>
                                        {isTurkish ? (pro.professional_type === 'pt' ? 'Antrenör' : 'Diyetisyen') : (pro.professional_type === 'pt' ? 'Trainer' : 'Dietitian')}
                                    </Text>

                                    {pro.professional_type === 'pt' && (
                                        <>
                                            {renderProSettingRow(pro, 'share_workouts', 'Antrenman Paylaşımı', 'Share Workouts', 'share_workouts_with_pt')}
                                            {renderProSettingRow(pro, 'share_steps', 'Adım Paylaşımı', 'Share Steps', 'share_steps_with_pt')}
                                            {renderProSettingRow(pro, 'share_weight', 'Ağırlık Paylaşımı', 'Share Weight', 'share_weight_with_pt')}
                                        </>
                                    )}

                                    {pro.professional_type === 'dietitian' && (
                                        <>
                                            {renderProSettingRow(pro, 'share_calories', 'Kalori Paylaşımı', 'Share Calories', 'share_calories_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_macros', 'Makro Paylaşımı', 'Share Macros', 'share_macros_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_water', 'Su Paylaşımı', 'Share Water', 'share_water_with_dietitian')}
                                            {renderProSettingRow(pro, 'share_weight', 'Ağırlık Paylaşımı', 'Share Weight', 'share_weight_with_dietitian')}
                                        </>
                                    )}
                                </GlassCard>
                            ))}
                        </>
                    )}

                    <Text style={styles.infoText}>
                        {isTurkish
                            ? 'Kapattığınız veriler bağlantı kurduğunuz profesyoneller tarafından görüntülenemez. Atanan programlarınızı daha iyi takip etmeleri için temel verileri açık tutmanız önerilir.'
                            : 'Data turned off cannot be viewed by the professionals you connected with. It is recommended to keep basic data enabled for better tracking of assigned plans.'
                        }
                    </Text>
                </ScrollView>
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: SPACING.lg, paddingHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backButton: { padding: SPACING.xs },
    headerTitle: { ...TYPOGRAPHY.h2, color: colors.textInverse, flex: 1, textAlign: 'center' },
    saveButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.pill },
    saveText: { ...TYPOGRAPHY.bodyBold, color: colors.textInverse },
    content: { padding: SPACING.lg },
    sectionTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginTop: SPACING.lg, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
    card: { padding: 0, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
    settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
    settingTitle: { ...TYPOGRAPHY.body, color: colors.text, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 68 }, // align with text
    infoText: { ...TYPOGRAPHY.small, color: colors.textTertiary, marginTop: SPACING.xl, marginBottom: 40, textAlign: 'center', paddingHorizontal: SPACING.md, lineHeight: 20 },
    proSettingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    proSettingTitle: { ...TYPOGRAPHY.body, color: colors.text, fontSize: 13, fontWeight: '500' },
});
