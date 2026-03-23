import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from '../animations/Animations';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, SPACING } from '../config/theme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  icon,
  iconSize = 20,
  iconColor = '#FFFFFF',
  loading = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const { value, springPress, springRelease } = useAnimation();
  const isPressed = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isTouchActive, setIsTouchActive] = useState(false);

  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      isPressed.current = true;
      setIsTouchActive(true);
      const animation = springPress();
      animationRef.current = animation;
      animation.start();
    }
  }, [disabled, loading, springPress]);

  const handlePressOut = useCallback(() => {
    setIsTouchActive(false);
    if (!disabled && !loading && isPressed.current) {
      isPressed.current = false;
      const animation = springRelease();
      animationRef.current = animation;
      animation.start();
      onPress();
    }
  }, [disabled, loading, springRelease, onPress]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, []);

  // Memoize button style to prevent recalculation on every render
  const buttonStyle = useMemo(() => {
    const baseStyle = {
      transform: [{ scale: value }],
      opacity: disabled ? 0.5 : 1,
    };

    const variantStyles = {
      primary: {
        backgroundColor: isTouchActive ? COLORS.primaryDark : COLORS.primary,
        ...SHADOWS.glow,
      },
      secondary: {
        backgroundColor: isTouchActive ? COLORS.primarySoft : COLORS.surfaceElevated,
        borderWidth: 1,
        borderColor: isTouchActive ? COLORS.primary : COLORS.borderFocus,
      },
      danger: {
        backgroundColor: isTouchActive ? '#E53935' : COLORS.error,
      },
      success: {
        backgroundColor: isTouchActive ? COLORS.primaryDark : COLORS.success,
      },
    };

    // 8px grid aligned size styles
    const sizeStyles = {
      small: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
      },
      medium: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
      },
      large: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };
  }, [value, disabled, variant, size, style, isTouchActive]);

  // Memoize text style to prevent recalculation on every render
  const textStyleMemo = useMemo(() => {
    const baseStyle = {
      ...TYPOGRAPHY.button,
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantStyles = {
      primary: { color: COLORS.textInverse },
      secondary: { color: COLORS.text },
      danger: { color: COLORS.textInverse },
      success: { color: COLORS.textInverse },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  }, [size, variant, textStyle]);

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {loading ? (
        <Text style={[styles.text, textStyleMemo]}>Loading...</Text>
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={iconColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, textStyleMemo]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  text: {
    textAlign: 'center',
  },
  // Icon alignment with 8px grid spacing
  icon: {
    marginRight: SPACING.xs,
  },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(AnimatedButton);
