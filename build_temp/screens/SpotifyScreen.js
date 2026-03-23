"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const GradientButton_1 = __importDefault(require("../components/GradientButton"));
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const ThemeContext_1 = require("../contexts/ThemeContext");
const navigation_1 = require("../utils/navigation");
const spotifyService_1 = require("../services/spotifyService");
const SpotifyScreen = ({ navigation }) => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors), [colors]);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { isTurkish } = (0, useTranslation_1.useTranslation)();
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [playlists, setPlaylists] = (0, react_1.useState)([]);
    const [currentTrack, setCurrentTrack] = (0, react_1.useState)(null);
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const spotifyService = spotifyService_1.SpotifyService.getInstance();
    // Check connection status on mount
    (0, react_1.useEffect)(() => {
        const init = () => __awaiter(void 0, void 0, void 0, function* () {
            const authenticated = spotifyService.isAuthenticated() || (yield spotifyService.loadTokenFromSession());
            setIsConnected(authenticated);
            if (authenticated) {
                yield loadPlaylists();
                yield loadCurrentTrack();
            }
            setLoading(false);
        });
        init();
    }, []);
    const loadPlaylists = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const [userPl, workoutPl] = yield Promise.allSettled([
                spotifyService.getUserPlaylists(),
                spotifyService.getWorkoutPlaylists(),
            ]);
            const combined = [];
            if (userPl.status === 'fulfilled')
                combined.push(...userPl.value);
            if (workoutPl.status === 'fulfilled')
                combined.push(...workoutPl.value);
            // Deduplicate by id
            const seen = new Set();
            setPlaylists(combined.filter(p => { if (seen.has(p.id))
                return false; seen.add(p.id); return true; }));
        }
        catch (err) {
            console.error('Load playlists error:', err);
        }
    }), []);
    const loadCurrentTrack = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const track = yield spotifyService.getCurrentlyPlaying();
            if (track) {
                setCurrentTrack(track);
                setIsPlaying(true);
            }
        }
        catch (err) {
            console.error('Load current track error:', err);
        }
    }), []);
    const handleConnect = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        const success = yield spotifyService.authenticate();
        if (success) {
            setIsConnected(true);
            yield loadPlaylists();
            yield loadCurrentTrack();
        }
        setLoading(false);
    });
    const handlePlayPlaylist = (playlist) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.playPlaylist(playlist.uri);
            setIsPlaying(true);
            setTimeout(loadCurrentTrack, 1500);
        }
        catch (err) {
            console.error('Play playlist error:', err);
        }
    });
    const handlePlayPause = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (isPlaying) {
                yield spotifyService.pausePlayback();
                setIsPlaying(false);
            }
            else {
                yield spotifyService.resumePlayback();
                setIsPlaying(true);
            }
        }
        catch (err) {
            console.error('Play/pause error:', err);
        }
    });
    const handleNext = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.skipToNext();
            setTimeout(loadCurrentTrack, 1000);
        }
        catch (err) {
            console.error('Skip error:', err);
        }
    });
    const handlePrev = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.skipToPrevious();
            setTimeout(loadCurrentTrack, 1000);
        }
        catch (err) {
            console.error('Skip error:', err);
        }
    });
    if (loading) {
        return (<react_native_1.View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <react_native_1.ActivityIndicator size="large" color="#1DB954"/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { backgroundColor: colors.background }]}>
      <expo_linear_gradient_1.LinearGradient colors={['#1DB954', '#1ED760']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + theme_1.SPACING.xl }]}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.TouchableOpacity onPress={() => (0, navigation_1.safeGoBack)(navigation, 'Workout')} style={{ marginRight: theme_1.SPACING.sm }}>
            <vector_icons_1.Ionicons name="arrow-back" size={24} color={colors.textInverse}/>
          </react_native_1.TouchableOpacity>
          <vector_icons_1.Ionicons name="musical-notes" size={32} color={colors.textInverse}/>
          <react_native_1.View style={{ flex: 1, marginLeft: theme_1.SPACING.md }}>
            <react_native_1.Text style={styles.headerTitle}>Spotify</react_native_1.Text>
            <react_native_1.Text style={styles.headerSub}>{isTurkish ? 'Antrenman müzikleri' : 'Workout music'}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </expo_linear_gradient_1.LinearGradient>

      <react_native_1.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isConnected ? (<GlassCard_1.default elevated style={styles.connectCard}>
            <react_native_1.View style={styles.connectIcon}>
              <vector_icons_1.Ionicons name="musical-notes" size={48} color="#1DB954"/>
            </react_native_1.View>
            <react_native_1.Text style={styles.connectTitle}>
              {isTurkish ? 'Spotify\'a bağlanın' : 'Connect to Spotify'}
            </react_native_1.Text>
            <react_native_1.Text style={styles.connectDesc}>
              {isTurkish ? 'Antrenmanlarınız sırasında müzik dinleyin' : 'Listen to music during your workouts'}
            </react_native_1.Text>
            <GradientButton_1.default title={isTurkish ? 'Bağlan' : 'Connect'} onPress={handleConnect} gradient={['#1DB954', '#1ED760']} size="lg" style={{ marginTop: theme_1.SPACING.xl }}/>
          </GlassCard_1.default>) : (<>
            {/* Now Playing */}
            {currentTrack && (<GlassCard_1.default elevated style={styles.nowPlayingCard}>
                <react_native_1.Text style={styles.nowPlayingLabel}>
                  {isTurkish ? 'Şimdi Çalıyor' : 'Now Playing'}
                </react_native_1.Text>
                <react_native_1.View style={styles.nowPlayingRow}>
                  {currentTrack.imageUrl ? (<react_native_1.Image source={{ uri: currentTrack.imageUrl }} style={styles.nowPlayingArt}/>) : (<react_native_1.View style={[styles.nowPlayingArt, { backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' }]}>
                      <vector_icons_1.Ionicons name="musical-note" size={24} color={colors.textSecondary}/>
                    </react_native_1.View>)}
                  <react_native_1.View style={{ flex: 1, marginLeft: theme_1.SPACING.md }}>
                    <react_native_1.Text style={styles.nowPlayingTrack} numberOfLines={1}>{currentTrack.name}</react_native_1.Text>
                    <react_native_1.Text style={styles.nowPlayingArtist} numberOfLines={1}>{currentTrack.artist}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
                <react_native_1.View style={styles.controlsRow}>
                  <react_native_1.TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
                    <vector_icons_1.Ionicons name="play-skip-back" size={24} color={colors.text}/>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
                    <vector_icons_1.Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff"/>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
                    <vector_icons_1.Ionicons name="play-skip-forward" size={24} color={colors.text}/>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </GlassCard_1.default>)}

            <react_native_1.Text style={styles.sectionTitle}>{isTurkish ? 'Çalma Listeleri' : 'Playlists'}</react_native_1.Text>
            {playlists.map((playlist) => (<GlassCard_1.default key={playlist.id} style={styles.playlistCard}>
                <react_native_1.View style={styles.playlistRow}>
                  {playlist.imageUrl ? (<react_native_1.Image source={{ uri: playlist.imageUrl }} style={styles.playlistImage}/>) : (<react_native_1.View style={[styles.playlistIcon, { backgroundColor: '#1DB95415' }]}>
                      <vector_icons_1.Ionicons name="musical-notes" size={24} color="#1DB954"/>
                    </react_native_1.View>)}
                  <react_native_1.View style={styles.playlistInfo}>
                    <react_native_1.Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</react_native_1.Text>
                    {playlist.description ? (<react_native_1.Text style={styles.playlistMeta} numberOfLines={1}>{playlist.description}</react_native_1.Text>) : null}
                  </react_native_1.View>
                  <react_native_1.TouchableOpacity style={styles.playButton} onPress={() => handlePlayPlaylist(playlist)}>
                    <vector_icons_1.Ionicons name="play-circle" size={36} color="#1DB954"/>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
              </GlassCard_1.default>))}
          </>)}
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
const getStyles = (colors) => react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: theme_1.SPACING.xl, paddingHorizontal: theme_1.SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h1), { color: colors.textInverse }),
    headerSub: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: 'rgba(255,255,255,0.8)' }),
    content: { paddingHorizontal: theme_1.SPACING.lg, paddingBottom: theme_1.SPACING.section },
    connectCard: { marginTop: theme_1.SPACING.xxl, alignItems: 'center', paddingVertical: theme_1.SPACING.xxxl },
    connectIcon: { marginBottom: theme_1.SPACING.lg },
    connectTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h2), { color: colors.text, marginBottom: theme_1.SPACING.sm }),
    connectDesc: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textSecondary, textAlign: 'center' }),
    sectionTitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, marginTop: theme_1.SPACING.xxl, marginBottom: theme_1.SPACING.md }),
    // Now Playing
    nowPlayingCard: { marginTop: theme_1.SPACING.lg, padding: theme_1.SPACING.md },
    nowPlayingLabel: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: '#1DB954', marginBottom: theme_1.SPACING.sm, textTransform: 'uppercase', fontWeight: '700' }),
    nowPlayingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme_1.SPACING.md },
    nowPlayingArt: { width: 56, height: 56, borderRadius: 8 },
    nowPlayingTrack: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    nowPlayingArtist: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: theme_1.SPACING.xl },
    controlBtn: { padding: theme_1.SPACING.xs },
    playPauseBtn: { backgroundColor: '#1DB954', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', paddingLeft: 2 },
    // Playlists
    playlistCard: { marginBottom: theme_1.SPACING.sm },
    playlistRow: { flexDirection: 'row', alignItems: 'center' },
    playlistImage: { width: 50, height: 50, borderRadius: 8 },
    playlistIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    playlistInfo: { flex: 1, marginLeft: theme_1.SPACING.md },
    playlistName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: colors.text }),
    playlistMeta: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, marginTop: 2 }),
    playButton: {},
});
exports.default = SpotifyScreen;
