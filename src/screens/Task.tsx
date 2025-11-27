import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView as RNSafeAreaView, Platform, Image } from 'react-native';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { colors, spacing, typography, shadows } from '../theme';
import { addDays, subDays, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';

import { ModernCalendar } from '../components/ModernCalendar';

type ViewMode = 'Today' | 'Weekly' | 'Monthly';

export const TaskScreen = () => {
    const { tasks, tasksByDate, toggleTaskCompleted, createTaskForDay, generateTasksForDateFromRoutines, deleteTask, updateTask } = useStore();
    const [viewMode, setViewMode] = useState<ViewMode>('Today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        generateTasksForDateFromRoutines(format(selectedDate, 'yyyy-MM-dd'));
    }, [selectedDate, viewMode]);

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

    const changeDate = (days: number) => {
        setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)));
    };

    const getTasksForRange = () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const taskIds = tasksByDate[dateStr] || [];
        return taskIds.map(id => tasks[id]).filter(t => t && !t.routineId);
    };

    const currentTasks = getTasksForRange();

    const markedDates = useMemo(() => {
        const marked: { [key: string]: { marked: boolean } } = {};
        Object.keys(tasksByDate).forEach(date => {
            const dayTasks = tasksByDate[date].map(id => tasks[id]).filter(t => t && !t.routineId);
            const hasIncomplete = dayTasks.some(t => !t.completed);
            if (hasIncomplete) {
                marked[date] = { marked: true };
            }
        });
        return marked;
    }, [tasks, tasksByDate]);

    const handleEditTask = (id: string) => {
        const task = tasks[id];
        if (task) {
            setEditingTask({ id: task.id, title: task.title });
            setModalVisible(true);
        }
    };

    const handleSaveTask = async (taskData: { title: string; date: string; time?: { hour: number; minute: number }; notificationType?: 'notification' | 'alarm' }) => {
        if (editingTask) {
            updateTask(editingTask.id, { 
                title: taskData.title,
                date: taskData.date,
                reminderTime: taskData.time,
                notificationType: taskData.notificationType
            });
            setEditingTask(null);
        } else {
            createTaskForDay({ 
                title: taskData.title, 
                date: taskData.date,
                reminderTime: taskData.time,
                notificationType: taskData.notificationType
            });
        }

        // Schedule Notification or Alarm
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
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "Task Reminder",
                            body: taskData.title,
                            sound: true,
                            priority: Notifications.AndroidNotificationPriority.HIGH,
                        },
                        trigger: triggerDate as any,
                    });
                }
            }
        }

        setModalVisible(false);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingTask(null);
    };

    const renderTaskList = () => {
        const pendingTasks = currentTasks.filter(t => !t.completed);
        const completedTasks = currentTasks.filter(t => t.completed);

        if (currentTasks.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No tasks for this period.</Text>
                    <Image 
                        source={require('../../assets/task_empty_state.png')} 
                        style={styles.emptyImage}
                    />
                </View>
            );
        }

        return (
            <>
                {pendingTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTaskCompleted}
                        onDelete={deleteTask}
                        onEdit={handleEditTask}
                    />
                ))}

                {completedTasks.length > 0 && (
                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>Completed</Text>
                        <View style={styles.separatorLine} />
                    </View>
                )}

                {completedTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTaskCompleted}
                        onDelete={deleteTask}
                        onEdit={handleEditTask}
                    />
                ))}
            </>
        );
    };

    const renderWeeklyView = () => {
        // Generate 7 days for the current week (starting Sunday or Monday? Let's assume Monday as per calendar)
        const currentDay = selectedDate.getDay(); // 0-6 (Sun-Sat)
        const diffToMon = currentDay === 0 ? 6 : currentDay - 1; // Adjust to make Mon index 0
        const monday = subDays(selectedDate, diffToMon);
        
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

        return (
            <View>
                <View style={styles.weekStrip}>
                    {weekDays.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isSelected = dateStr === format(selectedDate, 'yyyy-MM-dd');
                        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                        const hasIncomplete = markedDates[dateStr]?.marked;
                        
                        return (
                            <TouchableOpacity
                                key={date.toString()}
                                style={[styles.weekDayItem, isSelected && styles.weekDaySelected]}
                                onPress={() => setSelectedDate(date)}
                            >
                                <Text style={[styles.weekDayName, isSelected && styles.weekDayTextSelected]}>
                                    {format(date, 'EEE')}
                                </Text>
                                <View style={[styles.weekDayCircle, isSelected && styles.weekDayCircleSelected, isToday && !isSelected && styles.weekDayCircleToday]}>
                                    <Text style={[styles.weekDayNumber, isSelected && styles.weekDayTextSelected]}>
                                        {format(date, 'd')}
                                    </Text>
                                    {hasIncomplete && <View style={[styles.weekDayMarker, isSelected && styles.weekDayMarkerSelected]} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={styles.dateHeader}>
                    <Text style={styles.dateTitle}>
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Text>
                </View>
                {renderTaskList()}
            </View>
        );
    };

    const renderContent = () => {
        switch (viewMode) {
            case 'Today':
                return (
                    <>
                        <View style={styles.dateHeader}>
                            <TouchableOpacity onPress={() => changeDate(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="chevron-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.dateTitle}>
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </Text>
                            <TouchableOpacity onPress={() => changeDate(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="chevron-forward" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        {renderTaskList()}
                    </>
                );
            case 'Weekly':
                return renderWeeklyView();
            case 'Monthly':
                return (
                    <>
                        <ModernCalendar
                            selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                            onDateSelect={(date) => setSelectedDate(new Date(date))}
                            markedDates={markedDates}
                        />
                        <View style={[styles.dateHeader, { marginTop: spacing.m }]}>
                            <Text style={styles.dateTitle}>
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </Text>
                        </View>
                        {renderTaskList()}
                    </>
                );
            default:
                return null;
        }
    };

    const taskToEdit = editingTask ? tasks[editingTask.id] : null;

    return (
        <AnimatedBackground>
            <SafeAreaView style={styles.container}>
                <Header
                    title="Tasks"
                    rightElement={
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                            <Text style={styles.addButtonText}>+ Add</Text>
                        </TouchableOpacity>
                    }
                />

                <View style={styles.viewSelector}>
                    {(['Today', 'Weekly', 'Monthly'] as ViewMode[]).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.viewOption, viewMode === mode && styles.viewOptionSelected]}
                            onPress={() => {
                                setViewMode(mode);
                                // Reset to today when switching modes if needed, or keep selected date
                                // keeping selected date is usually better UX
                            }}
                        >
                            <Text style={[styles.viewOptionText, viewMode === mode && styles.viewOptionTextSelected]}>
                                {mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {renderContent()}
                </ScrollView>

                <AddTaskModal
                    visible={isModalVisible}
                    onClose={handleCloseModal}
                    onAdd={handleSaveTask}
                    initialTitle={taskToEdit?.title}
                    initialDate={taskToEdit?.date || format(selectedDate, 'yyyy-MM-dd')}
                    initialTime={taskToEdit?.reminderTime}
                    initialNotificationType={taskToEdit?.notificationType}
                    isEditing={!!editingTask}
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
    viewSelector: {
        flexDirection: 'row',
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.m,
        gap: spacing.s,
    },
    viewOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    viewOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    viewOptionText: {
        ...typography.caption,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    viewOptionTextSelected: {
        color: 'white',
    },
    content: {
        padding: spacing.l,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        ...shadows.medium,
    },
    dateTitle: {
        ...typography.body,
        fontWeight: '600',
        color: 'white',
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    emptyImage: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
        marginTop: spacing.l,
    },
    weekStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
        backgroundColor: colors.primary,
        padding: spacing.s,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        ...shadows.medium,
    },
    weekDayItem: {
        alignItems: 'center',
        padding: 4,
        borderRadius: 8,
        flex: 1,
    },
    weekDaySelected: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    weekDayName: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    weekDayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekDayCircleSelected: {
        backgroundColor: 'white',
    },
    weekDayCircleToday: {
        borderWidth: 1,
        borderColor: 'white',
    },
    weekDayNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    weekDayTextSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
    weekDayMarker: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'white',
    },
    weekDayMarkerSelected: {
        backgroundColor: colors.primary,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.m,
        gap: spacing.m,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    separatorText: {
        ...typography.caption,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
