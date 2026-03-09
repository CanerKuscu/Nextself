import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { SpotifyService, SpotifyPlaylist, SpotifyTrack } from '../services/spotifyService';

const SpotifyScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { isTurkish } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const spotifyService = SpotifyService.getInstance();

  // Check connection status on mount
  useEffect(() => {
    const init = async () => {
      const authenticated = spotifyService.isAuthenticated() || await spotifyService.loadTokenFromSession();
      setIsConnected(authenticated);
      if (authenticated) {
        await loadPlaylists();
        await loadCurrentTrack();
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadPlaylists = useCallback(async () => {
    try {
      const [userPl, workoutPl] = await Promise.allSettled([
        spotifyService.getUserPlaylists(),
        spotifyService.getWorkoutPlaylists(),
      ]);
      const combined: SpotifyPlaylist[] = [];
      if (userPl.status === 'fulfilled') combined.push(...userPl.value);
      if (workoutPl.status === 'fulfilled') combined.push(...workoutPl.value);
      // Deduplicate by id
      const seen = new Set<string>();
      setPlaylists(combined.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }));
    } catch (err) {
      console.error('Load playlists error:', err);
    }
  }, []);

  const loadCurrentTrack = useCallback(async () => {
    try {
      const track = await spotifyService.getCurrentlyPlaying();
      if (track) {
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Load current track error:', err);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    const success = await spotifyService.authenticate();
    if (success) {
      setIsConnected(true);
      await loadPlaylists();
      await loadCurrentTrack();
    }
    setLoading(false);
  };

  const handlePlayPlaylist = async (playlist: SpotifyPlaylist) => {
    try {
      await spotifyService.playPlaylist(playlist.uri);
      setIsPlaying(true);
      setTimeout(loadCurrentTrack, 1500);
    } catch (err) {
      console.error('Play playlist error:', err);
    }
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
    } catch (err) {
      console.error('Play/pause error:', err);
    }
  };

  const handleNext = async () => {
    try {
      await spotifyService.skipToNext();
      setTimeout(loadCurrentTrack, 1000);
    } catch (err) {
      console.error('Skip error:', err);
    }
  };

  const handlePrev = async () => {
    try {
      await spotifyService.skipToPrevious();
      setTimeout(loadCurrentTrack, 1000);
    } catch (err) {
      console.error('Skip error:', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#1DB954', '#1ED760']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: SPACING.sm }}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Ionicons name="musical-notes" size={32} color={colors.textInverse} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.headerTitle}>Spotify</Text>
            <Text style={styles.headerSub}>{isTurkish ? 'Antrenman müzikleri' : 'Workout music'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isConnected ? (
          <GlassCard elevated style={styles.connectCard}>
            <View style={styles.connectIcon}>
              <Ionicons name="musical-notes" size={48} color="#1DB954" />
            </View>
            <Text style={styles.connectTitle}>
              {isTurkish ? 'Spotify\'a bağlanın' : 'Connect to Spotify'}
            </Text>
            <Text style={styles.connectDesc}>
              {isTurkish ? 'Antrenmanlarınız sırasında müzik dinleyin' : 'Listen to music during your workouts'}
            </Text>
            <GradientButton
              title={isTurkish ? 'Bağlan' : 'Connect'}
              onPress={handleConnect}
              gradient={['#1DB954', '#1ED760']}
              size="lg"
              style={{ marginTop: SPACING.xl }}
            />
          </GlassCard>
        ) : (
          <>
            {/* Now Playing */}
            {currentTrack && (
              <GlassCard elevated style={styles.nowPlayingCard}>
                <Text style={styles.nowPlayingLabel}>
                  {isTurkish ? 'Şimdi Çalıyor' : 'Now Playing'}
                </Text>
                <View style={styles.nowPlayingRow}>
                  {currentTrack.imageUrl ? (
                    <Image source={{ uri: currentTrack.imageUrl }} style={styles.nowPlayingArt} />
                  ) : (
                    <View style={[styles.nowPlayingArt, { backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="musical-note" size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={styles.nowPlayingTrack} numberOfLines={1}>{currentTrack.name}</Text>
                    <Text style={styles.nowPlayingArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                  </View>
                </View>
                <View style={styles.controlsRow}>
                  <TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
                    <Ionicons name="play-skip-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
                    <Ionicons name="play-skip-forward" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            <Text style={styles.sectionTitle}>{isTurkish ? 'Çalma Listeleri' : 'Playlists'}</Text>
            {playlists.map((playlist) => (
              <GlassCard key={playlist.id} style={styles.playlistCard}>
                <View style={styles.playlistRow}>
                  {playlist.imageUrl ? (
                    <Image source={{ uri: playlist.imageUrl }} style={styles.playlistImage} />
                  ) : (
                    <View style={[styles.playlistIcon, { backgroundColor: '#1DB95415' }]}>
                      <Ionicons name="musical-notes" size={24} color="#1DB954" />
                    </View>
                  )}
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
                    {playlist.description ? (
                      <Text style={styles.playlistMeta} numberOfLines={1}>{playlist.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.playButton} onPress={() => handlePlayPlaylist(playlist)}>
                    <Ionicons name="play-circle" size={36} color="#1DB954" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 60, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...TYPOGRAPHY.h1, color: colors.textInverse },
  headerSub: { ...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.8)' },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.section },
  connectCard: { marginTop: SPACING.xxl, alignItems: 'center', paddingVertical: SPACING.xxxl },
  connectIcon: { marginBottom: SPACING.lg },
  connectTitle: { ...TYPOGRAPHY.h2, color: colors.text, marginBottom: SPACING.sm },
  connectDesc: { ...TYPOGRAPHY.body, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { ...TYPOGRAPHY.h3, color: colors.text, marginTop: SPACING.xxl, marginBottom: SPACING.md },
  // Now Playing
  nowPlayingCard: { marginTop: SPACING.lg, padding: SPACING.md },
  nowPlayingLabel: { ...TYPOGRAPHY.caption, color: '#1DB954', marginBottom: SPACING.sm, textTransform: 'uppercase', fontWeight: '700' },
  nowPlayingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  nowPlayingArt: { width: 56, height: 56, borderRadius: 8 },
  nowPlayingTrack: { ...TYPOGRAPHY.bodyBold, color: colors.text },
  nowPlayingArtist: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.xl },
  controlBtn: { padding: SPACING.xs },
  playPauseBtn: { backgroundColor: '#1DB954', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', paddingLeft: 2 },
  // Playlists
  playlistCard: { marginBottom: SPACING.sm },
  playlistRow: { flexDirection: 'row', alignItems: 'center' },
  playlistImage: { width: 50, height: 50, borderRadius: 8 },
  playlistIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  playlistInfo: { flex: 1, marginLeft: SPACING.md },
  playlistName: { ...TYPOGRAPHY.bodyBold, color: colors.text },
  playlistMeta: { ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: 2 },
  playButton: {},
});

export default SpotifyScreen;
