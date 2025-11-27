import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';
import { DayTask } from '../store';

interface RoutineTimelineCardProps {
    routine: DayTask;
}

export const RoutineTimelineCard: React.FC<RoutineTimelineCardProps> = ({ routine }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming');

    useEffect(() => {
        const updateProgress = () => {
            if (!routine.time) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const routineMinutes = routine.time.hour * 60 + routine.time.minute;

            // Assume a "window" for the routine, e.g., starts 1 hour before
            const startWindow = routineMinutes - 60;

            if (currentMinutes >= routineMinutes) {
                setProgress(1);
                setStatus('completed');
            } else if (currentMinutes < startWindow) {
                setProgress(0);
                setStatus('upcoming');
            } else {
                // Calculate progress within the 1-hour window
                const p = (currentMinutes - startWindow) / 60;
                setProgress(p);
                setStatus('active');
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
                {routine.time && <Text style={styles.time}>{formatTime(routine.time)}</Text>}
            </View>

            <View style={styles.timelineContainer}>
                <View style={styles.timelineBackground} />
                <View style={[styles.timelineFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.footer}>
                <Text style={styles.statusText}>
                    {status === 'completed' ? 'Time is up!' :
                        status === 'active' ? 'In progress' :
                            'Upcoming'}
                </Text>
                {status !== 'completed' && (
                    <Text style={styles.remainingText}>
                        {Math.round((1 - progress) * 60)}m remaining
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
    time: {
        ...typography.bodyBold,
        color: 'rgba(255,255,255,0.9)',
    },
    timelineContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
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
