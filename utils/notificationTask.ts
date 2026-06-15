import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { SupabaseService } from '@nextself/shared';
import { LogManager } from './LogManager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

export const defineNotificationTask = () => {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
        if (error) {
            LogManager.getInstance().error('Background notification task error:', error);
            return;
        }
        
        if (data) {
            try {
                const response = data as Notifications.NotificationResponse;
                const actionId = response.actionIdentifier;
                const notificationData = response.notification.request.content.data;

                if (actionId === 'mark_supplement_used' && notificationData?.supplement_id) {
                    // Call the RPC we just created to log the supplement
                    const supabase = SupabaseService.getInstance().getClient();
                    
                    const { error: logError } = await supabase.rpc('log_supplement_intake', {
                        p_supplement_id: notificationData.supplement_id,
                        p_quantity: notificationData.quantity || 1,
                        p_unit: notificationData.unit || 'serving',
                        p_notes: 'Logged via Push Notification Action'
                    });

                    if (logError) {
                        LogManager.getInstance().error('Error logging supplement intake via bg action', logError);
                    } else {
                        LogManager.getInstance().info('Supplement logged successfully via bg action');
                    }
                }
            } catch (err) {
                LogManager.getInstance().error('Error parsing notification background action:', err);
            }
        }
    });
};

export const registerNotificationTaskAsync = async () => {
    try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    } catch (e) {
        LogManager.getInstance().error('Failed to register notification background task:', e);
    }
};

// We must also configure categories so the OS knows what actions to show on the notification
export const registerNotificationCategories = async () => {
    await Notifications.setNotificationCategoryAsync('SUPPLEMENT_REMINDER', [
        {
            identifier: 'mark_supplement_used',
            buttonTitle: 'Kullandım',
            options: {
                opensAppToForeground: false, // Don't require opening the app
            },
        },
    ]);
};
