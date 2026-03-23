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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const CourseDetailScreen = ({ navigation, route }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { course, professionalName } = route.params || {};
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const [showFullDesc, setShowFullDesc] = (0, react_1.useState)(false);
    const [showReviewModal, setShowReviewModal] = (0, react_1.useState)(false);
    const [userRating, setUserRating] = (0, react_1.useState)(0);
    const [reviewText, setReviewText] = (0, react_1.useState)('');
    const [courseReviews, setCourseReviews] = (0, react_1.useState)([]);
    const [courseRating, setCourseRating] = (0, react_1.useState)((course === null || course === void 0 ? void 0 : course.rating) || 0);
    const [courseReviewCount, setCourseReviewCount] = (0, react_1.useState)((course === null || course === void 0 ? void 0 : course.reviews) || 0);
    if (!course) {
        return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, theme_1.COMMON_STYLES.center]}>
                <react_native_1.Text style={{ color: colors.textSecondary }}>{isTurkish ? 'Eğitim bulunamadı' : 'Course not found'}</react_native_1.Text>
            </react_native_1.View>);
    }
    const isTrainer = course.type === 'fitness';
    const enrollmentPct = Math.round((course.enrolled / course.maxStudents) * 100);
    const isFull = course.enrolled >= course.maxStudents;
    const spotsLeft = course.maxStudents - course.enrolled;
    const handleEnroll = () => {
        showAlert({
            type: 'success',
            title: isTurkish ? 'Kayıt Talebi Gönderildi!' : 'Enrollment Request Sent!',
            message: isTurkish
                ? `${professionalName} size en kısa sürede dönüş yapacaktır.`
                : `${professionalName} will get back to you shortly.`,
            buttons: [{ text: 'OK' }],
        });
    };
    const handleSubmitReview = () => {
        if (userRating === 0) {
            showAlert({
                type: 'warning',
                title: isTurkish ? 'Yıldız Seçin' : 'Select Rating',
                message: isTurkish ? 'Lütfen en az 1 yıldız verin.' : 'Please give at least 1 star.',
                buttons: [{ text: 'OK' }],
            });
            return;
        }
        const newReview = {
            name: 'Sen',
            rating: userRating,
            text: reviewText || (isTurkish ? 'Harika bir eğitim!' : 'Great course!'),
            date: isTurkish ? 'Az önce' : 'Just now',
            isNew: true,
        };
        setCourseReviews((prev) => [newReview, ...prev]);
        // Update overall rating
        const allReviews = [newReview, ...reviews, ...courseReviews];
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        setCourseRating(parseFloat(avgRating.toFixed(1)));
        setCourseReviewCount(allReviews.length);
        setShowReviewModal(false);
        setUserRating(0);
        setReviewText('');
        showAlert({
            type: 'success',
            title: isTurkish ? 'Değerlendirme Gönderildi!' : 'Review Submitted!',
            message: isTurkish ? 'Yorumunuz için teşekkürler.' : 'Thanks for your feedback.',
            buttons: [{ text: 'OK' }],
        });
    };
    // Rating distribution (mock)
    const ratingDistribution = [
        { stars: 5, pct: 68 },
        { stars: 4, pct: 22 },
        { stars: 3, pct: 7 },
        { stars: 2, pct: 2 },
        { stars: 1, pct: 1 },
    ];
    const renderStar = (rating) => Array.from({ length: 5 }, (_, i) => (<vector_icons_1.Ionicons key={i} name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'} size={16} color={colors.warning}/>));
    // Mock reviews
    const reviews = [
        { name: 'Ahmet Y.', rating: 5, text: isTurkish ? 'Harika bir program, çok memnun kaldım!' : 'Amazing program, highly recommended!', date: '2 hafta önce' },
        { name: 'Elif K.', rating: 4, text: isTurkish ? 'Çok faydalı, antrenör çok ilgili.' : 'Very helpful, trainer is very attentive.', date: '1 ay önce' },
        { name: 'Mert B.', rating: 5, text: isTurkish ? 'Hayatımı değiştirdi, herkese öneririm.' : 'Life changing, I recommend it to everyone.', date: '1 ay önce' },
    ];
    // Mock schedule
    const scheduleItems = [
        { week: isTurkish ? 'Hafta 1-2' : 'Week 1-2', topic: isTurkish ? 'Temel değerlendirme & program oluşturma' : 'Initial assessment & program creation' },
        { week: isTurkish ? 'Hafta 3-4' : 'Week 3-4', topic: isTurkish ? 'Teknik geliştirme & beslenme planı' : 'Technique development & meal plan' },
        { week: isTurkish ? 'Hafta 5-6' : 'Week 5-6', topic: isTurkish ? 'Yoğunluk artışı & ilerleme kontrolü' : 'Intensity increase & progress check' },
        { week: isTurkish ? 'Hafta 7-8' : 'Week 7-8', topic: isTurkish ? 'İleri teknikler & final değerlendirmesi' : 'Advanced techniques & final assessment' },
    ];
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { paddingTop: insets.top }]}>
            <AlertComponent />

            {/* Header */}
            <react_native_1.View style={styles.header}>
                <react_native_1.TouchableOpacity style={styles.backBtn} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'ProfessionalCourses')}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Eğitim Detayı' : 'Course Detail'}</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.shareBtn}>
                    <vector_icons_1.Ionicons name="share-outline" size={22} color={colors.text}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Gradient */}
                <react_native_1.View style={styles.heroContainer}>
                    <expo_linear_gradient_1.LinearGradient colors={isTrainer ? ['#4F46E5', '#6366F1', '#818CF8'] : ['#059669', '#10B981', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
                        <react_native_1.View style={styles.heroContent}>
                            <react_native_1.View style={styles.heroBadges}>
                                <react_native_1.View style={styles.heroBadge}>
                                    <react_native_1.Text style={styles.heroBadgeText}>{course.level}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.heroBadge}>
                                    <vector_icons_1.Ionicons name={isTrainer ? 'barbell-outline' : 'leaf-outline'} size={12} color="#fff"/>
                                    <react_native_1.Text style={styles.heroBadgeText}>
                                        {isTrainer ? (isTurkish ? 'Fitness' : 'Fitness') : (isTurkish ? 'Beslenme' : 'Nutrition')}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.heroBadge}>
                                    <vector_icons_1.Ionicons name="location-outline" size={12} color="#fff"/>
                                    <react_native_1.Text style={styles.heroBadgeText}>{course.location}</react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.heroTitle}>{course.title}</react_native_1.Text>
                            <react_native_1.View style={styles.heroMeta}>
                                <react_native_1.View style={styles.heroMetaItem}>
                                    <vector_icons_1.Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.8)"/>
                                    <react_native_1.Text style={styles.heroMetaText}>{professionalName}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.heroMetaItem}>
                                    <vector_icons_1.Ionicons name="star" size={14} color="#FFC800"/>
                                    <react_native_1.Text style={styles.heroMetaText}>{course.rating.toFixed(1)} ({course.reviews})</react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>
                        </react_native_1.View>
                    </expo_linear_gradient_1.LinearGradient>
                </react_native_1.View>

                {/* Price & Enrollment Card */}
                <react_native_1.View style={styles.priceCard}>
                    <react_native_1.View style={styles.priceRow}>
                        <react_native_1.View>
                            <react_native_1.Text style={styles.priceLabel}>{isTurkish ? 'Kurs Ücreti' : 'Course Fee'}</react_native_1.Text>
                            <react_native_1.Text style={styles.priceValue}>{course.currency}{course.price.toLocaleString()}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.spotsContainer}>
                            {!isFull ? (<>
                                    <react_native_1.Text style={[styles.spotsValue, { color: spotsLeft <= 3 ? colors.error : colors.success }]}>
                                        {spotsLeft}
                                    </react_native_1.Text>
                                    <react_native_1.Text style={styles.spotsLabel}>
                                        {isTurkish ? 'kontenjan kaldı' : 'spots left'}
                                    </react_native_1.Text>
                                </>) : (<react_native_1.Text style={[styles.spotsValue, { color: colors.error }]}>
                                    {isTurkish ? 'Dolu' : 'Full'}
                                </react_native_1.Text>)}
                        </react_native_1.View>
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
                    <react_native_1.Text style={styles.enrollmentLabel}>
                        {course.enrolled}/{course.maxStudents} {isTurkish ? 'kayıtlı' : 'enrolled'}
                    </react_native_1.Text>
                </react_native_1.View>

                {/* Quick Info Grid */}
                <react_native_1.View style={styles.infoGrid}>
                    {[
            { icon: 'time-outline', label: isTurkish ? 'Süre' : 'Duration', value: course.duration },
            { icon: 'calendar-outline', label: isTurkish ? 'Ders Sayısı' : 'Sessions', value: `${course.sessions}` },
            { icon: 'location-outline', label: isTurkish ? 'Şehir' : 'City', value: course.city },
            { icon: 'alarm-outline', label: isTurkish ? 'Program' : 'Schedule', value: course.schedule },
        ].map((info, i) => (<react_native_1.View key={i} style={styles.infoItem}>
                            <react_native_1.View style={styles.infoIconContainer}>
                                <vector_icons_1.Ionicons name={info.icon} size={20} color={colors.primary}/>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.infoLabel}>{info.label}</react_native_1.Text>
                            <react_native_1.Text style={styles.infoValue}>{info.value}</react_native_1.Text>
                        </react_native_1.View>))}
                </react_native_1.View>

                {/* Description */}
                <react_native_1.View style={styles.section}>
                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Açıklama' : 'Description'}</react_native_1.Text>
                    <react_native_1.Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 3}>
                        {course.description}
                    </react_native_1.Text>
                    <react_native_1.TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <react_native_1.Text style={styles.readMore}>
                            {showFullDesc ? (isTurkish ? 'Daha az göster' : 'Show less') : (isTurkish ? 'Devamını oku' : 'Read more')}
                        </react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>

                {/* Features */}
                <react_native_1.View style={styles.section}>
                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Neler Dahil?' : "What's Included?"}</react_native_1.Text>
                    <react_native_1.View style={styles.featuresList}>
                        {course.features.map((feature, i) => (<react_native_1.View key={i} style={styles.featureItem}>
                                <react_native_1.View style={styles.featureCheck}>
                                    <vector_icons_1.Ionicons name="checkmark" size={14} color={colors.textInverse}/>
                                </react_native_1.View>
                                <react_native_1.Text style={styles.featureText}>{feature}</react_native_1.Text>
                            </react_native_1.View>))}
                    </react_native_1.View>
                </react_native_1.View>

                {/* Schedule */}
                <react_native_1.View style={styles.section}>
                    <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Program İçeriği' : 'Course Schedule'}</react_native_1.Text>
                    <react_native_1.View style={styles.scheduleList}>
                        {scheduleItems.map((item, i) => (<react_native_1.View key={i} style={styles.scheduleItem}>
                                <react_native_1.View style={styles.scheduleTimeline}>
                                    <react_native_1.View style={styles.scheduleDot}/>
                                    {i < scheduleItems.length - 1 && <react_native_1.View style={styles.scheduleLine}/>}
                                </react_native_1.View>
                                <react_native_1.View style={styles.scheduleContent}>
                                    <react_native_1.Text style={styles.scheduleWeek}>{item.week}</react_native_1.Text>
                                    <react_native_1.Text style={styles.scheduleTopic}>{item.topic}</react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>))}
                    </react_native_1.View>
                </react_native_1.View>

                {/* Reviews */}
                <react_native_1.View style={styles.section}>
                    <react_native_1.View style={styles.sectionHeader}>
                        <react_native_1.Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{isTurkish ? 'Değerlendirmeler' : 'Reviews'}</react_native_1.Text>
                    </react_native_1.View>

                    {/* Rating Summary Card */}
                    <react_native_1.View style={styles.ratingSummaryCard}>
                        <react_native_1.View style={styles.ratingSummaryLeft}>
                            <react_native_1.Text style={styles.ratingSummaryBig}>{courseRating.toFixed(1)}</react_native_1.Text>
                            <react_native_1.View style={styles.ratingSummaryStars}>{renderStar(courseRating)}</react_native_1.View>
                            <react_native_1.Text style={styles.ratingSummaryCount}>
                                {courseReviewCount} {isTurkish ? 'değerlendirme' : 'reviews'}
                            </react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.ratingSummaryRight}>
                            {ratingDistribution.map((rd) => (<react_native_1.View key={rd.stars} style={styles.ratingBarRow}>
                                    <react_native_1.Text style={styles.ratingBarLabel}>{rd.stars}</react_native_1.Text>
                                    <vector_icons_1.Ionicons name="star" size={10} color={colors.warning}/>
                                    <react_native_1.View style={styles.ratingBarTrack}>
                                        <react_native_1.View style={[styles.ratingBarFill, { width: `${rd.pct}%` }]}/>
                                    </react_native_1.View>
                                    <react_native_1.Text style={styles.ratingBarPct}>{rd.pct}%</react_native_1.Text>
                                </react_native_1.View>))}
                        </react_native_1.View>
                    </react_native_1.View>

                    {/* Write Review Button */}
                    <react_native_1.TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowReviewModal(true)}>
                        <vector_icons_1.Ionicons name="create-outline" size={18} color={colors.primary}/>
                        <react_native_1.Text style={styles.writeReviewBtnText}>
                            {isTurkish ? 'Yorum Yaz & Puanla' : 'Write a Review & Rate'}
                        </react_native_1.Text>
                        <vector_icons_1.Ionicons name="chevron-forward" size={16} color={colors.textTertiary}/>
                    </react_native_1.TouchableOpacity>

                    {/* User-submitted reviews */}
                    {courseReviews.map((review, i) => (<react_native_1.View key={`user-${i}`} style={[styles.reviewCard, review.isNew && styles.reviewCardNew]}>
                            <react_native_1.View style={styles.reviewHeader}>
                                <react_native_1.View style={[styles.reviewAvatar, { backgroundColor: colors.primarySoft }]}>
                                    <react_native_1.Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.reviewInfo}>
                                    <react_native_1.View style={styles.reviewNameRow}>
                                        <react_native_1.Text style={styles.reviewName}>{review.name}</react_native_1.Text>
                                        {review.isNew && (<react_native_1.View style={styles.newBadge}>
                                                <react_native_1.Text style={styles.newBadgeText}>{isTurkish ? 'Yeni' : 'New'}</react_native_1.Text>
                                            </react_native_1.View>)}
                                    </react_native_1.View>
                                    <react_native_1.View style={styles.reviewStars}>
                                        {Array.from({ length: 5 }, (_, j) => (<vector_icons_1.Ionicons key={j} name={j < review.rating ? 'star' : 'star-outline'} size={12} color={colors.warning}/>))}
                                        <react_native_1.Text style={styles.reviewDate}>{review.date}</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.reviewText}>{review.text}</react_native_1.Text>
                        </react_native_1.View>))}

                    {/* Existing mock reviews */}
                    {reviews.map((review, i) => (<react_native_1.View key={i} style={styles.reviewCard}>
                            <react_native_1.View style={styles.reviewHeader}>
                                <react_native_1.View style={styles.reviewAvatar}>
                                    <react_native_1.Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</react_native_1.Text>
                                </react_native_1.View>
                                <react_native_1.View style={styles.reviewInfo}>
                                    <react_native_1.Text style={styles.reviewName}>{review.name}</react_native_1.Text>
                                    <react_native_1.View style={styles.reviewStars}>
                                        {Array.from({ length: 5 }, (_, i) => (<vector_icons_1.Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={12} color={colors.warning}/>))}
                                        <react_native_1.Text style={styles.reviewDate}>{review.date}</react_native_1.Text>
                                    </react_native_1.View>
                                </react_native_1.View>
                            </react_native_1.View>
                            <react_native_1.Text style={styles.reviewText}>{review.text}</react_native_1.Text>
                        </react_native_1.View>))}
                </react_native_1.View>

                {/* Spacer for bottom button */}
                <react_native_1.View style={{ height: 100 }}/>
            </react_native_1.ScrollView>

            {/* Write Review Modal */}
            <react_native_1.Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
                <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <react_native_1.TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReviewModal(false)}>
                        <react_native_1.TouchableOpacity activeOpacity={1} style={styles.reviewModalContent}>
                            <react_native_1.View style={styles.reviewModalHandle}/>

                            <react_native_1.Text style={styles.reviewModalTitle}>
                                {isTurkish ? 'Değerlendirmenizi Yazın' : 'Write Your Review'}
                            </react_native_1.Text>
                            <react_native_1.Text style={styles.reviewModalSubtitle}>
                                {isTurkish
            ? `${professionalName} - ${course.title}`
            : `${professionalName} - ${course.title}`}
                            </react_native_1.Text>

                            {/* Star Selection */}
                            <react_native_1.View style={styles.starSelectionContainer}>
                                <react_native_1.Text style={styles.starSelectionLabel}>
                                    {isTurkish ? 'Puanınız' : 'Your Rating'}
                                </react_native_1.Text>
                                <react_native_1.View style={styles.starSelectionRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (<react_native_1.TouchableOpacity key={star} onPress={() => setUserRating(star)} style={styles.starTouchable}>
                                            <vector_icons_1.Ionicons name={star <= userRating ? 'star' : 'star-outline'} size={36} color={star <= userRating ? colors.warning : colors.borderLight}/>
                                        </react_native_1.TouchableOpacity>))}
                                </react_native_1.View>
                                {userRating > 0 && (<react_native_1.Text style={styles.starSelectionText}>
                                        {userRating === 5 ? (isTurkish ? 'Mükemmel!' : 'Excellent!')
                : userRating === 4 ? (isTurkish ? 'Çok İyi' : 'Very Good')
                    : userRating === 3 ? (isTurkish ? 'İyi' : 'Good')
                        : userRating === 2 ? (isTurkish ? 'Orta' : 'Fair')
                            : (isTurkish ? 'Kötü' : 'Poor')}
                                    </react_native_1.Text>)}
                            </react_native_1.View>

                            {/* Review Text */}
                            <react_native_1.TextInput style={styles.reviewInput} placeholder={isTurkish ? 'Deneyiminizi paylaşın...' : 'Share your experience...'} placeholderTextColor={colors.textTertiary} multiline numberOfLines={4} textAlignVertical="top" value={reviewText} onChangeText={setReviewText}/>

                            {/* Submit */}
                            <react_native_1.View style={styles.reviewModalButtons}>
                                <react_native_1.TouchableOpacity style={styles.reviewCancelBtn} onPress={() => { setShowReviewModal(false); setUserRating(0); setReviewText(''); }}>
                                    <react_native_1.Text style={styles.reviewCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>
                                <react_native_1.TouchableOpacity style={[styles.reviewSubmitBtn, userRating === 0 && { opacity: 0.5 }]} onPress={handleSubmitReview} disabled={userRating === 0}>
                                    <vector_icons_1.Ionicons name="send" size={16} color="#fff"/>
                                    <react_native_1.Text style={styles.reviewSubmitText}>{isTurkish ? 'Gönder' : 'Submit'}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>
                            </react_native_1.View>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.TouchableOpacity>
                </react_native_1.KeyboardAvoidingView>
            </react_native_1.Modal>

            {/* Fixed Bottom CTA */}
            <react_native_1.View style={[styles.bottomCTA, { paddingBottom: insets.bottom > 0 ? insets.bottom : theme_1.SPACING.lg }]}>
                <react_native_1.View style={styles.bottomPriceSection}>
                    <react_native_1.Text style={styles.bottomPriceLabel}>{isTurkish ? 'Toplam' : 'Total'}</react_native_1.Text>
                    <react_native_1.Text style={styles.bottomPriceValue}>{course.currency}{course.price.toLocaleString()}</react_native_1.Text>
                </react_native_1.View>
                <AnimatedButton_1.default title={isFull ? (isTurkish ? 'Bekleme Listesi' : 'Join Waitlist') : (isTurkish ? 'Kayıt Ol' : 'Enroll Now')} onPress={handleEnroll} size="large" style={styles.enrollButton}/>
            </react_native_1.View>
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
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    shareBtn: {
        padding: theme_1.SPACING.sm,
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    heroContainer: {
        marginHorizontal: theme_1.SPACING.lg,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: theme_1.SPACING.lg,
    },
    heroGradient: {
        padding: theme_1.SPACING.xl,
        minHeight: 180,
        justifyContent: 'flex-end',
    },
    heroContent: {},
    heroBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: theme_1.SPACING.md,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 4,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroBadgeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: '#fff', fontWeight: '700', fontSize: 11 }),
    heroTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: '#fff', fontSize: 22, marginBottom: theme_1.SPACING.sm }),
    heroMeta: {
        flexDirection: 'row',
        gap: theme_1.SPACING.lg,
    },
    heroMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroMetaText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: 'rgba(255,255,255,0.85)', fontWeight: '600' }),
    priceCard: {
        marginHorizontal: theme_1.SPACING.lg,
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        padding: theme_1.SPACING.lg,
        marginBottom: theme_1.SPACING.lg,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    priceLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, marginBottom: 4 }),
    priceValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text, fontSize: 28, fontWeight: '800' }),
    spotsContainer: {
        alignItems: 'center',
    },
    spotsValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { fontWeight: '800' }),
    spotsLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    enrollmentBar: {
        height: 6,
        backgroundColor: colors.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    enrollmentFill: {
        height: '100%',
        borderRadius: 3,
    },
    enrollmentLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, textAlign: 'center' }),
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.lg,
    },
    infoItem: {
        width: (SCREEN_WIDTH - theme_1.SPACING.lg * 2 - theme_1.SPACING.sm) / 2,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: theme_1.BORDER_RADIUS.md,
        padding: theme_1.SPACING.md,
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.sm,
    },
    infoLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginBottom: 2 }),
    infoValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.text, textAlign: 'center' }),
    section: {
        marginHorizontal: theme_1.SPACING.lg,
        marginBottom: theme_1.SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, fontSize: 17, marginBottom: theme_1.SPACING.md }),
    descriptionText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, lineHeight: 22 }),
    readMore: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, marginTop: theme_1.SPACING.sm }),
    featuresList: {
        gap: theme_1.SPACING.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.sm,
    },
    featureCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, flex: 1 }),
    scheduleList: {
        gap: 0,
    },
    scheduleItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    scheduleTimeline: {
        width: 24,
        alignItems: 'center',
    },
    scheduleDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        marginTop: 4,
    },
    scheduleLine: {
        width: 2,
        flex: 1,
        backgroundColor: colors.borderLight,
        marginTop: 4,
    },
    scheduleContent: {
        flex: 1,
        marginLeft: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.lg,
    },
    scheduleWeek: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, marginBottom: 4 }),
    scheduleTopic: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary }),
    overallRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    overallRatingValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    overallRatingStars: {
        flexDirection: 'row',
        gap: 1,
    },
    overallRatingCount: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
        padding: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.sm,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAvatarText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary }),
    reviewInfo: {
        marginLeft: theme_1.SPACING.sm,
        flex: 1,
    },
    reviewName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.text }),
    reviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
        marginTop: 2,
    },
    reviewDate: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginLeft: theme_1.SPACING.sm }),
    reviewText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, lineHeight: 18 }),
    bottomCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: theme_1.SPACING.md,
    },
    bottomPriceSection: {
        flex: 0.4,
    },
    bottomPriceLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    bottomPriceValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, fontWeight: '800' }),
    enrollButton: {
        flex: 0.6,
    },
    // Rating Summary Card
    ratingSummaryCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        padding: theme_1.SPACING.lg,
        marginBottom: theme_1.SPACING.md,
        gap: theme_1.SPACING.lg,
    },
    ratingSummaryLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0.35,
    },
    ratingSummaryBig: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.text, fontSize: 40, fontWeight: '800', lineHeight: 44 }),
    ratingSummaryStars: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 4,
        marginBottom: 4,
    },
    ratingSummaryCount: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    ratingSummaryRight: {
        flex: 0.65,
        justifyContent: 'center',
        gap: 4,
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingBarLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, width: 10, textAlign: 'right', fontWeight: '600' }),
    ratingBarTrack: {
        flex: 1,
        height: 6,
        backgroundColor: colors.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    ratingBarFill: {
        height: '100%',
        backgroundColor: colors.warning,
        borderRadius: 3,
    },
    ratingBarPct: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, width: 30, textAlign: 'right', fontSize: 10 }),
    // Write Review Button
    writeReviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        borderRadius: theme_1.BORDER_RADIUS.md,
        paddingVertical: theme_1.SPACING.md,
        paddingHorizontal: theme_1.SPACING.lg,
        marginBottom: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    writeReviewBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, flex: 1 }),
    reviewCardNew: {
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    reviewNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.sm,
    },
    newBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: theme_1.BORDER_RADIUS.pill,
    },
    newBadgeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textInverse, fontWeight: '700', fontSize: 9 }),
    // Review Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    reviewModalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: theme_1.SPACING.xl,
        paddingBottom: theme_1.SPACING.xxxl,
        paddingTop: theme_1.SPACING.md,
    },
    reviewModalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.borderLight,
        alignSelf: 'center',
        marginBottom: theme_1.SPACING.lg,
    },
    reviewModalTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, textAlign: 'center', marginBottom: 4 }),
    reviewModalSubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, textAlign: 'center', marginBottom: theme_1.SPACING.xl }),
    starSelectionContainer: {
        alignItems: 'center',
        marginBottom: theme_1.SPACING.xl,
    },
    starSelectionLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary, marginBottom: theme_1.SPACING.md }),
    starSelectionRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.md,
    },
    starTouchable: {
        padding: 4,
    },
    starSelectionText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.warning, marginTop: theme_1.SPACING.sm }),
    reviewInput: Object.assign(Object.assign({ backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, padding: theme_1.SPACING.md }, theme_1.TYPOGRAPHY.body), { color: colors.text, height: 100, borderWidth: 1, borderColor: colors.borderLight, marginBottom: theme_1.SPACING.lg }),
    reviewModalButtons: {
        flexDirection: 'row',
        gap: theme_1.SPACING.md,
    },
    reviewCancelBtn: {
        flex: 1,
        paddingVertical: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        alignItems: 'center',
    },
    reviewCancelText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.textSecondary }),
    reviewSubmitBtn: {
        flex: 1.5,
        flexDirection: 'row',
        paddingVertical: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme_1.SPACING.sm,
    },
    reviewSubmitText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#fff' }),
});
exports.default = CourseDetailScreen;
