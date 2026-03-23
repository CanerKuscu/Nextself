import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import GlassCard from '../components/GlassCard';
import SupplementQuickView from '../components/SupplementQuickView';
import SkeletonCard from '../components/SkeletonCard';
import { SupabaseService } from '@nextself/shared';
import { SupplementService } from '../services/supplementService';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import { useAlert } from '../components/CustomAlert';

const SUPPLEMENT_CATEGORIES = [
  { id: 'all', en: 'All', tr: 'Tümü' },
  { id: 'protein', en: 'Protein', tr: 'Protein' },
  { id: 'pre_workout', en: 'Pre-Workout', tr: 'Antrenman Öncesi' },
  { id: 'post_workout', en: 'Post-Workout', tr: 'Antrenman Sonrası' },
  { id: 'vitamin', en: 'Vitamins', tr: 'Vitaminler' },
  { id: 'mineral', en: 'Minerals', tr: 'Mineraller' },
  { id: 'other', en: 'Other', tr: 'Diğer' },
];

const TAB_OPTIONS = [
  { id: 'supplements', en: 'Supplements', tr: 'Takviyeler', icon: 'flask' },
  { id: 'vitamins', en: 'Vitamins', tr: 'Vitaminler', icon: 'sunny' },
  { id: 'minerals', en: 'Minerals', tr: 'Mineraller', icon: 'diamond' },
];

const SupplementScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [activeTab, setActiveTab] = useState('supplements');
  const [supplements, setSupplements] = useState<any[]>([]);
  const [vitamins, setVitamins] = useState<any[]>([]);
  const [minerals, setMinerals] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [scheduledNotifs, setScheduledNotifs] = useState<Record<string, boolean>>({});
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [selectedProgramDay, setSelectedProgramDay] = useState('monday');
  const [intakeTime, setIntakeTime] = useState(new Date());
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState<'intake' | 'notification' | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const { t, isTurkish, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();

  const getQueryLanguage = () => (language === 'tr' ? 'tr' : 'en');

  const normalizeItem = (item: any) => ({
    ...item,
    type: item.type || item.category,
    dosage: item.dosage ?? item.dosageAmount,
    unit: item.unit ?? item.dosageUnit,
    side_effects: item.side_effects ?? item.sideEffects ?? [],
  });

  useEffect(() => {
    NotificationService.getInstance().requestPermissions();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = SupabaseService.getInstance();
      const supplementService = SupplementService.getInstance();
      
      // Load user routines to sync state
      const { user } = await supabase.getCurrentUser();
      if (user) {
        const { data: routines } = await supplementService.getUserRoutine(user.id);
        if (routines) {
          const newScheduledNotifs: Record<string, boolean> = {};
          routines.forEach((r: any) => {
            newScheduledNotifs[r.supplement_id] = true;
          });
          setScheduledNotifs(prev => ({ ...prev, ...newScheduledNotifs }));
        }
      }

      const queryLanguage = getQueryLanguage();

      if (activeTab === 'supplements') {
        const cat = selectedCategory === 'all' ? undefined : selectedCategory;
        const { data } = await supplementService.getSupplements(queryLanguage, cat);
        setSupplements((data || []).map(normalizeItem));
      } else if (activeTab === 'vitamins') {
        const { data } = await supplementService.getSupplements(queryLanguage, 'vitamin');
        setVitamins((data || []).map(normalizeItem));
      } else {
        const { data } = await supplementService.getSupplements(queryLanguage, 'mineral');
        setMinerals((data || []).map(normalizeItem));
      }
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItems = () => {
    if (activeTab === 'supplements') return supplements;
    if (activeTab === 'vitamins') return vitamins;
    return minerals;
  };

  const dayOptions = [
    { key: 'monday', tr: 'Pazartesi', en: 'Monday' },
    { key: 'tuesday', tr: 'Salı', en: 'Tuesday' },
    { key: 'wednesday', tr: 'Çarşamba', en: 'Wednesday' },
    { key: 'thursday', tr: 'Perşembe', en: 'Thursday' },
    { key: 'friday', tr: 'Cuma', en: 'Friday' },
    { key: 'saturday', tr: 'Cumartesi', en: 'Saturday' },
    { key: 'sunday', tr: 'Pazar', en: 'Sunday' },
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

  const openCreateProgramModal = useCallback(() => {
    const today = new Date();
    const jsDay = today.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    setSelectedProgramDay(dayOptions[dayIndex].key);
    setIntakeTime(today);
    setNotificationTime(today);
    setShowCreateProgramModal(true);
  }, [dayOptions]);

  const closeCreateProgramModal = useCallback(() => {
    setShowCreateProgramModal(false);
    setShowTimePicker(null);
    setCreatingProgram(false);
  }, []);

  const getCategoryIcon = (category: string): { icon: string; color: string; bg: string } => {
    switch (category) {
      case 'protein': return { icon: 'barbell', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' };
      case 'pre_workout': return { icon: 'flash', color: '#FFC800', bg: 'rgba(255,200,0,0.12)' };
      case 'post_workout': return { icon: 'refresh', color: '#58CC02', bg: 'rgba(88,204,2,0.12)' };
      case 'vitamin': case 'water_soluble': case 'fat_soluble': return { icon: 'sunny', color: '#FF9600', bg: 'rgba(255,150,0,0.12)' };
      case 'mineral': case 'macro': case 'trace': return { icon: 'diamond', color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)' };
      default: return { icon: 'flask', color: '#CE82FF', bg: 'rgba(206,130,255,0.12)' };
    }
  };

  const toggleReminder = useCallback(async (item: any) => {
    const isScheduled = scheduledNotifs[item.id];
    const identifier = `supplement-${item.id}`;
    const supplementService = SupplementService.getInstance();
    const { user } = await SupabaseService.getInstance().getCurrentUser();

    if (isScheduled) {
      await NotificationService.getInstance().cancelNotification(identifier);
      setScheduledNotifs(prev => ({ ...prev, [item.id]: false }));
      if (user) {
        await supplementService.removeFromRoutine(user.id, item.id);
      }
    } else {
      // Schedule for 9:00 AM every day
      await NotificationService.getInstance().scheduleSmartReminder(
        'supplement',
        9, 0,
        identifier,
        'Supplements',
        undefined,
        language,
        { name: item.name }
      );
      setScheduledNotifs(prev => ({ ...prev, [item.id]: true }));
      if (user) {
        await supplementService.addToRoutine(user.id, item.id, '09:00:00');
      }
    }
  }, [scheduledNotifs, t, language]);

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const isScheduled = scheduledNotifs[item.id];
    const catInfo = getCategoryIcon(item.category || item.type);
    
    return (
      <GlassCard
        variant="premium"
        delay={index * 80} // Staggered animation
        onPress={() => setSelectedItem(item)}
        style={styles.itemCard}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.iconCircle, { backgroundColor: catInfo.bg }]}>
            <Ionicons name={catInfo.icon as any} size={24} color={catInfo.color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.brand || item.type || ''} {item.dosage ? `• ${item.dosage} ${item.unit || ''}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleReminder(item)}
            style={[styles.miniFab, isScheduled && styles.miniFabActive]}
          >
            <Ionicons 
              name={isScheduled ? "notifications" : "notifications-outline"} 
              size={18} 
              color={isScheduled ? '#FFF' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Preview of benefits */}
        {item.benefits && item.benefits.length > 0 && (
           <View style={styles.benefitsPreview}>
             {item.benefits.slice(0, 2).map((b: string, i: number) => (
               <Text key={i} style={styles.benefitPreviewText}>• {b}</Text>
             ))}
             {item.benefits.length > 2 && (
               <Text style={styles.benefitPreviewText}>+ {item.benefits.length - 2} more</Text>
             )}
           </View>
        )}
      </GlassCard>
    );
  }, [scheduledNotifs, isTurkish, colors, toggleReminder]);

  const handleAddProgram = async () => {
    try {
      setCreatingProgram(true);
      const supabase = SupabaseService.getInstance();
      const { user } = await supabase.getCurrentUser();
      if (!user) {
        showAlert({
          type: 'warning',
          title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
          message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add a program.',
          buttons: [{ text: 'OK' }],
        });
        return;
      }

      const tabLabel = activeTab === 'supplements'
        ? (isTurkish ? 'Takviye' : 'Supplement')
        : activeTab === 'vitamins'
          ? (isTurkish ? 'Vitamin' : 'Vitamin')
          : (isTurkish ? 'Mineral' : 'Mineral');
      const itemsCount = getItems().length;
      const selectedDay = dayOptions.find(day => day.key === selectedProgramDay);
      const dayLabel = isTurkish ? selectedDay?.tr : selectedDay?.en;

      const { error } = await supabase.createAiProgram({
        userId: user.id,
        type: 'supplement',
        title: `${tabLabel} ${isTurkish ? 'Programı' : 'Program'}`,
        content: [
          `${isTurkish ? 'Kategori' : 'Category'}: ${tabLabel}`,
          `${isTurkish ? 'Gün' : 'Day'}: ${dayLabel}`,
          `${isTurkish ? 'Kullanım saati' : 'Intake time'}: ${formatTime(intakeTime)}`,
          `${isTurkish ? 'Bildirim saati' : 'Notification time'}: ${formatTime(notificationTime)}`,
          `${isTurkish ? 'Toplam öğe' : 'Total items'}: ${itemsCount}`,
        ].join('\n'),
      });
      if (error) throw error;

      const notificationService = NotificationService.getInstance();
      await notificationService.requestPermissions();
      await notificationService.scheduleSmartReminder(
        'supplement',
        notificationTime.getHours(),
        notificationTime.getMinutes(),
        `supplement_${user.id}_${activeTab}_${selectedProgramDay}`,
        'Supplements',
        { tab: activeTab },
        language,
        { name: tabLabel },
        weekdayMap[selectedProgramDay]
      );

      showAlert({
        type: 'success',
        title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
        message: isTurkish ? `${tabLabel} programı eklendi ve bildirim ayarlandı.` : `${tabLabel} program added and notification is scheduled.`,
        buttons: [{ text: 'OK' }],
      });
      closeCreateProgramModal();
    } catch {
      showAlert({
        type: 'error',
        title: isTurkish ? 'Hata' : 'Error',
        message: isTurkish ? 'Program eklenemedi. Tekrar deneyin.' : 'Could not add program. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setCreatingProgram(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <AlertComponent />
      <LinearGradient 
        colors={isDark ? ['#1A1A2E', '#16162B'] : ['#F0F0F5', '#FFFFFF']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>{isTurkish ? 'Takviyeler' : 'Supplements'}</Text>
          <TouchableOpacity style={styles.addProgramBtn} onPress={openCreateProgramModal} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={16} color="#FFF" />
            <Text style={styles.addProgramBtnText}>{isTurkish ? 'Programa Ekle' : 'Add to Program'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{isTurkish ? 'Premium Mağaza' : 'Premium Store'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setActiveTab(tab.id); }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isActive ? ['#CE82FF', '#A855F7'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={isActive ? '#FFF' : colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {isTurkish ? tab.tr : tab.en}
              </Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
      </View>

      {/* Categories (for supplements only) */}
      {activeTab === 'supplements' && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {SUPPLEMENT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, isActive && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>
                    {isTurkish ? cat.tr : cat.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Items List */}
      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} height={120} style={styles.itemCard} />
          ))}
        </View>
      ) : (
        <FlatList
          data={getItems()}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={[COMMON_STYLES.center, { paddingTop: SPACING.xl }]}>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textTertiary }}>
                {isTurkish ? 'Henüz veri yok' : 'No data yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Quick View Modal */}
      <SupplementQuickView
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleReminder={toggleReminder}
        isScheduled={selectedItem ? scheduledNotifs[selectedItem.id] : false}
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
              <Text style={styles.modalTitle}>{isTurkish ? 'Create Program' : 'Create Program'}</Text>
              <TouchableOpacity onPress={closeCreateProgramModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {activeTab === 'supplements'
                ? (isTurkish ? 'Takviye programı oluştur' : 'Create supplement program')
                : activeTab === 'vitamins'
                  ? (isTurkish ? 'Vitamin programı oluştur' : 'Create vitamin program')
                  : (isTurkish ? 'Mineral programı oluştur' : 'Create mineral program')}
            </Text>

            <Text style={styles.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</Text>
            <View style={styles.optionWrap}>
              {dayOptions.map(option => {
                const active = selectedProgramDay === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.75}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setSelectedProgramDay(option.key)}
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
                <Text style={styles.timeLabel}>{isTurkish ? 'Kullanım saati' : 'Intake time'}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('intake')}>
                  <Ionicons name="time-outline" size={16} color="#FF9600" />
                  <Text style={styles.timeBtnText}>{formatTime(intakeTime)}</Text>
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
                value={showTimePicker === 'intake' ? intakeTime : notificationTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowTimePicker(null);
                  if (!date) return;
                  if (showTimePicker === 'intake') setIntakeTime(date);
                  if (showTimePicker === 'notification') setNotificationTime(date);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeCreateProgramModal} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProgram}
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
    </ScreenContainer>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.h1,
    color: colors.text,
  },
  addProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#58CC02',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addProgramBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: '#FFF',
    fontSize: 12,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.h3,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    marginBottom: SPACING.sm,
  },
  tabScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    overflow: 'hidden',
  },
  tabActive: {
    borderColor: 'transparent',
    backgroundColor: colors.secondary, // Fallback if gradient fails
  },
  tabText: {
    ...TYPOGRAPHY.button,
    color: colors.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  categoryContainer: {
    marginBottom: SPACING.md,
  },
  catScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  catText: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  itemCard: {
    marginBottom: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.h3,
    color: colors.text,
    fontSize: 16,
    marginBottom: 2,
  },
  itemMeta: {
    ...TYPOGRAPHY.caption,
    color: colors.textSecondary,
  },
  miniFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniFabActive: {
    backgroundColor: colors.accent,
  },
  benefitsPreview: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingLeft: 64, // Align with text
  },
  benefitPreviewText: {
    ...TYPOGRAPHY.caption,
    color: colors.textTertiary,
    fontSize: 11,
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
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
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

export default SupplementScreen;
