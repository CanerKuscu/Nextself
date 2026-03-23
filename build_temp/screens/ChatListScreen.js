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
exports.default = ChatListScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const native_1 = require("@react-navigation/native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
function ChatListScreen() {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [chats, setChats] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [currentUserId, setCurrentUserId] = (0, react_1.useState)(null);
    const navigation = (0, native_1.useNavigation)();
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const getProfessionalLabel = (professionalType) => {
        if (!professionalType)
            return '';
        const normalized = professionalType.toLowerCase();
        const isPT = normalized === 'trainer' || normalized === 'pt';
        if (isTurkish) {
            return isPT ? 'Antrenör' : 'Diyetisyen';
        }
        return isPT ? 'Trainer' : 'Dietitian';
    };
    (0, react_1.useEffect)(() => {
        loadChats();
    }, []);
    const loadChats = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = yield supabase.getChats(user.id);
                if (error)
                    throw error;
                if (data) {
                    // Flatten structure
                    const formattedChats = data.map((item) => {
                        var _a;
                        const chatObj = item.chats;
                        // Find the *other* participant
                        const otherParticipant = (_a = chatObj.chat_participants.find((p) => p.user_id !== user.id)) === null || _a === void 0 ? void 0 : _a.users;
                        return {
                            id: item.chat_id,
                            updatedAt: chatObj.updated_at,
                            lastMessageAt: chatObj.last_message_at,
                            otherUser: otherParticipant || { first_name: 'Unknown', last_name: 'User' }
                        };
                    });
                    setChats(formattedChats);
                }
            }
        }
        catch (err) {
            console.error('List chats error:', err);
        }
        finally {
            setLoading(false);
        }
    });
    const renderChatItem = (0, react_1.useCallback)(({ item }) => (<react_native_1.TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item.id, userName: `${item.otherUser.first_name} ${item.otherUser.last_name}` })}>
            <GlassCard_1.default style={styles.chatCard}>
                <react_native_1.View style={styles.avatar}>
                    <vector_icons_1.Ionicons name="person" size={24} color={colors.primary}/>
                </react_native_1.View>
                <react_native_1.View style={styles.chatInfo}>
                    <react_native_1.Text style={styles.chatName}>
                        {item.otherUser.first_name} {item.otherUser.last_name}
                    </react_native_1.Text>
                    {item.otherUser.professional_type && (<react_native_1.Text style={styles.chatType}>
                            {getProfessionalLabel(item.otherUser.professional_type)}
                        </react_native_1.Text>)}
                </react_native_1.View>
                <vector_icons_1.Ionicons name="chevron-forward" size={20} color={colors.textTertiary}/>
            </GlassCard_1.default>
        </react_native_1.TouchableOpacity>), [navigation, styles]);
    return (<react_native_1.View style={[styles.container, { backgroundColor: colors.background }]}>
            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + theme_1.SPACING.md }]}>
                <react_native_1.TouchableOpacity style={styles.backButton} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Main')}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Mesajlar' : 'Messages'}</react_native_1.Text>
            </expo_linear_gradient_1.LinearGradient>

            {loading ? (<react_native_1.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                </react_native_1.View>) : (<react_native_1.FlatList data={chats} renderItem={renderChatItem} keyExtractor={item => String(item.id)} contentContainerStyle={styles.listContent} 
        // Optimize FlatList performance with windowing and batching
        initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} updateCellsBatchingPeriod={50} getItemLayout={(data, index) => ({
                length: 80, // Estimated chat card height
                offset: 80 * index,
                index,
            })} ListEmptyComponent={<react_native_1.View style={{ alignItems: 'center', marginTop: theme_1.SPACING.xxl }}>
                            <vector_icons_1.Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary}/>
                            <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textTertiary, marginTop: theme_1.SPACING.md })}>
                                {isTurkish ? 'Henüz mesajınız yok.' : 'No messages yet.'}
                            </react_native_1.Text>
                        </react_native_1.View>}/>)}
        </react_native_1.View>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: theme_1.SPACING.lg, paddingHorizontal: theme_1.SPACING.md, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backButton: { padding: theme_1.SPACING.xs, marginRight: theme_1.SPACING.sm },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.textInverse }),
    listContent: { padding: theme_1.SPACING.md },
    chatCard: { flexDirection: 'row', alignItems: 'center', marginBottom: theme_1.SPACING.sm, padding: theme_1.SPACING.md },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    chatInfo: { flex: 1, marginLeft: theme_1.SPACING.md },
    chatName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    chatType: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.primary, marginTop: 2 }),
});
