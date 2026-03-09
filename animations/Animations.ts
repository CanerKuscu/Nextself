import React from 'react';
import { Animated, Easing } from 'react-native';

export class Animations {
  // Fade in animation
  static fadeIn = (value: Animated.Value, toValue: number = 1, duration: number = 300) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.ease,
      useNativeDriver: true,
    });
  };

  // Fade out animation
  static fadeOut = (value: Animated.Value, duration: number = 300) => {
    return Animated.timing(value, {
      toValue: 0,
      duration,
      easing: Easing.ease,
      useNativeDriver: true,
    });
  };

  // Slide up animation
  static slideUp = (value: Animated.Value, toValue: number = 0, duration: number = 300) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    });
  };

  // Slide down animation
  static slideDown = (value: Animated.Value, toValue: number = 100, duration: number = 300) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    });
  };

  // Scale animation
  static scale = (value: Animated.ValueXY, toValue: { x: number; y: number }, duration: number = 300) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    });
  };

  // Rotate animation
  static rotate = (value: Animated.Value, toValue: number, duration: number = 300) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
  };

  // Spring animation for buttons
  static springPress = (value: Animated.Value, toValue: number = 0.95) => {
    return Animated.spring(value, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  };

  // Spring release
  static springRelease = (value: Animated.Value, toValue: number = 1) => {
    return Animated.spring(value, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  };

  // Pulse animation
  static pulse = (value: Animated.Value, duration: number = 1000) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1.1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  };

  // Shake animation
  static shake = (value: Animated.Value, duration: number = 500) => {
    return Animated.sequence([
      Animated.timing(value, {
        toValue: 10,
        duration: duration / 8,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: -10,
        duration: duration / 4,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 10,
        duration: duration / 4,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: duration / 8,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
  };

  // Bounce animation
  static bounce = (value: Animated.Value, duration: number = 600) => {
    return Animated.sequence([
      Animated.timing(value, {
        toValue: -20,
        duration: duration / 6,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: duration / 6,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]);
  };

  // Stagger animation for lists
  static stagger = (
    values: Animated.Value[],
    delay: number = 100,
    animation: (value: Animated.Value) => Animated.CompositeAnimation
  ) => {
    return Animated.stagger(delay, values.map(animation));
  };

  // Parallax effect
  static parallax = (
    scrollY: Animated.Value,
    inputRange: number[],
    outputRange: number[]
  ) => {
    return scrollY.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  };

  // Progress bar animation
  static progress = (value: Animated.Value, toValue: number, duration: number = 1000) => {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    });
  };
}

export const useAnimation = (initialValue: number | { x: number; y: number } = 1) => {
  const animatedValue = React.useRef(
    new Animated.Value(typeof initialValue === 'number' ? initialValue : initialValue.x)
  ).current;

  const animatedValueXY = React.useRef(
    new Animated.ValueXY(typeof initialValue === 'object' ? initialValue : { x: initialValue, y: initialValue })
  ).current;

  return {
    value: animatedValue,
    valueXY: animatedValueXY,
    fadeIn: (toValue?: number, duration?: number) => Animations.fadeIn(animatedValue, toValue, duration),
    fadeOut: (duration?: number) => Animations.fadeOut(animatedValue, duration),
    slideUp: (toValue?: number, duration?: number) => Animations.slideUp(animatedValue, toValue, duration),
    slideDown: (toValue?: number, duration?: number) => Animations.slideDown(animatedValue, toValue, duration),
    scale: (toValue: { x: number; y: number }, duration?: number) => Animations.scale(animatedValueXY, toValue, duration),
    rotate: (toValue: number, duration?: number) => Animations.rotate(animatedValue, toValue, duration),
    springPress: (toValue?: number) => Animations.springPress(animatedValue, toValue),
    springRelease: (toValue?: number) => Animations.springRelease(animatedValue, toValue),
    pulse: (duration?: number) => Animations.pulse(animatedValue, duration),
    shake: (duration?: number) => Animations.shake(animatedValue, duration),
    bounce: (duration?: number) => Animations.bounce(animatedValue, duration),
    progress: (toValue: number, duration?: number) => Animations.progress(animatedValue, toValue, duration),
  };
};
