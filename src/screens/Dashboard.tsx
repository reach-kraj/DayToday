import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DateData } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { ModernCalendar } from '../components/ModernCalendar';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { RoutineTimelineCard } from '../components/RoutineTimelineCard';
import { RoutineStack } from '../components/RoutineStack';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { GlassCard } from '../components/GlassCard';
import { colors, spacing, typography, shadows } from '../theme';
import { AddRoutineModal } from '../components/AddRoutineModal';

export const DashboardScreen = () => {
    const { tasks, tasksByDate, routines, toggleTaskCompleted, createTaskForDay, generateTasksForDateFromRoutines, deleteTask } = useStore();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isRoutineModalVisible, setRoutineModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [refreshing, setRefreshing] = useState(false);

    const todaysTaskIds = tasksByDate[selectedDate] || [];
    const allTodaysItems = todaysTaskIds.map(id => tasks[id]).filter(Boolean);

    const todaysTasks = allTodaysItems.filter(t => !t.routineId);
    const todaysRoutines = allTodaysItems.filter(t => t.routineId && routines[t.routineId]);

    const navigation = useNavigation<any>();
    
    // Calculate time for filtering
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const pendingTasksCount = todaysTasks.filter(t => !t.completed).length;
    // Only count routines that are in the future
    const incompleteRoutinesCount = todaysRoutines.filter(t => {
        if (t.completed) return false;
        if (!t.time) return true;
        const tTime = t.time.hour * 60 + t.time.minute;
        return tTime >= currentTimeInMinutes;
    }).length;

    const loadData = React.useCallback(() => {
        generateTasksForDateFromRoutines(selectedDate);
    }, [selectedDate, generateTasksForDateFromRoutines]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        (async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
        })();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);

        // Generate tasks for the entire month of the selected date
        // This ensures the calendar dots are populated for the view
        const current = new Date(selectedDate);
        const start = new Date(current.getFullYear(), current.getMonth(), 1);
        const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            generateTasksForDateFromRoutines(dateStr);
        }

        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, [selectedDate, generateTasksForDateFromRoutines]);

    // Generate marked dates for calendar
    const markedDates: any = {
        [selectedDate]: { selected: true, selectedColor: colors.primary }
    };

    // Mark weekends for the current month
    const current = new Date(selectedDate);
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(Date.UTC(year, month, i));
        const dayOfWeek = d.getUTCDay();
        const dateString = d.toISOString().split('T')[0];

        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sun or Sat
            if (dateString !== selectedDate) {
                markedDates[dateString] = {
                    ...markedDates[dateString],
                    textColor: '#D1D5DB' // Lighter gray (Tailwind gray-300 equivalent)
                };
            }
        }
    }

    Object.keys(tasksByDate).forEach(date => {
        const taskIds = tasksByDate[date] || [];
        // Filter out routines (tasks with routineId)
        const nonRoutineTasks = taskIds.map(id => tasks[id]).filter(t => t && !t.routineId);

        if (nonRoutineTasks.length > 0) {
            markedDates[date] = {
                ...markedDates[date],
                marked: true,
                dotColor: date === selectedDate ? 'white' : colors.primary,
            };
        }
    });

    // Date for Header
    const today = new Date();
    const currentDay = today.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthName = monthNames[today.getMonth()];
    const currentYear = today.getFullYear();

    return (
        <AnimatedBackground>
            <SafeAreaView style={styles.container}>
                <Header
                    title="DayToday"
                    rightElement={
                        <View style={styles.headerDateContainer}>
                            <Text style={styles.headerDateText}>{currentDay} {currentMonthName}</Text>
                            <Text style={styles.headerYearText}>{currentYear}</Text>
                        </View>
                    }
                />

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
                    }
                >
                    {/* Summary Cards */}
                    <View style={styles.summaryRow}>
                        {/* Tasks Summary */}
                        <TouchableOpacity 
                            style={[styles.summaryCard, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('Tasks')}
                            activeOpacity={0.9}
                        >
                            {pendingTasksCount === 0 ? (
                                <>
                                    <Image 
                                        source={require('../../assets/sleeping_man.png')} 
                                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.cardContent}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <TouchableOpacity 
                                                style={styles.miniAddButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    setModalVisible(true);
                                                }}
                                            >
                                                <Ionicons name="add" size={20} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.progressRingContainer}>
                                            <View style={styles.progressRing}>
                                                <Ionicons name="checkmark" size={28} color="white" />
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.miniAddButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setModalVisible(true);
                                            }}
                                        >
                                            <Ionicons name="add" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                    <View>
                                        <Text style={styles.summaryCount}>{pendingTasksCount}</Text>
                                        <Text style={styles.summaryLabel}>Pending Tasks</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Routines Summary */}
                        <TouchableOpacity 
                            style={[styles.summaryCard, { backgroundColor: '#10B981' }]}
                            onPress={() => navigation.navigate('Routines')}
                            activeOpacity={0.9}
                        > 
                            {incompleteRoutinesCount === 0 ? (
                                <>
                                    <Image 
                                        source={require('../../assets/weightlifting_man.png')} 
                                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.cardContent}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <TouchableOpacity 
                                                style={styles.miniAddButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    setRoutineModalVisible(true);
                                                }}
                                            >
                                                <Ionicons name="add" size={20} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.progressRingContainer}>
                                            <View style={styles.progressRing}>
                                                <Ionicons name="repeat" size={28} color="white" />
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.miniAddButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setRoutineModalVisible(true);
                                            }}
                                        >
                                            <Ionicons name="add" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                    <View>
                                        <Text style={styles.summaryCount}>{incompleteRoutinesCount}</Text>
                                        <Text style={styles.summaryLabel}>Upcoming Routines</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Routines Stack Section */}
                    {(() => {
                        const upcomingRoutines = todaysRoutines.filter(t => {
                            if (!t.time) return false;
                            const taskTimeInMinutes = t.time.hour * 60 + t.time.minute;
                            // Only show future routines that are not completed
                            return !t.completed && taskTimeInMinutes >= currentTimeInMinutes;
                        }).sort((a, b) => {
                            const timeA = (a.time!.hour * 60) + a.time!.minute;
                            const timeB = (b.time!.hour * 60) + b.time!.minute;
                            return timeA - timeB;
                        });

                        const routinesToShow = upcomingRoutines.length > 0 ? upcomingRoutines : [];

                        if (todaysRoutines.length === 0) return null;

                        if (routinesToShow.length === 0) {
                            return (
                                <View style={{ marginBottom: spacing.l }}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Routines</Text>
                                    </View>
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>All routines crushed! You're doing great!</Text>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View style={{ marginBottom: spacing.l }}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Up Next</Text>
                                </View>
                                <RoutineStack routines={routinesToShow} />
                            </View>
                        );
                    })()}

                    {/* Calendar */}
                    <View style={styles.calendarContainer}>
                        <ModernCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            markedDates={markedDates}
                        />
                    </View>

                    {/* Tasks Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Ionicons name="add-circle" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {todaysTasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No pending tasks. Enjoy your rest!</Text>
                        </View>
                    ) : (
                        todaysTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={toggleTaskCompleted}
                                onDelete={deleteTask}
                            />
                        ))
                    )}
                </ScrollView>

            <AddTaskModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                initialDate={selectedDate}
                onAdd={async (taskData) => {
                    createTaskForDay({ 
                        title: taskData.title, 
                        date: taskData.date,
                        reminderTime: taskData.time,
                        notificationType: taskData.notificationType
                    });

                    if (taskData.time) {
                        const triggerDate = new Date(taskData.date);
                        triggerDate.setHours(taskData.time.hour);
                        triggerDate.setMinutes(taskData.time.minute);
                        triggerDate.setSeconds(0);

                        if (triggerDate > new Date()) {
                            if (Platform.OS === 'android' && taskData.notificationType === 'alarm') {
                                await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', {
                                    extra: {
                                        'android.intent.extra.alarm.HOUR': taskData.time.hour,
                                        'android.intent.extra.alarm.MINUTES': taskData.time.minute,
                                        'android.intent.extra.alarm.MESSAGE': taskData.title,
                                        'android.intent.extra.alarm.SKIP_UI': true,
                                    },
                                });
                            } else {
                                const channelId = taskData.notificationType === 'alarm' ? 'alarms' : 'reminders';
                                const priority = taskData.notificationType === 'alarm' 
                                    ? Notifications.AndroidNotificationPriority.MAX 
                                    : Notifications.AndroidNotificationPriority.HIGH;

                                await Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: "Task Reminder",
                                        body: taskData.title,
                                        sound: true,
                                        priority,
                                        channelId,
                                    } as any,
                                    trigger: triggerDate as any,
                                });
                            }
                        }
                    }
                }}
            />
            <AddRoutineModal
                visible={isRoutineModalVisible}
                onClose={() => setRoutineModalVisible(false)}
            />
        </SafeAreaView>
        </AnimatedBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        padding: spacing.l,
        paddingBottom: 100,
    },
    calendarContainer: {
        marginBottom: spacing.l,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 24,
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        ...shadows.medium,
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    miniAddButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressRingContainer: {
        width: 60,
        height: 60,
        marginBottom: spacing.m,
    },
    progressRing: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCount: {
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    summaryLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        ...typography.h3,
    },
    headerDateContainer: {
        alignItems: 'flex-end',
    },
    headerDateText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#5e27bce0',
    },
    headerYearText: {
        fontSize: 12,
        color: '#5e27bc90',
        marginTop: 2,
    },
    summaryCardImage: {
        width: 100,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyImage: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
        marginBottom: spacing.m,
    },
    emptyText: {
        ...typography.bodySmall,
    },
});
