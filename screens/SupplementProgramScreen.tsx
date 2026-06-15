import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SupplementService, Supplement } from '../services/supplementService';

export interface SupplementRoutine {
    id: string;
    supplement_id: string;
    supplement?: Supplement;
    days_of_week: number[];
    reminder_time?: string;
}

import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../contexts/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { SupabaseService } from '@nextself/shared';
import { formatDays as formatDaysUtil } from '../utils/formatDays';

const SupplementProgramScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { t, isTurkish } = useTranslation();
    const s = React.useMemo(() => getStyles(colors), [colors]);

    const [routines, setRoutines] = useState<SupplementRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, AlertComponent } = useAlert();

    const fetchRoutines = async () => {
        setLoading(true);
        const { data: { user } } = await SupabaseService.getInstance().getClient().auth.getUser();
        if (user) {
            const res = await SupplementService.getInstance().getUserRoutine(user.id);
            setRoutines(res.data as SupplementRoutine[] || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRoutines();
        });
        return unsubscribe;
    }, [navigation]);

    const handleGenerateAI = () => {
        showAlert({
            type: 'info',
            title: isTurkish ? 'AI Takviye Planı' : 'AI Supplement Plan',
            message: isTurkish ? 'Yakında! AI sizin için en uygun takviye ve mineral planını oluşturacak.' : 'Coming soon! AI will generate the perfect supplement and mineral plan for you.',
            buttons: [{ text: 'Tamam' }]
        });
    };

    const handleDeleteRoutine = async (supplementId: string) => {
        showAlert({
            type: 'confirm',
            title: isTurkish ? 'Emin misin?' : 'Are you sure?',
            message: isTurkish ? 'Bu takviyeyi planından çıkarmak istiyor musun?' : 'Do you want to remove this supplement from your plan?',
            buttons: [
                { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                {
                    text: isTurkish ? 'Kaldır' : 'Remove',
                    onPress: async () => {
                        const { data: { user } } = await SupabaseService.getInstance().getClient().auth.getUser();
                        if (user) {
                            await SupplementService.getInstance().removeFromRoutine(user.id, supplementId);
                            fetchRoutines();
                        }
                    }
                }
            ]
        });
    };

    const formatDays = (days: number[]) => formatDaysUtil(days, isTurkish);

    return (
        <ScreenContainer>
            <View style={s.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{isTurkish ? 'Takviye Planım' : 'My Supplements'}</Text>
                <View style={{ width: 24 }} />
            </View>
            <AlertComponent />

            <ScrollView contentContainerStyle={s.container}>
                <View style={s.aiBanner}>
                    <Ionicons name="sparkles" size={24} color={colors.warning} />
                    <View style={s.aiTexts}>
                        <Text style={s.aiTitle}>{isTurkish ? 'Otomatik Takviye Planı' : 'Auto Supplement Plan'}</Text>
                        <Text style={s.aiDesc}>{isTurkish ? 'Profilinize göre ideal vitamin ve mineral saatlerini otomatik olarak ayarlayın.' : 'Automatically configure ideal vitamin and mineral times based on your profile.'}</Text>
                    </View>
                    <TouchableOpacity style={s.aiButton} onPress={handleGenerateAI}>
                        <Text style={s.aiButtonText}>{isTurkish ? 'Oluştur' : 'Generate'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.headerRow}>
                    <Text style={s.sectionTitle}>{isTurkish ? 'Günlük Rutin' : 'Daily Routine'}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SupplementsList')}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : routines.length === 0 ? (
                    <View style={s.emptyState}>
                        <Ionicons name="medical-outline" size={60} color={colors.textTertiary} />
                        <Text style={s.emptyTitle}>{isTurkish ? 'Takviye Yok' : 'No Supplements'}</Text>
                        <Text style={s.emptyDesc}>{isTurkish ? 'Düzenli kullandığın vitamin veya mineralleri ekle, içme saatinde sana hatırlatalım.' : 'Add your regular vitamins or minerals, and we will remind you when it is time to take them.'}</Text>
                        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('SupplementsList')}>
                            <Text style={s.addBtnText}>{isTurkish ? 'Takviye Ekle' : 'Add Supplement'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    routines.map((routine) => (
                        <View key={routine.id} style={s.routineCard}>
                            <View style={s.routineInfo}>
                                <Text style={s.routineName}>{isTurkish ? (routine.supplement as any)?.name_tr || routine.supplement?.nameTr : (routine.supplement as any)?.name_en || routine.supplement?.nameEn}</Text>
                                <Text style={s.routineDosage}>{(routine.supplement as any)?.dosage_amount || routine.supplement?.dosageAmount} {(routine.supplement as any)?.dosage_unit || routine.supplement?.dosageUnit}</Text>
                                <View style={s.routineMeta}>
                                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                    <Text style={s.metaText}>{routine.reminder_time ? routine.reminder_time.substring(0, 5) : '-'}</Text>
                                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                                    <Text style={s.metaText}>{formatDays(routine.days_of_week)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteRoutine(routine.supplement_id)}>
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { padding: 20 },
    aiBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, padding: 16, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: colors.warning + '40' },
    aiTexts: { flex: 1, paddingHorizontal: 12 },
    aiTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    aiDesc: { fontSize: 12, color: colors.textSecondary },
    aiButton: { backgroundColor: colors.warning, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    aiButtonText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
    routineInfo: { flex: 1 },
    routineName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    routineDosage: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: 8 },
    routineMeta: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4, fontWeight: '500' },
    deleteBtn: { padding: 8, backgroundColor: colors.error + '20', borderRadius: 10 },
    emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    addBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
    addBtnText: { color: colors.background, fontWeight: 'bold', fontSize: 14 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
});

export default SupplementProgramScreen;
