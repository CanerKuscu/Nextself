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
exports.default = ChatScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const native_1 = require("@react-navigation/native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const supabase_1 = require("../services/supabase");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const security_1 = require("../utils/security");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
function ChatScreen() {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [newMessage, setNewMessage] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [currentUserId, setCurrentUserId] = (0, react_1.useState)(null);
    const navigation = (0, native_1.useNavigation)();
    const route = (0, native_1.useRoute)();
    const { chatId, userName } = route.params || {};
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const flatListRef = (0, react_1.useRef)(null);
    const loadMessages = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        try {
            setLoading(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data, error } = yield supabase.getMessages(chatId);
                if (error)
                    throw error;
                if (data) {
                    setMessages(data);
                    setTimeout(() => { var _a; return (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: false }); }, 100);
                }
            }
        }
        catch (err) {
            console.error('List messages error:', err);
        }
        finally {
            setLoading(false);
        }
    }), [chatId]);
    (0, react_1.useEffect)(() => {
        if (!chatId)
            return;
        loadMessages();
        const supabase = supabase_1.SupabaseService.getInstance();
        const channel = supabase.subscribeToMessages(chatId, (payload) => {
            setMessages(prev => {
                // Deduplicate: avoid adding a message that already exists
                if (prev.some((m) => { var _a; return m.id === ((_a = payload.new) === null || _a === void 0 ? void 0 : _a.id); }))
                    return prev;
                return [...prev, payload.new];
            });
            setTimeout(() => { var _a; return (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true }); }, 100);
        });
        return () => {
            if (channel) {
                supabase.getClient().removeChannel(channel);
            }
        };
    }, [chatId, loadMessages]);
    const handleSend = () => __awaiter(this, void 0, void 0, function* () {
        if (!newMessage.trim() || !currentUserId || !chatId)
            return;
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const sanitized = security_1.SecurityUtils.sanitizeInput(newMessage.trim());
            const { error } = yield supabase.sendMessage(chatId, currentUserId, sanitized);
            if (error)
                throw error;
            setNewMessage('');
        }
        catch (err) {
            console.error('Send message error:', err);
            console.warn(isTurkish ? 'Mesaj gönderilemedi.' : 'Failed to send message.');
        }
    });
    const renderMessage = (0, react_1.useCallback)(({ item }) => {
        var _a;
        const isMe = item.sender_id === currentUserId;
        return (<react_native_1.View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
                {!isMe && (<react_native_1.Text style={styles.senderName}>
                        {((_a = item.sender) === null || _a === void 0 ? void 0 : _a.first_name) || 'User'}
                    </react_native_1.Text>)}
                <react_native_1.Text style={[styles.messageText, isMe && styles.myMessageText]}>
                    {item.content}
                </react_native_1.Text>
                <react_native_1.Text style={[styles.timeText, isMe && styles.myTimeText]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </react_native_1.Text>
            </react_native_1.View>);
    }, [currentUserId, styles]);
    return (<react_native_1.KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined}>
            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + theme_1.SPACING.md }]}>
                <react_native_1.TouchableOpacity style={styles.backButton} onPress={() => (0, navigation_1.safeGoBack)(navigation, 'ChatList')}>
                    <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.Text style={styles.headerTitle}>{userName || (isTurkish ? 'Sohbet' : 'Chat')}</react_native_1.Text>
            </expo_linear_gradient_1.LinearGradient>

            {loading ? (<react_native_1.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
                </react_native_1.View>) : (<react_native_1.FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => String(item.id)} contentContainerStyle={styles.listContent} initialNumToRender={15} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={react_native_1.Platform.OS === 'android'}/>)}

            <react_native_1.View style={styles.inputContainer}>
                <react_native_1.TextInput style={styles.input} placeholder={isTurkish ? 'Mesaj yaz...' : 'Type a message...'} placeholderTextColor={colors.textTertiary} value={newMessage} onChangeText={setNewMessage} multiline maxLength={2000}/>
                <react_native_1.TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <vector_icons_1.Ionicons name="send" size={20} color={colors.textInverse}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>
        </react_native_1.KeyboardAvoidingView>);
}
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: theme_1.SPACING.md, paddingHorizontal: theme_1.SPACING.md, flexDirection: 'row', alignItems: 'center' },
    backButton: { padding: theme_1.SPACING.xs, marginRight: theme_1.SPACING.sm },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.textInverse }),
    listContent: { padding: theme_1.SPACING.md, paddingBottom: theme_1.SPACING.xl },
    messageBubble: { maxWidth: '80%', padding: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.md, marginBottom: theme_1.SPACING.sm },
    myMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 0 },
    otherMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 0 },
    senderName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary, marginBottom: 2 }),
    messageText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text }),
    myMessageText: { color: colors.textInverse },
    timeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: colors.textTertiary, alignSelf: 'flex-end', marginTop: 4, fontSize: 10 }),
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    inputContainer: { flexDirection: 'row', padding: theme_1.SPACING.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight, alignItems: 'center' },
    input: Object.assign(Object.assign({ flex: 1, backgroundColor: colors.background, borderRadius: theme_1.BORDER_RADIUS.pill, paddingHorizontal: theme_1.SPACING.md, paddingTop: react_native_1.Platform.OS === 'ios' ? 12 : 8, paddingBottom: react_native_1.Platform.OS === 'ios' ? 12 : 8, minHeight: 40, maxHeight: 100 }, theme_1.TYPOGRAPHY.body), { color: colors.text, marginRight: theme_1.SPACING.sm }),
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});
