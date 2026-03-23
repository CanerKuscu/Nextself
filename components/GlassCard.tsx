import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
    noPadding?: boolean;
    onLayout?: (e: any) => void;
    variant?: 'default' | 'premium' | 'subtle';
    gradientColors?: [string, string, ...string[]];
    delay?: number;
    onPress?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    elevated = false,
    noPadding = false,
    onLayout,
    variant = 'default',
    gradientColors,
    delay = 0,
    onPress,
}) => {
    const { colors, isDark } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        if (gradientColors) return gradientColors;
        
        if (isDark) {
            switch (variant) {
                case 'premium': return ['rgba(30, 30, 50, 0.8)', 'rgba(40, 40, 70, 0.4)'];
                case 'subtle': return ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'];
                default: return ['rgba(26, 26, 46, 0.7)', 'rgba(26, 26, 46, 0.4)'];
            }
        } else {
            switch (variant) {
                case 'premium': return ['rgba(255, 255, 255, 0.9)', 'rgba(240, 240, 255, 0.6)'];
                case 'subtle': return ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)'];
                default: return ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.5)'];
            }
        }
    };

    const getBorderColor = () => {
        if (isDark) {
            return variant === 'premium' ? 'rgba(206, 130, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        }
        return variant === 'premium' ? 'rgba(206, 130, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)';
    };

    const Container = onPress ? TouchableOpacity : View;
    const containerProps = onPress ? { 
        onPress, 
        activeOpacity: 0.9,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut
    } : {};

    return (
        <Animated.View
            onLayout={onLayout}
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ],
                },
                style,
            ]}
        >
            <Container {...containerProps} style={styles.touchable}>
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.card,
                        elevated && styles.elevated,
                        noPadding && styles.noPadding,
                        { borderColor: getBorderColor() }
                    ]}
                >
                    {children}
                </LinearGradient>
            </Container>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    touchable: {
        flex: 1,
    },
    card: {
        flex: 1,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        overflow: 'hidden',
        // Glassmorphism backdrop filter is not supported natively in RN without specific libraries,
        // but semi-transparent background + blur (if available) creates the effect.
        // We rely on the parent View background color showing through slightly.
    },
    elevated: {
        ...SHADOWS.md,
    },
    noPadding: {
        padding: 0,
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(GlassCard);
