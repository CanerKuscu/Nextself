"use strict";
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
exports.SpotifyService = void 0;
const supabase_1 = require("./supabase");
const react_native_1 = require("react-native");
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
class SpotifyService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.refreshToken = null;
    }
    static getInstance() {
        if (!SpotifyService.instance) {
            SpotifyService.instance = new SpotifyService();
        }
        return SpotifyService.instance;
    }
    /**
     * Authenticate via Supabase's Spotify OAuth provider.
     * After successful sign-in, the provider_token (Spotify access token)
     * is available on the Supabase session.
     */
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data, error } = yield supabase.auth.signInWithOAuth({
                    provider: 'spotify',
                    options: {
                        scopes: 'user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private',
                        redirectTo: react_native_1.Platform.OS === 'web'
                            ? window.location.origin
                            : 'NextSelf://spotify-callback',
                    },
                });
                if (error) {
                    console.error('Spotify OAuth error:', error.message);
                    return false;
                }
                // On web, signInWithOAuth opens a redirect. On native, we open the URL.
                if ((data === null || data === void 0 ? void 0 : data.url) && react_native_1.Platform.OS !== 'web') {
                    yield react_native_1.Linking.openURL(data.url);
                }
                // After redirect the session will contain provider_token
                return yield this.loadTokenFromSession();
            }
            catch (error) {
                console.error('Spotify authentication failed:', error);
                return false;
            }
        });
    }
    /**
     * Extract the Spotify access token from the current Supabase session.
     */
    loadTokenFromSession() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data: { session } } = yield supabase.auth.getSession();
                if (session === null || session === void 0 ? void 0 : session.provider_token) {
                    this.accessToken = session.provider_token;
                    this.refreshToken = (_a = session.provider_refresh_token) !== null && _a !== void 0 ? _a : null;
                    // provider_token typically expires in 1 hour
                    this.tokenExpiresAt = Date.now() + 3500 * 1000;
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error('Failed to load Spotify token from session:', error);
                return false;
            }
        });
    }
    /** Ensure token is valid before API calls */
    ensureToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.accessToken) {
                throw new Error('Not authenticated with Spotify');
            }
            // Refresh 60s before expiry
            if (Date.now() > this.tokenExpiresAt - 60000) {
                const refreshed = yield this.loadTokenFromSession();
                if (!refreshed) {
                    this.accessToken = null;
                    throw new Error('Spotify token expired. Please re-authenticate.');
                }
            }
        });
    }
    /** Generic Spotify API call with auth header */
    spotifyFetch(endpoint_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, options = {}) {
            yield this.ensureToken();
            const response = yield fetch(`${SPOTIFY_API_BASE}${endpoint}`, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, (options.headers || {})) }));
            if (response.status === 204)
                return null;
            if (response.status === 401) {
                // Token expired, try refreshing once
                const refreshed = yield this.loadTokenFromSession();
                if (refreshed) {
                    const retryResponse = yield fetch(`${SPOTIFY_API_BASE}${endpoint}`, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }, (options.headers || {})) }));
                    if (retryResponse.status === 204)
                        return null;
                    if (!retryResponse.ok)
                        throw new Error(`Spotify API error: ${retryResponse.status}`);
                    return retryResponse.json();
                }
                this.accessToken = null;
                throw new Error('Spotify session expired');
            }
            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }
            return response.json();
        });
    }
    getCurrentlyPlaying() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const data = yield this.spotifyFetch('/me/player/currently-playing');
                if (!(data === null || data === void 0 ? void 0 : data.item))
                    return null;
                const item = data.item;
                return {
                    id: item.id,
                    name: item.name,
                    artist: ((_a = item.artists) === null || _a === void 0 ? void 0 : _a.map((a) => a.name).join(', ')) || 'Unknown',
                    album: ((_b = item.album) === null || _b === void 0 ? void 0 : _b.name) || '',
                    duration: item.duration_ms || 0,
                    imageUrl: (_e = (_d = (_c = item.album) === null || _c === void 0 ? void 0 : _c.images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url,
                    uri: item.uri,
                };
            }
            catch (error) {
                console.error('Failed to get currently playing:', error);
                return null;
            }
        });
    }
    pausePlayback() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/pause', { method: 'PUT' });
        });
    }
    resumePlayback() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/play', { method: 'PUT' });
        });
    }
    skipToNext() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/next', { method: 'POST' });
        });
    }
    skipToPrevious() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/previous', { method: 'POST' });
        });
    }
    setVolume(volume) {
        return __awaiter(this, void 0, void 0, function* () {
            const clamped = Math.max(0, Math.min(100, Math.round(volume)));
            yield this.spotifyFetch(`/me/player/volume?volume_percent=${clamped}`, { method: 'PUT' });
        });
    }
    playTrack(trackUri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/play', {
                method: 'PUT',
                body: JSON.stringify({ uris: [trackUri] }),
            });
        });
    }
    playPlaylist(playlistUri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.spotifyFetch('/me/player/play', {
                method: 'PUT',
                body: JSON.stringify({ context_uri: playlistUri }),
            });
        });
    }
    getWorkoutPlaylists() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Search Spotify for workout playlists
                const data = yield this.spotifyFetch('/search?q=workout&type=playlist&limit=10');
                if (!((_a = data === null || data === void 0 ? void 0 : data.playlists) === null || _a === void 0 ? void 0 : _a.items))
                    return [];
                return data.playlists.items.map((p) => {
                    var _a, _b;
                    return ({
                        id: p.id,
                        name: p.name,
                        description: p.description || '',
                        tracks: [],
                        imageUrl: (_b = (_a = p.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                        uri: p.uri,
                    });
                });
            }
            catch (error) {
                console.error('Failed to get workout playlists:', error);
                return [];
            }
        });
    }
    getUserPlaylists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.spotifyFetch('/me/playlists?limit=20');
                if (!(data === null || data === void 0 ? void 0 : data.items))
                    return [];
                return data.items.map((p) => {
                    var _a, _b;
                    return ({
                        id: p.id,
                        name: p.name,
                        description: p.description || '',
                        tracks: [],
                        imageUrl: (_b = (_a = p.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                        uri: p.uri,
                    });
                });
            }
            catch (error) {
                console.error('Failed to get user playlists:', error);
                return [];
            }
        });
    }
    searchTracks(query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!query.trim())
                return [];
            try {
                const encoded = encodeURIComponent(query.trim());
                const data = yield this.spotifyFetch(`/search?q=${encoded}&type=track&limit=10`);
                if (!((_a = data === null || data === void 0 ? void 0 : data.tracks) === null || _a === void 0 ? void 0 : _a.items))
                    return [];
                return data.tracks.items.map((t) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: t.id,
                        name: t.name,
                        artist: ((_a = t.artists) === null || _a === void 0 ? void 0 : _a.map((a) => a.name).join(', ')) || 'Unknown',
                        album: ((_b = t.album) === null || _b === void 0 ? void 0 : _b.name) || '',
                        duration: t.duration_ms || 0,
                        imageUrl: (_e = (_d = (_c = t.album) === null || _c === void 0 ? void 0 : _c.images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url,
                        uri: t.uri,
                    });
                });
            }
            catch (error) {
                console.error('Failed to search tracks:', error);
                return [];
            }
        });
    }
    isAuthenticated() {
        return this.accessToken !== null && Date.now() < this.tokenExpiresAt;
    }
    getAccessToken() {
        return this.accessToken;
    }
    /** Disconnect Spotify by clearing tokens */
    disconnect() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = 0;
    }
}
exports.SpotifyService = SpotifyService;
