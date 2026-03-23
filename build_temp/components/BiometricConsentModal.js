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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const useTranslation_1 = require("../hooks/useTranslation");
const agreementService_1 = require("../services/agreementService");
const supabase_1 = require("../services/supabase");
const theme_1 = require("../config/theme");
const ICONS = {
    posture_analysis: 'body',
    food_scanner: 'restaurant',
    body_analysis: 'fitness',
    barcode_scanner: 'barcode',
};
const BiometricConsentModal = ({ visible, consentType, onAccept, onDecline }) => {
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const [saving, setSaving] = (0, react_1.useState)(false);
    const fadeAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.9)).current;
    const agreementService = agreementService_1.AgreementService.getInstance();
    const info = agreementService.getBiometricConsentInfo(consentType, isTurkish);
    const animationRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // Cleanup previous animation
        if (animationRef.current) {
            animationRef.current.stop();
            animationRef.current = null;
        }
        if (visible) {
            const animation = react_native_1.Animated.parallel([
                react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                react_native_1.Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
            ]);
            animationRef.current = animation;
            animation.start();
        }
        else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
        return () => {
            // Cleanup animation on unmount or before new animation starts
            if (animationRef.current) {
                animationRef.current.stop();
                animationRef.current = null;
            }
        };
    }, [visible, fadeAnim, scaleAnim]);
    const handleAccept = () => __awaiter(void 0, void 0, void 0, function* () {
        setSaving(true);
        try {
            const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
            if (user) {
                yield agreementService.recordBiometricConsent(user.id, consentType);
            }
            setSaving(false);
            onAccept();
        }
        catch (err) {
            console.warn('Biometric consent save error:', err);
            setSaving(false);
            // KVKK/GDPR compliance: do NOT proceed if consent recording fails
            // Show error to user instead of silently proceeding
            onDecline();
        }
    });
    return (<react_native_1.Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <react_native_1.Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <react_native_1.Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Header with icon */}
                    <react_native_1.View style={styles.iconContainer}>
                        <expo_linear_gradient_1.LinearGradient colors={['#FF6B35', '#FF8C42']} style={styles.iconGradient}>
                            <vector_icons_1.Ionicons name={ICONS[consentType]} size={28} color="#fff"/>
                        </expo_linear_gradient_1.LinearGradient>
                    </react_native_1.View>

                    {/* Title */}
                    <react_native_1.Text style={styles.title}>{info.title}</react_native_1.Text>

                    {/* KVKK Badge */}
                    <react_native_1.View style={styles.kvkkBadge}>
                        <vector_icons_1.Ionicons name="shield-checkmark" size={14} color="#7C3AED"/>
                        <react_native_1.Text style={styles.kvkkBadgeText}>
                            {isTurkish ? 'KVKK Md. 6 — Özel Nitelikli Veri' : 'KVKK Art. 6 — Special Category Data'}
                        </react_native_1.Text>
                    </react_native_1.View>

                    {/* Content */}
                    <react_native_1.Text style={styles.message}>{info.message}</react_native_1.Text>

                    {/* Data Type Info */}
                    <react_native_1.View style={styles.dataTypeRow}>
                        <vector_icons_1.Ionicons name="information-circle" size={16} color={theme_1.COLORS.textSecondary}/>
                        <react_native_1.Text style={styles.dataTypeText}>
                            {isTurkish ? 'İşlenecek veri: ' : 'Data to be processed: '}
                            <react_native_1.Text style={{ fontWeight: '700' }}>{info.dataType}</react_native_1.Text>
                        </react_native_1.Text>
                    </react_native_1.View>

                    {/* Temporary storage notice */}
                    <react_native_1.View style={styles.noticeBox}>
                        <vector_icons_1.Ionicons name="time-outline" size={16} color={theme_1.COLORS.success}/>
                        <react_native_1.Text style={styles.noticeText}>
                            {isTurkish
            ? 'Veriler yalnızca analiz süresince geçici olarak işlenir, kalıcı olarak saklanmaz.'
            : 'Data is only temporarily processed during analysis, not permanently stored.'}
                        </react_native_1.Text>
                    </react_native_1.View>

                    {/* Buttons */}
                    <react_native_1.View style={styles.buttonContainer}>
                        <react_native_1.TouchableOpacity style={styles.declineButton} onPress={onDecline} activeOpacity={0.7}>
                            <react_native_1.Text style={styles.declineText}>
                                {isTurkish ? 'Reddet' : 'Decline'}
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={saving} activeOpacity={0.8}>
                            <expo_linear_gradient_1.LinearGradient colors={theme_1.GRADIENTS.primary} style={styles.acceptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {saving ? (<react_native_1.ActivityIndicator color="#fff" size="small"/>) : (<>
                                        <vector_icons_1.Ionicons name="checkmark-circle" size={18} color="#fff"/>
                                        <react_native_1.Text style={styles.acceptText}>
                                            {isTurkish ? 'Onaylıyorum' : 'I Consent'}
                                        </react_native_1.Text>
                                    </>)}
                            </expo_linear_gradient_1.LinearGradient>
                        </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                </react_native_1.Animated.View>
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
};
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme_1.SPACING.xl,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: theme_1.SPACING.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: theme_1.SPACING.md,
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: theme_1.COLORS.text, textAlign: 'center', marginBottom: theme_1.SPACING.sm }),
    kvkkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme_1.BORDER_RADIUS.pill,
        gap: 6,
        marginBottom: theme_1.SPACING.md,
    },
    kvkkBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#7C3AED',
    },
    message: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: theme_1.COLORS.textSecondary, textAlign: 'left', lineHeight: 22, marginBottom: theme_1.SPACING.md }),
    dataTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: theme_1.SPACING.sm,
        paddingHorizontal: theme_1.SPACING.sm,
    },
    dataTypeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: theme_1.COLORS.textSecondary, flex: 1 }),
    noticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: theme_1.BORDER_RADIUS.md,
        marginBottom: theme_1.SPACING.xl,
        width: '100%',
    },
    noticeText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: theme_1.COLORS.success, flex: 1, lineHeight: 18 }),
    buttonContainer: {
        flexDirection: 'row',
        gap: theme_1.SPACING.md,
        width: '100%',
    },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme_1.BORDER_RADIUS.lg,
        backgroundColor: theme_1.COLORS.surfaceSecondary || '#F3F4F6',
        borderWidth: 1,
        borderColor: theme_1.COLORS.borderLight,
    },
    declineText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: theme_1.COLORS.textSecondary, fontSize: 15 }),
    acceptButton: {
        flex: 1.5,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    acceptText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff', fontSize: 15 }),
});
exports.default = BiometricConsentModal;
