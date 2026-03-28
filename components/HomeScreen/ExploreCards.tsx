import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function ExploreCards({ colors, t, navigation }: any) {
    const { width } = useWindowDimensions();
    const CARD_W = (width - 40 - 14) / 2;
    const s = React.useMemo(() => getStyles(colors), [colors]);

    return (
        <View style={s.catGrid}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Sports')}>
                <LinearGradient colors={['#a18cd1', '#fbc2eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                    <View style={s.catIconBg}><Ionicons name="barbell" size={26} color={colors.background} /></View>
                    <Text style={s.catTitle}>{t('workout')}</Text>
                    <Text style={s.catSub}>{t('exercise_programs')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Nutrition')}>
                <LinearGradient colors={['#89f7fe', '#66a6ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                    <View style={s.catIconBg}><Ionicons name="restaurant" size={26} color={colors.background} /></View>
                    <Text style={s.catTitle}>{t('nutrition')}</Text>
                    <Text style={s.catSub}>{t('track_food')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AIToolsStack')}>
                <LinearGradient colors={['#f093fb', '#f5576c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                    <View style={s.catIconBg}><Ionicons name="sparkles" size={26} color={colors.background} /></View>
                    <Text style={s.catTitle}>{t('ai_tools')}</Text>
                    <Text style={s.catSub}>{t('coach_diet_chef')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProfessionalSearch')}>
                <LinearGradient colors={['#38ef7d', '#11998e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.catCard, { width: CARD_W }]}>
                    <View style={s.catIconBg}><Ionicons name="people" size={26} color={colors.background} /></View>
                    <Text style={s.catTitle}>{t('pt_diet')}</Text>
                    <Text style={s.catSub}>{t('find_pros')}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
    catCard: { borderRadius: 22, padding: 18, minHeight: 150, justifyContent: 'flex-end' },
    catIconBg: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    catTitle: { fontSize: 16, fontWeight: '700', color: colors.background, marginBottom: 2 },
    catSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
});

export default memo(ExploreCards);
