import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { safeGoBack } from '../utils/navigation';
import { useAlert } from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import { AIService } from '../services/aiService';

interface ClientItem {
    id: string;
    first_name: string;
    last_name: string;
}

interface AssignedProgramItem {
    id: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    scheduled_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    daily_calories?: number | null;
    protein_grams?: number | null;
    carbs_grams?: number | null;
    fat_grams?: number | null;
    is_completed?: boolean;
    is_active?: boolean;
    created_at?: string | null;
}

const ProfessionalProgramCreatorScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);
    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [professionalProfileId, setProfessionalProfileId] = useState('');
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [activeType, setActiveType] = useState<'workout' | 'nutrition'>('workout');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [assignedPrograms, setAssignedPrograms] = useState<AssignedProgramItem[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
    const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');

    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [dailyCalories, setDailyCalories] = useState('');
    const [proteinGrams, setProteinGrams] = useState('');
    const [carbsGrams, setCarbsGrams] = useState('');
    const [fatGrams, setFatGrams] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [clientPhotoUri, setClientPhotoUri] = useState<string | null>(null);
    const [clientPhotoBase64, setClientPhotoBase64] = useState<string | null>(null);

    const formatDate = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const resetForm = useCallback(() => {
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
        setClientPhotoUri(null);
        setClientPhotoBase64(null);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const supabase = SupabaseService.getInstance();
            const { user } = await supabase.getCurrentUser();
            if (!user) return;

            const { data: profProfile } = await supabase.getClient()
                .from('professional_profiles')
                .select('id, professional_type')
                .eq('user_id', user.id)
                .single();

            if (!profProfile?.id) return;

            const resolvedRole = profProfile.professional_type === 'dietitian' ? 'dietitian' : 'pt';
            setRole(resolvedRole);
            setActiveType(resolvedRole === 'dietitian' ? 'nutrition' : 'workout');
            setProfessionalProfileId(profProfile.id);

            const { data: relationships } = await supabase.getClient()
                .from('client_relationships')
                .select('client_id')
                .or(`professional_id.eq.${profProfile.id},trainer_id.eq.${profProfile.id},dietitian_id.eq.${profProfile.id}`)
                .eq('status', 'active');

            const clientIds = [...new Set((relationships || []).map((item: any) => item.client_id))];
            if (clientIds.length === 0) {
                setClients([]);
                return;
            }

            const { data: profiles } = await supabase.getClient()
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', clientIds);

            const parsedClients = (profiles || []).map((item: any) => ({
                id: item.id,
                first_name: item.first_name || '',
                last_name: item.last_name || '',
            }));

            setClients(parsedClients);
            if (parsedClients.length > 0) {
                setSelectedClientId(parsedClients[0].id);
            }
        } catch (error) {
            console.error('Load professional program creator data error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadAssignedPrograms = useCallback(async () => {
        if (!selectedClientId || !professionalProfileId) {
            setAssignedPrograms([]);
            return;
        }
        try {
            setLoadingPrograms(true);
            const client = SupabaseService.getInstance().getClient();
            if (activeType === 'workout') {
                const { data, error } = await client
                    .from('assigned_workouts')
                    .select('id, title, description, notes, scheduled_date, is_completed, created_at')
                    .eq('client_id', selectedClientId)
                    .eq('pt_id', professionalProfileId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setAssignedPrograms((data || []) as AssignedProgramItem[]);
            } else {
                const { data, error } = await client
                    .from('assigned_nutrition_plans')
                    .select('id, title, description, client_notes, start_date, end_date, daily_calories, protein_grams, carbs_grams, fat_grams, is_active, created_at')
                    .eq('client_id', selectedClientId)
                    .eq('dietitian_id', professionalProfileId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                const parsed = (data || []).map((item: any) => ({
                    ...item,
                    notes: item.client_notes,
                }));
                setAssignedPrograms(parsed as AssignedProgramItem[]);
            }
        } catch (error) {
            console.error('Load assigned programs error:', error);
            setAssignedPrograms([]);
        } finally {
            setLoadingPrograms(false);
        }
    }, [activeType, professionalProfileId, selectedClientId]);

    useEffect(() => {
        loadAssignedPrograms();
    }, [loadAssignedPrograms]);

    const handlePickPhoto = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setClientPhotoUri(result.assets[0].uri);
                setClientPhotoBase64(result.assets[0].base64 || null);
            }
        } catch (error) {
            console.error('Image picking error:', error);
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Fotoğraf yüklenemedi.' : 'Could not upload photo.', buttons: [{ text: 'OK' }] });
        }
    };

    const handleGenerateWithAI = async () => {
        if (!selectedClientId) {
            showAlert({ type: 'warning', title: isTurkish ? 'Danışan Seçin' : 'Select Client', message: isTurkish ? 'Lütfen önce bir danışan seçin.' : 'Please select a client first.', buttons: [{ text: 'OK' }] });
            return;
        }

        try {
            setIsGenerating(true);
            const supabase = SupabaseService.getInstance().getClient();
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', selectedClientId)
                .single();

            if (!profileData) throw new Error('Client profile not found');

            const aiService = AIService.getInstance();
            const result = await aiService.generateProfessionalProgram(
                activeType,
                profileData,
                isTurkish ? 'tr' : 'en',
                clientPhotoBase64 || undefined
            );

            if (result) {
                if (result.title) setTitle(result.title);
                if (result.description) setDescription(result.description);
                if (result.notes) setNotes(result.notes);
                if (activeType === 'nutrition') {
                    if (result.dailyCalories) setDailyCalories(String(result.dailyCalories));
                    if (result.proteinGrams) setProteinGrams(String(result.proteinGrams));
                    if (result.carbsGrams) setCarbsGrams(String(result.carbsGrams));
                    if (result.fatGrams) setFatGrams(String(result.fatGrams));
                }
                showAlert({ type: 'success', title: isTurkish ? 'Yapay Zeka Tamamlandı' : 'AI Completed', message: isTurkish ? 'Program AI tarafından başarıyla dolduruldu.' : 'Program successfully populated by AI.', buttons: [{text:'OK'}]});
            } else {
                 throw new Error('AI returned no valid result');
            }
        } catch (error) {
            console.error('AI Gen Error:', error);
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Yapay zeka program oluşturamadı.' : 'AI failed to generate program.', buttons: [{ text: 'OK' }] });
        } finally {
            setIsGenerating(false);
        }
    };

    const createWorkoutProgram = useCallback(async () => {
        const supabase = SupabaseService.getInstance();
        const { error } = await supabase.getClient()
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
        if (error) throw error;
    }, [description, formatDate, notes, professionalProfileId, scheduledDate, selectedClientId, title]);

    const createNutritionProgram = useCallback(async () => {
        const supabase = SupabaseService.getInstance();
        const { error } = await supabase.getClient()
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
        if (error) throw error;
    }, [carbsGrams, dailyCalories, description, endDate, fatGrams, formatDate, notes, professionalProfileId, proteinGrams, selectedClientId, startDate, title]);

    const handleCreate = useCallback(async () => {
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
                const supabase = SupabaseService.getInstance();
                const { error } = await supabase.getClient()
                    .from('assigned_workouts')
                    .update({
                        title: title.trim(),
                        description: description.trim() || null,
                        notes: notes.trim() || null,
                        scheduled_date: formatDate(scheduledDate),
                    })
                    .eq('id', editingProgramId);
                if (error) throw error;
            } else if (activeType === 'nutrition' && editingProgramId) {
                const supabase = SupabaseService.getInstance();
                const { error } = await supabase.getClient()
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
                if (error) throw error;
            } else if (activeType === 'workout') {
                await createWorkoutProgram();
            } else {
                await createNutritionProgram();
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
            await loadAssignedPrograms();
        } catch (error) {
            console.error('Create professional program error:', error);
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program oluşturulamadı.' : 'Program could not be created.',
                buttons: [{ text: 'OK' }],
            });
        } finally {
            setSaving(false);
        }
    }, [activeType, carbsGrams, createNutritionProgram, createWorkoutProgram, dailyCalories, description, editingProgramId, endDate, fatGrams, formatDate, isTurkish, loadAssignedPrograms, notes, proteinGrams, resetForm, scheduledDate, selectedClientId, showAlert, startDate, title]);

    const handleEditProgram = useCallback((program: AssignedProgramItem) => {
        setEditingProgramId(program.id);
        setTitle(program.title || '');
        setDescription(program.description || '');
        setNotes(program.notes || '');
        if (program.scheduled_date) setScheduledDate(new Date(program.scheduled_date));
        if (program.start_date) setStartDate(new Date(program.start_date));
        if (program.end_date) setEndDate(new Date(program.end_date));
        setDailyCalories(String(program.daily_calories ?? ''));
        setProteinGrams(String(program.protein_grams ?? ''));
        setCarbsGrams(String(program.carbs_grams ?? ''));
        setFatGrams(String(program.fat_grams ?? ''));
    }, []);

    const handleDeleteProgram = useCallback((program: AssignedProgramItem) => {
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
                    onPress: async () => {
                        try {
                            setDeletingProgramId(program.id);
                            const supabase = SupabaseService.getInstance();
                            if (activeType === 'workout') {
                                const { error } = await supabase.getClient()
                                    .from('assigned_workouts')
                                    .delete()
                                    .eq('id', program.id);
                                if (error) throw error;
                            } else {
                                const { error } = await supabase.getClient()
                                    .from('assigned_nutrition_plans')
                                    .delete()
                                    .eq('id', program.id);
                                if (error) throw error;
                            }

                            if (editingProgramId === program.id) {
                                resetForm();
                            }

                            await loadAssignedPrograms();
                            showAlert({
                                type: 'success',
                                title: isTurkish ? 'Silindi' : 'Deleted',
                                message: isTurkish ? 'Program başarıyla silindi.' : 'Program deleted successfully.',
                                buttons: [{ text: 'OK' }],
                            });
                        } catch (error) {
                            console.error('Delete program error:', error);
                            showAlert({
                                type: 'error',
                                title: isTurkish ? 'Hata' : 'Error',
                                message: isTurkish ? 'Program silinemedi.' : 'Program could not be deleted.',
                                buttons: [{ text: 'OK' }],
                            });
                        } finally {
                            setDeletingProgramId(null);
                        }
                    },
                },
            ],
        });
    }, [activeType, editingProgramId, isTurkish, loadAssignedPrograms, resetForm, showAlert]);

    if (loading) {
        return (
            <View style={[COMMON_STYLES.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={COMMON_STYLES.screenContainer}>
            <AlertComponent />
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{isTurkish ? 'Program Hazırla' : 'Prepare Program'}</Text>
                    <Text style={styles.headerSub}>{isTurkish ? 'Danışanına yeni plan ata' : 'Assign a new plan to your client'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {clients.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={42} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>
                            {isTurkish ? 'Program atayabilmek için aktif danışan gerekli.' : 'You need an active client to assign a program.'}
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.label}>{isTurkish ? 'Danışan' : 'Client'}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientRow}>
                            {clients.map((client) => {
                                const active = selectedClientId === client.id;
                                return (
                                    <TouchableOpacity
                                        key={client.id}
                                        style={[styles.clientChip, active && styles.clientChipActive]}
                                        onPress={() => setSelectedClientId(client.id)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.clientChipText, active && styles.clientChipTextActive]}>
                                            {client.first_name} {client.last_name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={styles.label}>{isTurkish ? 'Program türü' : 'Program type'}</Text>
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[styles.typeBtn, activeType === 'workout' && styles.typeBtnActive, role === 'dietitian' && styles.typeBtnDisabled]}
                                onPress={() => role !== 'dietitian' && setActiveType('workout')}
                                activeOpacity={0.75}
                                disabled={role === 'dietitian'}
                            >
                                <Text style={[styles.typeBtnText, activeType === 'workout' && styles.typeBtnTextActive]}>
                                    {isTurkish ? 'Antrenman' : 'Workout'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, activeType === 'nutrition' && styles.typeBtnActive, role === 'pt' && styles.typeBtnDisabled]}
                                onPress={() => role !== 'pt' && setActiveType('nutrition')}
                                activeOpacity={0.75}
                                disabled={role === 'pt'}
                            >
                                <Text style={[styles.typeBtnText, activeType === 'nutrition' && styles.typeBtnTextActive]}>
                                    {isTurkish ? 'Beslenme' : 'Nutrition'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.aiActionContainer}>
                             <TouchableOpacity style={styles.aiBtnPrimary} onPress={handleGenerateWithAI} disabled={isGenerating}>
                                 {isGenerating ? <ActivityIndicator color="#FFF" size="small" /> : (
                                     <>
                                         <Ionicons name="sparkles" size={18} color="#FFF" />
                                         <Text style={styles.aiBtnPrimaryText}>{isTurkish ? 'Yapay Zeka ile Otomatik Oluştur' : 'Auto Generate with AI'}</Text>
                                     </>
                                 )}
                             </TouchableOpacity>
                             <TouchableOpacity style={styles.aiBtnSecondary} onPress={handlePickPhoto}>
                                 <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                                 <Text style={styles.aiBtnSecondaryText}>
                                     {clientPhotoUri ? (isTurkish ? 'Fotoğraf Seçildi (Değiştir)' : 'Photo Selected (Change)') : (isTurkish ? 'Danışan Fotoğrafı Ekle (İsteğe Bağlı)' : 'Add Client Photo (Optional)')}
                                 </Text>
                             </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>{isTurkish ? 'Başlık' : 'Title'}</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder={isTurkish ? 'Program başlığı' : 'Program title'}
                            placeholderTextColor={colors.textTertiary}
                        />

                        <Text style={styles.label}>{isTurkish ? 'Açıklama' : 'Description'}</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                            placeholder={isTurkish ? 'Program açıklaması' : 'Program description'}
                            placeholderTextColor={colors.textTertiary}
                        />

                        {activeType === 'workout' ? (
                            <>
                                <Text style={styles.label}>{isTurkish ? 'Plan tarihi' : 'Planned date'}</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowScheduledDatePicker(true)} activeOpacity={0.8}>
                                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                    <Text style={styles.dateBtnText}>{formatDate(scheduledDate)}</Text>
                                </TouchableOpacity>
                                {showScheduledDatePicker && (
                                    <DateTimePicker
                                        value={scheduledDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, date) => {
                                            if (Platform.OS === 'android') setShowScheduledDatePicker(false);
                                            if (date) setScheduledDate(date);
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Başlangıç' : 'Start date'}</Text>
                                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)} activeOpacity={0.8}>
                                            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ width: SPACING.sm }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Bitiş' : 'End date'}</Text>
                                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)} activeOpacity={0.8}>
                                            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, date) => {
                                            if (Platform.OS === 'android') setShowStartDatePicker(false);
                                            if (date) setStartDate(date);
                                        }}
                                    />
                                )}
                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, date) => {
                                            if (Platform.OS === 'android') setShowEndDatePicker(false);
                                            if (date) setEndDate(date);
                                        }}
                                    />
                                )}

                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Kalori' : 'Calories'}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={dailyCalories}
                                            onChangeText={setDailyCalories}
                                            keyboardType="numeric"
                                            placeholder="2200"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    </View>
                                    <View style={{ width: SPACING.sm }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Protein (g)' : 'Protein (g)'}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={proteinGrams}
                                            onChangeText={setProteinGrams}
                                            keyboardType="numeric"
                                            placeholder="140"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Karb (g)' : 'Carbs (g)'}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={carbsGrams}
                                            onChangeText={setCarbsGrams}
                                            keyboardType="numeric"
                                            placeholder="220"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    </View>
                                    <View style={{ width: SPACING.sm }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{isTurkish ? 'Yağ (g)' : 'Fat (g)'}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={fatGrams}
                                            onChangeText={setFatGrams}
                                            keyboardType="numeric"
                                            placeholder="70"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        <Text style={styles.label}>{isTurkish ? 'Notlar' : 'Notes'}</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                            placeholder={isTurkish ? 'Danışan notu' : 'Client note'}
                            placeholderTextColor={colors.textTertiary}
                        />

                        <TouchableOpacity
                            style={[styles.createBtn, saving && { opacity: 0.6 }]}
                            onPress={handleCreate}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.createBtnText}>
                                {saving
                                    ? (isTurkish ? 'Oluşturuluyor...' : 'Creating...')
                                    : editingProgramId
                                        ? (isTurkish ? 'Programı Güncelle' : 'Update Program')
                                        : (isTurkish ? 'Programı Ata' : 'Assign Program')}
                            </Text>
                        </TouchableOpacity>

                        {editingProgramId && (
                            <TouchableOpacity style={styles.cancelEditBtn} onPress={resetForm} activeOpacity={0.85}>
                                <Text style={styles.cancelEditBtnText}>{isTurkish ? 'Düzenlemeyi İptal Et' : 'Cancel Editing'}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>{isTurkish ? 'Atanan Programlar' : 'Assigned Programs'}</Text>
                            <Text style={styles.listCount}>{assignedPrograms.length}</Text>
                        </View>

                        {loadingPrograms ? (
                            <View style={styles.loadingPrograms}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        ) : assignedPrograms.length === 0 ? (
                            <View style={styles.emptyList}>
                                <Text style={styles.emptyListText}>
                                    {isTurkish ? 'Henüz atanmış program yok.' : 'No assigned programs yet.'}
                                </Text>
                            </View>
                        ) : (
                            assignedPrograms.map((program) => (
                                <View key={program.id} style={styles.programCard}>
                                    <View style={styles.programHead}>
                                        <Text style={styles.programTitle}>{program.title}</Text>
                                        <View style={styles.programActions}>
                                            <TouchableOpacity
                                                style={styles.editBtn}
                                                onPress={() => handleEditProgram(program)}
                                                activeOpacity={0.8}
                                            >
                                                <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                                                <Text style={styles.editBtnText}>{isTurkish ? 'Düzenle' : 'Edit'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.deleteBtn, deletingProgramId === program.id && { opacity: 0.6 }]}
                                                onPress={() => handleDeleteProgram(program)}
                                                disabled={deletingProgramId === program.id}
                                                activeOpacity={0.8}
                                            >
                                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                                <Text style={styles.deleteBtnText}>{isTurkish ? 'Sil' : 'Delete'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {activeType === 'workout' ? (
                                        <Text style={styles.programMeta}>
                                            {(isTurkish ? 'Tarih' : 'Date')}: {program.scheduled_date || '-'} · {program.is_completed ? (isTurkish ? 'Tamamlandı' : 'Completed') : (isTurkish ? 'Bekliyor' : 'Pending')}
                                        </Text>
                                    ) : (
                                        <Text style={styles.programMeta}>
                                            {(isTurkish ? 'Aralık' : 'Range')}: {program.start_date || '-'} → {program.end_date || '-'}
                                        </Text>
                                    )}
                                    {!!program.description && <Text style={styles.programDesc}>{program.description}</Text>}
                                </View>
                            ))
                        )}
                    </>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
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
    headerTitle: {
        ...TYPOGRAPHY.h2,
        color: colors.text,
    },
    headerSub: {
        ...TYPOGRAPHY.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    emptyCard: {
        alignItems: 'center',
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: colors.surface,
        ...SHADOWS.card,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.captionBold,
        color: colors.textSecondary,
        marginBottom: 8,
        marginTop: SPACING.sm,
    },
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
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    clientChipText: {
        ...TYPOGRAPHY.small,
        color: colors.text,
        fontWeight: '600',
    },
    clientChipTextActive: {
        color: COLORS.primary,
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
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    typeBtnDisabled: {
        opacity: 0.45,
    },
    typeBtnText: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.textSecondary,
    },
    typeBtnTextActive: {
        color: COLORS.primary,
    },
    aiActionContainer: {
        marginTop: SPACING.md,
        gap: 8,
        marginBottom: SPACING.sm,
    },
    aiBtnPrimary: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    aiBtnPrimaryText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#FFF',
    },
    aiBtnSecondary: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 12,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    aiBtnSecondaryText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.primary,
    },
    input: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        ...TYPOGRAPHY.body,
        color: colors.text,
    },
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
    dateBtnText: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    createBtn: {
        marginTop: SPACING.lg,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        ...SHADOWS.card,
    },
    createBtnText: {
        ...TYPOGRAPHY.button,
        color: '#FFF',
        fontWeight: '700',
    },
    cancelEditBtn: {
        marginTop: SPACING.sm,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    cancelEditBtnText: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
    },
    listHeader: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listTitle: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
    },
    listCount: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.primary,
    },
    loadingPrograms: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    emptyList: {
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    emptyListText: {
        ...TYPOGRAPHY.caption,
        color: colors.textSecondary,
    },
    programCard: {
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: colors.surface,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    programHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    programActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    programTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
        flex: 1,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.primary + '45',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: COLORS.primarySoft,
    },
    editBtnText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.primary,
    },
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
    deleteBtnText: {
        ...TYPOGRAPHY.captionBold,
        color: '#EF4444',
    },
    programMeta: {
        ...TYPOGRAPHY.caption,
        color: colors.textSecondary,
        marginTop: 6,
    },
    programDesc: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        marginTop: 4,
    },
});

export default ProfessionalProgramCreatorScreen;
