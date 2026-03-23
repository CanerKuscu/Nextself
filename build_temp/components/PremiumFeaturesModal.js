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
const theme_1 = require("../config/theme");
const useTranslation_1 = require("../hooks/useTranslation");
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const FEATURES = [
    {
        icon: 'barbell',
        iconColor: '#FF6B35',
        bgColor: '#FFF0EB',
        titleTr: 'AI Fitness Kocu',
        titleEn: 'AI Fitness Coach',
        descTr: 'Kisisel antrenman programlari ve vucut analizi',
        descEn: 'Personalized workout plans & body analysis',
    },
    {
        icon: 'nutrition',
        iconColor: '#58CC02',
        bgColor: '#EDFBE0',
        titleTr: 'AI Diyetisyen',
        titleEn: 'AI Dietitian',
        descTr: 'Ozel beslenme planlari ve makro takibi',
        descEn: 'Custom meal plans & macro tracking',
    },
    {
        icon: 'restaurant',
        iconColor: '#CE82FF',
        bgColor: '#F5EAFF',
        titleTr: 'AI Sef',
        titleEn: 'AI Chef',
        descTr: 'Saglikli tarifler ve kalori hesaplama',
        descEn: 'Healthy recipes & calorie calculation',
    },
    {
        icon: 'scan',
        iconColor: '#1CB0F6',
        bgColor: '#E8F6FF',
        titleTr: 'Sinirsiz Besin Tarama',
        titleEn: 'Unlimited Food Scanning',
        descTr: 'Barkod ve foto ile aninda besin analizi',
        descEn: 'Instant nutrition analysis via barcode & photo',
    },
    {
        icon: 'analytics',
        iconColor: '#FF9600',
        bgColor: '#FFF5E6',
        titleTr: 'Detayli Ilerleme Takibi',
        titleEn: 'Detailed Progress Tracking',
        descTr: 'Gelismis istatistikler ve vucut olculeri',
        descEn: 'Advanced stats & body measurements',
    },
    {
        icon: 'shield-checkmark',
        iconColor: '#00CD9C',
        bgColor: '#E6FFF7',
        titleTr: 'Reklamsiz Deneyim',
        titleEn: 'Ad-Free Experience',
        descTr: 'Hicbir reklam olmadan kesintisiz kullanim',
        descEn: 'Uninterrupted usage without any ads',
    },
];
const PremiumFeaturesModal = ({ visible, onClose, onUpgrade, }) => {
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.85)).current;
    const slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(60)).current;
    (0, react_1.useEffect)(() => {
        if (visible) {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 65,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.85);
            slideAnim.setValue(60);
        }
    }, [visible]);
    return (<react_native_1.Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
            <react_native_1.Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <react_native_1.Animated.View style={[
            styles.container,
            {
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
        ]}>
                    {/* Close button */}
                    <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <vector_icons_1.Ionicons name="close" size={24} color={theme_1.COLORS.textSecondary}/>
                    </react_native_1.TouchableOpacity>

                    {/* Header */}
                    <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
                        <react_native_1.View style={styles.crownWrap}>
                            <vector_icons_1.Ionicons name="diamond" size={32} color="#FFFFFF"/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.headerTitle}>NextSelf Premium</react_native_1.Text>
                        <react_native_1.Text style={styles.headerSub}>
                            {isTurkish
            ? 'Tum ozelliklerin kilidini acin'
            : 'Unlock all features'}
                        </react_native_1.Text>
                    </expo_linear_gradient_1.LinearGradient>

                    {/* Features List */}
                    <react_native_1.ScrollView style={styles.featuresList} contentContainerStyle={styles.featuresContent} showsVerticalScrollIndicator={false}>
                        {FEATURES.map((feature, index) => (<react_native_1.View key={index} style={styles.featureRow}>
                                <react_native_1.View style={[
                styles.featureIconWrap,
                { backgroundColor: feature.bgColor },
            ]}>
                                    <vector_icons_1.Ionicons name={feature.icon} size={22} color={feature.iconColor}/>
                                </react_native_1.View>
                                <react_native_1.View style={styles.featureTextWrap}>
                                    <react_native_1.Text style={styles.featureTitle}>
                                        {isTurkish ? feature.titleTr : feature.titleEn}
                                    </react_native_1.Text>
                                    <react_native_1.Text style={styles.featureDesc}>
                                        {isTurkish ? feature.descTr : feature.descEn}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>))}
                    </react_native_1.ScrollView>

                    {/* CTA Buttons */}
                    <react_native_1.View style={styles.ctaSection}>
                        <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={onUpgrade || onClose}>
                            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeBtn}>
                                <vector_icons_1.Ionicons name="star" size={20} color="#FFFFFF"/>
                                <react_native_1.Text style={styles.upgradeBtnText}>
                                    {isTurkish ? "Premium'a Yukselt" : 'Upgrade to Premium'}
                                </react_native_1.Text>
                            </expo_linear_gradient_1.LinearGradient>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                            <react_native_1.Text style={styles.laterBtnText}>
                                {isTurkish ? 'Daha Sonra' : 'Maybe Later'}
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                </react_native_1.Animated.View>
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
};
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme_1.SPACING.lg,
    },
    container: {
        backgroundColor: theme_1.COLORS.background,
        borderRadius: theme_1.BORDER_RADIUS.xl,
        width: '100%',
        maxWidth: 400,
        maxHeight: '85%',
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerGradient: {
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: theme_1.SPACING.lg,
        alignItems: 'center',
    },
    crownWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        fontWeight: '500',
    },
    featuresList: {
        maxHeight: 320,
    },
    featuresContent: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.sm,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureTextWrap: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme_1.COLORS.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        color: theme_1.COLORS.textSecondary,
        lineHeight: 16,
    },
    ctaSection: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.sm,
        paddingBottom: theme_1.SPACING.lg,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        gap: 8,
    },
    upgradeBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    laterBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },
    laterBtnText: {
        fontSize: 14,
        color: theme_1.COLORS.textSecondary,
        fontWeight: '500',
    },
});
exports.default = PremiumFeaturesModal;
