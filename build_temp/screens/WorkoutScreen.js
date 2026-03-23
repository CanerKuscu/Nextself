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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const expo_status_bar_1 = require("expo-status-bar");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const SpotifyPlayer_1 = __importDefault(require("../components/SpotifyPlayer"));
const LanguageContext_1 = require("../contexts/LanguageContext");
const ThemeContext_1 = require("../contexts/ThemeContext");
const CustomAlert_1 = require("../components/CustomAlert");
let BodyHighlighter = null;
try {
    BodyHighlighter = require('react-native-body-highlighter').default;
}
catch (_a) {
    BodyHighlighter = null;
}
const MUSCLE_TO_BODY = {
    chest: ['chest'], lats: ['upper-back'], shoulders: ['deltoids'],
    biceps: ['biceps'], triceps: ['triceps'], forearms: ['forearm'],
    abdominals: ['abs'], quadriceps: ['quadriceps'], hamstrings: ['hamstring'],
    glutes: ['gluteal'], calves: ['calves'], traps: ['trapezius'],
    'middle back': ['upper-back'], 'lower back': ['lower-back'],
};
// Workout type categories (STRENGTH / CALISTHENICS / CARDIO)
const WORKOUT_TYPES = [
    { id: 'strength', txKey: 'weightTraining', icon: 'barbell', gradient: ['#FF6B6B', '#FF9600'] },
    { id: 'calisthenics', txKey: 'calisthenics', icon: 'body', gradient: ['#667eea', '#764ba2'] },
    { id: 'cardio', txKey: 'cardio', icon: 'heart', gradient: ['#38ef7d', '#11998e'] },
];
// DB muscle_group values
const MUSCLE_GROUPS = [
    { id: 'chest', icon: 'fitness', txKey: 'chest', color: '#FF6B6B' },
    { id: 'lats', icon: 'expand', txKey: 'lats', color: '#1CB0F6' },
    { id: 'shoulders', icon: 'barbell', txKey: 'shoulders', color: '#FF9600' },
    { id: 'biceps', icon: 'hand-left', txKey: 'biceps', color: '#CE82FF' },
    { id: 'triceps', icon: 'hand-right', txKey: 'triceps', color: '#f093fb' },
    { id: 'forearms', icon: 'hand-left', txKey: 'forearms', color: '#89f7fe' },
    { id: 'abdominals', icon: 'disc', txKey: 'abs', color: '#38ef7d' },
    { id: 'quadriceps', icon: 'walk', txKey: 'quads', color: '#667eea' },
    { id: 'hamstrings', icon: 'walk', txKey: 'hamstrings', color: '#FFC800' },
    { id: 'glutes', icon: 'fitness', txKey: 'glutes', color: '#FF4B4B' },
    { id: 'calves', icon: 'footsteps', txKey: 'calves', color: '#58CC02' },
    { id: 'traps', icon: 'triangle', txKey: 'traps', color: '#764ba2' },
    { id: 'middle back', icon: 'body', txKey: 'middle_back', color: '#11998e' },
    { id: 'lower back', icon: 'body', txKey: 'lower_back', color: '#f5576c' },
];
const WorkoutScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const st = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const { width } = (0, react_native_1.useWindowDimensions)();
    const [selectedType, setSelectedType] = (0, react_1.useState)('strength');
    const [selectedMuscle, setSelectedMuscle] = (0, react_1.useState)(null);
    const [showFront, setShowFront] = (0, react_1.useState)(true);
    const [bodyGender, setBodyGender] = (0, react_1.useState)('male');
    const { t, language } = (0, LanguageContext_1.useLanguage)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const { AlertComponent } = (0, CustomAlert_1.useAlert)();
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        return () => fadeAnim.stopAnimation();
    }, []);
    const getHighlightedMuscles = () => {
        if (!selectedMuscle)
            return [];
        return (MUSCLE_TO_BODY[selectedMuscle] || []).map(slug => ({ slug, intensity: 2 }));
    };
    const onMusclePress = (muscle) => {
        setSelectedMuscle(selectedMuscle === muscle.id ? null : muscle.id);
    };
    const confirmAndNavigate = () => {
        if (!selectedMuscle)
            return;
        const muscle = MUSCLE_GROUPS.find(m => m.id === selectedMuscle);
        if (!muscle)
            return;
        navigation.navigate('MuscleExercises', {
            muscleGroup: muscle.id,
            workoutType: selectedType,
            muscleName: t(muscle.txKey),
        });
    };
    const selectedMuscleInfo = MUSCLE_GROUPS.find(m => m.id === selectedMuscle);
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <expo_status_bar_1.StatusBar style={isDark ? 'light' : 'dark'} translucent={false}/>
      <AlertComponent />
      <react_native_1.ScrollView contentContainerStyle={[st.scroll]} showsVerticalScrollIndicator={false}>
        <react_native_1.Animated.View style={{ opacity: fadeAnim }}>
          <react_native_1.View style={st.headerRow}>
            <react_native_1.Text style={st.headerTitle}>{t('workout')}</react_native_1.Text>
          </react_native_1.View>

          {/* Spotify */}
          <react_native_1.View style={{ marginBottom: 16 }}><SpotifyPlayer_1.default /></react_native_1.View>

          {/* WORKOUT TYPE: Strength / Calisthenics / Cardio */}
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.typeScroll}>
            {WORKOUT_TYPES.map(type => {
            const active = selectedType === type.id;
            return (<react_native_1.TouchableOpacity key={type.id} activeOpacity={0.85} onPress={() => setSelectedType(type.id)}>
                  <expo_linear_gradient_1.LinearGradient colors={active ? [...type.gradient] : ['#F5F5F5', '#F5F5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.typeCard, active && st.typeCardActive]}>
                    <vector_icons_1.Ionicons name={type.icon} size={22} color={active ? colors.background : '#6B7280'}/>
                    <react_native_1.Text style={[st.typeLabel, active && st.typeLabelActive]}>{t(type.txKey)}</react_native_1.Text>
                  </expo_linear_gradient_1.LinearGradient>
                </react_native_1.TouchableOpacity>);
        })}
          </react_native_1.ScrollView>

          {/* MAIN CONTENT AREA */}
          {selectedType === 'cardio' ? (<react_native_1.View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
              <react_native_1.View style={{ width: 100, height: 100, borderRadius: 30, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <vector_icons_1.Ionicons name="heart" size={50} color="#58CC02"/>
              </react_native_1.View>
              <react_native_1.Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
                {t('cardio_workouts')}
              </react_native_1.Text>
              <react_native_1.Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginBottom: 32 }}>
                {t('cardio_desc')}
              </react_native_1.Text>

              <react_native_1.TouchableOpacity activeOpacity={0.85} style={{ width: '100%' }} onPress={() => navigation.navigate('MuscleExercises', {
                muscleGroup: '',
                category: 'all', // Don't filter by category 'cardio' which might not exist in DB columns
                workoutType: 'cardio', // This triggers the smart search in SupabaseService
                muscleName: t('cardio')
            })}>
                <expo_linear_gradient_1.LinearGradient colors={['#38ef7d', '#11998e']} style={st.confirmBtn}>
                  <vector_icons_1.Ionicons name="flame" size={20} color={colors.background}/>
                  <react_native_1.Text style={st.confirmText}>
                    {t('start_cardio')}
                  </react_native_1.Text>
                </expo_linear_gradient_1.LinearGradient>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>) : (<>
              {/* Gender/Front-Back Toggle */}
              <react_native_1.View style={st.toggleRow}>
                <react_native_1.Text style={st.sectionTitle}>{t('selectMuscleGroup')}</react_native_1.Text>
                <react_native_1.View style={{ flexDirection: 'row', gap: 6 }}>
                  <react_native_1.TouchableOpacity onPress={() => setBodyGender(g => g === 'male' ? 'female' : 'male')} style={st.toggleBtn}>
                    <vector_icons_1.Ionicons name={bodyGender === 'male' ? 'male' : 'female'} size={14} color="#58CC02"/>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity onPress={() => setShowFront(!showFront)} style={st.toggleBtn}>
                    <vector_icons_1.Ionicons name="sync" size={14} color="#58CC02"/>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </react_native_1.View>

              {/* BODY + MUSCLES SIDE-BY-SIDE */}
              <react_native_1.View style={st.bodyRow}>
                <react_native_1.View style={[st.bodyCol, { width: width * 0.42 }]}>
                  {BodyHighlighter ? (<BodyHighlighter data={getHighlightedMuscles()} gender={bodyGender} side={showFront ? 'front' : 'back'} scale={0.85} colors={['#58CC02', '#FF4B4B']}/>) : (<react_native_1.View style={st.bodyPlaceholder}>
                      <vector_icons_1.Ionicons name="body" size={80} color="#58CC02"/>
                    </react_native_1.View>)}
                </react_native_1.View>

                <react_native_1.View style={st.muscleCol}>
                  <react_native_1.ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {MUSCLE_GROUPS.map(m => {
                const isSelected = selectedMuscle === m.id;
                return (<react_native_1.TouchableOpacity key={m.id} style={[st.muscleBtn, isSelected && { backgroundColor: m.color + '15', borderColor: m.color }]} onPress={() => onMusclePress(m)} activeOpacity={0.7}>
                          <react_native_1.View style={[st.muscleDot, { backgroundColor: m.color }]}/>
                          <react_native_1.Text style={[st.muscleBtnText, isSelected && { color: m.color, fontWeight: '700' }]}>{t(m.txKey)}</react_native_1.Text>
                          {isSelected ? (<vector_icons_1.Ionicons name="checkmark-circle" size={18} color={m.color}/>) : (<vector_icons_1.Ionicons name="chevron-forward" size={14} color="#D1D5DB"/>)}
                        </react_native_1.TouchableOpacity>);
            })}
                  </react_native_1.ScrollView>
                </react_native_1.View>
              </react_native_1.View>

              {selectedMuscle && selectedMuscleInfo && (<react_native_1.TouchableOpacity activeOpacity={0.85} onPress={confirmAndNavigate} style={{ marginTop: 16 }}>
                  <expo_linear_gradient_1.LinearGradient colors={[selectedMuscleInfo.color, selectedMuscleInfo.color + 'CC']} style={st.confirmBtn}>
                    <vector_icons_1.Ionicons name="arrow-forward" size={20} color={colors.background}/>
                    <react_native_1.Text style={st.confirmText}>
                      {t('view_exercises', { muscle: t(selectedMuscleInfo.txKey) })}
                    </react_native_1.Text>
                  </expo_linear_gradient_1.LinearGradient>
                </react_native_1.TouchableOpacity>)}
            </>)}

          <react_native_1.View style={{ height: 120 }}/>
        </react_native_1.Animated.View>
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
    headerTitle: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    typeScroll: { gap: 10, marginBottom: 20, paddingRight: 12 },
    typeCard: { paddingHorizontal: 18, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E5E5' },
    typeCardActive: { borderColor: 'transparent', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    typeLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    typeLabelActive: { color: colors.background },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    toggleBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E8FFE0', justifyContent: 'center', alignItems: 'center' },
    bodyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    bodyCol: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#F0F0F0' },
    bodyPlaceholder: { alignItems: 'center', justifyContent: 'center', height: 280 },
    muscleCol: { flex: 1, maxHeight: 380 },
    muscleBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
        marginBottom: 6, borderWidth: 1.5, borderColor: '#F0F0F0',
    },
    muscleDot: { width: 8, height: 8, borderRadius: 4 },
    muscleBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
    confirmBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 18, paddingVertical: 16,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    confirmText: { fontSize: 16, fontWeight: '800', color: colors.background },
});
exports.default = WorkoutScreen;
