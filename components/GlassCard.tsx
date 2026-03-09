import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../config/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
    noPadding?: boolean;
    onLayout?: (e: any) => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    elevated = false,
    noPadding = false,
    onLayout,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            onLayout={onLayout}
            style={[
                styles.card,
                elevated && styles.elevated,
                noPadding && styles.noPadding,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.card,
    },
    elevated: {
        ...SHADOWS.lg,
        borderColor: 'transparent',
    },
    noPadding: {
        padding: 0,
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(GlassCard);
