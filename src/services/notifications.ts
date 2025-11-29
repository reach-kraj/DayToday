import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('alarms', {
            name: 'Alarms',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500],
            lightColor: '#FF231F7C',
            sound: 'default', // Explicitly set sound
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
        });

        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('end_of_day', {
            name: 'End of Day Summary',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return;
    }
}

export async function scheduleEndOfDayNotification(hour: number, minute: number, pendingCount: number, topTasks: string[]) {
    // This function seems to be for a specific "daily summary" with content. 
    // We are moving towards a generic recurring trigger that opens the app/card.
    // Keeping this for reference or if we want to update the content daily (which requires background fetch).
    // For now, let's add a simple recurring scheduler.
}

export async function scheduleRecurringEndOfDayNotification(hour: number, minute: number) {
    await cancelEndOfDayNotifications();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "End of Day Review",
            body: "You have pending tasks! Tap to review.",
            categoryIdentifier: 'END_OF_DAY_CATEGORY',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'END_OF_DAY' },
        } as any,
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hour,
            minute: minute,
            repeats: true,
        },
    });
}

export async function cancelEndOfDayNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
        // Check for our specific title OR data type
        if (notification.content.title === 'End of Day Review' || notification.content.data?.type === 'END_OF_DAY') {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
}

export async function sendImmediateNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: null,
    });
}
export async function scheduleTaskNotification(
    taskId: string,
    title: string,
    date: string | Date,
    time: { hour: number; minute: number },
    notificationType: 'notification' | 'alarm' = 'notification'
) {
    const triggerDate = new Date(date);
    triggerDate.setHours(time.hour);
    triggerDate.setMinutes(time.minute);
    triggerDate.setSeconds(0);

    if (triggerDate <= new Date()) return;

    if (Platform.OS === 'android' && notificationType === 'alarm') {
        await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', {
            extra: {
                'android.intent.extra.alarm.HOUR': time.hour,
                'android.intent.extra.alarm.MINUTES': time.minute,
                'android.intent.extra.alarm.MESSAGE': title,
                'android.intent.extra.alarm.SKIP_UI': true,
            },
        });
    } else {
        const channelId = notificationType === 'alarm' ? 'alarms' : 'reminders';
        const priority = notificationType === 'alarm' 
            ? Notifications.AndroidNotificationPriority.MAX 
            : Notifications.AndroidNotificationPriority.HIGH;

        const formattedTime = new Date(triggerDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Task Reminder",
                body: title,
                data: {
                    taskId,
                    taskTitle: title,
                    taskTime: formattedTime,
                },
                sound: true,
                priority,
                channelId,
            } as any,
            trigger: triggerDate as any,
        });
    }
}
