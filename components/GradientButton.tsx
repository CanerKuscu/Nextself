import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, SPACING, ANIMATION } from '../config/theme';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    gradient?: readonly string[];
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'filled' | 'outline';
}

const GradientButton: React.FC<GradientButtonProps> = ({
    title,
    onPress,
    gradient = GRADIENTS.primary,
    style,
    textStyle,
    disabled = false,
    loading = false,
    icon,
    size = 'md',
    variant = 'filled',
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // glowAnim removed — was running an infinite JS-thread animation loop
    // that was never referenced in the JSX, wasting CPU resources

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            ...ANIMATION.bouncy,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            ...ANIMATION.spring,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    // Memoize size styles to prevent recalculation on every render
    const sizeStyles = useMemo(() => ({
        sm: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md },
        md: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
        lg: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
    }), []);

    // Memoize text sizes to prevent recalculation on every render
    const textSizes = useMemo(() => ({
        sm: { fontSize: 14 },
        md: { fontSize: 16 },
        lg: { fontSize: 18 },
    }), []);

    if (variant === 'outline') {
        return (
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    activeOpacity={0.8}
                    style={[
                        styles.outlineButton,
                        sizeStyles[size],
                        disabled && styles.disabled,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <>
                            {icon && <>{icon}</>}
                            <Text style={[styles.outlineText, textSizes[size], textStyle]}>
                                {title}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.gradient,
                        sizeStyles[size],
                        disabled && styles.disabled,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.textInverse} />
                    ) : (
                        <>
                            {icon && <>{icon}</>}
                            <Text style={[styles.text, textSizes[size], textStyle]}>
                                {title}
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    gradient: {
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: SPACING.xs,
        ...SHADOWS.lg,
    },
    text: {
        ...TYPOGRAPHY.button,
        color: COLORS.textInverse,
    },
    outlineButton: {
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: SPACING.xs,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    outlineText: {
        ...TYPOGRAPHY.button,
        color: COLORS.primary,
    },
    disabled: {
        opacity: 0.5,
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(GradientButton);
