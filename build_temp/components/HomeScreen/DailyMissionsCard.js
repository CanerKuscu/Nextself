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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const ThemeContext_1 = require("../../contexts/ThemeContext");
const useTranslation_1 = require("../../hooks/useTranslation");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const CATEGORY_META = {
    workout: { icon: 'barbell', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF4757'] },
    nutrition: { icon: 'restaurant', color: '#58CC02', gradient: ['#58CC02', '#46A302'] },
    health: { icon: 'heart', color: '#1CB0F6', gradient: ['#1CB0F6', '#0099DD'] },
    social: { icon: 'people', color: '#CE82FF', gradient: ['#CE82FF', '#A855F7'] },
    streak: { icon: 'flame', color: '#FF9600', gradient: ['#FF9600', '#FF6B00'] },
    mindfulness: { icon: 'leaf', color: '#7C3AED', gradient: ['#7C3AED', '#6D28D9'] },
    hydration: { icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
    supplements: { icon: 'flask', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
};
const DailyMissionsCard = (0, react_1.memo)(({ missions, onMissionPress }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const { isTurkish, t } = (0, useTranslation_1.useTranslation)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    if (!missions || missions.length === 0) {
        return null;
    }
    const completedCount = missions.filter(m => m.isCompleted).length;
    const progress = (completedCount / missions.length) * 100;
    return (<react_native_1.View style={styles.card}>
      <react_native_1.View style={styles.cardHeader}>
        <react_native_1.Text style={styles.cardTitle}>{t('daily_missions')}</react_native_1.Text>
        <react_native_1.View style={styles.progressBadge}>
          <react_native_1.Text style={styles.progressText}>{completedCount}/{missions.length}</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {/* Progress Bar */}
      <react_native_1.View style={styles.progressBar}>
        <react_native_1.View style={[styles.progressFill, { width: `${progress}%` }]}/>
      </react_native_1.View>

      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsScroll}>
        {missions.map((mission) => {
            const meta = CATEGORY_META[mission.category] || CATEGORY_META.workout;
            return (<react_native_1.TouchableOpacity key={mission.id} style={[
                    styles.missionItem,
                    mission.isCompleted && styles.completedMission
                ]} onPress={() => onMissionPress(mission)} disabled={mission.isCompleted}>
              <react_native_1.View style={styles.missionHeader}>
                <expo_linear_gradient_1.LinearGradient colors={meta.gradient} style={[
                    styles.missionIcon,
                    mission.isCompleted && styles.completedIcon
                ]}>
                  <vector_icons_1.Ionicons name={meta.icon} size={16} color="#FFFFFF"/>
                </expo_linear_gradient_1.LinearGradient>
                <react_native_1.Text style={[
                    styles.missionPoints,
                    mission.isCompleted && styles.completedPoints
                ]}>
                  +{mission.pointReward}
                </react_native_1.Text>
              </react_native_1.View>

              <react_native_1.Text style={[
                    styles.missionTitle,
                    mission.isCompleted && styles.completedTitle
                ]} numberOfLines={2}>
                {isTurkish ? (mission.titleTr || mission.title) : mission.title}
              </react_native_1.Text>

              {mission.isCompleted && (<react_native_1.View style={styles.completedBadge}>
                  <vector_icons_1.Ionicons name="checkmark" size={12} color="#FFFFFF"/>
                  <react_native_1.Text style={styles.completedBadgeText}>{t('done')}</react_native_1.Text>
                </react_native_1.View>)}
            </react_native_1.TouchableOpacity>);
        })}
      </react_native_1.ScrollView>
    </react_native_1.View>);
});
// Removed getMissionIcon function as it's replaced by CATEGORY_META
const getStyles = (colors) => react_native_1.StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    progressBadge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.background,
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    missionsScroll: {
        gap: 12,
    },
    missionItem: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        width: 140,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        opacity: 1,
    },
    completedMission: {
        opacity: 0.7,
        backgroundColor: colors.background + '80',
    },
    missionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    missionIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedIcon: {
        backgroundColor: colors.primary,
    },
    missionPoints: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    completedPoints: {
        color: colors.text + '60',
    },
    missionTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text,
        flex: 1,
        lineHeight: 16,
    },
    completedTitle: {
        color: colors.text + '60',
        textDecorationLine: 'line-through',
    },
    completedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    completedBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '500',
    },
});
exports.default = DailyMissionsCard;
