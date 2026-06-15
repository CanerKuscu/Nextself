import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, TextInput, Dimensions, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AnimatedButton from '../components/AnimatedButton';
import { SupabaseService } from '@nextself/shared';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import { useAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return '#58CC02';
    if (d === 'intermediate') return '#FF9600';
    if (d === 'advanced') return '#FF4B4B';
    return '#AFAFBF';
};
const getDifficultyLabel = (d: string, tr: boolean) => {
    if (!tr) return d;
    if (d === 'beginner') return 'Başlangıç';
    if (d === 'intermediate') return 'Orta';
    if (d === 'advanced') return 'İleri';
    return d;
};

const MuscleExercisesScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const st = React.useMemo(() => getStyles(colors), [colors]);

    const { muscleGroup, category, muscleName, workoutType } = route.params;
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
    // Multi-select cart: each item has exercise data + per-exercise options
    const [selectedExercises, setSelectedExercises] = useState<{
        exercise: any;
        sets: string;
        reps: string;
        weight: string;
        duration: string;
        restTime: string;
        day: string;
    }[]>([]);
    const [notificationTime, setNotificationTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [creatingProgram, setCreatingProgram] = useState(false);
    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { showAlert, AlertComponent } = useAlert();

    useEffect(() => {
        loadExercises();
    }, []);

    const filterByWorkoutType = (rows: any[]) => {
        if (!Array.isArray(rows)) return [];
        const blockedStrengthWords = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'smith', 'bench press', 'deadlift'];
        const cardioWords = ['cardio', 'run', 'jog', 'jump', 'rope', 'cycling', 'bike', 'burpee', 'koş', 'ip', 'bisiklet', 'zıpla', 'kardiyo', 'treadmill', 'elliptical'];
        if (workoutType === 'cardio') {
            return rows.filter((item) => {
                const mixed = `${item?.name || ''} ${item?.name_tr || ''} ${item?.equipment || ''} ${item?.category || ''}`.toLowerCase();
                return cardioWords.some((word) => mixed.includes(word)) && blockedStrengthWords.every((word) => !mixed.includes(word));
            });
        }
        if (workoutType === 'calisthenics') {
            return rows.filter((item) => {
                const equipment = String(item?.equipment || '').toLowerCase();
                return equipment.includes('body') || equipment.includes('none');
            });
        }
        if (workoutType === 'strength') {
            return rows.filter((item) => {
                const equipment = String(item?.equipment || '').toLowerCase();
                // Treat rows with missing equipment as strength by default (cardio/calisthenics
                // both require explicit signals via cardioWords or 'body'/'none' equipment).
                // Previously these rows were dropped, hiding legitimate strength exercises.
                if (!equipment) return true;
                return !equipment.includes('body') && equipment !== 'none';
            });
        }
        return rows;
    };

    const loadExercises = async () => {
        setLoading(true);
        try {
            console.log('[Exercises] Loading with params:', { muscleGroup, category, workoutType });
            const { data, error } = await SupabaseService.getInstance().getExercises(
                isTurkish ? 'tr' : 'en',
                category,
                muscleGroup,
                workoutType
            );
            console.log('[Exercises] Result:', { dataCount: data?.length, error });

            if (error) {
                console.error('[Exercises] Error fetching:', error);
            }

            if (data && data.length > 0) {
                setExercises(filterByWorkoutType(data));
            } else {
                // Fallback: try without workout type filter if no results
                console.log('[Exercises] No results, trying fallback...');
                const { data: fallbackData } = await SupabaseService.getInstance().getExercises(
                    isTurkish ? 'tr' : 'en',
                    category,
                    muscleGroup,
                    undefined // no workout type filter
                );
                console.log('[Exercises] Fallback result:', { count: fallbackData?.length });
                if (fallbackData && fallbackData.length > 0) {
                    setExercises(filterByWorkoutType(fallbackData));
                } else {
                    setExercises([]);
                }
            }
        } catch (err) {
            console.error('[Exercises] Exception:', err);
            setExercises([]);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    };

    const filteredExercises = exercises.filter(ex => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (ex.name || '').toLowerCase().includes(q);
    });

    const getExerciseName = (ex: any) => ex.name; // Always show English name per language rules
    const getExerciseMuscle = (ex: any) => isTurkish && ex.muscle_group_tr ? ex.muscle_group_tr : ex.muscle_group || '';
    const dayOptions = [
        { key: 'monday', tr: 'Pazartesi', en: 'Monday' },
        { key: 'tuesday', tr: 'Salı', en: 'Tuesday' },
        { key: 'wednesday', tr: 'Çarşamba', en: 'Wednesday' },
        { key: 'thursday', tr: 'Perşembe', en: 'Thursday' },
        { key: 'friday', tr: 'Cuma', en: 'Friday' },
        { key: 'saturday', tr: 'Cumartesi', en: 'Saturday' },
        { key: 'sunday', tr: 'Pazar', en: 'Sunday' },
    ];
    const weekdayMap: Record<string, number> = {
        sunday: 1,
        monday: 2,
        tuesday: 3,
        wednesday: 4,
        thursday: 5,
        friday: 6,
        saturday: 7,
    };

    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const toggleExerciseSelection = (exercise: any) => {
        setSelectedExercises(prev => {
            const exists = prev.find(e => e.exercise.id === exercise.id);
            if (exists) {
                return prev.filter(e => e.exercise.id !== exercise.id);
            }
            const diff = exercise.difficulty;
            const defaultSets = diff === 'beginner' ? '3' : diff === 'intermediate' ? '4' : '4';
            const defaultReps = diff === 'beginner' ? '12' : diff === 'intermediate' ? '10' : '8';
            return [...prev, {
                exercise,
                sets: defaultSets,
                reps: defaultReps,
                weight: '',
                duration: '',
                restTime: '60',
                day: dayOptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key,
            }];
        });
    };

    const isExerciseSelected = (id: string) => selectedExercises.some(e => e.exercise.id === id);

    const updateSelectedExercise = (exerciseId: string, field: string, value: string) => {
        setSelectedExercises(prev => prev.map(e =>
            e.exercise.id === exerciseId ? { ...e, [field]: value } : e
        ));
    };

    const removeSelectedExercise = (exerciseId: string) => {
        setSelectedExercises(prev => prev.filter(e => e.exercise.id !== exerciseId));
    };

    const openProgramModal = () => {
        if (selectedExercises.length === 0) return;
        setNotificationTime(new Date());
        setShowCreateProgramModal(true);
    };

    const closeCreateProgramModal = () => {
        setShowCreateProgramModal(false);
        setShowTimePicker(false);
        setCreatingProgram(false);
    };

    const handleCreateProgram = async () => {
        if (selectedExercises.length === 0) return;
        try {
            setCreatingProgram(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to create a program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }

            const exerciseLines = selectedExercises.map((sel, idx) => {
                const name = getExerciseName(sel.exercise);
                const muscle = getExerciseMuscle(sel.exercise) || (isTurkish ? 'Genel' : 'General');
                const selectedDay = dayOptions.find(d => d.key === sel.day);
                const dayLabel = isTurkish ? selectedDay?.tr : selectedDay?.en;
                return [
                    `\n--- ${isTurkish ? 'Hareket' : 'Exercise'} ${idx + 1}: ${name} ---`,
                    `${isTurkish ? 'Kas grubu' : 'Muscle group'}: ${muscle}`,
                    `Set: ${sel.sets || '-'}`,
                    `${isTurkish ? 'Tekrar' : 'Reps'}: ${sel.reps || '-'}`,
                    sel.weight ? `${isTurkish ? 'Ağırlık' : 'Weight'}: ${sel.weight} kg` : null,
                    sel.duration ? `${isTurkish ? 'Süre' : 'Duration'}: ${sel.duration}` : null,
                    sel.restTime ? `${isTurkish ? 'Dinlenme' : 'Rest'}: ${sel.restTime}s` : null,
                    `${isTurkish ? 'Gün' : 'Day'}: ${dayLabel}`,
                ].filter(Boolean).join('\n');
            }).join('\n');

            const title = selectedExercises.length === 1
                ? `${getExerciseName(selectedExercises[0].exercise)} ${isTurkish ? 'Programı' : 'Program'}`
                : `${selectedExercises.length} ${isTurkish ? 'Hareket Programı' : 'Exercise Program'}`;

            const content = [
                `${isTurkish ? 'Bildirim saati' : 'Notification time'}: ${formatTime(notificationTime)}`,
                exerciseLines,
            ].join('\n');

            const { error } = await supabase.createAiProgram({
                userId: user.id,
                type: 'workout',
                title,
                content,
            });

            if (error) {
                console.error('[Program] createAiProgram error:', error);
                throw error;
            }

            // Schedule notification for the first exercise's day
            const notificationService = NotificationService.getInstance();
            await notificationService.requestPermissions();
            const firstDay = selectedExercises[0].day;
            await notificationService.scheduleSmartReminder(
                'workout',
                notificationTime.getHours(),
                notificationTime.getMinutes(),
                `workout_${user.id}_program_${Date.now()}`,
                'Sports',
                { exerciseName: title },
                isTurkish ? 'tr' : 'en',
                undefined,
                weekdayMap[firstDay]
            );

            showAlert({
                type: 'success',
                title: isTurkish ? 'Program Oluşturuldu' : 'Program Created',
                message: isTurkish
                    ? `${selectedExercises.length} hareket programınıza eklendi.`
                    : `${selectedExercises.length} exercises added to your program.`,
                buttons: [{ text: 'OK' }],
            });
            closeCreateProgramModal();
            setSelectedExercises([]);
        } catch (err) {
            console.error('[Program] Error:', err);
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program oluşturulamadı. Tekrar deneyin.' : 'Failed to create program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        } finally {
            setCreatingProgram(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AlertComponent />
            {/* Header */}
            <View style={[st.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Workout')} style={st.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={st.headerTitle}>{muscleName}</Text>
                    <Text style={st.headerSub}>{filteredExercises.length} {isTurkish ? 'egzersiz' : 'exercises'}</Text>
                </View>
            </View>

            {/* Search */}
            <View style={st.searchBar}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput
                    style={st.searchInput}
                    placeholder={isTurkish ? 'Egzersiz ara...' : 'Search exercises...'}
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Exercise list */}
            <ScrollView contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={st.loader}><ActivityIndicator size="large" color="#58CC02" /></View>
                ) : filteredExercises.length === 0 ? (
                    <View style={st.emptyState}>
                        <Ionicons name="barbell-outline" size={56} color="#E5E5E5" />
                        <Text style={st.emptyText}>{isTurkish ? 'Egzersiz bulunamadı' : 'No exercises found'}</Text>
                        <Text style={st.emptyHint}>{isTurkish ? 'Farklı bir kas grubu deneyin' : 'Try a different muscle group'}</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
                        {filteredExercises.map(item => {
                            const dc = getDifficultyColor(item.difficulty);
                            const selected = isExerciseSelected(item.id);
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={0.7}
                                    style={[st.exerciseCard, selected && { borderColor: '#58CC02', borderWidth: 2 }]}
                                    onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}>
                                    <View style={[st.exerciseAccent, { backgroundColor: dc }]} />
                                    {item.image_url ? (
                                        <Image source={{ uri: item.image_url }} style={st.exerciseImg} />
                                    ) : (
                                        <View style={[st.exerciseImgPH, { backgroundColor: dc + '15' }]}>
                                            <Ionicons name="fitness" size={24} color={dc} />
                                        </View>
                                    )}
                                    <View style={st.exerciseInfo}>
                                        <Text style={st.exerciseName} numberOfLines={1}>{getExerciseName(item)}</Text>
                                        <Text style={st.exerciseMuscle}>{getExerciseMuscle(item)}</Text>
                                        <View style={st.exerciseMeta}>
                                            <View style={[st.diffDot, { backgroundColor: dc }]} />
                                            <Text style={[st.diffLabel, { color: dc }]}>{getDifficultyLabel(item.difficulty, isTurkish)}</Text>
                                            {item.calories_per_minute ? (
                                                <Text style={st.calLabel}><Ionicons name="flame" size={10} color="#FF6B6B" /> {item.calories_per_minute} cal/dk</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={[st.addItemBtn, selected && { backgroundColor: '#58CC02' }]}
                                        onPress={() => toggleExerciseSelection(item)}
                                    >
                                        <Ionicons name={selected ? 'checkmark' : 'add'} size={18} color="#FFF" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                )}
                <View style={{ height: selectedExercises.length > 0 ? 140 : 100 }} />
            </ScrollView>

            {/* Bottom Cart Bar */}
            {selectedExercises.length > 0 && (
                <View style={[st.cartBar, { paddingBottom: insets.bottom + 12 }]}>
                    <View style={st.cartInfo}>
                        <Ionicons name="fitness" size={20} color="#58CC02" />
                        <Text style={st.cartText}>
                            {selectedExercises.length} {isTurkish ? 'hareket seçildi' : 'exercises selected'}
                        </Text>
                    </View>
                    <TouchableOpacity style={st.cartButton} onPress={openProgramModal} activeOpacity={0.85}>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        <Text style={st.cartButtonText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Program Creation Modal */}
            <Modal
                visible={showCreateProgramModal}
                animationType="slide"
                onRequestClose={closeCreateProgramModal}
            >
                <View style={[st.modalFull, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                    <View style={st.modalHeader}>
                        <TouchableOpacity onPress={closeCreateProgramModal} style={[st.modalCloseBtn, { backgroundColor: colors.surface }]}>
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[st.modalTitle, { color: colors.text }]}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <Text style={[st.modalSubtitle, { color: colors.textTertiary }]}>
                        {selectedExercises.length} {isTurkish ? 'hareket seçildi' : 'exercises selected'}
                    </Text>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                        {selectedExercises.map((sel, idx) => {
                            const name = getExerciseName(sel.exercise);
                            const muscle = getExerciseMuscle(sel.exercise);
                            return (
                                <View key={sel.exercise.id} style={[st.exDetailCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                                    <View style={st.exDetailHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[st.exDetailName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                                            {muscle ? <Text style={[st.exDetailMuscle, { color: colors.textTertiary }]}>{muscle}</Text> : null}
                                        </View>
                                        <TouchableOpacity onPress={() => removeSelectedExercise(sel.exercise.id)}>
                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* Per-exercise options */}
                                    <View style={st.exDetailRow}>
                                        <View style={st.exDetailInputWrap}>
                                            <Text style={[st.exDetailInputLabel, { color: colors.textTertiary }]}>Set</Text>
                                            <TextInput value={sel.sets} onChangeText={v => updateSelectedExercise(sel.exercise.id, 'sets', v)} keyboardType="numeric" style={[st.exDetailInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={st.exDetailInputWrap}>
                                            <Text style={[st.exDetailInputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Tekrar' : 'Reps'}</Text>
                                            <TextInput value={sel.reps} onChangeText={v => updateSelectedExercise(sel.exercise.id, 'reps', v)} keyboardType="numeric" style={[st.exDetailInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={st.exDetailInputWrap}>
                                            <Text style={[st.exDetailInputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Ağırlık' : 'Weight'}</Text>
                                            <TextInput value={sel.weight} onChangeText={v => updateSelectedExercise(sel.exercise.id, 'weight', v)} keyboardType="numeric" placeholder="kg" placeholderTextColor={colors.textTertiary} style={[st.exDetailInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                    </View>
                                    <View style={[st.exDetailRow, { marginTop: 8 }]}>
                                        <View style={st.exDetailInputWrap}>
                                            <Text style={[st.exDetailInputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Süre' : 'Duration'}</Text>
                                            <TextInput value={sel.duration} onChangeText={v => updateSelectedExercise(sel.exercise.id, 'duration', v)} placeholder={isTurkish ? 'dk' : 'min'} placeholderTextColor={colors.textTertiary} style={[st.exDetailInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={st.exDetailInputWrap}>
                                            <Text style={[st.exDetailInputLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Dinlenme' : 'Rest'}</Text>
                                            <TextInput value={sel.restTime} onChangeText={v => updateSelectedExercise(sel.exercise.id, 'restTime', v)} keyboardType="numeric" placeholder="60s" placeholderTextColor={colors.textTertiary} style={[st.exDetailInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]} />
                                        </View>
                                        <View style={st.exDetailInputWrap} />
                                    </View>
                                    {/* Day selection per exercise */}
                                    <Text style={[st.exDetailInputLabel, { color: colors.text, marginTop: 10, marginBottom: 4, fontWeight: '700' }]}>{isTurkish ? 'Gün' : 'Day'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                        {dayOptions.map(opt => {
                                            const active = sel.day === opt.key;
                                            return (
                                                <TouchableOpacity key={opt.key} style={[st.optionChip, active && st.optionChipActive]} onPress={() => updateSelectedExercise(sel.exercise.id, 'day', opt.key)}>
                                                    <Text style={[st.optionChipText, active && st.optionChipTextActive]}>{isTurkish ? opt.tr : opt.en}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}

                        {/* Notification time */}
                        <View style={{ marginTop: 16 }}>
                            <Text style={[st.timeLabel, { color: colors.textTertiary }]}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</Text>
                            <TouchableOpacity style={[st.timeBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]} onPress={() => setShowTimePicker(true)}>
                                <Ionicons name="notifications-outline" size={16} color="#58CC02" />
                                <Text style={[st.timeBtnText, { color: colors.text }]}>{formatTime(notificationTime)}</Text>
                            </TouchableOpacity>
                        </View>

                        {showTimePicker && (
                            <DateTimePicker
                                value={notificationTime}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_, date) => {
                                    if (Platform.OS === 'android') setShowTimePicker(false);
                                    if (date) setNotificationTime(date);
                                }}
                            />
                        )}
                    </ScrollView>

                    {/* Bottom action */}
                    <View style={[st.modalBottomActions, { paddingBottom: insets.bottom + 12 }]}>
                        <TouchableOpacity onPress={closeCreateProgramModal} style={[st.cancelBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]} activeOpacity={0.8}>
                            <Text style={[st.cancelBtnText, { color: colors.text }]}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCreateProgram} style={[st.createBtn, creatingProgram && { opacity: 0.6 }]} disabled={creatingProgram} activeOpacity={0.85}>
                            {creatingProgram ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={st.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: 16, paddingHorizontal: 14, height: 44, marginHorizontal: 20,
        marginTop: 14, marginBottom: 8, gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text, textAlignVertical: 'center' },
    listContent: { paddingHorizontal: 20, paddingTop: 8 },
    loader: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: colors.textTertiary, marginTop: 16 },
    emptyHint: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
    exerciseCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
        borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight, paddingRight: 14,
    },
    exerciseAccent: { width: 4, height: '100%' },
    exerciseImg: { width: 54, height: 54, borderRadius: 14, marginLeft: 12, marginVertical: 12 },
    exerciseImgPH: {
        width: 54, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        marginLeft: 12, marginVertical: 12,
    },
    exerciseInfo: { flex: 1, marginLeft: 12, paddingVertical: 14 },
    exerciseName: { fontSize: 14, fontWeight: '700', color: colors.text },
    exerciseMuscle: { fontSize: 12, color: colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
    exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    diffDot: { width: 6, height: 6, borderRadius: 3 },
    diffLabel: { fontSize: 11, fontWeight: '600' },
    calLabel: { fontSize: 11, color: colors.textTertiary },
    addItemBtn: {
        width: 30, height: 30, borderRadius: 15, backgroundColor: '#58CC02',
        alignItems: 'center', justifyContent: 'center',
    },
    // Cart bar
    cartBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight,
        paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 8,
    },
    cartInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cartText: { fontSize: 14, fontWeight: '700', color: colors.text },
    cartButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#58CC02',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    },
    cartButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
    // Full-screen modal
    modalFull: { flex: 1 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    modalCloseBtn: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    modalSubtitle: {
        marginTop: 4, paddingHorizontal: 18, color: colors.textTertiary, fontSize: 13, marginBottom: 14,
    },
    // Exercise detail cards in modal
    exDetailCard: {
        borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, gap: 8,
    },
    exDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    exDetailName: { fontSize: 15, fontWeight: '700' },
    exDetailMuscle: { fontSize: 12, marginTop: 2 },
    exDetailRow: { flexDirection: 'row', gap: 8 },
    exDetailInputWrap: { flex: 1, gap: 3 },
    exDetailInputLabel: { fontSize: 11, fontWeight: '600' },
    exDetailInput: {
        borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
        fontSize: 14, fontWeight: '600', textAlign: 'center',
    },
    optionChip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
        borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    optionChipActive: { borderColor: '#58CC02', backgroundColor: '#58CC0218' },
    optionChipText: { fontSize: 12, color: colors.textTertiary, fontWeight: '600' },
    optionChipTextActive: { color: '#58CC02' },
    timeLabel: { fontSize: 12, marginBottom: 8, fontWeight: '600' },
    timeBtn: {
        height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8,
    },
    timeBtnText: { fontSize: 14, fontWeight: '700' },
    modalBottomActions: {
        position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10,
        paddingHorizontal: 18, paddingTop: 14, backgroundColor: colors.background,
        borderTopWidth: 1, borderTopColor: colors.borderLight,
    },
    cancelBtn: {
        flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    cancelBtnText: { fontSize: 14, fontWeight: '700' },
    createBtn: {
        flex: 1.3, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#58CC02',
    },
    createBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
});

export default MuscleExercisesScreen;
