import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, Rect } from 'react-native-svg';

interface Props { size?: number }

const DoubleXPIllustration: React.FC<Props> = ({ size = 56 }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
            <LinearGradient id="gx" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFB347" />
                <Stop offset="100%" stopColor="#FFCC33" />
            </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="58" fill="#FFF8E1" />

        {/* Stylized XP badge */}
        <Rect x="30" y="30" rx="14" ry="14" width="60" height="60" fill="url(#gx)" />
        <Path d="M45 80 L55 50 L65 80 L75 50" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M42 48 L78 48" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        {/* Glow */}
        <Path d="M20 60 a40 40 0 0 0 80 0 a40 40 0 0 0 -80 0" fill="none" stroke="#FFD93D" strokeWidth="3" opacity="0.35" />
    </Svg>
);

export default DoubleXPIllustration;
