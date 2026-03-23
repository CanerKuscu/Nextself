import { SupabaseService } from '@nextself/shared';

const supabase = SupabaseService.getInstance().getClient();

// Sanitize user input for PostgREST .or() filters to prevent injection
function sanitizePostgrestValue(input: string): string {
    return input.replace(/[%_,().\\]/g, '');
}

export interface UserProfile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    level: number;
    xp: number;
    streak: number;
    followers_count: number;
    following_count: number;
    created_at: string;
}

export interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    current_streak?: number;
    longest_streak?: number;
    last_streak_date?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'steps' | 'calories' | 'workout' | 'nutrition' | 'streak';
    target_value: number;
    unit: string;
    start_date: string;
    end_date: string;
    created_by: string;
    participants_count: number;
    is_public: boolean;
    created_at: string;
}

export interface ChallengeParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    current_value: number;
    completed: boolean;
    rank: number;
    joined_at: string;
    updated_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string;
    score: number;
    rank: number;
    level: number;
    streak: number;
}

export class SocialService {
    /**
     * Search for users by username or name
     */
    static async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
        try {
            const sanitized = sanitizePostgrestValue(query);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    /**
     * Get user profile by ID
     */
    static async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    /**
     * Send friend request
     */
    static async sendFriendRequest(userId: string, friendId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('friendships')
                .insert({
                    user_id: userId,
                    friend_id: friendId,
                    status: 'pending'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error sending friend request:', error);
            return false;
        }
    }

    /**
     * Accept friend request
     */
    static async acceptFriendRequest(friendshipId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('friendships')
                .update({ status: 'accepted', updated_at: new Date().toISOString() })
                .eq('id', friendshipId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return false;
        }
    }

    /**
     * Reject friend request
     */
    static async rejectFriendRequest(friendshipId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('friendships')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', friendshipId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            return false;
        }
    }

    /**
     * Get user's friends
     */
    static async getUserFriends(userId: string, status: 'pending' | 'accepted' = 'accepted'): Promise<Friendship[]> {
        try {
            const { data, error } = await supabase
                .from('friendships')
                .select('*')
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                .eq('status', status);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user friends:', error);
            return [];
        }
    }

    /**
     * Create a new challenge
     */
    static async createChallenge(challenge: Omit<Challenge, 'id' | 'created_at' | 'participants_count'>): Promise<Challenge | null> {
        try {
            const { data, error } = await supabase
                .from('challenges')
                .insert({
                    ...challenge,
                    participants_count: 1
                })
                .select()
                .single();

            if (error) throw error;

            // Auto-join the creator
            await this.joinChallenge(data.id, challenge.created_by);

            return data;
        } catch (error) {
            console.error('Error creating challenge:', error);
            return null;
        }
    }

    /**
     * Join a challenge
     */
    static async joinChallenge(challengeId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('challenge_participants')
                .insert({
                    challenge_id: challengeId,
                    user_id: userId,
                    current_value: 0,
                    completed: false,
                    rank: 0
                });

            if (error) throw error;

            // Update participants count
            await supabase.rpc('increment_challenge_participants', { challenge_id: challengeId });

            return true;
        } catch (error) {
            console.error('Error joining challenge:', error);
            return false;
        }
    }

    /**
     * Update challenge progress
     */
    static async updateChallengeProgress(participantId: string, currentValue: number): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('challenge_participants')
                .update({
                    current_value: currentValue,
                    updated_at: new Date().toISOString()
                })
                .eq('id', participantId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating challenge progress:', error);
            return false;
        }
    }

    /**
     * Get active challenges
     */
    static async getActiveChallenges(userId?: string, limit: number = 20): Promise<Challenge[]> {
        try {
            let query = supabase
                .from('challenges')
                .select('*')
                .gte('end_date', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            if (userId) {
                query = query.eq('created_by', userId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting active challenges:', error);
            return [];
        }
    }

    /**
     * Get challenge leaderboard
     */
    static async getChallengeLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
        try {
            const { data, error } = await supabase
                .from('challenge_participants')
                .select(`
          id,
          current_value,
          completed,
          rank,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            level,
            streak
          )
        `)
                .eq('challenge_id', challengeId)
                .order('current_value', { ascending: false })
                .limit(50);

            if (error) throw error;

            return (data || []).map((participant: any, index: number) => ({
                user_id: participant.profiles.id,
                username: participant.profiles.username,
                avatar_url: participant.profiles.avatar_url,
                score: participant.current_value,
                rank: index + 1,
                level: participant.profiles.level,
                streak: participant.profiles.streak
            }));
        } catch (error) {
            console.error('Error getting challenge leaderboard:', error);
            return [];
        }
    }

    /**
     * Get global leaderboard
     */
    static async getGlobalLeaderboard(type: 'xp' | 'streak' | 'level', limit: number = 50): Promise<LeaderboardEntry[]> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, level, xp, streak')
                .order(type, { ascending: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map((profile: any, index: number) => ({
                user_id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                score: profile[type],
                rank: index + 1,
                level: profile.level,
                streak: profile.streak
            }));
        } catch (error) {
            console.error('Error getting global leaderboard:', error);
            return [];
        }
    }

    /**
     * Follow a user
     */
    static async followUser(followerId: string, followingId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: followerId,
                    following_id: followingId
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error following user:', error);
            return false;
        }
    }

    /**
     * Unfollow a user
     */
    static async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', followerId)
                .eq('following_id', followingId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return false;
        }
    }

    /**
     * Get user's followers
     */
    static async getUserFollowers(userId: string): Promise<UserProfile[]> {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio,
            level,
            xp,
            streak
          )
        `)
                .eq('following_id', userId);

            if (error) throw error;

            return (data || []).map((item: any) => item.follower);
        } catch (error) {
            console.error('Error getting user followers:', error);
            return [];
        }
    }

    /**
     * Get users that a user is following
     */
    static async getUserFollowing(userId: string): Promise<UserProfile[]> {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          following:profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio,
            level,
            xp,
            streak
          )
        `)
                .eq('follower_id', userId);

            if (error) throw error;

            return (data || []).map((item: any) => item.following);
        } catch (error) {
            console.error('Error getting user following:', error);
            return [];
        }
    }

    /**
     * Share achievement or progress
     */
    static async shareAchievement(userId: string, type: string, data: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('social_posts')
                .insert({
                    user_id: userId,
                    type,
                    data,
                    likes_count: 0,
                    comments_count: 0
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error sharing achievement:', error);
            return false;
        }
    }

    /**
     * Like a post
     */
    static async likePost(postId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: userId
                });

            if (error) throw error;

            // Update likes count
            await supabase.rpc('increment_post_likes', { post_id: postId });

            return true;
        } catch (error) {
            console.error('Error liking post:', error);
            return false;
        }
    }

    /**
     * Comment on a post
     */
    static async commentOnPost(postId: string, userId: string, content: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    user_id: userId,
                    content
                });

            if (error) throw error;

            // Update comments count
            await supabase.rpc('increment_post_comments', { post_id: postId });

            return true;
        } catch (error) {
            console.error('Error commenting on post:', error);
            return false;
        }
    }

    /**
     * Get user's feed (posts from followed users)
     */
    static async getUserFeed(userId: string, limit: number = 20): Promise<any[]> {
        try {
            // Get the list of followed user IDs first
            const { data: followsData } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId);

            const followingIds = followsData?.map(item => item.following_id) || [];

            // Guard: .in() with an empty array causes a PostgREST error
            if (followingIds.length === 0) return [];

            const { data, error } = await supabase
                .from('social_posts')
                .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
                .in('user_id', followingIds)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user feed:', error);
            return [];
        }
    }
}