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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_image_1 = require("expo-image"); // Use expo-image for better caching and performance
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const theme_1 = require("../config/theme");
const spotifyService_1 = require("../services/spotifyService");
const SpotifyPlayer = () => {
    const [currentTrack, setCurrentTrack] = (0, react_1.useState)(null);
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [connected, setConnected] = (0, react_1.useState)(false);
    const [playlists, setPlaylists] = (0, react_1.useState)([]);
    const [showPlaylists, setShowPlaylists] = (0, react_1.useState)(false);
    const spotifyService = spotifyService_1.SpotifyService.getInstance();
    (0, react_1.useEffect)(() => {
        // Try loading existing session token
        const init = () => __awaiter(void 0, void 0, void 0, function* () {
            const hasSession = spotifyService.isAuthenticated() || (yield spotifyService.loadTokenFromSession());
            setConnected(hasSession);
            if (hasSession) {
                loadCurrentTrack();
                loadPlaylists();
            }
        });
        init();
    }, []);
    (0, react_1.useEffect)(() => {
        if (!connected || !isPlaying)
            return;
        const interval = setInterval(loadCurrentTrack, 10000);
        return () => clearInterval(interval);
    }, [connected, isPlaying]);
    const loadPlaylists = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const fetchedPlaylists = yield spotifyService.getWorkoutPlaylists();
            if (fetchedPlaylists) {
                setPlaylists(fetchedPlaylists);
            }
        }
        catch (error) {
            console.error('Spotify load playlists error:', error);
        }
    });
    const loadCurrentTrack = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!spotifyService.isAuthenticated())
                return;
            const track = yield spotifyService.getCurrentlyPlaying();
            if (track) {
                setCurrentTrack(track);
            }
        }
        catch (error) {
            console.error('Spotify load track error:', error);
        }
    });
    const authenticate = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        const success = yield spotifyService.authenticate();
        if (success) {
            setConnected(true);
            yield loadCurrentTrack();
        }
        setLoading(false);
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
        catch (error) {
            console.error('Play/pause error:', error);
        }
    });
    const handleNext = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.skipToNext();
            setTimeout(loadCurrentTrack, 1000);
        }
        catch (error) {
            console.error('Skip to next error:', error);
        }
    });
    const handlePrev = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.skipToPrevious();
            setTimeout(loadCurrentTrack, 1000);
        }
        catch (error) {
            console.error('Skip to previous error:', error);
        }
    });
    const openApp = () => {
        if (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.uri) {
            react_native_1.Linking.openURL(currentTrack.uri).catch(() => {
                // App not installed probably
                react_native_1.Linking.openURL('https://open.spotify.com');
            });
        }
    };
    const handlePlayPlaylist = (uri) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield spotifyService.playPlaylist(uri);
            setIsPlaying(true);
            setTimeout(loadCurrentTrack, 1500);
        }
        catch (error) {
            console.error('Play playlist error:', error);
        }
    });
    if (loading) {
        return (<react_native_1.View style={styles.container}>
                <react_native_1.ActivityIndicator color={theme_1.COLORS.success}/>
            </react_native_1.View>);
    }
    if (!connected) {
        return (<react_native_1.TouchableOpacity activeOpacity={0.8} style={styles.container} onPress={authenticate}>
                <expo_linear_gradient_1.LinearGradient colors={['#1DB954', '#191414']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.connectGradient}>
                    <vector_icons_1.Ionicons name="musical-notes" size={24} color="#fff"/>
                    <react_native_1.Text style={styles.connectText}>Connect to Spotify</react_native_1.Text>
                </expo_linear_gradient_1.LinearGradient>
            </react_native_1.TouchableOpacity>);
    }
    return (<react_native_1.View style={styles.playerCard}>
            <react_native_1.View style={styles.trackInfoContainer}>
                {(currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.imageUrl) ? (<expo_image_1.Image source={{ uri: currentTrack.imageUrl }} style={styles.albumArt} contentFit="cover" cachePolicy="memory-disk" transition={500}/>) : (<react_native_1.View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                        <vector_icons_1.Ionicons name="musical-note" size={24} color={theme_1.COLORS.textTertiary}/>
                    </react_native_1.View>)}

                <react_native_1.View style={styles.textContainer}>
                    <react_native_1.Text style={styles.trackName} numberOfLines={1}>
                        {currentTrack ? currentTrack.name : 'Not Playing'}
                    </react_native_1.Text>
                    <react_native_1.Text style={styles.artistName} numberOfLines={1}>
                        {currentTrack ? currentTrack.artist : 'Select a playlist'}
                    </react_native_1.Text>
                </react_native_1.View>

                <react_native_1.TouchableOpacity onPress={openApp} style={styles.spotifyLogo}>
                    <vector_icons_1.Ionicons name="musical-notes" size={24} color="#1DB954"/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.View style={styles.controlsContainer}>
                <react_native_1.TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
                    <vector_icons_1.Ionicons name="play-skip-back" size={24} color={theme_1.COLORS.text}/>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity onPress={handlePlayPause} style={[styles.controlBtn, styles.playPauseBtn]}>
                    <vector_icons_1.Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff"/>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
                    <vector_icons_1.Ionicons name="play-skip-forward" size={24} color={theme_1.COLORS.text}/>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>
            
            {playlists.length > 0 && (<react_native_1.View style={{ marginTop: theme_1.SPACING.md }}>
                    <react_native_1.TouchableOpacity onPress={() => setShowPlaylists(!showPlaylists)} style={styles.playlistToggleBtn}>
                        <react_native_1.Text style={styles.playlistToggleText}>
                            {showPlaylists ? 'Hide Workout Playlists' : 'Show Workout Playlists'}
                        </react_native_1.Text>
                        <vector_icons_1.Ionicons name={showPlaylists ? "chevron-up" : "chevron-down"} size={16} color={theme_1.COLORS.textSecondary}/>
                    </react_native_1.TouchableOpacity>
                    
                    {showPlaylists && (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playlistScroll}>
                            {playlists.map((playlist, index) => (<react_native_1.TouchableOpacity key={`${playlist.id}-${index}`} style={styles.playlistCard} onPress={() => handlePlayPlaylist(playlist.uri)}>
                                    {playlist.imageUrl ? (<expo_image_1.Image source={{ uri: playlist.imageUrl }} style={styles.playlistImage} contentFit="cover"/>) : (<react_native_1.View style={[styles.playlistImage, styles.albumArtPlaceholder]}>
                                            <vector_icons_1.Ionicons name="musical-notes" size={20} color={theme_1.COLORS.textTertiary}/>
                                        </react_native_1.View>)}
                                    <react_native_1.Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</react_native_1.Text>
                                </react_native_1.TouchableOpacity>))}
                        </react_native_1.ScrollView>)}
                </react_native_1.View>)}
        </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: theme_1.BORDER_RADIUS.xl,
        overflow: 'hidden',
        marginBottom: theme_1.SPACING.md,
    },
    connectGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme_1.SPACING.md,
        paddingHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    connectText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: '#fff' }),
    playerCard: Object.assign({ backgroundColor: theme_1.COLORS.surfaceSecondary, borderRadius: theme_1.BORDER_RADIUS.xl, padding: theme_1.SPACING.md, marginBottom: theme_1.SPACING.md }, theme_1.SHADOWS.sm),
    trackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.md,
    },
    albumArt: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    albumArtPlaceholder: {
        backgroundColor: theme_1.COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: theme_1.SPACING.md,
        marginRight: theme_1.SPACING.sm,
    },
    trackName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.bodyBold), { color: theme_1.COLORS.text }),
    artistName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.small), { color: theme_1.COLORS.textSecondary, marginTop: 2 }),
    spotifyLogo: {
        padding: theme_1.SPACING.xs,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme_1.SPACING.xl,
    },
    controlBtn: {
        padding: theme_1.SPACING.xs,
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
        paddingVertical: theme_1.SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: theme_1.COLORS.border,
    },
    playlistToggleText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.smallBold), { color: theme_1.COLORS.textSecondary }),
    playlistScroll: {
        gap: theme_1.SPACING.md,
        paddingTop: theme_1.SPACING.sm,
    },
    playlistCard: {
        width: 100,
        marginRight: theme_1.SPACING.sm,
    },
    playlistImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginBottom: theme_1.SPACING.xs,
    },
    playlistName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.smallBold), { color: theme_1.COLORS.text, textAlign: 'center' })
});
exports.default = SpotifyPlayer;
