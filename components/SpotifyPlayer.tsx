import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image'; // Use expo-image for better caching and performance
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, SPACING } from '../config/theme';
import { SpotifyService, SpotifyTrack } from '../services/spotifyService';

const SpotifyPlayer = () => {
    const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [showPlaylists, setShowPlaylists] = useState(false);

    const spotifyService = SpotifyService.getInstance();

    useEffect(() => {
        // Try loading existing session token
        const init = async () => {
            const hasSession = spotifyService.isAuthenticated() || await spotifyService.loadTokenFromSession();
            setConnected(hasSession);
            if (hasSession) {
                loadCurrentTrack();
                loadPlaylists();
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!connected || !isPlaying) return;
        const interval = setInterval(loadCurrentTrack, 10000);
        return () => clearInterval(interval);
    }, [connected, isPlaying]);

    const loadPlaylists = async () => {
        try {
            const fetchedPlaylists = await spotifyService.getWorkoutPlaylists();
            if (fetchedPlaylists) {
                setPlaylists(fetchedPlaylists);
            }
        } catch (error) {
            console.error('Spotify load playlists error:', error);
        }
    };

    const loadCurrentTrack = async () => {
        try {
            if (!spotifyService.isAuthenticated()) return;
            const track = await spotifyService.getCurrentlyPlaying();
            if (track) {
                setCurrentTrack(track);
            }
        } catch (error) {
            console.error('Spotify load track error:', error);
        }
    };

    const authenticate = async () => {
        setLoading(true);
        const success = await spotifyService.authenticate();
        if (success) {
            setConnected(true);
            await loadCurrentTrack();
        }
        setLoading(false);
    };

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await spotifyService.pausePlayback();
                setIsPlaying(false);
            } else {
                await spotifyService.resumePlayback();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Play/pause error:', error);
        }
    };

    const handleNext = async () => {
        try {
            await spotifyService.skipToNext();
            setTimeout(loadCurrentTrack, 1000);
        } catch (error) {
            console.error('Skip to next error:', error);
        }
    };

    const handlePrev = async () => {
        try {
            await spotifyService.skipToPrevious();
            setTimeout(loadCurrentTrack, 1000);
        } catch (error) {
            console.error('Skip to previous error:', error);
        }
    };

    const openApp = () => {
        if (currentTrack?.uri) {
            Linking.openURL(currentTrack.uri).catch(() => {
                // App not installed probably
                Linking.openURL('https://open.spotify.com');
            });
        }
    };

    const handlePlayPlaylist = async (uri: string) => {
        try {
            await spotifyService.playPlaylist(uri);
            setIsPlaying(true);
            setTimeout(loadCurrentTrack, 1500);
        } catch (error) {
            console.error('Play playlist error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={COLORS.success} />
            </View>
        );
    }

    if (!connected) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.container}
                onPress={authenticate}
            >
                <LinearGradient
                    colors={['#1DB954', '#191414']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.connectGradient}
                >
                    <Ionicons name="musical-notes" size={24} color="#fff" />
                    <Text style={styles.connectText}>Connect to Spotify</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.playerCard}>
            <View style={styles.trackInfoContainer}>
                {currentTrack?.imageUrl ? (
                    <Image source={{ uri: currentTrack.imageUrl }} style={styles.albumArt} contentFit="cover" cachePolicy="memory-disk" transition={500} />
                ) : (
                    <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                        <Ionicons name="musical-note" size={24} color={COLORS.textTertiary} />
                    </View>
                )}

                <View style={styles.textContainer}>
                    <Text style={styles.trackName} numberOfLines={1}>
                        {currentTrack ? currentTrack.name : 'Not Playing'}
                    </Text>
                    <Text style={styles.artistName} numberOfLines={1}>
                        {currentTrack ? currentTrack.artist : 'Select a playlist'}
                    </Text>
                </View>

                <TouchableOpacity onPress={openApp} style={styles.spotifyLogo}>
                    <Ionicons name="musical-notes" size={24} color="#1DB954" />
                </TouchableOpacity>
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
                    <Ionicons name="play-skip-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handlePlayPause}
                    style={[styles.controlBtn, styles.playPauseBtn]}
                >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
                    <Ionicons name="play-skip-forward" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>
            
            {playlists.length > 0 && (
                <View style={{ marginTop: SPACING.md }}>
                    <TouchableOpacity onPress={() => setShowPlaylists(!showPlaylists)} style={styles.playlistToggleBtn}>
                        <Text style={styles.playlistToggleText}>
                            {showPlaylists ? 'Hide Workout Playlists' : 'Show Workout Playlists'}
                        </Text>
                        <Ionicons name={showPlaylists ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    
                    {showPlaylists && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playlistScroll}>
                            {playlists.map((playlist, index) => (
                                <TouchableOpacity 
                                    key={`${playlist.id}-${index}`} 
                                    style={styles.playlistCard}
                                    onPress={() => handlePlayPlaylist(playlist.uri)}
                                >
                                    {playlist.imageUrl ? (
                                        <Image source={{ uri: playlist.imageUrl }} style={styles.playlistImage} contentFit="cover" />
                                    ) : (
                                        <View style={[styles.playlistImage, styles.albumArtPlaceholder]}>
                                            <Ionicons name="musical-notes" size={20} color={COLORS.textTertiary} />
                                        </View>
                                    )}
                                    <Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.md,
    },
    connectGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    connectText: {
        ...TYPOGRAPHY.bodyBold,
        color: '#fff',
    },
    playerCard: {
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    trackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    albumArt: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    albumArtPlaceholder: {
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.sm,
    },
    trackName: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.text,
    },
    artistName: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    spotifyLogo: {
        padding: SPACING.xs,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xl,
    },
    controlBtn: {
        padding: SPACING.xs,
    },
    playPauseBtn: {
        backgroundColor: '#1DB954',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        paddingLeft: 2, // optical alignment
    },
    playlistToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    playlistToggleText: {
        ...TYPOGRAPHY.smallBold,
        color: COLORS.textSecondary,
    },
    playlistScroll: {
        gap: SPACING.md,
        paddingTop: SPACING.sm,
    },
    playlistCard: {
        width: 100,
        marginRight: SPACING.sm,
    },
    playlistImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginBottom: SPACING.xs,
    },
    playlistName: {
        ...TYPOGRAPHY.smallBold,
        color: COLORS.text,
        textAlign: 'center',
    }
});

export default SpotifyPlayer;
