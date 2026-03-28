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
    const [selectedExerciseForProgram, setSelectedExerciseForProgram] = useState<any | null>(null);
    const [selectedWorkoutDay, setSelectedWorkoutDay] = useState('monday');
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
                return equipment && !equipment.includes('body') && equipment !== 'none';
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

    const openCreateProgramModal = (exercise: any) => {
        const today = new Date();
        const jsDay = today.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        setSelectedWorkoutDay(dayOptions[dayIndex].key);
        setNotificationTime(today);
        setSelectedExerciseForProgram(exercise);
        setShowCreateProgramModal(true);
    };

    const closeCreateProgramModal = () => {
        setShowCreateProgramModal(false);
        setSelectedExerciseForProgram(null);
        setShowTimePicker(false);
        setCreatingProgram(false);
    };

    const handleAddExerciseToProgram = async () => {
        if (!selectedExerciseForProgram) return;
        try {
            setCreatingProgram(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add this exercise to your program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }

            const name = getExerciseName(selectedExerciseForProgram);
            const muscle = getExerciseMuscle(selectedExerciseForProgram) || (isTurkish ? 'Genel' : 'General');
            const difficulty = getDifficultyLabel(selectedExerciseForProgram.difficulty, isTurkish);
            const selectedDay = dayOptions.find(d => d.key === selectedWorkoutDay);
            const dayLabel = isTurkish ? selectedDay?.tr : selectedDay?.en;

            const equipmentLower = String(selectedExerciseForProgram.equipment || '').toLowerCase();
            const nameLower = String(name || '').toLowerCase();
            const isCalisthenics = equipmentLower.includes('body') || equipmentLower.includes('none');
            const isCardio = ['cardio', 'run', 'koş', 'jump', 'zıpla', 'bike', 'bisiklet', 'rope', 'ip'].some((k) =>
                nameLower.includes(k) || equipmentLower.includes(k)
            );

            const recommendationLine = isCardio
                ? `${isTurkish ? 'Öneri' : 'Recommendation'}: ${isTurkish ? '25-40 dk orta-yoğun kardiyo' : '25-40 min moderate-vigorous cardio'}`
                : isCalisthenics
                    ? `${isTurkish ? 'Öneri' : 'Recommendation'}: ${selectedExerciseForProgram.difficulty === 'beginner' ? '3 x 8-12' : selectedExerciseForProgram.difficulty === 'intermediate' ? '4 x 10-15' : '4-5 x 12-20'}`
                    : `${isTurkish ? 'Öneri' : 'Recommendation'}: ${selectedExerciseForProgram.difficulty === 'beginner' ? '3 x 12-15' : selectedExerciseForProgram.difficulty === 'intermediate' ? '4 x 8-12' : '4-5 x 6-8'} (${isTurkish ? 'ağırlık eklenebilir' : 'load can be increased progressively'})`;

            const content = [
                `${isTurkish ? 'Egzersiz' : 'Exercise'}: ${name}`,
                `${isTurkish ? 'Kas grubu' : 'Muscle group'}: ${muscle}`,
                `${isTurkish ? 'Zorluk' : 'Difficulty'}: ${difficulty}`,
                `${isTurkish ? 'Gün' : 'Day'}: ${dayLabel}`,
                `${isTurkish ? 'Bildirim saati' : 'Notification time'}: ${formatTime(notificationTime)}`,
                recommendationLine,
            ].join('\n');

            const { error } = await supabase.createAiProgram({
                userId: user.id,
                type: 'workout',
                title: `${name} ${isTurkish ? 'Programı' : 'Program'}`,
                content,
            });

            if (error) throw error;

            const notificationService = NotificationService.getInstance();
            await notificationService.requestPermissions();
            await notificationService.scheduleSmartReminder(
                'workout',
                notificationTime.getHours(),
                notificationTime.getMinutes(),
                `workout_${user.id}_${selectedExerciseForProgram.id}_${selectedWorkoutDay}`,
                'Sports',
                { exerciseName: name },
                isTurkish ? 'tr' : 'en',
                undefined,
                weekdayMap[selectedWorkoutDay]
            );

            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? `${name} programına eklendi ve bildirim ayarlandı.` : `${name} has been added to your program and notification is scheduled.`,
                buttons: [{ text: 'OK' }],
            });
            closeCreateProgramModal();
        } catch {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Egzersiz programa eklenemedi. Tekrar deneyin.' : 'Failed to add exercise to program. Please try again.',
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
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={0.7} style={st.exerciseCard}
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
                                        style={st.addItemBtn}
                                        onPress={() => openCreateProgramModal(item)}
                                    >
                                        <Ionicons name="add" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
            <Modal
                visible={showCreateProgramModal}
                transparent
                animationType="fade"
                onRequestClose={closeCreateProgramModal}
            >
                <View style={st.modalOverlay}>
                    <View style={st.modalCard}>
                        <View style={st.modalHeader}>
                            <Text style={st.modalTitle}>{isTurkish ? 'Create Program' : 'Create Program'}</Text>
                            <TouchableOpacity onPress={closeCreateProgramModal} style={st.modalCloseBtn}>
                                <Ionicons name="close" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={st.modalSubtitle}>
                            {selectedExerciseForProgram
                                ? `${isTurkish ? 'Egzersiz' : 'Exercise'}: ${getExerciseName(selectedExerciseForProgram)}`
                                : ''}
                        </Text>

                        <Text style={st.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</Text>
                        <View style={st.optionWrap}>
                            {dayOptions.map(option => {
                                const active = selectedWorkoutDay === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        activeOpacity={0.75}
                                        style={[st.optionChip, active && st.optionChipActive]}
                                        onPress={() => setSelectedWorkoutDay(option.key)}
                                    >
                                        <Text style={[st.optionChipText, active && st.optionChipTextActive]}>
                                            {isTurkish ? option.tr : option.en}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={st.timeLabel}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</Text>
                        <TouchableOpacity style={st.timeBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="notifications-outline" size={16} color="#58CC02" />
                            <Text style={st.timeBtnText}>{formatTime(notificationTime)}</Text>
                        </TouchableOpacity>

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

                        <View style={st.modalActions}>
                            <TouchableOpacity
                                onPress={closeCreateProgramModal}
                                style={st.cancelBtn}
                                activeOpacity={0.8}
                            >
                                <Text style={st.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddExerciseToProgram}
                                style={[st.createBtn, creatingProgram && { opacity: 0.6 }]}
                                disabled={creatingProgram}
                                activeOpacity={0.85}
                            >
                                <Text style={st.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
                            </TouchableOpacity>
                        </View>
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
        width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
        borderRadius: 16, paddingHorizontal: 14, height: 44, marginHorizontal: 20,
        marginTop: 14, marginBottom: 8, gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text, textAlignVertical: 'center' },
    listContent: { paddingHorizontal: 20, paddingTop: 8 },
    loader: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', color: colors.textTertiary, marginTop: 16 },
    emptyHint: { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalCard: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    modalSubtitle: {
        marginTop: 8,
        color: colors.textTertiary,
        fontSize: 12,
        marginBottom: 14,
    },
    modalSectionTitle: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 8,
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    optionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#F8FAFC',
    },
    optionChipActive: {
        borderColor: '#58CC02',
        backgroundColor: '#58CC0218',
    },
    optionChipText: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#58CC02',
    },
    timeLabel: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 8,
        fontWeight: '600',
    },
    timeBtn: {
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    timeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#F8FAFC',
    },
    cancelBtnText: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
    },
    createBtn: {
        flex: 1.3,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#58CC02',
    },
    createBtnText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '800',
    },
});

export default MuscleExercisesScreen;
