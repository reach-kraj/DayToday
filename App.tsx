import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabs } from './src/navigation/BottomTabs';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import * as Notifications from 'expo-notifications';
import { useStore } from './src/store';
import { format } from 'date-fns';

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
  const { markAllTasksCompleted } = useStore();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;

      if (actionId === 'MARK_ALL_COMPLETED') {
        const today = format(new Date(), 'yyyy-MM-dd');
        markAllTasksCompleted(today);
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Navigate to Tasks screen
        // Assuming the route name is 'Tasks' or similar. 
        // If it's nested, we might need more specific logic.
        // Let's try navigating to 'Tasks' tab.
        if (navigationRef.isReady()) {
            navigationRef.navigate('Tasks' as never);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="auto" />
          <BottomTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
