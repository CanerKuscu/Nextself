import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    ViewStyle,
    TextInputProps,
    NativeSyntheticEvent,
    TextInputFocusEventData,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

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
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const [isFocused, setIsFocused] = useState(false);
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
    const inputRef = useRef<TextInput>(null);

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
        outputRange: [18, 6],
    }), [labelAnim]);

    const labelSize = useMemo(() => labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 11],
    }), [labelAnim]);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <View style={[styles.container]}>
            <Pressable
                onPress={focusInput}
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
                        pointerEvents="none"
                        style={[
                            styles.label,
                            {
                                top: labelTop,
                                fontSize: labelSize,
                                color: isFocused
                                    ? colors.primary
                                    : error
                                        ? colors.error
                                        : colors.textTertiary,
                            },
                        ]}
                    >
                        {label}
                    </Animated.Text>
                    <TextInput
                        ref={inputRef}
                        {...props}
                        value={value}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={[
                            styles.input,
                            icon ? styles.inputWithIcon : null,
                            { color: colors.text },
                            props.style,
                        ]}
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </Pressable>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        minHeight: 56,
    },
    focused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    errorBorder: {
        borderColor: colors.error,
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
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        minHeight: 56,
        textAlignVertical: 'center',
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    // 8px grid aligned icons
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
        color: colors.error,
        marginTop: SPACING.xs,
        paddingLeft: SPACING.md,
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(FloatingInput);
