import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Modal,
    FlatList,
} from 'react-native';
import { Image } from 'expo-image';
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

type ExerciseInput = {
    id: string;
    exerciseDbId?: string;
    name: string;
    muscleGroup?: string;
    imageUrl?: string;
    sets: string;
    reps: string;
    weight: string;
    duration: string;
    day: string;
};

const MUSCLE_GROUPS = [
    { key: 'all', tr: 'Tümü', en: 'All' },
    { key: 'chest', tr: 'Göğüs', en: 'Chest' },
    { key: 'back', tr: 'Sırt', en: 'Back' },
    { key: 'legs', tr: 'Bacak', en: 'Legs' },
    { key: 'shoulders', tr: 'Omuz', en: 'Shoulders' },
    { key: 'arms', tr: 'Kollar', en: 'Arms' },
    { key: 'core', tr: 'Karın', en: 'Core' },
    { key: 'glutes', tr: 'Kalça', en: 'Glutes' },
    { key: 'cardio', tr: 'Kardiyo', en: 'Cardio' },
];

type MealInput = {
    id: string;
    type: string;
    foods: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
};

const ProfessionalProgramCreatorScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [professionalId, setProfessionalId] = useState('');
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [selectedClientId, setSelectedClientId] = useState(route.params?.clientId || '');
    
    // Common
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reminderTime, setReminderTime] = useState(''); // e.g., '08:00'
    const [scheduledDate, setScheduledDate] = useState(''); // YYYY-MM-DD
    
    // Exercise Picker
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [pickerMuscle, setPickerMuscle] = useState('all');
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerExercises, setPickerExercises] = useState<any[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);

    // Workout Specific
    const [weeklyTarget, setWeeklyTarget] = useState('');
    const [exercises, setExercises] = useState<ExerciseInput[]>([]);
    
    // Nutrition Specific
    const [calorieTarget, setCalorieTarget] = useState('');
    const [meals, setMeals] = useState<MealInput[]>([]);
    const [endDate, setEndDate] = useState(''); // YYYY-MM-DD
    
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
        const today = new Date().toISOString().split('T')[0];
        setScheduledDate(today);
        setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
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

    const loadPickerExercises = useCallback(async (muscle: string, search: string) => {
        setPickerLoading(true);
        try {
            const { data } = await SupabaseService.getInstance().getExercises(
                isTurkish ? 'tr' : 'en',
                muscle === 'all' ? undefined : muscle,
                undefined,
                undefined,
                0,
                100
            );
            let results = data || [];
            if (search.trim()) {
                const q = search.toLowerCase();
                results = results.filter((e: any) => (e.name || '').toLowerCase().includes(q));
            }
            setPickerExercises(results);
        } catch {
            setPickerExercises([]);
        } finally {
            setPickerLoading(false);
        }
    }, [isTurkish]);

    const openExercisePicker = () => {
        setPickerMuscle('all');
        setPickerSearch('');
        setShowExercisePicker(true);
        loadPickerExercises('all', '');
    };

    const onPickerMuscleChange = (muscle: string) => {
        setPickerMuscle(muscle);
        loadPickerExercises(muscle, pickerSearch);
    };

    const onPickerSearchChange = (text: string) => {
        setPickerSearch(text);
        loadPickerExercises(pickerMuscle, text);
    };

    const selectExerciseFromPicker = (ex: any) => {
        setExercises(prev => [...prev, {
            id: Date.now().toString(),
            exerciseDbId: ex.id,
            name: ex.name || '',
            muscleGroup: ex.muscle_group || '',
            imageUrl: ex.image_url || undefined,
            sets: '3',
            reps: '12',
            weight: '',
            duration: '',
            day: ''
        }]);
        setShowExercisePicker(false);
    };

    const updateExercise = (id: string, field: keyof ExerciseInput, value: string) => {
        setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const removeExercise = (id: string) => {
        setExercises(exercises.filter(e => e.id !== id));
    };

    const addMeal = () => {
        setMeals([...meals, {
            id: Date.now().toString(),
            type: '',
            foods: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: ''
        }]);
    };

    const updateMeal = (id: string, field: keyof MealInput, value: string) => {
        setMeals(meals.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeMeal = (id: string) => {
        setMeals(meals.filter(m => m.id !== id));
    };

    const submit = useCallback(async () => {
        if (!professionalId || !selectedClientId || !title.trim()) return;
        try {
            setSaving(true);
            const client = SupabaseService.getInstance().getClient();
            if (role === 'dietitian') {
                const formattedMeals = meals.map(m => ({
                    type: m.type,
                    description: m.foods,
                    foods: [{ name: m.foods }],
                    calories: m.calories ? Number(m.calories) : 0,
                    protein: m.protein ? Number(m.protein) : 0,
                    carbs: m.carbs ? Number(m.carbs) : 0,
                    fat: m.fat ? Number(m.fat) : 0,
                }));

                const { data, error } = await client.from('assigned_nutrition_plans').insert({
                    client_id: selectedClientId,
                    dietitian_id: professionalId,
                    title: title.trim(),
                    description: description.trim() || null,
                    daily_calories: calorieTarget ? Number(calorieTarget) : null,
                    is_active: true,
                    meals: formattedMeals,
                    start_date: scheduledDate || null,
                    end_date: endDate || null
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
                const formattedExercises = exercises.map(e => ({
                    name: e.name,
                    sets: e.sets ? Number(e.sets) : null,
                    reps: e.reps ? Number(e.reps) : null,
                    weight: e.weight ? Number(e.weight) : null,
                    duration: e.duration,
                    day: e.day,
                }));

                const { data, error } = await client.from('assigned_workouts').insert({
                    client_id: selectedClientId,
                    pt_id: professionalId,
                    title: title.trim(),
                    description: description.trim() || null,
                    notes: weeklyTarget ? `${isTurkish ? 'Haftalık hedef: ' : 'Weekly target: '}${weeklyTarget}` : null,
                    exercises: formattedExercises,
                    scheduled_date: scheduledDate || new Date().toISOString().split('T')[0],
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
            setExercises([]);
            setMeals([]);
            onSelectClient(selectedClientId);
        } finally {
            setSaving(false);
        }
    }, [calorieTarget, description, isTurkish, onSelectClient, professionalId, role, selectedClientId, title, weeklyTarget, exercises, meals, reminderTime, scheduledDate, endDate]);

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

                    {/* DYNAMIC LISTS */}
                    {role === 'dietitian' ? (
                        <View style={styles.dynamicSection}>
                            <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Öğünler' : 'Meals'}</Text>
                            {meals.map((meal, idx) => (
                                <View key={meal.id} style={[styles.dynamicItem, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                                    <View style={styles.dynamicHeader}>
                                        <Text style={{...TYPOGRAPHY.captionBold, color: colors.text}}>{isTurkish ? 'Öğün' : 'Meal'} {idx + 1}</Text>
                                        <TouchableOpacity onPress={() => removeMeal(meal.id)}>
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput value={meal.type} onChangeText={(t) => updateMeal(meal.id, 'type', t)} placeholder={isTurkish ? 'Kahvaltı, Öğle vs.' : 'Breakfast, Lunch etc.'} placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                    <TextInput value={meal.foods} onChangeText={(t) => updateMeal(meal.id, 'foods', t)} placeholder={isTurkish ? 'Yiyecekler (Örn: 2 Yumurta)' : 'Foods (Ex: 2 Eggs)'} placeholderTextColor={colors.textTertiary} multiline style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight, height: 60 }]} />
                                    <View style={styles.row}>
                                        <TextInput value={meal.calories} onChangeText={(t) => updateMeal(meal.id, 'calories', t)} placeholder="Kcal" keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, styles.flex1, { color: colors.text, borderColor: colors.borderLight }]} />
                                        <TextInput value={meal.protein} onChangeText={(t) => updateMeal(meal.id, 'protein', t)} placeholder="Pro (g)" keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, styles.flex1, { color: colors.text, borderColor: colors.borderLight }]} />
                                        <TextInput value={meal.carbs} onChangeText={(t) => updateMeal(meal.id, 'carbs', t)} placeholder="Karb (g)" keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, styles.flex1, { color: colors.text, borderColor: colors.borderLight }]} />
                                        <TextInput value={meal.fat} onChangeText={(t) => updateMeal(meal.id, 'fat', t)} placeholder="Yağ (g)" keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, styles.flex1, { color: colors.text, borderColor: colors.borderLight }]} />
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={addMeal}>
                                <Ionicons name="add" size={18} color={colors.primary} />
                                <Text style={{...TYPOGRAPHY.captionBold, color: colors.primary}}>{isTurkish ? 'Öğün Ekle' : 'Add Meal'}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Günlük Kalori Hedefi' : 'Daily Calorie Target'}</Text>
                            <TextInput
                                value={calorieTarget}
                                onChangeText={setCalorieTarget}
                                keyboardType="numeric"
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                                placeholder="2200"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <View style={styles.row}>
                                <View style={styles.flex1}>
                                    <Text style={[styles.label, { color: colors.text, marginTop: SPACING.sm }]}>{isTurkish ? 'Başlangıç' : 'Start Date'}</Text>
                                    <TextInput value={scheduledDate} onChangeText={setScheduledDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                </View>
                                <View style={styles.flex1}>
                                    <Text style={[styles.label, { color: colors.text, marginTop: SPACING.sm }]}>{isTurkish ? 'Bitiş' : 'End Date'}</Text>
                                    <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.dynamicSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Egzersizler' : 'Exercises'}</Text>
                                {exercises.length > 0 && (
                                    <Text style={[styles.exerciseCount, { color: colors.primary }]}>{exercises.length} {isTurkish ? 'hareket' : 'moves'}</Text>
                                )}
                            </View>
                            {exercises.map((ex, idx) => (
                                <View key={ex.id} style={[styles.dynamicItem, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                                    <View style={styles.dynamicHeader}>
                                        <View style={styles.exercisePickedInfo}>
                                            {ex.imageUrl ? (
                                                <Image source={{ uri: ex.imageUrl }} style={styles.exThumb} />
                                            ) : (
                                                <View style={[styles.exThumbPH, { backgroundColor: colors.primary + '20' }]}>
                                                    <Ionicons name="fitness" size={14} color={colors.primary} />
                                                </View>
                                            )}
                                            <View>
                                                <Text style={{...TYPOGRAPHY.captionBold, color: colors.text}} numberOfLines={1}>{ex.name || `${isTurkish ? 'Hareket' : 'Exercise'} ${idx + 1}`}</Text>
                                                {ex.muscleGroup ? <Text style={[styles.exMuscle, { color: colors.textSecondary }]}>{ex.muscleGroup}</Text> : null}
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={[styles.flex1, styles.inputGroup]}>
                                            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Set</Text>
                                            <TextInput value={ex.sets} onChangeText={(t) => updateExercise(ex.id, 'sets', t)} keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={[styles.flex1, styles.inputGroup]}>
                                            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Tekrar' : 'Reps'}</Text>
                                            <TextInput value={ex.reps} onChangeText={(t) => updateExercise(ex.id, 'reps', t)} keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={[styles.flex1, styles.inputGroup]}>
                                            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>kg</Text>
                                            <TextInput value={ex.weight} onChangeText={(t) => updateExercise(ex.id, 'weight', t)} keyboardType="numeric" placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={[styles.flex1, styles.inputGroup]}>
                                            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                                            <TextInput value={ex.duration} onChangeText={(t) => updateExercise(ex.id, 'duration', t)} placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={[styles.flex1, styles.inputGroup]}>
                                            <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Gün' : 'Day'}</Text>
                                            <TextInput value={ex.day} onChangeText={(t) => updateExercise(ex.id, 'day', t)} placeholder={isTurkish ? 'Pzt, Sal...' : 'Mon, Tue...'} placeholderTextColor={colors.textTertiary} style={[styles.inputSmall, { color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.primary }]} onPress={openExercisePicker}>
                                <Ionicons name="add-circle" size={18} color={colors.primary} />
                                <Text style={{...TYPOGRAPHY.captionBold, color: colors.primary}}>{isTurkish ? 'Egzersiz Seç' : 'Pick Exercise'}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.label, { color: colors.text, marginTop: SPACING.md }]}>{isTurkish ? 'Haftalık Hedef' : 'Weekly Target'}</Text>
                            <TextInput
                                value={weeklyTarget}
                                onChangeText={setWeeklyTarget}
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
                                placeholder={isTurkish ? '3 tam antrenman + 2 mobilite' : '3 full sessions + 2 mobility'}
                                placeholderTextColor={colors.textTertiary}
                            />
                            
                            <Text style={[styles.label, { color: colors.text, marginTop: SPACING.sm }]}>{isTurkish ? 'Planlanmış Tarih' : 'Scheduled Date'}</Text>
                            <TextInput value={scheduledDate} onChangeText={setScheduledDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                        </View>
                    )}
                    
                    <Text style={[styles.label, { color: colors.text, marginTop: SPACING.sm }]}>{isTurkish ? 'Hatırlatıcı Saati (İsteğe Bağlı)' : 'Reminder Time (Optional)'}</Text>
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

            {/* Exercise Picker Modal */}
            <Modal visible={showExercisePicker} animationType="slide" onRequestClose={() => setShowExercisePicker(false)}>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.pickerHeader, { borderBottomColor: colors.borderLight }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{isTurkish ? 'Egzersiz Seç' : 'Select Exercise'}</Text>
                        <TouchableOpacity onPress={() => setShowExercisePicker(false)} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={[styles.pickerSearch, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                        <Ionicons name="search" size={16} color={colors.textTertiary} />
                        <TextInput
                            value={pickerSearch}
                            onChangeText={onPickerSearchChange}
                            placeholder={isTurkish ? 'Egzersiz ara...' : 'Search exercises...'}
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.pickerSearchInput, { color: colors.text }]}
                        />
                        {pickerSearch.length > 0 && (
                            <TouchableOpacity onPress={() => onPickerSearchChange('')}>
                                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Muscle Group Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleTabsContent}>
                        {MUSCLE_GROUPS.map(mg => {
                            const active = pickerMuscle === mg.key;
                            return (
                                <TouchableOpacity
                                    key={mg.key}
                                    style={[styles.muscleTab, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.borderLight }]}
                                    onPress={() => onPickerMuscleChange(mg.key)}
                                >
                                    <Text style={[styles.muscleTabText, { color: active ? '#fff' : colors.text }]}>{isTurkish ? mg.tr : mg.en}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Exercise List */}
                    {pickerLoading ? (
                        <View style={styles.pickerLoader}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={pickerExercises}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.pickerList}
                            ListEmptyComponent={
                                <View style={styles.pickerEmpty}>
                                    <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
                                    <Text style={[styles.pickerEmptyText, { color: colors.textTertiary }]}>{isTurkish ? 'Egzersiz bulunamadı' : 'No exercises found'}</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.pickerItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                                    onPress={() => selectExerciseFromPicker(item)}
                                    activeOpacity={0.7}
                                >
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={styles.pickerItemImg} />
                                    ) : (
                                        <View style={[styles.pickerItemImgPH, { backgroundColor: colors.primary + '15' }]}>
                                            <Ionicons name="fitness" size={22} color={colors.primary} />
                                        </View>
                                    )}
                                    <View style={styles.pickerItemInfo}>
                                        <Text style={[styles.pickerItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                                        <Text style={[styles.pickerItemMuscle, { color: colors.textSecondary }]}>{item.muscle_group || ''}</Text>
                                    </View>
                                    <View style={[styles.pickerAddBtn, { backgroundColor: colors.primary }]}>
                                        <Ionicons name="add" size={18} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
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
        minHeight: 64,
        textAlignVertical: 'top',
    },
    dynamicSection: {
        marginTop: SPACING.sm,
    },
    dynamicItem: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
        gap: 6,
    },
    dynamicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    inputSmall: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        ...TYPOGRAPHY.caption,
    },
    row: {
        flexDirection: 'row',
        gap: 6,
    },
    flex1: {
        flex: 1,
    },
    addBtn: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginBottom: SPACING.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exerciseCount: {
        ...TYPOGRAPHY.captionBold,
        marginTop: SPACING.md,
    },
    exercisePickedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    exThumb: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    exThumbPH: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exMuscle: {
        ...TYPOGRAPHY.caption,
        marginTop: 1,
    },
    inputGroup: {
        gap: 2,
    },
    inputLabel: {
        ...TYPOGRAPHY.caption,
        marginBottom: 2,
    },
    pickerContainer: {
        flex: 1,
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.section,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
    },
    pickerTitle: {
        ...TYPOGRAPHY.h3,
    },
    pickerSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        gap: 8,
    },
    pickerSearchInput: {
        flex: 1,
        ...TYPOGRAPHY.body,
    },
    muscleTabsContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        gap: 8,
    },
    muscleTab: {
        borderRadius: BORDER_RADIUS.pill,
        paddingVertical: 6,
        paddingHorizontal: SPACING.sm,
        borderWidth: 1,
    },
    muscleTabText: {
        ...TYPOGRAPHY.captionBold,
    },
    pickerLoader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerList: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.xs,
    },
    pickerEmpty: {
        alignItems: 'center',
        paddingTop: 60,
        gap: SPACING.sm,
    },
    pickerEmptyText: {
        ...TYPOGRAPHY.body,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        padding: SPACING.sm,
        gap: SPACING.sm,
    },
    pickerItemImg: {
        width: 52,
        height: 52,
        borderRadius: 10,
    },
    pickerItemImgPH: {
        width: 52,
        height: 52,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerItemInfo: {
        flex: 1,
    },
    pickerItemName: {
        ...TYPOGRAPHY.bodyBold,
    },
    pickerItemMuscle: {
        ...TYPOGRAPHY.caption,
        marginTop: 2,
    },
    pickerAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submit: {
        marginTop: SPACING.md,
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
