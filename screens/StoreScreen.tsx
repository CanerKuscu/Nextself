import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, FlatList, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StoreService, StoreItem, UserCurrency } from '../services/storeService';
import { useTranslation } from '../hooks/useTranslation';
import StoreIllustration from '../components/StoreIllustration';
import LeagueTierIcon from '../components/LeagueTierIcon';
import GlassCard from '../components/GlassCard';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { safeGoBack } from '../utils/navigation';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';

const PAGE_SIZE = 16;

const StoreScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const { width } = useWindowDimensions();
    const itemWidth = React.useMemo(() => Math.max((width - 60) / 2, 150), [width]);

    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [currency, setCurrency] = useState<UserCurrency>({ points: 0, gems: 0, totalEarnedPoints: 0, totalSpentPoints: 0 });
    const [activeTab, setActiveTab] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const loadCurrency = useCallback(async () => {
        const storeService = StoreService.getInstance();
        const curr = await storeService.getUserCurrency();
        setCurrency(curr);
    }, []);

    const loadStoreItems = useCallback(async (pageParam: number, replace: boolean) => {
        try {
            if (pageParam > 0) {
                setLoadingMore(true);
            }
            setLoadError(null);
            const storeService = StoreService.getInstance();
            const items = await storeService.getStoreItems(activeTab, pageParam, PAGE_SIZE);
            setHasMore(items.length === PAGE_SIZE);
            setPage(pageParam);
            setStoreItems(prev => {
                if (replace) return items;
                const existing = new Set(prev.map(item => item.id));
                const next = items.filter(item => !existing.has(item.id));
                return prev.concat(next);
            });
        } catch (err) {
            console.warn('Store load error:', err);
            setLoadError(isTurkish ? 'Ürünler yüklenemedi' : 'Failed to load store items');
            if (replace) {
                setStoreItems([]);
            }
        } finally {
            setLoadingMore(false);
        }
    }, [activeTab, isTurkish]);

    const refreshStore = useCallback(async () => {
        await Promise.all([
            loadCurrency(),
            loadStoreItems(0, true),
        ]);
    }, [loadCurrency, loadStoreItems]);

    useEffect(() => {
        let mounted = true;
        const bootstrap = async () => {
            setLoading(true);
            if (mounted) {
                await refreshStore();
                setLoading(false);
            }
        };
        bootstrap();
        return () => { mounted = false; };
    }, [refreshStore]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshStore();
        setRefreshing(false);
    }, [refreshStore]);

    const handleLoadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) return;
        loadStoreItems(page + 1, false);
    }, [hasMore, loading, loadingMore, loadStoreItems, page]);

    const handlePurchase = async (item: StoreItem) => {
        if (currency.points < item.pricePoints) {
            showAlert({
                title: isTurkish ? 'Yetersiz Puan' : 'Insufficient Points',
                message: isTurkish ? `Bu ürün için ${item.pricePoints} puan gerekli. Mevcut: ${currency.points}` : `This item requires ${item.pricePoints} points. Available: ${currency.points}`,
                type: 'error'
            });
            return;
        }

        showAlert({
            title: isTurkish ? 'Satın Al' : 'Purchase',
            message: isTurkish
                ? `${item.nameTr} satın almak istiyor musunuz?\n\nFiyat: ${item.pricePoints} puan`
                : `Do you want to buy ${item.name}?\n\nPrice: ${item.pricePoints} points`,
            type: 'info',
            buttons: [
                { text: isTurkish ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: isTurkish ? 'Satın Al' : 'Buy',
                    onPress: async () => {
                        setPurchasing(item.id);
                        try {
                            const result = await StoreService.getInstance().purchaseItem(item.id);
                            if (result.success) {
                                showAlert({
                                    title: isTurkish ? 'Başarılı!' : 'Success!',
                                    message: isTurkish ? `${item.nameTr} satın alındı!` : `${item.name} purchased!`,
                                    type: 'success'
                                });
                                await refreshStore();
                            } else {
                                const messages: Record<string, string> = {
                                    insufficient_points: isTurkish ? 'Yetersiz puan' : 'Insufficient points',
                                    max_stack_reached: isTurkish ? 'Maksimum stok sınırına ulaşıldı' : 'Max stack reached',
                                };
                                showAlert({
                                    title: isTurkish ? 'Hata' : 'Error',
                                    message: messages[result.message] || (isTurkish ? 'Satın alma başarısız' : 'Purchase failed'),
                                    type: 'error'
                                });
                            }
                        } catch (error) {
                            console.warn('Purchase error:', error);
                            showAlert({
                                title: isTurkish ? 'Hata' : 'Error',
                                message: isTurkish ? 'Satın alma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred during purchase. Please try again.',
                                type: 'error'
                            });
                        } finally {
                            setPurchasing(null);
                        }
                    },
                },
            ],
        });
    };

    const getCategoryIcon = (category: string, itemIcon?: string): keyof typeof Ionicons.glyphMap => {
        // Use item-specific icon if available
        if (itemIcon) {
            const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
                'snow': 'snow', 'heart': 'heart', 'gift': 'gift',
                'flash': 'flash', 'shield': 'shield', 'barbell': 'barbell',
                'nutrition': 'nutrition', 'rocket': 'rocket', 'people': 'people',
                'compass': 'compass', 'eye': 'eye', 'dice': 'dice',
                'ribbon': 'ribbon', 'medal': 'medal', 'color-palette': 'color-palette',
                'sparkles': 'sparkles', 'diamond': 'diamond', 'aperture': 'aperture',
                'happy': 'happy', 'flame': 'flame', 'fitness': 'fitness',
                'body': 'body', 'pulse': 'pulse', 'medical': 'medical',
                'brain': 'analytics', 'scan': 'scan', 'create': 'create',
                'star': 'star', 'leaf': 'leaf', 'calculator': 'calculator',
                'restaurant': 'restaurant', 'water': 'water', 'moon': 'moon',
                'flower': 'flower', 'sunny': 'sunny',
            };
            if (iconMap[itemIcon]) return iconMap[itemIcon];
        }

        // Fallback to category icon
        switch (category) {
            case 'all': return 'grid';
            case 'booster': return 'flash';
            case 'utility': return 'construct';
            case 'cosmetic': return 'sparkles';
            case 'equipment': return 'fitness';
            case 'nutrition': return 'nutrition';
            case 'recovery': return 'medical';
            case 'seasonal': return 'sunny';
            case 'premium': return 'diamond';
            default: return 'cube';
        }
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, { en: string; tr: string }> = {
            all: { en: 'All', tr: 'Tümü' },
            booster: { en: 'Boosters', tr: 'Güçlendirici' },
            utility: { en: 'Utilities', tr: 'Araçlar' },
            cosmetic: { en: 'Cosmetics', tr: 'Kozmetik' },
            equipment: { en: 'Equipment', tr: 'Ekipman' },
            nutrition: { en: 'Nutrition', tr: 'Beslenme' },
            recovery: { en: 'Recovery', tr: 'İyileşme' },
            seasonal: { en: 'Seasonal', tr: 'Sezon' },
            premium: { en: 'Premium', tr: 'Premium' },
        };
        return isTurkish ? labels[cat]?.tr || cat : labels[cat]?.en || cat;
    };

    const getRarityGradient = (rarity?: string): readonly [string, string, ...string[]] => {
        switch (rarity) {
            case 'uncommon': return ['#2ecc71', '#27ae60'];
            case 'rare': return ['#3498db', '#2980b9'];
            case 'epic': return ['#9b59b6', '#8e44ad'];
            case 'legendary': return ['#f39c12', '#e67e22'];
            default: return ['#95a5a6', '#7f8c8d'];
        }
    };

    if (loading) {
        return (
            <ScreenContainer backgroundColor={colors.background} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isTurkish ? 'Mağaza' : 'Store'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.gridContent}>
                     <View style={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                             <View key={i} style={styles.gridItem}>
                                <SkeletonCard height={200} />
                             </View>
                        ))}
                     </View>
                </ScrollView>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer backgroundColor={colors.background} edges={['top', 'left', 'right']}>
            <AlertComponent />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeGoBack(navigation, 'Home')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Mağaza' : 'Store'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Currency Bar */}
            <View style={styles.currencyContainer}>
                <LinearGradient
                    colors={['#FFF5F0', '#FFF0E0']}
                    style={styles.currencyCard}
                >
                    <View style={styles.currencyRow}>
                        <View style={styles.currencyIconBg}>
                            <Ionicons name="wallet" size={20} color="#FF9600" />
                        </View>
                        <View>
                            <Text style={styles.currencyLabel}>{isTurkish ? 'Puan' : 'Points'}</Text>
                            <Text style={styles.currencyValue}>{currency.points}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Category Tabs */}
            <View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.tabContainer}
                    style={styles.tabScroll}
                >
                    {(['all', 'booster', 'utility', 'cosmetic', 'equipment', 'nutrition', 'recovery', 'seasonal', 'premium'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => {
                                setActiveTab(tab);
                                setStoreItems([]);
                                setPage(0);
                                setHasMore(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={getCategoryIcon(tab)} size={16} color={activeTab === tab ? '#fff' : colors.textTertiary} />
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {getCategoryLabel(tab)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Items Grid */}
            <FlatList
                style={{ flex: 1 }}
                data={storeItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                numColumns={2}
                columnWrapperStyle={styles.grid}
                onEndReachedThreshold={0.4}
                onEndReached={handleLoadMore}
                renderItem={({ item, index }) => (
                    <View style={[styles.gridItem, { width: itemWidth }]}>
                        <GlassCard
                            style={styles.itemCard}
                            variant={item.rarity === 'legendary' || item.rarity === 'epic' ? 'premium' : 'default'}
                            delay={index * 50}
                            onPress={() => handlePurchase(item)}
                            noPadding
                        >
                            {item.rarity && item.rarity !== 'common' && (
                                <LinearGradient
                                    colors={getRarityGradient(item.rarity)}
                                    style={styles.rarityStripe}
                                />
                            )}

                            {item.badgeText && (
                                <View style={[styles.badgeContainer, { backgroundColor: item.badgeColor || colors.primary }]}>
                                    <Text style={styles.badgeText}>{item.badgeText}</Text>
                                </View>
                            )}

                            <LinearGradient
                                colors={isDark ? ['rgba(88,204,2,0.22)', 'rgba(28,176,246,0.1)'] : ['#F2FFE8', '#ECF8FF']}
                                style={styles.iconContainer}
                            >
                                <StoreIllustration
                                    itemId={item.id}
                                    size={62}
                                    variant={(item.rarity === 'legendary' || item.rarity === 'epic') ? 'fancy' : 'normal'}
                                    iconName={item.icon}
                                />
                            </LinearGradient>

                            <View style={styles.itemContent}>
                                <View>
                                    <Text style={styles.itemName} numberOfLines={1}>{isTurkish ? item.nameTr : item.name}</Text>
                                    <Text style={styles.itemDesc} numberOfLines={3}>{isTurkish ? item.descriptionTr : item.description}</Text>
                                </View>

                                <View style={styles.priceContainer}>
                                    <View style={styles.priceBadge}>
                                        <Ionicons name="wallet" size={12} color="#fff" />
                                        <Text style={styles.priceText}>{item.pricePoints}</Text>
                                    </View>
                                    {item.maxStack > 1 && (
                                        <Text style={styles.stockText}>x{item.maxStack}</Text>
                                    )}
                                </View>
                            </View>
                        </GlassCard>
                    </View>
                )}
                ListFooterComponent={loadingMore ? (
                    <View style={{ paddingVertical: 24 }}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : <View style={{ height: 40 }} />}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>
                            {loadError || (isTurkish ? 'Bu kategoride ürün yok' : 'No items in this category')}
                        </Text>
                        {loadError && (
                            <TouchableOpacity style={styles.retryButton} onPress={() => refreshStore()}>
                                <Text style={styles.retryButtonText}>{isTurkish ? 'Tekrar Dene' : 'Try Again'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
            />
        </ScreenContainer>
    );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backBtn: { 
        width: 40, 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    headerTitle: { 
        ...TYPOGRAPHY.h3, 
        color: colors.text, 
        fontWeight: '700'
    },
    currencyContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    currencyCard: {
        flex: 1,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    currencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    currencyIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F97316',
        marginBottom: 2,
    },
    currencyValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#EA580C',
        lineHeight: 22,
    },
    tabScroll: {
        marginBottom: SPACING.md,
    },
    tabContainer: {
        paddingHorizontal: SPACING.lg,
        gap: 8,
        paddingBottom: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    activeTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textTertiary,
    },
    activeTabText: {
        color: '#fff',
    },
    gridContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
    },
    grid: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridItem: {
        marginBottom: 12,
    },
    itemCard: {
        // padding: 0, // Handled by GlassCard prop noPadding
        height: 248,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    },
    rarityStripe: {
        height: 3,
        width: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 1,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    iconContainer: {
        height: 112,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? colors.border : colors.borderLight,
        marginTop: 3,
    },
    itemContent: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    itemDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 16,
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    stockText: {
        fontSize: 11,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 8,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default StoreScreen;
