import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { useTranslation } from '../hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumFeaturesModalProps {
    visible: boolean;
    onClose: () => void;
    onUpgrade?: () => void;
}

interface FeatureItem {
    icon: string;
    iconColor: string;
    bgColor: string;
    titleTr: string;
    titleEn: string;
    descTr: string;
    descEn: string;
}

const FEATURES: FeatureItem[] = [
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

const PremiumFeaturesModal: React.FC<PremiumFeaturesModalProps> = ({
    visible,
    onClose,
    onUpgrade,
}) => {
    const { isTurkish } = useTranslation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 65,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.85);
            slideAnim.setValue(60);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <LinearGradient
                        colors={GRADIENTS.premium as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.crownWrap}>
                            <Ionicons name="diamond" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={styles.headerTitle}>NextSelf Premium</Text>
                        <Text style={styles.headerSub}>
                            {isTurkish
                                ? 'Tum ozelliklerin kilidini acin'
                                : 'Unlock all features'}
                        </Text>
                    </LinearGradient>

                    {/* Features List */}
                    <ScrollView
                        style={styles.featuresList}
                        contentContainerStyle={styles.featuresContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <View
                                    style={[
                                        styles.featureIconWrap,
                                        { backgroundColor: feature.bgColor },
                                    ]}
                                >
                                    <Ionicons
                                        name={feature.icon as any}
                                        size={22}
                                        color={feature.iconColor}
                                    />
                                </View>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>
                                        {isTurkish ? feature.titleTr : feature.titleEn}
                                    </Text>
                                    <Text style={styles.featureDesc}>
                                        {isTurkish ? feature.descTr : feature.descEn}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* CTA Buttons */}
                    <View style={styles.ctaSection}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={onUpgrade || onClose}
                        >
                            <LinearGradient
                                colors={GRADIENTS.premium as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.upgradeBtn}
                            >
                                <Ionicons name="star" size={20} color="#FFFFFF" />
                                <Text style={styles.upgradeBtnText}>
                                    {isTurkish ? "Premium'a Yukselt" : 'Upgrade to Premium'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.laterBtn}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.laterBtnText}>
                                {isTurkish ? 'Daha Sonra' : 'Maybe Later'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    container: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.xl,
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
        paddingHorizontal: SPACING.lg,
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
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
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
        color: COLORS.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 16,
    },
    ctaSection: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.lg,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
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
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});

export default PremiumFeaturesModal;
