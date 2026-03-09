import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CourseDetailScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { course, professionalName } = route.params || {};
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const { showAlert, AlertComponent } = useAlert();
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [courseReviews, setCourseReviews] = useState<any[]>([]);
    const [courseRating, setCourseRating] = useState(course?.rating || 0);
    const [courseReviewCount, setCourseReviewCount] = useState(course?.reviews || 0);

    if (!course) {
        return (
            <View style={[COMMON_STYLES.screenContainer, COMMON_STYLES.center]}>
                <Text style={{ color: colors.textSecondary }}>{isTurkish ? 'Eğitim bulunamadı' : 'Course not found'}</Text>
            </View>
        );
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
        setCourseReviews((prev: any[]) => [newReview, ...prev]);
        // Update overall rating
        const allReviews = [newReview, ...reviews, ...courseReviews];
        const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
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

    const renderStar = (rating: number) =>
        Array.from({ length: 5 }, (_, i) => (
            <Ionicons
                key={i}
                name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
                size={16}
                color={colors.warning}
            />
        ));

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

    return (
        <View style={[COMMON_STYLES.screenContainer, { paddingTop: insets.top }]}>
            <AlertComponent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Eğitim Detayı' : 'Course Detail'}</Text>
                <TouchableOpacity style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Gradient */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={isTrainer ? ['#4F46E5', '#6366F1', '#818CF8'] : ['#059669', '#10B981', '#34D399']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.heroBadges}>
                                <View style={styles.heroBadge}>
                                    <Text style={styles.heroBadgeText}>{course.level}</Text>
                                </View>
                                <View style={styles.heroBadge}>
                                    <Ionicons name={isTrainer ? 'barbell-outline' : 'leaf-outline'} size={12} color="#fff" />
                                    <Text style={styles.heroBadgeText}>
                                        {isTrainer ? (isTurkish ? 'Fitness' : 'Fitness') : (isTurkish ? 'Beslenme' : 'Nutrition')}
                                    </Text>
                                </View>
                                <View style={styles.heroBadge}>
                                    <Ionicons name="location-outline" size={12} color="#fff" />
                                    <Text style={styles.heroBadgeText}>{course.location}</Text>
                                </View>
                            </View>
                            <Text style={styles.heroTitle}>{course.title}</Text>
                            <View style={styles.heroMeta}>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.heroMetaText}>{professionalName}</Text>
                                </View>
                                <View style={styles.heroMetaItem}>
                                    <Ionicons name="star" size={14} color="#FFC800" />
                                    <Text style={styles.heroMetaText}>{course.rating.toFixed(1)} ({course.reviews})</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Price & Enrollment Card */}
                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.priceLabel}>{isTurkish ? 'Kurs Ücreti' : 'Course Fee'}</Text>
                            <Text style={styles.priceValue}>{course.currency}{course.price.toLocaleString()}</Text>
                        </View>
                        <View style={styles.spotsContainer}>
                            {!isFull ? (
                                <>
                                    <Text style={[styles.spotsValue, { color: spotsLeft <= 3 ? colors.error : colors.success }]}>
                                        {spotsLeft}
                                    </Text>
                                    <Text style={styles.spotsLabel}>
                                        {isTurkish ? 'kontenjan kaldı' : 'spots left'}
                                    </Text>
                                </>
                            ) : (
                                <Text style={[styles.spotsValue, { color: colors.error }]}>
                                    {isTurkish ? 'Dolu' : 'Full'}
                                </Text>
                            )}
                        </View>
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
                    <Text style={styles.enrollmentLabel}>
                        {course.enrolled}/{course.maxStudents} {isTurkish ? 'kayıtlı' : 'enrolled'}
                    </Text>
                </View>

                {/* Quick Info Grid */}
                <View style={styles.infoGrid}>
                    {[
                        { icon: 'time-outline' as const, label: isTurkish ? 'Süre' : 'Duration', value: course.duration },
                        { icon: 'calendar-outline' as const, label: isTurkish ? 'Ders Sayısı' : 'Sessions', value: `${course.sessions}` },
                        { icon: 'location-outline' as const, label: isTurkish ? 'Şehir' : 'City', value: course.city },
                        { icon: 'alarm-outline' as const, label: isTurkish ? 'Program' : 'Schedule', value: course.schedule },
                    ].map((info, i) => (
                        <View key={i} style={styles.infoItem}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name={info.icon} size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>{info.label}</Text>
                            <Text style={styles.infoValue}>{info.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isTurkish ? 'Açıklama' : 'Description'}</Text>
                    <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 3}>
                        {course.description}
                    </Text>
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.readMore}>
                            {showFullDesc ? (isTurkish ? 'Daha az göster' : 'Show less') : (isTurkish ? 'Devamını oku' : 'Read more')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isTurkish ? 'Neler Dahil?' : "What's Included?"}</Text>
                    <View style={styles.featuresList}>
                        {course.features.map((feature: string, i: number) => (
                            <View key={i} style={styles.featureItem}>
                                <View style={styles.featureCheck}>
                                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Schedule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isTurkish ? 'Program İçeriği' : 'Course Schedule'}</Text>
                    <View style={styles.scheduleList}>
                        {scheduleItems.map((item, i) => (
                            <View key={i} style={styles.scheduleItem}>
                                <View style={styles.scheduleTimeline}>
                                    <View style={styles.scheduleDot} />
                                    {i < scheduleItems.length - 1 && <View style={styles.scheduleLine} />}
                                </View>
                                <View style={styles.scheduleContent}>
                                    <Text style={styles.scheduleWeek}>{item.week}</Text>
                                    <Text style={styles.scheduleTopic}>{item.topic}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Reviews */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{isTurkish ? 'Değerlendirmeler' : 'Reviews'}</Text>
                    </View>

                    {/* Rating Summary Card */}
                    <View style={styles.ratingSummaryCard}>
                        <View style={styles.ratingSummaryLeft}>
                            <Text style={styles.ratingSummaryBig}>{courseRating.toFixed(1)}</Text>
                            <View style={styles.ratingSummaryStars}>{renderStar(courseRating)}</View>
                            <Text style={styles.ratingSummaryCount}>
                                {courseReviewCount} {isTurkish ? 'değerlendirme' : 'reviews'}
                            </Text>
                        </View>
                        <View style={styles.ratingSummaryRight}>
                            {ratingDistribution.map((rd) => (
                                <View key={rd.stars} style={styles.ratingBarRow}>
                                    <Text style={styles.ratingBarLabel}>{rd.stars}</Text>
                                    <Ionicons name="star" size={10} color={colors.warning} />
                                    <View style={styles.ratingBarTrack}>
                                        <View style={[styles.ratingBarFill, { width: `${rd.pct}%` }]} />
                                    </View>
                                    <Text style={styles.ratingBarPct}>{rd.pct}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Write Review Button */}
                    <TouchableOpacity
                        style={styles.writeReviewBtn}
                        onPress={() => setShowReviewModal(true)}
                    >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                        <Text style={styles.writeReviewBtnText}>
                            {isTurkish ? 'Yorum Yaz & Puanla' : 'Write a Review & Rate'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>

                    {/* User-submitted reviews */}
                    {courseReviews.map((review: any, i: number) => (
                        <View key={`user-${i}`} style={[styles.reviewCard, review.isNew && styles.reviewCardNew]}>
                            <View style={styles.reviewHeader}>
                                <View style={[styles.reviewAvatar, { backgroundColor: colors.primarySoft }]}>
                                    <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
                                </View>
                                <View style={styles.reviewInfo}>
                                    <View style={styles.reviewNameRow}>
                                        <Text style={styles.reviewName}>{review.name}</Text>
                                        {review.isNew && (
                                            <View style={styles.newBadge}>
                                                <Text style={styles.newBadgeText}>{isTurkish ? 'Yeni' : 'New'}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.reviewStars}>
                                        {Array.from({ length: 5 }, (_, j) => (
                                            <Ionicons key={j} name={j < review.rating ? 'star' : 'star-outline'} size={12} color={colors.warning} />
                                        ))}
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.reviewText}>{review.text}</Text>
                        </View>
                    ))}

                    {/* Existing mock reviews */}
                    {reviews.map((review, i) => (
                        <View key={i} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewAvatar}>
                                    <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
                                </View>
                                <View style={styles.reviewInfo}>
                                    <Text style={styles.reviewName}>{review.name}</Text>
                                    <View style={styles.reviewStars}>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={12} color={colors.warning} />
                                        ))}
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.reviewText}>{review.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Spacer for bottom button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Write Review Modal */}
            <Modal
                visible={showReviewModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReviewModal(false)}>
                        <TouchableOpacity activeOpacity={1} style={styles.reviewModalContent}>
                            <View style={styles.reviewModalHandle} />

                            <Text style={styles.reviewModalTitle}>
                                {isTurkish ? 'Değerlendirmenizi Yazın' : 'Write Your Review'}
                            </Text>
                            <Text style={styles.reviewModalSubtitle}>
                                {isTurkish
                                    ? `${professionalName} - ${course.title}`
                                    : `${professionalName} - ${course.title}`}
                            </Text>

                            {/* Star Selection */}
                            <View style={styles.starSelectionContainer}>
                                <Text style={styles.starSelectionLabel}>
                                    {isTurkish ? 'Puanınız' : 'Your Rating'}
                                </Text>
                                <View style={styles.starSelectionRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setUserRating(star)}
                                            style={styles.starTouchable}
                                        >
                                            <Ionicons
                                                name={star <= userRating ? 'star' : 'star-outline'}
                                                size={36}
                                                color={star <= userRating ? colors.warning : colors.borderLight}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {userRating > 0 && (
                                    <Text style={styles.starSelectionText}>
                                        {userRating === 5 ? (isTurkish ? 'Mükemmel!' : 'Excellent!')
                                            : userRating === 4 ? (isTurkish ? 'Çok İyi' : 'Very Good')
                                                : userRating === 3 ? (isTurkish ? 'İyi' : 'Good')
                                                    : userRating === 2 ? (isTurkish ? 'Orta' : 'Fair')
                                                        : (isTurkish ? 'Kötü' : 'Poor')}
                                    </Text>
                                )}
                            </View>

                            {/* Review Text */}
                            <TextInput
                                style={styles.reviewInput}
                                placeholder={isTurkish ? 'Deneyiminizi paylaşın...' : 'Share your experience...'}
                                placeholderTextColor={colors.textTertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={reviewText}
                                onChangeText={setReviewText}
                            />

                            {/* Submit */}
                            <View style={styles.reviewModalButtons}>
                                <TouchableOpacity
                                    style={styles.reviewCancelBtn}
                                    onPress={() => { setShowReviewModal(false); setUserRating(0); setReviewText(''); }}
                                >
                                    <Text style={styles.reviewCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.reviewSubmitBtn, userRating === 0 && { opacity: 0.5 }]}
                                    onPress={handleSubmitReview}
                                    disabled={userRating === 0}
                                >
                                    <Ionicons name="send" size={16} color="#fff" />
                                    <Text style={styles.reviewSubmitText}>{isTurkish ? 'Gönder' : 'Submit'}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Fixed Bottom CTA */}
            <View style={[styles.bottomCTA, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.lg }]}>
                <View style={styles.bottomPriceSection}>
                    <Text style={styles.bottomPriceLabel}>{isTurkish ? 'Toplam' : 'Total'}</Text>
                    <Text style={styles.bottomPriceValue}>{course.currency}{course.price.toLocaleString()}</Text>
                </View>
                <AnimatedButton
                    title={isFull ? (isTurkish ? 'Bekleme Listesi' : 'Join Waitlist') : (isTurkish ? 'Kayıt Ol' : 'Enroll Now')}
                    onPress={handleEnroll}
                    size="large"
                    style={styles.enrollButton}
                />
            </View>
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
    headerTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
    },
    shareBtn: {
        padding: SPACING.sm,
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    heroContainer: {
        marginHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    heroGradient: {
        padding: SPACING.xl,
        minHeight: 180,
        justifyContent: 'flex-end',
    },
    heroContent: {},
    heroBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: SPACING.md,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.pill,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroBadgeText: {
        ...TYPOGRAPHY.small,
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    heroTitle: {
        ...TYPOGRAPHY.h2,
        color: '#fff',
        fontSize: 22,
        marginBottom: SPACING.sm,
    },
    heroMeta: {
        flexDirection: 'row',
        gap: SPACING.lg,
    },
    heroMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroMetaText: {
        ...TYPOGRAPHY.small,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    priceCard: {
        marginHorizontal: SPACING.lg,
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    priceLabel: {
        ...TYPOGRAPHY.caption,
        color: colors.textTertiary,
        marginBottom: 4,
    },
    priceValue: {
        ...TYPOGRAPHY.h2,
        color: colors.text,
        fontSize: 28,
        fontWeight: '800',
    },
    spotsContainer: {
        alignItems: 'center',
    },
    spotsValue: {
        ...TYPOGRAPHY.h3,
        fontWeight: '800',
    },
    spotsLabel: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
    },
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
    enrollmentLabel: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: SPACING.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    infoItem: {
        width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    infoLabel: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        marginBottom: 2,
    },
    infoValue: {
        ...TYPOGRAPHY.captionBold,
        color: colors.text,
        textAlign: 'center',
    },
    section: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: colors.text,
        fontSize: 17,
        marginBottom: SPACING.md,
    },
    descriptionText: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    readMore: {
        ...TYPOGRAPHY.captionBold,
        color: colors.primary,
        marginTop: SPACING.sm,
    },
    featuresList: {
        gap: SPACING.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    featureCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        ...TYPOGRAPHY.body,
        color: colors.text,
        flex: 1,
    },
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
        marginLeft: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    scheduleWeek: {
        ...TYPOGRAPHY.captionBold,
        color: colors.primary,
        marginBottom: 4,
    },
    scheduleTopic: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
    },
    overallRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    overallRatingValue: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
    },
    overallRatingStars: {
        flexDirection: 'row',
        gap: 1,
    },
    overallRatingCount: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
    },
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAvatarText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.primary,
    },
    reviewInfo: {
        marginLeft: SPACING.sm,
        flex: 1,
    },
    reviewName: {
        ...TYPOGRAPHY.captionBold,
        color: colors.text,
    },
    reviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
        marginTop: 2,
    },
    reviewDate: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        marginLeft: SPACING.sm,
    },
    reviewText: {
        ...TYPOGRAPHY.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    bottomCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: SPACING.md,
    },
    bottomPriceSection: {
        flex: 0.4,
    },
    bottomPriceLabel: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
    },
    bottomPriceValue: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
        fontWeight: '800',
    },
    enrollButton: {
        flex: 0.6,
    },
    // Rating Summary Card
    ratingSummaryCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        gap: SPACING.lg,
    },
    ratingSummaryLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0.35,
    },
    ratingSummaryBig: {
        ...TYPOGRAPHY.h1,
        color: colors.text,
        fontSize: 40,
        fontWeight: '800',
        lineHeight: 44,
    },
    ratingSummaryStars: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 4,
        marginBottom: 4,
    },
    ratingSummaryCount: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
    },
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
    ratingBarLabel: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        width: 10,
        textAlign: 'right',
        fontWeight: '600',
    },
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
    ratingBarPct: {
        ...TYPOGRAPHY.small,
        color: colors.textTertiary,
        width: 30,
        textAlign: 'right',
        fontSize: 10,
    },
    // Write Review Button
    writeReviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    writeReviewBtnText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.primary,
        flex: 1,
    },
    reviewCardNew: {
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    reviewNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    newBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: BORDER_RADIUS.pill,
    },
    newBadgeText: {
        ...TYPOGRAPHY.small,
        color: colors.textInverse,
        fontWeight: '700',
        fontSize: 9,
    },
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
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxxl,
        paddingTop: SPACING.md,
    },
    reviewModalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.borderLight,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    reviewModalTitle: {
        ...TYPOGRAPHY.h3,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    reviewModalSubtitle: {
        ...TYPOGRAPHY.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    starSelectionContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    starSelectionLabel: {
        ...TYPOGRAPHY.captionBold,
        color: colors.textSecondary,
        marginBottom: SPACING.md,
    },
    starSelectionRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    starTouchable: {
        padding: 4,
    },
    starSelectionText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.warning,
        marginTop: SPACING.sm,
    },
    reviewInput: {
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        ...TYPOGRAPHY.body,
        color: colors.text,
        height: 100,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: SPACING.lg,
    },
    reviewModalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    reviewCancelBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        alignItems: 'center',
    },
    reviewCancelText: {
        ...TYPOGRAPHY.captionBold,
        color: colors.textSecondary,
    },
    reviewSubmitBtn: {
        flex: 1.5,
        flexDirection: 'row',
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    reviewSubmitText: {
        ...TYPOGRAPHY.captionBold,
        color: '#fff',
    },
});

export default CourseDetailScreen;
