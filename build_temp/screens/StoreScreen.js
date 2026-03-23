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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const storeService_1 = require("../services/storeService");
const useTranslation_1 = require("../hooks/useTranslation");
const StoreIllustration_1 = __importDefault(require("../components/StoreIllustration"));
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const CustomAlert_1 = require("../components/CustomAlert");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const ScreenContainer_1 = __importDefault(require("../components/ScreenContainer"));
const SkeletonCard_1 = __importDefault(require("../components/SkeletonCard"));
const PAGE_SIZE = 16;
const StoreScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const itemWidth = react_1.default.useMemo(() => Math.max((width - 60) / 2, 150), [width]);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [storeItems, setStoreItems] = (0, react_1.useState)([]);
    const [currency, setCurrency] = (0, react_1.useState)({ points: 0, gems: 0, totalEarnedPoints: 0, totalSpentPoints: 0 });
    const [activeTab, setActiveTab] = (0, react_1.useState)('all');
    const [page, setPage] = (0, react_1.useState)(0);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const [loadError, setLoadError] = (0, react_1.useState)(null);
    const [purchasing, setPurchasing] = (0, react_1.useState)(null);
    const loadCurrency = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        const storeService = storeService_1.StoreService.getInstance();
        const curr = yield storeService.getUserCurrency();
        setCurrency(curr);
    }), []);
    const loadStoreItems = (0, react_1.useCallback)((pageParam, replace) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (pageParam > 0) {
                setLoadingMore(true);
            }
            setLoadError(null);
            const storeService = storeService_1.StoreService.getInstance();
            const items = yield storeService.getStoreItems(activeTab, pageParam, PAGE_SIZE);
            setHasMore(items.length === PAGE_SIZE);
            setPage(pageParam);
            setStoreItems(prev => {
                if (replace)
                    return items;
                const existing = new Set(prev.map(item => item.id));
                const next = items.filter(item => !existing.has(item.id));
                return prev.concat(next);
            });
        }
        catch (err) {
            console.warn('Store load error:', err);
            setLoadError(isTurkish ? 'Ürünler yüklenemedi' : 'Failed to load store items');
            if (replace) {
                setStoreItems([]);
            }
        }
        finally {
            setLoadingMore(false);
        }
    }), [activeTab, isTurkish]);
    const refreshStore = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([
            loadCurrency(),
            loadStoreItems(0, true),
        ]);
    }), [loadCurrency, loadStoreItems]);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        const bootstrap = () => __awaiter(void 0, void 0, void 0, function* () {
            setLoading(true);
            if (mounted) {
                yield refreshStore();
                setLoading(false);
            }
        });
        bootstrap();
        return () => { mounted = false; };
    }, [refreshStore]);
    const onRefresh = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        setRefreshing(true);
        yield refreshStore();
        setRefreshing(false);
    }), [refreshStore]);
    const handleLoadMore = (0, react_1.useCallback)(() => {
        if (loading || loadingMore || !hasMore)
            return;
        loadStoreItems(page + 1, false);
    }, [hasMore, loading, loadingMore, loadStoreItems, page]);
    const handlePurchase = (item) => __awaiter(void 0, void 0, void 0, function* () {
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
                    onPress: () => __awaiter(void 0, void 0, void 0, function* () {
                        setPurchasing(item.id);
                        try {
                            const result = yield storeService_1.StoreService.getInstance().purchaseItem(item.id);
                            if (result.success) {
                                showAlert({
                                    title: isTurkish ? 'Başarılı!' : 'Success!',
                                    message: isTurkish ? `${item.nameTr} satın alındı!` : `${item.name} purchased!`,
                                    type: 'success'
                                });
                                yield refreshStore();
                            }
                            else {
                                const messages = {
                                    insufficient_points: isTurkish ? 'Yetersiz puan' : 'Insufficient points',
                                    max_stack_reached: isTurkish ? 'Maksimum stok sınırına ulaşıldı' : 'Max stack reached',
                                };
                                showAlert({
                                    title: isTurkish ? 'Hata' : 'Error',
                                    message: messages[result.message] || (isTurkish ? 'Satın alma başarısız' : 'Purchase failed'),
                                    type: 'error'
                                });
                            }
                        }
                        catch (error) {
                            console.warn('Purchase error:', error);
                            showAlert({
                                title: isTurkish ? 'Hata' : 'Error',
                                message: isTurkish ? 'Satın alma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred during purchase. Please try again.',
                                type: 'error'
                            });
                        }
                        finally {
                            setPurchasing(null);
                        }
                    }),
                },
            ],
        });
    });
    const getCategoryIcon = (category, itemIcon) => {
        // Use item-specific icon if available
        if (itemIcon) {
            const iconMap = {
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
            if (iconMap[itemIcon])
                return iconMap[itemIcon];
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
    const getCategoryLabel = (cat) => {
        var _a, _b;
        const labels = {
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
        return isTurkish ? ((_a = labels[cat]) === null || _a === void 0 ? void 0 : _a.tr) || cat : ((_b = labels[cat]) === null || _b === void 0 ? void 0 : _b.en) || cat;
    };
    const getRarityGradient = (rarity) => {
        switch (rarity) {
            case 'uncommon': return ['#2ecc71', '#27ae60'];
            case 'rare': return ['#3498db', '#2980b9'];
            case 'epic': return ['#9b59b6', '#8e44ad'];
            case 'legendary': return ['#f39c12', '#e67e22'];
            default: return ['#95a5a6', '#7f8c8d'];
        }
    };
    if (loading) {
        return (<ScreenContainer_1.default backgroundColor={colors.background} edges={['top', 'left', 'right']}>
                <react_native_1.View style={styles.header}>
                    <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')} style={styles.backBtn}>
                        <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Mağaza' : 'Store'}</react_native_1.Text>
                    <react_native_1.View style={{ width: 40 }}/>
                </react_native_1.View>
                <react_native_1.ScrollView contentContainerStyle={styles.gridContent}>
                     <react_native_1.View style={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (<react_native_1.View key={i} style={styles.gridItem}>
                                <SkeletonCard_1.default height={200}/>
                             </react_native_1.View>))}
                     </react_native_1.View>
                </react_native_1.ScrollView>
            </ScreenContainer_1.default>);
    }
    return (<ScreenContainer_1.default backgroundColor={colors.background} edges={['top', 'left', 'right']}>
            <AlertComponent />
            
            {/* Header */}
            <react_native_1.View style={styles.header}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Home')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Mağaza' : 'Store'}</react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            {/* Currency Bar */}
            <react_native_1.View style={styles.currencyContainer}>
                <expo_linear_gradient_1.LinearGradient colors={['#FFF5F0', '#FFF0E0']} style={styles.currencyCard}>
                    <react_native_1.View style={styles.currencyRow}>
                        <react_native_1.View style={styles.currencyIconBg}>
                            <vector_icons_1.Ionicons name="wallet" size={20} color="#FF9600"/>
                        </react_native_1.View>
                        <react_native_1.View>
                            <react_native_1.Text style={styles.currencyLabel}>{isTurkish ? 'Puan' : 'Points'}</react_native_1.Text>
                            <react_native_1.Text style={styles.currencyValue}>{currency.points}</react_native_1.Text>
                        </react_native_1.View>
                    </react_native_1.View>
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.View>

            {/* Category Tabs */}
            <react_native_1.View>
                <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer} style={styles.tabScroll}>
                    {['all', 'booster', 'utility', 'cosmetic', 'equipment', 'nutrition', 'recovery', 'seasonal', 'premium'].map((tab) => (<react_native_1.TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => {
                setActiveTab(tab);
                setStoreItems([]);
                setPage(0);
                setHasMore(true);
            }} activeOpacity={0.7}>
                            <vector_icons_1.Ionicons name={getCategoryIcon(tab)} size={16} color={activeTab === tab ? '#fff' : colors.textTertiary}/>
                            <react_native_1.Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {getCategoryLabel(tab)}
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>))}
                </react_native_1.ScrollView>
            </react_native_1.View>

            {/* Items Grid */}
            <react_native_1.FlatList style={{ flex: 1 }} data={storeItems} keyExtractor={(item) => item.id} contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false} initialNumToRender={6} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/>} numColumns={2} columnWrapperStyle={styles.grid} onEndReachedThreshold={0.4} onEndReached={handleLoadMore} renderItem={({ item, index }) => (<react_native_1.View style={[styles.gridItem, { width: itemWidth }]}>
                        <GlassCard_1.default style={styles.itemCard} variant={item.rarity === 'legendary' || item.rarity === 'epic' ? 'premium' : 'default'} delay={index * 50} onPress={() => handlePurchase(item)} noPadding>
                            {item.rarity && item.rarity !== 'common' && (<expo_linear_gradient_1.LinearGradient colors={getRarityGradient(item.rarity)} style={styles.rarityStripe}/>)}

                            {item.badgeText && (<react_native_1.View style={[styles.badgeContainer, { backgroundColor: item.badgeColor || colors.primary }]}>
                                    <react_native_1.Text style={styles.badgeText}>{item.badgeText}</react_native_1.Text>
                                </react_native_1.View>)}

                            <expo_linear_gradient_1.LinearGradient colors={isDark ? ['rgba(88,204,2,0.22)', 'rgba(28,176,246,0.1)'] : ['#F2FFE8', '#ECF8FF']} style={styles.iconContainer}>
                                <StoreIllustration_1.default itemId={item.id} size={62} variant={(item.rarity === 'legendary' || item.rarity === 'epic') ? 'fancy' : 'normal'} iconName={item.icon}/>
                            </expo_linear_gradient_1.LinearGradient>

                            <react_native_1.View style={styles.itemContent}>
                                <react_native_1.View>
                                    <react_native_1.Text style={styles.itemName} numberOfLines={1}>{isTurkish ? item.nameTr : item.name}</react_native_1.Text>
                                    <react_native_1.Text style={styles.itemDesc} numberOfLines={3}>{isTurkish ? item.descriptionTr : item.description}</react_native_1.Text>
                                </react_native_1.View>

                                <react_native_1.View style={styles.priceContainer}>
                                    <react_native_1.View style={styles.priceBadge}>
                                        <vector_icons_1.Ionicons name="wallet" size={12} color="#fff"/>
                                        <react_native_1.Text style={styles.priceText}>{item.pricePoints}</react_native_1.Text>
                                    </react_native_1.View>
                                    {item.maxStack > 1 && (<react_native_1.Text style={styles.stockText}>x{item.maxStack}</react_native_1.Text>)}
                                </react_native_1.View>
                            </react_native_1.View>
                        </GlassCard_1.default>
                    </react_native_1.View>)} ListFooterComponent={loadingMore ? (<react_native_1.View style={{ paddingVertical: 24 }}>
                        <react_native_1.ActivityIndicator color={colors.primary}/>
                    </react_native_1.View>) : <react_native_1.View style={{ height: 40 }}/>} ListEmptyComponent={!loading ? (<react_native_1.View style={styles.emptyContainer}>
                        <vector_icons_1.Ionicons name="cart-outline" size={64} color={colors.textTertiary}/>
                        <react_native_1.Text style={styles.emptyText}>
                            {loadError || (isTurkish ? 'Bu kategoride ürün yok' : 'No items in this category')}
                        </react_native_1.Text>
                        {loadError && (<react_native_1.TouchableOpacity style={styles.retryButton} onPress={() => refreshStore()}>
                                <react_native_1.Text style={styles.retryButtonText}>{isTurkish ? 'Tekrar Dene' : 'Try Again'}</react_native_1.Text>
                            </react_native_1.TouchableOpacity>)}
                    </react_native_1.View>) : null}/>
        </ScreenContainer_1.default>);
};
const getStyles = (colors, isDark) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, fontWeight: '700' }),
    currencyContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.md,
    },
    currencyCard: {
        flex: 1,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        padding: theme_1.SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    currencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.sm,
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
        marginBottom: theme_1.SPACING.md,
    },
    tabContainer: {
        paddingHorizontal: theme_1.SPACING.lg,
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
        paddingHorizontal: theme_1.SPACING.lg,
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
exports.default = StoreScreen;
