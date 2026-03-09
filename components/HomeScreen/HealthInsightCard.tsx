import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface HealthInsightCardProps {
  insights: any[];
  refreshing: boolean;
  onRefresh: () => void;
}

const HealthInsightCard = memo(({ insights, refreshing, onRefresh }: HealthInsightCardProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Health Insights</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={colors.primary}
            style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.insightsContainer}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Ionicons
              name={getInsightIcon(insight.type)}
              size={16}
              color={getInsightColor(insight.type)}
            />
            <Text style={styles.insightText}>{insight.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

function getInsightIcon(type: string): 'walk' | 'heart' | 'moon' | 'scale' | 'information-circle' {
  switch (type) {
    case 'steps': return 'walk';
    case 'heart': return 'heart';
    case 'sleep': return 'moon';
    case 'weight': return 'scale';
    default: return 'information-circle';
  }
}

function getInsightColor(type: string): string {
  switch (type) {
    case 'steps': return '#10B981';
    case 'heart': return '#EF4444';
    case 'sleep': return '#6366F1';
    case 'weight': return '#F59E0B';
    default: return '#6B7280';
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background + '20',
  },
  insightsContainer: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});

export default HealthInsightCard;
