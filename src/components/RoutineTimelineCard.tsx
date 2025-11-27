import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../theme';
import { DayTask } from '../store';

interface RoutineTimelineCardProps {
    routine: DayTask;
}

export const RoutineTimelineCard: React.FC<RoutineTimelineCardProps> = ({ routine }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
    const [timeText, setTimeText] = useState('');

    useEffect(() => {
        const updateProgress = () => {
            if (!routine.time) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const routineMinutes = routine.time.hour * 60 + routine.time.minute;
            
            const diffMinutes = routineMinutes - currentMinutes;

            // Calculate progress based on the entire day (00:00 to Routine Time)
            // This shows how much of the "waiting time" has passed
            let p = 0;
            if (routineMinutes > 0) {
                p = currentMinutes / routineMinutes;
            } else {
                p = 1; // If routine is at 00:00 and it's past that
            }
            
            // Clamp progress
            p = Math.max(0, Math.min(1, p));
            setProgress(p);

            if (diffMinutes <= 0) {
                setStatus('completed');
                setTimeText('Time is up!');
            } else {
                setStatus(diffMinutes <= 60 ? 'active' : 'upcoming');
                
                if (diffMinutes < 60) {
                    setTimeText(`${diffMinutes}m remaining`);
                } else {
                    const hours = Math.floor(diffMinutes / 60);
                    const mins = diffMinutes % 60;
                    setTimeText(`${hours}h ${mins}m remaining`);
                }
            }
        };

        updateProgress();
        const interval = setInterval(updateProgress, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [routine]);

    const formatTime = (time: { hour: number; minute: number }) => {
        const period = time.hour >= 12 ? 'PM' : 'AM';
        const hour12 = time.hour % 12 || 12;
        const minuteStr = time.minute.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{routine.title}</Text>
                <View style={styles.timeContainer}>
                    {routine.time && <Text style={styles.time}>{formatTime(routine.time)}</Text>}
                    {routine.notificationType && (
                        <Ionicons 
                            name={routine.notificationType === 'alarm' ? 'alarm-outline' : 'notifications-outline'} 
                            size={18} 
                            color="rgba(255,255,255,0.9)" 
                            style={{ marginLeft: 6 }}
                        />
                    )}
                </View>
            </View>

            <View style={styles.timelineContainer}>
                <View style={styles.timelineBackground} />
                <View style={[styles.timelineFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.footer}>
                <Text style={styles.statusText}>
                    {status === 'completed' ? 'Completed' :
                        status === 'active' ? 'In Progress' :
                            'Upcoming'}
                </Text>
                {status !== 'completed' && (
                    <Text style={styles.remainingText}>
                        {timeText}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: spacing.l,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        ...shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    title: {
        ...typography.h3,
        color: 'white',
        fontSize: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        ...typography.bodyBold,
        color: 'rgba(255,255,255,0.9)',
    },
    timelineContainer: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        marginBottom: spacing.m,
        overflow: 'hidden',
    },
    timelineBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'transparent',
    },
    timelineFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 3,
    },
    indicator: {
        display: 'none', // Remove indicator for cleaner look
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusText: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    remainingText: {
        ...typography.caption,
        color: 'white',
        fontWeight: 'bold',
    },
});
