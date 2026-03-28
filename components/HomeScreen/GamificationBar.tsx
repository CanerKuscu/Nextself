import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function GamificationBar({ colors, t, navigation, tierInfo, leagueData }: any) {
    const s = React.useMemo(() => getStyles(colors), [colors]);

    return (
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('League')} style={s.gamifBar}>
            <View style={s.gamifLeft}>
                <Text style={{ fontSize: 22 }}>{tierInfo.icon}</Text>
                <View style={{ marginLeft: 10 }}>
                    <Text style={s.gamifLeague}>{t(`tier_${tierInfo.name.toLowerCase()}` as any)}</Text>
                    <Text style={s.gamifRank}>{t('league')}</Text>
                </View>
            </View>
            <View style={s.gamifRight}>
                <View style={s.xpBarOuter}>
                    <View style={[s.xpBarInner, { width: `${Math.min((leagueData?.weeklyXp || 0) / 500 * 100, 100)}%` }]} />
                </View>
                <Text style={s.xpText}>{leagueData?.weeklyXp || 0} XP</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    gamifBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
    gamifLeft: { flexDirection: 'row', alignItems: 'center' },
    gamifLeague: { fontSize: 14, fontWeight: '800', color: colors.text },
    gamifRank: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
    gamifRight: { flex: 1, marginHorizontal: 14, alignItems: 'flex-end' },
    xpBarOuter: { width: '100%', height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, marginBottom: 3 },
    xpBarInner: { height: 8, backgroundColor: '#FFC800', borderRadius: 4 },
    xpText: { fontSize: 11, fontWeight: '700', color: '#FFC800' },
});

export default memo(GamificationBar);
