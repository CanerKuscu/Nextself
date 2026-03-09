import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    Animated,
    ViewStyle,
    TextInputProps,
    NativeSyntheticEvent,
    TextInputFocusEventData,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../config/theme';

interface FloatingInputProps extends TextInputProps {
    label: string;
    error?: string;
    containerStyle?: ViewStyle;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
    label,
    error,
    containerStyle,
    icon,
    rightIcon,
    value,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    // Handle external value changes (e.g., autofill, programmatic updates)
    React.useEffect(() => {
        if (value && !isFocused) {
            Animated.timing(labelAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
        } else if (!value && !isFocused) {
            Animated.timing(labelAnim, { toValue: 0, duration: 0, useNativeDriver: false }).start();
        }
    }, [value, isFocused, labelAnim]);

    const handleFocus = useCallback((e: unknown) => {
        setIsFocused(true);
        Animated.timing(labelAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.(e as any);
    }, [labelAnim, onFocus]);

    const handleBlur = useCallback((e: unknown) => {
        setIsFocused(false);
        if (!value) {
            Animated.timing(labelAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        onBlur?.(e as any);
    }, [labelAnim, value, onBlur]);

    // Memoize interpolated values to prevent recalculation on every render
    const labelTop = useMemo(() => labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [17, 6],
    }), [labelAnim]);

    const labelSize = useMemo(() => labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 11],
    }), [labelAnim]);

    return (
        <View style={[styles.container]}>
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.focused,
                    error && styles.errorBorder,
                    containerStyle,
                ]}
            >
                {icon && <View style={styles.iconLeft}>{icon}</View>}
                <View style={styles.inputWrapper}>
                    <Animated.Text
                        style={[
                            styles.label,
                            {
                                top: labelTop,
                                fontSize: labelSize,
                                color: isFocused
                                    ? COLORS.primary
                                    : error
                                        ? COLORS.error
                                        : COLORS.textTertiary,
                            },
                        ]}
                    >
                        {label}
                    </Animated.Text>
                    <TextInput
                        {...props}
                        value={value}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={[
                            styles.input,
                            icon ? styles.inputWithIcon : null,
                            props.style,
                        ]}
                        placeholderTextColor={COLORS.textTertiary}
                    />
                </View>
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        minHeight: 56,
    },
    focused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },
    errorBorder: {
        borderColor: COLORS.error,
    },
    inputWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        position: 'absolute',
        left: SPACING.md,
        ...TYPOGRAPHY.caption,
        fontWeight: '500',
        zIndex: 1,
    },
    input: {
        ...TYPOGRAPHY.body,
        color: COLORS.text,
        paddingHorizontal: SPACING.md,
        paddingTop: 20,
        paddingBottom: 8,
        height: 56,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    iconLeft: {
        paddingLeft: SPACING.md,
        paddingRight: SPACING.xs,
    },
    iconRight: {
        paddingRight: SPACING.md,
        paddingLeft: SPACING.xs,
    },
    errorText: {
        ...TYPOGRAPHY.small,
        color: COLORS.error,
        marginTop: SPACING.xs,
        paddingLeft: SPACING.md,
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(FloatingInput);
