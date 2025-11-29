import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        // Create date using local time
        const date = new Date(year, month, day);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return dateString === selectedDate;
    };

    const hasMarker = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, day);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return markedDates[dateString]?.marked;
    };

    const days = getDaysInMonth(currentMonth);



    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={20} color={colors.textOnGlass} />
                </TouchableOpacity>
                
                <Text style={styles.monthYear}>{formatMonthYear(currentMonth)}</Text>
                
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textOnGlass} />
                </TouchableOpacity>
            </View>

            {/* Days of week */}
            <View style={styles.daysOfWeekContainer}>
                {daysOfWeek.map((day) => (
                    <View key={day} style={styles.dayOfWeekCell}>
                        <Text style={styles.dayOfWeekText}>{day}</Text>
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
                    const marked = hasMarker(day);

                    return (
                        <TouchableOpacity
                            key={day}
                            style={styles.dayCell}
                            onPress={() => handleDayPress(day)}
                            activeOpacity={0.7}
                        >
                            {selected ? (
                                <View style={styles.selectedDayRing}>
                                    <Text style={styles.selectedDayText}>{day}</Text>
                                    {marked && <View style={[styles.marker, { backgroundColor: 'white' }]} />}
                                </View>
                            ) : (
                                <View style={[
                                    styles.dayContent,
                                    today && styles.todayContent
                                ]}>
                                    <Text style={[
                                        styles.dayText,
                                        today && styles.todayText
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
        padding: spacing.m,
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        ...shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
        paddingHorizontal: spacing.s,
    },
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    monthYear: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textOnGlass,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    daysOfWeekContainer: {
        flexDirection: 'row',
        marginBottom: spacing.s,
    },
    dayOfWeekCell: {
        width: '14.28%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
    },
    dayOfWeekText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)', // Increased opacity
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dayContent: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    todayContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    selectedDayRing: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF', // Full white for better visibility
    },
    todayText: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    selectedDayText: {
        fontSize: 15,
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
