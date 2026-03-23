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
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const ThemeContext_1 = require("../../contexts/ThemeContext");
const useTranslation_1 = require("../../hooks/useTranslation");
const HealthInsightCard = (0, react_1.memo)(({ insights, refreshing, onRefresh }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    if (!insights || insights.length === 0) {
        return null;
    }
    return (<react_native_1.View style={styles.card}>
      <react_native_1.View style={styles.cardHeader}>
        <react_native_1.Text style={styles.cardTitle}>{isTurkish ? 'Sağlık Öngörüleri' : 'Health Insights'}</react_native_1.Text>
        <react_native_1.TouchableOpacity onPress={onRefresh} style={styles.refreshButton} disabled={refreshing}>
          <vector_icons_1.Ionicons name="refresh" size={20} color={colors.primary} style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <react_native_1.View style={styles.insightsContainer}>
        {insights.map((insight, index) => (<react_native_1.View key={index} style={styles.insightItem}>
            <vector_icons_1.Ionicons name={getInsightIcon(insight.type)} size={16} color={getInsightColor(insight.type)}/>
            <react_native_1.Text style={styles.insightText}>
              {isTurkish ? (insight.message_tr || insight.message) : (insight.message_en || insight.message)}
            </react_native_1.Text>
          </react_native_1.View>))}
      </react_native_1.View>
    </react_native_1.View>);
});
function getInsightIcon(type) {
    switch (type) {
        case 'steps': return 'walk';
        case 'heart':
        case 'heart_rate': return 'heart';
        case 'sleep': return 'moon';
        case 'weight': return 'scale';
        default: return 'information-circle';
    }
}
function getInsightColor(type) {
    switch (type) {
        case 'steps': return '#10B981';
        case 'heart':
        case 'heart_rate': return '#EF4444';
        case 'sleep': return '#6366F1';
        case 'weight': return '#F59E0B';
        default: return '#6B7280';
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
    refreshButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.background + '20',
    },
    insightsContainer: {
        gap: 8,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    insightText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
});
exports.default = HealthInsightCard;
