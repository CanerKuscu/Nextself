import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Polygon, Circle, Ellipse } from 'react-native-svg';

interface Props { size?: number }

const PremiumFrameIllustration: React.FC<Props> = ({ size = 56 }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
            <LinearGradient id="pf1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF9A9E" />
                <Stop offset="100%" stopColor="#FAD0C4" />
            </LinearGradient>
            <LinearGradient id="pf2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFD700" />
                <Stop offset="100%" stopColor="#FFAA00" />
            </LinearGradient>
        </Defs>
        <Rect x="6" y="6" width="108" height="108" rx="18" fill="#FFF6F8" />
        <Rect x="16" y="16" width="88" height="88" rx="14" stroke="url(#pf1)" strokeWidth="6" fill="none" />

        {/* Star emblem */}
        <Polygon points="60,32 66,48 84,48 70,58 76,74 60,64 44,74 50,58 36,48 54,48" fill="url(#pf2)" />

        <Circle cx="60" cy="80" r="10" fill="#FFF" />
        <Ellipse cx="60" cy="92" rx="18" ry="8" fill="#FFD1A9" opacity="0.9" />
    </Svg>
);

export default PremiumFrameIllustration;
