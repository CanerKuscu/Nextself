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
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const theme_1 = require("../config/theme");
const useTranslation_1 = require("../hooks/useTranslation");
const GlassCard_1 = __importDefault(require("./GlassCard"));
const ThemeContext_1 = require("../contexts/ThemeContext");
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = react_native_1.Dimensions.get('window');
const SupplementQuickView = ({ visible, item, onClose, onToggleReminder, isScheduled = false, }) => {
    var _a, _b, _c, _d;
    const { t, isTurkish } = (0, useTranslation_1.useTranslation)();
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(100)).current;
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.9)).current;
    (0, react_1.useEffect)(() => {
        if (visible) {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                react_native_1.Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        else {
            react_native_1.Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            slideAnim.setValue(100);
            scaleAnim.setValue(0.9);
        }
    }, [visible]);
    if (!visible || !item)
        return null;
    const getCategoryColor = (category) => {
        switch (category) {
            case 'protein': return '#FF6B6B';
            case 'pre_workout': return '#FFC800';
            case 'post_workout': return '#58CC02';
            case 'vitamin': return '#FF9600';
            case 'mineral': return '#1CB0F6';
            default: return '#CE82FF';
        }
    };
    const categoryColor = getCategoryColor(item.category || item.type);
    return (<react_native_1.Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <react_native_1.View style={styles.overlay}>
        <react_native_1.TouchableOpacity style={react_native_1.StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <react_native_1.Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}/>
        </react_native_1.TouchableOpacity>

        <react_native_1.Animated.View style={[
            styles.modalContainer,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
        ]}>
          <GlassCard_1.default variant="premium" noPadding style={[styles.card, { borderColor: categoryColor + '40' }]} gradientColors={isDark
            ? ['#1A1A2E', '#16162B']
            : ['#FFFFFF', '#F8F9FA']}>
            {/* Header with Icon */}
            <expo_linear_gradient_1.LinearGradient colors={[categoryColor + '20', 'transparent']} style={styles.headerGradient}>
              <react_native_1.View style={[styles.iconContainer, { backgroundColor: categoryColor + '30' }]}>
                <vector_icons_1.Ionicons name="flask" size={32} color={categoryColor}/>
              </react_native_1.View>
              <react_native_1.TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <vector_icons_1.Ionicons name="close" size={24} color={colors.textSecondary}/>
              </react_native_1.TouchableOpacity>
            </expo_linear_gradient_1.LinearGradient>

            <react_native_1.ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
              <react_native_1.Text style={[styles.title, { color: colors.text }]}>{item.name}</react_native_1.Text>
              <react_native_1.Text style={[styles.brand, { color: categoryColor }]}>
                {item.brand || item.type || 'Generic'} • {item.dosage} {item.unit}
              </react_native_1.Text>

              {/* Benefits Tags */}
              {item.benefits && item.benefits.length > 0 && (<react_native_1.View style={styles.section}>
                  <react_native_1.Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {t('benefits')}
                  </react_native_1.Text>
                  <react_native_1.View style={styles.tagsContainer}>
                    {item.benefits.map((benefit, index) => (<react_native_1.View key={index} style={[styles.tag, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                        <vector_icons_1.Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 4 }}/>
                        <react_native_1.Text style={[styles.tagText, { color: colors.success }]}>{benefit}</react_native_1.Text>
                      </react_native_1.View>))}
                  </react_native_1.View>
                </react_native_1.View>)}

              {/* Description/Details */}
              {item.description && (<react_native_1.View style={styles.section}>
                  <react_native_1.Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {isTurkish ? 'Detaylar' : 'Details'}
                  </react_native_1.Text>
                  <react_native_1.Text style={[styles.description, { color: colors.text }]}>
                    {item.description}
                  </react_native_1.Text>
                </react_native_1.View>)}

              {/* Side Effects & Warnings */}
              {(((_a = item.side_effects) === null || _a === void 0 ? void 0 : _a.length) > 0 || ((_b = item.warnings) === null || _b === void 0 ? void 0 : _b.length) > 0) && (<react_native_1.View style={styles.section}>
                  <react_native_1.View style={[styles.warningBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
                    <vector_icons_1.Ionicons name="warning" size={20} color={colors.warning} style={{ marginBottom: 8 }}/>
                    {((_c = item.side_effects) === null || _c === void 0 ? void 0 : _c.length) > 0 && (<react_native_1.Text style={[styles.warningText, { color: colors.warning }]}>
                        <react_native_1.Text style={{ fontWeight: 'bold' }}>{t('sideEffects')}: </react_native_1.Text>
                        {item.side_effects.join(', ')}
                      </react_native_1.Text>)}
                    {((_d = item.warnings) === null || _d === void 0 ? void 0 : _d.length) > 0 && (<react_native_1.Text style={[styles.warningText, { color: colors.warning, marginTop: 4 }]}>
                        <react_native_1.Text style={{ fontWeight: 'bold' }}>Warning: </react_native_1.Text>
                        {item.warnings.join(' • ')}
                      </react_native_1.Text>)}
                  </react_native_1.View>
                </react_native_1.View>)}
            </react_native_1.ScrollView>

            {/* Footer Action */}
            <react_native_1.View style={[styles.footer, { borderTopColor: colors.border }]}>
              <react_native_1.TouchableOpacity style={[
            styles.actionButton,
            { backgroundColor: isScheduled ? colors.surfaceElevated : categoryColor }
        ]} onPress={() => onToggleReminder === null || onToggleReminder === void 0 ? void 0 : onToggleReminder(item)}>
                <vector_icons_1.Ionicons name={isScheduled ? "notifications-off" : "notifications"} size={20} color={isScheduled ? colors.textSecondary : '#FFF'}/>
                <react_native_1.Text style={[
            styles.actionButtonText,
            { color: isScheduled ? colors.textSecondary : '#FFF' }
        ]}>
                  {isScheduled
            ? (isTurkish ? 'Hatırlatıcıyı Kaldır' : 'Remove Reminder')
            : (isTurkish ? 'Hatırlatıcı Ekle' : 'Add Reminder')}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </GlassCard_1.default>
        </react_native_1.Animated.View>
      </react_native_1.View>
    </react_native_1.Modal>);
};
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: Object.assign(Object.assign({}, react_native_1.StyleSheet.absoluteFillObject), { backgroundColor: 'rgba(0,0,0,0.6)' }),
    modalContainer: Object.assign({ width: SCREEN_WIDTH * 0.9, maxHeight: SCREEN_HEIGHT * 0.8, borderRadius: theme_1.BORDER_RADIUS.xl }, theme_1.SHADOWS.lg),
    card: {
        borderRadius: theme_1.BORDER_RADIUS.xl,
        overflow: 'hidden',
        height: '100%',
    },
    headerGradient: {
        padding: theme_1.SPACING.lg,
        alignItems: 'center',
        paddingTop: theme_1.SPACING.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    closeButton: {
        position: 'absolute',
        top: theme_1.SPACING.md,
        right: theme_1.SPACING.md,
        padding: theme_1.SPACING.xs,
        borderRadius: theme_1.BORDER_RADIUS.circle,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    contentScroll: {
        flex: 1,
    },
    contentContainer: {
        padding: theme_1.SPACING.lg,
        paddingTop: 0,
    },
    title: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { textAlign: 'center', marginBottom: theme_1.SPACING.xs }),
    brand: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { textAlign: 'center', marginBottom: theme_1.SPACING.xl, fontWeight: '600' }),
    section: {
        marginBottom: theme_1.SPACING.lg,
    },
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme_1.SPACING.sm, fontWeight: '700' }),
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme_1.SPACING.sm,
        paddingVertical: 6,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 1,
    },
    tagText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { fontWeight: '600' }),
    description: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { lineHeight: 22 }),
    warningBox: {
        padding: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.md,
        borderWidth: 1,
    },
    warningText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { lineHeight: 18 }),
    footer: {
        padding: theme_1.SPACING.lg,
        borderTopWidth: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme_1.SPACING.md,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        gap: 8,
    },
    actionButtonText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { fontWeight: '700' }),
});
exports.default = SupplementQuickView;
