import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
  gradient: [string, string, ...string[]];
  screen: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'profile',
    icon: 'person',
    titleKey: 'profile',
    descriptionKey: 'menu_profile_desc',
    gradient: ['#58CC02', '#38a800'],
    screen: 'Profile',
  },
  {
    id: 'pt_search',
    icon: 'people',
    titleKey: 'menu_pt_search_title',
    descriptionKey: 'menu_pt_search_desc',
    gradient: ['#38ef7d', '#11998e'],
    screen: 'ProfessionalSearch',
  },
  {
    id: 'tasks',
    icon: 'flag',
    titleKey: 'menu_tasks_title',
    descriptionKey: 'menu_tasks_desc',
    gradient: ['#FFC800', '#FF9600'],
    screen: 'Missions',
  },
  {
    id: 'store',
    icon: 'cart',
    titleKey: 'store',
    descriptionKey: 'menu_store_desc',
    gradient: ['#CE82FF', '#764ba2'],
    screen: 'Store',
  },
  {
    id: 'ai_tools',
    icon: 'sparkles',
    titleKey: 'ai_tools',
    descriptionKey: 'menu_ai_tools_desc',
    gradient: ['#f093fb', '#f5576c'],
    screen: 'AIToolsStack',
  },
  {
    id: 'messages',
    icon: 'chatbubble-ellipses',
    titleKey: 'menu_messages_title',
    descriptionKey: 'menu_messages_desc',
    gradient: ['#1CB0F6', '#0077CC'],
    screen: 'ChatList',
  },
];

const MoreScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t('more_title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('more_subtitle')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Grid */}
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name={item.icon} size={28} color="#fff" />
              </LinearGradient>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>{t(item.titleKey as any)}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {t(item.descriptionKey as any)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings & Privacy entries removed per request */}
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.lg,
    },
    headerTitle: {
      ...TYPOGRAPHY.h1,
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
    },
    content: {
      paddingHorizontal: SPACING.lg,
    },
    grid: {
      gap: SPACING.md,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.md,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
    },
    itemTitle: {
      ...TYPOGRAPHY.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    itemDesc: {
      ...TYPOGRAPHY.small,
      color: colors.textSecondary,
    },
    section: {
      marginTop: SPACING.xl,
    },
    sectionTitle: {
      ...TYPOGRAPHY.h3,
      color: colors.text,
      marginBottom: SPACING.md,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      gap: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingText: {
      flex: 1,
      ...TYPOGRAPHY.body,
      color: colors.text,
    },
  });

export default MoreScreen;
