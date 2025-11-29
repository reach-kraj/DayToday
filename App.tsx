import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabs } from './src/navigation/BottomTabs';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import * as Notifications from 'expo-notifications';
import { useStore } from './src/store';
import { format } from 'date-fns';
import { TaskNotificationCard } from './src/components/TaskNotificationCard';
import { EndOfDayCard } from './src/components/EndOfDayCard';
import { scheduleRecurringEndOfDayNotification } from './src/services/notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const { markAllTasksCompleted, toggleTaskCompleted, tasks, tasksByDate, movePendingTasksToNextDay, markTasksCompleted } = useStore();
  const [notificationCardVisible, setNotificationCardVisible] = useState(false);
  const [notificationTaskData, setNotificationTaskData] = useState<{ taskId: string; taskTitle: string; taskTime: string } | null>(null);
  
  const [endOfDayCardVisible, setEndOfDayCardVisible] = useState(false);
  const [pendingTasksForReview, setPendingTasksForReview] = useState<{ id: string; title: string; time?: string }[]>([]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    
    // Ensure End of Day notification is scheduled
    const checkAndScheduleNotification = async () => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const hasEndOfDay = scheduled.some(n => n.content.data?.type === 'END_OF_DAY');
        
        if (!hasEndOfDay) {
            const state = useStore.getState();
            const { hour, minute } = state.endOfDayTime;
            await scheduleRecurringEndOfDayNotification(hour, minute);
            console.log('Scheduled default End of Day notification');
        }
    };
    checkAndScheduleNotification();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;

      if (actionId === 'MARK_ALL_COMPLETED') {
        const today = format(new Date(), 'yyyy-MM-dd');
        markAllTasksCompleted(today);
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const data = response.notification.request.content.data as any;
        
        if (data?.type === 'END_OF_DAY') {
            // Fetch pending tasks using FRESH state from store
            const state = useStore.getState();
            const today = format(new Date(), 'yyyy-MM-dd');
            const taskIds = state.tasksByDate[today] || [];
            const pending = taskIds
                .map(id => state.tasks[id])
                .filter(t => t && !t.completed && !t.routineId)
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    time: t.time ? `${t.time.hour}:${t.time.minute.toString().padStart(2, '0')}` : undefined
                }));

            if (pending.length > 0) {
                setPendingTasksForReview(pending);
                setEndOfDayCardVisible(true);
            }
        } else if (data && data.taskId && data.taskTitle && data.taskTime) {
            setNotificationTaskData({
                taskId: data.taskId,
                taskTitle: data.taskTitle,
                taskTime: data.taskTime,
            });
            setNotificationCardVisible(true);
        } else {
            // Navigate to Tasks screen if no specific task data
            if (navigationRef.isReady()) {
                navigationRef.navigate('Tasks' as never);
            }
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#E9E9E9' }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <BottomTabs />
          <TaskNotificationCard
            visible={notificationCardVisible}
            onClose={() => setNotificationCardVisible(false)}
            taskTitle={notificationTaskData?.taskTitle || ''}
            taskTime={notificationTaskData?.taskTime || ''}
            onComplete={() => {
                setNotificationCardVisible(false);

                if (notificationTaskData?.taskId) {
                    // Wait for modal to close to avoid animation conflicts
                    setTimeout(() => {
                        if (navigationRef.isReady()) {
                            navigationRef.navigate('Tasks' as never);
                        }
                        toggleTaskCompleted(notificationTaskData.taskId);
                    }, 500);
                }
            }}
            onSkip={() => {
                setNotificationCardVisible(false);
            }}
          />
          <EndOfDayCard
            visible={endOfDayCardVisible}
            onClose={() => setEndOfDayCardVisible(false)}
            pendingTasks={pendingTasksForReview}
            onMarkAllComplete={() => {
                setEndOfDayCardVisible(false);
                // Serialize actions to avoid crash
                setTimeout(() => {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    markAllTasksCompleted(today);
                }, 500);
            }}
            onMoveRemainingToNextDay={(completedTaskIds) => {
                setEndOfDayCardVisible(false);
                // Serialize actions
                setTimeout(() => {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    
                    // 1. Mark selected tasks as completed
                    if (completedTaskIds.length > 0) {
                        markTasksCompleted(completedTaskIds);
                    }
                    
                    // 2. Move the REST (which are still pending) to next day
                    movePendingTasksToNextDay(today);
                }, 500);
            }}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
