import { SupabaseService } from '@nextself/shared';
import { Linking, Platform } from 'react-native';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  previewUrl?: string;
  imageUrl?: string;
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: SpotifyTrack[];
  imageUrl?: string;
  uri: string;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private refreshToken: string | null = null;

  private constructor() { }

  public static getInstance(): SpotifyService {
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
  public async authenticate(): Promise<boolean> {
    try {
      const supabase = SupabaseService.getInstance().getClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          scopes: 'user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private',
          redirectTo: Platform.OS === 'web'
            ? window.location.origin
            : 'NextSelf://spotify-callback',
        },
      });

      if (error) {
        console.error('Spotify OAuth error:', error.message);
        return false;
      }

      // On web, signInWithOAuth opens a redirect. On native, we open the URL.
      if (data?.url && Platform.OS !== 'web') {
        await Linking.openURL(data.url);
      }

      // After redirect the session will contain provider_token
      return await this.loadTokenFromSession();
    } catch (error) {
      console.error('Spotify authentication failed:', error);
      return false;
    }
  }

  /**
   * Extract the Spotify access token from the current Supabase session.
   */
  public async loadTokenFromSession(): Promise<boolean> {
    try {
      const supabase = SupabaseService.getInstance().getClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.provider_token) {
        this.accessToken = session.provider_token;
        this.refreshToken = session.provider_refresh_token ?? null;
        // provider_token typically expires in 1 hour
        this.tokenExpiresAt = Date.now() + 3500 * 1000;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load Spotify token from session:', error);
      return false;
    }
  }

  /** Ensure token is valid before API calls */
  private async ensureToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }
    // Refresh 60s before expiry
    if (Date.now() > this.tokenExpiresAt - 60000) {
      const refreshed = await this.loadTokenFromSession();
      if (!refreshed) {
        this.accessToken = null;
        throw new Error('Spotify token expired. Please re-authenticate.');
      }
    }
  }

  /** Generic Spotify API call with auth header */
  private async spotifyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    await this.ensureToken();

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (response.status === 204) return null;

    if (response.status === 401) {
      // Token expired, try refreshing once
      const refreshed = await this.loadTokenFromSession();
      if (refreshed) {
        const retryResponse = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });
        if (retryResponse.status === 204) return null;
        if (!retryResponse.ok) throw new Error(`Spotify API error: ${retryResponse.status}`);
        return retryResponse.json();
      }
      this.accessToken = null;
      throw new Error('Spotify session expired');
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  public async getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
    try {
      const data = await this.spotifyFetch<any>('/me/player/currently-playing');
      if (!data?.item) return null;

      const item = data.item;
      return {
        id: item.id,
        name: item.name,
        artist: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        album: item.album?.name || '',
        duration: item.duration_ms || 0,
        imageUrl: item.album?.images?.[0]?.url,
        uri: item.uri,
      };
    } catch (error) {
      console.error('Failed to get currently playing:', error);
      return null;
    }
  }

  public async pausePlayback(): Promise<void> {
    await this.spotifyFetch('/me/player/pause', { method: 'PUT' });
  }

  public async resumePlayback(): Promise<void> {
    await this.spotifyFetch('/me/player/play', { method: 'PUT' });
  }

  public async skipToNext(): Promise<void> {
    await this.spotifyFetch('/me/player/next', { method: 'POST' });
  }

  public async skipToPrevious(): Promise<void> {
    await this.spotifyFetch('/me/player/previous', { method: 'POST' });
  }

  public async setVolume(volume: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    await this.spotifyFetch(`/me/player/volume?volume_percent=${clamped}`, { method: 'PUT' });
  }

  public async playTrack(trackUri: string): Promise<void> {
    await this.spotifyFetch('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
    });
  }

  public async playPlaylist(playlistUri: string): Promise<void> {
    await this.spotifyFetch('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({ context_uri: playlistUri }),
    });
  }

  public async getWorkoutPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      // Search Spotify for workout playlists
      const data = await this.spotifyFetch<any>(
        '/search?q=workout&type=playlist&limit=10'
      );
      if (!data?.playlists?.items) return [];

      return data.playlists.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        tracks: [],
        imageUrl: p.images?.[0]?.url,
        uri: p.uri,
      }));
    } catch (error) {
      console.error('Failed to get workout playlists:', error);
      return [];
    }
  }

  public async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const data = await this.spotifyFetch<any>('/me/playlists?limit=20');
      if (!data?.items) return [];

      return data.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        tracks: [],
        imageUrl: p.images?.[0]?.url,
        uri: p.uri,
      }));
    } catch (error) {
      console.error('Failed to get user playlists:', error);
      return [];
    }
  }

  public async searchTracks(query: string): Promise<SpotifyTrack[]> {
    if (!query.trim()) return [];
    try {
      const encoded = encodeURIComponent(query.trim());
      const data = await this.spotifyFetch<any>(
        `/search?q=${encoded}&type=track&limit=10`
      );
      if (!data?.tracks?.items) return [];

      return data.tracks.items.map((t: any) => ({
        id: t.id,
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        album: t.album?.name || '',
        duration: t.duration_ms || 0,
        imageUrl: t.album?.images?.[0]?.url,
        uri: t.uri,
      }));
    } catch (error) {
      console.error('Failed to search tracks:', error);
      return [];
    }
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiresAt;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Disconnect Spotify by clearing tokens */
  public disconnect(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
  }
}
