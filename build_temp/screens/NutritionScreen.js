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
const expo_image_1 = require("expo-image");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const expo_status_bar_1 = require("expo-status-bar");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const datetimepicker_1 = __importDefault(require("@react-native-community/datetimepicker"));
const supabase_1 = require("../services/supabase");
const notificationService_1 = require("../services/notificationService");
const useTranslation_1 = require("../hooks/useTranslation");
const config_1 = require("../config/config");
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const CustomAlert_1 = require("../components/CustomAlert");
const FoodCategoryIcon_1 = __importDefault(require("../components/FoodCategoryIcon"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const SCAN_STORAGE_KEY = 'nextself_daily_scans';
const CATEGORY_ICONS = {
    protein: { icon: 'barbell', color: '#FF6B6B', tr: 'Protein' },
    carbs: { icon: 'nutrition', color: '#FF9600', tr: 'Karb' },
    fat: { icon: 'flame', color: '#1CB0F6', tr: 'Yağ' },
    snacks: { icon: 'pizza', color: '#FF9600', tr: 'Atıştırmalıklar' },
    beverages: { icon: 'cafe', color: '#1CB0F6', tr: 'İçecekler' },
    grains: { icon: 'nutrition', color: '#FFC800', tr: 'Tahıllar' },
    dairy: { icon: 'water', color: '#CE82FF', tr: 'Günlük' },
    other: { icon: 'restaurant', color: '#AFAFBF', tr: 'Diğer' },
    vegetables: { icon: 'leaf', color: '#58CC02', tr: 'Sebze' },
    fruits: { icon: 'rose', color: '#f093fb', tr: 'Meyveler' },
    default: { icon: 'restaurant', color: '#AFAFBF', tr: 'Diğer' },
};
const getCategoryLabel = (category, isTurkish) => {
    var _a;
    if (!isTurkish)
        return category;
    const key = category.toLowerCase();
    return ((_a = CATEGORY_ICONS[key]) === null || _a === void 0 ? void 0 : _a.tr) || category;
};
// Macro Progress Bar Component
const MacroBar = ({ label, value, goal, color, unit, styles, colors }) => {
    const safeGoal = goal > 0 ? goal : 1;
    const safeValue = Number.isFinite(value) ? value : 0;
    const progress = Math.min(safeValue / safeGoal, 1);
    return (<react_native_1.View style={styles.macroBarWrap}>
      <react_native_1.View style={styles.macroBarHeader}>
        <react_native_1.View style={[styles.macroBarDot, { backgroundColor: color }]}/>
        <react_native_1.Text style={styles.macroBarLabel}>{label}</react_native_1.Text>
        <react_native_1.Text style={styles.macroBarValue}>{value}{unit} <react_native_1.Text style={{ color: colors.textTertiary }}>/ {goal}{unit}</react_native_1.Text></react_native_1.Text>
      </react_native_1.View>
      <react_native_1.View style={styles.macroBarTrack}>
        <react_native_1.View style={[styles.macroBarFill, { width: `${progress * 100}%`, backgroundColor: color }]}/>
      </react_native_1.View>
    </react_native_1.View>);
};
const NutritionScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [foods, setFoods] = (0, react_1.useState)([]);
    const [page, setPage] = (0, react_1.useState)(0);
    const PAGE_SIZE = 60;
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const [loadError, setLoadError] = (0, react_1.useState)(null);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)('all');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [dailyScans, setDailyScans] = (0, react_1.useState)(0);
    const [dailyMacros, setDailyMacros] = (0, react_1.useState)({
        calories: 0, protein: 0, carbs: 0, fat: 0,
        calorieGoal: 2500, proteinGoal: 150, carbsGoal: 300, fatGoal: 70,
    });
    const [dbCategories, setDbCategories] = (0, react_1.useState)([]);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const [imageErrors, setImageErrors] = (0, react_1.useState)({});
    const [showCreateProgramModal, setShowCreateProgramModal] = (0, react_1.useState)(false);
    const [selectedFoodForProgram, setSelectedFoodForProgram] = (0, react_1.useState)(null);
    const [selectedMealDay, setSelectedMealDay] = (0, react_1.useState)('monday');
    const [selectedMealType, setSelectedMealType] = (0, react_1.useState)('breakfast');
    const [mealTime, setMealTime] = (0, react_1.useState)(new Date());
    const [notificationTime, setNotificationTime] = (0, react_1.useState)(new Date());
    const [showTimePicker, setShowTimePicker] = (0, react_1.useState)(null);
    const [creatingProgram, setCreatingProgram] = (0, react_1.useState)(false);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert } = (0, CustomAlert_1.useAlert)();
    (0, react_1.useEffect)(() => { loadDailyMacros(); }, []);
    (0, react_1.useEffect)(() => { loadCategories(); }, [isTurkish]);
    (0, react_1.useEffect)(() => { loadScanCount(); }, []);
    // Debounced search effect - triggers when searchQuery or selectedCategory changes
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            // reset pagination when query/category changes
            setPage(0);
            setHasMore(true);
            loadFoods(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, isTurkish]);
    const loadCategories = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { data } = yield supabase.getFoodCategories(isTurkish ? 'tr' : 'en');
            if (data && data.length > 0)
                setDbCategories(data);
        }
        catch (err) {
            console.error('Load categories error:', err);
        }
    });
    const loadDailyMacros = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user)
                return;
            const { data } = yield supabase.getTodayNutritionSummary(user.id);
            if (data) {
                setDailyMacros(prev => (Object.assign(Object.assign({}, prev), { calories: Math.round(data.calories), protein: Math.round(data.protein), carbs: Math.round(data.carbs), fat: Math.round(data.fat) })));
            }
        }
        catch (err) {
            console.error('Load daily macros error:', err);
        }
    });
    const loadFoods = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (pageParam = 0) {
        if (!hasMore && pageParam > 0)
            return;
        if (pageParam === 0)
            setLoading(true);
        else
            setLoadingMore(true);
        try {
            setLoadError(null);
            const supabase = supabase_1.SupabaseService.getInstance();
            const macroKeys = ['protein', 'carbs', 'fat'];
            const categoryParam = (selectedCategory === 'all' || macroKeys.includes(selectedCategory)) ? undefined : selectedCategory;
            const { data, error } = yield supabase.getFoodItems(isTurkish ? 'tr' : 'en', categoryParam, searchQuery || undefined, pageParam, PAGE_SIZE);
            if (error) {
                console.error('Load foods error:', error);
                setLoadError(isTurkish ? 'Besinler yüklenemedi' : 'Failed to load foods');
                if (pageParam === 0)
                    setFoods([]);
            }
            else {
                const raw = data || [];
                // Apply client-side macro filtering/sorting if requested
                let final = raw;
                if (macroKeys.includes(selectedCategory)) {
                    const map = { protein: 'protein_g', carbs: 'carbs_g', fat: 'fat_g' };
                    const key = map[selectedCategory];
                    final = raw.filter((f) => Number(f[key] || 0) > 0).sort((a, b) => (Number(b[key] || 0) - Number(a[key] || 0)));
                }
                if (pageParam === 0) {
                    setFoods(final);
                }
                else {
                    // append new page but avoid duplicates
                    setFoods(prev => {
                        const ids = new Set(prev.map(p => p.id));
                        const appended = final.filter((f) => !ids.has(f.id));
                        return prev.concat(appended);
                    });
                }
                // Determine if more pages exist based on raw server result, not post-filtered length
                if (!raw || raw.length < PAGE_SIZE)
                    setHasMore(false);
            }
        }
        catch (err) {
            console.error('Load foods error:', err);
            setLoadError(isTurkish ? 'Besinler yüklenemedi' : 'Failed to load foods');
            if (pageParam === 0)
                setFoods([]);
        }
        finally {
            if (pageParam === 0)
                setLoading(false);
            else
                setLoadingMore(false);
        }
    });
    const loadScanCount = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const today = new Date().toDateString();
            const stored = yield platformStorage_1.default.getItem(SCAN_STORAGE_KEY);
            // Initialize for first-time users
            if (!stored) {
                yield platformStorage_1.default.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                setDailyScans(0);
                return;
            }
            let parsed;
            try {
                parsed = JSON.parse(stored);
            }
            catch (parseErr) {
                console.error('Corrupted scan data, resetting:', parseErr);
                yield platformStorage_1.default.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                setDailyScans(0);
                return;
            }
            // Validate parsed data structure
            if (!parsed || typeof parsed.date !== 'string' || typeof parsed.count !== 'number') {
                yield platformStorage_1.default.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                setDailyScans(0);
                return;
            }
            if (parsed.date === today) {
                setDailyScans(parsed.count);
            }
            else {
                // New day - reset count
                yield platformStorage_1.default.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                setDailyScans(0);
            }
        }
        catch (err) {
            console.error('Load scan count error:', err);
            setDailyScans(0); // Graceful fallback
        }
    });
    const incrementScanCount = () => __awaiter(void 0, void 0, void 0, function* () {
        const today = new Date().toDateString();
        const newCount = dailyScans + 1;
        setDailyScans(newCount);
        yield platformStorage_1.default.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    });
    const handleScan = () => {
        if (dailyScans >= config_1.CONFIG.FREE_FOOD_SCANS_PER_DAY) {
            showAlert({
                type: 'warning',
                title: isTurkish ? 'Tarama Limiti' : 'Scan Limit',
                message: isTurkish
                    ? `Günlük ${config_1.CONFIG.FREE_FOOD_SCANS_PER_DAY} ücretsiz tarama hakkınız doldu.`
                    : `You've used your ${config_1.CONFIG.FREE_FOOD_SCANS_PER_DAY} free daily scans.`,
                buttons: [
                    { text: isTurkish ? 'İptal' : 'Cancel' },
                    {
                        text: isTurkish ? 'Reklam İzle' : 'Watch Ad', onPress: () => __awaiter(void 0, void 0, void 0, function* () {
                            // TODO: Integrate actual ad SDK (e.g., AdMob rewarded ad)
                            // After ad is watched, grant one extra scan by NOT incrementing & navigate
                            navigation.navigate('FoodScanner');
                        })
                    },
                ],
            });
        }
        else {
            incrementScanCount();
            navigation.navigate('FoodScanner');
        }
    };
    const handleImageError = (0, react_1.useCallback)((itemId) => {
        setImageErrors(prev => (Object.assign(Object.assign({}, prev), { [itemId]: true })));
    }, []);
    const getFoodField = (0, react_1.useCallback)((food, field) => {
        if (isTurkish) {
            const trField = `${field}_tr`;
            if (food[trField])
                return food[trField];
        }
        return food[field] || '';
    }, [isTurkish]);
    const renderFoodImage = (0, react_1.useCallback)((item) => {
        const hasError = imageErrors[item.id];
        const hasImage = item.image_url && !hasError;
        if (hasImage) {
            return (<expo_image_1.Image source={{ uri: item.image_url }} style={styles.foodImage} contentFit="cover" cachePolicy="memory-disk" transition={500} onError={() => handleImageError(item.id)}/>);
        }
        return (<FoodCategoryIcon_1.default category={getFoodField(item, 'category')} foodName={getFoodField(item, 'name')} size={48}/>);
    }, [getFoodField, handleImageError, imageErrors, styles]);
    const handleSearch = () => {
        setPage(0);
        setHasMore(true);
        loadFoods(0);
    };
    const handleCategoryChange = (cat) => {
        setSearchQuery('');
        setSelectedCategory(cat);
        setFoods([]);
        setPage(0);
        setHasMore(true);
    };
    // Calorie ring
    const ringSize = 140;
    const ringStroke = 12;
    const ringRadius = (ringSize - ringStroke) / 2;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const calProgress = Math.min(dailyMacros.calories / Math.max(1, dailyMacros.calorieGoal), 1);
    const ringOffset = ringCircumference * (1 - calProgress);
    const dayOptions = [
        { key: 'monday', tr: 'Pazartesi', en: 'Monday' },
        { key: 'tuesday', tr: 'Salı', en: 'Tuesday' },
        { key: 'wednesday', tr: 'Çarşamba', en: 'Wednesday' },
        { key: 'thursday', tr: 'Perşembe', en: 'Thursday' },
        { key: 'friday', tr: 'Cuma', en: 'Friday' },
        { key: 'saturday', tr: 'Cumartesi', en: 'Saturday' },
        { key: 'sunday', tr: 'Pazar', en: 'Sunday' },
    ];
    const mealOptions = [
        { key: 'breakfast', tr: 'Kahvaltı', en: 'Breakfast' },
        { key: 'lunch', tr: 'Öğle Yemeği', en: 'Lunch' },
        { key: 'dinner', tr: 'Akşam Yemeği', en: 'Dinner' },
        { key: 'snack', tr: 'Ara Öğün', en: 'Snack' },
    ];
    const weekdayMap = {
        sunday: 1,
        monday: 2,
        tuesday: 3,
        wednesday: 4,
        thursday: 5,
        friday: 6,
        saturday: 7,
    };
    const formatTime = (0, react_1.useCallback)((date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }, []);
    const openCreateProgramModal = (0, react_1.useCallback)((item) => {
        const today = new Date();
        const jsDay = today.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        setSelectedMealDay(dayOptions[dayIndex].key);
        setSelectedMealType('breakfast');
        setMealTime(today);
        setNotificationTime(today);
        setSelectedFoodForProgram(item);
        setShowCreateProgramModal(true);
    }, [dayOptions]);
    const closeCreateProgramModal = (0, react_1.useCallback)(() => {
        setShowCreateProgramModal(false);
        setSelectedFoodForProgram(null);
        setShowTimePicker(null);
        setCreatingProgram(false);
    }, []);
    const handleAddFoodToProgram = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedFoodForProgram)
            return;
        try {
            setCreatingProgram(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add food to your program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }
            const foodName = getFoodField(selectedFoodForProgram, 'name');
            const foodCategory = getFoodField(selectedFoodForProgram, 'category');
            const selectedDay = dayOptions.find(d => d.key === selectedMealDay);
            const selectedMeal = mealOptions.find(m => m.key === selectedMealType);
            const dayLabel = isTurkish ? selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.tr : selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.en;
            const mealLabel = isTurkish ? selectedMeal === null || selectedMeal === void 0 ? void 0 : selectedMeal.tr : selectedMeal === null || selectedMeal === void 0 ? void 0 : selectedMeal.en;
            const content = [
                `${isTurkish ? 'Besin' : 'Food'}: ${foodName}`,
                `${isTurkish ? 'Kategori' : 'Category'}: ${foodCategory}`,
                `${isTurkish ? 'Öğün' : 'Meal'}: ${mealLabel}`,
                `${isTurkish ? 'Gün' : 'Day'}: ${dayLabel}`,
                `${isTurkish ? 'Öğün saati' : 'Meal time'}: ${formatTime(mealTime)}`,
                `${isTurkish ? 'Bildirim saati' : 'Notification time'}: ${formatTime(notificationTime)}`,
                `${isTurkish ? 'Porsiyon' : 'Serving'}: ${selectedFoodForProgram.serving_size || '-'}`,
                `${isTurkish ? 'Kalori' : 'Calories'}: ${selectedFoodForProgram.calories || 0} kcal`,
                `${isTurkish ? 'Protein' : 'Protein'}: ${selectedFoodForProgram.protein_g || 0} g`,
                `${isTurkish ? 'Karbonhidrat' : 'Carbs'}: ${selectedFoodForProgram.carbs_g || 0} g`,
                `${isTurkish ? 'Yağ' : 'Fat'}: ${selectedFoodForProgram.fat_g || 0} g`,
            ].join('\n');
            const { error } = yield supabase.createAiProgram({
                userId: user.id,
                type: 'nutrition',
                title: `${foodName} ${isTurkish ? 'Planı' : 'Plan'}`,
                content,
            });
            if (error)
                throw error;
            const notificationService = notificationService_1.NotificationService.getInstance();
            yield notificationService.requestPermissions();
            yield notificationService.scheduleSmartReminder('nutrition', notificationTime.getHours(), notificationTime.getMinutes(), `nutrition_${user.id}_${selectedFoodForProgram.id}_${selectedMealDay}`, 'Nutrition', { foodName }, isTurkish ? 'tr' : 'en', undefined, weekdayMap[selectedMealDay]);
            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? `${foodName} programına eklendi ve bildirim ayarlandı.` : `${foodName} has been added to your program and notification is scheduled.`,
                buttons: [{ text: 'OK' }],
            });
            closeCreateProgramModal();
        }
        catch (_a) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Besin programa eklenemedi. Tekrar deneyin.' : 'Could not add food to program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
        finally {
            setCreatingProgram(false);
        }
    }), [closeCreateProgramModal, dayOptions, formatTime, getFoodField, isTurkish, mealOptions, mealTime, notificationTime, selectedFoodForProgram, selectedMealDay, selectedMealType, showAlert, weekdayMap]);
    const renderFoodItem = (0, react_1.useCallback)(({ item }) => (<react_native_1.View style={styles.foodCard}>
      <react_native_1.View style={[styles.foodAccent, { backgroundColor: '#FF9600' }]}/>
      <react_native_1.View style={styles.foodContent}>
        <react_native_1.View style={styles.foodTop}>
          {renderFoodImage(item)}
          <react_native_1.View style={styles.foodInfo}>
            <react_native_1.Text style={styles.foodName} numberOfLines={1}>{getFoodField(item, 'name')}</react_native_1.Text>
            <react_native_1.Text style={styles.foodMeta}>{getFoodField(item, 'category')} • {item.serving_size}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.foodActions}>
            <react_native_1.View style={styles.foodCal}>
              <react_native_1.Text style={styles.foodCalValue}>{item.calories}</react_native_1.Text>
              <react_native_1.Text style={styles.foodCalUnit}>kcal</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.TouchableOpacity style={styles.addItemBtn} activeOpacity={0.8} onPress={() => openCreateProgramModal(item)}>
              <vector_icons_1.Ionicons name="add" size={18} color="#FFF"/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
        <react_native_1.View style={styles.foodMacros}>
          <react_native_1.View style={styles.foodMacroItem}>
            <react_native_1.View style={[styles.fmDot, { backgroundColor: '#FF6B6B' }]}/>
            <react_native_1.Text style={styles.fmText}>{item.protein_g}g {isTurkish ? 'protein' : 'protein'}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.foodMacroItem}>
            <react_native_1.View style={[styles.fmDot, { backgroundColor: '#FF9600' }]}/>
            <react_native_1.Text style={styles.fmText}>{item.carbs_g}g {isTurkish ? 'karb' : 'carbs'}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.foodMacroItem}>
            <react_native_1.View style={[styles.fmDot, { backgroundColor: '#1CB0F6' }]}/>
            <react_native_1.Text style={styles.fmText}>{item.fat_g}g {isTurkish ? 'yağ' : 'fat'}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>), [styles, renderFoodImage, getFoodField, isTurkish, openCreateProgramModal]);
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <expo_status_bar_1.StatusBar style={isDark ? 'light' : 'dark'} translucent={true}/>
      <react_native_1.FlatList data={foods} keyExtractor={item => String(item.id)} contentContainerStyle={[styles.listContent, { paddingTop: 12 }]} showsVerticalScrollIndicator={false} refreshing={loading && page === 0} onRefresh={() => {
            setPage(0);
            setHasMore(true);
            loadFoods(0);
            loadDailyMacros();
        }} initialNumToRender={8} maxToRenderPerBatch={10} windowSize={5} 
    // Optimize FlatList performance with windowing and batching
    removeClippedSubviews={true} updateCellsBatchingPeriod={50} getItemLayout={(data, index) => ({
            length: 120, // Estimated food card height
            offset: 120 * index,
            index,
        })} onEndReachedThreshold={0.5} onEndReached={() => {
            if (!loadingMore && hasMore && !loading) {
                const next = page + 1;
                setPage(next);
                loadFoods(next);
            }
        }} ListHeaderComponent={<react_native_1.View>
            {/* ─── HEADER ─── */}
            <react_native_1.View style={styles.headerRow}>
              <react_native_1.Text style={styles.headerTitle}>{t('nutrition')}</react_native_1.Text>
            </react_native_1.View>

            {/* ─── CALORIE RING + MACROS ─── */}
            <react_native_1.View style={styles.dashboardCard}>
              <react_native_1.View style={styles.dashRow}>
                {/* Ring */}
                <react_native_1.View style={{ alignItems: 'center', width: ringSize }}>
                  <react_native_1.View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                    <react_native_svg_1.default width={ringSize} height={ringSize} style={{ position: 'absolute' }}>
                      <react_native_svg_1.Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="#F0F0F0" strokeWidth={ringStroke} fill="none"/>
                      <react_native_svg_1.Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="#FF9600" strokeWidth={ringStroke} fill="none" strokeDasharray={`${ringCircumference} ${ringCircumference}`} strokeDashoffset={ringOffset} strokeLinecap="round" transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}/>
                    </react_native_svg_1.default>
                    <react_native_1.View style={{ alignItems: 'center' }}>
                      <react_native_1.Text style={styles.ringCalValue}>{dailyMacros.calories}</react_native_1.Text>
                      <react_native_1.Text style={styles.ringCalLabel}>/ {dailyMacros.calorieGoal}</react_native_1.Text>
                      <react_native_1.Text style={styles.ringCalUnit}>kcal</react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>
                </react_native_1.View>

                {/* Macro Bars */}
                <react_native_1.View style={styles.macroBarsCol}>
                  <MacroBar label={isTurkish ? 'Protein' : 'Protein'} value={dailyMacros.protein} goal={dailyMacros.proteinGoal} color="#FF6B6B" unit="g" styles={styles} colors={colors}/>
                  <MacroBar label={isTurkish ? 'Karb' : 'Carbs'} value={dailyMacros.carbs} goal={dailyMacros.carbsGoal} color="#FF9600" unit="g" styles={styles} colors={colors}/>
                  <MacroBar label={isTurkish ? 'Yağ' : 'Fat'} value={dailyMacros.fat} goal={dailyMacros.fatGoal} color="#1CB0F6" unit="g" styles={styles} colors={colors}/>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.View>

            {/* ─── SCAN CARD ─── */}
            <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={handleScan}>
              <expo_linear_gradient_1.LinearGradient colors={['#FF9600', '#FF6B6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanCard}>
                <react_native_1.View style={styles.scanIconWrap}>
                  <vector_icons_1.Ionicons name="camera" size={22} color="#FF9600"/>
                </react_native_1.View>
                <react_native_1.View style={{ flex: 1 }}>
                  <react_native_1.Text style={styles.scanTitle}>{isTurkish ? 'Yiyecek Tara' : 'Scan Food'}</react_native_1.Text>
                  <react_native_1.Text style={styles.scanSub}>
                    {dailyScans}/{config_1.CONFIG.FREE_FOOD_SCANS_PER_DAY} {isTurkish ? 'kullanıldı' : 'used'}
                  </react_native_1.Text>
                </react_native_1.View>
                <vector_icons_1.Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
              </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>

            {/* ─── SEARCH ─── */}
            <react_native_1.View style={styles.searchBar}>
              <vector_icons_1.Ionicons name="search" size={18} color={colors.textTertiary}/>
              <react_native_1.TextInput style={styles.searchInput} placeholder={isTurkish ? 'Yiyecek ara...' : 'Search food...'} placeholderTextColor={colors.textTertiary} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} returnKeyType="search"/>
              {searchQuery.length > 0 && (<react_native_1.TouchableOpacity onPress={() => setSearchQuery('')}>
                  <vector_icons_1.Ionicons name="close-circle" size={18} color={colors.textTertiary}/>
                </react_native_1.TouchableOpacity>)}
            </react_native_1.View>

            {/* ─── CATEGORY CHIPS ─── */}
            <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {/* All category */}
              <react_native_1.TouchableOpacity style={[styles.catChip, selectedCategory === 'all' && { backgroundColor: '#58CC0215', borderColor: '#58CC02' }]} onPress={() => handleCategoryChange('all')} activeOpacity={0.7}>
                <vector_icons_1.Ionicons name="restaurant" size={16} color={selectedCategory === 'all' ? '#58CC02' : colors.textTertiary}/>
                <react_native_1.Text style={[styles.catChipText, selectedCategory === 'all' && { color: '#58CC02' }]}>
                  {isTurkish ? 'Tümü' : 'All'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
              {/* Macro quick-filters */}
              <react_native_1.TouchableOpacity style={[styles.catChip, selectedCategory === 'protein' && { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B' }]} onPress={() => handleCategoryChange('protein')} activeOpacity={0.7}>
                <vector_icons_1.Ionicons name="barbell" size={16} color={selectedCategory === 'protein' ? '#FF6B6B' : colors.textTertiary}/>
                <react_native_1.Text style={[styles.catChipText, selectedCategory === 'protein' && { color: '#FF6B6B' }]}>{isTurkish ? 'Protein' : 'Protein'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={[styles.catChip, selectedCategory === 'carbs' && { backgroundColor: '#FF960015', borderColor: '#FF9600' }]} onPress={() => handleCategoryChange('carbs')} activeOpacity={0.7}>
                <vector_icons_1.Ionicons name={CATEGORY_ICONS['carbs'].icon} size={16} color={selectedCategory === 'carbs' ? CATEGORY_ICONS['carbs'].color : colors.textTertiary}/>
                <react_native_1.Text style={[styles.catChipText, selectedCategory === 'carbs' && { color: CATEGORY_ICONS['carbs'].color }]}>{isTurkish ? 'Karb' : 'Carbs'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={[styles.catChip, selectedCategory === 'fat' && { backgroundColor: '#1CB0F615', borderColor: '#1CB0F6' }]} onPress={() => handleCategoryChange('fat')} activeOpacity={0.7}>
                <vector_icons_1.Ionicons name={CATEGORY_ICONS['fat'].icon} size={16} color={selectedCategory === 'fat' ? CATEGORY_ICONS['fat'].color : colors.textTertiary}/>
                <react_native_1.Text style={[styles.catChipText, selectedCategory === 'fat' && { color: CATEGORY_ICONS['fat'].color }]}>{isTurkish ? 'Yağ' : 'Fat'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              {/* Dynamic categories from DB */}
              {dbCategories.map(cat => {
                const key = cat.toLowerCase();
                const iconData = CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
                const active = selectedCategory === cat;
                return (<react_native_1.TouchableOpacity key={cat} style={[styles.catChip, active && { backgroundColor: iconData.color + '15', borderColor: iconData.color }]} onPress={() => handleCategoryChange(cat)} activeOpacity={0.7}>
                    <vector_icons_1.Ionicons name={iconData.icon} size={16} color={active ? iconData.color : colors.textTertiary}/>
                    <react_native_1.Text style={[styles.catChipText, active && { color: iconData.color }]}>{getCategoryLabel(cat, isTurkish)}</react_native_1.Text>
                  </react_native_1.TouchableOpacity>);
            })}
            </react_native_1.ScrollView>

            {/* Section title */}
            <react_native_1.Text style={styles.sectionTitle}>
              {isTurkish ? 'Besinler' : 'Foods'} ({foods.length})
            </react_native_1.Text>
          </react_native_1.View>} renderItem={renderFoodItem} ListEmptyComponent={loading ? (<react_native_1.View style={{ alignItems: 'center', paddingTop: 60 }}>
              <react_native_1.ActivityIndicator size="large" color="#FF9600"/>
            </react_native_1.View>) : (<react_native_1.View style={styles.emptyState}>
              <react_native_1.View style={styles.emptyIcon}>
                <vector_icons_1.Ionicons name="restaurant-outline" size={32} color="#FF9600"/>
              </react_native_1.View>
              <react_native_1.Text style={styles.emptyText}>{loadError || (isTurkish ? 'Yiyecek bulunamadı' : 'No food items found')}</react_native_1.Text>
              {loadError && (<react_native_1.TouchableOpacity onPress={() => loadFoods(0)} style={styles.retryBtn}>
                  <react_native_1.Text style={styles.retryBtnText}>{isTurkish ? 'Tekrar Dene' : 'Try Again'}</react_native_1.Text>
                </react_native_1.TouchableOpacity>)}
            </react_native_1.View>)} ListFooterComponent={loadingMore ? (<react_native_1.View style={{ paddingVertical: 18 }}>
            <react_native_1.ActivityIndicator size="small" color="#FF9600"/>
          </react_native_1.View>) : null}/>
      <react_native_1.Modal visible={showCreateProgramModal} transparent animationType="fade" onRequestClose={closeCreateProgramModal}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={styles.modalCard}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={styles.modalCloseBtn}>
                <vector_icons_1.Ionicons name="close" size={18} color={colors.text}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
            <react_native_1.Text style={styles.modalSubtitle}>
              {selectedFoodForProgram
            ? `${isTurkish ? 'Besin' : 'Food'}: ${getFoodField(selectedFoodForProgram, 'name')}`
            : ''}
            </react_native_1.Text>

            <react_native_1.Text style={styles.modalSectionTitle}>{isTurkish ? 'Öğün' : 'Meal'}</react_native_1.Text>
            <react_native_1.View style={styles.optionWrap}>
              {mealOptions.map(option => {
            const active = selectedMealType === option.key;
            return (<react_native_1.TouchableOpacity key={option.key} activeOpacity={0.75} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => setSelectedMealType(option.key)}>
                    <react_native_1.Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {isTurkish ? option.tr : option.en}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>);
        })}
            </react_native_1.View>

            <react_native_1.Text style={styles.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</react_native_1.Text>
            <react_native_1.View style={styles.optionWrap}>
              {dayOptions.map(option => {
            const active = selectedMealDay === option.key;
            return (<react_native_1.TouchableOpacity key={option.key} activeOpacity={0.75} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => setSelectedMealDay(option.key)}>
                    <react_native_1.Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {isTurkish ? option.tr : option.en}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>);
        })}
            </react_native_1.View>

            <react_native_1.View style={styles.timeRow}>
              <react_native_1.View style={styles.timeColumn}>
                <react_native_1.Text style={styles.timeLabel}>{isTurkish ? 'Öğün saati' : 'Meal time'}</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('meal')}>
                  <vector_icons_1.Ionicons name="time-outline" size={16} color="#FF9600"/>
                  <react_native_1.Text style={styles.timeBtnText}>{formatTime(mealTime)}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
              <react_native_1.View style={styles.timeColumn}>
                <react_native_1.Text style={styles.timeLabel}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('notification')}>
                  <vector_icons_1.Ionicons name="notifications-outline" size={16} color="#58CC02"/>
                  <react_native_1.Text style={styles.timeBtnText}>{formatTime(notificationTime)}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.View>

            {showTimePicker && (<datetimepicker_1.default value={showTimePicker === 'meal' ? mealTime : notificationTime} mode="time" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                if (react_native_1.Platform.OS === 'android')
                    setShowTimePicker(null);
                if (!date)
                    return;
                if (showTimePicker === 'meal')
                    setMealTime(date);
                if (showTimePicker === 'notification')
                    setNotificationTime(date);
            }}/>)}

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={styles.cancelBtn} activeOpacity={0.8}>
                <react_native_1.Text style={styles.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity onPress={handleAddFoodToProgram} style={[styles.createBtn, creatingProgram && { opacity: 0.6 }]} disabled={creatingProgram} activeOpacity={0.85}>
                <react_native_1.Text style={styles.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    listContent: { paddingHorizontal: 20, paddingBottom: 120 },
    // Header
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
    headerTitle: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    // Dashboard
    dashboardCard: {
        backgroundColor: colors.background, borderRadius: 24, padding: 20,
        marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    dashRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    ringCalValue: { fontSize: 28, fontWeight: '800', color: colors.text },
    ringCalLabel: { fontSize: 12, color: colors.textTertiary, marginTop: -2 },
    ringCalUnit: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },
    macroBarsCol: { flex: 1, gap: 14 },
    // Macro Bars
    macroBarWrap: { gap: 6 },
    macroBarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    macroBarDot: { width: 8, height: 8, borderRadius: 4 },
    macroBarLabel: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1 },
    macroBarValue: { fontSize: 11, fontWeight: '600', color: colors.text },
    macroBarTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
    macroBarFill: { height: '100%', borderRadius: 3 },
    // Scan Card
    scanCard: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 16, borderRadius: 18,
        marginBottom: 18, gap: 14,
    },
    scanIconWrap: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    },
    scanTitle: { fontSize: 15, fontWeight: '700', color: colors.background },
    scanSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    // Search
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F5F5', borderRadius: 16,
        paddingHorizontal: 14, height: 44, marginBottom: 14, gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text, textAlignVertical: 'center' },
    // Category Chips
    catScroll: { gap: 8, paddingBottom: 8, marginBottom: 18 },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: 'transparent',
    },
    catChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    // Section
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 14 },
    // Food Cards
    foodCard: {
        flexDirection: 'row', overflow: 'hidden',
        backgroundColor: colors.background, borderRadius: 18,
        marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    },
    foodAccent: { width: 4 },
    foodContent: { flex: 1, padding: 14 },
    foodTop: { flexDirection: 'row', alignItems: 'center' },
    foodImage: { width: 48, height: 48, borderRadius: 14 },
    foodImgPlaceholder: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center',
    },
    foodInfo: { flex: 1, marginLeft: 12 },
    foodName: { fontSize: 14, fontWeight: '700', color: colors.text },
    foodMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
    foodActions: { alignItems: 'flex-end', gap: 8 },
    foodCal: { alignItems: 'flex-end' },
    foodCalValue: { fontSize: 20, fontWeight: '800', color: '#FF9600' },
    foodCalUnit: { fontSize: 10, color: colors.textTertiary },
    addItemBtn: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#58CC02',
        justifyContent: 'center', alignItems: 'center',
    },
    foodMacros: {
        flexDirection: 'row', marginTop: 10, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: '#F5F5F5', gap: 16,
    },
    foodMacroItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fmDot: { width: 6, height: 6, borderRadius: 3 },
    fmText: { fontSize: 11, color: '#6B7280' },
    // Empty
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    emptyText: { fontSize: 14, color: colors.textTertiary },
    retryBtn: {
        marginTop: 10,
        backgroundColor: '#FF9600',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalCard: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    modalSubtitle: {
        marginTop: 8,
        color: colors.textTertiary,
        fontSize: 12,
        marginBottom: 14,
    },
    modalSectionTitle: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 8,
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    optionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F8FAFC',
    },
    optionChipActive: {
        borderColor: '#58CC02',
        backgroundColor: '#58CC0218',
    },
    optionChipText: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#58CC02',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    timeColumn: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 8,
        fontWeight: '600',
    },
    timeBtn: {
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    timeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F8FAFC',
    },
    cancelBtnText: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
    },
    createBtn: {
        flex: 1.3,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#58CC02',
    },
    createBtnText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '800',
    },
});
exports.default = NutritionScreen;
