import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { colors, spacing, typography, shadows } from '../theme';
import { addDays, subDays, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export const TaskScreen = () => {
    const { tasks, tasksByDate, toggleTaskCompleted, createTaskForDay, generateTasksForDateFromRoutines, deleteTask, updateTask } = useStore();
    const [viewMode, setViewMode] = useState<ViewMode>('Daily');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        generateTasksForDateFromRoutines(format(selectedDate, 'yyyy-MM-dd'));
    }, [selectedDate, viewMode]);

    const changeDate = (days: number) => {
        setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)));
    };

    const getTasksForRange = () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const taskIds = tasksByDate[dateStr] || [];
        // Filter out tasks that are generated from routines (have a routineId)
        return taskIds.map(id => tasks[id]).filter(t => t && !t.routineId);
    };

    const currentTasks = getTasksForRange();

    const handleEditTask = (id: string) => {
        const task = tasks[id];
        if (task) {
            setEditingTask({ id: task.id, title: task.title });
            setModalVisible(true);
        }
    };

    const handleSaveTask = (title: string) => {
        if (editingTask) {
            updateTask(editingTask.id, { title });
            setEditingTask(null);
        } else {
            createTaskForDay({ title, date: format(selectedDate, 'yyyy-MM-dd') });
        }
        setModalVisible(false);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingTask(null);
    };

    return (
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
                {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as ViewMode[]).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.viewOption, viewMode === mode && styles.viewOptionSelected]}
                        onPress={() => setViewMode(mode)}
                    >
                        <Text style={[styles.viewOptionText, viewMode === mode && styles.viewOptionTextSelected]}>
                            {mode}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.dateHeader}>
                    <TouchableOpacity onPress={() => changeDate(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.dateTitle}>
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Text>
                    <TouchableOpacity onPress={() => changeDate(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {currentTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No tasks for this period.</Text>
                    </View>
                ) : (
                    currentTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTaskCompleted}
                            onDelete={deleteTask}
                            onEdit={handleEditTask}
                        />
                    ))
                )}
            </ScrollView>

            <AddTaskModal
                visible={isModalVisible}
                onClose={handleCloseModal}
                onAdd={handleSaveTask}
                initialTitle={editingTask?.title}
                isEditing={!!editingTask}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        backgroundColor: colors.surface,
    },
    viewOptionSelected: {
        backgroundColor: colors.primary,
    },
    viewOptionText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
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
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 12,
        ...shadows.small,
    },
    dateTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: 8,
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
    },
});
