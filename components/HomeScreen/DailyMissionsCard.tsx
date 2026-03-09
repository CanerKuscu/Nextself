import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DailyMissionsCardProps {
  missions: any[];
  onMissionPress: (mission: any) => void;
}

const DailyMissionsCard = memo(({ missions, onMissionPress }: DailyMissionsCardProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!missions || missions.length === 0) {
    return null;
  }

  const completedCount = missions.filter(m => m.completed).length;
  const progress = (completedCount / missions.length) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Daily Missions</Text>
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
        {missions.map((mission) => (
          <TouchableOpacity
            key={mission.id}
            style={[
              styles.missionItem,
              mission.completed && styles.completedMission
            ]}
            onPress={() => onMissionPress(mission)}
            disabled={mission.completed}
          >
            <View style={styles.missionHeader}>
              <View style={[
                styles.missionIcon,
                mission.completed && styles.completedIcon
              ]}>
                <Ionicons
                  name={getMissionIcon(mission.type)}
                  size={16}
                  color={mission.completed ? '#FFFFFF' : colors.primary}
                />
              </View>
              <Text style={[
                styles.missionPoints,
                mission.completed && styles.completedPoints
              ]}>
                +{mission.points}
              </Text>
            </View>

            <Text style={[
              styles.missionTitle,
              mission.completed && styles.completedTitle
            ]} numberOfLines={2}>
              {mission.title}
            </Text>

            {mission.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                <Text style={styles.completedBadgeText}>Done</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

function getMissionIcon(type: string): 'fitness' | 'nutrition' | 'walk' | 'water' | 'moon' | 'star' {
  switch (type?.toLowerCase()) {
    case 'workout': return 'fitness';
    case 'nutrition': return 'nutrition';
    case 'steps': return 'walk';
    case 'water': return 'water';
    case 'sleep': return 'moon';
    default: return 'star';
  }
}

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
