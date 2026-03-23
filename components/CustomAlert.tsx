import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../config/theme';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'destructive';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    type?: AlertType;
    buttons?: AlertButton[];
    onDismiss?: () => void;
    icon?: string;
}

const ALERT_CONFIG: Record<AlertType, { gradient: string[]; icon: string; iconColor: string }> = {
    success: { gradient: ['#10B981', '#34D399'], icon: 'checkmark-circle', iconColor: '#fff' },
    error: { gradient: ['#EF4444', '#F87171'], icon: 'close-circle', iconColor: '#fff' },
    warning: { gradient: ['#F59E0B', '#FBBF24'], icon: 'warning', iconColor: '#fff' },
    info: { gradient: ['#6366F1', '#8B5CF6'], icon: 'information-circle', iconColor: '#fff' },
    confirm: { gradient: ['#6366F1', '#8B5CF6'], icon: 'help-circle', iconColor: '#fff' },
    destructive: { gradient: ['#EF4444', '#DC2626'], icon: 'trash', iconColor: '#fff' },
};

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    buttons = [{ text: 'OK' }],
    onDismiss,
    icon,
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const config = ALERT_CONFIG[type];

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const renderButton = (btn: AlertButton, index: number, total: number) => {
        const isDestructive = btn.style === 'destructive';
        const isCancel = btn.style === 'cancel';

        if (isCancel) {
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.button, styles.cancelButton, total === 1 && styles.fullButton]}
                    onPress={() => { btn.onPress?.(); onDismiss?.(); }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cancelButtonText}>{btn.text}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={index}
                style={[styles.button, total === 1 && styles.fullButton]}
                onPress={() => { btn.onPress?.(); onDismiss?.(); }}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={isDestructive ? ['#EF4444', '#DC2626'] as const : config.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                >
                    <Text style={[styles.buttonText, isDestructive && { color: '#fff' }]}>{btn.text}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon Header */}
                    <LinearGradient
                        colors={config.gradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconHeader}
                    >
                        <Ionicons name={(icon || config.icon) as any} size={36} color={config.iconColor} />
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        {message ? <Text style={styles.message}>{message}</Text> : null}
                    </View>

                    {/* Buttons */}
                    <View style={[styles.buttonRow, buttons.length === 1 && styles.singleButton]}>
                        {buttons.map((btn, i) => renderButton(btn, i, buttons.length))}
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
        paddingHorizontal: SPACING.xl,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 360,
        ...SHADOWS.xl,
    },
    iconHeader: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
        alignItems: 'center',
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    message: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    singleButton: {
        justifyContent: 'center',
    },
    button: {
        flex: 1,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    fullButton: {
        flex: 1,
    },
    buttonGradient: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.surfaceSecondary,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    cancelButtonText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.textSecondary,
    },
    buttonText: {
        ...TYPOGRAPHY.captionBold,
        color: COLORS.textInverse,
    },
});

export default CustomAlert;

// Helper hook for easy usage
export const useAlert = () => {
    const [alertConfig, setAlertConfig] = React.useState<CustomAlertProps & { visible: boolean }>({
        visible: false,
        title: '',
    });

    const showAlert = React.useCallback((config: Omit<CustomAlertProps, 'visible' | 'onDismiss'>) => {
        setAlertConfig({ ...config, visible: true, onDismiss: () => setAlertConfig(prev => ({ ...prev, visible: false })) });
    }, []);

    const hideAlert = React.useCallback(() => setAlertConfig(prev => ({ ...prev, visible: false })), []);

    // Change: return a functional component instead of a static JSX element
    const AlertComponent = React.useCallback(() => (
        <CustomAlert
            {...alertConfig}
            onDismiss={hideAlert}
        />
    ), [alertConfig, hideAlert]);

    return { showAlert, hideAlert, AlertComponent };
};
