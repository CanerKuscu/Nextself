import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from '../hooks/useTranslation';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useAlert } from '../components/CustomAlert';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';

// window width not required currently

const isTrainerType = (type?: string) => {
  if (!type) return false;
  const normalized = type.toLowerCase();
  return normalized === 'trainer' || normalized === 'pt';
};

const ProfessionalSearchScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'trainer' | 'dietitian'>('all');
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'city'>('rating');

  const { isTurkish, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  const isRussian = language === 'ru';
  const labels = useMemo(() => ({
    profile: isTurkish ? 'Profili İncele' : isRussian ? 'Профиль' : 'View Profile',
    courses: isTurkish ? 'Programlar' : isRussian ? 'Программы' : 'Programs',
    connect: isTurkish ? 'Bağlan' : isRussian ? 'Связаться' : 'Connect',
    noResults: isTurkish ? 'Sonuç Bulunamadı' : isRussian ? 'Ничего не найдено' : 'No Results Found',
    noResultsSub: isTurkish ? 'Filtreleri değiştirip tekrar deneyin.' : isRussian ? 'Измените фильтры и попробуйте снова.' : 'Try changing filters.',
  }), [isTurkish, isRussian]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfessionals();
    }, 500);
    return () => clearTimeout(timer);
  }, [filter, country, city, district]);

  // Re-sort existing data when sortBy changes (no re-fetch needed)
  useEffect(() => {
    if (professionals.length === 0) return;
    setProfessionals(prev => [...prev].sort((a, b) => {
      if (sortBy === 'rating') {
        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      }
      if (sortBy === 'city') {
        const cityA = a.city || '';
        const cityB = b.city || '';
        return cityA.localeCompare(cityB);
      }
      // sortBy === 'name'
      return (a.users?.first_name || '').localeCompare(b.users?.first_name || '');
    }));
  }, [sortBy]);

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      const supabase = SupabaseService.getInstance();
      const type = filter === 'all' ? undefined : filter === 'trainer' ? 'pt' : filter;
      const { data } = await supabase.getProfessionalsByCity(
        city.trim() || undefined,
        district.trim() || undefined,
        type,
        country.trim() || undefined
      );
      if (data) {
        const sorted = [...data].sort((a, b) => {
          if (sortBy === 'rating') {
            // Primary: rating desc, secondary: review count desc
            const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (b.total_reviews || 0) - (a.total_reviews || 0);
          }
          if (sortBy === 'city') {
            const cityA = a.city || '';
            const cityB = b.city || '';
            return cityA.localeCompare(cityB);
          }
          // sortBy === 'name'
          return (a.users?.first_name || '').localeCompare(b.users?.first_name || '');
        });
        setProfessionals(sorted);
      }
    } catch (err) {
      console.error('Load professionals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number, rating: number, reviewCount: number) => {
    // Theme-aware colors
    const gold = '#F59E0B';
    const goldBg = isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7';
    const silver = isDark ? '#9CA3AF' : '#6B7280';
    const silverBg = isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6';
    const bronze = '#B45309'; // Keep bronze dark, maybe lighter in dark mode?
    const bronzeText = isDark ? '#D97706' : '#B45309';
    const bronzeBg = isDark ? 'rgba(180, 83, 9, 0.2)' : '#FFF7ED';
    const red = '#EF4444';
    const redBg = isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2';

    if (index === 0 && rating >= 4.5 && reviewCount >= 10) {
      return { icon: 'trophy' as const, label: isTurkish ? '1. Sıra' : '#1 Rated', color: gold, bg: goldBg };
    }
    if (index === 1 && rating >= 4.5 && reviewCount >= 5) {
      return { icon: 'medal-outline' as const, label: isTurkish ? '2. Sıra' : '#2 Rated', color: silver, bg: silverBg };
    }
    if (index === 2 && rating >= 4.0 && reviewCount >= 5) {
      return { icon: 'medal-outline' as const, label: isTurkish ? '3. Sıra' : '#3 Rated', color: bronzeText, bg: bronzeBg };
    }
    if (rating >= 4.8 && reviewCount >= 20) {
      return { icon: 'star' as const, label: isTurkish ? 'Top Rated' : 'Top Rated', color: gold, bg: goldBg };
    }
    if (reviewCount >= 30) {
      return { icon: 'flame' as const, label: isTurkish ? 'Popüler' : 'Popular', color: red, bg: redBg };
    }
    return null;
  };

  const renderStar = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={14}
        color={colors.warning}
      />
    ));
  };

  const handleConnect = async (professionalUserId: string, professionalProfileId: string) => {
    try {
      const supabase = SupabaseService.getInstance();
      const { user } = await supabase.getCurrentUser();

      if (!user) {
        showAlert({ type: 'warning', title: isTurkish ? 'Uyarı' : 'Warning', message: isTurkish ? 'Bağlanmak için giriş yapmalısınız.' : 'You must be logged in to connect.', buttons: [{ text: 'OK' }] });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.connectWithProfessional(user.id, professionalUserId, professionalProfileId);
      if (error) throw error;

      if (data?.chatId) {
        showAlert({
          type: 'success',
          title: isTurkish ? 'Bağlantı Kuruldu!' : 'Connected!',
          message: isTurkish ? 'Mesajlarınıza yönlendirileceksiniz.' : 'You will be redirected to messages.',
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (err) {
      console.error('Connection error:', err);
      showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Bağlantı kurulamadı.' : 'Failed to connect.', buttons: [{ text: 'OK' }] });
    } finally {
      loadProfessionals();
    }
  };

  const getSpecializations = (type: string, rowSpecialties?: string[]) => {
    if (Array.isArray(rowSpecialties) && rowSpecialties.length > 0) return rowSpecialties;
    if (isTrainerType(type)) {
      return isTurkish
        ? ['Kuvvet', 'HIIT', 'Fonksiyonel', 'Mobility']
        : isRussian
          ? ['Сила', 'HIIT', 'Функционал', 'Мобилити']
          : ['Strength', 'HIIT', 'Functional', 'Mobility'];
    }
    return isTurkish
      ? ['Kilo Yönetimi', 'Sporcu Beslenmesi', 'Klinik']
      : isRussian
        ? ['Контроль веса', 'Спорт питание', 'Клиническое']
        : ['Weight Mgmt', 'Sports Nutrition', 'Clinical'];
  };

  const renderProfessional = useCallback(({ item, index }: { item: any, index: number }) => {
    const isTrainer = isTrainerType(item.professional_type);
    const specializations = getSpecializations(item.professional_type, item.specialties || item.users?.specialties);
    const shownSpecs = specializations.slice(0, 4);
    const rankBadge = sortBy === 'rating' ? getRankBadge(index, item.average_rating || 0, item.total_reviews || 0) : null;
    const totalClients = Number(item.total_clients ?? item.active_clients ?? 0);
    const totalExperience = Number(item.experience ?? item.experience_years ?? 0);
    const totalCourses = Number(item.courses_count ?? 0);

    return (
      <AnimatedCard delay={index * 80} style={styles.proCard}>
        {/* Rank Badge */}
        {rankBadge && (
          <View style={[styles.rankBadge, { backgroundColor: rankBadge.bg }]}>
            <Text style={[styles.rankBadgeText, { color: rankBadge.color }]}>{rankBadge.label}</Text>
          </View>
        )}
        {/* Header with gradient accent */}
        <View style={[styles.proGradientBar, { backgroundColor: isTrainer ? colors.primary : colors.secondary }]} />

        <View style={styles.proCardContent}>
          {/* Profile Header */}
          <View style={styles.proHeaderRow}>
            <View style={[styles.proAvatar, { backgroundColor: isTrainer ? colors.primarySoft : colors.secondarySoft }]}>
              <Ionicons name={isTrainer ? 'barbell' : 'nutrition'} size={26} color={isTrainer ? colors.primary : colors.secondary} />
              {/* Online indicator */}
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.proInfo}>
              <Text style={styles.proName}>
                {item.users?.first_name || ''} {item.users?.last_name || ''}
              </Text>
              <View style={styles.proTypeRow}>
                <View style={[styles.proTypeBadge, {
                  backgroundColor: isTrainer ? colors.primarySoft : colors.secondarySoft
                }]}>
                  <Ionicons name={isTrainer ? 'barbell-outline' : 'leaf-outline'} size={10} color={isTrainer ? colors.primary : colors.secondary} />
                  <Text style={[styles.proTypeText, {
                    color: isTrainer ? colors.primary : colors.secondary
                  }]}>
                    {isTrainer
                      ? (isTurkish ? 'Antrenör' : 'Personal Trainer')
                      : (isTurkish ? 'Diyetisyen' : 'Dietitian')}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingRow}>
                {renderStar(item.average_rating || 0)}
                <Text style={styles.ratingText}>{item.average_rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.reviewCount}>({item.total_reviews || 0})</Text>
              </View>
            </View>
          </View>

          {/* Specializations */}
          <View style={styles.specializationsRow}>
            {shownSpecs.map((spec: string, i: number) => (
              <View key={i} style={styles.specBadge}>
                <Text style={styles.specText}>{spec}</Text>
              </View>
            ))}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalClients}</Text>
              <Text style={styles.statLabel}>{isTurkish ? 'Danışan' : 'Clients'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalExperience}</Text>
              <Text style={styles.statLabel}>{isTurkish ? 'Yıl Deneyim' : 'Years Exp.'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCourses}</Text>
              <Text style={styles.statLabel}>{isTurkish ? 'Eğitim' : 'Courses'}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.locationText}>
                {item.users?.district || ''}{item.users?.district && item.users?.city ? ', ' : ''}{item.users?.city || ''}
              </Text>
            </View>
            <View style={styles.locationRight}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.availabilityText}>{isTurkish ? 'Müsait' : 'Available'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('ProfessionalDetail', { professionalId: item.id })}
            >
              <Ionicons name="person-circle-outline" size={16} color={colors.secondary} />
              <Text style={styles.profileBtnText}>{labels.profile}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.coursesBtn}
              onPress={() => navigation.navigate('ProfessionalCourses', {
                professionalId: item.user_id || item.id,
                professionalName: `${item.users?.first_name || ''} ${item.users?.last_name || ''}`,
                professionalType: item.professional_type,
              })}
            >
              <Ionicons name="book-outline" size={16} color={colors.primary} />
              <Text style={styles.coursesBtnText}>{labels.courses}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.connectRow}>
            <AnimatedButton
              title={labels.connect}
              onPress={() => handleConnect(item.user_id, item.id)}
              size="medium"
              style={styles.connectBtn}
            />
          </View>
        </View>
      </AnimatedCard>
    );
  }, [styles, colors, isTurkish, sortBy, navigation, getSpecializations, getRankBadge, renderStar, handleConnect, labels]);

  return (
    <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <AlertComponent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => safeGoBack(navigation, 'Home')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isTurkish ? 'Uzman Bul' : 'Find Expert'}</Text>
          <Text style={styles.headerSubtitle}>
            {professionals.length} {isTurkish ? 'uzman bulundu' : 'experts found'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.sortBtn, sortBy === 'rating' && styles.sortBtnActive]}
          onPress={() => {
            const order: ('rating' | 'name' | 'city')[] = ['rating', 'name', 'city'];
            const currentIndex = order.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % order.length;
            setSortBy(order[nextIndex]);
          }}
        >
          <Ionicons
            name={
              sortBy === 'rating' ? 'star' :
                sortBy === 'name' ? 'swap-vertical-outline' :
                  'location-outline'
            }
            size={22}
            color={sortBy === 'rating' ? colors.warning : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={[styles.searchRow, { marginBottom: 10 }]}>
           <View style={styles.searchInputWrapper}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder={isTurkish ? 'Ülke' : 'Country'}
              placeholderTextColor={colors.textTertiary}
              value={country}
              onChangeText={setCountry}
            />
            {country.length > 0 && (
              <TouchableOpacity onPress={() => setCountry('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder={isTurkish ? 'Şehir' : 'City'}
              placeholderTextColor={colors.textTertiary}
              value={city}
              onChangeText={setCity}
            />
            {city.length > 0 && (
              <TouchableOpacity onPress={() => setCity('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="map" size={18} color={colors.accent} />
            <TextInput
              style={styles.searchInput}
              placeholder={isTurkish ? 'İlçe' : 'District'}
              placeholderTextColor={colors.textTertiary}
              value={district}
              onChangeText={setDistrict}
            />
            {district.length > 0 && (
              <TouchableOpacity onPress={() => setDistrict('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all' as const, en: 'All Experts', tr: 'Tüm Uzmanlar', icon: 'people-outline' as const },
            { id: 'trainer' as const, en: 'Personal Trainers', tr: 'Antrenörler', icon: 'barbell-outline' as const },
            { id: 'dietitian' as const, en: 'Dietitians', tr: 'Diyetisyenler', icon: 'nutrition-outline' as const },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Ionicons
                name={f.icon}
                size={16}
                color={filter === f.id ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {isTurkish ? f.tr : f.en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={{ marginTop: 10, fontSize: 12, color: colors.textTertiary, textAlign: 'center' }}>
          {isTurkish ? '* Arama sadece birebir eşleşen yüz yüze görüşülecek eğitmenleri getirir.' : '* Search returns strictly matched in-person professionals.'}
        </Text>
      </View>

      {loading ? (
        <View style={[COMMON_STYLES.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{isTurkish ? 'Uzmanlar aranıyor...' : 'Searching experts...'}</Text>
        </View>
      ) : (
        <FlatList
          // Optimize FlatList performance with windowing and batching
          data={professionals}
          renderItem={renderProfessional}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 280, // Estimated professional card height
            offset: 280 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={[COMMON_STYLES.center, { paddingTop: 60 }]}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
              </View>
              <Text style={styles.emptyTitle}>
                {labels.noResults}
              </Text>
              <Text style={styles.emptySubtitle}>
                {labels.noResultsSub}
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
    paddingBottom: SPACING.md,
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
  sortBtn: {
    padding: SPACING.sm,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  sortBtnActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: colors.text,
  },
  filterScroll: {
    gap: SPACING.sm,
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  proCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.lg,
  },
  rankBadge: {
    position: 'absolute',
    top: -2,
    right: SPACING.md,
    zIndex: 10,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  rankBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '800',
    fontSize: 11,
  },
  proGradientBar: {
    height: 4,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  proCardContent: {
    padding: SPACING.lg,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  proAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  proInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  proName: {
    ...TYPOGRAPHY.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  proTypeRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  proTypeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
  },
  proTypeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...TYPOGRAPHY.small,
    color: colors.text,
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  reviewCount: {
    ...TYPOGRAPHY.small,
    color: colors.textTertiary,
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  specBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: colors.infoSoft,
  },
  specText: {
    ...TYPOGRAPHY.small,
    color: colors.accent,
    fontWeight: '600',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.bodyBold,
    color: colors.text,
    fontSize: 18,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: colors.textTertiary,
    marginTop: 2,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
  },
  availabilityText: {
    ...TYPOGRAPHY.small,
    color: colors.success,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  profileBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: colors.secondary,
    fontSize: 13,
  },
  coursesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  coursesBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: colors.primary,
    fontSize: 13,
  },
  connectRow: {
    marginTop: SPACING.sm,
  },
  connectBtn: {
    width: '100%',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: colors.textTertiary,
  },
});

export default ProfessionalSearchScreen;
