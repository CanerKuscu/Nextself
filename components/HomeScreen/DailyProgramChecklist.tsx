import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

export interface DailyItem {
  id: string;
  type: 'workout' | 'meal' | 'supplement';
  title: string;
  subtitle?: string;
  completed: boolean;
  time?: string;
}

interface Props {
  items: DailyItem[];
  onToggle: (id: string, type: 'workout' | 'meal' | 'supplement', currentStatus: boolean) => void;
}

const DailyProgramChecklist = memo(({ items, onToggle }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!items || items.length === 0) {
     return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('todays_program') || "Today's Program"}</Text>
            </View>
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('no_program_today') || "No tasks scheduled for today."}</Text>
            </View>
        </View>
     );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('todays_program') || "Today's Program"}</Text>
        <Text style={styles.subtitle}>{items.filter(i => i.completed).length}/{items.length} {t('completed') || "Completed"}</Text>
      </View>
      {items.map((item) => (
        <TouchableOpacity 
            key={`${item.type}-${item.id}`} 
            style={styles.itemRow}
            onPress={() => onToggle(item.id, item.type, item.completed)}
        >
            <View style={[styles.checkbox, item.completed && styles.checked]}>
                {item.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <View style={styles.content}>
                <Text style={[styles.itemTitle, item.completed && styles.completedText]}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <View style={styles.meta}>
                 {item.time && <Text style={styles.time}>{item.time}</Text>}
                 <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type, colors) }]}>
                    <Ionicons 
                        name={getTypeIcon(item.type)} 
                        size={14} 
                        color="#FFF" 
                    />
                 </View>
            </View>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'workout': return 'fitness';
        case 'meal': return 'restaurant';
        case 'supplement': return 'medkit';
        default: return 'ellipse';
    }
};

const getTypeColor = (type: string, colors: any) => {
    switch (type) {
        case 'workout': return colors.primary;
        case 'meal': return '#FF9F43'; // Orange
        case 'supplement': return '#28C76F'; // Green
        default: return colors.text;
    }
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
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
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
  },
  subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
  },
  emptyState: {
      padding: 10,
      alignItems: 'center',
  },
  emptyText: {
      color: colors.textSecondary,
      fontStyle: 'italic',
  },
  itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
  },
  checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
  },
  checked: {
      backgroundColor: colors.primary,
  },
  content: {
      flex: 1,
  },
  itemTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
  },
  completedText: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
  },
  itemSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
  },
  meta: {
      alignItems: 'flex-end',
  },
  time: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
  },
  iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
  },
});

export default DailyProgramChecklist;
