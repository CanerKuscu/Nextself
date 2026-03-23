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
const expo_image_1 = require("expo-image"); // Use expo-image for better caching and performance
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const ImagePicker = __importStar(require("expo-image-picker"));
const PremiumBadge_1 = __importDefault(require("../components/PremiumBadge"));
const PremiumFeaturesModal_1 = __importDefault(require("../components/PremiumFeaturesModal"));
const CustomAlert_1 = require("../components/CustomAlert");
const deepseek_1 = require("../services/deepseek");
const paymentService_1 = require("../services/paymentService");
const supabase_1 = require("../services/supabase");
const leagueService_1 = require("../services/leagueService");
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
    if (/[çğıöşüİı]/i.test(q) || /\b(merhaba|selam|nasılsın|beslenme|diyet|kalori|makro)\b/i.test(q))
        return 'tr';
    if (/\b(hola|gracias|nutrición|dieta|salud)\b/i.test(q))
        return 'es';
    if (/\b(bonjour|merci|nutrition|régime|santé)\b/i.test(q))
        return 'fr';
    if (/\b(hallo|danke|ernährung|diät|gesundheit)\b/i.test(q))
        return 'de';
    if (/\b(ciao|grazie|nutrizione|dieta|salute)\b/i.test(q))
        return 'it';
    if (/\b(olá|obrigado|nutrição|dieta|saúde)\b/i.test(q))
        return 'pt';
    return fallback;
};
const DIETITIAN_POPUP_SHOWN_KEY = 'nextself_dietitian_popup_shown';
const AIDietitianScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [selectedImage, setSelectedImage] = (0, react_1.useState)(null);
    const [selectedImageBase64, setSelectedImageBase64] = (0, react_1.useState)(null);
    const [showPhotoOptions, setShowPhotoOptions] = (0, react_1.useState)(false);
    const [showPremiumModal, setShowPremiumModal] = (0, react_1.useState)(false);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const scrollRef = (0, react_1.useRef)(null);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    (0, react_1.useEffect)(() => {
        const welcome = {
            id: '0', role: 'ai',
            content: isTurkish
                ? 'Merhaba, ben AI Diyetisyen. Beslenme ve diyet programını hedefinize göre oluştururum.'
                : 'Hi, I am AI Dietitian. I create nutrition and diet programs for your goals.',
            timestamp: new Date(),
        };
        setMessages([welcome]);
    }, [isTurkish]);
    const checkPremiumStatus = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            if (user) {
                const isPremium = yield paymentService_1.PaymentService.getInstance().hasPremiumFeatures(user.id);
                return isPremium;
            }
        }
        catch (err) {
            console.warn('Premium check error:', err);
        }
        return false;
    });
    const pickImage = (useCamera) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setShowPhotoOptions(false);
            if (useCamera) {
                const { status } = yield ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Kamera erişimi gereklidir.' : 'Camera access is required.', type: 'warning' });
                    return;
                }
                const result = yield ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
                if (!result.canceled && result.assets[0]) {
                    setSelectedImage(result.assets[0].uri);
                    setSelectedImageBase64(result.assets[0].base64 || null);
                }
            }
            else {
                const { status } = yield ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    showAlert({ title: isTurkish ? 'İzin Gerekli' : 'Permission Required', message: isTurkish ? 'Galeri erişimi gereklidir.' : 'Gallery access is required.', type: 'warning' });
                    return;
                }
                const result = yield ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7, base64: true });
                if (!result.canceled && result.assets[0]) {
                    setSelectedImage(result.assets[0].uri);
                    setSelectedImageBase64(result.assets[0].base64 || null);
                }
            }
        }
        catch (err) {
            console.warn('Image pick error:', err);
        }
    });
    const sendMessage = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!input.trim() && !selectedImage)
            return;
        const rawInput = input.trim();
        const detectedLanguage = rawInput ? detectMessageLanguage(rawInput, 'auto') : (isTurkish ? 'tr' : 'en');
        const userMsg = {
            id: Date.now().toString(), role: 'user',
            content: rawInput || (isTurkish ? 'Fotoğraf yüklendi - Beslenme programı oluştur' : 'Photo uploaded - Create nutrition plan'),
            timestamp: new Date(),
            imageUri: selectedImage || undefined,
        };
        setMessages(prev => [...prev, userMsg]);
        const userInput = rawInput;
        const imageBase64 = selectedImageBase64;
        setInput('');
        setSelectedImage(null);
        setSelectedImageBase64(null);
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
                        .select('height, weight, gender, fitness_goal, activity_level, dietary_preferences')
                        .eq('id', user.id)
                        .single();
                    if (profile) {
                        contextData = {
                            height: profile.height,
                            weight: profile.weight,
                            gender: profile.gender,
                            goal: profile.fitness_goal,
                            activity_level: profile.activity_level,
                            dietary_preferences: profile.dietary_preferences
                        };
                    }
                }
            }
            catch (e) {
                console.warn('Failed to fetch user context for AI Dietitian:', e);
            }
            // Send to AI
            const response = yield deepseek.generateContent('dietitian', {
                query: userInput
                    ? `${userInput}\n\n${isTurkish ? 'Kullanıcı isterse haftalık/aylık beslenme programı oluştur ve adım adım uygulanışını yaz.' : 'If requested, create a weekly/monthly nutrition program and include practical step-by-step implementation.'}`
                    : (imageBase64 ? (isTurkish ? 'Fotoğrafıma göre bana özel beslenme planı oluştur.' : 'Based on my photo, create a personalized nutrition/diet plan for me.') : ''),
                context: contextData,
                language: detectedLanguage
            }, imageBase64 || undefined);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }]);
            try {
                yield leagueService_1.LeagueService.getInstance().addXP(10, 'ai_chat', 'AI Dietitian interaction');
            }
            catch (_a) { }
        }
        catch (_b) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: isTurkish ? 'Hata oluştu.' : 'Error occurred.', timestamp: new Date() }]);
        }
        finally {
            setLoading(false);
        }
        setTimeout(() => { var _a; return (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true }); }, 100);
    });
    return (<react_native_1.View style={theme_1.COMMON_STYLES.screenContainer}>
      <AlertComponent />
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
            <vector_icons_1.Ionicons name="restaurant" size={24} color={colors.secondary}/>
          </react_native_1.View>
          <react_native_1.View style={{ flex: 1 }}>
            <react_native_1.Text style={styles.headerTitle}>AI {isTurkish ? 'Diyetisyen' : 'Dietitian'}</react_native_1.Text>
            <react_native_1.Text style={styles.headerSub}>{isTurkish ? 'Kişisel beslenme asistanı' : 'Personal nutrition assistant'}</react_native_1.Text>
          </react_native_1.View>
          <PremiumBadge_1.default locked={false} size="md"/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={10}>
        <react_native_1.ScrollView ref={scrollRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => (<react_native_1.View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'ai' && <react_native_1.View style={styles.aiAvatar}><vector_icons_1.Ionicons name="restaurant" size={14} color={colors.secondary}/></react_native_1.View>}
              <react_native_1.View style={[styles.messageContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
                {msg.imageUri && <expo_image_1.Image source={{ uri: msg.imageUri }} style={styles.messageImage} contentFit="cover" cachePolicy="memory-disk" transition={500}/>}
                <react_native_1.Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.aiText]}>{msg.content}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>))}
          {loading && (<react_native_1.View style={styles.loadingWrap}>
              <react_native_1.ActivityIndicator size="small" color={colors.secondary}/>
              <react_native_1.Text style={styles.loadingText}>{isTurkish ? 'Analiz ediliyor...' : 'Analyzing...'}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.ScrollView>

        {selectedImage && (<react_native_1.View style={styles.imagePreview}>
            <expo_image_1.Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="cover" cachePolicy="memory-disk" transition={500}/>
            <react_native_1.TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <vector_icons_1.Ionicons name="close-circle" size={24} color={colors.error}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        {showPhotoOptions && (<react_native_1.View style={styles.photoOptionsOverlay}>
            <react_native_1.View style={styles.photoOptionsContainer}>
              <react_native_1.TouchableOpacity style={styles.photoOption} onPress={() => pickImage(true)}>
                <vector_icons_1.Ionicons name="camera" size={24} color={colors.primary}/>
                <react_native_1.Text style={styles.photoOptionText}>{isTurkish ? 'Kamera' : 'Camera'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.photoOption} onPress={() => pickImage(false)}>
                <vector_icons_1.Ionicons name="images" size={24} color={colors.primary}/>
                <react_native_1.Text style={styles.photoOptionText}>{isTurkish ? 'Galeri' : 'Gallery'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.photoCancel} onPress={() => setShowPhotoOptions(false)}>
                <react_native_1.Text style={styles.photoCancelText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>)}

        <react_native_1.View style={[styles.inputContainer, { marginBottom: react_native_1.Platform.OS === 'ios' ? insets.bottom : 20 }]}>
          <react_native_1.TouchableOpacity style={styles.attachBtn} onPress={() => setShowPhotoOptions(true)}>
            <vector_icons_1.Ionicons name="add-circle" size={28} color={colors.primary}/>
          </react_native_1.TouchableOpacity>
          <react_native_1.TextInput style={styles.input} value={input} onChangeText={setInput} placeholder={isTurkish ? 'Bir şeyler sorun...' : 'Ask something...'} placeholderTextColor={colors.textSecondary} multiline maxLength={500}/>
          <react_native_1.TouchableOpacity style={[styles.sendBtn, (!input.trim() && !selectedImage) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() && !selectedImage || loading}>
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
        backgroundColor: colors.secondary + '20',
        alignItems: 'center', justifyContent: 'center', marginRight: theme_1.SPACING.sm
    },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    headerSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    chatContent: { padding: theme_1.SPACING.md, paddingBottom: 100 },
    messageBubble: {
        maxWidth: '85%', padding: theme_1.SPACING.md, borderRadius: theme_1.BORDER_RADIUS.lg,
        marginBottom: theme_1.SPACING.md, flexDirection: 'row',
    },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 2 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
    aiAvatar: { marginRight: theme_1.SPACING.xs, marginTop: 2 },
    messageContent: { flex: 1 },
    userContent: { flex: 1 },
    aiContent: { flex: 1 },
    messageText: Object.assign({}, theme_1.TYPOGRAPHY.body),
    userText: { color: '#FFF' },
    aiText: { color: colors.text },
    messageImage: { width: '100%', height: 200, borderRadius: theme_1.BORDER_RADIUS.md, marginBottom: theme_1.SPACING.sm },
    loadingWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: theme_1.SPACING.md, marginBottom: theme_1.SPACING.md },
    loadingText: Object.assign({ marginLeft: theme_1.SPACING.xs, color: colors.textSecondary }, theme_1.TYPOGRAPHY.caption),
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: theme_1.SPACING.sm,
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    attachBtn: { padding: theme_1.SPACING.xs, marginRight: theme_1.SPACING.xs },
    input: {
        flex: 1, backgroundColor: colors.background, borderRadius: theme_1.BORDER_RADIUS.pill,
        paddingHorizontal: theme_1.SPACING.md, paddingVertical: theme_1.SPACING.sm,
        color: colors.text, maxHeight: 100,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary,
        alignItems: 'center', justifyContent: 'center', marginLeft: theme_1.SPACING.sm,
    },
    sendBtnDisabled: { backgroundColor: colors.disabled },
    imagePreview: {
        position: 'absolute', bottom: 80, left: theme_1.SPACING.md, width: 100, height: 100,
        borderRadius: theme_1.BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary,
    },
    previewImage: { width: '100%', height: '100%' },
    removeImageBtn: { position: 'absolute', top: 2, right: 2 },
    photoOptionsOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    },
    photoOptionsContainer: {
        backgroundColor: colors.surface, padding: theme_1.SPACING.xl, borderRadius: theme_1.BORDER_RADIUS.xl, width: '80%',
    },
    photoOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme_1.SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    photoOptionText: Object.assign(Object.assign({ marginLeft: theme_1.SPACING.md }, theme_1.TYPOGRAPHY.h3), { color: colors.text }),
    photoCancel: { alignItems: 'center', paddingVertical: theme_1.SPACING.md, marginTop: theme_1.SPACING.sm },
    photoCancelText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: colors.error }),
});
exports.default = AIDietitianScreen;
