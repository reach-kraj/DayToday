import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { DashboardScreen } from '../screens/Dashboard';
import { TaskScreen } from '../screens/Task';
import { RoutineScreen } from '../screens/Routine';
import { AccountScreen } from '../screens/Account';
import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator();

export const BottomTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopWidth: 0,
                    backgroundColor: 'transparent',
                    height: 85,
                    paddingTop: 8,
                    paddingBottom: 28,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    ...shadows.glassStrong,
                },
                tabBarBackground: () => (
                    <View style={styles.tabBarBackground}>
                        {Platform.OS === 'ios' ? (
                            <BlurView 
                                intensity={100} 
                                tint="light"
                                style={StyleSheet.absoluteFill} 
                            />
                        ) : (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassStrong }]} />
                        )}
                        <View style={styles.topBorder} />
                    </View>
                ),
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Tasks') {
                        iconName = focused ? 'checkbox' : 'checkbox-outline';
                    } else if (route.name === 'Routines') {
                        iconName = focused ? 'infinite' : 'infinite-outline';
                    } else if (route.name === 'Account') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }

                    return <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Tasks" component={TaskScreen} />
            <Tab.Screen name="Routines" component={RoutineScreen} />
            <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarBackground: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    topBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: colors.borderGlass,
    },
});
