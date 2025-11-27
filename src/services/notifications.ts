import * as Notifications from 'expo-notifications';
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
    // Cancel existing end-of-day notifications to avoid duplicates
    await cancelEndOfDayNotifications();

    if (pendingCount === 0) return;

    const taskList = topTasks.map(t => `• ${t}`).join('\n');
    const body = `You have ${pendingCount} pending tasks for today:\n${taskList}`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'End of Day Summary',
            body: body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hour,
            minute: minute,
        },
    });
}

export async function cancelEndOfDayNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
        if (notification.content.title === 'End of Day Summary') {
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
