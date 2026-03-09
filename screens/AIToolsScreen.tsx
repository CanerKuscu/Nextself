import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 40 - 12) / 2;

const AIToolsScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { t, isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const aiFeatures = [
        {
            id: 'coach', title: isTurkish ? 'AI Antrenör' : 'AI Coach',
            desc: isTurkish ? 'Kişisel antrenman planları' : 'Personal workout plans',
            icon: 'barbell', gradient: ['#667eea', '#764ba2'] as const, route: 'AI',
        },
        {
            id: 'dietitian', title: isTurkish ? 'AI Diyetisyen' : 'AI Dietitian',
            desc: isTurkish ? 'Akıllı diyet programı' : 'Smart diet plan',
            icon: 'leaf', gradient: ['#38ef7d', '#11998e'] as const, route: 'AIDietitian',
        },
        {
            id: 'chef', title: isTurkish ? 'AI Şef' : 'AI Chef',
            desc: isTurkish ? 'Lezzetli tarif önerileri' : 'Tasty recipe ideas',
            icon: 'restaurant', gradient: ['#FF9600', '#FF6B6B'] as const, route: 'AIChef',
        },
        {
            id: 'scanner', title: isTurkish ? 'Besin Tarama' : 'Food Scanner',
            desc: isTurkish ? 'Fotoğrafla analiz et' : 'Analyze by photo',
            icon: 'camera', gradient: ['#89f7fe', '#66a6ff'] as const, route: 'FoodScanner',
        },
        {
            id: 'posture', title: isTurkish ? 'Form Analizi' : 'Form Analysis',
            desc: isTurkish ? 'Hareket formunu düzelt' : 'Fix your workout form',
            icon: 'body', gradient: ['#f093fb', '#f5576c'] as const, route: 'PostureAnalysis',
        },
    ];

    // First 4 as 2x2 grid, last one as full-width
    const gridItems = aiFeatures.slice(0, 4);
    const fullWidthItem = aiFeatures[4];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{isTurkish ? 'AI Araçları' : 'AI Tools'}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        {isTurkish
                            ? 'Yapay zeka asistanlarınız her zaman yanınızda'
                            : 'Your AI assistants are always by your side'}
                    </Text>

                    {/* 2x2 Grid */}
                    <View style={styles.grid}>
                        {gridItems.map(tool => (
                            <TouchableOpacity key={tool.id} activeOpacity={0.85} onPress={() => navigation.navigate(tool.route)}>
                                <LinearGradient
                                    colors={[...tool.gradient]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gridCard}
                                >
                                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                        <Ionicons name={tool.icon as any} size={28} color={colors.background} />
                                    </View>
                                    <Text style={styles.gridCardTitle}>{tool.title}</Text>
                                    <Text style={styles.gridCardDesc}>{tool.desc}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Full Width Card */}
                    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate(fullWidthItem.route)}>
                        <LinearGradient
                            colors={[...fullWidthItem.gradient]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.fullCard}
                        >
                            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                <Ionicons name={fullWidthItem.icon as any} size={26} color={colors.background} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fullCardTitle}>{fullWidthItem.title}</Text>
                                <Text style={styles.fullCardDesc}>{fullWidthItem.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="shield-checkmark" size={20} color="#58CC02" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>
                                {isTurkish ? 'Güvenli & Akıllı' : 'Secure & Smart'}
                            </Text>
                            <Text style={styles.infoDesc}>
                                {isTurkish
                                    ? 'Tüm verileriniz anonim tutulur ve yalnızca size özel sonuçlar üretilir.'
                                    : 'Your data is kept anonymous and generates results exclusively for you.'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 120 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textTertiary, lineHeight: 22, marginBottom: 24 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    gridCard: {
        width: CARD_W, borderRadius: 24, padding: 18,
        minHeight: 160, justifyContent: 'flex-end',
    },
    gridCardTitle: { fontSize: 16, fontWeight: '700', color: colors.background, marginBottom: 3 },
    gridCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

    // Full width card
    fullCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 22,
        marginBottom: 24,
    },
    fullCardTitle: { fontSize: 16, fontWeight: '700', color: colors.background },
    fullCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

    // Info
    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 14,
        backgroundColor: '#E8FFE0', borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: '#C5F0B5',
    },
    infoIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    },
    infoTitle: { fontSize: 14, fontWeight: '700', color: '#2D7D09', marginBottom: 4 },
    infoDesc: { fontSize: 12, color: '#5DAA2D', lineHeight: 18 },
});

export default AIToolsScreen;
