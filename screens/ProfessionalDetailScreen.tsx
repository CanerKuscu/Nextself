import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SupabaseService } from '@nextself/shared';
import { safeGoBack } from '../utils/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';

const ProfessionalDetailScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const { language } = useTranslation();
    const insets = useSafeAreaInsets();
    const profileId = route.params?.professionalId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [ratings, setRatings] = useState<any[]>([]);
    const [courseCount, setCourseCount] = useState(0);
    const [clientCount, setClientCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [stories, setStories] = useState<any[]>([]);

    const tr = language === 'tr';
    const ru = language === 'ru';
    const tx = useMemo(() => ({
        title: tr ? 'Uzman Profili' : ru ? 'Профиль специалиста' : 'Professional Profile',
        rolePt: tr ? 'Personal Trainer' : ru ? 'Персональный тренер' : 'Personal Trainer',
        roleDietitian: tr ? 'Diyetisyen' : ru ? 'Диетолог' : 'Dietitian',
        specialties: tr ? 'Uzmanlıklar' : ru ? 'Специализации' : 'Specialties',
        experiences: tr ? 'Deneyim ve Sonuçlar' : ru ? 'Опыт и результаты' : 'Experience & Outcomes',
        years: tr ? 'Yıl Deneyim' : ru ? 'Лет опыта' : 'Years Experience',
        clients: tr ? 'Toplam Üye' : ru ? 'Клиентов' : 'Clients',
        programs: tr ? 'Tamamlanan Plan' : ru ? 'Завершено программ' : 'Completed Plans',
        noBio: tr ? 'Biyografi eklenmemiş.' : ru ? 'Биография не добавлена.' : 'Bio not added.',
        reviews: tr ? 'Üye Yorumları' : ru ? 'Отзывы клиентов' : 'Member Reviews',
        noReviews: tr ? 'Henüz yorum bulunmuyor.' : ru ? 'Пока нет отзывов.' : 'No reviews yet.',
        connect: tr ? 'Bağlantı Kur' : ru ? 'Связаться' : 'Connect',
        courses: tr ? 'Programları Gör' : ru ? 'Смотреть программы' : 'View Programs',
        defaultReview: tr ? 'Harika bir süreçti.' : ru ? 'Отличный процесс.' : 'It was a great process.',
        noSpecialties: tr ? 'Uzmanlık bilgisi eklenmemiş.' : ru ? 'Специализации не добавлены.' : 'No specialty data added.',
        transformations: tr ? 'Before/After Dönüşümler' : ru ? 'Трансформации До/После' : 'Before/After Transformations',
        noTransformations: tr ? 'Paylaşılan dönüşüm bulunmuyor.' : ru ? 'Пока нет опубликованных трансформаций.' : 'No published transformations yet.',
        before: tr ? 'Önce' : ru ? 'До' : 'Before',
        after: tr ? 'Sonra' : ru ? 'После' : 'After',
        weeks: tr ? 'hafta' : ru ? 'нед.' : 'weeks',
        change: tr ? 'Değişim' : ru ? 'Изменение' : 'Change',
    }), [tr, ru]);

    const loadDetail = useCallback(async () => {
        if (!profileId) {
            setLoading(false);
            return;
        }
        try {
            const service = SupabaseService.getInstance().getClient();

            const { data: detail } = await service
                .from('professional_profiles')
                .select('*, users(*)')
                .eq('id', profileId)
                .maybeSingle();
            setProfile(detail);

            const [{ data: rates }, { count: coursesCount }, { data: storyRows }] = await Promise.all([
                service
                    .from('ratings')
                    .select('id,rating,review,date,verified')
                    .eq('professional_id', profileId)
                    .order('date', { ascending: false })
                    .limit(8),
                service
                    .from('courses')
                    .select('id', { count: 'exact', head: true })
                    .eq('professional_id', profileId)
                    .eq('is_active', true),
                service
                    .from('professional_success_stories')
                    .select('id,client_alias,duration_weeks,before_weight_kg,after_weight_kg,before_image_url,after_image_url,summary')
                    .eq('professional_id', profileId)
                    .eq('is_public', true)
                    .eq('consent_approved', true)
                    .order('created_at', { ascending: false })
                    .limit(6),
            ]);

            setRatings(rates || []);
            setCourseCount(coursesCount || 0);
            setStories(storyRows || []);

            const { data: relationships } = await service
                .from('client_relationships')
                .select('id,status')
                .or(`professional_id.eq.${profileId},trainer_id.eq.${profileId},dietitian_id.eq.${profileId}`)
                .eq('status', 'active');
            const relRows = relationships || [];
            setClientCount(relRows.length);

            if (detail?.professional_type === 'dietitian') {
                const { count } = await service
                    .from('assigned_nutrition_plans')
                    .select('id', { count: 'exact', head: true })
                    .eq('dietitian_id', profileId)
                    .eq('is_active', true);
                setCompletedCount(count || 0);
            } else {
                const { count } = await service
                    .from('assigned_workouts')
                    .select('id', { count: 'exact', head: true })
                    .eq('pt_id', profileId)
                    .eq('is_completed', true);
                setCompletedCount(count || 0);
            }
        } catch {
            setProfile(null);
            setRatings([]);
            setCourseCount(0);
            setClientCount(0);
            setCompletedCount(0);
            setStories([]);
        } finally {
            setLoading(false);
        }
    }, [profileId]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={[styles.empty, { color: colors.textSecondary }]}>Profile not found</Text>
            </View>
        );
    }

    const isDietitian = profile.professional_type === 'dietitian';
    const fullName = `${profile.users?.first_name || ''} ${profile.users?.last_name || ''}`.trim();
    const avgRating = Number(profile.average_rating || 0);
    const ratingCount = Number(profile.total_ratings || ratings.length || 0);
    const specialties: string[] = Array.isArray(profile.specialties) ? profile.specialties : [];
    const certifications: string[] = Array.isArray(profile.certifications) ? profile.certifications : [];
    const experienceYears = Number(profile.experience || 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDietitian ? ['#16A34A', '#166534'] : ['#F97316', '#9A3412']}
                style={[styles.hero, { paddingTop: insets.top + SPACING.sm }]}
            >
                <View style={styles.heroTop}>
                    <TouchableOpacity style={styles.back} onPress={() => safeGoBack(navigation, 'ProfessionalSearch')}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.heroTitle}>{tx.title}</Text>
                    <View style={styles.back} />
                </View>
                <Text style={styles.name}>{fullName || tx.title}</Text>
                <Text style={styles.role}>{isDietitian ? tx.roleDietitian : tx.rolePt}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FACC15" />
                    <Text style={styles.ratingText}>{avgRating.toFixed(1)} ({ratingCount})</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.bio, { color: colors.text }]}>{profile.bio || tx.noBio}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.experiences}</Text>
                    <View style={styles.metricRow}>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{experienceYears}</Text>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{tx.years}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{clientCount}</Text>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{tx.clients}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{completedCount}</Text>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{tx.programs}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ProfessionalCourses', { professionalId: profile.id, professionalName: fullName, professionalType: profile.professional_type })}>
                        <Text style={styles.actionBtnText}>{tx.courses} ({courseCount})</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.specialties}</Text>
                    {specialties.length === 0 ? (
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>{tx.noSpecialties}</Text>
                    ) : (
                        <View style={styles.tags}>
                            {specialties.map((item) => (
                                <View key={item} style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                                    <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {certifications.length > 0 ? (
                        <View style={{ marginTop: SPACING.sm }}>
                            {certifications.slice(0, 4).map((item) => (
                                <Text key={item} style={[styles.meta, { color: colors.textSecondary }]}>• {item}</Text>
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.reviews}</Text>
                    {ratings.length === 0 ? (
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>{tx.noReviews}</Text>
                    ) : (
                        ratings.map((item) => (
                            <View key={item.id} style={[styles.reviewRow, { borderBottomColor: colors.borderLight }]}>
                                <Text style={[styles.reviewRating, { color: colors.text }]}>★ {Number(item.rating || 0).toFixed(1)}</Text>
                                <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{item.review || tx.defaultReview}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{tx.transformations}</Text>
                    {stories.length === 0 ? (
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>{tx.noTransformations}</Text>
                    ) : (
                        stories.map((story) => {
                            const before = Number(story.before_weight_kg || 0);
                            const after = Number(story.after_weight_kg || 0);
                            const delta = before && after ? (after - before).toFixed(1) : null;
                            return (
                                <View key={story.id} style={[styles.storyCard, { borderColor: colors.borderLight }]}>
                                    <View style={styles.storyTop}>
                                        <Text style={[styles.storyAlias, { color: colors.text }]}>{story.client_alias}</Text>
                                        <Text style={[styles.storyMeta, { color: colors.textSecondary }]}>{story.duration_weeks} {tx.weeks}</Text>
                                    </View>
                                    <View style={styles.storyImagesRow}>
                                        <View style={styles.storyImageBlock}>
                                            <Text style={[styles.storyMeta, { color: colors.textSecondary }]}>{tx.before}</Text>
                                            {story.before_image_url ? (
                                                <Image source={{ uri: story.before_image_url }} style={styles.storyImage} contentFit="cover" />
                                            ) : (
                                                <View style={[styles.storyImageFallback, { backgroundColor: colors.background }]}>
                                                    <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.storyImageBlock}>
                                            <Text style={[styles.storyMeta, { color: colors.textSecondary }]}>{tx.after}</Text>
                                            {story.after_image_url ? (
                                                <Image source={{ uri: story.after_image_url }} style={styles.storyImage} contentFit="cover" />
                                            ) : (
                                                <View style={[styles.storyImageFallback, { backgroundColor: colors.background }]}>
                                                    <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={[styles.storyMeta, { color: colors.textSecondary }]}>
                                        {tx.change}: {delta ? `${delta} kg` : '-'}
                                    </Text>
                                    <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{story.summary}</Text>
                                </View>
                            );
                        })
                    )}
                </View>

                <TouchableOpacity style={[styles.connectBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Rating', { professionalId: profile.id })}>
                    <Text style={styles.connectBtnText}>{tx.connect}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { ...TYPOGRAPHY.body },
    hero: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: BORDER_RADIUS.xxl,
        borderBottomRightRadius: BORDER_RADIUS.xxl,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    back: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff22',
    },
    heroTitle: { ...TYPOGRAPHY.captionBold, color: '#fff' },
    name: { ...TYPOGRAPHY.h1, color: '#fff' },
    role: { ...TYPOGRAPHY.body, color: '#FFFFFFDD' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
    ratingText: { ...TYPOGRAPHY.captionBold, color: '#fff' },
    content: { padding: SPACING.lg, paddingBottom: SPACING.section, gap: SPACING.sm },
    card: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, gap: SPACING.xs, ...SHADOWS.sm },
    bio: { ...TYPOGRAPHY.body },
    sectionTitle: { ...TYPOGRAPHY.bodyBold },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
    metricItem: { alignItems: 'center', flex: 1 },
    metricValue: { ...TYPOGRAPHY.h2 },
    metricLabel: { ...TYPOGRAPHY.caption, textAlign: 'center' },
    actionBtn: { marginTop: SPACING.sm, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
    actionBtnText: { ...TYPOGRAPHY.bodyBold, color: '#fff' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
    tag: { borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
    tagText: { ...TYPOGRAPHY.caption },
    meta: { ...TYPOGRAPHY.caption },
    reviewRow: { borderBottomWidth: 1, paddingVertical: SPACING.xs, gap: 4 },
    reviewRating: { ...TYPOGRAPHY.captionBold },
    reviewText: { ...TYPOGRAPHY.caption },
    storyCard: {
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        gap: SPACING.xs,
    },
    storyTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    storyAlias: { ...TYPOGRAPHY.bodyBold },
    storyMeta: { ...TYPOGRAPHY.caption },
    storyImagesRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    storyImageBlock: {
        flex: 1,
        gap: 4,
    },
    storyImage: {
        width: '100%',
        height: 94,
        borderRadius: BORDER_RADIUS.sm,
    },
    storyImageFallback: {
        width: '100%',
        height: 94,
        borderRadius: BORDER_RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectBtn: {
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    connectBtnText: { ...TYPOGRAPHY.bodyBold, color: '#fff' },
});

export default ProfessionalDetailScreen;
