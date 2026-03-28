import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { SubscriptionService } from '../services/SubscriptionService';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../config/theme';
import { safeGoBack } from '../utils/navigation';

const PaywallScreen = () => {
    const { colors, isDark } = useTheme();
    const { isTurkish } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);

    useEffect(() => {
        const loadOfferings = async () => {
            try {
                const service = SubscriptionService.getInstance();
                await service.initialize();
                const availablePackages = await service.getOfferings();
                setPackages(availablePackages);
            } catch (err) {
                console.warn('Failed to load offerings', err);
            } finally {
                setLoading(false);
            }
        };
        loadOfferings();
    }, []);

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setPurchasing(true);
        const service = SubscriptionService.getInstance();
        const success = await service.purchasePackage(pkg);
        setPurchasing(false);
        if (success) {
            safeGoBack(navigation, 'Home');
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        const service = SubscriptionService.getInstance();
        const success = await service.restorePurchases();
        setPurchasing(false);
        if (success) {
            safeGoBack(navigation, 'Home');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1a1a1a', '#000000'] : ['#1a1a1a', '#000000']}
                style={StyleSheet.absoluteFill}
            />
            {/* Background elements */}
            <View style={[styles.glow, { top: -100, left: -50, backgroundColor: '#FFD70033' }]} />
            <View style={[styles.glow, { bottom: -100, right: -50, backgroundColor: '#FFD7001A' }]} />

            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRestore}>
                    <Text style={styles.restoreText}>{isTurkish ? 'Geri Yükle' : 'Restore'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <Ionicons name="diamond" size={64} color="#FFD700" style={{ marginBottom: SPACING.md }} />
                    <Text style={styles.title}>NextSelf <Text style={{ color: '#FFD700' }}>PRO</Text></Text>
                    <Text style={styles.subtitle}>
                        {isTurkish
                            ? 'Sınırları kaldırın. Gerçek potansiyelinizi ortaya çıkarın.'
                            : 'Remove the limits. Unlock your true potential.'}
                    </Text>
                </View>

                <View style={styles.features}>
                    {[
                        { icon: 'infinite', text: isTurkish ? 'Sınırsız AI Antrenör & Diyetisyen' : 'Unlimited AI Coach & Dietitian' },
                        { icon: 'shield-checkmark', text: isTurkish ? 'Reklamsız Kesintisiz Deneyim' : 'Ad-Free Seamless Experience' },
                        { icon: 'star', text: isTurkish ? 'Özel PT & Beslenme Programları' : 'Premium PT & Nutrition Plans' },
                        { icon: 'analytics', text: isTurkish ? 'Detaylı Gelişim Analizleri' : 'Detailed Progress Analytics' }
                    ].map((feat, index) => (
                        <View key={index} style={styles.featureRow}>
                            <Ionicons name={feat.icon as any} size={24} color="#FFD700" />
                            <Text style={styles.featureText}>{feat.text}</Text>
                        </View>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: SPACING.xl }} />
                ) : packages.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyText}>
                            {isTurkish 
                                ? 'Şu anda paket bulunamadı. Lütfen daha sonra tekrar deneyin.' 
                                : 'No packages found at this time. Please try again later.'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.packages}>
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.identifier}
                                style={styles.packageCard}
                                activeOpacity={0.8}
                                onPress={() => handlePurchase(pkg)}
                            >
                                <LinearGradient
                                    colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.02)']}
                                    style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS.lg }]}
                                />
                                <View style={styles.pkgTop}>
                                    <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
                                    <Text style={styles.pkgPrice}>{pkg.product.priceString}</Text>
                                </View>
                                <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {purchasing && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.overlayText}>{isTurkish ? 'İşleniyor...' : 'Processing...'}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        filter: 'blur(50px)' as any, // Blur supported on some RN versions via native or exp
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    closeBtn: {
        padding: SPACING.xs,
    },
    restoreText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#FFFFFF80',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    heroSection: {
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: '#FFFFFFB3',
        textAlign: 'center',
        paddingHorizontal: SPACING.md,
    },
    features: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        gap: SPACING.md,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    featureText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#FFF',
        flex: 1,
    },
    emptyWrap: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: '#FFFFFF80',
        textAlign: 'center',
    },
    packages: {
        gap: SPACING.md,
    },
    packageCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    pkgTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: SPACING.xs,
    },
    pkgTitle: {
        ...TYPOGRAPHY.h3,
        color: '#FFF',
    },
    pkgPrice: {
        ...TYPOGRAPHY.h2,
        color: '#FFD700',
    },
    pkgDesc: {
        ...TYPOGRAPHY.caption,
        color: '#FFFFFFB3',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: '#FFD700',
        marginTop: SPACING.sm,
        ...TYPOGRAPHY.bodyBold,
    },
});

export default PaywallScreen;
