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
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_status_bar_1 = require("expo-status-bar");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const supabase_1 = require("../services/supabase");
const CustomAlert_1 = require("../components/CustomAlert");
const { width } = react_native_1.Dimensions.get('window');
const getDifficultyColor = (d) => {
    if (d === 'beginner')
        return '#58CC02';
    if (d === 'intermediate')
        return '#FF9600';
    if (d === 'advanced')
        return '#FF4B4B';
    return '#AFAFBF';
};
const ExerciseDetailScreen = ({ navigation, route }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { exercise } = route.params;
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(30)).current;
    const [showAllInstructions, setShowAllInstructions] = (0, react_1.useState)(false);
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            react_native_1.Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
    }, []);
    const dc = getDifficultyColor(exercise.difficulty);
    const name = exercise.name; // Always display English name per language rules
    const description = isTurkish && exercise.description_tr ? exercise.description_tr : exercise.description;
    const muscleGroup = isTurkish && exercise.muscle_group_tr ? exercise.muscle_group_tr : exercise.muscle_group;
    const instructions = isTurkish && exercise.instructions_tr ? exercise.instructions_tr : exercise.instructions;
    const tips = isTurkish && exercise.tips_tr ? exercise.tips_tr : exercise.tips;
    const equipment = exercise.equipment || (isTurkish ? 'Ekipman yok' : 'No equipment');
    const difficultyLabel = exercise.difficulty === 'beginner'
        ? (isTurkish ? 'Başlangıç' : 'Beginner')
        : exercise.difficulty === 'intermediate'
            ? (isTurkish ? 'Orta' : 'Intermediate')
            : exercise.difficulty === 'advanced'
                ? (isTurkish ? 'İleri' : 'Advanced')
                : exercise.difficulty;
    const instructionList = Array.isArray(instructions) ? instructions : (instructions || '').split('\n').filter(Boolean);
    const tipList = Array.isArray(tips) ? tips : (tips || '').split('\n').filter(Boolean);
    const visibleInstructions = showAllInstructions ? instructionList : instructionList.slice(0, 4);
    const handleAddToProgram = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add this to your program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }
            const equipmentLower = String(exercise.equipment || '').toLowerCase();
            const nameLower = String(name || '').toLowerCase();
            const isCalisthenics = equipmentLower.includes('body') || equipmentLower.includes('none');
            const isCardio = ['cardio', 'run', 'koş', 'jump', 'zıpla', 'bike', 'bisiklet', 'rope', 'ip'].some((k) => nameLower.includes(k) || equipmentLower.includes(k));
            const recommendationLine = isCardio
                ? `${isTurkish ? 'Öneri' : 'Recommendation'}: ${isTurkish ? '25-40 dk orta-yoğun kardiyo' : '25-40 min moderate-vigorous cardio'}`
                : isCalisthenics
                    ? `${isTurkish ? 'Öneri' : 'Recommendation'}: ${exercise.difficulty === 'beginner' ? '3 x 8-12' : exercise.difficulty === 'intermediate' ? '4 x 10-15' : '4-5 x 12-20'}`
                    : `${isTurkish ? 'Öneri' : 'Recommendation'}: ${exercise.difficulty === 'beginner' ? '3 x 12-15' : exercise.difficulty === 'intermediate' ? '4 x 8-12' : '4-5 x 6-8'} (${isTurkish ? 'ağırlık eklenebilir' : 'load can be increased progressively'})`;
            const content = [
                `${isTurkish ? 'Egzersiz' : 'Exercise'}: ${name}`,
                `${isTurkish ? 'Kas grubu' : 'Muscle group'}: ${muscleGroup}`,
                `${isTurkish ? 'Zorluk' : 'Difficulty'}: ${difficultyLabel}`,
                recommendationLine,
            ].join('\n');
            const { error } = yield supabase.createAiProgram({
                userId: user.id,
                type: 'workout',
                title: `${name} ${isTurkish ? 'Programı' : 'Program'}`,
                content,
            });
            if (error)
                throw error;
            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? `${name} programına eklendi.` : `${name} has been added to your program.`,
                buttons: [{ text: 'OK' }],
            });
        }
        catch (_a) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Programa eklenemedi. Lütfen tekrar deneyin.' : 'Failed to add to program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
    });
    return (<react_native_1.View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
            <expo_status_bar_1.StatusBar style={isDark ? 'light' : 'dark'} translucent={false}/>
            <AlertComponent />
            {/* Hero Header */}
            <react_native_1.View style={[styles.heroWrap, { marginTop: insets.top }]}>
                {exercise.image_url ? (<react_native_1.Image source={{ uri: exercise.image_url }} style={styles.heroImage} resizeMode="cover"/>) : (<expo_linear_gradient_1.LinearGradient colors={[dc + '30', dc + '10']} style={styles.heroPlaceholder}>
                        <vector_icons_1.Ionicons name="fitness" size={80} color={dc}/>
                    </expo_linear_gradient_1.LinearGradient>)}
                <expo_linear_gradient_1.LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.heroOverlay}>
                    <react_native_1.View style={[styles.headerBtns, { paddingTop: 8 }]}>
                        <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'MuscleExercises')} style={styles.backBtn}>
                            <vector_icons_1.Ionicons name="arrow-back" size={22} color={colors.background}/>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                    <react_native_1.View style={styles.heroContent}>
                        <react_native_1.Text style={styles.heroTitle}>{name}</react_native_1.Text>
                        <react_native_1.View style={styles.heroMeta}>
                            <react_native_1.View style={[styles.badge, { backgroundColor: dc + '30' }]}>
                                <react_native_1.View style={[styles.badgeDot, { backgroundColor: dc }]}/>
                                <react_native_1.Text style={[styles.badgeText, { color: dc }]}>{difficultyLabel}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.badge}>
                                <vector_icons_1.Ionicons name="body-outline" size={12} color={colors.background}/>
                                <react_native_1.Text style={styles.badgeText}>{muscleGroup}</react_native_1.Text>
                            </react_native_1.View>
                            {exercise.calories_per_minute ? (<react_native_1.View style={styles.badge}>
                                    <vector_icons_1.Ionicons name="flame" size={12} color="#FF6B6B"/>
                                    <react_native_1.Text style={styles.badgeText}>{exercise.calories_per_minute} cal/min</react_native_1.Text>
                                </react_native_1.View>) : null}
                        </react_native_1.View>
                    </react_native_1.View>
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.View>

            <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <react_native_1.Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Description */}
                    {description ? (<GlassCard_1.default style={styles.card}>
                            <react_native_1.Text style={styles.cardTitle}>{isTurkish ? 'Açıklama' : 'Description'}</react_native_1.Text>
                            <react_native_1.Text style={styles.descText}>{description}</react_native_1.Text>
                        </GlassCard_1.default>) : null}

                    {/* Quick Stats */}
                    <react_native_1.View style={styles.statsRow}>
                        <react_native_1.View style={[styles.statCard, { backgroundColor: '#FFF5F0' }]}>
                            <vector_icons_1.Ionicons name="barbell-outline" size={20} color="#FF9600"/>
                            <react_native_1.Text style={styles.statValue}>{equipment}</react_native_1.Text>
                            <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Ekipman' : 'Equipment'}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={[styles.statCard, { backgroundColor: '#F0FFF4' }]}>
                            <vector_icons_1.Ionicons name="body-outline" size={20} color="#58CC02"/>
                            <react_native_1.Text style={styles.statValue}>{muscleGroup}</react_native_1.Text>
                            <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'Kas Grubu' : 'Muscle'}</react_native_1.Text>
                        </react_native_1.View>
                        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (<react_native_1.View style={[styles.statCard, { backgroundColor: '#F0F0FF' }]}>
                                <vector_icons_1.Ionicons name="git-branch-outline" size={20} color="#CE82FF"/>
                                <react_native_1.Text style={styles.statValue} numberOfLines={1}>
                                    {Array.isArray(exercise.secondary_muscles) ? exercise.secondary_muscles.join(', ') : exercise.secondary_muscles}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.statLabel}>{isTurkish ? 'İkincil' : 'Secondary'}</react_native_1.Text>
                            </react_native_1.View>)}
                    </react_native_1.View>

                    {/* Instructions */}
                    {instructionList.length > 0 && (<GlassCard_1.default style={styles.card}>
                            <react_native_1.Text style={styles.cardTitle}>{isTurkish ? 'Nasıl Yapılır' : 'How to Perform'}</react_native_1.Text>
                            {visibleInstructions.map((step, idx) => (<react_native_1.View key={idx} style={styles.stepRow}>
                                    <react_native_1.View style={styles.stepNumber}>
                                        <react_native_1.Text style={styles.stepNumText}>{idx + 1}</react_native_1.Text>
                                    </react_native_1.View>
                                    <react_native_1.Text style={styles.stepText}>{step}</react_native_1.Text>
                                </react_native_1.View>))}
                            {instructionList.length > 4 && (<react_native_1.TouchableOpacity onPress={() => setShowAllInstructions(!showAllInstructions)} style={styles.showMore}>
                                    <react_native_1.Text style={styles.showMoreText}>
                                        {showAllInstructions
                    ? (isTurkish ? 'Daha az göster' : 'Show less')
                    : (isTurkish ? `Tümünü göster (${instructionList.length})` : `Show all (${instructionList.length})`)}
                                    </react_native_1.Text>
                                    <vector_icons_1.Ionicons name={showAllInstructions ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary}/>
                                </react_native_1.TouchableOpacity>)}
                        </GlassCard_1.default>)}

                    {/* Tips */}
                    {tipList.length > 0 && (<GlassCard_1.default style={styles.card}>
                            <react_native_1.Text style={styles.cardTitle}>{isTurkish ? 'İpuçları' : 'Pro Tips'}</react_native_1.Text>
                            {tipList.map((tip, idx) => (<react_native_1.View key={idx} style={styles.tipRow}>
                                    <vector_icons_1.Ionicons name="checkmark-circle" size={16} color={colors.primary}/>
                                    <react_native_1.Text style={styles.tipText}>{tip}</react_native_1.Text>
                                </react_native_1.View>))}
                        </GlassCard_1.default>)}

                    {/* Sets & Reps Recommendation */}
                    <GlassCard_1.default style={styles.card}>
                        <react_native_1.Text style={styles.cardTitle}>{isTurkish ? 'Önerilen Tekrar Aralığı' : 'Recommended Sets & Reps'}</react_native_1.Text>
                        <react_native_1.View style={styles.recGrid}>
                            <react_native_1.View style={styles.recCard}>
                                <react_native_1.Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '3' : exercise.difficulty === 'intermediate' ? '4' : '4-5'}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.recLabel}>{isTurkish ? 'Set' : 'Sets'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.recCard}>
                                <react_native_1.Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '12-15' : exercise.difficulty === 'intermediate' ? '8-12' : '6-8'}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.recLabel}>{isTurkish ? 'Tekrar' : 'Reps'}</react_native_1.Text>
                            </react_native_1.View>
                            <react_native_1.View style={styles.recCard}>
                                <react_native_1.Text style={styles.recValue}>
                                    {exercise.difficulty === 'beginner' ? '60s' : exercise.difficulty === 'intermediate' ? '90s' : '120s'}
                                </react_native_1.Text>
                                <react_native_1.Text style={styles.recLabel}>{isTurkish ? 'Dinlenme' : 'Rest'}</react_native_1.Text>
                            </react_native_1.View>
                        </react_native_1.View>
                    </GlassCard_1.default>

                    {/* Add Program Button */}
                    <react_native_1.TouchableOpacity activeOpacity={0.85} onPress={handleAddToProgram}>
                        <expo_linear_gradient_1.LinearGradient colors={[dc, dc + 'CC']} style={styles.startBtn}>
                            <vector_icons_1.Ionicons name="add-circle" size={20} color={colors.background}/>
                            <react_native_1.Text style={styles.startBtnText}>{isTurkish ? 'Programa Ekle' : 'Add to Program'}</react_native_1.Text>
                        </expo_linear_gradient_1.LinearGradient>
                    </react_native_1.TouchableOpacity>

                    <react_native_1.View style={{ height: 40 }}/>
                </react_native_1.Animated.View>
            </react_native_1.ScrollView>
        </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    heroWrap: { height: 280, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    heroOverlay: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'space-between' }),
    headerBtns: { flexDirection: 'row', paddingHorizontal: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    heroContent: { paddingHorizontal: 20, paddingBottom: 20 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: colors.background, marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
    heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: { fontSize: 11, fontWeight: '600', color: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    card: { padding: theme_1.SPACING.lg, marginBottom: theme_1.SPACING.md },
    cardTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginBottom: theme_1.SPACING.md }),
    descText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, lineHeight: 22 }),
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: theme_1.SPACING.md },
    statCard: { flex: 1, borderRadius: theme_1.BORDER_RADIUS.lg, padding: 14, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
    statLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
    stepNumText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    stepText: Object.assign(Object.assign({ flex: 1 }, theme_1.TYPOGRAPHY.body), { color: colors.text, lineHeight: 22 }),
    showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 8 },
    showMoreText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: colors.primary }),
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    tipText: Object.assign(Object.assign({ flex: 1 }, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, lineHeight: 20 }),
    recGrid: { flexDirection: 'row', gap: 12 },
    recCard: { flex: 1, backgroundColor: colors.surface, borderRadius: theme_1.BORDER_RADIUS.md, padding: 14, alignItems: 'center' },
    recValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
    recLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 18, paddingVertical: 16, marginTop: theme_1.SPACING.md,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    startBtnText: { fontSize: 16, fontWeight: '800', color: colors.background },
});
exports.default = ExerciseDetailScreen;
