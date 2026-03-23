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
exports.default = AssignmentsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const notificationService_1 = require("../services/notificationService");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
function AssignmentsScreen({ navigation, route }) {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { t, isTurkish, language } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [workouts, setWorkouts] = (0, react_1.useState)([]);
    const [nutrition, setNutrition] = (0, react_1.useState)([]);
    const [supplements, setSupplements] = (0, react_1.useState)([]);
    const [activeTab, setActiveTab] = (0, react_1.useState)('workout');
    const [feedbackVisible, setFeedbackVisible] = (0, react_1.useState)(false);
    const [selectedWorkout, setSelectedWorkout] = (0, react_1.useState)(null);
    const [weeklyAction, setWeeklyAction] = (0, react_1.useState)('stable');
    const [feedbackNotes, setFeedbackNotes] = (0, react_1.useState)('');
    const [exerciseFeedback, setExerciseFeedback] = (0, react_1.useState)([]);
    const locale = isTurkish ? 'tr-TR' : 'en-US';
    (0, react_1.useEffect)(() => {
        var _a;
        if ((_a = route.params) === null || _a === void 0 ? void 0 : _a.tab) {
            setActiveTab(route.params.tab);
        }
    }, [route.params]);
    const formatDate = (value) => {
        if (!value)
            return t('no_date');
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime()))
            return t('invalid_date');
        return parsed.toLocaleDateString(locale);
    };
    const completedWorkouts = workouts.filter(item => item.is_completed).length;
    const workoutCompletionRate = workouts.length > 0 ? Math.round((completedWorkouts / workouts.length) * 100) : 0;
    const activeNutritionPlans = nutrition.filter(item => item.is_active !== false).length;
    (0, react_1.useEffect)(() => {
        loadAssignments();
    }, []);
    const loadAssignments = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user)
                return;
            const [workoutRes, nutritionRes, suppRes] = yield Promise.all([
                supabase.getAssignedWorkouts(user.id),
                supabase.getAssignedNutritionPlans(user.id),
                supabase.getAssignedSupplements(user.id).catch(() => ({ data: [] }))
            ]);
            if (workoutRes.data) {
                setWorkouts(workoutRes.data);
                setupReminders(workoutRes.data, 'workout');
            }
            if (nutritionRes.data) {
                setNutrition(nutritionRes.data);
                setupReminders(nutritionRes.data, 'nutrition');
            }
            if (suppRes === null || suppRes === void 0 ? void 0 : suppRes.data) {
                setSupplements(suppRes.data);
                setupReminders(suppRes.data, 'supplement');
            }
        }
        catch (error) {
            console.error('Error loading assignments:', error);
        }
        finally {
            setLoading(false);
        }
    });
    const setupReminders = (data_1, ...args_1) => __awaiter(this, [data_1, ...args_1], void 0, function* (data, type = 'supplement') {
        const notifService = notificationService_1.NotificationService.getInstance();
        const hasPermission = yield notifService.requestPermissions();
        // Also try calendar sync
        const CalendarService = require('../services/calendarService').CalendarService;
        const calendarService = CalendarService.getInstance();
        const hasCalendarPermission = yield calendarService.requestPermissions();
        if (!hasPermission && !hasCalendarPermission)
            return;
        for (const item of data) {
            if (item.reminder_time) {
                // Handle both array (text[]) and string formats
                const times = Array.isArray(item.reminder_time) ? item.reminder_time : [item.reminder_time];
                for (const timeStr of times) {
                    if (typeof timeStr === 'string' && timeStr.includes(':')) {
                        const [h, m] = timeStr.split(':');
                        if (h && m) {
                            if (hasPermission) {
                                yield notifService.scheduleSmartReminder(type === 'supplement' ? 'supplement' : (type === 'workout' ? 'workout' : 'nutrition'), parseInt(h), parseInt(m), `${type}_reminder_${item.id}_${h}${m}`, 'Assignments', { screen: 'Assignments', params: { tab: type } }, language, { name: item.title || item.name || item.description });
                            }
                            if (hasCalendarPermission) {
                                // Create a calendar event for today at that time
                                const startDate = new Date();
                                startDate.setHours(parseInt(h), parseInt(m), 0, 0);
                                const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 mins later
                                yield calendarService.syncEventToCalendar(`NextSelf: ${item.title || item.name || 'Reminder'}`, startDate, endDate, item.notes || item.description || '');
                            }
                        }
                    }
                }
            }
            else if (item.scheduled_date && type === 'workout' && hasCalendarPermission) {
                // Sync workout to calendar if it has a date
                const startDate = new Date(item.scheduled_date);
                startDate.setHours(10, 0, 0, 0); // Default to 10 AM if no specific time
                const endDate = new Date(startDate.getTime() + 60 * 60000); // 1 hour
                yield calendarService.syncEventToCalendar(`NextSelf Workout: ${item.title}`, startDate, endDate, item.description || '');
            }
        }
    });
    const openWorkoutFeedback = (workout) => {
        const exercises = Array.isArray(workout === null || workout === void 0 ? void 0 : workout.exercises) && workout.exercises.length > 0
            ? workout.exercises
            : [{ name: isTurkish ? 'Genel Antrenman' : 'General Workout', sets: '', reps: '', weight: '' }];
        const normalized = exercises.map((exercise, index) => ({
            name: (exercise === null || exercise === void 0 ? void 0 : exercise.name) || (exercise === null || exercise === void 0 ? void 0 : exercise.exercise_name) || `${isTurkish ? 'Hareket' : 'Exercise'} ${index + 1}`,
            sets: (exercise === null || exercise === void 0 ? void 0 : exercise.sets) ? String(exercise.sets) : '',
            reps: (exercise === null || exercise === void 0 ? void 0 : exercise.reps) ? String(exercise.reps) : '',
            weight: (exercise === null || exercise === void 0 ? void 0 : exercise.weight) ? String(exercise.weight) : '',
            action: 'stable',
        }));
        setSelectedWorkout(workout);
        setExerciseFeedback(normalized);
        setWeeklyAction('stable');
        setFeedbackNotes('');
        setFeedbackVisible(true);
    };
    const updateExerciseField = (index, field, value) => {
        setExerciseFeedback((prev) => prev.map((row, rowIndex) => (rowIndex === index
            ? Object.assign(Object.assign({}, row), { [field]: value }) : row)));
    };
    const handleCompleteWorkout = (id, feedbackPayload) => __awaiter(this, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            yield supabase.completeWorkout(id, feedbackPayload ? JSON.stringify(feedbackPayload) : 'Completed from mobile app');
            // Refresh
            loadAssignments();
        }
        catch (e) {
            console.error('Error completing workout', e);
        }
    });
    const submitWorkoutFeedback = () => __awaiter(this, void 0, void 0, function* () {
        if (!(selectedWorkout === null || selectedWorkout === void 0 ? void 0 : selectedWorkout.id))
            return;
        const payload = {
            weeklyAction,
            notes: feedbackNotes.trim(),
            exerciseFeedback,
            submittedAt: new Date().toISOString(),
            weeklyAutoUpdate: true,
        };
        yield handleCompleteWorkout(selectedWorkout.id, payload);
        setFeedbackVisible(false);
        setSelectedWorkout(null);
    });
    return (<react_native_1.View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Profile')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color="#fff"/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{t('my_assignments')}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </expo_linear_gradient_1.LinearGradient>

            <react_native_1.View style={styles.tabContainer}>
                <react_native_1.TouchableOpacity style={[styles.tab, activeTab === 'workout' && styles.activeTab]} onPress={() => setActiveTab('workout')}>
                    <react_native_1.Text style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}>
                        {t('workout')}
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]} onPress={() => setActiveTab('nutrition')}>
                    <react_native_1.Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
                        {t('nutrition')}
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={[styles.tab, activeTab === 'supplement' && styles.activeTab]} onPress={() => setActiveTab('supplement')}>
                    <react_native_1.Text style={[styles.tabText, activeTab === 'supplement' && styles.activeTabText]}>
                        {t('supplements')}
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {loading ? (<react_native_1.View style={styles.center}>
                    <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                </react_native_1.View>) : (<react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <react_native_1.View style={styles.summaryRow}>
                        <react_native_1.View style={styles.summaryCard}>
                            <react_native_1.Text style={styles.summaryValue}>{workouts.length}</react_native_1.Text>
                            <react_native_1.Text style={styles.summaryLabel}>{t('total_workouts')}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.summaryCard}>
                            <react_native_1.Text style={styles.summaryValue}>{workoutCompletionRate}%</react_native_1.Text>
                            <react_native_1.Text style={styles.summaryLabel}>{t('completion_rate')}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.summaryCard}>
                            <react_native_1.Text style={styles.summaryValue}>{activeNutritionPlans}</react_native_1.Text>
                            <react_native_1.Text style={styles.summaryLabel}>{t('active_nutrition')}</react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>

                    {activeTab === 'workout' ? (workouts.length > 0 ? workouts.map(item => {
                var _a, _b;
                return (<GlassCard_1.default key={item.id} style={styles.card}>
                                <react_native_1.View style={styles.cardHeader}>
                                    <react_native_1.View>
                                        <react_native_1.Text style={styles.cardTitle}>{item.title}</react_native_1.Text>
                                        <react_native_1.Text style={styles.cardDate}>{formatDate(item.scheduled_date)}</react_native_1.Text>
                                    </react_native_1.View>
                                    {item.is_completed ? (<react_native_1.View style={styles.badgeSuccess}>
                                            <vector_icons_1.Ionicons name="checkmark-circle" size={14} color={colors.success}/>
                                            <react_native_1.Text style={styles.badgeTextSuccess}>{t('completed')}</react_native_1.Text>
                                        </react_native_1.View>) : (<react_native_1.View style={styles.badgePending}>
                                            <vector_icons_1.Ionicons name="time-outline" size={14} color={colors.warning}/>
                                            <react_native_1.Text style={styles.badgeTextPending}>{t('pending')}</react_native_1.Text>
                                        </react_native_1.View>)}
                                </react_native_1.View>
                                <react_native_1.Text style={styles.cardDesc}>{item.description || t('no_description')}</react_native_1.Text>
                                <react_native_1.View style={styles.proInfo}>
                                    <vector_icons_1.Ionicons name="person-circle-outline" size={18} color={colors.textTertiary}/>
                                    <react_native_1.Text style={styles.proText}>
                                        {(_a = item.pt) === null || _a === void 0 ? void 0 : _a.first_name} {(_b = item.pt) === null || _b === void 0 ? void 0 : _b.last_name}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                {!item.is_completed && (<react_native_1.TouchableOpacity style={styles.completeBtn} onPress={() => openWorkoutFeedback(item)}>
                                        <react_native_1.Text style={styles.completeBtnText}>{t('mark_complete')}</react_native_1.Text>
                                    </react_native_1.TouchableOpacity>)}
                            </GlassCard_1.default>);
            }) : (<react_native_1.Text style={styles.emptyText}>{t('no_workouts_assigned')}</react_native_1.Text>)) : activeTab === 'nutrition' ? (nutrition.length > 0 ? nutrition.map(item => {
                var _a, _b;
                return (<GlassCard_1.default key={item.id} style={styles.card}>
                                <react_native_1.Text style={styles.cardTitle}>{item.title}</react_native_1.Text>
                                <react_native_1.Text style={styles.cardDesc}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</react_native_1.Text>

                                <react_native_1.View style={styles.macrosContainer}>
                                    <react_native_1.View style={styles.macroBox}>
                                        <react_native_1.Text style={styles.macroValue}>{item.target_calories || 0}</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{t('calories')}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroBox}>
                                        <react_native_1.Text style={styles.macroValue}>{item.target_protein || 0}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{t('protein')}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroBox}>
                                        <react_native_1.Text style={styles.macroValue}>{item.target_carbs || 0}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{t('carbs')}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.macroBox}>
                                        <react_native_1.Text style={styles.macroValue}>{item.target_fats || 0}g</react_native_1.Text>
                                        <react_native_1.Text style={styles.macroLabel}>{t('fat')}</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>

                                {item.notes && <react_native_1.Text style={[styles.cardDesc, { marginTop: 8 }]}>{item.notes}</react_native_1.Text>}
                                <react_native_1.View style={[styles.proInfo, { marginTop: 12 }]}>
                                    <vector_icons_1.Ionicons name="person-circle-outline" size={18} color={colors.textTertiary}/>
                                    <react_native_1.Text style={styles.proText}>
                                        {(_a = item.dietitian) === null || _a === void 0 ? void 0 : _a.first_name} {(_b = item.dietitian) === null || _b === void 0 ? void 0 : _b.last_name}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </GlassCard_1.default>);
            }) : (<react_native_1.Text style={styles.emptyText}>{t('no_nutrition_assigned')}</react_native_1.Text>)) : (supplements.length > 0 ? supplements.map(item => {
                var _a, _b, _c, _d;
                return (<GlassCard_1.default key={item.id} style={styles.card}>
                                <react_native_1.View style={styles.cardHeader}>
                                    <react_native_1.View>
                                        <react_native_1.Text style={styles.cardTitle}>{item.title}</react_native_1.Text>
                                        <react_native_1.Text style={styles.cardDate}>{formatDate(item.created_at)}</react_native_1.Text>
                                    </react_native_1.View>
                                    {item.reminder_time && (<react_native_1.View style={styles.badgePending}>
                                            <vector_icons_1.Ionicons name="notifications-outline" size={14} color={colors.warning}/>
                                            <react_native_1.Text style={styles.badgeTextPending}>{item.reminder_time}</react_native_1.Text>
                                        </react_native_1.View>)}
                                </react_native_1.View>
                                <react_native_1.Text style={styles.cardDesc}>
                                    {t('dosage')}: {item.dosage || '-'}
                                </react_native_1.Text>
                                {item.notes && <react_native_1.Text style={[styles.cardDesc, { marginTop: 4 }]}>{item.notes}</react_native_1.Text>}
                                <react_native_1.View style={styles.proInfo}>
                                    <vector_icons_1.Ionicons name="person-circle-outline" size={18} color={colors.textTertiary}/>
                                    <react_native_1.Text style={styles.proText}>
                                        {((_a = item.dietitian) === null || _a === void 0 ? void 0 : _a.first_name) || ((_b = item.pt) === null || _b === void 0 ? void 0 : _b.first_name)} {((_c = item.dietitian) === null || _c === void 0 ? void 0 : _c.last_name) || ((_d = item.pt) === null || _d === void 0 ? void 0 : _d.last_name)}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </GlassCard_1.default>);
            }) : (<react_native_1.Text style={styles.emptyText}>{t('no_supplements_assigned')}</react_native_1.Text>))}
                </react_native_1.ScrollView>)}

            <react_native_1.Modal visible={feedbackVisible} transparent animationType="slide" onRequestClose={() => setFeedbackVisible(false)}>
                <react_native_1.View style={styles.feedbackOverlay}>
                    <react_native_1.View style={styles.feedbackSheet}>
                        <react_native_1.Text style={styles.feedbackTitle}>{isTurkish ? 'Antrenman Geri Bildirimi' : 'Workout Feedback'}</react_native_1.Text>
                        <react_native_1.Text style={styles.feedbackSubtitle}>
                            {isTurkish ? 'Programı haftalık güncellemek için kısa geri bildirim ver.' : 'Give quick feedback for weekly plan updates.'}
                        </react_native_1.Text>

                        <react_native_1.Text style={styles.feedbackSectionLabel}>{isTurkish ? 'Haftalık genel karar' : 'Weekly overall action'}</react_native_1.Text>
                        <react_native_1.View style={styles.feedbackActionRow}>
                            {[
            { key: 'increase', label: isTurkish ? 'Artır' : 'Increase' },
            { key: 'stable', label: isTurkish ? 'Sabit' : 'Stable' },
            { key: 'decrease', label: isTurkish ? 'Azalt' : 'Decrease' },
        ].map((opt) => (<react_native_1.TouchableOpacity key={opt.key} style={[styles.actionChip, weeklyAction === opt.key && styles.actionChipActive]} onPress={() => setWeeklyAction(opt.key)}>
                                    <react_native_1.Text style={[styles.actionChipText, weeklyAction === opt.key && styles.actionChipTextActive]}>{opt.label}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>))}
                        </react_native_1.View>

                        <react_native_1.ScrollView style={styles.feedbackExerciseList} showsVerticalScrollIndicator={false}>
                            {exerciseFeedback.map((exercise, index) => (<react_native_1.View key={`${exercise.name}_${index}`} style={styles.exerciseFeedbackCard}>
                                    <react_native_1.Text style={styles.exerciseFeedbackName}>{exercise.name}</react_native_1.Text>
                                    <react_native_1.View style={styles.exerciseFieldsRow}>
                                        <react_native_1.TextInput value={exercise.sets} onChangeText={(value) => updateExerciseField(index, 'sets', value)} placeholder={isTurkish ? 'Set' : 'Sets'} keyboardType="number-pad" style={styles.exerciseInput}/>
                                        <react_native_1.TextInput value={exercise.reps} onChangeText={(value) => updateExerciseField(index, 'reps', value)} placeholder={isTurkish ? 'Tekrar' : 'Reps'} keyboardType="number-pad" style={styles.exerciseInput}/>
                                        <react_native_1.TextInput value={exercise.weight} onChangeText={(value) => updateExerciseField(index, 'weight', value)} placeholder={isTurkish ? 'Ağırlık' : 'Weight'} keyboardType="decimal-pad" style={styles.exerciseInput}/>
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.feedbackActionRow}>
                                        {[
                { key: 'increase', label: isTurkish ? '↑ Artır' : '↑ Increase' },
                { key: 'stable', label: isTurkish ? '→ Sabit' : '→ Stable' },
                { key: 'decrease', label: isTurkish ? '↓ Azalt' : '↓ Decrease' },
            ].map((opt) => (<react_native_1.TouchableOpacity key={opt.key} style={[styles.actionChipSmall, exercise.action === opt.key && styles.actionChipSmallActive]} onPress={() => updateExerciseField(index, 'action', opt.key)}>
                                                <react_native_1.Text style={[styles.actionChipSmallText, exercise.action === opt.key && styles.actionChipSmallTextActive]}>{opt.label}</react_native_1.Text>
                                            </react_native_1.TouchableOpacity>))}
                                    </react_native_1.View>
                                </react_native_1.View>))}
                        </react_native_1.ScrollView>

                        <react_native_1.TextInput value={feedbackNotes} onChangeText={setFeedbackNotes} placeholder={isTurkish ? 'Notlar (opsiyonel)' : 'Notes (optional)'} multiline style={styles.feedbackNotesInput}/>

                        <react_native_1.View style={styles.feedbackFooter}>
                            <react_native_1.TouchableOpacity style={styles.feedbackCancelBtn} onPress={() => setFeedbackVisible(false)}>
                                <react_native_1.Text style={styles.feedbackCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={styles.feedbackSaveBtn} onPress={submitWorkoutFeedback}>
                                <react_native_1.Text style={styles.feedbackSaveText}>{isTurkish ? 'Bitir ve Kaydet' : 'Finish & Save'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.View>
            </react_native_1.Modal>
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme_1.SPACING.xl, paddingHorizontal: theme_1.SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: '#fff', flex: 1, textAlign: 'center' }),
    tabContainer: Object.assign({ flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: theme_1.SPACING.lg, marginTop: -20, borderRadius: theme_1.BORDER_RADIUS.lg }, theme_1.SHADOWS.sm),
    tab: { flex: 1, paddingVertical: theme_1.SPACING.md, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textTertiary }),
    activeTabText: { color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: theme_1.SPACING.lg, paddingBottom: 100 },
    summaryRow: { flexDirection: 'row', gap: theme_1.SPACING.sm, marginBottom: theme_1.SPACING.md },
    summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, paddingVertical: theme_1.SPACING.sm, paddingHorizontal: theme_1.SPACING.sm, alignItems: 'center' },
    summaryValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    summaryLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, textAlign: 'center', marginTop: 2 }),
    card: { marginBottom: theme_1.SPACING.md, padding: theme_1.SPACING.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme_1.SPACING.sm },
    cardTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    cardDate: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    cardDesc: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, marginBottom: theme_1.SPACING.md }),
    badgeSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeTextSuccess: { fontSize: 12, fontWeight: 'bold', color: colors.success },
    badgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeTextPending: { fontSize: 12, fontWeight: 'bold', color: colors.warning },
    proInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: theme_1.SPACING.sm },
    proText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    completeBtn: { marginTop: theme_1.SPACING.md, backgroundColor: colors.primarySoft, padding: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.md, alignItems: 'center' },
    completeBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.primary }),
    emptyText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textTertiary, textAlign: 'center', marginTop: theme_1.SPACING.xxxl }),
    macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme_1.SPACING.md, backgroundColor: colors.background, padding: theme_1.SPACING.sm, borderRadius: theme_1.BORDER_RADIUS.md },
    macroBox: { alignItems: 'center' },
    macroValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    macroLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary }),
    feedbackOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    feedbackSheet: { backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: theme_1.SPACING.lg, maxHeight: '88%' },
    feedbackTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    feedbackSubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 4, marginBottom: theme_1.SPACING.md }),
    feedbackSectionLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginBottom: 8 }),
    feedbackActionRow: { flexDirection: 'row', gap: 8, marginBottom: theme_1.SPACING.md, flexWrap: 'wrap' },
    actionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface },
    actionChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    actionChipText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, fontWeight: '700' }),
    actionChipTextActive: { color: colors.primary },
    feedbackExerciseList: { maxHeight: 280, marginBottom: theme_1.SPACING.md },
    exerciseFeedbackCard: { backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, padding: theme_1.SPACING.sm, marginBottom: theme_1.SPACING.sm, borderWidth: 1, borderColor: colors.borderLight },
    exerciseFeedbackName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginBottom: 8 }),
    exerciseFieldsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    exerciseInput: { flex: 1, backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, textAlign: 'center' },
    actionChipSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight },
    actionChipSmallActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    actionChipSmallText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, fontWeight: '700' }),
    actionChipSmallTextActive: { color: colors.primary },
    feedbackNotesInput: { minHeight: 72, maxHeight: 120, backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight, padding: theme_1.SPACING.sm, color: colors.text, textAlignVertical: 'top', marginBottom: theme_1.SPACING.md },
    feedbackFooter: { flexDirection: 'row', gap: theme_1.SPACING.sm },
    feedbackCancelBtn: { flex: 1, borderRadius: theme_1.BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.borderLight, paddingVertical: 12, alignItems: 'center' },
    feedbackCancelText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textSecondary }),
    feedbackSaveBtn: { flex: 1, borderRadius: theme_1.BORDER_RADIUS.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
    feedbackSaveText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff' }),
});
