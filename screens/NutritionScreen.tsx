import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import { SupabaseService } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { CONFIG } from '../config/config';
import PlatformStorage from '../utils/platformStorage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import FoodCategoryIcon from '../components/FoodCategoryIcon';
import { useTheme } from '../contexts/ThemeContext';

const SCAN_STORAGE_KEY = 'biosync_daily_scans';

const CATEGORY_ICONS: Record<string, { icon: string; color: string; tr: string }> = {
  protein: { icon: 'barbell', color: '#FF6B6B', tr: 'Protein' },
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
  const progress = Math.min(value / goal, 1);
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
  const { width } = useWindowDimensions();
  const [foods, setFoods] = useState<any[]>([]);
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
  const { showAlert, AlertComponent } = useAlert();
  const insets = useSafeAreaInsets();

  useEffect(() => { loadCategories(); loadDailyMacros(); }, []);
  useEffect(() => { loadFoods(); loadScanCount(); }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const supabase = SupabaseService.getInstance();
      const { data } = await supabase.getFoodCategories();
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

  const loadFoods = async () => {
    setLoading(true);
    try {
      const supabase = SupabaseService.getInstance();
      // Use exact DB category name when available
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const { data } = await supabase.getFoodItems(isTurkish ? 'tr' : 'en', category, searchQuery || undefined);
      if (data) setFoods(data);
    } catch (err) { console.error('Load foods error:', err); }
    finally { setLoading(false); }
  };

  const loadScanCount = async () => {
    try {
      const today = new Date().toDateString();
      const stored = await PlatformStorage.getItem(SCAN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) setDailyScans(parsed.count);
        else { await PlatformStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify({ date: today, count: 0 })); setDailyScans(0); }
      }
    } catch (err) { console.error(err); }
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

  const getFoodField = (food: any, field: string): string => {
    if (isTurkish) { const trField = `${field}_tr`; if (food[trField]) return food[trField]; }
    return food[field] || '';
  };

  const handleSearch = () => { loadFoods(); };

  const handleCategoryChange = (cat: string) => {
    setSearchQuery('');
    setSelectedCategory(cat);
  };

  // Calorie ring
  const ringSize = 140;
  const ringStroke = 12;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const calProgress = Math.min(dailyMacros.calories / dailyMacros.calorieGoal, 1);
  const ringOffset = ringCircumference * (1 - calProgress);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={foods}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={11}
        // Optimize FlatList performance with windowing and batching
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 120, // Estimated food card height
          offset: 120 * index,
          index,
        })}
        ListHeaderComponent={
          <View>
            {/* ─── HEADER ─── */}
            <Text style={styles.headerTitle}>{t('nutrition')}</Text>

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
        renderItem={useCallback(({ item }: { item: any }) => (
          <View style={styles.foodCard}>
            <View style={[styles.foodAccent, { backgroundColor: '#FF9600' }]} />
            <View style={styles.foodContent}>
              <View style={styles.foodTop}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.foodImage} contentFit="cover" cachePolicy="memory-disk" transition={500} />
                ) : (
                  <FoodCategoryIcon category={getFoodField(item, 'category')} foodName={getFoodField(item, 'name')} size={48} />
                )}
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>{getFoodField(item, 'name')}</Text>
                  <Text style={styles.foodMeta}>{getFoodField(item, 'category')} • {item.serving_size}</Text>
                </View>
                <View style={styles.foodCal}>
                  <Text style={styles.foodCalValue}>{item.calories}</Text>
                  <Text style={styles.foodCalUnit}>kcal</Text>
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
        ), [styles, isTurkish])}
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
              <Text style={styles.emptyText}>{isTurkish ? 'Yiyecek bulunamadı' : 'No food items found'}</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Header
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 20, letterSpacing: -0.5 },

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
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

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
  foodCal: { alignItems: 'flex-end' },
  foodCalValue: { fontSize: 20, fontWeight: '800', color: '#FF9600' },
  foodCalUnit: { fontSize: 10, color: colors.textTertiary },
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
});

export default NutritionScreen;
