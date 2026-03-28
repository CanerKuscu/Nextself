import React, { memo } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function QuickActions({ colors, t, navigation }: any) {
    const s = React.useMemo(() => getStyles(colors), [colors]);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickScroll}>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Sports')} activeOpacity={0.7}>
                <LinearGradient colors={['#58CC02', '#38a800']} style={s.quickIconWrap}><Ionicons name="sparkles" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('workout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('FoodScanner')} activeOpacity={0.7}>
                <LinearGradient colors={['#FF9600', '#FF6B6B']} style={s.quickIconWrap}><Ionicons name="scan" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('scan_food')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.7}>
                <LinearGradient colors={['#89f7fe', '#66a6ff']} style={s.quickIconWrap}><Ionicons name="restaurant" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('nutrition')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('ProfessionalSearch')} activeOpacity={0.7}>
                <LinearGradient colors={['#38ef7d', '#11998e']} style={s.quickIconWrap}><Ionicons name="people" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('find_pt')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Health')} activeOpacity={0.7}>
                <LinearGradient colors={['#f093fb', '#f5576c']} style={s.quickIconWrap}><Ionicons name="heart" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('health')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Supplements')} activeOpacity={0.7}>
                <LinearGradient colors={['#CE82FF', '#764ba2']} style={s.quickIconWrap}><Ionicons name="medkit" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('supplements')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('WaterTracking')} activeOpacity={0.7}>
                <LinearGradient colors={['#1CB0F6', '#0077CC']} style={s.quickIconWrap}><Ionicons name="water" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('water_tracking')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickItem} onPress={() => navigation.navigate('Assignments')} activeOpacity={0.7}>
                <LinearGradient colors={['#FFC800', '#FF9600']} style={s.quickIconWrap}><Ionicons name="clipboard" size={22} color={colors.background} /></LinearGradient>
                <Text style={s.quickLabel}>{t('tasks')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    quickScroll: { gap: 16, paddingRight: 20, marginBottom: 28 },
    quickItem: { alignItems: 'center', width: 72 },
    quickIconWrap: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
});

export default memo(QuickActions);
