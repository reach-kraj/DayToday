import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { DayTask } from '../store';
import { colors, spacing, typography, shadows } from '../theme';

interface TaskCardProps {
    task: DayTask;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
    hideCheckbox?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit, hideCheckbox = false }) => {
    const renderRightActions = (progress: any, dragX: any) => {
        if (hideCheckbox) return null;
        return (
            <View style={styles.checkAction}>
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            </View>
        );
    };

    const handleLongPress = () => {
        Alert.alert(
            'Task Options',
            'Choose an action',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => onEdit && onEdit(task.id) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(task.id)
                },
            ]
        );
    };

    const formatTime = (time: { hour: number; minute: number }) => {
        const period = time.hour >= 12 ? 'PM' : 'AM';
        const hour12 = time.hour % 12 || 12;
        const minuteStr = time.minute.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            onSwipeableRightOpen={() => !hideCheckbox && onToggle(task.id)}
            enabled={!hideCheckbox}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={handleLongPress}
                style={styles.card}
            >
                {!hideCheckbox && (
                    <TouchableOpacity
                        style={[styles.checkbox, task.completed && styles.checkboxChecked]}
                        onPress={() => onToggle(task.id)}
                    >
                        {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
                    </TouchableOpacity>
                )}

                <View style={styles.content}>
                    <Text style={[styles.title, task.completed && styles.titleCompleted]}>
                        {task.title}
                    </Text>
                    {task.time && (
                        <Text style={styles.timeText}>
                            {formatTime(task.time)}
                        </Text>
                    )}
                </View>

                {task.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>!</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
        ...shadows.small,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
    },
    title: {
        ...typography.body,
        fontWeight: '500',
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    timeText: {
        ...typography.caption,
        color: colors.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    priorityBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.s,
    },
    priorityText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    checkAction: {
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        marginBottom: spacing.s,
        borderRadius: 12,
        marginLeft: spacing.s,
    },
});
