import { SupabaseService } from '@nextself/shared';
import { ValidationUtils } from '@nextself/shared';

const getSupabaseClient = () => SupabaseService.getInstance().getClient();
const supabase = {
    from: (...args: Parameters<ReturnType<typeof getSupabaseClient>['from']>) => getSupabaseClient().from(...args),
    rpc: (...args: Parameters<ReturnType<typeof getSupabaseClient>['rpc']>) => getSupabaseClient().rpc(...args),
    auth: {
        getUser: (...args: Parameters<ReturnType<typeof getSupabaseClient>['auth']['getUser']>) =>
            getSupabaseClient().auth.getUser(...args),
    },
};

// Track viewed topics per session to prevent view count inflation (Bounded cache to prevent memory leak)
const MAX_VIEWED_TOPICS = 1000;
const viewedTopicsThisSession = new Set<string>();
const viewedTopicsQueue: string[] = [];

function trackTopicView(topicId: string) {
    if (!viewedTopicsThisSession.has(topicId)) {
        viewedTopicsThisSession.add(topicId);
        viewedTopicsQueue.push(topicId);
        if (viewedTopicsQueue.length > MAX_VIEWED_TOPICS) {
            const oldest = viewedTopicsQueue.shift();
            if (oldest) viewedTopicsThisSession.delete(oldest);
        }
        return true; // Was newly added
    }
    return false; // Already viewed
}

// Sanitize user input for PostgREST .or() filters to prevent injection
function sanitizePostgrestValue(input: string): string {
    // Validate for SQL injection risks
    const validation = ValidationUtils.validateSQLInjection(input);
    if (!validation.isValid) {
        // If dangerous, return empty string to prevent injection
        return '';
    }
    // Escape LIKE wildcard characters to prevent LIKE injection
    return ValidationUtils.escapeLike(input);
}

export interface ForumCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    topics_count: number;
    posts_count: number;
    last_post_at: string;
    last_post_by: string;
    last_post_by_name: string;
    order: number;
    created_at: string;
}

export interface ForumTopic {
    id: string;
    category_id: string;
    title: string;
    content: string;
    author_id: string;
    author_name: string;
    author_avatar: string;
    views_count: number;
    replies_count: number;
    likes_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    is_featured: boolean;
    tags: string[];
    last_reply_at: string;
    last_reply_by: string;
    last_reply_by_name: string;
    created_at: string;
    updated_at: string;
}

export interface ForumPost {
    id: string;
    topic_id: string;
    content: string;
    author_id: string;
    author_name: string;
    author_avatar: string;
    likes_count: number;
    is_solution: boolean;
    parent_post_id?: string;
    mentions: string[];
    created_at: string;
    updated_at: string;
}

export interface ForumPoll {
    id: string;
    topic_id: string;
    question: string;
    options: PollOption[];
    is_multiple_choice: boolean;
    ends_at: string;
    total_votes: number;
    created_at: string;
}

export interface PollOption {
    id: string;
    text: string;
    votes_count: number;
    percentage: number;
}

export interface UserVote {
    id: string;
    user_id: string;
    poll_id: string;
    option_id: string;
    created_at: string;
}

export class CommunityForumService {
    /**
     * Get all forum categories
     */
    static async getCategories(): Promise<ForumCategory[]> {
        try {
            const { data, error } = await supabase
                .from('forum_categories')
                .select('*')
                .order('order', { ascending: true })
                .order('last_post_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting forum categories:', error);
            return [];
        }
    }

    /**
     * Get category by ID
     */
    static async getCategory(categoryId: string): Promise<ForumCategory | null> {
        try {
            const { data, error } = await supabase
                .from('forum_categories')
                .select('*')
                .eq('id', categoryId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting category:', error);
            return null;
        }
    }

    /**
     * Get topics by category
     */
    static async getTopicsByCategory(
        categoryId: string,
        page: number = 1,
        pageSize: number = 20,
        sortBy: 'newest' | 'popular' | 'unanswered' = 'newest'
    ): Promise<{ topics: ForumTopic[]; total: number }> {
        try {
            const offset = (page - 1) * pageSize;

            let query = supabase
                .from('forum_topics')
                .select('*', { count: 'exact' })
                .eq('category_id', categoryId);

            // Apply sorting
            switch (sortBy) {
                case 'newest':
                    query = query.order('last_reply_at', { ascending: false });
                    break;
                case 'popular':
                    query = query.order('views_count', { ascending: false });
                    break;
                case 'unanswered':
                    query = query.eq('replies_count', 0).order('created_at', { ascending: false });
                    break;
            }

            const { data, error, count } = await query
                .range(offset, offset + pageSize - 1);

            if (error) throw error;
            return { topics: data || [], total: count || 0 };
        } catch (error) {
            console.error('Error getting topics by category:', error);
            return { topics: [], total: 0 };
        }
    }

    /**
     * Search topics
     */
    static async searchTopics(
        query: string,
        categoryId?: string,
        tags?: string[],
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ topics: ForumTopic[]; total: number }> {
        try {
            const offset = (page - 1) * pageSize;

            let supabaseQuery = supabase
                .from('forum_topics')
                .select('*', { count: 'exact' })
                .or(`title.ilike.%${sanitizePostgrestValue(query)}%,content.ilike.%${sanitizePostgrestValue(query)}%`);

            if (categoryId) {
                supabaseQuery = supabaseQuery.eq('category_id', categoryId);
            }

            if (tags && tags.length > 0) {
                supabaseQuery = supabaseQuery.contains('tags', tags);
            }

            const { data, error, count } = await supabaseQuery
                .order('last_reply_at', { ascending: false })
                .range(offset, offset + pageSize - 1);

            if (error) throw error;
            return { topics: data || [], total: count || 0 };
        } catch (error) {
            console.error('Error searching topics:', error);
            return { topics: [], total: 0 };
        }
    }

    /**
     * Get topic by ID
     */
    static async getTopic(topicId: string): Promise<ForumTopic | null> {
        try {
            const { data, error } = await supabase
                .from('forum_topics')
                .select('*')
                .eq('id', topicId)
                .single();

            if (error) throw error;

            // Increment view count (only once per session)
            if (trackTopicView(topicId)) {
                await this.incrementTopicViews(topicId);
            }

            return data;
        } catch (error) {
            console.error('Error getting topic:', error);
            return null;
        }
    }

    /**
     * Create new topic
     */
    static async createTopic(
        categoryId: string,
        title: string,
        content: string,
        authorId: string,
        tags: string[] = []
    ): Promise<ForumTopic | null> {
        try {
            // Get author profile
            const { data: authorProfile, error: authorError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', authorId)
                .single();

            if (authorError) throw authorError;

            const { data, error } = await supabase
                .from('forum_topics')
                .insert({
                    category_id: categoryId,
                    title,
                    content,
                    author_id: authorId,
                    author_name: authorProfile.username,
                    author_avatar: authorProfile.avatar_url,
                    views_count: 0,
                    replies_count: 0,
                    likes_count: 0,
                    is_pinned: false,
                    is_locked: false,
                    is_featured: false,
                    tags,
                    last_reply_at: new Date().toISOString(),
                    last_reply_by: authorId,
                    last_reply_by_name: authorProfile.username
                })
                .select()
                .single();

            if (error) throw error;

            // Update category stats
            await this.updateCategoryStats(categoryId);

            return data;
        } catch (error) {
            console.error('Error creating topic:', error);
            return null;
        }
    }

    /**
     * Update topic
     */
    static async updateTopic(
        topicId: string,
        updates: Partial<{
            title: string;
            content: string;
            tags: string[];
            is_pinned: boolean;
            is_locked: boolean;
            is_featured: boolean;
        }>
    ): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('forum_topics')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', topicId)
                .eq('author_id', user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating topic:', error);
            return false;
        }
    }

    /**
     * Delete topic
     */
    static async deleteTopic(topicId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get topic to get category ID
            const topic = await this.getTopic(topicId);
            if (!topic) return false;

            if (topic.author_id !== user.id) {
                console.error('Unauthorized: Only the author can delete this topic');
                return false;
            }

            const { error } = await supabase
                .from('forum_topics')
                .delete()
                .eq('id', topicId)
                .eq('author_id', user.id);

            if (error) throw error;

            // Update category stats
            await this.updateCategoryStats(topic.category_id);

            return true;
        } catch (error) {
            console.error('Error deleting topic:', error);
            return false;
        }
    }

    /**
     * Get posts for topic
     */
    static async getPosts(
        topicId: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ posts: ForumPost[]; total: number }> {
        try {
            const offset = (page - 1) * pageSize;

            const { data, error, count } = await supabase
                .from('forum_posts')
                .select('*', { count: 'exact' })
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true })
                .range(offset, offset + pageSize - 1);

            if (error) throw error;
            return { posts: data || [], total: count || 0 };
        } catch (error) {
            console.error('Error getting posts:', error);
            return { posts: [], total: 0 };
        }
    }

    /**
     * Add post to topic
     */
    static async addPost(
        topicId: string,
        content: string,
        authorId: string,
        parentPostId?: string
    ): Promise<ForumPost | null> {
        try {
            // Get author profile
            const { data: authorProfile, error: authorError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', authorId)
                .single();

            if (authorError) throw authorError;

            // Get topic to update last reply info
            const topic = await this.getTopic(topicId);
            if (!topic) return null;

            const { data, error } = await supabase
                .from('forum_posts')
                .insert({
                    topic_id: topicId,
                    content,
                    author_id: authorId,
                    author_name: authorProfile.username,
                    author_avatar: authorProfile.avatar_url,
                    likes_count: 0,
                    is_solution: false,
                    parent_post_id: parentPostId,
                    mentions: this.extractMentions(content)
                })
                .select()
                .single();

            if (error) throw error;

            // Update topic reply count and last reply info atomically via RPC
            await supabase.rpc('increment_topic_replies', {
                p_topic_id: topicId,
                p_author_id: authorId,
                p_author_name: authorProfile.username,
                p_timestamp: new Date().toISOString()
            });

            // Update category stats
            await this.updateCategoryStats(topic.category_id);

            // Send notifications to mentioned users
            await this.notifyMentionedUsers(data.mentions, topicId, data.id, authorId);

            return data;
        } catch (error) {
            console.error('Error adding post:', error);
            return null;
        }
    }

    /**
     * Update post
     */
    static async updatePost(
        postId: string,
        content: string
    ): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('forum_posts')
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                    mentions: this.extractMentions(content)
                })
                .eq('id', postId)
                .eq('author_id', user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating post:', error);
            return false;
        }
    }

    /**
     * Delete post
     */
    static async deletePost(postId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get post to get topic info and verify ownership
            const { data: post, error: postError } = await supabase
                .from('forum_posts')
                .select('topic_id, author_id')
                .eq('id', postId)
                .single();

            if (postError) throw postError;

            if (post.author_id !== user.id) {
                console.error('Unauthorized: Only the author can delete this post');
                return false;
            }

            const { error } = await supabase
                .from('forum_posts')
                .delete()
                .eq('id', postId)
                .eq('author_id', user.id);

            if (error) throw error;

            // Update topic reply count atomically via RPC
            const topic = await this.getTopic(post.topic_id);
            if (topic) {
                await supabase.rpc('decrement_topic_replies', {
                    p_topic_id: post.topic_id
                });

                // Update category stats
                await this.updateCategoryStats(topic.category_id);
            }

            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            return false;
        }
    }

    /**
     * Like a topic
     */
    static async likeTopic(userId: string, topicId: string): Promise<boolean> {
        try {
            // Check if already liked
            const { data: existingLike, error: checkError } = await supabase
                .from('topic_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('topic_id', topicId)
                .single();

            if (checkError && checkError.code === 'PGRST116') {
                // No existing like found (PGRST116 = no rows), add like
                const { error: insertError } = await supabase
                    .from('topic_likes')
                    .insert({
                        user_id: userId,
                        topic_id: topicId
                    });

                if (insertError) throw insertError;

                // Increment likes count
                await this.incrementTopicLikes(topicId);
            } else if (!checkError && existingLike) {
                // Already liked, unlike
                const { error: deleteError } = await supabase
                    .from('topic_likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('topic_id', topicId);

                if (deleteError) throw deleteError;

                // Decrement likes count
                await this.decrementTopicLikes(topicId);
            } else if (checkError) {
                throw checkError;
            }

            return true;
        } catch (error) {
            console.error('Error liking topic:', error);
            return false;
        }
    }

    /**
     * Like a post
     */
    static async likePost(userId: string, postId: string): Promise<boolean> {
        try {
            // Check if already liked to prevent duplicates
            const { data: existingLike, error: checkError } = await supabase
                .from('post_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('post_id', postId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (!checkError && existingLike) {
                // Already liked
                return true;
            }

            const { error } = await supabase
                .from('post_likes')
                .insert({
                    user_id: userId,
                    post_id: postId
                });

            if (error) throw error;

            // Increment post likes count
            await supabase.rpc('increment_post_likes', { post_id: postId });

            return true;
        } catch (error) {
            console.error('Error liking post:', error);
            return false;
        }
    }

    /**
     * Mark post as solution
     */
    static async markAsSolution(postId: string, topicId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Verify topic author
            const topic = await this.getTopic(topicId);
            if (!topic) return false;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const isModerator = profile?.user_type === 'admin';
            if (topic.author_id !== user.id && !isModerator) {
                console.error('Unauthorized: Only topic author can mark a solution');
                return false;
            }

            // First, unmark any existing solution in this topic
            await supabase
                .from('forum_posts')
                .update({ is_solution: false })
                .eq('topic_id', topicId)
                .eq('is_solution', true);

            // Mark the new post as solution
            const { error } = await supabase
                .from('forum_posts')
                .update({ is_solution: true })
                .eq('id', postId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking post as solution:', error);
            return false;
        }
    }

    /**
     * Create poll
     */
    static async createPoll(
        topicId: string,
        question: string,
        options: string[],
        isMultipleChoice: boolean = false,
        endsAt?: string
    ): Promise<ForumPoll | null> {
        try {
            const pollOptions = options.map((text, index) => ({
                id: `option_${index + 1}`,
                text,
                votes_count: 0,
                percentage: 0
            }));

            const { data, error } = await supabase
                .from('forum_polls')
                .insert({
                    topic_id: topicId,
                    question,
                    options: pollOptions,
                    is_multiple_choice: isMultipleChoice,
                    ends_at: endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
                    total_votes: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating poll:', error);
            return null;
        }
    }

    /**
     * Vote in poll
     */
    static async voteInPoll(
        userId: string,
        pollId: string,
        optionIds: string[]
    ): Promise<boolean> {
        try {
            // Check if user already voted
            const { data: existingVotes, error: checkError } = await supabase
                .from('poll_votes')
                .select('id')
                .eq('user_id', userId)
                .eq('poll_id', pollId);

            if (checkError && checkError.code !== 'PGRST116') {
                // Real database error
                throw checkError;
            }

            if (existingVotes && existingVotes.length > 0) {
                // User already voted, cannot vote again
                return false;
            }

            // User hasn't voted yet, proceed
            for (const optionId of optionIds) {
                const { error: voteError } = await supabase
                    .from('poll_votes')
                    .insert({
                        user_id: userId,
                        poll_id: pollId,
                        option_id: optionId
                    });

                if (voteError) throw voteError;
            }

            // Update poll stats
            await this.updatePollStats(pollId);
            return true;
        } catch (error) {
            console.error('Error voting in poll:', error);
            return false;
        }
    }

    /**
     * Get poll results
     */
    static async getPollResults(pollId: string): Promise<ForumPoll | null> {
        try {
            const { data, error } = await supabase
                .from('forum_polls')
                .select('*')
                .eq('id', pollId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting poll results:', error);
            return null;
        }
    }

    /**
     * Get user's recent activity
     */
    static async getUserActivity(userId: string, limit: number = 20): Promise<any[]> {
        try {
            // Get recent topics created by user
            const { data: topics, error: topicsError } = await supabase
                .from('forum_topics')
                .select('*')
                .eq('author_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (topicsError) throw topicsError;

            // Get recent posts by user
            const { data: posts, error: postsError } = await supabase
                .from('forum_posts')
                .select('*')
                .eq('author_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (postsError) throw postsError;

            // Combine and sort by date
            const activities = [
                ...(topics || []).map(topic => ({
                    type: 'topic',
                    data: topic,
                    date: topic.created_at
                })),
                ...(posts || []).map(post => ({
                    type: 'post',
                    data: post,
                    date: post.created_at
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);

            return activities;
        } catch (error) {
            console.error('Error getting user activity:', error);
            return [];
        }
    }

    /**
     * Get trending topics
     */
    static async getTrendingTopics(limit: number = 10): Promise<ForumTopic[]> {
        try {
            const { data, error } = await supabase
                .from('forum_topics')
                .select('*')
                .order('views_count', { ascending: false })
                .order('replies_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting trending topics:', error);
            return [];
        }
    }

    /**
     * Get unanswered topics
     */
    static async getUnansweredTopics(limit: number = 20): Promise<ForumTopic[]> {
        try {
            const { data, error } = await supabase
                .from('forum_topics')
                .select('*')
                .eq('replies_count', 0)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting unanswered topics:', error);
            return [];
        }
    }

    // ==================== HELPER METHODS ====================

    private static async incrementTopicViews(topicId: string): Promise<void> {
        try {
            await supabase.rpc('increment_topic_views', { topic_id: topicId });
        } catch (error) {
            console.error('Error incrementing topic views:', error);
        }
    }

    private static async incrementTopicLikes(topicId: string): Promise<void> {
        try {
            await supabase.rpc('increment_topic_likes', { topic_id: topicId });
        } catch (error) {
            console.error('Error incrementing topic likes:', error);
        }
    }

    private static async decrementTopicLikes(topicId: string): Promise<void> {
        try {
            await supabase.rpc('decrement_topic_likes', { topic_id: topicId });
        } catch (error) {
            console.error('Error decrementing topic likes:', error);
        }
    }

    private static async updateCategoryStats(categoryId: string): Promise<void> {
        try {
            // Get topic count
            const { count: topicsCount, error: topicsError } = await supabase
                .from('forum_topics')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', categoryId);

            if (topicsError) throw topicsError;

            // Get post count (approximate - sum of replies_count + 1 for each topic)
            const { data: topics, error: topicsDataError } = await supabase
                .from('forum_topics')
                .select('replies_count')
                .eq('category_id', categoryId);

            if (topicsDataError) throw topicsDataError;

            const postsCount = topics?.reduce((sum, topic) => sum + topic.replies_count + 1, 0) || 0;

            // Get latest post info
            const { data: latestTopic, error: latestError } = await supabase
                .from('forum_topics')
                .select('last_reply_at, last_reply_by, last_reply_by_name')
                .eq('category_id', categoryId)
                .order('last_reply_at', { ascending: false })
                .limit(1)
                .single();

            if (latestError && latestError.code !== 'PGRST116') {
                throw latestError;
            }

            // Update category
            await supabase
                .from('forum_categories')
                .update({
                    topics_count: topicsCount || 0,
                    posts_count: postsCount,
                    last_post_at: latestTopic?.last_reply_at || new Date().toISOString(),
                    last_post_by: latestTopic?.last_reply_by || '',
                    last_post_by_name: latestTopic?.last_reply_by_name || ''
                })
                .eq('id', categoryId);
        } catch (error) {
            console.error('Error updating category stats:', error);
        }
    }

    private static extractMentions(content: string): string[] {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        // Remove duplicates without using spread operator with Set
        const uniqueMentions: string[] = [];
        const seen = new Set<string>();
        for (const mention of mentions) {
            if (!seen.has(mention)) {
                seen.add(mention);
                uniqueMentions.push(mention);
            }
        }
        return uniqueMentions;
    }

    private static async notifyMentionedUsers(
        mentions: string[],
        topicId: string,
        postId: string,
        authorId: string
    ): Promise<void> {
        if (mentions.length === 0) return;

        try {
            // Get mentioned user IDs
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id')
                .in('username', mentions);

            if (error) throw error;

            // Create notifications
            for (const user of users || []) {
                if (user.id === authorId) continue; // Don't notify self

                await supabase
                    .from('notifications')
                    .insert({
                        user_id: user.id,
                        type: 'forum_mention',
                        title: 'You were mentioned in a forum post',
                        message: `You were mentioned in a forum post`,
                        data: {
                            topic_id: topicId,
                            post_id: postId,
                            author_id: authorId
                        },
                        is_read: false
                    });
            }
        } catch (error) {
            console.error('Error notifying mentioned users:', error);
        }
    }

    private static async updatePollStats(pollId: string): Promise<void> {
        try {
            // Get all votes for this poll
            const { data: votes, error: votesError } = await supabase
                .from('poll_votes')
                .select('option_id')
                .eq('poll_id', pollId);

            if (votesError) throw votesError;

            // Count votes per option
            const voteCounts: Record<string, number> = {};
            votes?.forEach(vote => {
                voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
            });

            const totalVotes = votes?.length || 0;

            // Get poll to update options
            const { data: poll, error: pollError } = await supabase
                .from('forum_polls')
                .select('options')
                .eq('id', pollId)
                .single();

            if (pollError) throw pollError;

            // Update options with vote counts and percentages
            const updatedOptions = poll.options.map((option: PollOption) => ({
                ...option,
                votes_count: voteCounts[option.id] || 0,
                percentage: totalVotes > 0 ? Math.round((voteCounts[option.id] || 0) / totalVotes * 100) : 0
            }));

            // Update poll
            await supabase
                .from('forum_polls')
                .update({
                    options: updatedOptions,
                    total_votes: totalVotes
                })
                .eq('id', pollId);
        } catch (error) {
            console.error('Error updating poll stats:', error);
        }
    }
}
