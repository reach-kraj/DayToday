import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../theme';
import { DayTask, Routine, useStore } from '../store';
import { ModernCalendar } from './ModernCalendar';
import { getRoutineOccurrences } from '../utils/recurrence';

interface RoutineTimelineCardProps {
    item: DayTask | Routine;
    style?: ViewStyle;
    onCalendarPress?: () => void;
    initiallyOpen?: boolean;
    isCalendarOpen?: boolean;
}

export const RoutineTimelineCard: React.FC<RoutineTimelineCardProps> = ({ item, style, onCalendarPress, initiallyOpen = false, isCalendarOpen }) => {
    const { routines } = useStore();
    
    if (!item) return null;

    // Resolve the Routine object (for recurrence details)
    // If item has routineId, it's a DayTask linked to a Routine.
    // If item doesn't have routineId but has recurrence, it's a Routine.
    const routine = 'routineId' in item && item.routineId 
        ? routines[item.routineId] 
        : (item as Routine);

    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
    const [timeText, setTimeText] = useState('');
    const [internalShowCalendar, setInternalShowCalendar] = useState(initiallyOpen);

    useEffect(() => {
        if (initiallyOpen) {
            setInternalShowCalendar(true);
        }
    }, [initiallyOpen]);

    const showCalendar = isCalendarOpen !== undefined ? isCalendarOpen : internalShowCalendar;

    useEffect(() => {
        const updateProgress = () => {
            if (!item.time) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const routineMinutes = item.time.hour * 60 + item.time.minute;
            
            const diffMinutes = routineMinutes - currentMinutes;

            // Calculate progress based on the entire day (00:00 to Routine Time)
            let p = 0;
            if (routineMinutes > 0) {
                p = currentMinutes / routineMinutes;
            } else {
                p = 1;
            }
            
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
        const interval = setInterval(updateProgress, 60000);
        return () => clearInterval(interval);
    }, [item]);

    const formatTime = (time: { hour: number; minute: number }) => {
        const period = time.hour >= 12 ? 'PM' : 'AM';
        const hour12 = time.hour % 12 || 12;
        const minuteStr = time.minute.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    };

    const getRecurrenceText = () => {
        if (!routine || !routine.recurrence) return '';
        const { type, interval, weekdays, dayOfMonth, monthOfYear, weekOfMonth, dayOfWeek } = routine.recurrence;
        
        let text = '';
        if (interval && interval > 1) text += `Every ${interval} `;
        
        if (type === 'daily') text += interval && interval > 1 ? 'days' : 'Daily';
        else if (type === 'weekly') {
            text += interval && interval > 1 ? 'weeks' : 'Weekly';
            if (weekdays && weekdays.length > 0) {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                text += ' on ' + weekdays.map(d => days[d]).join(', ');
            }
        } else if (type === 'monthly') {
            text += interval && interval > 1 ? 'months' : 'Monthly';
            if (weekOfMonth && dayOfWeek !== undefined) {
                const ordinals = ['1st', '2nd', '3rd', '4th', 'Last'];
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                text += ` on the ${ordinals[weekOfMonth - 1]} ${days[dayOfWeek]}`;
            } else if (dayOfMonth) {
                text += ` on day ${dayOfMonth}`;
            }
        } else if (type === 'yearly') {
            text += interval && interval > 1 ? 'years' : 'Yearly';
            if (monthOfYear !== undefined && dayOfMonth) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                text += ` on ${months[monthOfYear]} ${dayOfMonth}`;
            }
        }
        return text;
    };

    const getMarkedDates = () => {
        if (!routine) return {};
        
        // Generate dates for the current month (and maybe next)
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0); // 2 months range

        const dates = getRoutineOccurrences(routine, start, end);
        
        const marked: any = {};
        dates.forEach(date => {
            marked[date] = { 
                marked: true, 
                dotColor: colors.accent 
            };
        });
        
        return marked;
    };

    return (
        <View style={[styles.card, style]}>
            <View style={styles.mainContent}>
                <View style={styles.infoContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    
                    <View style={styles.metaRow}>
                        {item.time && (
                            <TouchableOpacity 
                                style={styles.metaItem}
                                onPress={() => {
                                    if (onCalendarPress) {
                                        onCalendarPress();
                                    } else {
                                        setInternalShowCalendar(!internalShowCalendar);
                                    }
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="white" />
                                <Text style={styles.metaText}>{formatTime(item.time)}</Text>
                            </TouchableOpacity>
                        )}
                        {routine && (
                            <View style={styles.metaItem}>
                                {/* <Ionicons name="repeat-outline" size={14} color="rgba(255,255,255,0.7)" /> */}
                                <Text style={styles.metaText}>{getRecurrenceText()}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => {
                        if (onCalendarPress) {
                            onCalendarPress();
                        } else {
                            setInternalShowCalendar(!internalShowCalendar);
                        }
                    }}
                    style={styles.calendarButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons 
                        name={showCalendar ? "calendar" : "calendar-outline"} 
                        size={32} 
                        color="white" 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.timelineContainer}>
                <View style={styles.timelineBackground} />
                <View style={[styles.timelineFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.footer}>
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusDot, 
                        { backgroundColor: status === 'active' ? '#4ADE80' : status === 'completed' ? '#94A3B8' : '#FBBF24' }
                    ]} />
                    <Text style={styles.statusText}>
                        {status === 'completed' ? 'Completed' :
                            status === 'active' ? 'In Progress' :
                                'Upcoming'}
                    </Text>
                </View>
                {status !== 'completed' && (
                    <Text style={styles.remainingText}>
                        {timeText}
                    </Text>
                )}
            </View>

            {showCalendar && (
                <View style={styles.calendarContainer}>
                   <ModernCalendar 
                        selectedDate={new Date().toISOString().split('T')[0]}
                        onDateSelect={() => {}}
                        markedDates={getMarkedDates()}
                   />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: spacing.l,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
    },
    mainContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.m,
    },
    infoContainer: {
        flex: 1,
        marginRight: spacing.m,
    },
    title: {
        ...typography.h3,
        color: 'white',
        fontSize: 22,
        marginBottom: spacing.xs,
        lineHeight: 28,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.m,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    calendarButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    timelineContainer: {
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        ...typography.caption,
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    remainingText: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        fontSize: 13,
    },
    calendarContainer: {
        marginTop: spacing.m,
        paddingTop: spacing.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
});
