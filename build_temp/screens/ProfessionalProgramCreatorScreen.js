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
const useTranslation_1 = require("../hooks/useTranslation");
const ThemeContext_1 = require("../contexts/ThemeContext");
const theme_1 = require("../config/theme");
const navigation_1 = require("../utils/navigation");
const CustomAlert_1 = require("../components/CustomAlert");
const ProfessionalProgramCreatorScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = (0, react_1.useMemo)(() => getStyles(colors), [colors]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [role, setRole] = (0, react_1.useState)('pt');
    const [professionalProfileId, setProfessionalProfileId] = (0, react_1.useState)('');
    const [clients, setClients] = (0, react_1.useState)([]);
    const [activeType, setActiveType] = (0, react_1.useState)('workout');
    const [selectedClientId, setSelectedClientId] = (0, react_1.useState)('');
    const [assignedPrograms, setAssignedPrograms] = (0, react_1.useState)([]);
    const [loadingPrograms, setLoadingPrograms] = (0, react_1.useState)(false);
    const [editingProgramId, setEditingProgramId] = (0, react_1.useState)(null);
    const [deletingProgramId, setDeletingProgramId] = (0, react_1.useState)(null);
    const [title, setTitle] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [notes, setNotes] = (0, react_1.useState)('');
    const [scheduledDate, setScheduledDate] = (0, react_1.useState)(new Date());
    const [showScheduledDatePicker, setShowScheduledDatePicker] = (0, react_1.useState)(false);
    const [startDate, setStartDate] = (0, react_1.useState)(new Date());
    const [endDate, setEndDate] = (0, react_1.useState)(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
    const [showStartDatePicker, setShowStartDatePicker] = (0, react_1.useState)(false);
    const [showEndDatePicker, setShowEndDatePicker] = (0, react_1.useState)(false);
    const [dailyCalories, setDailyCalories] = (0, react_1.useState)('');
    const [proteinGrams, setProteinGrams] = (0, react_1.useState)('');
    const [carbsGrams, setCarbsGrams] = (0, react_1.useState)('');
    const [fatGrams, setFatGrams] = (0, react_1.useState)('');
    const formatDate = (0, react_1.useCallback)((date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);
    const resetForm = (0, react_1.useCallback)(() => {
        setEditingProgramId(null);
        setTitle('');
        setDescription('');
        setNotes('');
        setDailyCalories('');
        setProteinGrams('');
        setCarbsGrams('');
        setFatGrams('');
        setScheduledDate(new Date());
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
    }, []);
    const loadData = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user)
                return;
            const { data: profProfile } = yield supabase.getClient()
                .from('professional_profiles')
                .select('id, professional_type')
                .eq('user_id', user.id)
                .single();
            if (!(profProfile === null || profProfile === void 0 ? void 0 : profProfile.id))
                return;
            const resolvedRole = profProfile.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(resolvedRole);
            setActiveType(resolvedRole === 'dietitian' ? 'nutrition' : 'workout');
            setProfessionalProfileId(profProfile.id);
            const { data: relationships } = yield supabase.getClient()
                .from('client_relationships')
                .select('client_id')
                .or(`professional_id.eq.${profProfile.id},trainer_id.eq.${profProfile.id},dietitian_id.eq.${profProfile.id}`)
                .eq('status', 'active');
            const clientIds = [...new Set((relationships || []).map((item) => item.client_id))];
            if (clientIds.length === 0) {
                setClients([]);
                return;
            }
            const { data: profiles } = yield supabase.getClient()
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', clientIds);
            const parsedClients = (profiles || []).map((item) => ({
                id: item.id,
                first_name: item.first_name || '',
                last_name: item.last_name || '',
            }));
            setClients(parsedClients);
            if (parsedClients.length > 0) {
                setSelectedClientId(parsedClients[0].id);
            }
        }
        catch (error) {
            console.error('Load professional program creator data error:', error);
        }
        finally {
            setLoading(false);
        }
    }), []);
    (0, react_1.useEffect)(() => {
        loadData();
    }, [loadData]);
    const loadAssignedPrograms = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedClientId || !professionalProfileId) {
            setAssignedPrograms([]);
            return;
        }
        try {
            setLoadingPrograms(true);
            const client = supabase_1.SupabaseService.getInstance().getClient();
            if (activeType === 'workout') {
                const { data, error } = yield client
                    .from('assigned_workouts')
                    .select('id, title, description, notes, scheduled_date, is_completed, created_at')
                    .eq('client_id', selectedClientId)
                    .eq('pt_id', professionalProfileId)
                    .order('created_at', { ascending: false });
                if (error)
                    throw error;
                setAssignedPrograms((data || []));
            }
            else {
                const { data, error } = yield client
                    .from('assigned_nutrition_plans')
                    .select('id, title, description, client_notes, start_date, end_date, daily_calories, protein_grams, carbs_grams, fat_grams, is_active, created_at')
                    .eq('client_id', selectedClientId)
                    .eq('dietitian_id', professionalProfileId)
                    .order('created_at', { ascending: false });
                if (error)
                    throw error;
                const parsed = (data || []).map((item) => (Object.assign(Object.assign({}, item), { notes: item.client_notes })));
                setAssignedPrograms(parsed);
            }
        }
        catch (error) {
            console.error('Load assigned programs error:', error);
            setAssignedPrograms([]);
        }
        finally {
            setLoadingPrograms(false);
        }
    }), [activeType, professionalProfileId, selectedClientId]);
    (0, react_1.useEffect)(() => {
        loadAssignedPrograms();
    }, [loadAssignedPrograms]);
    const createWorkoutProgram = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        const supabase = supabase_1.SupabaseService.getInstance();
        const { error } = yield supabase.getClient()
            .from('assigned_workouts')
            .insert({
            client_id: selectedClientId,
            pt_id: professionalProfileId,
            title: title.trim(),
            description: description.trim() || null,
            notes: notes.trim() || null,
            exercises: [],
            scheduled_date: formatDate(scheduledDate),
        });
        if (error)
            throw error;
    }), [description, formatDate, notes, professionalProfileId, scheduledDate, selectedClientId, title]);
    const createNutritionProgram = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        const supabase = supabase_1.SupabaseService.getInstance();
        const { error } = yield supabase.getClient()
            .from('assigned_nutrition_plans')
            .insert({
            client_id: selectedClientId,
            dietitian_id: professionalProfileId,
            title: title.trim(),
            description: description.trim() || null,
            daily_calories: Number(dailyCalories || 0),
            protein_grams: Number(proteinGrams || 0),
            carbs_grams: Number(carbsGrams || 0),
            fat_grams: Number(fatGrams || 0),
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            client_notes: notes.trim() || null,
            is_active: true,
        });
        if (error)
            throw error;
    }), [carbsGrams, dailyCalories, description, endDate, fatGrams, formatDate, notes, professionalProfileId, proteinGrams, selectedClientId, startDate, title]);
    const handleCreate = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedClientId || !title.trim()) {
            showAlert({
                type: 'warning',
                title: isTurkish ? 'Eksik Bilgi' : 'Missing Information',
                message: isTurkish ? 'Danışan ve başlık alanı zorunludur.' : 'Client and title are required.',
                buttons: [{ text: 'OK' }],
            });
            return;
        }
        try {
            setSaving(true);
            if (activeType === 'workout' && editingProgramId) {
                const supabase = supabase_1.SupabaseService.getInstance();
                const { error } = yield supabase.getClient()
                    .from('assigned_workouts')
                    .update({
                    title: title.trim(),
                    description: description.trim() || null,
                    notes: notes.trim() || null,
                    scheduled_date: formatDate(scheduledDate),
                })
                    .eq('id', editingProgramId);
                if (error)
                    throw error;
            }
            else if (activeType === 'nutrition' && editingProgramId) {
                const supabase = supabase_1.SupabaseService.getInstance();
                const { error } = yield supabase.getClient()
                    .from('assigned_nutrition_plans')
                    .update({
                    title: title.trim(),
                    description: description.trim() || null,
                    daily_calories: Number(dailyCalories || 0),
                    protein_grams: Number(proteinGrams || 0),
                    carbs_grams: Number(carbsGrams || 0),
                    fat_grams: Number(fatGrams || 0),
                    start_date: formatDate(startDate),
                    end_date: formatDate(endDate),
                    client_notes: notes.trim() || null,
                })
                    .eq('id', editingProgramId);
                if (error)
                    throw error;
            }
            else if (activeType === 'workout') {
                yield createWorkoutProgram();
            }
            else {
                yield createNutritionProgram();
            }
            showAlert({
                type: 'success',
                title: isTurkish ? 'Başarılı' : 'Success',
                message: editingProgramId
                    ? (isTurkish ? 'Program güncellendi.' : 'Program updated.')
                    : (isTurkish ? 'Program danışana atandı.' : 'Program assigned to client.'),
                buttons: [{ text: 'OK' }],
            });
            resetForm();
            yield loadAssignedPrograms();
        }
        catch (error) {
            console.error('Create professional program error:', error);
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program oluşturulamadı.' : 'Program could not be created.',
                buttons: [{ text: 'OK' }],
            });
        }
        finally {
            setSaving(false);
        }
    }), [activeType, carbsGrams, createNutritionProgram, createWorkoutProgram, dailyCalories, description, editingProgramId, endDate, fatGrams, formatDate, isTurkish, loadAssignedPrograms, notes, proteinGrams, resetForm, scheduledDate, selectedClientId, showAlert, startDate, title]);
    const handleEditProgram = (0, react_1.useCallback)((program) => {
        var _a, _b, _c, _d;
        setEditingProgramId(program.id);
        setTitle(program.title || '');
        setDescription(program.description || '');
        setNotes(program.notes || '');
        if (program.scheduled_date)
            setScheduledDate(new Date(program.scheduled_date));
        if (program.start_date)
            setStartDate(new Date(program.start_date));
        if (program.end_date)
            setEndDate(new Date(program.end_date));
        setDailyCalories(String((_a = program.daily_calories) !== null && _a !== void 0 ? _a : ''));
        setProteinGrams(String((_b = program.protein_grams) !== null && _b !== void 0 ? _b : ''));
        setCarbsGrams(String((_c = program.carbs_grams) !== null && _c !== void 0 ? _c : ''));
        setFatGrams(String((_d = program.fat_grams) !== null && _d !== void 0 ? _d : ''));
    }, []);
    const handleDeleteProgram = (0, react_1.useCallback)((program) => {
        showAlert({
            type: 'destructive',
            title: isTurkish ? 'Program Silinsin mi?' : 'Delete Program?',
            message: isTurkish
                ? `"${program.title}" programı silinecek. Bu işlem geri alınamaz.`
                : `"${program.title}" will be deleted. This action cannot be undone.`,
            buttons: [
                {
                    text: isTurkish ? 'İptal' : 'Cancel',
                    style: 'cancel',
                },
                {
                    text: isTurkish ? 'Sil' : 'Delete',
                    style: 'destructive',
                    onPress: () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            setDeletingProgramId(program.id);
                            const supabase = supabase_1.SupabaseService.getInstance();
                            if (activeType === 'workout') {
                                const { error } = yield supabase.getClient()
                                    .from('assigned_workouts')
                                    .delete()
                                    .eq('id', program.id);
                                if (error)
                                    throw error;
                            }
                            else {
                                const { error } = yield supabase.getClient()
                                    .from('assigned_nutrition_plans')
                                    .delete()
                                    .eq('id', program.id);
                                if (error)
                                    throw error;
                            }
                            if (editingProgramId === program.id) {
                                resetForm();
                            }
                            yield loadAssignedPrograms();
                            showAlert({
                                type: 'success',
                                title: isTurkish ? 'Silindi' : 'Deleted',
                                message: isTurkish ? 'Program başarıyla silindi.' : 'Program deleted successfully.',
                                buttons: [{ text: 'OK' }],
                            });
                        }
                        catch (error) {
                            console.error('Delete program error:', error);
                            showAlert({
                                type: 'error',
                                title: isTurkish ? 'Hata' : 'Error',
                                message: isTurkish ? 'Program silinemedi.' : 'Program could not be deleted.',
                                buttons: [{ text: 'OK' }],
                            });
                        }
                        finally {
                            setDeletingProgramId(null);
                        }
                    }),
                },
            ],
        });
    }, [activeType, editingProgramId, isTurkish, loadAssignedPrograms, resetForm, showAlert]);
    if (loading) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <react_native_1.ActivityIndicator size="large" color={theme_1.COLORS.primary}/>
            </react_native_1.View>);
    }
    return (<react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
            <AlertComponent />
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.View style={{ flex: 1 }}>
                    <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Program Hazırla' : 'Prepare Program'}</react_native_1.Text>
                    <react_native_1.Text style={styles.headerSub}>{isTurkish ? 'Danışanına yeni plan ata' : 'Assign a new plan to your client'}</react_native_1.Text>
                </react_native_1.View>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {clients.length === 0 ? (<react_native_1.View style={styles.emptyCard}>
                        <vector_icons_1.Ionicons name="people-outline" size={42} color={colors.textTertiary}/>
                        <react_native_1.Text style={styles.emptyText}>
                            {isTurkish ? 'Program atayabilmek için aktif danışan gerekli.' : 'You need an active client to assign a program.'}
                        </react_native_1.Text>
                    </react_native_1.View>) : (<>
                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Danışan' : 'Client'}</react_native_1.Text>
                        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientRow}>
                            {clients.map((client) => {
                const active = selectedClientId === client.id;
                return (<react_native_1.TouchableOpacity key={client.id} style={[styles.clientChip, active && styles.clientChipActive]} onPress={() => setSelectedClientId(client.id)} activeOpacity={0.75}>
                                        <react_native_1.Text style={[styles.clientChipText, active && styles.clientChipTextActive]}>
                                            {client.first_name} {client.last_name}
                                        </react_native_1.Text>
                                    </react_native_1.TouchableOpacity>);
            })}
                        </react_native_1.ScrollView>

                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Program türü' : 'Program type'}</react_native_1.Text>
                        <react_native_1.View style={styles.typeRow}>
                            <react_native_1.TouchableOpacity style={[styles.typeBtn, activeType === 'workout' && styles.typeBtnActive, role === 'dietitian' && styles.typeBtnDisabled]} onPress={() => role !== 'dietitian' && setActiveType('workout')} activeOpacity={0.75} disabled={role === 'dietitian'}>
                                <react_native_1.Text style={[styles.typeBtnText, activeType === 'workout' && styles.typeBtnTextActive]}>
                                    {isTurkish ? 'Antrenman' : 'Workout'}
                                </react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.typeBtn, activeType === 'nutrition' && styles.typeBtnActive, role === 'pt' && styles.typeBtnDisabled]} onPress={() => role !== 'pt' && setActiveType('nutrition')} activeOpacity={0.75} disabled={role === 'pt'}>
                                <react_native_1.Text style={[styles.typeBtnText, activeType === 'nutrition' && styles.typeBtnTextActive]}>
                                    {isTurkish ? 'Beslenme' : 'Nutrition'}
                                </react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>

                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Başlık' : 'Title'}</react_native_1.Text>
                        <react_native_1.TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={isTurkish ? 'Program başlığı' : 'Program title'} placeholderTextColor={colors.textTertiary}/>

                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Açıklama' : 'Description'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, styles.multilineInput]} multiline value={description} onChangeText={setDescription} placeholder={isTurkish ? 'Program açıklaması' : 'Program description'} placeholderTextColor={colors.textTertiary}/>

                        {activeType === 'workout' ? (<>
                                <react_native_1.Text style={styles.label}>{isTurkish ? 'Plan tarihi' : 'Planned date'}</react_native_1.Text>
                                <react_native_1.TouchableOpacity style={styles.dateBtn} onPress={() => setShowScheduledDatePicker(true)} activeOpacity={0.8}>
                                    <vector_icons_1.Ionicons name="calendar-outline" size={18} color={theme_1.COLORS.primary}/>
                                    <react_native_1.Text style={styles.dateBtnText}>{formatDate(scheduledDate)}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>
                                {showScheduledDatePicker && (<datetimepicker_1.default value={scheduledDate} mode="date" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                        if (react_native_1.Platform.OS === 'android')
                            setShowScheduledDatePicker(false);
                        if (date)
                            setScheduledDate(date);
                    }}/>)}
                            </>) : (<>
                                <react_native_1.View style={styles.row}>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Başlangıç' : 'Start date'}</react_native_1.Text>
                                        <react_native_1.TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)} activeOpacity={0.8}>
                                            <vector_icons_1.Ionicons name="calendar-outline" size={18} color={theme_1.COLORS.primary}/>
                                            <react_native_1.Text style={styles.dateBtnText}>{formatDate(startDate)}</react_native_1.Text>
                                        </react_native_1.TouchableOpacity>
                                    </react_native_1.View>
                                    <react_native_1.View style={{ width: theme_1.SPACING.sm }}/>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Bitiş' : 'End date'}</react_native_1.Text>
                                        <react_native_1.TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)} activeOpacity={0.8}>
                                            <vector_icons_1.Ionicons name="calendar-outline" size={18} color={theme_1.COLORS.primary}/>
                                            <react_native_1.Text style={styles.dateBtnText}>{formatDate(endDate)}</react_native_1.Text>
                                        </react_native_1.TouchableOpacity>
                                    </react_native_1.View>
                                </react_native_1.View>
                                {showStartDatePicker && (<datetimepicker_1.default value={startDate} mode="date" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                        if (react_native_1.Platform.OS === 'android')
                            setShowStartDatePicker(false);
                        if (date)
                            setStartDate(date);
                    }}/>)}
                                {showEndDatePicker && (<datetimepicker_1.default value={endDate} mode="date" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                        if (react_native_1.Platform.OS === 'android')
                            setShowEndDatePicker(false);
                        if (date)
                            setEndDate(date);
                    }}/>)}

                                <react_native_1.View style={styles.row}>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Kalori' : 'Calories'}</react_native_1.Text>
                                        <react_native_1.TextInput style={styles.input} value={dailyCalories} onChangeText={setDailyCalories} keyboardType="numeric" placeholder="2200" placeholderTextColor={colors.textTertiary}/>
                                    </react_native_1.View>
                                    <react_native_1.View style={{ width: theme_1.SPACING.sm }}/>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Protein (g)' : 'Protein (g)'}</react_native_1.Text>
                                        <react_native_1.TextInput style={styles.input} value={proteinGrams} onChangeText={setProteinGrams} keyboardType="numeric" placeholder="140" placeholderTextColor={colors.textTertiary}/>
                                    </react_native_1.View>
                                </react_native_1.View>

                                <react_native_1.View style={styles.row}>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Karb (g)' : 'Carbs (g)'}</react_native_1.Text>
                                        <react_native_1.TextInput style={styles.input} value={carbsGrams} onChangeText={setCarbsGrams} keyboardType="numeric" placeholder="220" placeholderTextColor={colors.textTertiary}/>
                                    </react_native_1.View>
                                    <react_native_1.View style={{ width: theme_1.SPACING.sm }}/>
                                    <react_native_1.View style={{ flex: 1 }}>
                                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Yağ (g)' : 'Fat (g)'}</react_native_1.Text>
                                        <react_native_1.TextInput style={styles.input} value={fatGrams} onChangeText={setFatGrams} keyboardType="numeric" placeholder="70" placeholderTextColor={colors.textTertiary}/>
                                    </react_native_1.View>
                                </react_native_1.View>
                            </>)}

                        <react_native_1.Text style={styles.label}>{isTurkish ? 'Notlar' : 'Notes'}</react_native_1.Text>
                        <react_native_1.TextInput style={[styles.input, styles.multilineInput]} multiline value={notes} onChangeText={setNotes} placeholder={isTurkish ? 'Danışan notu' : 'Client note'} placeholderTextColor={colors.textTertiary}/>

                        <react_native_1.TouchableOpacity style={[styles.createBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving} activeOpacity={0.85}>
                            <react_native_1.Text style={styles.createBtnText}>
                                {saving
                ? (isTurkish ? 'Oluşturuluyor...' : 'Creating...')
                : editingProgramId
                    ? (isTurkish ? 'Programı Güncelle' : 'Update Program')
                    : (isTurkish ? 'Programı Ata' : 'Assign Program')}
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        {editingProgramId && (<react_native_1.TouchableOpacity style={styles.cancelEditBtn} onPress={resetForm} activeOpacity={0.85}>
                                <react_native_1.Text style={styles.cancelEditBtnText}>{isTurkish ? 'Düzenlemeyi İptal Et' : 'Cancel Editing'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>)}

                        <react_native_1.View style={styles.listHeader}>
                            <react_native_1.Text style={styles.listTitle}>{isTurkish ? 'Atanan Programlar' : 'Assigned Programs'}</react_native_1.Text>
                            <react_native_1.Text style={styles.listCount}>{assignedPrograms.length}</react_native_1.Text>
                        </react_native_1.View>

                        {loadingPrograms ? (<react_native_1.View style={styles.loadingPrograms}>
                                <react_native_1.ActivityIndicator size="small" color={theme_1.COLORS.primary}/>
                            </react_native_1.View>) : assignedPrograms.length === 0 ? (<react_native_1.View style={styles.emptyList}>
                                <react_native_1.Text style={styles.emptyListText}>
                                    {isTurkish ? 'Henüz atanmış program yok.' : 'No assigned programs yet.'}
                                </react_native_1.Text>
                            </react_native_1.View>) : (assignedPrograms.map((program) => (<react_native_1.View key={program.id} style={styles.programCard}>
                                    <react_native_1.View style={styles.programHead}>
                                        <react_native_1.Text style={styles.programTitle}>{program.title}</react_native_1.Text>
                                        <react_native_1.View style={styles.programActions}>
                                            <react_native_1.TouchableOpacity style={styles.editBtn} onPress={() => handleEditProgram(program)} activeOpacity={0.8}>
                                                <vector_icons_1.Ionicons name="create-outline" size={14} color={theme_1.COLORS.primary}/>
                                                <react_native_1.Text style={styles.editBtnText}>{isTurkish ? 'Düzenle' : 'Edit'}</react_native_1.Text>
                                            </react_native_1.TouchableOpacity>
                                            <react_native_1.TouchableOpacity style={[styles.deleteBtn, deletingProgramId === program.id && { opacity: 0.6 }]} onPress={() => handleDeleteProgram(program)} disabled={deletingProgramId === program.id} activeOpacity={0.8}>
                                                <vector_icons_1.Ionicons name="trash-outline" size={14} color="#EF4444"/>
                                                <react_native_1.Text style={styles.deleteBtnText}>{isTurkish ? 'Sil' : 'Delete'}</react_native_1.Text>
                                            </react_native_1.TouchableOpacity>
                                        </react_native_1.View>
                                    </react_native_1.View>
                                    {activeType === 'workout' ? (<react_native_1.Text style={styles.programMeta}>
                                            {(isTurkish ? 'Tarih' : 'Date')}: {program.scheduled_date || '-'} · {program.is_completed ? (isTurkish ? 'Tamamlandı' : 'Completed') : (isTurkish ? 'Bekliyor' : 'Pending')}
                                        </react_native_1.Text>) : (<react_native_1.Text style={styles.programMeta}>
                                            {(isTurkish ? 'Aralık' : 'Range')}: {program.start_date || '-'} → {program.end_date || '-'}
                                        </react_native_1.Text>)}
                                    {!!program.description && <react_native_1.Text style={styles.programDesc}>{program.description}</react_native_1.Text>}
                                </react_native_1.View>)))}
                    </>)}
                <react_native_1.View style={{ height: 80 }}/>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.md,
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text }),
    headerSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    content: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.md,
    },
    emptyCard: Object.assign({ alignItems: 'center', padding: theme_1.SPACING.xl, borderRadius: theme_1.BORDER_RADIUS.lg, backgroundColor: colors.surface }, theme_1.SHADOWS.card),
    emptyText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center', marginTop: theme_1.SPACING.md }),
    label: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary, marginBottom: 8, marginTop: theme_1.SPACING.sm }),
    clientRow: {
        gap: 8,
        marginBottom: 2,
    },
    clientChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    clientChipActive: {
        borderColor: theme_1.COLORS.primary,
        backgroundColor: theme_1.COLORS.primarySoft,
    },
    clientChipText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.text, fontWeight: '600' }),
    clientChipTextActive: {
        color: theme_1.COLORS.primary,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    typeBtn: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeBtnActive: {
        borderColor: theme_1.COLORS.primary,
        backgroundColor: theme_1.COLORS.primarySoft,
    },
    typeBtnDisabled: {
        opacity: 0.45,
    },
    typeBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.textSecondary }),
    typeBtnTextActive: {
        color: theme_1.COLORS.primary,
    },
    input: Object.assign(Object.assign({ height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12 }, theme_1.TYPOGRAPHY.body), { color: colors.text }),
    multilineInput: {
        minHeight: 90,
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    dateBtn: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
    },
    dateBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    createBtn: Object.assign({ marginTop: theme_1.SPACING.lg, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme_1.COLORS.primary }, theme_1.SHADOWS.card),
    createBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: '#FFF', fontWeight: '700' }),
    cancelEditBtn: {
        marginTop: theme_1.SPACING.sm,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    cancelEditBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    listHeader: {
        marginTop: theme_1.SPACING.xl,
        marginBottom: theme_1.SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    listCount: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: theme_1.COLORS.primary }),
    loadingPrograms: {
        paddingVertical: theme_1.SPACING.lg,
        alignItems: 'center',
    },
    emptyList: {
        paddingVertical: theme_1.SPACING.lg,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    emptyListText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    programCard: Object.assign({ borderRadius: theme_1.BORDER_RADIUS.lg, backgroundColor: colors.surface, padding: theme_1.SPACING.md, marginBottom: theme_1.SPACING.sm }, theme_1.SHADOWS.sm),
    programHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme_1.SPACING.sm,
    },
    programActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    programTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, flex: 1 }),
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: theme_1.COLORS.primary + '45',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: theme_1.COLORS.primarySoft,
    },
    editBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: theme_1.COLORS.primary }),
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#EF444445',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: '#FEF2F2',
    },
    deleteBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#EF4444' }),
    programMeta: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 6 }),
    programDesc: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: 4 }),
});
exports.default = ProfessionalProgramCreatorScreen;
