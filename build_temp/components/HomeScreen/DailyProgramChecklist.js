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
const DailyProgramChecklist = (0, react_1.memo)(({ items, onToggle }) => {
    const { colors } = (0, ThemeContext_1.useTheme)();
    const { t } = (0, useTranslation_1.useTranslation)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    if (!items || items.length === 0) {
        return (<react_native_1.View style={styles.container}>
            <react_native_1.View style={styles.header}>
                <react_native_1.Text style={styles.title}>{t('todays_program') || "Today's Program"}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.emptyState}>
                <react_native_1.Text style={styles.emptyText}>{t('no_program_today') || "No tasks scheduled for today."}</react_native_1.Text>
            </react_native_1.View>
        </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>{t('todays_program') || "Today's Program"}</react_native_1.Text>
        <react_native_1.Text style={styles.subtitle}>{items.filter(i => i.completed).length}/{items.length} {t('completed') || "Completed"}</react_native_1.Text>
      </react_native_1.View>
      {items.map((item) => (<react_native_1.TouchableOpacity key={`${item.type}-${item.id}`} style={styles.itemRow} onPress={() => onToggle(item.id, item.type, item.completed)}>
            <react_native_1.View style={[styles.checkbox, item.completed && styles.checked]}>
                {item.completed && <vector_icons_1.Ionicons name="checkmark" size={14} color="#FFF"/>}
            </react_native_1.View>
            <react_native_1.View style={styles.content}>
                <react_native_1.Text style={[styles.itemTitle, item.completed && styles.completedText]}>{item.title}</react_native_1.Text>
                {item.subtitle ? <react_native_1.Text style={styles.itemSubtitle}>{item.subtitle}</react_native_1.Text> : null}
            </react_native_1.View>
            <react_native_1.View style={styles.meta}>
                 {item.time && <react_native_1.Text style={styles.time}>{item.time}</react_native_1.Text>}
                 <react_native_1.View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type, colors) }]}>
                    <vector_icons_1.Ionicons name={getTypeIcon(item.type)} size={14} color="#FFF"/>
                 </react_native_1.View>
            </react_native_1.View>
        </react_native_1.TouchableOpacity>))}
    </react_native_1.View>);
});
const getTypeIcon = (type) => {
    switch (type) {
        case 'workout': return 'fitness';
        case 'meal': return 'restaurant';
        case 'supplement': return 'medkit';
        default: return 'ellipse';
    }
};
const getTypeColor = (type, colors) => {
    switch (type) {
        case 'workout': return colors.primary;
        case 'meal': return '#FF9F43'; // Orange
        case 'supplement': return '#28C76F'; // Green
        default: return colors.text;
    }
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptyState: {
        padding: 10,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checked: {
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    itemSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    meta: {
        alignItems: 'flex-end',
    },
    time: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
exports.default = DailyProgramChecklist;
