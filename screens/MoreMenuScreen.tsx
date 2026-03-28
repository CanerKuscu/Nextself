import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../contexts/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';

const MoreMenuScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { isTurkish } = useTranslation();
  const s = React.useMemo(() => getStyles(colors), [colors]);

  const menuItems = [
    { id: 'profile', icon: 'person', label: isTurkish ? 'Profil' : 'Profile', route: 'Profile', bgColor: '#4CAF50' },
    { id: 'ai', icon: 'sparkles', label: isTurkish ? 'AI Özellikler' : 'AI Features', route: 'AIToolsStack', bgColor: '#9C27B0' },
    { id: 'pt', icon: 'people', label: isTurkish ? 'Diyetisyen ve PT Bulma' : 'Find Dietitian & PT', route: 'ProfessionalSearch', bgColor: '#FF9800' },
    { id: 'missions', icon: 'flag', label: isTurkish ? 'Haftalık Görevler' : 'Weekly Missions', route: 'Missions', bgColor: '#E91E63' },
    { id: 'store', icon: 'cart', label: isTurkish ? 'Market' : 'Store', route: 'Store', bgColor: '#00BCD4' }
  ];

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.headerTitle}>{isTurkish ? 'Daha Fazla' : 'More'}</Text>

        <View style={s.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={s.menuItem} 
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={22} color="#fff" />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24, marginTop: 12 },
  menuContainer: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
});

export default MoreMenuScreen;
