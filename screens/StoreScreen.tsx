import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreService, StoreItem, UserCurrency } from '../services/storeService';
import { useTranslation } from '../hooks/useTranslation';
import GlassCard from '../components/GlassCard';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { COLORS, GRADIENTS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

const StoreScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { isTurkish } = useTranslation();
    const { showAlert, AlertComponent } = useAlert();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [currency, setCurrency] = useState<UserCurrency>({ points: 0, gems: 0, total_earned_points: 0, total_spent_points: 0 });
    const [activeTab, setActiveTab] = useState<string>('all');
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const storeService = StoreService.getInstance();
            const [items, curr] = await Promise.all([
                storeService.getStoreItems(),
                storeService.getUserCurrency(),
            ]);
            setStoreItems(items);
            setCurrency(curr);
        } catch (err) {
            console.warn('Store load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);
    const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

    const handlePurchase = async (item: StoreItem) => {
        if (currency.points < item.price_points) {
            showAlert({
                title: isTurkish ? 'Yetersiz Puan' : 'Insufficient Points',
                message: isTurkish ? `Bu ürün için ${item.price_points} puan gerekli. Mevcut: ${currency.points}` : `This item requires ${item.price_points} points. Available: ${currency.points}`,
                type: 'error'
            });
            return;
        }

        showAlert({
            title: isTurkish ? 'Satın Al' : 'Purchase',
            message: isTurkish
                ? `${item.name_tr} satın almak istiyor musunuz?\n\nFiyat: ${item.price_points} puan`
                : `Do you want to buy ${item.name}?\n\nPrice: ${item.price_points} points`,
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
                                    message: isTurkish ? `${item.name_tr} satın alındı!` : `${item.name} purchased!`,
                                    type: 'success'
                                });
                                await loadData();
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

    const filteredItems = activeTab === 'all' ? storeItems : storeItems.filter(item => item.category === activeTab);

    const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
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

    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'uncommon': return '#2ecc71';
            case 'rare': return '#3498db';
            case 'epic': return '#9b59b6';
            case 'legendary': return '#f39c12';
            default: return colors.textTertiary;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
            <AlertComponent />
            {/* Header */}
            <LinearGradient colors={GRADIENTS.primary as any} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTurkish ? 'Mağaza' : 'Store'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            {/* Currency Bar */}
            <View style={styles.currencyBar}>
                <View style={styles.currencyItem}>
                    <Ionicons name="wallet-outline" size={20} color={colors.text} />
                    <Text style={styles.currencyValue}>{currency.points}</Text>
                    <Text style={styles.currencyLabel}>{isTurkish ? 'Puan' : 'Points'}</Text>
                </View>
                <View style={styles.currencyDivider} />
                <View style={styles.currencyItem}>
                    <Ionicons name="diamond-outline" size={20} color={colors.text} />
                    <Text style={styles.currencyValue}>{currency.gems}</Text>
                    <Text style={styles.currencyLabel}>{isTurkish ? 'Elmas' : 'Gems'}</Text>
                </View>
                <View style={styles.currencyDivider} />
                <View style={styles.currencyItem}>
                    <Ionicons name="stats-chart-outline" size={20} color={colors.text} />
                    <Text style={styles.currencyValue}>{currency.total_earned_points}</Text>
                    <Text style={styles.currencyLabel}>{isTurkish ? 'Toplam' : 'Total'}</Text>
                </View>
            </View>

            {/* Category Tabs - Horizontal Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
                {(['all', 'booster', 'utility', 'cosmetic', 'equipment', 'nutrition', 'recovery', 'seasonal', 'premium'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={1}
                    >
                        <Ionicons name={getCategoryIcon(tab)} size={16} color={activeTab === tab ? '#fff' : colors.textTertiary} />
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {getCategoryLabel(tab)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Items Grid */}
            <ScrollView
                style={{ flex: 1, marginTop: SPACING.md }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <GlassCard key={item.id} style={styles.itemCard}>
                        {/* Badge */}
                        {item.badge_text && (
                            <View style={[styles.badgeContainer, { backgroundColor: item.badge_color || colors.primary }]}>
                                <Text style={styles.badgeText}>{item.badge_text}</Text>
                            </View>
                        )}
                        <View style={styles.itemHeader}>
                            <View style={[styles.itemIconWrap, { backgroundColor: getRarityColor(item.rarity) + '15' }]}>
                                <Ionicons name={getCategoryIcon(item.category)} size={24} color={getRarityColor(item.rarity)} />
                            </View>
                            <View style={styles.itemInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.itemName}>{isTurkish ? item.name_tr : item.name}</Text>
                                    {item.rarity && item.rarity !== 'common' && (
                                        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) + '20' }]}>
                                            <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>{item.rarity.toUpperCase()}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.itemDesc}>{isTurkish ? item.description_tr : item.description}</Text>
                            </View>
                        </View>

                        <View style={styles.itemFooter}>
                            {item.effect_duration_minutes && (
                                <View style={styles.durationBadge}>
                                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                                    <Text style={styles.durationText}>
                                        {item.effect_duration_minutes >= 60
                                            ? `${Math.floor(item.effect_duration_minutes / 60)}${isTurkish ? ' saat' : 'h'}`
                                            : `${item.effect_duration_minutes}${isTurkish ? ' dk' : 'm'}`}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.stackBadge}>
                                <Text style={styles.stackText}>Max: {item.max_stack}</Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.buyButton,
                                    currency.points < item.price_points && styles.buyButtonDisabled,
                                    purchasing === item.id && styles.buyButtonLoading,
                                ]}
                                onPress={() => handlePurchase(item)}
                                disabled={purchasing !== null}
                                activeOpacity={1}
                            >
                                {purchasing === item.id ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buyPrice}>{item.price_points}</Text>
                                        <Ionicons name="wallet-outline" size={14} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                )) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>{isTurkish ? 'Bu kategoride ürün yok' : 'No items in this category'}</Text>
                    </View>
                )}

                {/* Info Card */}
                <GlassCard style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{isTurkish ? 'Puan Nasıl Kazanılır?' : 'How to Earn Points?'}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="barbell" size={22} color={colors.text} />
                        <Text style={styles.infoText}>{isTurkish ? 'Antrenman tamamla — 15-30 puan' : 'Complete workouts — 15-30 points'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="restaurant" size={22} color={colors.text} />
                        <Text style={styles.infoText}>{isTurkish ? 'Öğün kaydet — 5-10 puan' : 'Log meals — 5-10 points'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="flag" size={22} color={colors.text} />
                        <Text style={styles.infoText}>{isTurkish ? 'Görevleri tamamla — 10-100 puan' : 'Complete missions — 10-100 points'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="flame" size={22} color="#FF6B6B" />
                        <Text style={styles.infoText}>{isTurkish ? 'Seri sürdür — 5 puan/gün' : 'Maintain streak — 5 points/day'}</Text>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...TYPOGRAPHY.h2, color: '#fff', flex: 1, textAlign: 'center' },
    currencyBar: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: colors.surface, marginHorizontal: SPACING.lg, marginTop: -20,
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm,
    },
    currencyItem: { alignItems: 'center' },
    currencyIcon: { fontSize: 20, marginBottom: 2 },
    currencyValue: { ...TYPOGRAPHY.h3, color: colors.text },
    currencyLabel: { ...TYPOGRAPHY.small, color: colors.textTertiary },
    currencyDivider: { width: 1, height: 36, backgroundColor: colors.borderLight },
    tabScroll: { marginTop: SPACING.lg, maxHeight: 50 },
    tabContainer: {
        flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 6,
    },
    tab: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: BORDER_RADIUS.pill,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    },
    activeTab: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...TYPOGRAPHY.small, color: colors.textTertiary, fontWeight: '600' },
    activeTabText: { color: '#fff' },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    itemCard: { padding: SPACING.lg, marginBottom: SPACING.md, overflow: 'hidden' },
    badgeContainer: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: BORDER_RADIUS.md, zIndex: 1 },
    badgeText: { ...TYPOGRAPHY.small, color: '#fff', fontWeight: '800', fontSize: 10 },
    itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
    itemIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { ...TYPOGRAPHY.bodyBold, color: colors.text },
    rarityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    rarityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    itemDesc: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
    itemFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BORDER_RADIUS.pill },
    durationText: { ...TYPOGRAPHY.small, color: colors.textSecondary },
    stackBadge: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BORDER_RADIUS.pill },
    stackText: { ...TYPOGRAPHY.small, color: colors.textTertiary },
    buyButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colors.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.pill, marginLeft: 'auto',
    },
    buyButtonDisabled: { backgroundColor: colors.textTertiary, opacity: 0.6 },
    buyButtonLoading: { paddingHorizontal: SPACING.lg },
    buyPrice: { ...TYPOGRAPHY.bodyBold, color: '#fff' },
    buyCurrency: { fontSize: 14 },
    emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxxl, gap: SPACING.md },
    emptyText: { ...TYPOGRAPHY.body, color: colors.textTertiary },
    infoCard: { padding: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.xl },
    infoTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginBottom: SPACING.md },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    infoIcon: { fontSize: 18 },
    infoText: { ...TYPOGRAPHY.body, color: colors.textSecondary, flex: 1 },
});

export default StoreScreen;
