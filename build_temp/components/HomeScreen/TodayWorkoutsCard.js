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
const TodayWorkoutsCard = (0, react_1.memo)(({ workouts, onWorkoutPress }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const renderItem = (0, react_1.useCallback)(({ item: workout }) => (<react_native_1.TouchableOpacity style={styles.workoutItem} onPress={() => onWorkoutPress(workout)} accessible={true} accessibilityRole="button" accessibilityLabel={`${workout.type} workout: ${workout.name}. Duration: ${workout.duration || 'N/A'} minutes.`} accessibilityHint="Double tap to view workout details">
      <react_native_1.View style={styles.workoutHeader}>
        <vector_icons_1.Ionicons name={getWorkoutIcon(workout.type)} size={20} color={colors.primary} importantForAccessibility="no-hide-descendants"/>
        <react_native_1.Text style={styles.workoutType}>{workout.type}</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.Text style={styles.workoutName} numberOfLines={2}>
        {workout.name}
      </react_native_1.Text>

      <react_native_1.View style={styles.workoutFooter}>
        <react_native_1.Text style={styles.workoutDuration}>{workout.duration || 'N/A'} min</react_native_1.Text>
        <react_native_1.Text style={styles.workoutCalories}>{workout.calories || 0} cal</react_native_1.Text>
      </react_native_1.View>

      {workout.completed && (<react_native_1.View style={styles.completedBadge}>
          <vector_icons_1.Ionicons name="checkmark-circle" size={16} color="#10B981"/>
          <react_native_1.Text style={styles.completedText}>Done</react_native_1.Text>
        </react_native_1.View>)}
    </react_native_1.TouchableOpacity>), [colors, onWorkoutPress, styles]);
    if (!workouts || workouts.length === 0) {
        return (<react_native_1.View style={styles.card}>
        <react_native_1.View style={styles.cardHeader}>
          <react_native_1.Text style={styles.cardTitle}>Today's Workouts</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.emptyState}>
          <vector_icons_1.Ionicons name="fitness" size={48} color={colors.text + '40'} importantForAccessibility="no-hide-descendants"/>
          <react_native_1.Text style={styles.emptyText}>No workouts today</react_native_1.Text>
          <react_native_1.Text style={styles.emptySubtext}>Start your fitness journey!</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.card}>
      <react_native_1.View style={styles.cardHeader}>
        <react_native_1.Text style={styles.cardTitle}>Today's Workouts</react_native_1.Text>
        <react_native_1.Text style={styles.workoutCount}>{workouts.length} workouts</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.FlatList data={workouts} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workoutScroll} decelerationRate="fast" snapToInterval={172} // width (160) + marginRight (12)
     snapToAlignment="start"/>
    </react_native_1.View>);
});
function getWorkoutIcon(type) {
    switch (type === null || type === void 0 ? void 0 : type.toLowerCase()) {
        case 'cardio': return 'walk';
        case 'strength': return 'barbell';
        case 'flexibility': return 'body';
        case 'sports': return 'basketball';
        default: return 'fitness';
    }
}
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
    workoutCount: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    workoutScroll: {
        gap: 12,
    },
    workoutItem: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        width: 160,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    workoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    workoutType: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    workoutName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        flex: 1,
    },
    workoutFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workoutDuration: {
        fontSize: 12,
        color: colors.text + '80',
    },
    workoutCalories: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    completedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B98120',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    completedText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.text + '60',
        marginTop: 4,
    },
});
exports.default = TodayWorkoutsCard;
