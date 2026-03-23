import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { AgreementService, BiometricConsentType } from '../services/agreementService';
import { SupabaseService } from '@nextself/shared';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';

interface BiometricConsentModalProps {
    visible: boolean;
    consentType: BiometricConsentType;
    onAccept: () => void;
    onDecline: () => void;
}

const ICONS: Record<BiometricConsentType, keyof typeof Ionicons.glyphMap> = {
    posture_analysis: 'body',
    food_scanner: 'restaurant',
    body_analysis: 'fitness',
    barcode_scanner: 'barcode',
};

const BiometricConsentModal = ({ visible, consentType, onAccept, onDecline }: BiometricConsentModalProps) => {
    const { isTurkish } = useTranslation();
    const [saving, setSaving] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const agreementService = AgreementService.getInstance();
    const info = agreementService.getBiometricConsentInfo(consentType, isTurkish);
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        // Cleanup previous animation
        if (animationRef.current) {
            animationRef.current.stop();
            animationRef.current = null;
        }

        if (visible) {
            const animation = Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
            ]);
            animationRef.current = animation;
            animation.start();
        } else {
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

    const handleAccept = async () => {
        setSaving(true);
        try {
            const { user } = await SupabaseService.getInstance().getCurrentUser();
            if (user) {
                await agreementService.recordBiometricConsent(user.id, consentType);
            }
            setSaving(false);
            onAccept();
        } catch (err) {
            console.warn('Biometric consent save error:', err);
            setSaving(false);
            // KVKK/GDPR compliance: do NOT proceed if consent recording fails
            // Show error to user instead of silently proceeding
            onDecline();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Header with icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#FF6B35', '#FF8C42']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name={ICONS[consentType]} size={28} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{info.title}</Text>

                    {/* KVKK Badge */}
                    <View style={styles.kvkkBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#7C3AED" />
                        <Text style={styles.kvkkBadgeText}>
                            {isTurkish ? 'KVKK Md. 6 — Özel Nitelikli Veri' : 'KVKK Art. 6 — Special Category Data'}
                        </Text>
                    </View>

                    {/* Content */}
                    <Text style={styles.message}>{info.message}</Text>

                    {/* Data Type Info */}
                    <View style={styles.dataTypeRow}>
                        <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.dataTypeText}>
                            {isTurkish ? 'İşlenecek veri: ' : 'Data to be processed: '}
                            <Text style={{ fontWeight: '700' }}>{info.dataType}</Text>
                        </Text>
                    </View>

                    {/* Temporary storage notice */}
                    <View style={styles.noticeBox}>
                        <Ionicons name="time-outline" size={16} color={COLORS.success} />
                        <Text style={styles.noticeText}>
                            {isTurkish
                                ? 'Veriler yalnızca analiz süresince geçici olarak işlenir, kalıcı olarak saklanmaz.'
                                : 'Data is only temporarily processed during analysis, not permanently stored.'}
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={onDecline}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.declineText}>
                                {isTurkish ? 'Reddet' : 'Decline'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={handleAccept}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={GRADIENTS.primary as any}
                                style={styles.acceptGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={styles.acceptText}>
                                            {isTurkish ? 'Onaylıyorum' : 'I Consent'}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.md,
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    kvkkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.pill,
        gap: 6,
        marginBottom: SPACING.md,
    },
    kvkkBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#7C3AED',
    },
    message: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'left',
        lineHeight: 22,
        marginBottom: SPACING.md,
    },
    dataTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    dataTypeText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        flex: 1,
    },
    noticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.xl,
        width: '100%',
    },
    noticeText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.success,
        flex: 1,
        lineHeight: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.surfaceSecondary || '#F3F4F6',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    declineText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    acceptButton: {
        flex: 1.5,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    acceptText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
        fontSize: 15,
    },
});

export default BiometricConsentModal;
