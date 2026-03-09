import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakCardProps {
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
    lastRestDate: string | null;
    isRestDay: boolean;
  } | null;
}

const StreakCard = memo(({ streakData }: StreakCardProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!streakData) {
    return null;
  }

  const { currentStreak, longestStreak, isRestDay } = streakData;

  return (
    <LinearGradient
      colors={isRestDay ? ['#6366F1', '#8B5CF6'] : ['#10B981', '#059669']}
      style={styles.gradientCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.streakContent}>
        <View style={styles.streakHeader}>
          <Ionicons name="flame" size={32} color="#FFFFFF" />
          <View style={styles.streakTexts}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.streakFooter}>
          <View style={styles.streakStat}>
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest</Text>
          </View>
          {isRestDay && (
            <View style={styles.restDayBadge}>
              <Ionicons name="bed" size={12} color="#FFFFFF" />
              <Text style={styles.restDayText}>Rest Day</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  gradientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  streakContent: {
    flex: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTexts: {
    marginLeft: 12,
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  streakFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  restDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  restDayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default StreakCard;
