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
const expo_linear_gradient_1 = require("expo-linear-gradient");
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const supabase_1 = require("../services/supabase");
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const ProfessionalCoursesScreen = ({ navigation, route }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { professionalId, professionalName, professionalType } = route.params || {};
    const [allCourses, setAllCourses] = (0, react_1.useState)([]);
    const [courses, setCourses] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [activeFilter, setActiveFilter] = (0, react_1.useState)('all');
    const [selectedCity, setSelectedCity] = (0, react_1.useState)('');
    const [sortBy, setSortBy] = (0, react_1.useState)('rating');
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    (0, react_1.useEffect)(() => {
        loadCourses();
    }, [professionalId]);
    const loadCourses = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            // Fetch courses from Supabase - uses 'courses' table or fallback to professional_services
            const { data: coursesData, error: coursesError } = yield supabase.getClient()
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
                yield loadServicesAsCourses();
                return;
            }
            if (coursesData && coursesData.length > 0) {
                // Map database data to component format
                const mappedCourses = coursesData.map((course) => ({
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
            }
            else {
                // No courses found for this professional
                setAllCourses([]);
            }
        }
        catch (err) {
            console.error('Load courses exception:', err);
            react_native_1.Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Eğitimler yüklenirken bir sorun oluştu.' : 'Failed to load courses.');
            setAllCourses([]);
        }
        finally {
            setLoading(false);
        }
    });
    // Fallback: Load professional services as courses if no courses table
    const loadServicesAsCourses = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            // Try to get data from professional_profiles pricing
            const { data: profData, error: profError } = yield supabase.getClient()
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
            const services = [];
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
        }
        catch (err) {
            console.error('Load services fallback error:', err);
            setAllCourses([]);
        }
        finally {
            setLoading(false);
        }
    });
    const applyFilters = () => {
        if (allCourses.length === 0)
            return;
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
            }
            else if (sortBy === 'price') {
                return a.price - b.price;
            }
            else if (sortBy === 'city') {
                return (a.city || '').localeCompare(b.city || '');
            }
            return 0;
        });
        setCourses(filtered);
    };
    (0, react_1.useEffect)(() => {
        applyFilters();
    }, [selectedCity, sortBy, activeFilter, allCourses]);
    const filteredCourses = courses.filter(c => activeFilter === 'all' || c.type === activeFilter);
    const renderStar = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (<vector_icons_1.Ionicons key={i} name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'} size={13} color={colors.warning}/>));
    };
    const renderCourse = ({ item, index }) => {
        const isTrainer = item.type === 'fitness';
        const enrollmentPct = Math.round((item.enrolled / item.maxStudents) * 100);
        const isFull = item.enrolled >= item.maxStudents;
        return (<AnimatedCard_1.default delay={index * 100} style={styles.courseCard}>
                {/* Gradient Header */}
                <react_native_1.View style={styles.courseHeader}>
                    <expo_linear_gradient_1.LinearGradient colors={isTrainer ? ['#4F46E5', '#7C3AED'] : ['#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.courseGradient}>
                        <react_native_1.View style={styles.courseHeaderContent}>
                            <react_native_1.View style={styles.courseHeaderTop}>
                                <react_native_1.View style={styles.courseLevelBadge}>
                                    <react_native_1.Text style={styles.courseLevelText}>{item.level}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.courseTypeBadge}>
                                    <vector_icons_1.Ionicons name={isTrainer ? 'barbell-outline' : 'leaf-outline'} size={12} color="#fff"/>
                                    <react_native_1.Text style={styles.courseTypeText}>
                                        {isTrainer ? (isTurkish ? 'Fitness' : 'Fitness') : (isTurkish ? 'Beslenme' : 'Nutrition')}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>
                            <react_native_1.View style={styles.courseHeaderBottom}>
                                <vector_icons_1.Ionicons name={isTrainer ? 'barbell' : 'nutrition'} size={32} color="rgba(255,255,255,0.3)"/>
                                <react_native_1.View style={styles.coursePriceContainer}>
                                    <react_native_1.Text style={styles.coursePriceValue}>
                                        {item.currency}{item.price.toLocaleString()}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>
                        </react_native_1.View>
                    </expo_linear_gradient_1.LinearGradient>
                </react_native_1.View>

                {/* Course Content */}
                <react_native_1.View style={styles.courseContent}>
                    <react_native_1.Text style={styles.courseTitle}>{item.title}</react_native_1.Text>
                    <react_native_1.Text style={styles.courseDescription} numberOfLines={2}>{item.description}</react_native_1.Text>

                    {/* Meta Info */}
                    <react_native_1.View style={styles.courseMetaGrid}>
                        <react_native_1.View style={styles.courseMeta}>
                            <vector_icons_1.Ionicons name="time-outline" size={14} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.courseMetaText}>{item.duration}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.courseMeta}>
                            <vector_icons_1.Ionicons name="calendar-outline" size={14} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.courseMetaText}>{item.sessions} {isTurkish ? 'ders' : 'sessions'}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.courseMeta}>
                            <vector_icons_1.Ionicons name="location-outline" size={14} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.courseMetaText}>{item.location}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.courseMeta}>
                            <vector_icons_1.Ionicons name="time-outline" size={14} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.courseMetaText}>{item.schedule}</react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>

                    {/* Features */}
                    <react_native_1.View style={styles.featuresRow}>
                        {item.features.slice(0, 3).map((feature, i) => (<react_native_1.View key={i} style={styles.featureBadge}>
                                <vector_icons_1.Ionicons name="checkmark-circle" size={12} color={colors.success}/>
                                <react_native_1.Text style={styles.featureText}>{feature}</react_native_1.Text>
                            </react_native_1.View>))}
                        {item.features.length > 3 && (<react_native_1.Text style={styles.moreFeatures}>+{item.features.length - 3} {isTurkish ? 'daha' : 'more'}</react_native_1.Text>)}
                    </react_native_1.View>

                    {/* Enrollment Progress */}
                    <react_native_1.View style={styles.enrollmentSection}>
                        <react_native_1.View style={styles.enrollmentHeader}>
                            <react_native_1.View style={styles.enrollmentLeft}>
                                <vector_icons_1.Ionicons name="people-outline" size={14} color={colors.textSecondary}/>
                                <react_native_1.Text style={styles.enrollmentText}>
                                    {item.enrolled}/{item.maxStudents} {isTurkish ? 'katılımcı' : 'enrolled'}
                                </react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.Text style={[styles.enrollmentPct, { color: isFull ? colors.error : enrollmentPct > 80 ? colors.warning : colors.success }]}>
                                {isFull ? (isTurkish ? 'Dolu' : 'Full') : `${enrollmentPct}%`}
                            </react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.enrollmentBar}>
                            <react_native_1.View style={[
                styles.enrollmentFill,
                {
                    width: `${enrollmentPct}%`,
                    backgroundColor: isFull ? colors.error : enrollmentPct > 80 ? colors.warning : colors.primary,
                },
            ]}/>
                        </react_native_1.View>
                    </react_native_1.View>

                    {/* Footer */}
                    <react_native_1.View style={styles.courseFooter}>
                        <react_native_1.View style={styles.courseRating}>
                            <react_native_1.View style={styles.ratingStars}>{renderStar(item.rating)}</react_native_1.View>
                            <react_native_1.Text style={styles.courseRatingValue}>{item.rating.toFixed(1)}</react_native_1.Text>
                            <react_native_1.Text style={styles.courseRatingCount}>({item.reviews})</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.TouchableOpacity style={[styles.enrollBtn, isFull && styles.enrollBtnDisabled]} disabled={isFull} onPress={() => navigation.navigate('CourseDetail', { course: item, professionalName })}>
                            <react_native_1.Text style={[styles.enrollBtnText, isFull && styles.enrollBtnTextDisabled]}>
                                {isFull ? (isTurkish ? 'Dolu' : 'Full') : (isTurkish ? 'Detaylar' : 'Details')}
                            </react_native_1.Text>
                            {!isFull && <vector_icons_1.Ionicons name="arrow-forward" size={16} color={colors.textInverse}/>}
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                </react_native_1.View>
            </AnimatedCard_1.default>);
    };
    const isTrainer = professionalType === 'pt';
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { paddingTop: insets.top }]}>
            {/* Header */}
            <react_native_1.View style={styles.header}>
                <react_native_1.TouchableOpacity style={styles.backBtn} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'ProfessionalSearch')}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.View style={styles.headerCenter}>
                    <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Eğitimler' : 'Training Courses'}</react_native_1.Text>
                    <react_native_1.Text style={styles.headerSubtitle}>{professionalName}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            {/* Professional Banner */}
            <react_native_1.View style={styles.bannerContainer}>
                <expo_linear_gradient_1.LinearGradient colors={isTrainer ? ['#4F46E5', '#6366F1', '#818CF8'] : ['#059669', '#10B981', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerGradient}>
                    <react_native_1.View style={styles.bannerContent}>
                        <react_native_1.View style={styles.bannerAvatar}>
                            <vector_icons_1.Ionicons name={isTrainer ? 'barbell' : 'nutrition'} size={28} color={isTrainer ? '#4F46E5' : '#059669'}/>
                        </react_native_1.View>
                        <react_native_1.View style={styles.bannerInfo}>
                            <react_native_1.Text style={styles.bannerName}>{professionalName}</react_native_1.Text>
                            <react_native_1.Text style={styles.bannerType}>
                                {isTrainer ? (isTurkish ? 'Kişisel Antrenör' : 'Personal Trainer') : (isTurkish ? 'Diyetisyen' : 'Dietitian')}
                            </react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.bannerStatsRow}>
                            <react_native_1.View style={styles.bannerStat}>
                                <react_native_1.Text style={styles.bannerStatValue}>{courses.length}</react_native_1.Text>
                                <react_native_1.Text style={styles.bannerStatLabel}>{isTurkish ? 'Eğitim' : 'Courses'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.bannerStatDivider}/>
                            <react_native_1.View style={styles.bannerStat}>
                                <react_native_1.Text style={styles.bannerStatValue}>{courses.reduce((sum, c) => sum + c.enrolled, 0)}</react_native_1.Text>
                                <react_native_1.Text style={styles.bannerStatLabel}>{isTurkish ? 'Öğrenci' : 'Students'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.bannerStatDivider}/>
                            <react_native_1.View style={styles.bannerStat}>
                                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <vector_icons_1.Ionicons name="star" size={14} color="#FFC800"/>
                                    <react_native_1.Text style={styles.bannerStatValue}>
                                        {courses.length > 0
            ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1)
            : '0.0'}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.Text style={styles.bannerStatLabel}>
                                    {courses.reduce((sum, c) => sum + c.reviews, 0)} {isTurkish ? 'yorum' : 'reviews'}
                                </react_native_1.Text>
                            </react_native_1.View>
                        </react_native_1.View>
                    </react_native_1.View>
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.View>

            {/* Filter */}
            <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[
            { id: 'all', label: isTurkish ? 'Tümü' : 'All', icon: 'grid-outline' },
            { id: 'fitness', label: isTurkish ? 'Fitness' : 'Fitness', icon: 'barbell-outline' },
            { id: 'nutrition', label: isTurkish ? 'Beslenme' : 'Nutrition', icon: 'nutrition-outline' },
        ].map(f => (<react_native_1.TouchableOpacity key={f.id} style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]} onPress={() => setActiveFilter(f.id)}>
                        <vector_icons_1.Ionicons name={f.icon} size={14} color={activeFilter === f.id ? colors.textInverse : colors.textSecondary}/>
                        <react_native_1.Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>{f.label}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>))}
            </react_native_1.ScrollView>

            {loading ? (<react_native_1.View style={[theme_1.COMMON_STYLES.center, { flex: 1 }]}>
                    <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                    <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Eğitimler yükleniyor...' : 'Loading courses...'}</react_native_1.Text>
                </react_native_1.View>) : (<react_native_1.FlatList initialNumToRender={8} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} data={filteredCourses} renderItem={renderCourse} keyExtractor={item => String(item.id)} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} getItemLayout={(data, index) => ({
                length: 140, // Estimated course card height
                offset: 140 * index,
                index,
            })} ListEmptyComponent={<react_native_1.View style={[theme_1.COMMON_STYLES.center, { paddingTop: 60 }]}>
                            <vector_icons_1.Ionicons name="book-outline" size={48} color={colors.border}/>
                            <react_native_1.Text style={styles.emptyTitle}>
                                {isTurkish ? 'Henüz Eğitim Yok' : 'No Courses Yet'}
                            </react_native_1.Text>
                            <react_native_1.Text style={styles.emptySubtitle}>
                                {isTurkish ? 'Bu uzman henüz eğitim eklememiş.' : 'This professional hasn\'t added any courses yet.'}
                            </react_native_1.Text>
                        </react_native_1.View>}/>)}
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.sm,
        paddingTop: theme_1.SPACING.sm,
    },
    backBtn: {
        padding: theme_1.SPACING.sm,
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    headerSubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: 2 }),
    bannerContainer: {
        marginHorizontal: theme_1.SPACING.lg,
        marginBottom: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    bannerGradient: {
        padding: theme_1.SPACING.lg,
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
        marginLeft: theme_1.SPACING.md,
    },
    bannerName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', fontSize: 16 }),
    bannerType: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: 'rgba(255,255,255,0.8)', marginTop: 2 }),
    bannerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: theme_1.BORDER_RADIUS.md,
        paddingHorizontal: theme_1.SPACING.md,
        paddingVertical: theme_1.SPACING.sm,
        marginTop: theme_1.SPACING.sm,
        width: '100%',
        justifyContent: 'center',
        gap: theme_1.SPACING.xl,
    },
    bannerStat: {
        alignItems: 'center',
    },
    bannerStatValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', fontSize: 18 }),
    bannerStatLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: 'rgba(255,255,255,0.7)', fontSize: 11 }),
    bannerStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterScroll: {
        paddingHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.sm + 2,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary }),
    filterTextActive: {
        color: colors.textInverse,
    },
    loadingText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, marginTop: theme_1.SPACING.md }),
    listContent: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.sm,
        paddingBottom: theme_1.SPACING.xxxl,
        gap: theme_1.SPACING.lg,
    },
    courseCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: theme_1.BORDER_RADIUS.lg,
    },
    courseHeader: {
        overflow: 'hidden',
        borderTopLeftRadius: theme_1.BORDER_RADIUS.lg,
        borderTopRightRadius: theme_1.BORDER_RADIUS.lg,
    },
    courseGradient: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.md,
    },
    courseHeaderContent: {},
    courseHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.sm,
    },
    courseLevelBadge: {
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    courseLevelText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: '#fff', fontWeight: '700', fontSize: 11 }),
    courseTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    courseTypeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: '#fff', fontWeight: '700', fontSize: 11 }),
    courseHeaderBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    coursePriceContainer: {
        alignItems: 'flex-end',
    },
    coursePriceValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: '#fff', fontWeight: '800', fontSize: 24 }),
    courseContent: {
        padding: theme_1.SPACING.lg,
    },
    courseTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, fontSize: 17, marginBottom: 6 }),
    courseDescription: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, lineHeight: 20, marginBottom: theme_1.SPACING.md }),
    courseMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.md,
    },
    courseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 5,
        borderRadius: theme_1.BORDER_RADIUS.sm,
    },
    courseMetaText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary, fontSize: 11 }),
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: theme_1.SPACING.md,
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme_1.SPACING.sm,
        paddingVertical: 3,
        backgroundColor: colors.successSoft,
        borderRadius: theme_1.BORDER_RADIUS.pill,
    },
    featureText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.success, fontWeight: '600', fontSize: 11 }),
    moreFeatures: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, fontWeight: '600', alignSelf: 'center', marginLeft: 4 }),
    enrollmentSection: {
        marginBottom: theme_1.SPACING.md,
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
    enrollmentText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary }),
    enrollmentPct: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { fontSize: 12 }),
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
        paddingTop: theme_1.SPACING.md,
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
    courseRatingValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.text }),
    courseRatingCount: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    enrollBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.sm + 4,
        borderRadius: theme_1.BORDER_RADIUS.md,
    },
    enrollBtnDisabled: {
        backgroundColor: colors.surface,
    },
    enrollBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textInverse, fontSize: 13 }),
    enrollBtnTextDisabled: {
        color: colors.textTertiary,
    },
    emptyTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.textSecondary, marginTop: theme_1.SPACING.md, marginBottom: theme_1.SPACING.xs }),
    emptySubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary }),
});
exports.default = ProfessionalCoursesScreen;
