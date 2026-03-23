import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface TodayWorkoutsCardProps {
  workouts: any[];
  onWorkoutPress: (workout: any) => void;
}

const TodayWorkoutsCard = memo(({ workouts, onWorkoutPress }: TodayWorkoutsCardProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const renderItem: ListRenderItem<any> = useCallback(({ item: workout }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => onWorkoutPress(workout)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${workout.type} workout: ${workout.name}. Duration: ${workout.duration || 'N/A'} minutes.`}
      accessibilityHint="Double tap to view workout details"
    >
      <View style={styles.workoutHeader}>
        <Ionicons
          name={getWorkoutIcon(workout.type)}
          size={20}
          color={colors.primary}
          importantForAccessibility="no-hide-descendants"
        />
        <Text style={styles.workoutType}>{workout.type}</Text>
      </View>

      <Text style={styles.workoutName} numberOfLines={2}>
        {workout.name}
      </Text>

      <View style={styles.workoutFooter}>
        <Text style={styles.workoutDuration}>{workout.duration || 'N/A'} min</Text>
        <Text style={styles.workoutCalories}>{workout.calories || 0} cal</Text>
      </View>

      {workout.completed && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.completedText}>Done</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [colors, onWorkoutPress, styles]);

  if (!workouts || workouts.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Workouts</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="fitness" size={48} color={colors.text + '40'} importantForAccessibility="no-hide-descendants" />
          <Text style={styles.emptyText}>No workouts today</Text>
          <Text style={styles.emptySubtext}>Start your fitness journey!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Today's Workouts</Text>
        <Text style={styles.workoutCount}>{workouts.length} workouts</Text>
      </View>

      <FlatList
        data={workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workoutScroll}
        decelerationRate="fast"
        snapToInterval={172} // width (160) + marginRight (12)
        snapToAlignment="start"
      />
    </View>
  );
});

function getWorkoutIcon(type: string): 'walk' | 'barbell' | 'body' | 'basketball' | 'fitness' {
  switch (type?.toLowerCase()) {
    case 'cardio': return 'walk';
    case 'strength': return 'barbell';
    case 'flexibility': return 'body';
    case 'sports': return 'basketball';
    default: return 'fitness';
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
  workoutCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  workoutScroll: {
    gap: 12,
  },
  workoutItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    width: 160,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  workoutType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    flex: 1,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutDuration: {
    fontSize: 12,
    color: colors.text + '80',
  },
  workoutCalories: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  completedText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text + '60',
    marginTop: 4,
  },
});

export default TodayWorkoutsCard;
