"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useTranslation_1 = require("../hooks/useTranslation");
const ThemeContext_1 = require("../contexts/ThemeContext");
const { width } = react_native_1.Dimensions.get('window');
const CARD_W = (width - 40 - 12) / 2;
const AIToolsScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);
    const aiFeatures = [
        {
            id: 'coach', title: isTurkish ? 'AI Antrenör' : 'AI Coach',
            desc: isTurkish ? 'Kişisel antrenman planları' : 'Personal workout plans',
            icon: 'barbell', gradient: ['#667eea', '#764ba2'], route: 'AI',
        },
        {
            id: 'dietitian', title: isTurkish ? 'AI Diyetisyen' : 'AI Dietitian',
            desc: isTurkish ? 'Akıllı diyet programı' : 'Smart diet plan',
            icon: 'leaf', gradient: ['#38ef7d', '#11998e'], route: 'AIDietitian',
        },
        {
            id: 'chef', title: isTurkish ? 'AI Şef' : 'AI Chef',
            desc: isTurkish ? 'Lezzetli tarif önerileri' : 'Tasty recipe ideas',
            icon: 'restaurant', gradient: ['#FF9600', '#FF6B6B'], route: 'AIChef',
        },
        {
            id: 'scanner', title: isTurkish ? 'Besin Tarama' : 'Food Scanner',
            desc: isTurkish ? 'Fotoğrafla analiz et' : 'Analyze by photo',
            icon: 'camera', gradient: ['#89f7fe', '#66a6ff'], route: 'FoodScanner',
        },
        {
            id: 'posture', title: isTurkish ? 'Form Analizi' : 'Form Analysis',
            desc: isTurkish ? 'Hareket formunu düzelt' : 'Fix your workout form',
            icon: 'body', gradient: ['#f093fb', '#f5576c'], route: 'PostureAnalysis',
        },
    ];
    // First 4 as 2x2 grid, last one as full-width
    const gridItems = aiFeatures.slice(0, 4);
    const fullWidthItem = aiFeatures[4];
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
            <react_native_1.ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
                <react_native_1.Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <react_native_1.View style={styles.header}>
                        <react_native_1.TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                            <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.text}/>
                        </react_native_1.TouchableOpacity>
                        <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'AI Araçları' : 'AI Tools'}</react_native_1.Text>
                        <react_native_1.View style={{ width: 40 }}/>
                    </react_native_1.View>

                    {/* Subtitle */}
                    <react_native_1.Text style={styles.subtitle}>
                        {isTurkish
            ? 'Yapay zeka asistanlarınız her zaman yanınızda'
            : 'Your AI assistants are always by your side'}
                    </react_native_1.Text>

                    {/* 2x2 Grid */}
                    <react_native_1.View style={styles.grid}>
                        {gridItems.map(tool => (<react_native_1.TouchableOpacity key={tool.id} activeOpacity={0.85} onPress={() => navigation.navigate(tool.route)}>
                                <expo_linear_gradient_1.LinearGradient colors={[...tool.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gridCard}>
                                    <react_native_1.View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                        <vector_icons_1.Ionicons name={tool.icon} size={28} color={colors.background}/>
                                    </react_native_1.View>
                                    <react_native_1.Text style={styles.gridCardTitle}>{tool.title}</react_native_1.Text>
                                    <react_native_1.Text style={styles.gridCardDesc}>{tool.desc}</react_native_1.Text>
                                </expo_linear_gradient_1.LinearGradient>
                            </react_native_1.TouchableOpacity>))}
                    </react_native_1.View>

                    {/* Full Width Card */}
                    <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate(fullWidthItem.route)}>
                        <expo_linear_gradient_1.LinearGradient colors={[...fullWidthItem.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullCard}>
                            <react_native_1.View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                <vector_icons_1.Ionicons name={fullWidthItem.icon} size={26} color={colors.background}/>
                            </react_native_1.View>
                            <react_native_1.View style={{ flex: 1 }}>
                                <react_native_1.Text style={styles.fullCardTitle}>{fullWidthItem.title}</react_native_1.Text>
                                <react_native_1.Text style={styles.fullCardDesc}>{fullWidthItem.desc}</react_native_1.Text>
                            </react_native_1.View>
                            <vector_icons_1.Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
                        </expo_linear_gradient_1.LinearGradient>
                    </react_native_1.TouchableOpacity>

                    {/* Info Card */}
                    <react_native_1.View style={styles.infoCard}>
                        <react_native_1.View style={styles.infoIcon}>
                            <vector_icons_1.Ionicons name="shield-checkmark" size={20} color="#58CC02"/>
                        </react_native_1.View>
                        <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={styles.infoTitle}>
                                {isTurkish ? 'Güvenli & Akıllı' : 'Secure & Smart'}
                            </react_native_1.Text>
                            <react_native_1.Text style={styles.infoDesc}>
                                {isTurkish
            ? 'Tüm verileriniz anonim tutulur ve yalnızca size özel sonuçlar üretilir.'
            : 'Your data is kept anonymous and generates results exclusively for you.'}
                            </react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.Animated.View>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
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
exports.default = AIToolsScreen;
