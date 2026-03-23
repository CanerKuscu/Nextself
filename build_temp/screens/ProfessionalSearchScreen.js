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
const AnimatedCard_1 = __importDefault(require("../components/AnimatedCard"));
const AnimatedButton_1 = __importDefault(require("../components/AnimatedButton"));
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
// window width not required currently
const isTrainerType = (type) => {
    if (!type)
        return false;
    const normalized = type.toLowerCase();
    return normalized === 'trainer' || normalized === 'pt';
};
const ProfessionalSearchScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [professionals, setProfessionals] = (0, react_1.useState)([]);
    const [filter, setFilter] = (0, react_1.useState)('all');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [country, setCountry] = (0, react_1.useState)('');
    const [city, setCity] = (0, react_1.useState)('');
    const [district, setDistrict] = (0, react_1.useState)('');
    const [sortBy, setSortBy] = (0, react_1.useState)('rating');
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    // Stable random fallback values per professional (persists across renders)
    const randomValuesRef = (0, react_1.useRef)(new Map());
    const getStableRandomValues = (id) => {
        if (!randomValuesRef.current.has(id)) {
            randomValuesRef.current.set(id, {
                specCount: 2 + Math.floor(Math.random() * 2),
                clients: Math.floor(Math.random() * 50 + 10),
                years: Math.floor(Math.random() * 10 + 2),
                courses: Math.floor(Math.random() * 5 + 1),
            });
        }
        return randomValuesRef.current.get(id);
    };
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            loadProfessionals();
        }, 500);
        return () => clearTimeout(timer);
    }, [filter, country, city, district]);
    // Re-sort existing data when sortBy changes (no re-fetch needed)
    (0, react_1.useEffect)(() => {
        if (professionals.length === 0)
            return;
        setProfessionals(prev => [...prev].sort((a, b) => {
            var _a, _b;
            if (sortBy === 'rating') {
                const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
                if (ratingDiff !== 0)
                    return ratingDiff;
                return (b.total_reviews || 0) - (a.total_reviews || 0);
            }
            if (sortBy === 'city') {
                const cityA = a.city || '';
                const cityB = b.city || '';
                return cityA.localeCompare(cityB);
            }
            // sortBy === 'name'
            return (((_a = a.users) === null || _a === void 0 ? void 0 : _a.first_name) || '').localeCompare(((_b = b.users) === null || _b === void 0 ? void 0 : _b.first_name) || '');
        }));
    }, [sortBy]);
    const loadProfessionals = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const type = filter === 'all' ? undefined : filter === 'trainer' ? 'pt' : filter;
            const { data } = yield supabase.getProfessionalsByCity(city.trim() || undefined, district.trim() || undefined, type, country.trim() || undefined);
            if (data) {
                const sorted = [...data].sort((a, b) => {
                    var _a, _b;
                    if (sortBy === 'rating') {
                        // Primary: rating desc, secondary: review count desc
                        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
                        if (ratingDiff !== 0)
                            return ratingDiff;
                        return (b.total_reviews || 0) - (a.total_reviews || 0);
                    }
                    if (sortBy === 'city') {
                        const cityA = a.city || '';
                        const cityB = b.city || '';
                        return cityA.localeCompare(cityB);
                    }
                    // sortBy === 'name'
                    return (((_a = a.users) === null || _a === void 0 ? void 0 : _a.first_name) || '').localeCompare(((_b = b.users) === null || _b === void 0 ? void 0 : _b.first_name) || '');
                });
                setProfessionals(sorted);
            }
        }
        catch (err) {
            console.error('Load professionals error:', err);
        }
        finally {
            setLoading(false);
        }
    });
    const getRankBadge = (index, rating, reviewCount) => {
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
            return { icon: 'trophy', label: isTurkish ? '1. Sıra' : '#1 Rated', color: gold, bg: goldBg };
        }
        if (index === 1 && rating >= 4.5 && reviewCount >= 5) {
            return { icon: 'medal-outline', label: isTurkish ? '2. Sıra' : '#2 Rated', color: silver, bg: silverBg };
        }
        if (index === 2 && rating >= 4.0 && reviewCount >= 5) {
            return { icon: 'medal-outline', label: isTurkish ? '3. Sıra' : '#3 Rated', color: bronzeText, bg: bronzeBg };
        }
        if (rating >= 4.8 && reviewCount >= 20) {
            return { icon: 'star', label: isTurkish ? 'Top Rated' : 'Top Rated', color: gold, bg: goldBg };
        }
        if (reviewCount >= 30) {
            return { icon: 'flame', label: isTurkish ? 'Popüler' : 'Popular', color: red, bg: redBg };
        }
        return null;
    };
    const renderStar = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (<vector_icons_1.Ionicons key={i} name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'} size={14} color={colors.warning}/>));
    };
    const handleConnect = (professionalUserId, professionalProfileId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user) {
                showAlert({ type: 'warning', title: isTurkish ? 'Uyarı' : 'Warning', message: isTurkish ? 'Bağlanmak için giriş yapmalısınız.' : 'You must be logged in to connect.', buttons: [{ text: 'OK' }] });
                return;
            }
            setLoading(true);
            const { data, error } = yield supabase.connectWithProfessional(user.id, professionalUserId, professionalProfileId);
            if (error)
                throw error;
            if (data === null || data === void 0 ? void 0 : data.chatId) {
                showAlert({
                    type: 'success',
                    title: isTurkish ? 'Bağlantı Kuruldu!' : 'Connected!',
                    message: isTurkish ? 'Mesajlarınıza yönlendirileceksiniz.' : 'You will be redirected to messages.',
                    buttons: [{ text: 'OK' }],
                });
            }
        }
        catch (err) {
            console.error('Connection error:', err);
            showAlert({ type: 'error', title: isTurkish ? 'Hata' : 'Error', message: isTurkish ? 'Bağlantı kurulamadı.' : 'Failed to connect.', buttons: [{ text: 'OK' }] });
        }
        finally {
            loadProfessionals();
        }
    });
    const getSpecializations = (type) => {
        if (isTrainerType(type)) {
            return isTurkish
                ? ['Kuvvet', 'HIIT', 'Fonksiyonel', 'Yoga']
                : ['Strength', 'HIIT', 'Functional', 'Yoga'];
        }
        return isTurkish
            ? ['Kilo Yönetimi', 'Sporcu Beslenmesi', 'Klinik']
            : ['Weight Mgmt', 'Sports Nutrition', 'Clinical'];
    };
    const renderProfessional = (0, react_1.useCallback)(({ item, index }) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const isTrainer = isTrainerType(item.professional_type);
        const specializations = getSpecializations(item.professional_type);
        const stableRandom = getStableRandomValues(item.id);
        const randomSpecs = specializations.slice(0, stableRandom.specCount);
        const rankBadge = sortBy === 'rating' ? getRankBadge(index, item.average_rating || 0, item.total_reviews || 0) : null;
        return (<AnimatedCard_1.default delay={index * 80} style={styles.proCard}>
        {/* Rank Badge */}
        {rankBadge && (<react_native_1.View style={[styles.rankBadge, { backgroundColor: rankBadge.bg }]}>
            <react_native_1.Text style={[styles.rankBadgeText, { color: rankBadge.color }]}>{rankBadge.label}</react_native_1.Text>
          </react_native_1.View>)}
        {/* Header with gradient accent */}
        <react_native_1.View style={[styles.proGradientBar, { backgroundColor: isTrainer ? colors.primary : colors.secondary }]}/>

        <react_native_1.View style={styles.proCardContent}>
          {/* Profile Header */}
          <react_native_1.View style={styles.proHeaderRow}>
            <react_native_1.View style={[styles.proAvatar, { backgroundColor: isTrainer ? colors.primarySoft : colors.secondarySoft }]}>
              <vector_icons_1.Ionicons name={isTrainer ? 'barbell' : 'nutrition'} size={26} color={isTrainer ? colors.primary : colors.secondary}/>
              {/* Online indicator */}
              <react_native_1.View style={styles.onlineIndicator}/>
            </react_native_1.View>
            <react_native_1.View style={styles.proInfo}>
              <react_native_1.Text style={styles.proName}>
                {((_a = item.users) === null || _a === void 0 ? void 0 : _a.first_name) || ''} {((_b = item.users) === null || _b === void 0 ? void 0 : _b.last_name) || ''}
              </react_native_1.Text>
              <react_native_1.View style={styles.proTypeRow}>
                <react_native_1.View style={[styles.proTypeBadge, {
                    backgroundColor: isTrainer ? colors.primarySoft : colors.secondarySoft
                }]}>
                  <vector_icons_1.Ionicons name={isTrainer ? 'barbell-outline' : 'leaf-outline'} size={10} color={isTrainer ? colors.primary : colors.secondary}/>
                  <react_native_1.Text style={[styles.proTypeText, {
                    color: isTrainer ? colors.primary : colors.secondary
                }]}>
                    {isTrainer
                ? (isTurkish ? 'Antrenör' : 'Personal Trainer')
                : (isTurkish ? 'Diyetisyen' : 'Dietitian')}
                  </react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.View style={styles.ratingRow}>
                {renderStar(item.average_rating || 0)}
                <react_native_1.Text style={styles.ratingText}>{((_c = item.average_rating) === null || _c === void 0 ? void 0 : _c.toFixed(1)) || '0.0'}</react_native_1.Text>
                <react_native_1.Text style={styles.reviewCount}>({item.total_reviews || 0})</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>

          {/* Specializations */}
          <react_native_1.View style={styles.specializationsRow}>
            {randomSpecs.map((spec, i) => (<react_native_1.View key={i} style={styles.specBadge}>
                <react_native_1.Text style={styles.specText}>{spec}</react_native_1.Text>
              </react_native_1.View>))}
          </react_native_1.View>

          {/* Stats Row */}
          <react_native_1.View style={styles.statsRow}>
            <react_native_1.View style={styles.statItem}>
              <react_native_1.Text style={styles.statValue}>{item.total_clients || stableRandom.clients}</react_native_1.Text>
              <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Danışan' : 'Clients'}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.statDivider}/>
            <react_native_1.View style={styles.statItem}>
              <react_native_1.Text style={styles.statValue}>{item.experience_years || stableRandom.years}</react_native_1.Text>
              <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Yıl Deneyim' : 'Years Exp.'}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.statDivider}/>
            <react_native_1.View style={styles.statItem}>
              <react_native_1.Text style={styles.statValue}>{item.courses_count || stableRandom.courses}</react_native_1.Text>
              <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Eğitim' : 'Courses'}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* Location */}
          <react_native_1.View style={styles.locationRow}>
            <react_native_1.View style={styles.locationLeft}>
              <vector_icons_1.Ionicons name="location-outline" size={16} color={colors.textSecondary}/>
              <react_native_1.Text style={styles.locationText}>
                {((_d = item.users) === null || _d === void 0 ? void 0 : _d.district) || ''}{((_e = item.users) === null || _e === void 0 ? void 0 : _e.district) && ((_f = item.users) === null || _f === void 0 ? void 0 : _f.city) ? ', ' : ''}{((_g = item.users) === null || _g === void 0 ? void 0 : _g.city) || ''}
              </react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.locationRight}>
              <vector_icons_1.Ionicons name="time-outline" size={14} color={colors.textTertiary}/>
              <react_native_1.Text style={styles.availabilityText}>{isTurkish ? 'Müsait' : 'Available'}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* Action Buttons */}
          <react_native_1.View style={styles.actionRow}>
            <react_native_1.TouchableOpacity style={styles.coursesBtn} onPress={() => {
                var _a, _b;
                return navigation.navigate('ProfessionalCourses', {
                    professionalId: item.user_id || item.id,
                    professionalName: `${((_a = item.users) === null || _a === void 0 ? void 0 : _a.first_name) || ''} ${((_b = item.users) === null || _b === void 0 ? void 0 : _b.last_name) || ''}`,
                    professionalType: item.professional_type,
                });
            }}>
              <vector_icons_1.Ionicons name="book-outline" size={16} color={colors.primary}/>
              <react_native_1.Text style={styles.coursesBtnText}>{isTurkish ? 'Eğitimler' : 'Courses'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <AnimatedButton_1.default title={isTurkish ? 'Bağlan' : 'Connect'} onPress={() => handleConnect(item.user_id, item.id)} size="medium" style={styles.connectBtn}/>
          </react_native_1.View>
        </react_native_1.View>
      </AnimatedCard_1.default>);
    }, [styles, colors, isTurkish, sortBy, navigation, getSpecializations, getRankBadge, renderStar, handleConnect, getStableRandomValues]);
    return (<react_native_1.View style={[theme_1.COMMON_STYLES.screenContainer, { paddingTop: insets.top }]}>
      <AlertComponent />

      {/* Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity style={styles.backBtn} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')}>
          <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.View style={styles.headerCenter}>
          <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Uzman Bul' : 'Find Expert'}</react_native_1.Text>
          <react_native_1.Text style={styles.headerSubtitle}>
            {professionals.length} {isTurkish ? 'uzman bulundu' : 'experts found'}
          </react_native_1.Text>
        </react_native_1.View>
        <react_native_1.TouchableOpacity style={[styles.sortBtn, sortBy === 'rating' && styles.sortBtnActive]} onPress={() => {
            const order = ['rating', 'name', 'city'];
            const currentIndex = order.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % order.length;
            setSortBy(order[nextIndex]);
        }}>
          <vector_icons_1.Ionicons name={sortBy === 'rating' ? 'star' :
            sortBy === 'name' ? 'swap-vertical-outline' :
                'location-outline'} size={22} color={sortBy === 'rating' ? colors.warning : colors.text}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {/* Search Section */}
      <react_native_1.View style={styles.searchSection}>
        <react_native_1.View style={[styles.searchRow, { marginBottom: 10 }]}>
           <react_native_1.View style={styles.searchInputWrapper}>
            <vector_icons_1.Ionicons name="globe-outline" size={18} color={colors.primary}/>
            <react_native_1.TextInput style={styles.searchInput} placeholder={isTurkish ? 'Ülke' : 'Country'} placeholderTextColor={colors.textTertiary} value={country} onChangeText={setCountry}/>
            {country.length > 0 && (<react_native_1.TouchableOpacity onPress={() => setCountry('')}>
                <vector_icons_1.Ionicons name="close-circle" size={18} color={colors.textTertiary}/>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={styles.searchRow}>
          <react_native_1.View style={styles.searchInputWrapper}>
            <vector_icons_1.Ionicons name="location" size={18} color={colors.primary}/>
            <react_native_1.TextInput style={styles.searchInput} placeholder={isTurkish ? 'Şehir' : 'City'} placeholderTextColor={colors.textTertiary} value={city} onChangeText={setCity}/>
            {city.length > 0 && (<react_native_1.TouchableOpacity onPress={() => setCity('')}>
                <vector_icons_1.Ionicons name="close-circle" size={18} color={colors.textTertiary}/>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
          <react_native_1.View style={styles.searchInputWrapper}>
            <vector_icons_1.Ionicons name="map" size={18} color={colors.accent}/>
            <react_native_1.TextInput style={styles.searchInput} placeholder={isTurkish ? 'İlçe' : 'District'} placeholderTextColor={colors.textTertiary} value={district} onChangeText={setDistrict}/>
            {district.length > 0 && (<react_native_1.TouchableOpacity onPress={() => setDistrict('')}>
                <vector_icons_1.Ionicons name="close-circle" size={18} color={colors.textTertiary}/>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
        </react_native_1.View>

        {/* Filter Tabs */}
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', en: 'All Experts', tr: 'Tüm Uzmanlar', icon: 'people-outline' },
            { id: 'trainer', en: 'Personal Trainers', tr: 'Antrenörler', icon: 'barbell-outline' },
            { id: 'dietitian', en: 'Dietitians', tr: 'Diyetisyenler', icon: 'nutrition-outline' },
        ].map((f) => (<react_native_1.TouchableOpacity key={f.id} style={[styles.filterChip, filter === f.id && styles.filterChipActive]} onPress={() => setFilter(f.id)}>
              <vector_icons_1.Ionicons name={f.icon} size={16} color={filter === f.id ? colors.textInverse : colors.textSecondary}/>
              <react_native_1.Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {isTurkish ? f.tr : f.en}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.ScrollView>
        <react_native_1.Text style={{ marginTop: 10, fontSize: 12, color: colors.textTertiary, textAlign: 'center' }}>
          {isTurkish ? '* Arama sadece birebir eşleşen yüz yüze görüşülecek eğitmenleri getirir.' : '* Search returns strictly matched in-person professionals.'}
        </react_native_1.Text>
      </react_native_1.View>

      {loading ? (<react_native_1.View style={[theme_1.COMMON_STYLES.center, { flex: 1 }]}>
          <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
          <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Uzmanlar aranıyor...' : 'Searching experts...'}</react_native_1.Text>
        </react_native_1.View>) : (<react_native_1.FlatList 
        // Optimize FlatList performance with windowing and batching
        data={professionals} renderItem={renderProfessional} keyExtractor={item => String(item.id)} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} initialNumToRender={8} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} updateCellsBatchingPeriod={50} getItemLayout={(data, index) => ({
                length: 280, // Estimated professional card height
                offset: 280 * index,
                index,
            })} ListEmptyComponent={<react_native_1.View style={[theme_1.COMMON_STYLES.center, { paddingTop: 60 }]}>
              <react_native_1.View style={styles.emptyIconContainer}>
                <vector_icons_1.Ionicons name="search-outline" size={48} color={colors.border}/>
              </react_native_1.View>
              <react_native_1.Text style={styles.emptyTitle}>
                {isTurkish ? 'Sonuç Bulunamadı' : 'No Results Found'}
              </react_native_1.Text>
              <react_native_1.Text style={styles.emptySubtitle}>
                {isTurkish ? 'Yalnızca yüz yüze görüşebileceğiniz antrenörler listelenir. Başka bir ilçe/şehir deneyin.' : 'Only strictly matched in-person professionals are listed. Try another district/city.'}
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
        paddingBottom: theme_1.SPACING.md,
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
    sortBtn: {
        padding: theme_1.SPACING.sm,
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
    },
    sortBtnActive: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    searchSection: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        backgroundColor: colors.background,
    },
    searchRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.sm,
        marginBottom: theme_1.SPACING.md,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
        paddingHorizontal: theme_1.SPACING.md,
        height: 48,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    searchInput: Object.assign(Object.assign({ flex: 1, marginLeft: theme_1.SPACING.sm }, theme_1.TYPOGRAPHY.body), { color: colors.text }),
    filterScroll: {
        gap: theme_1.SPACING.sm,
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
        paddingTop: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.xxxl,
        gap: theme_1.SPACING.md,
    },
    proCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: theme_1.BORDER_RADIUS.lg,
    },
    rankBadge: {
        position: 'absolute',
        top: -2,
        right: theme_1.SPACING.md,
        zIndex: 10,
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 4,
        borderBottomLeftRadius: theme_1.BORDER_RADIUS.sm,
        borderBottomRightRadius: theme_1.BORDER_RADIUS.sm,
    },
    rankBadgeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { fontWeight: '800', fontSize: 11 }),
    proGradientBar: {
        height: 4,
        borderTopLeftRadius: theme_1.BORDER_RADIUS.lg,
        borderTopRightRadius: theme_1.BORDER_RADIUS.lg,
    },
    proCardContent: {
        padding: theme_1.SPACING.lg,
    },
    proHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
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
        marginLeft: theme_1.SPACING.md,
    },
    proName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, fontSize: 16 }),
    proTypeRow: {
        marginTop: 4,
        marginBottom: 4,
    },
    proTypeBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: theme_1.BORDER_RADIUS.pill,
    },
    proTypeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { fontWeight: '700' }),
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.text, fontWeight: '700', marginLeft: theme_1.SPACING.xs }),
    reviewCount: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary }),
    specializationsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: theme_1.SPACING.md,
    },
    specBadge: {
        paddingHorizontal: theme_1.SPACING.sm + 2,
        paddingVertical: 4,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        backgroundColor: colors.infoSoft,
    },
    specText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.accent, fontWeight: '600', fontSize: 11 }),
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: colors.surface,
        borderRadius: theme_1.BORDER_RADIUS.md,
        paddingVertical: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.md,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, fontSize: 18 }),
    statLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, marginTop: 2, fontSize: 11 }),
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.borderLight,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme_1.SPACING.lg,
    },
    locationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.xs,
    },
    locationRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    availabilityText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.success, fontWeight: '600' }),
    actionRow: {
        flexDirection: 'row',
        gap: theme_1.SPACING.sm,
    },
    coursesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
        paddingVertical: theme_1.SPACING.sm + 4,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    coursesBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, fontSize: 13 }),
    connectBtn: {
        flex: 1.5,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    emptyTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.textSecondary, marginTop: theme_1.SPACING.sm, marginBottom: theme_1.SPACING.xs }),
    emptySubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary }),
});
exports.default = ProfessionalSearchScreen;
