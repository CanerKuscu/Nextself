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
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const GradientButton_1 = __importDefault(require("../components/GradientButton"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const CustomAlert_1 = require("../components/CustomAlert");
const ratingService_1 = require("../services/ratingService");
const SupabaseContext_1 = require("../contexts/SupabaseContext");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const RatingScreen = ({ route, navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { professionalId, professionalName, professionalType } = (route === null || route === void 0 ? void 0 : route.params) || {};
    const [rating, setRating] = (0, react_1.useState)(0);
    const [comment, setComment] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const { user } = (0, SupabaseContext_1.useSupabaseAuth)();
    const handleSubmit = () => __awaiter(void 0, void 0, void 0, function* () {
        if (rating === 0) {
            showAlert({ type: 'warning', title: isTurkish ? 'Uyarı' : 'Warning', message: isTurkish ? 'Lütfen puan verin' : 'Please give a rating', buttons: [{ text: 'OK' }] });
            return;
        }
        setLoading(true);
        try {
            const ratingService = ratingService_1.RatingService.getInstance();
            yield ratingService.createRating({
                userId: user === null || user === void 0 ? void 0 : user.id,
                professionalId,
                professionalType: professionalType || 'trainer',
                rating,
                review: comment,
                verified: false,
                helpfulCount: 0,
            });
            setLoading(false);
            showAlert({
                type: 'success',
                title: isTurkish ? 'Teşekkürler' : 'Thank You',
                message: isTurkish ? 'Değerlendirmeniz kaydedildi!' : 'Your review has been saved!',
                buttons: [{ text: 'OK', onPress: () => (0, navigation_1.safeGoBack)(navigation, 'Home') }],
            });
        }
        catch (err) {
            setLoading(false);
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Değerlendirme gönderilemedi. Lütfen tekrar deneyin.' : 'Failed to submit rating. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
    });
    return (<react_native_1.View style={styles.container}>
      <AlertComponent />
      <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + theme_1.SPACING.xl }]}>
        <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Değerlendir' : 'Rate'}</react_native_1.Text>
        <react_native_1.Text style={styles.headerSub}>{professionalName || ''}</react_native_1.Text>
      </expo_linear_gradient_1.LinearGradient>

      <react_native_1.View style={styles.content}>
        <GlassCard_1.default elevated style={styles.ratingCard}>
          <react_native_1.Text style={styles.ratingLabel}>{isTurkish ? 'Puanınız' : 'Your Rating'}</react_native_1.Text>
          <react_native_1.View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (<react_native_1.TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.6}>
                <vector_icons_1.Ionicons name={star <= rating ? 'star' : 'star-outline'} size={44} color={star <= rating ? colors.accent : colors.textTertiary}/>
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>
          <react_native_1.Text style={styles.ratingValue}>{rating > 0 ? `${rating}/5` : ''}</react_native_1.Text>
        </GlassCard_1.default>

        <react_native_1.Text style={styles.label}>{isTurkish ? 'Yorum (opsiyonel)' : 'Comment (optional)'}</react_native_1.Text>
        <react_native_1.TextInput style={styles.commentInput} placeholder={isTurkish ? 'Deneyiminizi paylaşın...' : 'Share your experience...'} placeholderTextColor={colors.textTertiary} value={comment} onChangeText={setComment} multiline numberOfLines={4} textAlignVertical="top"/>

        <GradientButton_1.default title={isTurkish ? 'Gönder' : 'Submit'} onPress={handleSubmit} loading={loading} size="lg" gradient={theme_1.GRADIENTS.accent} style={{ marginTop: theme_1.SPACING.xxl }}/>
      </react_native_1.View>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: theme_1.SPACING.xxl, paddingHorizontal: theme_1.SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.textInverse }),
    headerSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: 'rgba(255,255,255,0.8)', marginTop: theme_1.SPACING.xs }),
    content: { paddingHorizontal: theme_1.SPACING.xxl, paddingTop: theme_1.SPACING.xxl },
    ratingCard: { alignItems: 'center', paddingVertical: theme_1.SPACING.xxl },
    ratingLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginBottom: theme_1.SPACING.lg }),
    starsRow: { flexDirection: 'row', gap: theme_1.SPACING.sm },
    ratingValue: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.accent, marginTop: theme_1.SPACING.md }),
    label: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text, marginTop: theme_1.SPACING.xxl, marginBottom: theme_1.SPACING.sm }),
    commentInput: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.text, backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, padding: theme_1.SPACING.md, minHeight: 100 }),
});
exports.default = RatingScreen;
