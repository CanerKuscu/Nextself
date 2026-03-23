import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, useWindowDimensions, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseService } from '@nextself/shared';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { CONFIG } from '@nextself/shared';
import PlatformStorage from '@nextself/shared';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useAlert } from '../components/CustomAlert';
import FoodCategoryIcon from '../components/FoodCategoryIcon';
import { useTheme } from '../contexts/ThemeContext';

const SCAN_STORAGE_KEY = 'nextself_daily_scans';

const CATEGORY_ICONS: Record<string, { icon: string; color: string; tr: string }> = {
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

const getCategoryLabel = (category: string, isTurkish: boolean) => {
  if (!isTurkish) return category;
  const key = category.toLowerCase();
  return CATEGORY_ICONS[key]?.tr || category;
};

// Macro Progress Bar Component
const MacroBar = ({ label, value, goal, color, unit, styles, colors }: any) => {
  const safeGoal = goal > 0 ? goal : 1;
  const safeValue = Number.isFinite(value) ? value : 0;
  const progress = Math.min(safeValue / safeGoal, 1);
  return (
    <View style={styles.macroBarWrap}>
      <View style={styles.macroBarHeader}>
        <View style={[styles.macroBarDot, { backgroundColor: color }]} />
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValue}>{value}{unit} <Text style={{ color: colors.textTertiary }}>/ {goal}{unit}</Text></Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const NutritionScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [foods, setFoods] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 60;
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyScans, setDailyScans] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0,
    calorieGoal: 2500, proteinGoal: 150, carbsGoal: 300, fatGoal: 70,
  });
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const { t, isTurkish } = useTranslation();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [selectedFoodForProgram, setSelectedFoodForProgram] = useState<any | null>(null);
  const [selectedMealDay, setSelectedMealDay] = useState('monday');
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [mealTime, setMealTime] = useState(new Date());
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState<'meal' | 'notification' | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  useEffect(() => { loadDailyMacros(); }, []);
  useEffect(() => { loadCategories(); }, [isTurkish]);
  useEffect(() => { loadScanCount(); }, []);

  // Debounced search effect - triggers when searchQuery or selectedCategory changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // reset pagination when query/category changes
      setPage(0);
      setHasMore(true);
      loadFoods(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, isTurkish]);

  const loadCategories = async () => {
    try {
      const supabase = SupabaseService.getInstance();
      const { data } = await supabase.getFoodCategories(isTurkish ? 'tr' : 'en');
      if (data && data.length > 0) setDbCategories(data);
    } catch (err) { console.error('Load categories error:', err); }
  };

  const loadDailyMacros = async () => {
    try {
      const supabase = SupabaseService.getInstance();
      const { user } = await supabase.getCurrentUser();
      if (!user) return;
      const { data } = await supabase.getTodayNutritionSummary(user.id);
      if (data) {
        setDailyMacros(prev => ({
          ...prev,
          calories: Math.round(data.calories),
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fat: Math.round(data.fat),
        }));
      }
    } catch (err) { console.error('Load daily macros error:', err); }
  };

  const loadFoods = async (pageParam: number = 0) => {
    if (!hasMore && pageParam > 0) return;
    if (pageParam === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      setLoadError(null);
      const supabase = SupabaseService.getInstance();
      const macroKeys = ['protein', 'carbs', 'fat'];
      const categoryParam = (selectedCategory === 'all' || macroKeys.includes(selectedCategory)) ? undefined : selectedCategory;
      const { data, error } = await supabase.getFoodItems(isTurkish ? 'tr' : 'en', categoryParam, searchQuery || undefined, pageParam, PAGE_SIZE);
      if (error) {
        console.error('Load foods error:', error);
        setLoadError(isTurkish ? 'Besinler yüklenemedi' : 'Failed to load foods');
        if (pageParam === 0) setFoods([]);
      } else {
        const raw = data || [];

        // Apply client-side macro filtering/sorting if requested
        let final = raw;
        if (macroKeys.includes(selectedCategory)) {
          const map: Record<string, string> = { protein: 'protein_g', carbs: 'carbs_g', fat: 'fat_g' };
          const key = map[selectedCategory];
          final = raw.filter((f: any) => Number(f[key] || 0) > 0).sort((a: any, b: any) => (Number(b[key] || 0) - Number(a[key] || 0)));
        }

        if (pageParam === 0) {
          setFoods(final);
        } else {
          // append new page but avoid duplicates
          setFoods(prev => {
            const ids = new Set(prev.map(p => p.id));
            const appended = final.filter((f: any) => !ids.has(f.id));
            return prev.concat(appended);
          });
        }

        // Determine if more pages exist based on raw server result, not post-filtered length
        if (!raw || raw.length < PAGE_SIZE) setHasMore(false);
      }
    } catch (err) {
      console.error('Load foods error:', err);
      setLoadError(isTurkish ? 'Besinler yüklenemedi' : 'Failed to load foods');
      if (pageParam === 0) setFoods([]);
    }
    finally {
      if (pageParam === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const loadScanCount = async () => {
    try {
      const today = new Date().toDateString();
      const stored = await PlatformStorage.getItem(SCAN_STORAGE_KEY);

      // Initialize for first-time users
      if (!stored) {
        await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setDailyScans(0);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch (parseErr) {
        console.error('Corrupted scan data, resetting:', parseErr);
        await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setDailyScans(0);
        return;
      }

      // Validate parsed data structure
      if (!parsed || typeof parsed.date !== 'string' || typeof parsed.count !== 'number') {
        await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setDailyScans(0);
        return;
      }

      if (parsed.date === today) {
        setDailyScans(parsed.count);
      } else {
        // New day - reset count
        await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        setDailyScans(0);
      }
    } catch (err) {
      console.error('Load scan count error:', err);
      setDailyScans(0); // Graceful fallback
    }
  };

  const incrementScanCount = async () => {
    const today = new Date().toDateString();
    const newCount = dailyScans + 1;
    setDailyScans(newCount);
    await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
  };

  const handleScan = () => {
    if (dailyScans >= CONFIG.FREE_FOOD_SCANS_PER_DAY) {
      showAlert({
        type: 'warning',
        title: isTurkish ? 'Tarama Limiti' : 'Scan Limit',
        message: isTurkish
          ? `Günlük ${CONFIG.FREE_FOOD_SCANS_PER_DAY} ücretsiz tarama hakkınız doldu.`
          : `You've used your ${CONFIG.FREE_FOOD_SCANS_PER_DAY} free daily scans.`,
        buttons: [
          { text: isTurkish ? 'İptal' : 'Cancel' },
          {
            text: isTurkish ? 'Reklam İzle' : 'Watch Ad', onPress: async () => {
              // TODO: Integrate actual ad SDK (e.g., AdMob rewarded ad)
              // After ad is watched, grant one extra scan by NOT incrementing & navigate
              navigation.navigate('FoodScanner');
            }
          },
        ],
      });
    } else { incrementScanCount(); navigation.navigate('FoodScanner'); }
  };

  const handleImageError = useCallback((itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  }, []);

  const getFoodField = useCallback((food: any, field: string): string => {
    if (isTurkish) { const trField = `${field}_tr`; if (food[trField]) return food[trField]; }
    return food[field] || '';
  }, [isTurkish]);

  const renderFoodImage = useCallback((item: any) => {
    const hasError = imageErrors[item.id];
    const hasImage = item.image_url && !hasError;

    if (hasImage) {
      return (
        <Image
          source={{ uri: item.image_url }}
          style={styles.foodImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={500}
          onError={() => handleImageError(item.id)}
        />
      );
    }
    return (
      <FoodCategoryIcon
        category={getFoodField(item, 'category')}
        foodName={getFoodField(item, 'name')}
        size={48}
      />
    );
  }, [getFoodField, handleImageError, imageErrors, styles]);

  const handleSearch = () => {
    setPage(0);
    setHasMore(true);
    loadFoods(0);
  };

  const handleCategoryChange = (cat: string) => {
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
  const weekdayMap: Record<string, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };

  const formatTime = useCallback((date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  const openCreateProgramModal = useCallback((item: any) => {
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

  const closeCreateProgramModal = useCallback(() => {
    setShowCreateProgramModal(false);
    setSelectedFoodForProgram(null);
    setShowTimePicker(null);
    setCreatingProgram(false);
  }, []);

  const handleAddFoodToProgram = useCallback(async () => {
    if (!selectedFoodForProgram) return;
    try {
      setCreatingProgram(true);
      const supabase = SupabaseService.getInstance();
      const { user } = await supabase.getCurrentUser();
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
      const dayLabel = isTurkish ? selectedDay?.tr : selectedDay?.en;
      const mealLabel = isTurkish ? selectedMeal?.tr : selectedMeal?.en;
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

      const { error } = await supabase.createAiProgram({
        userId: user.id,
        type: 'nutrition',
        title: `${foodName} ${isTurkish ? 'Planı' : 'Plan'}`,
        content,
      });

      if (error) throw error;

      const notificationService = NotificationService.getInstance();
      await notificationService.requestPermissions();
      await notificationService.scheduleSmartReminder(
        'nutrition',
        notificationTime.getHours(),
        notificationTime.getMinutes(),
        `nutrition_${user.id}_${selectedFoodForProgram.id}_${selectedMealDay}`,
        'Nutrition',
        { foodName },
        isTurkish ? 'tr' : 'en',
        undefined,
        weekdayMap[selectedMealDay]
      );

      showAlert({
        type: 'success',
        title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
        message: isTurkish ? `${foodName} programına eklendi ve bildirim ayarlandı.` : `${foodName} has been added to your program and notification is scheduled.`,
        buttons: [{ text: 'OK' }],
      });
      closeCreateProgramModal();
    } catch {
      showAlert({
        type: 'error',
        title: isTurkish ? 'Hata' : 'Error',
        message: isTurkish ? 'Besin programa eklenemedi. Tekrar deneyin.' : 'Could not add food to program. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setCreatingProgram(false);
    }
  }, [closeCreateProgramModal, dayOptions, formatTime, getFoodField, isTurkish, mealOptions, mealTime, notificationTime, selectedFoodForProgram, selectedMealDay, selectedMealType, showAlert, weekdayMap]);

  const renderFoodItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.foodCard}>
      <View style={[styles.foodAccent, { backgroundColor: '#FF9600' }]} />
      <View style={styles.foodContent}>
        <View style={styles.foodTop}>
          {renderFoodImage(item)}
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={1}>{getFoodField(item, 'name')}</Text>
            <Text style={styles.foodMeta}>{getFoodField(item, 'category')} • {item.serving_size}</Text>
          </View>
          <View style={styles.foodActions}>
            <View style={styles.foodCal}>
              <Text style={styles.foodCalValue}>{item.calories}</Text>
              <Text style={styles.foodCalUnit}>kcal</Text>
            </View>
            <TouchableOpacity
              style={styles.addItemBtn}
              activeOpacity={0.8}
              onPress={() => openCreateProgramModal(item)}
            >
              <Ionicons name="add" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.foodMacros}>
          <View style={styles.foodMacroItem}>
            <View style={[styles.fmDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.fmText}>{item.protein_g}g {isTurkish ? 'protein' : 'protein'}</Text>
          </View>
          <View style={styles.foodMacroItem}>
            <View style={[styles.fmDot, { backgroundColor: '#FF9600' }]} />
            <Text style={styles.fmText}>{item.carbs_g}g {isTurkish ? 'karb' : 'carbs'}</Text>
          </View>
          <View style={styles.foodMacroItem}>
            <View style={[styles.fmDot, { backgroundColor: '#1CB0F6' }]} />
            <Text style={styles.fmText}>{item.fat_g}g {isTurkish ? 'yağ' : 'fat'}</Text>
          </View>
        </View>
      </View>
    </View>
  ), [styles, renderFoodImage, getFoodField, isTurkish, openCreateProgramModal]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={true} />
      <FlatList
        data={foods}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingTop: 12 }]}
        showsVerticalScrollIndicator={false}
        refreshing={loading && page === 0}
        onRefresh={() => {
          setPage(0);
          setHasMore(true);
          loadFoods(0);
          loadDailyMacros();
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        // Optimize FlatList performance with windowing and batching
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 120, // Estimated food card height
          offset: 120 * index,
          index,
        })}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && hasMore && !loading) {
            const next = page + 1;
            setPage(next);
            loadFoods(next);
          }
        }}
        ListHeaderComponent={
          <View>
            {/* ─── HEADER ─── */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>{t('nutrition')}</Text>
            </View>

            {/* ─── CALORIE RING + MACROS ─── */}
            <View style={styles.dashboardCard}>
              <View style={styles.dashRow}>
                {/* Ring */}
                <View style={{ alignItems: 'center', width: ringSize }}>
                  <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={ringSize} height={ringSize} style={{ position: 'absolute' }}>
                      <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="#F0F0F0" strokeWidth={ringStroke} fill="none" />
                      <Circle
                        cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                        stroke="#FF9600" strokeWidth={ringStroke} fill="none"
                        strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                        strokeDashoffset={ringOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                      />
                    </Svg>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.ringCalValue}>{dailyMacros.calories}</Text>
                      <Text style={styles.ringCalLabel}>/ {dailyMacros.calorieGoal}</Text>
                      <Text style={styles.ringCalUnit}>kcal</Text>
                    </View>
                  </View>
                </View>

                {/* Macro Bars */}
                <View style={styles.macroBarsCol}>
                  <MacroBar label={isTurkish ? 'Protein' : 'Protein'} value={dailyMacros.protein} goal={dailyMacros.proteinGoal} color="#FF6B6B" unit="g" styles={styles} colors={colors} />
                  <MacroBar label={isTurkish ? 'Karb' : 'Carbs'} value={dailyMacros.carbs} goal={dailyMacros.carbsGoal} color="#FF9600" unit="g" styles={styles} colors={colors} />
                  <MacroBar label={isTurkish ? 'Yağ' : 'Fat'} value={dailyMacros.fat} goal={dailyMacros.fatGoal} color="#1CB0F6" unit="g" styles={styles} colors={colors} />
                </View>
              </View>
            </View>

            {/* ─── SCAN CARD ─── */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleScan}>
              <LinearGradient
                colors={['#FF9600', '#FF6B6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanCard}
              >
                <View style={styles.scanIconWrap}>
                  <Ionicons name="camera" size={22} color="#FF9600" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scanTitle}>{isTurkish ? 'Yiyecek Tara' : 'Scan Food'}</Text>
                  <Text style={styles.scanSub}>
                    {dailyScans}/{CONFIG.FREE_FOOD_SCANS_PER_DAY} {isTurkish ? 'kullanıldı' : 'used'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>

            {/* ─── SEARCH ─── */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder={isTurkish ? 'Yiyecek ara...' : 'Search food...'}
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* ─── CATEGORY CHIPS ─── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {/* All category */}
              <TouchableOpacity
                style={[styles.catChip, selectedCategory === 'all' && { backgroundColor: '#58CC0215', borderColor: '#58CC02' }]}
                onPress={() => handleCategoryChange('all')}
                activeOpacity={0.7}
              >
                <Ionicons name="restaurant" size={16} color={selectedCategory === 'all' ? '#58CC02' : colors.textTertiary} />
                <Text style={[styles.catChipText, selectedCategory === 'all' && { color: '#58CC02' }]}>
                  {isTurkish ? 'Tümü' : 'All'}
                </Text>
              </TouchableOpacity>
              {/* Macro quick-filters */}
              <TouchableOpacity
                style={[styles.catChip, selectedCategory === 'protein' && { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B' }]}
                onPress={() => handleCategoryChange('protein')}
                activeOpacity={0.7}
              >
                <Ionicons name="barbell" size={16} color={selectedCategory === 'protein' ? '#FF6B6B' : colors.textTertiary} />
                <Text style={[styles.catChipText, selectedCategory === 'protein' && { color: '#FF6B6B' }]}>{isTurkish ? 'Protein' : 'Protein'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catChip, selectedCategory === 'carbs' && { backgroundColor: '#FF960015', borderColor: '#FF9600' }]}
                onPress={() => handleCategoryChange('carbs')}
                activeOpacity={0.7}
              >
                <Ionicons name={CATEGORY_ICONS['carbs'].icon as any} size={16} color={selectedCategory === 'carbs' ? CATEGORY_ICONS['carbs'].color : colors.textTertiary} />
                <Text style={[styles.catChipText, selectedCategory === 'carbs' && { color: CATEGORY_ICONS['carbs'].color }]}>{isTurkish ? 'Karb' : 'Carbs'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catChip, selectedCategory === 'fat' && { backgroundColor: '#1CB0F615', borderColor: '#1CB0F6' }]}
                onPress={() => handleCategoryChange('fat')}
                activeOpacity={0.7}
              >
                <Ionicons name={CATEGORY_ICONS['fat'].icon as any} size={16} color={selectedCategory === 'fat' ? CATEGORY_ICONS['fat'].color : colors.textTertiary} />
                <Text style={[styles.catChipText, selectedCategory === 'fat' && { color: CATEGORY_ICONS['fat'].color }]}>{isTurkish ? 'Yağ' : 'Fat'}</Text>
              </TouchableOpacity>
              {/* Dynamic categories from DB */}
              {dbCategories.map(cat => {
                const key = cat.toLowerCase();
                const iconData = CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, active && { backgroundColor: iconData.color + '15', borderColor: iconData.color }]}
                    onPress={() => handleCategoryChange(cat)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={iconData.icon as any} size={16} color={active ? iconData.color : colors.textTertiary} />
                    <Text style={[styles.catChipText, active && { color: iconData.color }]}>{getCategoryLabel(cat, isTurkish)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Section title */}
            <Text style={styles.sectionTitle}>
              {isTurkish ? 'Besinler' : 'Foods'} ({foods.length})
            </Text>
          </View>
        }
        renderItem={renderFoodItem}
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator size="large" color="#FF9600" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="restaurant-outline" size={32} color="#FF9600" />
              </View>
              <Text style={styles.emptyText}>{loadError || (isTurkish ? 'Yiyecek bulunamadı' : 'No food items found')}</Text>
              {loadError && (
                <TouchableOpacity onPress={() => loadFoods(0)} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>{isTurkish ? 'Tekrar Dene' : 'Try Again'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        ListFooterComponent={loadingMore ? (
          <View style={{ paddingVertical: 18 }}>
            <ActivityIndicator size="small" color="#FF9600" />
          </View>
        ) : null}
      />
      <Modal
        visible={showCreateProgramModal}
        transparent
        animationType="fade"
        onRequestClose={closeCreateProgramModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
              <TouchableOpacity onPress={closeCreateProgramModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedFoodForProgram
                ? `${isTurkish ? 'Besin' : 'Food'}: ${getFoodField(selectedFoodForProgram, 'name')}`
                : ''}
            </Text>

            <Text style={styles.modalSectionTitle}>{isTurkish ? 'Öğün' : 'Meal'}</Text>
            <View style={styles.optionWrap}>
              {mealOptions.map(option => {
                const active = selectedMealType === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.75}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setSelectedMealType(option.key)}
                  >
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {isTurkish ? option.tr : option.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</Text>
            <View style={styles.optionWrap}>
              {dayOptions.map(option => {
                const active = selectedMealDay === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.75}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setSelectedMealDay(option.key)}
                  >
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {isTurkish ? option.tr : option.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>{isTurkish ? 'Öğün saati' : 'Meal time'}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('meal')}>
                  <Ionicons name="time-outline" size={16} color="#FF9600" />
                  <Text style={styles.timeBtnText}>{formatTime(mealTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('notification')}>
                  <Ionicons name="notifications-outline" size={16} color="#58CC02" />
                  <Text style={styles.timeBtnText}>{formatTime(notificationTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={showTimePicker === 'meal' ? mealTime : notificationTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowTimePicker(null);
                  if (!date) return;
                  if (showTimePicker === 'meal') setMealTime(date);
                  if (showTimePicker === 'notification') setNotificationTime(date);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeCreateProgramModal}
                style={styles.cancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFoodToProgram}
                style={[styles.createBtn, creatingProgram && { opacity: 0.6 }]}
                disabled={creatingProgram}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
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

export default NutritionScreen;
