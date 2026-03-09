import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Polygon, Rect, G, Ellipse } from 'react-native-svg';

interface LeagueTierIconProps {
    tier: number;
    size?: number;
}

/**
 * Professional SVG tier badges for the league system.
 * Each tier has a unique shield/badge design with its own color palette.
 */
const LeagueTierIcon: React.FC<LeagueTierIconProps> = ({ tier, size = 40 }) => {
    const s = size;
    const cx = s / 2;
    const cy = s / 2;

    const renderTier = () => {
        switch (tier) {
            case 1: // Bronze - Simple shield
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#D4956B" />
                                <Stop offset="0.5" stopColor="#CD7F32" />
                                <Stop offset="1" stopColor="#A0522D" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#bronze)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#E8B87A" strokeWidth="1" />
                        <Circle cx="20" cy="20" r="7" fill="#A0522D" />
                        <Circle cx="20" cy="20" r="5" fill="#D4956B" />
                        <Path d="M17 20 L19 22 L23 18" stroke="#A0522D" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                );

            case 2: // Silver - Elegant shield
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#E8E8E8" />
                                <Stop offset="0.5" stopColor="#C0C0C0" />
                                <Stop offset="1" stopColor="#A8A8A8" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#silver)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#D0D0D0" strokeWidth="1" />
                        <Path d="M15 18 L20 12 L25 18 L20 24 Z" fill="#A8A8A8" />
                        <Path d="M15 18 L20 12 L25 18 L20 24 Z" fill="none" stroke="#E0E0E0" strokeWidth="0.8" />
                    </Svg>
                );

            case 3: // Gold - Crown shield
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#FFE14D" />
                                <Stop offset="0.5" stopColor="#FFD700" />
                                <Stop offset="1" stopColor="#DAA520" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#gold)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#FFE680" strokeWidth="1" />
                        {/* Crown */}
                        <Path d="M12 20 L16 14 L20 18 L24 14 L28 20 L28 24 L12 24 Z" fill="#DAA520" />
                        <Circle cx="16" cy="14" r="1.5" fill="#FFE14D" />
                        <Circle cx="20" cy="12" r="1.5" fill="#FFE14D" />
                        <Circle cx="24" cy="14" r="1.5" fill="#FFE14D" />
                    </Svg>
                );

            case 4: // Sapphire - Gem shield
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="sapphire" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#2979FF" />
                                <Stop offset="0.5" stopColor="#0F52BA" />
                                <Stop offset="1" stopColor="#0A3380" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#sapphire)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#5C9FFF" strokeWidth="1" />
                        {/* Sapphire gem */}
                        <Polygon points="20,12 27,18 24,26 16,26 13,18" fill="#5C9FFF" />
                        <Polygon points="20,14 25,18.5 23,25 17,25 15,18.5" fill="#2979FF" />
                        <Path d="M15,18 L20,14 L25,18" fill="none" stroke="#A0C8FF" strokeWidth="0.5" />
                    </Svg>
                );

            case 5: // Ruby - Fire gem
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="ruby" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#FF3366" />
                                <Stop offset="0.5" stopColor="#E0115F" />
                                <Stop offset="1" stopColor="#9B0040" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#ruby)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#FF6688" strokeWidth="1" />
                        {/* Ruby gem */}
                        <Polygon points="20,12 28,19 20,27 12,19" fill="#FF3366" />
                        <Polygon points="20,14 26,19 20,25 14,19" fill="#FF6688" opacity="0.6" />
                        <Path d="M14,19 L20,14 L26,19" fill="none" stroke="#FFB3C6" strokeWidth="0.6" />
                    </Svg>
                );

            case 6: // Emerald - Natural gem
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="emerald" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#69DB7C" />
                                <Stop offset="0.5" stopColor="#50C878" />
                                <Stop offset="1" stopColor="#2D8B4E" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#emerald)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#8CE99A" strokeWidth="1" />
                        {/* Emerald cut */}
                        <Rect x="14" y="14" width="12" height="12" rx="2" fill="#69DB7C" transform="rotate(45 20 20)" />
                        <Rect x="16" y="16" width="8" height="8" rx="1" fill="#2D8B4E" transform="rotate(45 20 20)" />
                    </Svg>
                );

            case 7: // Amethyst - Crystal
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="amethyst" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#C084FC" />
                                <Stop offset="0.5" stopColor="#9966CC" />
                                <Stop offset="1" stopColor="#6B3FA0" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#amethyst)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#D8B4FE" strokeWidth="1" />
                        {/* Crystal */}
                        <Polygon points="20,10 26,16 26,24 20,28 14,24 14,16" fill="#C084FC" />
                        <Polygon points="20,13 24,17 24,23 20,26 16,23 16,17" fill="#9966CC" />
                        <Path d="M16,17 L20,13 L24,17" fill="none" stroke="#E9D5FF" strokeWidth="0.6" />
                    </Svg>
                );

            case 8: // Pearl - Sphere
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="pearl" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#FEFCE8" />
                                <Stop offset="0.5" stopColor="#F0EAD6" />
                                <Stop offset="1" stopColor="#D4C5A0" />
                            </SvgLinearGradient>
                            <SvgLinearGradient id="pearlInner" x1="0.2" y1="0.2" x2="0.8" y2="0.8">
                                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
                                <Stop offset="1" stopColor="#F0EAD6" stopOpacity="0.3" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#pearl)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#E8DFC0" strokeWidth="1" />
                        <Circle cx="20" cy="20" r="8" fill="url(#pearl)" stroke="#D4C5A0" strokeWidth="0.5" />
                        <Circle cx="17" cy="17" r="3" fill="url(#pearlInner)" />
                    </Svg>
                );

            case 9: // Obsidian - Dark crystal
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="obsidian" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#4A4545" />
                                <Stop offset="0.5" stopColor="#3D3635" />
                                <Stop offset="1" stopColor="#1A1515" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#obsidian)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#5A5555" strokeWidth="1" />
                        {/* Obsidian shard */}
                        <Polygon points="20,10 28,20 22,30 18,30 12,20" fill="#4A4545" />
                        <Polygon points="20,13 25,20 22,27 18,27 15,20" fill="#2A2525" />
                        <Path d="M15,20 L20,13 L25,20" fill="none" stroke="#6A6565" strokeWidth="0.5" />
                    </Svg>
                );

            case 10: // Diamond - Multi-faceted diamond
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Defs>
                            <SvgLinearGradient id="diamond" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#E0F7FF" />
                                <Stop offset="0.3" stopColor="#B9F2FF" />
                                <Stop offset="0.7" stopColor="#7DD3FC" />
                                <Stop offset="1" stopColor="#38BDF8" />
                            </SvgLinearGradient>
                            <SvgLinearGradient id="diamondGlow" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
                                <Stop offset="1" stopColor="#B9F2FF" stopOpacity="0.1" />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d="M20 2 L35 10 L35 22 C35 30 28 36 20 38 C12 36 5 30 5 22 L5 10 Z" fill="url(#diamond)" />
                        <Path d="M20 6 L32 12 L32 22 C32 28 26 33 20 35 C14 33 8 28 8 22 L8 12 Z" fill="none" stroke="#E0F7FF" strokeWidth="1.2" />
                        {/* Diamond facets */}
                        <Polygon points="20,10 28,17 20,28 12,17" fill="#7DD3FC" />
                        <Polygon points="12,17 20,10 20,17" fill="#BAE6FD" />
                        <Polygon points="20,10 28,17 20,17" fill="#93C5FD" />
                        <Polygon points="12,17 20,17 20,28" fill="#38BDF8" />
                        <Polygon points="20,17 28,17 20,28" fill="#0EA5E9" />
                        {/* Sparkle */}
                        <Path d="M26,12 L27,11 L28,12 L27,13Z" fill="#FFFFFF" />
                        <Path d="M14,25 L15,24 L16,25 L15,26Z" fill="#FFFFFF" opacity="0.7" />
                    </Svg>
                );

            default:
                return (
                    <Svg width={s} height={s} viewBox="0 0 40 40">
                        <Circle cx="20" cy="20" r="18" fill="#E5E5EA" />
                        <Circle cx="20" cy="20" r="12" fill="#D1D5DB" />
                    </Svg>
                );
        }
    };

    return (
        <View style={[styles.container, { width: s, height: s }]}>
            {renderTier()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

// Memoize component to prevent re-renders when props don't change
export default React.memo(LeagueTierIcon);
