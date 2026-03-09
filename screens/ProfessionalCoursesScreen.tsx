import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { SupabaseService } from '../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfessionalCoursesScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { professionalId, professionalName, professionalType } = route.params || {};
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [sortBy, setSortBy] = useState<'rating' | 'price' | 'city'>('rating');
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadCourses();
    }, [professionalId]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const supabase = SupabaseService.getInstance();

            // Fetch courses from Supabase - uses 'courses' table or fallback to professional_services
            const { data: coursesData, error: coursesError } = await supabase.getClient()
                .from('courses')
                .select(`
                    id,
                    title,
                    title_tr,
                    description,
                    description_tr,
                    type,
                    duration_weeks,
                    sessions_count,
                    enrolled_count,
                    max_students,
                    price,
                    currency,
                    rating,
                    reviews_count,
                    location_type,
                    city,
                    schedule,
                    level,
                    features,
                    professional_id
                `)
                .eq('professional_id', professionalId)
                .eq('is_active', true);

            if (coursesError) {
                console.error('Courses fetch error:', coursesError);
                // Fallback: If courses table doesn't exist, try fetching from client_relationships as services
                await loadServicesAsCourses();
                return;
            }

            if (coursesData && coursesData.length > 0) {
                // Map database data to component format
                const mappedCourses = coursesData.map((course: any) => ({
                    id: course.id,
                    title: isTurkish && course.title_tr ? course.title_tr : course.title,
                    description: isTurkish && course.description_tr ? course.description_tr : course.description,
                    type: course.type || 'fitness',
                    duration: isTurkish ? `${course.duration_weeks} Hafta` : `${course.duration_weeks} Weeks`,
                    sessions: course.sessions_count || 0,
                    enrolled: course.enrolled_count || 0,
                    maxStudents: course.max_students || 10,
                    price: course.price || 0,
                    currency: course.currency || '₺',
                    rating: course.rating || 0,
                    reviews: course.reviews_count || 0,
                    location: course.location_type === 'online'
                        ? (isTurkish ? 'Online' : 'Online')
                        : (isTurkish ? 'Yüz Yüze' : 'In-Person'),
                    city: course.city || 'Istanbul',
                    schedule: course.schedule || (isTurkish ? 'Esnek' : 'Flexible'),
                    level: course.level || (isTurkish ? 'Orta Seviye' : 'Intermediate'),
                    features: course.features || [],
                    image: null,
                }));
                setAllCourses(mappedCourses);
            } else {
                // No courses found for this professional
                setAllCourses([]);
            }
        } catch (err: any) {
            console.error('Load courses exception:', err);
            Alert.alert(
                isTurkish ? 'Hata' : 'Error',
                isTurkish ? 'Eğitimler yüklenirken bir sorun oluştu.' : 'Failed to load courses.'
            );
            setAllCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // Fallback: Load professional services as courses if no courses table
    const loadServicesAsCourses = async () => {
        try {
            const supabase = SupabaseService.getInstance();

            // Try to get data from professional_profiles pricing
            const { data: profData, error: profError } = await supabase.getClient()
                .from('professional_profiles')
                .select('pricing, specialties, professional_type, bio')
                .eq('user_id', professionalId)
                .single();

            if (profError || !profData) {
                setAllCourses([]);
                setLoading(false);
                return;
            }

            // Create course-like data from professional profile
            const pricing = profData.pricing || {};
            const services: any[] = [];

            if (pricing.monthlyPackage) {
                services.push({
                    id: 'monthly-package',
                    title: isTurkish ? 'Aylık Paket' : 'Monthly Package',
                    description: profData.bio || (isTurkish ? 'Profesyonel aylık koçluk paketi' : 'Professional monthly coaching package'),
                    type: profData.professional_type === 'pt' ? 'fitness' : 'nutrition',
                    duration: isTurkish ? '1 Ay' : '1 Month',
                    sessions: 4,
                    enrolled: 0,
                    maxStudents: pricing.maxStudents || 10,
                    price: pricing.monthlyPackage,
                    currency: '₺',
                    rating: 4.8,
                    reviews: 0,
                    location: isTurkish ? 'Online / Yüz Yüze' : 'Online / In-Person',
                    city: 'Istanbul',
                    schedule: isTurkish ? 'Esnek' : 'Flexible',
                    level: isTurkish ? 'Tüm Seviyeler' : 'All Levels',
                    features: profData.specialties || [],
                    image: null,
                });
            }

            if (pricing.sessionRate) {
                services.push({
                    id: 'session-rate',
                    title: isTurkish ? 'Seans Bazlı' : 'Per Session',
                    description: isTurkish ? 'Tek seanslık özel ders' : 'Single private session',
                    type: profData.professional_type === 'pt' ? 'fitness' : 'nutrition',
                    duration: isTurkish ? '1 Seans' : '1 Session',
                    sessions: 1,
                    enrolled: 0,
                    maxStudents: 1,
                    price: pricing.sessionRate,
                    currency: '₺',
                    rating: 4.9,
                    reviews: 0,
                    location: isTurkish ? 'Online / Yüz Yüze' : 'Online / In-Person',
                    city: 'Istanbul',
                    schedule: isTurkish ? 'Randevu ile' : 'By Appointment',
                    level: isTurkish ? 'Tüm Seviyeler' : 'All Levels',
                    features: profData.specialties || [],
                    image: null,
                });
            }

            setAllCourses(services.length > 0 ? services : []);
        } catch (err) {
            console.error('Load services fallback error:', err);
            setAllCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (allCourses.length === 0) return;
        let filtered = [...allCourses];
        // Şehir filtresi
        if (selectedCity) {
            filtered = filtered.filter(c => c.city.toLowerCase().includes(selectedCity.toLowerCase()));
        }
        // Tip filtresi
        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => c.type === activeFilter);
        }
        // Sıralama
        filtered.sort((a, b) => {
            if (sortBy === 'rating') {
                return b.rating - a.rating;
            } else if (sortBy === 'price') {
                return a.price - b.price;
            } else if (sortBy === 'city') {
                return (a.city || '').localeCompare(b.city || '');
            }
            return 0;
        });
        setCourses(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [selectedCity, sortBy, activeFilter, allCourses]);

    const filteredCourses = courses.filter(c => activeFilter === 'all' || c.type === activeFilter);

    const renderStar = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Ionicons
                key={i}
                name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
                size={13}
                color={colors.warning}
            />
        ));
    };

    const renderCourse = ({ item, index }: { item: any; index: number }) => {
        const isTrainer = item.type === 'fitness';
        const enrollmentPct = Math.round((item.enrolled / item.maxStudents) * 100);
        const isFull = item.enrolled >= item.maxStudents;

        return (
            <AnimatedCard delay={index * 100} style={styles.courseCard}>
                {/* Gradient Header */}
                <View style={styles.courseHeader}>
                    <LinearGradient
                        colors={isTrainer ? ['#4F46E5', '#7C3AED'] : ['#059669', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.courseGradient}
                    >
                        <View style={styles.courseHeaderContent}>
                            <View style={styles.courseHeaderTop}>
                                <View style={styles.courseLevelBadge}>
                                    <Text style={styles.courseLevelText}>{item.level}</Text>
                                </View>
                                <View style={styles.courseTypeBadge}>
                                    <Ionicons
                                        name={isTrainer ? 'barbell-outline' : 'leaf-outline'}
                                        size={12}
                                        color="#fff"
                                    />
                                    <Text style={styles.courseTypeText}>
                                        {isTrainer ? (isTurkish ? 'Fitness' : 'Fitness') : (isTurkish ? 'Beslenme' : 'Nutrition')}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.courseHeaderBottom}>
                                <Ionicons
                                    name={isTrainer ? 'barbell' : 'nutrition'}
                                    size={32}
                                    color="rgba(255,255,255,0.3)"
                                />
                                <View style={styles.coursePriceContainer}>
                                    <Text style={styles.coursePriceValue}>
                                        {item.currency}{item.price.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Course Content */}
                <View style={styles.courseContent}>
                    <Text style={styles.courseTitle}>{item.title}</Text>
                    <Text style={styles.courseDescription} numberOfLines={2}>{item.description}</Text>

                    {/* Meta Info */}
                    <View style={styles.courseMetaGrid}>
                        <View style={styles.courseMeta}>
                            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                            <Text style={styles.courseMetaText}>{item.duration}</Text>
                        </View>
                        <View style={styles.courseMeta}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                            <Text style={styles.courseMetaText}>{item.sessions} {isTurkish ? 'ders' : 'sessions'}</Text>
                        </View>
                        <View style={styles.courseMeta}>
                            <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                            <Text style={styles.courseMetaText}>{item.location}</Text>
                        </View>
                        <View style={styles.courseMeta}>
                            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                            <Text style={styles.courseMetaText}>{item.schedule}</Text>
                        </View>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresRow}>
                        {item.features.slice(0, 3).map((feature: string, i: number) => (
                            <View key={i} style={styles.featureBadge}>
                                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                        {item.features.length > 3 && (
                            <Text style={styles.moreFeatures}>+{item.features.length - 3} {isTurkish ? 'daha' : 'more'}</Text>
                        )}
                    </View>

                    {/* Enrollment Progress */}
                    <View style={styles.enrollmentSection}>
                        <View style={styles.enrollmentHeader}>
                            <View style={styles.enrollmentLeft}>
                                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.enrollmentText}>
                                    {item.enrolled}/{item.maxStudents} {isTurkish ? 'katılımcı' : 'enrolled'}
                                </Text>
                            </View>
                            <Text style={[styles.enrollmentPct, { color: isFull ? colors.error : enrollmentPct > 80 ? colors.warning : colors.success }]}>
                                {isFull ? (isTurkish ? 'Dolu' : 'Full') : `${enrollmentPct}%`}
                            </Text>
                        </View>
                        <View style={styles.enrollmentBar}>
                            <View style={[
                                styles.enrollmentFill,
                                {
                                    width: `${enrollmentPct}%`,
                                    backgroundColor: isFull ? colors.error : enrollmentPct > 80 ? colors.warning : colors.primary,
                                },
                            ]} />
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.courseFooter}>
                        <View style={styles.courseRating}>
                            <View style={styles.ratingStars}>{renderStar(item.rating)}</View>
                            <Text style={styles.courseRatingValue}>{item.rating.toFixed(1)}</Text>
                            <Text style={styles.courseRatingCount}>({item.reviews})</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.enrollBtn, isFull && styles.enrollBtnDisabled]}
                            disabled={isFull}
                            onPress={() => navigation.navigate('CourseDetail', { course: item, professionalName })}
                        >
                            <Text style={[styles.enrollBtnText, isFull && styles.enrollBtnTextDisabled]}>
                                {isFull ? (isTurkish ? 'Dolu' : 'Full') : (isTurkish ? 'Detaylar' : 'Details')}
                            </Text>
                            {!isFull && <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    const isTrainer = professionalType === 'pt';

    return (
        <View style={[COMMON_STYLES.screenContainer, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{isTurkish ? 'Eğitimler' : 'Training Courses'}</Text>
                    <Text style={styles.headerSubtitle}>{professionalName}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Professional Banner */}
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={isTrainer ? ['#4F46E5', '#6366F1', '#818CF8'] : ['#059669', '#10B981', '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bannerGradient}
                >
                    <View style={styles.bannerContent}>
                        <View style={styles.bannerAvatar}>
                            <Ionicons name={isTrainer ? 'barbell' : 'nutrition'} size={28} color={isTrainer ? '#4F46E5' : '#059669'} />
                        </View>
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerName}>{professionalName}</Text>
                            <Text style={styles.bannerType}>
                                {isTrainer ? (isTurkish ? 'Kişisel Antrenör' : 'Personal Trainer') : (isTurkish ? 'Diyetisyen' : 'Dietitian')}
                            </Text>
                        </View>
                        <View style={styles.bannerStatsRow}>
                            <View style={styles.bannerStat}>
                                <Text style={styles.bannerStatValue}>{courses.length}</Text>
                                <Text style={styles.bannerStatLabel}>{isTurkish ? 'Eğitim' : 'Courses'}</Text>
                            </View>
                            <View style={styles.bannerStatDivider} />
                            <View style={styles.bannerStat}>
                                <Text style={styles.bannerStatValue}>{courses.reduce((sum, c) => sum + c.enrolled, 0)}</Text>
                                <Text style={styles.bannerStatLabel}>{isTurkish ? 'Öğrenci' : 'Students'}</Text>
                            </View>
                            <View style={styles.bannerStatDivider} />
                            <View style={styles.bannerStat}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <Ionicons name="star" size={14} color="#FFC800" />
                                    <Text style={styles.bannerStatValue}>
                                        {courses.length > 0
                                            ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1)
                                            : '0.0'}
                                    </Text>
                                </View>
                                <Text style={styles.bannerStatLabel}>
                                    {courses.reduce((sum, c) => sum + c.reviews, 0)} {isTurkish ? 'yorum' : 'reviews'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[
                    { id: 'all', label: isTurkish ? 'Tümü' : 'All', icon: 'grid-outline' as const },
                    { id: 'fitness', label: isTurkish ? 'Fitness' : 'Fitness', icon: 'barbell-outline' as const },
                    { id: 'nutrition', label: isTurkish ? 'Beslenme' : 'Nutrition', icon: 'nutrition-outline' as const },
                ].map(f => (
                    <TouchableOpacity
                        key={f.id}
                        style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f.id)}
                    >
                        <Ionicons name={f.icon} size={14} color={activeFilter === f.id ? colors.textInverse : colors.textSecondary} />
                        <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={[COMMON_STYLES.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>{isTurkish ? 'Eğitimler yükleniyor...' : 'Loading courses...'}</Text>
                </View>
            ) : (
                <FlatList
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    data={filteredCourses}
                    renderItem={renderCourse}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={[COMMON_STYLES.center, { paddingTop: 60 }]}>
                            <Ionicons name="book-outline" size={48} color={colors.border} />
                            <Text style={styles.emptyTitle}>
                                {isTurkish ? 'Henüz Eğitim Yok' : 'No Courses Yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {isTurkish ? 'Bu uzman henüz eğitim eklememiş.' : 'This professional hasn\'t added any courses yet.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
        paddingTop: SPACING.sm,
    },
    backBtn: {
        padding: SPACING.sm,
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
    },
    headerSubtitle: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        marginTop: 2,
    },
    bannerContainer: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    bannerGradient: {
        padding: SPACING.lg,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    bannerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    bannerName: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
        fontSize: 16,
    },
    bannerType: {
        ...TYPOGRAPHY.small,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    bannerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginTop: SPACING.sm,
        width: '100%',
        justifyContent: 'center',
        gap: SPACING.xl,
    },
    bannerStat: {
        alignItems: 'center',
    },
    bannerStatValue: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
        fontSize: 18,
    },
    bannerStatLabel: {
        ...TYPOGRAPHY.small,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },
    bannerStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterScroll: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 2,
        borderRadius: BORDER_RADIUS.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.textInverse,
    },
    loadingText: {
        ...TYPOGRAPHY.caption,
        color: colors.textTertiary,
        marginTop: SPACING.md,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xxxl,
        gap: SPACING.lg,
    },
    courseCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: BORDER_RADIUS.lg,
    },
    courseHeader: {
        overflow: 'hidden',
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
    },
    courseGradient: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    courseHeaderContent: {},
    courseHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    courseLevelBadge: {
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    courseLevelText: {
        ...TYPOGRAPHY.small,
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    courseTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    courseTypeText: {
        ...TYPOGRAPHY.small,
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    courseHeaderBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    coursePriceContainer: {
        alignItems: 'flex-end',
    },
    coursePriceValue: {
        ...TYPOGRAPHY.h2,
        color: '#fff',
        fontWeight: '800',
        fontSize: 24,
    },
    courseContent: {
        padding: SPACING.lg,
    },
    courseTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
        fontSize: 17,
        marginBottom: 6,
    },
    courseDescription: {
        ...TYPOGRAPHY.caption,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    courseMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    courseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 5,
        borderRadius: BORDER_RADIUS.sm,
    },
    courseMetaText: {
        ...TYPOGRAPHY.small,
        color: colors.textSecondary,
        fontSize: 11,
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: SPACING.md,
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        backgroundColor: colors.successSoft,
        borderRadius: BORDER_RADIUS.pill,
    },
    featureText: {
        ...TYPOGRAPHY.small,
        color: colors.success,
        fontWeight: '600',
        fontSize: 11,
    },
    moreFeatures: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        fontWeight: '600',
        alignSelf: 'center',
        marginLeft: 4,
    },
    enrollmentSection: {
        marginBottom: SPACING.md,
    },
    enrollmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    enrollmentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    enrollmentText: {
        ...TYPOGRAPHY.small,
        color: colors.textSecondary,
    },
    enrollmentPct: {
        ...TYPOGRAPHY.captionBold,
        fontSize: 12,
    },
    enrollmentBar: {
        height: 6,
        backgroundColor: colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    enrollmentFill: {
        height: '100%',
        borderRadius: 3,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    courseRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 1,
    },
    courseRatingValue: {
        ...TYPOGRAPHY.captionBold,
        color: colors.text,
    },
    courseRatingCount: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
    },
    enrollBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 4,
        borderRadius: BORDER_RADIUS.md,
    },
    enrollBtnDisabled: {
        backgroundColor: colors.surface,
    },
    enrollBtnText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.textInverse,
        fontSize: 13,
    },
    enrollBtnTextDisabled: {
        color: colors.textTertiary,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h3,
        color: colors.textSecondary,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        ...TYPOGRAPHY.caption,
        color: colors.textTertiary,
    },
});

export default ProfessionalCoursesScreen;
