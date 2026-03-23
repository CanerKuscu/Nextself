import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAnimation } from '../animations/Animations';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../config/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  animationType?: 'fadeIn' | 'slideUp' | 'scale' | 'bounce';
  delay?: number;
  duration?: number;
  disabled?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  animationType = 'fadeIn',
  delay = 0,
  duration = 300,
  disabled = false,
}) => {
  const { value, fadeIn, slideUp, scale, bounce } = useAnimation(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Clear any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    const timer = setTimeout(() => {
      let animation: Animated.CompositeAnimation;
      switch (animationType) {
        case 'fadeIn':
          animation = fadeIn(1, duration);
          opacity.setValue(1);
          break;
        case 'slideUp':
          animation = slideUp(0, duration);
          opacity.setValue(1);
          break;
        case 'scale':
          animation = scale({ x: 1, y: 1 }, duration);
          opacity.setValue(1);
          break;
        case 'bounce':
          animation = bounce(duration);
          opacity.setValue(1);
          break;
        default:
          animation = fadeIn(1, duration);
          opacity.setValue(1);
      }
      animationRef.current = animation;
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [animationType, delay, duration, fadeIn, slideUp, scale, bounce, opacity]);

  // Memoize card style to prevent recalculation on every render
  const cardStyle: ViewStyle = useMemo(() => ({
    opacity,
    transform: [
      {
        translateY: animationType === 'slideUp' ? value : 0,
      },
      {
        scale: animationType === 'scale' ? value : 1,
      },
      {
        translateY: animationType === 'bounce' ? value : 0,
      },
    ],
  }), [opacity, animationType, value]);

  // Memoize CardComponent to prevent re-creation on every render
  const CardComponent = useMemo(() => (
    <Animated.View style={[styles.card, cardStyle, style]}>
      {children}
    </Animated.View>
  ), [styles.card, cardStyle, style, children]);

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={style}
      >
        {CardComponent}
      </TouchableOpacity>
    );
  }

  return CardComponent;
};

const styles = StyleSheet.create({
  // 8px grid aligned card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(AnimatedCard);
