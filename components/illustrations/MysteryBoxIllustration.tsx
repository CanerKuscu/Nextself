import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';

interface Props { size?: number }

const MysteryBoxIllustration: React.FC<Props> = ({ size = 56 }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
            <LinearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#7F7FD5" />
                <Stop offset="100%" stopColor="#86A8E7" />
            </LinearGradient>
            <LinearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFD89B" />
                <Stop offset="100%" stopColor="#19547B" stopOpacity="0.9" />
            </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="58" fill="url(#g1)" opacity="0.95" />
        <Rect x="22" y="44" rx="8" ry="8" width="76" height="44" fill="#2C2C54" opacity="0.12" />

        {/* Gift base */}
        <Path d="M30 54 h60 v28 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 z" fill="#ffffff" opacity="0.95" />
        {/* Lid shadow */}
        <Path d="M30 54 q30 -18 60 0" fill="#F0F0F6" opacity="0.9" />

        {/* Ribbon */}
        <Rect x="56" y="44" width="8" height="44" rx="2" fill="#FF6B6B" />
        <Path d="M60 44 c6 -6 18 -6 24 0 l-12 12 z" fill="#FF8787" />

        {/* Question mark */}
        <Path d="M60 62 c-6 0 -10 4 -10 10 c0 6 4 10 10 10 c6 0 10 -4 10 -10" fill="#2C2C54" opacity="0.95" />
        <Circle cx="60" cy="86" r="3" fill="#2C2C54" />
    </Svg>
);

export default MysteryBoxIllustration;
