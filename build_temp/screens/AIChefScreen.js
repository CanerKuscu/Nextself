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
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const PremiumBadge_1 = __importDefault(require("../components/PremiumBadge"));
const PremiumFeaturesModal_1 = __importDefault(require("../components/PremiumFeaturesModal"));
const deepseek_1 = require("../services/deepseek");
const supabase_1 = require("../services/supabase");
const supplementService_1 = require("../services/supplementService");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const detectMessageLanguage = (text, fallback) => {
    const q = (text || '').trim();
    if (!q)
        return fallback;
    if (/[а-яё]/i.test(q))
        return 'ru';
    if (/[ء-ي]/i.test(q))
        return 'ar';
    if (/[一-龯]/.test(q))
        return 'zh';
    if (/[ぁ-ゖァ-ヺ]/.test(q))
        return 'ja';
    if (/[가-힣]/.test(q))
        return 'ko';
    if (/[ऀ-ॿ]/.test(q))
        return 'hi';
    if (/[ก-๙]/.test(q))
        return 'th';
    if (/[א-ת]/.test(q))
        return 'he';
    if (/[çğıöşüİı]/i.test(q) || /\b(merhaba|selam|tarif|yemek|mutfak|malzeme)\b/i.test(q))
        return 'tr';
    if (/\b(hola|gracias|receta|comida|cocina)\b/i.test(q))
        return 'es';
    if (/\b(bonjour|merci|recette|cuisine|alimentation)\b/i.test(q))
        return 'fr';
    if (/\b(hallo|danke|rezept|küche|ernährung)\b/i.test(q))
        return 'de';
    if (/\b(ciao|grazie|ricetta|cucina|cibo)\b/i.test(q))
        return 'it';
    if (/\b(olá|obrigado|receita|cozinha|alimentação)\b/i.test(q))
        return 'pt';
    return fallback;
};
const AIChefScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showPremiumModal, setShowPremiumModal] = (0, react_1.useState)(false);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const scrollRef = (0, react_1.useRef)(null);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    (0, react_1.useEffect)(() => {
        const welcome = {
            id: '0', role: 'ai',
            content: isTurkish
                ? 'Merhaba, ben AI Şef. Hedefine uygun besin önerisi, tarif ve yapılış adımları veririm.'
                : 'Hi, I am AI Chef. I provide goal-based food suggestions, recipes, and step-by-step cooking guides.',
            timestamp: new Date(),
        };
        setMessages([welcome]);
    }, [isTurkish]);
    const sendMessage = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!input.trim())
            return;
        const userInput = input.trim();
        const detectedLanguage = userInput ? detectMessageLanguage(userInput, 'auto') : (isTurkish ? 'tr' : 'en');
        const userMsg = { id: Date.now().toString(), role: 'user', content: userInput, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const deepseek = deepseek_1.DeepSeekService.getInstance();
            // Fetch User Profile for better context
            let contextData = {};
            try {
                const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
                if (user) {
                    const { data: profile } = yield supabase_1.SupabaseService.getInstance().getClient()
                        .from('profiles')
                        .select('fitness_goal, dietary_preferences, allergies')
                        .eq('id', user.id)
                        .single();
                    // Fetch supplements
                    const { data: routines } = yield supplementService_1.SupplementService.getInstance().getUserRoutine(user.id);
                    let activeSupplements = [];
                    if (routines && routines.length > 0) {
                        activeSupplements = routines.map((r) => `${r.supplement.name_en || r.supplement.name_tr} (${r.supplement.dosage_amount || ''}${r.supplement.dosage_unit || ''})`);
                    }
                    if (profile) {
                        contextData = {
                            goal: profile.fitness_goal,
                            dietary_preferences: profile.dietary_preferences,
                            allergies: profile.allergies,
                            supplements: activeSupplements
                        };
                    }
                }
            }
            catch (e) {
                console.warn('Failed to fetch user context for AI Chef:', e);
            }
            // Send structured data to Edge Function
            const response = yield deepseek.generateContent('chef', {
                query: `${userMsg.content}\n\n${isTurkish
                    ? 'Cevap formatı: 1) Hedefe göre besin önerisi 2) Tarifi adım adım nasıl yapacağım 3) İlgili en az 2 YouTube videosu için tam bağlantı (youtube.com arama linki olabilir).'
                    : 'Response format: 1) Goal-based food suggestion 2) Step-by-step preparation 3) At least 2 full YouTube links (youtube.com search links are acceptable).'}`,
                context: contextData,
                language: detectedLanguage
            });
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);
        }
        catch (_a) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
        }
        finally {
            setLoading(false);
        }
        setTimeout(() => { var _a; return (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true }); }, 100);
    });
    return (<react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
      <PremiumFeaturesModal_1.default visible={showPremiumModal} onClose={() => {
            setShowPremiumModal(false);
            (0, navigation_1.safeGoBack)(navigation, 'AIToolsStack');
        }} onUpgrade={() => {
            setShowPremiumModal(false);
            navigation.navigate('Store');
        }}/>
      <react_native_1.View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'AIToolsStack')} style={styles.backBtn} activeOpacity={0.7}>
          <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.text}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.View style={styles.headerIcon}>
            <vector_icons_1.Ionicons name="flame" size={24} color={colors.accent}/>
          </react_native_1.View>
          <react_native_1.View style={{ flex: 1 }}>
            <react_native_1.Text style={styles.headerTitle}>AI {isTurkish ? 'Şef' : 'Chef'}</react_native_1.Text>
            <react_native_1.Text style={styles.headerSub}>{isTurkish ? 'Sağlıklı tarif asistanı' : 'Healthy recipe assistant'}</react_native_1.Text>
          </react_native_1.View>
          <PremiumBadge_1.default locked={false} size="md"/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
        <react_native_1.ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (<react_native_1.View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'ai' && <react_native_1.View style={styles.aiAvatar}><vector_icons_1.Ionicons name="flame" size={14} color={colors.accent}/></react_native_1.View>}
              <react_native_1.View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                <react_native_1.Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>))}
          {loading && (<react_native_1.View style={styles.loadingWrap}>
              <react_native_1.ActivityIndicator size="small" color={colors.accent}/>
              <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Tarif hazırlanıyor...' : 'Cooking up recipe...'}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.ScrollView>

        <react_native_1.View style={[styles.inputContainer, { marginBottom: react_native_1.Platform.OS === 'ios' ? insets.bottom : 20 }]}>
          <react_native_1.TextInput style={styles.input} value={input} onChangeText={setInput} placeholder={isTurkish ? 'Bir şeyler sorun...' : 'Ask something...'} placeholderTextColor={colors.textSecondary} multiline maxLength={500}/>
          <react_native_1.TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
            {loading ? <react_native_1.ActivityIndicator size="small" color="#FFF"/> : <vector_icons_1.Ionicons name="send" size={20} color="#FFF"/>}
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.KeyboardAvoidingView>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme_1.SPACING.md,
        paddingBottom: theme_1.SPACING.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { marginRight: theme_1.SPACING.sm },
    headerRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.accent + '20',
        alignItems: 'center', justifyContent: 'center', marginRight: theme_1.SPACING.sm
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    headerSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    chatContent: { padding: theme_1.SPACING.md, paddingBottom: 100 },
    messageBubble: {
        maxWidth: '85%', padding: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.lg,
        marginBottom: theme_1.SPACING.md, flexDirection: 'row',
    },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 2 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
    aiAvatar: { marginRight: theme_1.SPACING.xs, marginTop: 2 },
    messageContent: { flex: 1 },
    userContent: { flex: 1 },
    aiContent: { flex: 1 },
    messageText: Object.assign({}, theme_1.TYPOGRAPHY.body),
    userText: { color: '#FFF' },
    aiText: { color: colors.text },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: theme_1.SPACING.md, marginBottom: theme_1.SPACING.md },
    loadingText: Object.assign({ marginLeft: theme_1.SPACING.xs, color: colors.textSecondary }, theme_1.TYPOGRAPHY.caption),
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: theme_1.SPACING.sm,
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    input: {
        flex: 1, backgroundColor: colors.background, borderRadius: theme_1.BORDER_RADIUS.pill,
        paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.sm,
        color: colors.text, maxHeight: 100,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
        alignItems: 'center', justifyContent: 'center', marginLeft: theme_1.SPACING.sm,
    },
    sendBtnDisabled: { backgroundColor: colors.disabled || '#ccc' },
});
exports.default = AIChefScreen;
