import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../theme';

interface ModernCalendarProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    markedDates?: { [key: string]: any };
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({ selectedDate, onDateSelect, markedDates = {} }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust for Monday start

        const days: (number | null)[] = [];
        
        // Add empty slots for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        
        return days;
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDayPress = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        onDateSelect(dateString);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        return dateString === selectedDate;
    };

    const isWeekend = (dayIndex: number) => {
        return dayIndex >= 5; // Saturday and Sunday
    };

    const hasMarker = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        return markedDates[dateString]?.marked;
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.textOnGlass} />
                </TouchableOpacity>
                
                <Text style={styles.monthYear}>{formatMonthYear(currentMonth)}</Text>
                
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color={colors.textOnGlass} />
                </TouchableOpacity>
            </View>

            {/* Days of week */}
            <View style={styles.daysOfWeekContainer}>
                {daysOfWeek.map((day, index) => (
                    <View key={day} style={styles.dayOfWeekCell}>
                        <Text style={[
                            styles.dayOfWeekText,
                            isWeekend(index) && styles.weekendText
                        ]}>
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
                {days.map((day, index) => {
                    if (day === null) {
                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                    }

                    const selected = isSelected(day);
                    const today = isToday(day);
                    const weekend = isWeekend(index % 7);
                    const marked = hasMarker(day);

                    return (
                        <TouchableOpacity
                            key={day}
                            style={styles.dayCell}
                            onPress={() => handleDayPress(day)}
                            activeOpacity={0.7}
                        >
                            {selected ? (
                                <View style={styles.selectedDayContainer}>
                                    <LinearGradient
                                        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.selectedDayGradient}
                                    >
                                        <Text style={styles.selectedDayText}>{day}</Text>
                                    </LinearGradient>
                                </View>
                            ) : (
                                <View style={[
                                    styles.dayContainer,
                                    today && styles.todayContainer,
                                ]}>
                                    <Text style={[
                                        styles.dayText,
                                        today && styles.todayText,
                                        weekend && styles.weekendDayText,
                                    ]}>
                                        {day}
                                    </Text>
                                    {marked && <View style={styles.marker} />}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthYear: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textOnGlass,
        letterSpacing: 0.5,
    },
    daysOfWeekContainer: {
        flexDirection: 'row',
        marginBottom: spacing.m,
    },
    dayOfWeekCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    dayOfWeekText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 0.5,
    },
    weekendText: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        padding: 4,
    },
    dayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    todayContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    selectedDayContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        ...shadows.medium,
    },
    selectedDayGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textOnGlass,
    },
    todayText: {
        fontWeight: '700',
        color: colors.textOnGlass,
    },
    weekendDayText: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    selectedDayText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    marker: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.accent,
    },
});
