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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const CustomAlert_1 = require("../components/CustomAlert");
const ClientsListScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [clients, setClients] = (0, react_1.useState)([]);
    const [filteredClients, setFilteredClients] = (0, react_1.useState)([]);
    const [search, setSearch] = (0, react_1.useState)('');
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const loadClients = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user)
                return;
            const { data: profile } = yield supabase.getUserProfile(user.id);
            let professionalProfileId = '';
            // Get professional profile ID
            try {
                const { data: profProfile } = yield supabase.getClient()
                    .from('professional_profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                if (profProfile) {
                    professionalProfileId = profProfile.id;
                }
            }
            catch (e) {
                console.error('Error fetching professional profile:', e);
            }
            // Get clients from client_relationships
            const client = supabase.getClient();
            let clientIds = [];
            let relationshipsMap = new Map(); // clientId -> relationshipId
            try {
                if (professionalProfileId) {
                    const { data: relationships, error: relError } = yield client
                        .from('client_relationships')
                        .select('id, client_id')
                        .or(`professional_id.eq.${professionalProfileId},trainer_id.eq.${professionalProfileId},dietitian_id.eq.${professionalProfileId}`)
                        .eq('status', 'active');
                    if (!relError && relationships) {
                        relationships.forEach((r) => {
                            relationshipsMap.set(r.client_id, r.id);
                        });
                        clientIds = [...new Set(relationships.map((r) => r.client_id))];
                    }
                }
                if (clientIds.length === 0) {
                    console.log('Fallback to legacy client fetch in ClientsList');
                    if ((profile === null || profile === void 0 ? void 0 : profile.professional_type) === 'dietitian') {
                        const { data: plans } = yield client
                            .from('assigned_nutrition_plans')
                            .select('client_id')
                            .eq('dietitian_id', user.id)
                            .eq('is_active', true);
                        clientIds = [...new Set((plans || []).map((p) => p.client_id))];
                    }
                    else {
                        const { data: workouts } = yield client
                            .from('assigned_workouts')
                            .select('client_id')
                            .eq('pt_id', user.id);
                        clientIds = [...new Set((workouts || []).map((w) => w.client_id))];
                    }
                }
            }
            catch (e) {
                console.error('Error fetching clients:', e);
            }
            if (clientIds.length > 0) {
                const { data: clientProfiles } = yield client
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, email, weight, height')
                    .in('id', clientIds);
                if (clientProfiles) {
                    const mapped = clientProfiles.map((c) => ({
                        id: c.id,
                        relationshipId: relationshipsMap.get(c.id),
                        first_name: c.first_name || '',
                        last_name: c.last_name || '',
                        avatar_url: c.avatar_url,
                        email: c.email,
                        weight: c.weight,
                        height: c.height,
                    }));
                    setClients(mapped);
                    setFilteredClients(mapped);
                }
            }
        }
        catch (err) {
            console.error('Error loading clients:', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }), []);
    const handleStartSession = (0, react_1.useCallback)((client) => __awaiter(void 0, void 0, void 0, function* () {
        if (!client.relationshipId) {
            showAlert({
                title: t('error'),
                message: isTurkish ? 'İstemci bağlantısı bulunamadı.' : 'Client relationship not found.',
                type: 'error'
            });
            return;
        }
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance().getClient();
            // Use a specific prefix to identify requests initiated by professional
            const requestId = `REQ-${Date.now()}`;
            const { error } = yield supabase
                .from('session_checkins')
                .insert({
                client_relationship_id: client.relationshipId,
                qr_token: requestId,
                is_verified: false,
            });
            if (error)
                throw error;
            showAlert({
                title: isTurkish ? 'İstek Gönderildi' : 'Request Sent',
                message: isTurkish ? 'Onay isteği gönderildi. Müşterinin onayı bekleniyor.' : 'Request sent. Waiting for client approval.',
                type: 'success',
                buttons: [{ text: 'OK', onPress: () => { } }]
            });
        }
        catch (error) {
            console.error('Start session error:', error);
            showAlert({
                title: t('error'),
                message: error.message || 'Failed to start session',
                type: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    }), [isTurkish, t, showAlert]);
    (0, react_1.useEffect)(() => {
        loadClients();
    }, [loadClients]);
    (0, react_1.useEffect)(() => {
        if (search.trim()) {
            const q = search.toLowerCase();
            setFilteredClients(clients.filter(c => (c.first_name + ' ' + c.last_name).toLowerCase().includes(q)));
        }
        else {
            setFilteredClients(clients);
        }
    }, [search, clients]);
    const onRefresh = (0, react_1.useCallback)(() => {
        setRefreshing(true);
        loadClients();
    }, [loadClients]);
    const styles = (0, react_1.useMemo)(() => getStyles(colors, isDark), [colors, isDark]);
    const renderClient = (0, react_1.useCallback)(({ item }) => (<react_native_1.TouchableOpacity style={styles.clientCard} onPress={() => navigation.navigate('ClientDetail', { client: item })}>
            <react_native_1.View style={styles.avatar}>
                <vector_icons_1.Ionicons name="person" size={24} color={theme_1.COLORS.primary}/>
            </react_native_1.View>
            <react_native_1.View style={styles.clientInfo}>
                <react_native_1.Text style={styles.clientName}>{item.first_name} {item.last_name}</react_native_1.Text>
                {item.weight && item.height ? (<react_native_1.Text style={styles.clientDetail}>
                        {item.weight}kg · {item.height}cm
                    </react_native_1.Text>) : null}
            </react_native_1.View>
            <react_native_1.View style={styles.clientActions}>
                <react_native_1.TouchableOpacity style={styles.iconBtn} onPress={() => handleStartSession(item)}>
                    <vector_icons_1.Ionicons name="play-outline" size={20} color={theme_1.COLORS.primary}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Chat', { chatPartnerId: item.id })}>
                    <vector_icons_1.Ionicons name="chatbubble-outline" size={20} color={theme_1.COLORS.primary}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>
        </react_native_1.TouchableOpacity>), [navigation, styles, handleStartSession]);
    return (<react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
            <AlertComponent />
            {/* Header */}
            <react_native_1.View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'ProfessionalHome')} style={styles.backBtn}>
                    <vector_icons_1.Ionicons name="chevron-back" size={24} color={colors.text}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>
                    {t('my_clients')}
                </react_native_1.Text>
                <react_native_1.View style={{ width: 40 }}/>
            </react_native_1.View>

            {/* Search */}
            <react_native_1.View style={styles.searchContainer}>
                <vector_icons_1.Ionicons name="search-outline" size={20} color={colors.textTertiary}/>
                <react_native_1.TextInput style={styles.searchInput} placeholder={t('search_clients')} placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch}/>
            </react_native_1.View>

            {loading ? (<react_native_1.View style={styles.centerView}>
                    <react_native_1.ActivityIndicator size="large" color={theme_1.COLORS.primary}/>
                </react_native_1.View>) : (<react_native_1.FlatList data={filteredClients} keyExtractor={(item) => String(item.id)} renderItem={renderClient} 
        // Optimize FlatList performance with windowing and batching
        initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} updateCellsBatchingPeriod={50} getItemLayout={(data, index) => ({
                length: 80, // Estimated client card height
                offset: 80 * index,
                index,
            })} contentContainerStyle={styles.listContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme_1.COLORS.primary}/>} ListEmptyComponent={<react_native_1.View style={styles.centerView}>
                            <vector_icons_1.Ionicons name="people-outline" size={60} color={colors.textTertiary}/>
                            <react_native_1.Text style={styles.emptyText}>
                                {t('no_clients_yet')}
                            </react_native_1.Text>
                        </react_native_1.View>}/>)}
        </react_native_1.View>);
};
const getStyles = (colors, isDark) => react_native_1.StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: theme_1.SPACING.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text }),
    searchContainer: Object.assign({ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.md, paddingHorizontal: theme_1.SPACING.md, gap: theme_1.SPACING.sm }, theme_1.SHADOWS.sm),
    searchInput: Object.assign(Object.assign({ flex: 1, paddingVertical: theme_1.SPACING.md }, theme_1.TYPOGRAPHY.body), { color: colors.text, textAlignVertical: 'center' }),
    listContent: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingBottom: 100,
    },
    clientCard: Object.assign({ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.lg, padding: theme_1.SPACING.md, marginBottom: theme_1.SPACING.sm, gap: theme_1.SPACING.md }, theme_1.SHADOWS.card),
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme_1.COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { fontWeight: '600', color: colors.text }),
    clientDetail: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textSecondary, marginTop: 2 }),
    clientActions: {
        flexDirection: 'row',
        gap: theme_1.SPACING.sm,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme_1.COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        gap: theme_1.SPACING.md,
    },
    emptyText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textTertiary }),
});
exports.default = ClientsListScreen;
