import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { RoutineTimelineCard } from '../components/RoutineTimelineCard';
import { RoutineStack } from '../components/RoutineStack';
import { colors, spacing, typography, shadows } from '../theme';

export const DashboardScreen = () => {
    const { tasks, tasksByDate, toggleTaskCompleted, createTaskForDay, generateTasksForDateFromRoutines, deleteTask } = useStore();
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = React.useCallback(() => {
        generateTasksForDateFromRoutines(selectedDate);
    }, [selectedDate, generateTasksForDateFromRoutines]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

    const todaysTaskIds = tasksByDate[selectedDate] || [];
    const allTodaysItems = todaysTaskIds.map(id => tasks[id]).filter(Boolean);

    const todaysTasks = allTodaysItems.filter(t => !t.routineId);
    const todaysRoutines = allTodaysItems.filter(t => t.routineId);

    const completedCount = allTodaysItems.filter(t => t.completed).length;
    const totalCount = allTodaysItems.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

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

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Dashboard"
            />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.calendarContainer}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        firstDay={1} // Monday start
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: colors.surface,
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.textSecondary,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: '#d9e1e8',
                            dotColor: colors.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: colors.primary,
                            monthTextColor: colors.text,
                            indicatorColor: colors.primary,
                            textDayFontFamily: 'System',
                            textMonthFontFamily: 'System',
                            textDayHeaderFontFamily: 'System',
                            textDayFontWeight: '400',
                            textMonthFontWeight: '600',
                            textDayHeaderFontWeight: '400',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 13
                        }}
                        style={styles.calendar}
                    />
                </View>

                {/* Routines Section */}
                {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    const currentTimeInMinutes = currentHour * 60 + currentMinute;

                    // Filter and sort routines
                    const upcomingRoutines = todaysRoutines.filter(t => {
                        if (!t.time) return false;
                        const taskTimeInMinutes = t.time.hour * 60 + t.time.minute;
                        // Show routines that haven't finished yet (or finished very recently)
                        // Let's show all routines for the day, but sorted.
                        // Or if the user wants "next routine show up", maybe we should show all of them but highlight the next one?
                        // The user said "if one routine finished then next routine show up in a sequntial order".
                        // This implies completed/past routines should disappear.

                        // Let's check if the routine is "finished".
                        // A routine is finished if its time has passed.
                        // Let's give it a buffer of 1 minute or so, or just strict time.
                        return taskTimeInMinutes >= currentTimeInMinutes;
                    }).sort((a, b) => {
                        const timeA = (a.time!.hour * 60) + a.time!.minute;
                        const timeB = (b.time!.hour * 60) + b.time!.minute;
                        return timeA - timeB;
                    });

                    // If no upcoming routines, maybe show "All done for today" or show all routines?
                    // For now, let's just show the upcoming ones.
                    // Wait, if the user says "routine is also missing", maybe they have no upcoming routines?
                    // Let's check if there are ANY routines for today.

                    const routinesToShow = upcomingRoutines.length > 0 ? upcomingRoutines : [];

                    if (todaysRoutines.length === 0) return null; // No routines at all for today

                    if (routinesToShow.length === 0) {
                        return (
                            <View>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Routines</Text>
                                </View>
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>All routines completed for today!</Text>
                                </View>
                                <View style={{ marginBottom: spacing.l }} />
                                <View style={styles.divider} />
                            </View>
                        );
                    }

                    return (
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Up Next</Text>
                            </View>
                            <RoutineStack routines={routinesToShow} />
                            <View style={{ marginBottom: spacing.s }} />
                            <View style={styles.divider} />
                            <View style={{ marginBottom: spacing.s }} />
                        </View>
                    );
                })()}

                {/*     Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Daily Progress</Text>
                        <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressSubtitle}>
                        {completedCount} of {totalCount} items completed
                    </Text>
                </View>

                {/* Tasks Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tasks</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {todaysTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No tasks for this day.</Text>
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
                onAdd={(title) => createTaskForDay({ title, date: selectedDate })}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.l,
    },
    calendarContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: spacing.l,
        ...shadows.small,
    },
    calendar: {
        borderRadius: 16,
    },
    progressCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: spacing.l,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.m,
    },
    progressTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 17,
        fontWeight: '600',
    },
    progressPercent: {
        color: 'white',
        fontSize: 34,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        marginBottom: spacing.s,
    },
    progressBarFill: {
        height: 6,
        backgroundColor: 'white',
        borderRadius: 3,
    },
    progressSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
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
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.bodySmall,
    },
    nextRoutineCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.l,
        marginBottom: spacing.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.medium,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    nextRoutineLabel: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nextRoutineTitle: {
        ...typography.h4,
        fontSize: 18,
    },
    timeContainer: {
        alignItems: 'flex-end',
    },
    timeRemaining: {
        ...typography.h3,
        color: colors.primary,
        fontSize: 24,
    },
    timeLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        width: '100%',
    },
});
