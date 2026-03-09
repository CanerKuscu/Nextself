import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, TYPOGRAPHY, BORDER_RADIUS, SPACING, SHADOWS } from '../config/theme';

interface PremiumBadgeProps {
    locked?: boolean;
    label?: string;
    onPress?: () => void;
    size?: 'sm' | 'md';
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    locked = true,
    label = 'Premium',
    onPress,
    size = 'sm',
}) => {
    const content = (
        <LinearGradient
            colors={locked ? GRADIENTS.premium as any : GRADIENTS.health as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.badge, size === 'md' && styles.badgeMd]}
        >
            <Ionicons
                name={locked ? 'lock-closed' : 'star'}
                size={size === 'sm' ? 10 : 12}
                color={COLORS.textInverse}
            />
            <Text style={[styles.text, size === 'md' && styles.textMd]}>
                {label}
            </Text>
        </LinearGradient>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.pill,
    },
    badgeMd: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 5,
    },
    text: {
        ...TYPOGRAPHY.small,
        color: COLORS.textInverse,
        fontWeight: '700',
        fontSize: 9,
    },
    textMd: {
        fontSize: 11,
    },
});

export default PremiumBadge;
