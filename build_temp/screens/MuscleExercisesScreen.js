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
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const datetimepicker_1 = __importDefault(require("@react-native-community/datetimepicker"));
const supabase_1 = require("../services/supabase");
const notificationService_1 = require("../services/notificationService");
const useTranslation_1 = require("../hooks/useTranslation");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const CustomAlert_1 = require("../components/CustomAlert");
const { width } = react_native_1.Dimensions.get('window');
const getDifficultyColor = (d) => {
    if (d === 'beginner')
        return '#58CC02';
    if (d === 'intermediate')
        return '#FF9600';
    if (d === 'advanced')
        return '#FF4B4B';
    return '#AFAFBF';
};
const getDifficultyLabel = (d, tr) => {
    if (!tr)
        return d;
    if (d === 'beginner')
        return 'Başlangıç';
    if (d === 'intermediate')
        return 'Orta';
    if (d === 'advanced')
        return 'İleri';
    return d;
};
const MuscleExercisesScreen = ({ navigation, route }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const st = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { muscleGroup, category, muscleName, workoutType } = route.params;
    const [exercises, setExercises] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [showCreateProgramModal, setShowCreateProgramModal] = (0, react_1.useState)(false);
    const [selectedExerciseForProgram, setSelectedExerciseForProgram] = (0, react_1.useState)(null);
    const [selectedWorkoutDay, setSelectedWorkoutDay] = (0, react_1.useState)('monday');
    const [notificationTime, setNotificationTime] = (0, react_1.useState)(new Date());
    const [showTimePicker, setShowTimePicker] = (0, react_1.useState)(false);
    const [creatingProgram, setCreatingProgram] = (0, react_1.useState)(false);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    (0, react_1.useEffect)(() => {
        loadExercises();
    }, []);
    const filterByWorkoutType = (rows) => {
        if (!Array.isArray(rows))
            return [];
        const blockedStrengthWords = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'smith', 'bench press', 'deadlift'];
        const cardioWords = ['cardio', 'run', 'jog', 'jump', 'rope', 'cycling', 'bike', 'burpee', 'koş', 'ip', 'bisiklet', 'zıpla', 'kardiyo', 'treadmill', 'elliptical'];
        if (workoutType === 'cardio') {
            return rows.filter((item) => {
                const mixed = `${(item === null || item === void 0 ? void 0 : item.name) || ''} ${(item === null || item === void 0 ? void 0 : item.name_tr) || ''} ${(item === null || item === void 0 ? void 0 : item.equipment) || ''} ${(item === null || item === void 0 ? void 0 : item.category) || ''}`.toLowerCase();
                return cardioWords.some((word) => mixed.includes(word)) && blockedStrengthWords.every((word) => !mixed.includes(word));
            });
        }
        if (workoutType === 'calisthenics') {
            return rows.filter((item) => {
                const equipment = String((item === null || item === void 0 ? void 0 : item.equipment) || '').toLowerCase();
                return equipment.includes('body') || equipment.includes('none');
            });
        }
        if (workoutType === 'strength') {
            return rows.filter((item) => {
                const equipment = String((item === null || item === void 0 ? void 0 : item.equipment) || '').toLowerCase();
                return equipment && !equipment.includes('body') && equipment !== 'none';
            });
        }
        return rows;
    };
    const loadExercises = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        try {
            console.log('[Exercises] Loading with params:', { muscleGroup, category, workoutType });
            const { data, error } = yield supabase_1.SupabaseService.getInstance().getExercises(isTurkish ? 'tr' : 'en', category, muscleGroup, workoutType);
            console.log('[Exercises] Result:', { dataCount: data === null || data === void 0 ? void 0 : data.length, error });
            if (error) {
                console.error('[Exercises] Error fetching:', error);
            }
            if (data && data.length > 0) {
                setExercises(filterByWorkoutType(data));
            }
            else {
                // Fallback: try without workout type filter if no results
                console.log('[Exercises] No results, trying fallback...');
                const { data: fallbackData } = yield supabase_1.SupabaseService.getInstance().getExercises(isTurkish ? 'tr' : 'en', category, muscleGroup, undefined // no workout type filter
                );
                console.log('[Exercises] Fallback result:', { count: fallbackData === null || fallbackData === void 0 ? void 0 : fallbackData.length });
                if (fallbackData && fallbackData.length > 0) {
                    setExercises(filterByWorkoutType(fallbackData));
                }
                else {
                    setExercises([]);
                }
            }
        }
        catch (err) {
            console.error('[Exercises] Exception:', err);
            setExercises([]);
        }
        finally {
            setLoading(false);
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    });
    const filteredExercises = exercises.filter(ex => {
        if (!searchQuery)
            return true;
        const q = searchQuery.toLowerCase();
        return (ex.name || '').toLowerCase().includes(q);
    });
    const getExerciseName = (ex) => ex.name; // Always show English name per language rules
    const getExerciseMuscle = (ex) => isTurkish && ex.muscle_group_tr ? ex.muscle_group_tr : ex.muscle_group || '';
    const dayOptions = [
        { key: 'monday', tr: 'Pazartesi', en: 'Monday' },
        { key: 'tuesday', tr: 'Salı', en: 'Tuesday' },
        { key: 'wednesday', tr: 'Çarşamba', en: 'Wednesday' },
        { key: 'thursday', tr: 'Perşembe', en: 'Thursday' },
        { key: 'friday', tr: 'Cuma', en: 'Friday' },
        { key: 'saturday', tr: 'Cumartesi', en: 'Saturday' },
        { key: 'sunday', tr: 'Pazar', en: 'Sunday' },
    ];
    const weekdayMap = {
        sunday: 1,
        monday: 2,
        tuesday: 3,
        wednesday: 4,
        thursday: 5,
        friday: 6,
        saturday: 7,
    };
    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    const openCreateProgramModal = (exercise) => {
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
    const handleAddExerciseToProgram = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedExerciseForProgram)
            return;
        try {
            setCreatingProgram(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
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
            const dayLabel = isTurkish ? selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.tr : selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.en;
            const equipmentLower = String(selectedExerciseForProgram.equipment || '').toLowerCase();
            const nameLower = String(name || '').toLowerCase();
            const isCalisthenics = equipmentLower.includes('body') || equipmentLower.includes('none');
            const isCardio = ['cardio', 'run', 'koş', 'jump', 'zıpla', 'bike', 'bisiklet', 'rope', 'ip'].some((k) => nameLower.includes(k) || equipmentLower.includes(k));
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
            const { error } = yield supabase.createAiProgram({
                userId: user.id,
                type: 'workout',
                title: `${name} ${isTurkish ? 'Programı' : 'Program'}`,
                content,
            });
            if (error)
                throw error;
            const notificationService = notificationService_1.NotificationService.getInstance();
            yield notificationService.requestPermissions();
            yield notificationService.scheduleSmartReminder('workout', notificationTime.getHours(), notificationTime.getMinutes(), `workout_${user.id}_${selectedExerciseForProgram.id}_${selectedWorkoutDay}`, 'Sports', { exerciseName: name }, isTurkish ? 'tr' : 'en', undefined, weekdayMap[selectedWorkoutDay]);
            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? `${name} programına eklendi ve bildirim ayarlandı.` : `${name} has been added to your program and notification is scheduled.`,
                buttons: [{ text: 'OK' }],
            });
            closeCreateProgramModal();
        }
        catch (_a) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Egzersiz programa eklenemedi. Tekrar deneyin.' : 'Failed to add exercise to program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
        finally {
            setCreatingProgram(false);
        }
    });
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
            <AlertComponent />
            {/* Header */}
            <react_native_1.View style={[st.header, { paddingTop: insets.top + 8 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} style={st.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.View style={{ flex: 1 }}>
                    <react_native_1.Text style={st.headerTitle}>{muscleName}</react_native_1.Text>
                    <react_native_1.Text style={st.headerSub}>{filteredExercises.length} {isTurkish ? 'egzersiz' : 'exercises'}</react_native_1.Text>
                </react_native_1.View>
            </react_native_1.View>

            {/* Search */}
            <react_native_1.View style={st.searchBar}>
                <vector_icons_1.Ionicons name="search" size={18} color={colors.textTertiary}/>
                <react_native_1.TextInput style={st.searchInput} placeholder={isTurkish ? 'Egzersiz ara...' : 'Search exercises...'} placeholderTextColor={colors.textTertiary} value={searchQuery} onChangeText={setSearchQuery}/>
                {searchQuery.length > 0 && (<react_native_1.TouchableOpacity onPress={() => setSearchQuery('')}>
                        <vector_icons_1.Ionicons name="close-circle" size={18} color={colors.textTertiary}/>
                    </react_native_1.TouchableOpacity>)}
            </react_native_1.View>

            {/* Exercise list */}
            <react_native_1.ScrollView contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}>
                {loading ? (<react_native_1.View style={st.loader}><react_native_1.ActivityIndicator size="large" color="#58CC02"/></react_native_1.View>) : filteredExercises.length === 0 ? (<react_native_1.View style={st.emptyState}>
                        <vector_icons_1.Ionicons name="barbell-outline" size={56} color="#E5E5E5"/>
                        <react_native_1.Text style={st.emptyText}>{isTurkish ? 'Egzersiz bulunamadı' : 'No exercises found'}</react_native_1.Text>
                        <react_native_1.Text style={st.emptyHint}>{isTurkish ? 'Farklı bir kas grubu deneyin' : 'Try a different muscle group'}</react_native_1.Text>
                    </react_native_1.View>) : (<react_native_1.Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
                        {filteredExercises.map(item => {
                const dc = getDifficultyColor(item.difficulty);
                return (<react_native_1.TouchableOpacity key={item.id} activeOpacity={0.7} style={st.exerciseCard} onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}>
                                    <react_native_1.View style={[st.exerciseAccent, { backgroundColor: dc }]}/>
                                    {item.image_url ? (<react_native_1.Image source={{ uri: item.image_url }} style={st.exerciseImg}/>) : (<react_native_1.View style={[st.exerciseImgPH, { backgroundColor: dc + '15' }]}>
                                            <vector_icons_1.Ionicons name="fitness" size={24} color={dc}/>
                                        </react_native_1.View>)}
                                    <react_native_1.View style={st.exerciseInfo}>
                                        <react_native_1.Text style={st.exerciseName} numberOfLines={1}>{getExerciseName(item)}</react_native_1.Text>
                                        <react_native_1.Text style={st.exerciseMuscle}>{getExerciseMuscle(item)}</react_native_1.Text>
                                        <react_native_1.View style={st.exerciseMeta}>
                                            <react_native_1.View style={[st.diffDot, { backgroundColor: dc }]}/>
                                            <react_native_1.Text style={[st.diffLabel, { color: dc }]}>{getDifficultyLabel(item.difficulty, isTurkish)}</react_native_1.Text>
                                            {item.calories_per_minute ? (<react_native_1.Text style={st.calLabel}><vector_icons_1.Ionicons name="flame" size={10} color="#FF6B6B"/> {item.calories_per_minute} cal/dk</react_native_1.Text>) : null}
                                        </react_native_1.View>
                                    </react_native_1.View>
                                    <react_native_1.TouchableOpacity activeOpacity={0.8} style={st.addItemBtn} onPress={() => openCreateProgramModal(item)}>
                                        <vector_icons_1.Ionicons name="add" size={18} color="#FFF"/>
                                    </react_native_1.TouchableOpacity>
                                </react_native_1.TouchableOpacity>);
            })}
                    </react_native_1.Animated.View>)}
                <react_native_1.View style={{ height: 100 }}/>
            </react_native_1.ScrollView>
            <react_native_1.Modal visible={showCreateProgramModal} transparent animationType="fade" onRequestClose={closeCreateProgramModal}>
                <react_native_1.View style={st.modalOverlay}>
                    <react_native_1.View style={st.modalCard}>
                        <react_native_1.View style={st.modalHeader}>
                            <react_native_1.Text style={st.modalTitle}>{isTurkish ? 'Create Program' : 'Create Program'}</react_native_1.Text>
                            <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={st.modalCloseBtn}>
                                <vector_icons_1.Ionicons name="close" size={18} color={colors.text}/>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                        <react_native_1.Text style={st.modalSubtitle}>
                            {selectedExerciseForProgram
            ? `${isTurkish ? 'Egzersiz' : 'Exercise'}: ${getExerciseName(selectedExerciseForProgram)}`
            : ''}
                        </react_native_1.Text>

                        <react_native_1.Text style={st.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</react_native_1.Text>
                        <react_native_1.View style={st.optionWrap}>
                            {dayOptions.map(option => {
            const active = selectedWorkoutDay === option.key;
            return (<react_native_1.TouchableOpacity key={option.key} activeOpacity={0.75} style={[st.optionChip, active && st.optionChipActive]} onPress={() => setSelectedWorkoutDay(option.key)}>
                                        <react_native_1.Text style={[st.optionChipText, active && st.optionChipTextActive]}>
                                            {isTurkish ? option.tr : option.en}
                                        </react_native_1.Text>
                                    </react_native_1.TouchableOpacity>);
        })}
                        </react_native_1.View>

                        <react_native_1.Text style={st.timeLabel}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</react_native_1.Text>
                        <react_native_1.TouchableOpacity style={st.timeBtn} onPress={() => setShowTimePicker(true)}>
                            <vector_icons_1.Ionicons name="notifications-outline" size={16} color="#58CC02"/>
                            <react_native_1.Text style={st.timeBtnText}>{formatTime(notificationTime)}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        {showTimePicker && (<datetimepicker_1.default value={notificationTime} mode="time" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                if (react_native_1.Platform.OS === 'android')
                    setShowTimePicker(false);
                if (date)
                    setNotificationTime(date);
            }}/>)}

                        <react_native_1.View style={st.modalActions}>
                            <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={st.cancelBtn} activeOpacity={0.8}>
                                <react_native_1.Text style={st.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity onPress={handleAddExerciseToProgram} style={[st.createBtn, creatingProgram && { opacity: 0.6 }]} disabled={creatingProgram} activeOpacity={0.85}>
                                <react_native_1.Text style={st.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.View>
            </react_native_1.Modal>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
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
        borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', paddingRight: 14,
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
        borderColor: '#F0F0F0',
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
        borderColor: '#E5E7EB',
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
        borderColor: '#E5E7EB',
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
        borderColor: '#E5E7EB',
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
exports.default = MuscleExercisesScreen;
