import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { DailyMission } from '../../services/missionService';

import { LinearGradient } from 'expo-linear-gradient';

interface DailyMissionsCardProps {
  missions: DailyMission[];
  onMissionPress: (mission: DailyMission) => void;
}

const CATEGORY_META: Record<string, { icon: string; color: string; gradient: string[] }> = {
  workout: { icon: 'barbell', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF4757'] },
  nutrition: { icon: 'restaurant', color: '#58CC02', gradient: ['#58CC02', '#46A302'] },
  health: { icon: 'heart', color: '#1CB0F6', gradient: ['#1CB0F6', '#0099DD'] },
  social: { icon: 'people', color: '#CE82FF', gradient: ['#CE82FF', '#A855F7'] },
  streak: { icon: 'flame', color: '#FF9600', gradient: ['#FF9600', '#FF6B00'] },
  mindfulness: { icon: 'leaf', color: '#7C3AED', gradient: ['#7C3AED', '#6D28D9'] },
  hydration: { icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
  supplements: { icon: 'flask', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
};

const DailyMissionsCard = memo(({ missions, onMissionPress }: DailyMissionsCardProps) => {
  const { colors, isDark } = useTheme();
  const { isTurkish, t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!missions || missions.length === 0) {
    return null;
  }

  const completedCount = missions.filter(m => m.isCompleted).length;
  const progress = (completedCount / missions.length) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t('daily_missions')}</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{missions.length}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.missionsScroll}
      >
        {missions.map((mission) => {
          const meta = CATEGORY_META[mission.category] || CATEGORY_META.workout;
          return (
            <TouchableOpacity
              key={mission.id}
              style={[
                styles.missionItem,
                mission.isCompleted && styles.completedMission
              ]}
              onPress={() => onMissionPress(mission)}
              disabled={mission.isCompleted}
            >
              <View style={styles.missionHeader}>
                <LinearGradient
                  colors={meta.gradient as any}
                  style={[
                    styles.missionIcon,
                    mission.isCompleted && styles.completedIcon
                  ]}
                >
                  <Ionicons
                    name={meta.icon as any}
                    size={16}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <Text style={[
                  styles.missionPoints,
                  mission.isCompleted && styles.completedPoints
                ]}>
                  +{mission.pointReward}
                </Text>
              </View>

              <Text style={[
                styles.missionTitle,
                mission.isCompleted && styles.completedTitle
              ]} numberOfLines={2}>
                {isTurkish ? (mission.titleTr || mission.title) : mission.title}
              </Text>

              {mission.isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  <Text style={styles.completedBadgeText}>{t('done')}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// Removed getMissionIcon function as it's replaced by CATEGORY_META


const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  missionsScroll: {
    gap: 12,
  },
  missionItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    width: 140,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    opacity: 1,
  },
  completedMission: {
    opacity: 0.7,
    backgroundColor: colors.background + '80',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    backgroundColor: colors.primary,
  },
  missionPoints: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  completedPoints: {
    color: colors.text + '60',
  },
  missionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    lineHeight: 16,
  },
  completedTitle: {
    color: colors.text + '60',
    textDecorationLine: 'line-through',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  completedBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default DailyMissionsCard;
