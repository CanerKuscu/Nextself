import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { NotificationService } from '../services/notificationService';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

type ClientItem = {
    id: string;
    first_name: string | null;
    last_name: string | null;
};

const ProfessionalProgramCreatorScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [professionalId, setProfessionalId] = useState('');
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [selectedClientId, setSelectedClientId] = useState(route.params?.clientId || '');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [calorieTarget, setCalorieTarget] = useState('');
    const [weeklyTarget, setWeeklyTarget] = useState('');
    const [reminderTime, setReminderTime] = useState(''); // e.g., '08:00'
    const [recent, setRecent] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            const { data: pro } = await service.getClient()
                .from('professional_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            const currentRole = pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(currentRole);
            setProfessionalId(pro?.id || '');
            if (!pro?.id) {
                setClients([]);
                setRecent([]);
                return;
            }

            const { data: rels } = await service.getClient()
                .from('client_relationships')
                .select('client_id,status')
                .or(`professional_id.eq.${pro.id},trainer_id.eq.${pro.id},dietitian_id.eq.${pro.id}`)
                .eq('status', 'active');

            const ids = [...new Set((rels || []).map((item: any) => item.client_id))];
            if (ids.length === 0) {
                setClients([]);
                setRecent([]);
                return;
            }

            const { data: profileRows } = await service.getClient()
                .from('profiles')
                .select('id,first_name,last_name')
                .in('id', ids);
            setClients((profileRows || []) as ClientItem[]);

            const focusClientId = route.params?.clientId || ids[0];
            setSelectedClientId((prev: string) => prev || focusClientId);

            if (currentRole === 'dietitian') {
                const { data: plans } = await service.getClient()
                    .from('assigned_nutrition_plans')
                    .select('id,title,created_at,daily_calories')
                    .eq('dietitian_id', pro.id)
                    .eq('client_id', focusClientId)
                    .order('created_at', { ascending: false })
                    .limit(5);
                setRecent(plans || []);
            } else {
                const { data: workouts } = await service.getClient()
                    .from('assigned_workouts')
                    .select('id,title,created_at')
                    .eq('pt_id', pro.id)
                    .eq('client_id', focusClientId)
                    .order('created_at', { ascending: false })
                    .limit(5);
                setRecent(workouts || []);
            }
        } catch {
            setClients([]);
            setRecent([]);
        } finally {
            setLoading(false);
        }
    }, [route.params?.clientId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onSelectClient = useCallback(async (clientId: string) => {
        setSelectedClientId(clientId);
        if (!professionalId) return;
        const service = SupabaseService.getInstance().getClient();
        if (role === 'dietitian') {
            const { data } = await service
                .from('assigned_nutrition_plans')
                .select('id,title,created_at,daily_calories')
                .eq('dietitian_id', professionalId)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecent(data || []);
        } else {
            const { data } = await service
                .from('assigned_workouts')
                .select('id,title,created_at')
                .eq('pt_id', professionalId)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecent(data || []);
        }
    }, [professionalId, role]);

    const submit = useCallback(async () => {
        if (!professionalId || !selectedClientId || !title.trim()) return;
        try {
            setSaving(true);
            const client = SupabaseService.getInstance().getClient();
            if (role === 'dietitian') {
                const { data, error } = await client.from('assigned_nutrition_plans').insert({
                    client_id: selectedClientId,
                    dietitian_id: professionalId,
                    title: title.trim(),
                    description: description.trim() || null,
                    daily_calories: calorieTarget ? Number(calorieTarget) : null,
                    is_active: true,
                }).select('id').single();

                if (data && reminderTime) {
                    const [hour, min] = reminderTime.split(':').map(Number);
                    if (!isNaN(hour) && !isNaN(min)) {
                        await NotificationService.getInstance().scheduleSmartReminder(
                            'nutrition',
                            hour,
                            min,
                            `dietitian_reminder_${data.id}`,
                            'Nutrition',
                            { id: data.id }
                        );
                    }
                }
            } else {
                const { data, error } = await client.from('assigned_workouts').insert({
                    client_id: selectedClientId,
                    pt_id: professionalId,
                    title: title.trim(),
                    description: description.trim() || null,
                    notes: weeklyTarget ? `${isTurkish ? 'Haftalık hedef: ' : 'Weekly target: '}${weeklyTarget}` : null,
                    is_completed: false,
                }).select('id').single();

                if (data && reminderTime) {
                    const [hour, min] = reminderTime.split(':').map(Number);
                    if (!isNaN(hour) && !isNaN(min)) {
                        await NotificationService.getInstance().scheduleSmartReminder(
                            'workout',
                            hour,
                            min,
                            `pt_reminder_${data.id}`,
                            'ActiveWorkout',
                            { workoutId: data.id }
                        );
                    }
                }
            }
            setTitle('');
            setDescription('');
            setCalorieTarget('');
            setWeeklyTarget('');
            setReminderTime('');
            onSelectClient(selectedClientId);
        } finally {
            setSaving(false);
        }
    }, [calorieTarget, description, isTurkish, onSelectClient, professionalId, role, selectedClientId, title, weeklyTarget]);

    const selectedName = useMemo(() => {
        const client = clients.find((item) => item.id === selectedClientId);
        return client ? [client.first_name, client.last_name].filter(Boolean).join(' ') : '';
    }, [clients, selectedClientId]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => safeGoBack(navigation, 'ProfessionalHome')}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {role === 'dietitian' ? (isTurkish ? 'Beslenme Planı Yaz' : 'Create Nutrition Plan') : (isTurkish ? 'Antrenman Programı Yaz' : 'Create Workout Program')}
                </Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Üye Seç' : 'Select Member'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                        {clients.map((item) => {
                            const active = item.id === selectedClientId;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.background }]}
                                    onPress={() => onSelectClient(item.id)}
                                >
                                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                                        {[item.first_name, item.last_name].filter(Boolean).join(' ') || (isTurkish ? 'İsimsiz' : 'Unnamed')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Başlık' : 'Title'}</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={isTurkish ? 'Örn: 4 Haftalık Güç Programı' : 'Ex: 4 Week Strength Plan'}
                        placeholderTextColor={colors.textTertiary}
                    />
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Açıklama' : 'Description'}</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder={isTurkish ? 'Planın amacı ve uygulama notları' : 'Plan goals and execution notes'}
                        placeholderTextColor={colors.textTertiary}
                    />
                    {role === 'dietitian' ? (
                        <>
                            <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Günlük Kalori Hedefi' : 'Daily Calorie Target'}</Text>
                            <TextInput
                                value={calorieTarget}
                                onChangeText={setCalorieTarget}
                                keyboardType="numeric"
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                                placeholder="2200"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Haftalık Hedef' : 'Weekly Target'}</Text>
                            <TextInput
                                value={weeklyTarget}
                                onChangeText={setWeeklyTarget}
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                                placeholder={isTurkish ? '3 tam antrenman + 2 mobilite' : '3 full sessions + 2 mobility'}
                                placeholderTextColor={colors.textTertiary}
                            />
                        </>
                    )}
                    
                    <Text style={[styles.label, { color: colors.text }]}>{isTurkish ? 'Hatırlatıcı Saati (İsteğe Bağlı)' : 'Reminder Time (Optional)'}</Text>
                    <TextInput
                        value={reminderTime}
                        onChangeText={setReminderTime}
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                        placeholder="08:00"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={5}
                    />
                    
                    <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary }]} onPress={submit} disabled={saving || !selectedClientId || !title.trim()}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{isTurkish ? 'Planı Ata' : 'Assign Plan'}</Text>}
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>
                        {selectedName
                            ? (isTurkish ? `${selectedName} için son atamalar` : `Latest assignments for ${selectedName}`)
                            : (isTurkish ? 'Son atamalar' : 'Latest assignments')}
                    </Text>
                    {recent.length === 0 ? (
                        <Text style={[styles.empty, { color: colors.textSecondary }]}>{isTurkish ? 'Kayıt yok.' : 'No records yet.'}</Text>
                    ) : (
                        recent.map((item) => (
                            <View key={item.id} style={[styles.recentRow, { borderBottomColor: colors.borderLight }]}>
                                <Text style={[styles.recentTitle, { color: colors.text }]}>{item.title || (isTurkish ? 'Başlıksız' : 'Untitled')}</Text>
                                <Text style={[styles.recentSub, { color: colors.textSecondary }]}>
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: SPACING.xs,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.sm,
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.xs,
        ...SHADOWS.sm,
    },
    label: {
        ...TYPOGRAPHY.bodyBold,
    },
    chips: {
        gap: SPACING.xs,
    },
    chip: {
        borderRadius: BORDER_RADIUS.pill,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    chipText: {
        ...TYPOGRAPHY.captionBold,
    },
    input: {
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        ...TYPOGRAPHY.body,
    },
    textArea: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
    submit: {
        marginTop: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    submitText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
    },
    empty: {
        ...TYPOGRAPHY.caption,
    },
    recentRow: {
        borderBottomWidth: 1,
        paddingVertical: SPACING.xs,
    },
    recentTitle: {
        ...TYPOGRAPHY.body,
    },
    recentSub: {
        ...TYPOGRAPHY.caption,
    },
});

export default ProfessionalProgramCreatorScreen;
