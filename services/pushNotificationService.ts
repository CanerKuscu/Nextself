import { Platform } from 'react-native';
import { SupabaseService } from './supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const supabase = SupabaseService.getInstance().getClient();

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    data?: any;
    type: 'reminder' | 'achievement' | 'social' | 'system' | 'promotional';
    priority: 'low' | 'normal' | 'high';
    read: boolean;
    action_url?: string;
    sent_at: string;
    created_at: string;
}

export interface NotificationPreferences {
    user_id: string;
    enabled: boolean;
    reminder_notifications: boolean;
    achievement_notifications: boolean;
    social_notifications: boolean;
    system_notifications: boolean;
    promotional_notifications: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    daily_summary_time?: string;
    weekly_report_day?: number;
    weekly_report_time?: string;
    updated_at: string;
}

export class PushNotificationService {
    private static instance: PushNotificationService;
    private expoPushToken: string | null = null;
    private notificationListener: Notifications.Subscription | null = null;
    private responseListener: Notifications.Subscription | null = null;

    private constructor() {
        this.init();
    }

    public static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    private async init() {
        try {
            await this.registerForPushNotifications();
            await this.setupNotificationHandlers();
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }

    private async registerForPushNotifications(): Promise<void> {
        try {
            // Expo Go no longer supports push notifications in SDK 53+
            if (Constants.appOwnership === 'expo') {
                console.log('Push notifications are not supported in Expo Go.');
                return;
            }

            if (!Device.isDevice) {
                console.log('Must use physical device for push notifications');
                return;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            const token = (await Notifications.getExpoPushTokenAsync()).data;
            this.expoPushToken = token;
            console.log('Expo push token received');

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
        } catch (error) {
            console.error('Error registering for push notifications:', error);
        }
    }

    /**
     * Setup notification handlers
     */
    private async setupNotificationHandlers(): Promise<void> {
        try {
            // Clean up existing listeners before adding new ones to prevent accumulation
            if (this.notificationListener) {
                this.notificationListener.remove();
                this.notificationListener = null;
            }
            if (this.responseListener) {
                this.responseListener.remove();
                this.responseListener = null;
            }

            // Handle notifications received while app is foregrounded
            this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification received');
                this.handleNotification(notification);
            });

            // Handle user tapping on notification
            this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification response received');
                this.handleNotificationResponse(response);
            });

            // Configure notification behavior
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        } catch (error) {
            console.error('Error setting up notification handlers:', error);
        }
    }

    /**
     * Save user's push token to database
     */
    public async savePushToken(userId: string): Promise<boolean> {
        try {
            if (!this.expoPushToken) {
                console.log('No push token available');
                return false;
            }

            const { error } = await supabase
                .from('user_push_tokens')
                .upsert({
                    user_id: userId,
                    expo_push_token: this.expoPushToken,
                    platform: Platform.OS,
                    device_model: Device.modelName,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving push token:', error);
            return false;
        }
    }

    /**
     * Get user's notification preferences
     */
    public async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
            return data;
        } catch (error) {
            console.error('Error getting notification preferences:', error);
            return null;
        }
    }

    /**
     * Update notification preferences
     */
    public async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: userId,
                    ...preferences,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            return false;
        }
    }

    /**
     * Send push notification to user
     */
    public async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        type: Notification['type'] = 'system',
        data?: any,
        priority: Notification['priority'] = 'normal'
    ): Promise<boolean> {
        try {
            // Check user preferences
            const preferences = await this.getNotificationPreferences(userId);
            if (!preferences?.enabled) {
                console.log('Notifications disabled for current user');
                return false;
            }

            // Check type-specific preferences
            if (!this.isNotificationTypeEnabled(preferences, type)) {
                console.log(`Notification type ${type} disabled for current user`);
                return false;
            }

            // Check quiet hours
            if (this.isInQuietHours(preferences)) {
                console.log('In quiet hours, notification delayed');
                // Schedule for later
                await this.scheduleNotification(userId, title, body, type, data, priority);
                return true;
            }

            // Get user's push token
            const { data: tokenData, error: tokenError } = await supabase
                .from('user_push_tokens')
                .select('expo_push_token')
                .eq('user_id', userId)
                .single();

            if (tokenError || !tokenData?.expo_push_token) {
                console.error('No push token found for current user');
                return false;
            }

            // Send notification via Expo
            const message = {
                to: tokenData.expo_push_token,
                sound: 'default',
                title,
                body,
                data: data || {},
                priority: this.mapPriorityToExpo(priority)
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error(`Failed to send notification: ${response.statusText}`);
            }

            // Save notification to database
            await this.saveNotificationToDB(userId, title, body, type, data, priority);

            return true;
        } catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    }

    /**
     * Send local notification
     */
    public async sendLocalNotification(
        title: string,
        body: string,
        data?: any,
        trigger?: Notifications.NotificationTriggerInput
    ): Promise<string | null> {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: data || {},
                    sound: true,
                },
                trigger: trigger || null,
            });

            return notificationId;
        } catch (error) {
            console.error('Error sending local notification:', error);
            return null;
        }
    }

    /**
     * Schedule recurring notification
     */
    public async scheduleRecurringNotification(
        userId: string,
        title: string,
        body: string,
        type: Notification['type'],
        trigger: Notifications.NotificationTriggerInput,
        data?: any
    ): Promise<string | null> {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        ...data,
                        user_id: userId,
                        type
                    },
                    sound: true,
                },
                trigger,
            });

            // Save scheduled notification to database
            await this.saveScheduledNotification(userId, title, body, type, trigger, data);

            return notificationId;
        } catch (error) {
            console.error('Error scheduling recurring notification:', error);
            return null;
        }
    }

    /**
     * Cancel scheduled notification
     */
    public async cancelScheduledNotification(notificationId: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);

            // Remove from database
            await supabase
                .from('scheduled_notifications')
                .delete()
                .eq('notification_id', notificationId);
        } catch (error) {
            console.error('Error canceling scheduled notification:', error);
        }
    }

    /**
     * Send workout reminder
     */
    public async sendWorkoutReminder(userId: string, workoutTime: string): Promise<boolean> {
        try {
            const title = 'Workout Time!';
            const body = `It's time for your scheduled workout at ${workoutTime}. Let's get moving!`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'reminder',
                {
                    action: 'start_workout',
                    workout_time: workoutTime
                },
                'high'
            );
        } catch (error) {
            console.error('Error sending workout reminder:', error);
            return false;
        }
    }

    /**
     * Send hydration reminder
     */
    public async sendHydrationReminder(userId: string): Promise<boolean> {
        try {
            const title = 'Stay Hydrated!';
            const body = 'Time to drink some water. Staying hydrated helps with energy and recovery.';

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'reminder',
                {
                    action: 'log_water',
                    reminder_type: 'hydration'
                },
                'normal'
            );
        } catch (error) {
            console.error('Error sending hydration reminder:', error);
            return false;
        }
    }

    /**
     * Send achievement notification
     */
    public async sendAchievementNotification(
        userId: string,
        achievementTitle: string,
        achievementDescription: string,
        xpReward: number
    ): Promise<boolean> {
        try {
            const title = 'Achievement Unlocked!';
            const body = `${achievementTitle}: ${achievementDescription} (+${xpReward} XP)`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'achievement',
                {
                    action: 'view_achievement',
                    achievement_title: achievementTitle,
                    xp_reward: xpReward
                },
                'high'
            );
        } catch (error) {
            console.error('Error sending achievement notification:', error);
            return false;
        }
    }

    /**
     * Send streak notification
     */
    public async sendStreakNotification(userId: string, streakDays: number): Promise<boolean> {
        try {
            const title = 'Streak Alert!';
            const body = `You're on a ${streakDays}-day streak! Keep up the great work!`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'achievement',
                {
                    action: 'view_streak',
                    streak_days: streakDays
                },
                'normal'
            );
        } catch (error) {
            console.error('Error sending streak notification:', error);
            return false;
        }
    }

    /**
     * Send friend request notification
     */
    public async sendFriendRequestNotification(
        userId: string,
        friendName: string,
        friendId: string
    ): Promise<boolean> {
        try {
            const title = 'New Friend Request';
            const body = `${friendName} sent you a friend request`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'social',
                {
                    action: 'view_friend_request',
                    friend_id: friendId,
                    friend_name: friendName
                },
                'normal'
            );
        } catch (error) {
            console.error('Error sending friend request notification:', error);
            return false;
        }
    }

    /**
     * Send challenge invitation
     */
    public async sendChallengeInvitation(
        userId: string,
        challengeName: string,
        challengerName: string,
        challengeId: string
    ): Promise<boolean> {
        try {
            const title = 'Challenge Invitation!';
            const body = `${challengerName} invited you to join "${challengeName}"`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'social',
                {
                    action: 'view_challenge',
                    challenge_id: challengeId,
                    challenge_name: challengeName,
                    challenger_name: challengerName
                },
                'normal'
            );
        } catch (error) {
            console.error('Error sending challenge invitation:', error);
            return false;
        }
    }

    /**
     * Send daily summary
     */
    public async sendDailySummary(userId: string, summaryData: any): Promise<boolean> {
        try {
            const title = 'Your Daily Summary';
            const body = `You completed ${summaryData.workouts || 0} workouts and burned ${summaryData.calories || 0} calories today`;

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'system',
                {
                    action: 'view_daily_summary',
                    ...summaryData
                },
                'low'
            );
        } catch (error) {
            console.error('Error sending daily summary:', error);
            return false;
        }
    }

    /**
     * Send weekly report
     */
    public async sendWeeklyReport(userId: string, reportData: any): Promise<boolean> {
        try {
            const title = 'Weekly Progress Report';
            const body = 'Check out your progress from the past week!';

            return await this.sendPushNotification(
                userId,
                title,
                body,
                'system',
                {
                    action: 'view_weekly_report',
                    ...reportData
                },
                'normal'
            );
        } catch (error) {
            console.error('Error sending weekly report:', error);
            return false;
        }
    }

    /**
     * Get user's notifications
     */
    public async getUserNotifications(
        userId: string,
        limit: number = 20,
        offset: number = 0,
        unreadOnly: boolean = false
    ): Promise<Notification[]> {
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('sent_at', { ascending: false });

            if (unreadOnly) {
                query = query.eq('read', false);
            }

            const { data, error } = await query
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read (user-scoped to prevent IDOR)
     */
    public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Mark all notifications as read
     */
    public async markAllAsRead(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    }

    /**
     * Delete notification (user-scoped to prevent IDOR)
     */
    public async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    /**
     * Clear all notifications
     */
    public async clearAllNotifications(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            return false;
        }
    }

    // ==================== HELPER METHODS ====================

    private handleNotification(notification: Notifications.Notification): void {
        console.log('Handling notification');
        // You can add custom logic here for handling notifications
        // For example, update UI, play sounds, etc.
    }

    private handleNotificationResponse(response: Notifications.NotificationResponse): void {
        console.log('Handling notification response');
        const { data } = response.notification.request.content;

        // Handle different notification actions
        if (data?.action) {
            switch (data.action) {
                case 'start_workout':
                    // Navigate to workout screen
                    console.log('Navigate to workout screen');
                    break;
                case 'log_water':
                    // Navigate to water tracking screen
                    console.log('Navigate to water tracking screen');
                    break;
                case 'view_achievement':
                    // Navigate to achievements screen
                    console.log('Navigate to achievements screen');
                    break;
                case 'view_streak':
                    // Navigate to streak screen
                    console.log('Navigate to streak screen');
                    break;
                case 'view_friend_request':
                    // Navigate to friend requests screen
                    console.log('Navigate to friend requests screen');
                    break;
                case 'view_challenge':
                    // Navigate to challenge screen
                    console.log('Navigate to challenge screen');
                    break;
                case 'view_daily_summary':
                    // Navigate to daily summary screen
                    console.log('Navigate to daily summary screen');
                    break;
                case 'view_weekly_report':
                    // Navigate to weekly report screen
                    console.log('Navigate to weekly report screen');
                    break;
            }
        }
    }

    private isNotificationTypeEnabled(preferences: NotificationPreferences, type: Notification['type']): boolean {
        switch (type) {
            case 'reminder':
                return preferences.reminder_notifications;
            case 'achievement':
                return preferences.achievement_notifications;
            case 'social':
                return preferences.social_notifications;
            case 'system':
                return preferences.system_notifications;
            case 'promotional':
                return preferences.promotional_notifications;
            default:
                return true;
        }
    }

    private isInQuietHours(preferences: NotificationPreferences): boolean {
        if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
            return false;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const startTime = this.parseTimeString(preferences.quiet_hours_start);
        const endTime = this.parseTimeString(preferences.quiet_hours_end);

        if (startTime <= endTime) {
            // Quiet hours don't cross midnight
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Quiet hours cross midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    private parseTimeString(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private async scheduleNotification(
        userId: string,
        title: string,
        body: string,
        type: Notification['type'],
        data?: any,
        priority: Notification['priority'] = 'normal'
    ): Promise<void> {
        try {
            // Schedule for 1 hour later (after quiet hours)
            const triggerDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        ...data,
                        user_id: userId,
                        type,
                        priority
                    },
                    sound: true,
                },
                trigger: {
                    type: 'date',
                    date: triggerDate,
                } as Notifications.NotificationTriggerInput,
            });

            // Save to scheduled notifications
            await supabase
                .from('scheduled_notifications')
                .insert({
                    user_id: userId,
                    title,
                    body,
                    type,
                    data: data || {},
                    priority,
                    scheduled_for: triggerDate.toISOString(),
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }

    private async saveNotificationToDB(
        userId: string,
        title: string,
        body: string,
        type: Notification['type'],
        data?: any,
        priority: Notification['priority'] = 'normal'
    ): Promise<void> {
        try {
            await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    body,
                    type,
                    data: data || {},
                    priority,
                    read: false,
                    sent_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error saving notification to DB:', error);
        }
    }

    private async saveScheduledNotification(
        userId: string,
        title: string,
        body: string,
        type: Notification['type'],
        trigger: Notifications.NotificationTriggerInput,
        data?: any
    ): Promise<void> {
        try {
            let scheduledFor: string;

            if (trigger && typeof trigger === 'object' && 'date' in trigger) {
                scheduledFor = (trigger.date as Date).toISOString();
            } else if (trigger && typeof trigger === 'object' && 'seconds' in trigger) {
                const seconds = (trigger as any).seconds;
                scheduledFor = new Date(Date.now() + seconds * 1000).toISOString();
            } else {
                scheduledFor = new Date().toISOString();
            }

            await supabase
                .from('scheduled_notifications')
                .insert({
                    user_id: userId,
                    title,
                    body,
                    type,
                    data: data || {},
                    scheduled_for: scheduledFor,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error saving scheduled notification:', error);
        }
    }

    private mapPriorityToExpo(priority: Notification['priority']): 'default' | 'normal' | 'high' {
        switch (priority) {
            case 'high':
                return 'high';
            case 'normal':
                return 'normal';
            case 'low':
                return 'default';
            default:
                return 'normal';
        }
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        if (this.notificationListener) {
            this.notificationListener.remove();
            this.notificationListener = null;
        }

        if (this.responseListener) {
            this.responseListener.remove();
            this.responseListener = null;
        }
    }
}
