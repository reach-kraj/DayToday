import { Routine } from '../store';

export const getRoutineOccurrences = (routine: Routine, rangeStart: Date, rangeEnd: Date): string[] => {
    const occurrences: string[] = [];
    const current = new Date(rangeStart);
    
    // Normalize start time to midnight
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(rangeEnd);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
        if (doesRoutineOccurOnDate(routine, current)) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            occurrences.push(`${year}-${month}-${day}`);
        }
        current.setDate(current.getDate() + 1);
    }
    
    return occurrences;
};

export const doesRoutineOccurOnDate = (routine: Routine, date: Date): boolean => {
    if (routine.startDate && new Date(routine.startDate) > date) return false;
    if (!routine.recurrence) return false;

    const { 
        type, 
        interval = 1, 
        weekdays, 
        dayOfMonth: rDay, 
        monthOfYear: rMonth,
        weekOfMonth,
        dayOfWeek: rDayOfWeek,
        endDate,
        occurrenceCount
    } = routine.recurrence;

    // Check End Date
    if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        if (date > endD) return false;
    }

    const start = new Date(routine.startDate || routine.createdAt);
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return false;

    // Check Occurrence Count (Theoretical)
    if (occurrenceCount) {
        // This is an approximation. Calculating exact occurrence count for complex patterns 
        // without iterating from start is hard.
        // For now, we will rely on the store's "generated tasks" count for strict enforcement,
        // or we can implement a more expensive check if needed.
        // For the calendar view, showing "potential" occurrences is usually fine.
        // However, for "Daily" and simple "Weekly", we can calculate it.
        
        if (type === 'daily') {
            const occurrenceIndex = Math.floor(diffDays / interval);
            if (occurrenceIndex >= occurrenceCount) return false;
        } else if (type === 'weekly') {
            // This is harder because of multiple weekdays.
            // Let's skip strict occurrence count check for calendar view for now 
            // to avoid performance issues, unless it's simple.
        }
    }

    if (type === 'daily') {
        return diffDays % interval === 0;
    } else if (type === 'weekly') {
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks % interval === 0) {
            const dayOfWeek = target.getDay();
            if (!weekdays || weekdays.length === 0) {
                // Default to Mon-Fri if no weekdays specified? 
                // Or maybe just the same day of week as start?
                // The store defaults to Mon-Fri (1-5).
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            } else {
                return weekdays.includes(dayOfWeek);
            }
        }
    } else if (type === 'monthly') {
        const monthDiff = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
        
        if (monthDiff >= 0 && monthDiff % interval === 0) {
            if (weekOfMonth && rDayOfWeek !== undefined) {
                // Nth Weekday logic
                const firstDayOfMonth = new Date(target.getFullYear(), target.getMonth(), 1);
                const firstDayOfWeek = firstDayOfMonth.getDay();
                
                let firstOccurrence = 1 + (rDayOfWeek - firstDayOfWeek + 7) % 7;
                let targetDate = firstOccurrence + (weekOfMonth - 1) * 7;
                
                if (weekOfMonth === 5) {
                    const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
                    while (targetDate + 7 <= daysInMonth) {
                        targetDate += 7;
                    }
                }

                return target.getDate() === targetDate;

            } else {
                // Standard Day of Month
                const targetDay = rDay || start.getDate();
                const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
                const actualTargetDay = Math.min(targetDay, daysInMonth);
                
                return target.getDate() === actualTargetDay;
            }
        }
    } else if (type === 'yearly') {
        const yearDiff = target.getFullYear() - start.getFullYear();
        const targetMonth = rMonth !== undefined ? rMonth : start.getMonth();
        
        if (yearDiff >= 0 && yearDiff % interval === 0 && target.getMonth() === targetMonth) {
             const targetDay = rDay || start.getDate();
             return target.getDate() === targetDay;
        }
    }

    return false;
};
