import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';

interface AnimatedProgressProps {
  progress: number; // 0 to 100
  width?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  duration?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  borderRadius?: number;
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  width = 200,
  height = 8,
  backgroundColor = '#E5E7EB',
  progressColor = '#4F46E5',
  showPercentage = true,
  animated = true,
  duration = 1000,
  style,
  textStyle,
  borderRadius = 4,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Cleanup previous animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (animated) {
      const animation = Animated.timing(animatedWidth, {
        toValue: (progress / 100) * width,
        duration,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      });
      animationRef.current = animation;
      animation.start();
    } else {
      animatedWidth.setValue((progress / 100) * width);
    }

    return () => {
      // Cleanup animation on unmount or before new animation starts
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [progress, animated, duration, width, animatedWidth]);

  // Memoize container style to prevent recalculation on every render
  const containerStyle: ViewStyle = useMemo(() => ({
    width,
    height,
    backgroundColor,
    borderRadius,
    overflow: 'hidden',
    ...style,
  }), [width, height, backgroundColor, borderRadius, style]);

  // Memoize progress style to prevent recalculation on every render
  const progressStyle: Animated.AnimatedProps<ViewStyle> & ViewStyle = useMemo(() => ({
    height: '100%',
    backgroundColor: progressColor,
    borderRadius,
    width: animated ? animatedWidth : (progress / 100) * width,
  }), [progressColor, borderRadius, animated, animatedWidth, progress, width]);

  return (
    <View style={styles.container}>
      <View style={containerStyle}>
        <Animated.View style={progressStyle} />
      </View>
      {showPercentage && (
        <Text style={[styles.percentageText, textStyle]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(AnimatedProgress);
