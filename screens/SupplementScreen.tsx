import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';
import { SupabaseService } from '../services/supabase';
import { NotificationService } from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, COMMON_STYLES } from '../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState('supplements');
  const [supplements, setSupplements] = useState<any[]>([]);
  const [vitamins, setVitamins] = useState<any[]>([]);
  const [minerals, setMinerals] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scheduledNotifs, setScheduledNotifs] = useState<Record<string, boolean>>({});
  const { isTurkish } = useTranslation();
  const insets = useSafeAreaInsets();

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
      if (activeTab === 'supplements') {
        const cat = selectedCategory === 'all' ? undefined : selectedCategory;
        const { data } = await supabase.getSupplements(cat);
        if (data) setSupplements(data);
      } else if (activeTab === 'vitamins') {
        const { data } = await supabase.getVitamins();
        if (data) setVitamins(data);
      } else {
        const { data } = await supabase.getMinerals();
        if (data) setMinerals(data);
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

    if (isScheduled) {
      await NotificationService.getInstance().cancelNotification(identifier);
      setScheduledNotifs(prev => ({ ...prev, [item.id]: false }));
    } else {
      // Schedule for 9:00 AM every day
      await NotificationService.getInstance().scheduleDailyReminder(
        isTurkish ? 'Takviye Hatırlatıcısı' : 'Supplement Reminder',
        isTurkish ? `${item.name} alma zamanı geldi!` : `Time to take your ${item.name}!`,
        9, 0,
        identifier
      );
      setScheduledNotifs(prev => ({ ...prev, [item.id]: true }));
    }
  }, [scheduledNotifs, isTurkish]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;
    const isScheduled = scheduledNotifs[item.id];
    const catInfo = getCategoryIcon(item.category || item.type);
    return (
      <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.7}>
        <AnimatedCard style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View style={[styles.iconCircle, { backgroundColor: catInfo.bg }]}>
              <Ionicons name={catInfo.icon as any} size={22} color={catInfo.color} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.brand || item.type || ''} {item.dosage ? `• ${item.dosage} ${item.unit || ''}` : ''}
              </Text>
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Benefits */}
              {item.benefits && item.benefits.length > 0 && (
                <View style={styles.expandSection}>
                  <Text style={styles.expandLabel}>{isTurkish ? 'Faydaları' : 'Benefits'}</Text>
                  <View style={styles.tagRow}>
                    {item.benefits.slice(0, 4).map((b: string, i: number) => (
                      <View key={i} style={styles.benefitTag}>
                        <Text style={styles.benefitText}>✓ {b}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Side Effects */}
              {item.side_effects && item.side_effects.length > 0 && (
                <View style={styles.expandSection}>
                  <Text style={styles.expandLabel}>{isTurkish ? 'Yan Etkiler' : 'Side Effects'}</Text>
                  <Text style={styles.expandText}>{item.side_effects.join(', ')}</Text>
                </View>
              )}

              {/* Warnings */}
              {item.warnings && item.warnings.length > 0 && (
                <View style={styles.expandSection}>
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={16} color={colors.warning} />
                    <Text style={styles.warningText}>{item.warnings.join(' • ')}</Text>
                  </View>
                </View>
              )}

              {/* Food Sources (for vitamins/minerals) */}
              {item.food_sources && item.food_sources.length > 0 && (
                <View style={styles.expandSection}>
                  <Text style={styles.expandLabel}>{isTurkish ? 'Besin Kaynakları' : 'Food Sources'}</Text>
                  <Text style={styles.expandText}>{item.food_sources.join(', ')}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, isScheduled && styles.actionBtnActive]}
                  onPress={() => toggleReminder(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isScheduled ? "notifications" : "notifications-outline"} size={20} color={isScheduled ? colors.textInverse : colors.accent} />
                  <Text style={[styles.actionBtnText, isScheduled && styles.actionBtnTextActive]}>
                    {isScheduled
                      ? (isTurkish ? 'Hatırlatıcı Açık (09:00)' : 'Reminder On (09:00)')
                      : (isTurkish ? 'Hatırlatıcı Ekle' : 'Add Reminder')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </AnimatedCard>
      </TouchableOpacity>
    );
  }, [expandedId, scheduledNotifs, isTurkish, colors, toggleReminder]);

  return (
    <View style={[COMMON_STYLES.screenContainer, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#CE82FF', '#A855F7']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.background }]}>{isTurkish ? 'Takviyeler' : 'Supplements'}</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setActiveTab(tab.id); setExpandedId(null); }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {isTurkish ? tab.tr : tab.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Categories (for supplements only) */}
      {activeTab === 'supplements' && (
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
      )}

      {/* Items List */}
      {loading ? (
        <View style={[COMMON_STYLES.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={getItems()}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 120, // Estimated supplement item height
            offset: 120 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={[COMMON_STYLES.center, { paddingTop: SPACING.section }]}>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textTertiary }}>
                {isTurkish ? 'Henüz veri yok' : 'No data yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  header: { paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xxl, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { ...TYPOGRAPHY.h1, color: colors.text },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.lg, gap: SPACING.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { ...TYPOGRAPHY.captionBold, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  catScroll: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: BORDER_RADIUS.pill, borderWidth: 1, borderColor: colors.borderLight, marginRight: SPACING.sm },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { ...TYPOGRAPHY.small, color: colors.text },
  catTextActive: { color: colors.textInverse },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.section },
  itemCard: { marginBottom: SPACING.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  itemInfo: { flex: 1 },
  itemName: { ...TYPOGRAPHY.bodyBold, color: colors.text },
  itemMeta: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  expandedContent: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  expandSection: { marginBottom: SPACING.md },
  expandLabel: { ...TYPOGRAPHY.captionBold, color: colors.text, marginBottom: SPACING.xs },
  expandText: { ...TYPOGRAPHY.caption, color: colors.textSecondary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  benefitTag: { backgroundColor: colors.successSoft, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.pill },
  benefitText: { ...TYPOGRAPHY.small, color: colors.success },
  warningBox: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: colors.warningSoft, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  warningText: { ...TYPOGRAPHY.caption, color: colors.warning, flex: 1 },
  actionRow: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: SPACING.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.accentSoft },
  actionBtnActive: { backgroundColor: colors.accent },
  actionBtnText: { ...TYPOGRAPHY.button, color: colors.accent, fontSize: 14 },
  actionBtnTextActive: { color: colors.textInverse },
});

export default SupplementScreen;
