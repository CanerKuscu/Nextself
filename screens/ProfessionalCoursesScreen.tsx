import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

const ProfessionalCoursesScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const { isTurkish, language } = useTranslation();
    const insets = useSafeAreaInsets();

    const externalProfessionalId = route.params?.professionalId as string | undefined;
    const professionalName = route.params?.professionalName as string | undefined;
    const readonlyMode = Boolean(externalProfessionalId);

    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [role, setRole] = useState<'pt' | 'dietitian'>('pt');
    const [resolvedProfessionalId, setResolvedProfessionalId] = useState('');

    const t = useMemo(() => {
        const tr = language === 'tr';
        const ru = language === 'ru';
        return {
            title: readonlyMode
                ? (tr ? 'Uzman Programları' : ru ? 'Программы специалиста' : 'Professional Programs')
                : (tr ? 'Uzman Eğitim Paketleri' : ru ? 'Пакеты специалиста' : 'Professional Course Packages'),
            noData: tr ? 'Henüz kurs paketi eklenmedi.' : ru ? 'Пакеты пока не добавлены.' : 'No course package added yet.',
            enrolled: tr ? 'Kayıtlı' : ru ? 'Записаны' : 'Enrolled',
            duration: tr ? 'Süre' : ru ? 'Длительность' : 'Duration',
            weeks: tr ? 'hafta' : ru ? 'нед.' : 'weeks',
            descFallback: tr ? 'Açıklama eklenmedi.' : ru ? 'Описание не добавлено.' : 'No description added.',
            untitled: tr ? 'Başlıksız Paket' : ru ? 'Без названия' : 'Untitled Package',
        };
    }, [language, readonlyMode]);

    const load = useCallback(async () => {
        try {
            const service = SupabaseService.getInstance();
            const { user } = await service.getCurrentUser();
            if (!user) return;

            let professionalId = externalProfessionalId || '';
            if (!professionalId) {
                const { data: pro } = await service.getClient()
                    .from('professional_profiles')
                    .select('id, professional_type')
                    .eq('user_id', user.id)
                    .maybeSingle();

                professionalId = pro?.id || '';
                setRole(pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt');
            } else {
                const { data: pro } = await service.getClient()
                    .from('professional_profiles')
                    .select('professional_type')
                    .eq('id', professionalId)
                    .maybeSingle();
                setRole(pro?.professional_type === 'dietitian' ? 'dietitian' : 'pt');
            }

            setResolvedProfessionalId(professionalId);
            if (!professionalId) {
                setCourses([]);
                return;
            }

            const { data: rows } = await service.getClient()
                .from('courses')
                .select('*')
                .eq('professional_id', professionalId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            setCourses(rows || []);
        } catch {
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [externalProfessionalId]);

    useEffect(() => {
        load();
    }, [load]);

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
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: colors.surface }]}
                    onPress={() => safeGoBack(navigation, readonlyMode ? 'ProfessionalSearch' : 'ProfessionalHome')}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {professionalName ? `${professionalName}` : t.title}
                </Text>
                {readonlyMode ? (
                    <View style={styles.iconBtn} />
                ) : (
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ProfessionalProgramCreator')}>
                        <Ionicons name={role === 'dietitian' ? 'nutrition-outline' : 'barbell-outline'} size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={courses}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, professionalId: resolvedProfessionalId })}
                    >
                        <View style={styles.topRow}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title || t.untitled}</Text>
                            <Text style={[styles.price, { color: colors.primary }]}>
                                {Number(item.price || 0).toFixed(0)} {item.currency || '₺'}
                            </Text>
                        </View>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                            {item.description || t.descFallback}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.meta, { color: colors.textSecondary }]}>
                                {t.enrolled}: {item.enrolled_count || 0}
                            </Text>
                            <Text style={[styles.meta, { color: colors.textSecondary }]}>
                                {t.duration}: {item.duration_weeks || 0} {t.weeks}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>{t.noData}</Text>
                    </View>
                }
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: SPACING.xs,
    },
    list: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.section,
        gap: SPACING.sm,
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
        gap: SPACING.xs,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        ...TYPOGRAPHY.bodyBold,
        flex: 1,
        paddingRight: SPACING.xs,
    },
    price: {
        ...TYPOGRAPHY.bodyBold,
    },
    cardDesc: {
        ...TYPOGRAPHY.caption,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    meta: {
        ...TYPOGRAPHY.caption,
    },
});

export default ProfessionalCoursesScreen;
