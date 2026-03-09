import { SupabaseService } from './supabase';

const supabase = SupabaseService.getInstance().getClient();

// Sanitize user input for PostgREST .or() filters to prevent injection
function sanitizePostgrestValue(input: string): string {
    return input.replace(/[%_,().\\]/g, '');
}

export interface VideoContent {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    duration_seconds: number;
    category: 'workout' | 'nutrition' | 'education' | 'motivation' | 'recovery';
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    instructor_id: string;
    instructor_name: string;
    instructor_avatar: string;
    views_count: number;
    likes_count: number;
    comments_count: number;
    is_premium: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface VideoProgress {
    id: string;
    user_id: string;
    video_id: string;
    progress_seconds: number;
    total_seconds: number;
    completed: boolean;
    last_watched_at: string;
    created_at: string;
    updated_at: string;
}

export interface VideoComment {
    id: string;
    video_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    likes_count: number;
    replies_count: number;
    created_at: string;
    updated_at: string;
}

export interface VideoPlaylist {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    creator_id: string;
    creator_name: string;
    videos_count: number;
    is_public: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export class VideoContentService {
    /**
     * Get videos by category
     */
    static async getVideosByCategory(
        category: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<VideoContent[]> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('category', category)
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting videos by category:', error);
            return [];
        }
    }

    /**
     * Get recommended videos for user
     */
    static async getRecommendedVideos(
        userId: string,
        limit: number = 10
    ): Promise<VideoContent[]> {
        try {
            // Get user's watched videos and preferences
            const watchedVideos = await this.getUserWatchedVideos(userId, 30);
            const userPreferences = await this.getUserPreferences(userId);

            // Build recommendation query based on user history and preferences
            let query = supabase
                .from('videos')
                .select('*')
                .eq('is_published', true)
                .not('id', 'in', `(${watchedVideos.map(v => v.video_id).join(',') || '0'})`);

            // Filter by user preferences if available
            if (userPreferences?.preferred_categories?.length > 0) {
                query = query.in('category', userPreferences.preferred_categories);
            }

            if (userPreferences?.preferred_difficulty) {
                query = query.eq('difficulty_level', userPreferences.preferred_difficulty);
            }

            const { data, error } = await query
                .order('views_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting recommended videos:', error);
            return [];
        }
    }

    /**
     * Search videos
     */
    static async searchVideos(
        query: string,
        filters: {
            category?: string;
            difficulty?: string;
            duration_min?: number;
            duration_max?: number;
            is_premium?: boolean;
        } = {},
        limit: number = 20,
        offset: number = 0
    ): Promise<VideoContent[]> {
        try {
            let supabaseQuery = supabase
                .from('videos')
                .select('*')
                .eq('is_published', true)
                .or(`title.ilike.%${sanitizePostgrestValue(query)}%,description.ilike.%${sanitizePostgrestValue(query)}%`);

            // Apply filters
            if (filters.category) {
                supabaseQuery = supabaseQuery.eq('category', filters.category);
            }

            if (filters.difficulty) {
                supabaseQuery = supabaseQuery.eq('difficulty_level', filters.difficulty);
            }

            if (filters.duration_min !== undefined) {
                supabaseQuery = supabaseQuery.gte('duration_seconds', filters.duration_min);
            }

            if (filters.duration_max !== undefined) {
                supabaseQuery = supabaseQuery.lte('duration_seconds', filters.duration_max);
            }

            if (filters.is_premium !== undefined) {
                supabaseQuery = supabaseQuery.eq('is_premium', filters.is_premium);
            }

            const { data, error } = await supabaseQuery
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching videos:', error);
            return [];
        }
    }

    /**
     * Get video by ID
     */
    static async getVideoById(videoId: string): Promise<VideoContent | null> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .eq('is_published', true)
                .single();

            if (error) throw error;

            // Increment view count
            await this.incrementViewCount(videoId);

            return data;
        } catch (error) {
            console.error('Error getting video by ID:', error);
            return null;
        }
    }

    /**
     * Get video progress for user
     */
    static async getVideoProgress(
        userId: string,
        videoId: string
    ): Promise<VideoProgress | null> {
        try {
            const { data, error } = await supabase
                .from('video_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('video_id', videoId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
            return data;
        } catch (error) {
            console.error('Error getting video progress:', error);
            return null;
        }
    }

    /**
     * Save video progress
     */
    static async saveVideoProgress(
        userId: string,
        videoId: string,
        progressSeconds: number,
        totalSeconds: number
    ): Promise<boolean> {
        try {
            const completed = progressSeconds >= totalSeconds * 0.95; // 95% watched considered complete

            const { error } = await supabase
                .from('video_progress')
                .upsert({
                    user_id: userId,
                    video_id: videoId,
                    progress_seconds: progressSeconds,
                    total_seconds: totalSeconds,
                    completed,
                    last_watched_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,video_id'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving video progress:', error);
            return false;
        }
    }

    /**
     * Like a video
     */
    static async likeVideo(userId: string, videoId: string): Promise<boolean> {
        try {
            // Check if already liked
            const { data: existingLike, error: checkError } = await supabase
                .from('video_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('video_id', videoId)
                .single();

            if (checkError && checkError.code === 'PGRST116') {
                // No existing like found (PGRST116 = no rows), add like
                const { error: insertError } = await supabase
                    .from('video_likes')
                    .insert({
                        user_id: userId,
                        video_id: videoId
                    });

                if (insertError) throw insertError;

                // Increment likes count
                await this.incrementLikesCount(videoId);
            } else if (!checkError && existingLike) {
                // Already liked, unlike
                const { error: deleteError } = await supabase
                    .from('video_likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('video_id', videoId);

                if (deleteError) throw deleteError;

                // Decrement likes count
                await this.decrementLikesCount(videoId);
            } else if (checkError) {
                throw checkError;
            }

            return true;
        } catch (error) {
            console.error('Error liking video:', error);
            return false;
        }
    }

    /**
     * Check if user liked a video
     */
    static async hasUserLikedVideo(userId: string, videoId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('video_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('video_id', videoId)
                .single();

            return !error && data !== null;
        } catch (error) {
            console.error('Error checking if user liked video:', error);
            return false;
        }
    }

    /**
     * Add video comment
     */
    static async addComment(
        userId: string,
        videoId: string,
        content: string
    ): Promise<VideoComment | null> {
        try {
            // Get user profile for name and avatar
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            const { data, error } = await supabase
                .from('video_comments')
                .insert({
                    video_id: videoId,
                    user_id: userId,
                    user_name: userProfile.username,
                    user_avatar: userProfile.avatar_url,
                    content,
                    likes_count: 0,
                    replies_count: 0
                })
                .select()
                .single();

            if (error) throw error;

            // Increment comments count
            await this.incrementCommentsCount(videoId);

            return data;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    }

    /**
     * Get video comments
     */
    static async getComments(
        videoId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<VideoComment[]> {
        try {
            const { data, error } = await supabase
                .from('video_comments')
                .select('*')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    }

    /**
     * Like a comment
     */
    static async likeComment(userId: string, commentId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('comment_likes')
                .insert({
                    user_id: userId,
                    comment_id: commentId
                });

            if (error) throw error;

            // Increment comment likes count
            await supabase.rpc('increment_comment_likes', { comment_id: commentId });

            return true;
        } catch (error) {
            console.error('Error liking comment:', error);
            return false;
        }
    }

    /**
     * Create playlist
     */
    static async createPlaylist(
        userId: string,
        title: string,
        description: string,
        isPublic: boolean = true,
        tags: string[] = []
    ): Promise<VideoPlaylist | null> {
        try {
            // Get user profile for creator name
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            const { data, error } = await supabase
                .from('video_playlists')
                .insert({
                    title,
                    description,
                    thumbnail_url: '', // Will be set when videos are added
                    creator_id: userId,
                    creator_name: userProfile.username,
                    videos_count: 0,
                    is_public: isPublic,
                    tags
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    }

    /**
     * Add video to playlist
     */
    static async addVideoToPlaylist(
        playlistId: string,
        videoId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('playlist_videos')
                .insert({
                    playlist_id: playlistId,
                    video_id: videoId,
                    position: await this.getNextPlaylistPosition(playlistId)
                });

            if (error) throw error;

            // Update playlist videos count
            await supabase.rpc('increment_playlist_videos', { playlist_id: playlistId });

            // Update playlist thumbnail if first video
            const playlist = await this.getPlaylist(playlistId);
            if (playlist && !playlist.thumbnail_url) {
                const video = await this.getVideoById(videoId);
                if (video) {
                    await supabase
                        .from('video_playlists')
                        .update({ thumbnail_url: video.thumbnail_url })
                        .eq('id', playlistId);
                }
            }

            return true;
        } catch (error) {
            console.error('Error adding video to playlist:', error);
            return false;
        }
    }

    /**
     * Get user's playlists
     */
    static async getUserPlaylists(
        userId: string,
        includePrivate: boolean = true
    ): Promise<VideoPlaylist[]> {
        try {
            let query = supabase
                .from('video_playlists')
                .select('*')
                .eq('creator_id', userId);

            if (!includePrivate) {
                query = query.eq('is_public', true);
            }

            const { data, error } = await query.order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user playlists:', error);
            return [];
        }
    }

    /**
     * Get playlist with videos
     */
    static async getPlaylistWithVideos(playlistId: string): Promise<{
        playlist: VideoPlaylist | null;
        videos: VideoContent[];
    }> {
        try {
            // Get playlist
            const { data: playlist, error: playlistError } = await supabase
                .from('video_playlists')
                .select('*')
                .eq('id', playlistId)
                .single();

            if (playlistError) throw playlistError;

            // Get playlist videos
            const { data: playlistVideos, error: videosError } = await supabase
                .from('playlist_videos')
                .select('video_id, position')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true });

            if (videosError) throw videosError;

            // Get video details
            const videoIds = playlistVideos.map(pv => pv.video_id);
            const { data: videos, error: videosDetailsError } = await supabase
                .from('videos')
                .select('*')
                .in('id', videoIds)
                .eq('is_published', true);

            if (videosDetailsError) throw videosDetailsError;

            // Sort videos by playlist position
            const sortedVideos = videos?.sort((a, b) => {
                const aPos = playlistVideos.find(pv => pv.video_id === a.id)?.position || 0;
                const bPos = playlistVideos.find(pv => pv.video_id === b.id)?.position || 0;
                return aPos - bPos;
            }) || [];

            return {
                playlist,
                videos: sortedVideos
            };
        } catch (error) {
            console.error('Error getting playlist with videos:', error);
            return { playlist: null, videos: [] };
        }
    }

    /**
     * Get trending videos
     */
    static async getTrendingVideos(
        period: 'day' | 'week' | 'month' = 'week',
        limit: number = 10
    ): Promise<VideoContent[]> {
        try {
            const startDate = new Date();
            switch (period) {
                case 'day':
                    startDate.setDate(startDate.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
            }

            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('is_published', true)
                .gte('created_at', startDate.toISOString())
                .order('views_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting trending videos:', error);
            return [];
        }
    }

    /**
     * Get user's watched history
     */
    static async getUserWatchedVideos(
        userId: string,
        limit: number = 20
    ): Promise<VideoProgress[]> {
        try {
            const { data, error } = await supabase
                .from('video_progress')
                .select('*')
                .eq('user_id', userId)
                .order('last_watched_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user watched videos:', error);
            return [];
        }
    }

    /**
     * Get user preferences
     */
    private static async getUserPreferences(userId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return null;
        }
    }

    /**
     * Get playlist
     */
    private static async getPlaylist(playlistId: string): Promise<VideoPlaylist | null> {
        try {
            const { data, error } = await supabase
                .from('video_playlists')
                .select('*')
                .eq('id', playlistId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting playlist:', error);
            return null;
        }
    }

    /**
     * Get next playlist position
     */
    private static async getNextPlaylistPosition(playlistId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('playlist_videos')
                .select('position')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data && data.length > 0 ? data[0].position + 1 : 1;
        } catch (error) {
            console.error('Error getting next playlist position:', error);
            return 1;
        }
    }

    /**
     * Increment view count
     */
    private static async incrementViewCount(videoId: string): Promise<void> {
        try {
            await supabase.rpc('increment_video_views', { video_id: videoId });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }

    /**
     * Increment likes count
     */
    private static async incrementLikesCount(videoId: string): Promise<void> {
        try {
            await supabase.rpc('increment_video_likes', { video_id: videoId });
        } catch (error) {
            console.error('Error incrementing likes count:', error);
        }
    }

    /**
     * Decrement likes count
     */
    private static async decrementLikesCount(videoId: string): Promise<void> {
        try {
            await supabase.rpc('decrement_video_likes', { video_id: videoId });
        } catch (error) {
            console.error('Error decrementing likes count:', error);
        }
    }

    /**
     * Increment comments count
     */
    private static async incrementCommentsCount(videoId: string): Promise<void> {
        try {
            await supabase.rpc('increment_video_comments', { video_id: videoId });
        } catch (error) {
            console.error('Error incrementing comments count:', error);
        }
    }

    /**
     * Get related videos
     */
    static async getRelatedVideos(
        videoId: string,
        limit: number = 5
    ): Promise<VideoContent[]> {
        try {
            // Get current video to find related content
            const currentVideo = await this.getVideoById(videoId);
            if (!currentVideo) return [];

            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('is_published', true)
                .eq('category', currentVideo.category)
                .neq('id', videoId)
                .order('views_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting related videos:', error);
            return [];
        }
    }

    /**
     * Get videos by instructor
     */
    static async getVideosByInstructor(
        instructorId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<VideoContent[]> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('instructor_id', instructorId)
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting videos by instructor:', error);
            return [];
        }
    }

    /**
     * Get recently uploaded videos
     */
    static async getRecentlyUploadedVideos(
        limit: number = 10
    ): Promise<VideoContent[]> {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting recently uploaded videos:', error);
            return [];
        }
    }

    /**
     * Get popular instructors
     */
    static async getPopularInstructors(limit: number = 10): Promise<any[]> {
        try {
            // Get all videos and group by instructor manually
            const { data: videos, error } = await supabase
                .from('videos')
                .select('instructor_id, instructor_name, instructor_avatar')
                .eq('is_published', true)
                .limit(100); // Get enough to find popular instructors

            if (error) throw error;

            // Group by instructor and count videos
            const instructorMap = new Map();
            videos?.forEach(video => {
                const key = video.instructor_id;
                if (!instructorMap.has(key)) {
                    instructorMap.set(key, {
                        instructor_id: video.instructor_id,
                        instructor_name: video.instructor_name,
                        instructor_avatar: video.instructor_avatar,
                        video_count: 0
                    });
                }
                const instructor = instructorMap.get(key);
                instructor.video_count++;
            });

            // Convert to array and sort by video count
            const instructors = Array.from(instructorMap.values())
                .sort((a, b) => b.video_count - a.video_count)
                .slice(0, limit);

            return instructors;
        } catch (error) {
            console.error('Error getting popular instructors:', error);
            return [];
        }
    }

    /**
     * Get video statistics
     */
    static async getVideoStatistics(videoId: string): Promise<any> {
        try {
            const video = await this.getVideoById(videoId);
            if (!video) return null;

            const { data: progressData, error: progressError } = await supabase
                .from('video_progress')
                .select('completed')
                .eq('video_id', videoId);

            if (progressError) throw progressError;

            const completedCount = progressData?.filter(p => p.completed).length || 0;
            const totalWatchedCount = progressData?.length || 0;

            return {
                video_id: videoId,
                views_count: video.views_count,
                likes_count: video.likes_count,
                comments_count: video.comments_count,
                completed_count: completedCount,
                total_watched_count: totalWatchedCount,
                completion_rate: totalWatchedCount > 0 ? (completedCount / totalWatchedCount) * 100 : 0
            };
        } catch (error) {
            console.error('Error getting video statistics:', error);
            return null;
        }
    }

    /**
     * Remove video from playlist
     */
    static async removeVideoFromPlaylist(
        playlistId: string,
        videoId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('playlist_videos')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('video_id', videoId);

            if (error) throw error;

            // Update playlist videos count
            await supabase.rpc('decrement_playlist_videos', { playlist_id: playlistId });

            return true;
        } catch (error) {
            console.error('Error removing video from playlist:', error);
            return false;
        }
    }

    /**
     * Delete playlist
     */
    static async deletePlaylist(playlistId: string): Promise<boolean> {
        try {
            // First delete all playlist videos
            const { error: videosError } = await supabase
                .from('playlist_videos')
                .delete()
                .eq('playlist_id', playlistId);

            if (videosError) throw videosError;

            // Then delete the playlist
            const { error } = await supabase
                .from('video_playlists')
                .delete()
                .eq('id', playlistId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return false;
        }
    }

    /**
     * Update playlist
     */
    static async updatePlaylist(
        playlistId: string,
        updates: Partial<VideoPlaylist>
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('video_playlists')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', playlistId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating playlist:', error);
            return false;
        }
    }

    /**
     * Reorder playlist videos
     */
    static async reorderPlaylistVideos(
        playlistId: string,
        videoOrder: { video_id: string; position: number }[]
    ): Promise<boolean> {
        try {
            // Update each video position
            for (const item of videoOrder) {
                const { error } = await supabase
                    .from('playlist_videos')
                    .update({ position: item.position })
                    .eq('playlist_id', playlistId)
                    .eq('video_id', item.video_id);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error reordering playlist videos:', error);
            return false;
        }
    }
}
