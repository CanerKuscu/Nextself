import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    // Animation Values
    const iconScale = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    const ringScale = useRef(new Animated.Value(0.8)).current;
    const ringOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // 1. Icon pop in
        Animated.spring(iconScale, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
        }).start();

        // 2. Ripple effect behind icon
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(ringScale, { toValue: 1.5, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(ringOpacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.timing(ringScale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
                Animated.timing(ringOpacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
            ])
        ).start();

        // 3. Text slide & fade in
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(textTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
            ]).start();
        }, 400);

        const timer = setTimeout(() => onFinish(), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {/* Background elements */}
            <View style={styles.bgTopRight} />
            <View style={styles.bgBottomLeft} />

            {/* Icon with Ripple */}
            <View style={styles.iconContainer}>
                <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
                <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.iconGradient}>
                        <Ionicons name="sparkles" size={40} color="#FFFFFF" />
                    </LinearGradient>
                </Animated.View>
            </View>

            {/* Logo Text */}
            <Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
                <Text style={styles.logoNext}>Next</Text>
                <Text style={styles.logoSelf}>Self</Text>
                <Text style={styles.logoDot}>.</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={[styles.taglineContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
                <Text style={styles.tagline}>EVOLVE EVERY DAY</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bgTopRight: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: COLORS.primarySoft,
    },
    bgBottomLeft: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.2,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: COLORS.secondarySoft,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 15,
        backgroundColor: COLORS.background,
    },
    iconGradient: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    logoNext: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -1.5,
    },
    logoSelf: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: -1.5,
    },
    logoDot: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.secondary,
    },
    taglineContainer: {
        marginTop: 12,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 4,
    },
});

export default SplashScreen;
