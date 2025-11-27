import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { DayTask } from '../store';
import { colors, spacing, typography, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

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
            <View style={{ width: 80, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.s }}>
                <View style={styles.checkAction}>
                    <Ionicons name="checkmark" size={28} color="white" />
                </View>
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
        <View style={styles.container}>
            <Swipeable
                renderRightActions={renderRightActions}
                onSwipeableRightOpen={() => !hideCheckbox && onToggle(task.id)}
                enabled={!hideCheckbox}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={handleLongPress}
                    style={[styles.card, task.completed && styles.cardCompleted]}
                >
                    <LinearGradient
                        colors={task.completed 
                            ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] 
                            : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        {!hideCheckbox && (
                            <TouchableOpacity
                                style={[styles.checkbox, task.completed && styles.checkboxChecked]}
                                onPress={() => onToggle(task.id)}
                            >
                                {task.completed && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        )}

                        <View style={styles.content}>
                            <Text style={[styles.title, task.completed && styles.titleCompleted]}>
                                {typeof task.title === 'object' 
                                    ? (task.title as any).title || 'Untitled Task' 
                                    : task.title}
                            </Text>
                        </View>

                        {(task.time || task.reminderTime) && (
                            <View style={styles.metaContainer}>
                                <Text style={styles.timeText}>
                                    {formatTime(task.time || task.reminderTime!)}
                                </Text>
                                {task.notificationType && (
                                    <Ionicons 
                                        name={task.notificationType === 'alarm' ? 'alarm-outline' : 'notifications-outline'} 
                                        size={20} 
                                        color="rgba(255,255,255,0.9)" 
                                        style={{ marginLeft: 8 }}
                                    />
                                )}
                            </View>
                        )}

                        {task.priority === 'high' && (
                            <View style={styles.priorityBadge}>
                                <Text style={styles.priorityText}>!</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Swipeable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
        ...shadows.medium,
    },
    card: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        minHeight: 80,
        overflow: 'hidden',
    },
    cardCompleted: {
        backgroundColor: '#9CA3AF',
    },
    cardGradient: {
        padding: spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderTopColor: 'rgba(255,255,255,0.7)',
        borderLeftColor: 'rgba(255,255,255,0.7)',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
        marginRight: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    content: {
        flex: 1,
    },
    title: {
        ...typography.body,
        fontWeight: '500',
        color: 'white',
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    timeText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.m,
    },
    priorityBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.s,
        borderWidth: 1,
        borderColor: 'white',
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
        width: 56,
        height: 56,
        borderRadius: 28,
        ...shadows.small,
    },
});
