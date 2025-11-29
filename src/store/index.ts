import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { scheduleTaskNotification } from '../services/notifications';
import { doesRoutineOccurOnDate } from '../utils/recurrence';

export type Routine = {
    id: string;
    title: string;
    time: { hour: number; minute: number };
    recurrence: {
        type: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval?: number; // Every X units
        weekdays?: number[]; // 0-6 (Sunday-Saturday)
        dayOfMonth?: number; // 1-31
        monthOfYear?: number; // 0-11
        weekOfMonth?: number; // 1-4, or 5 for last
        dayOfWeek?: number; // 0-6 (for "Fourth Friday")
        endDate?: string; // ISO Date string
        occurrenceCount?: number; // End after X occurrences
    };
    createdAt: string;
    startDate?: string;
    tags?: string[];
    notificationType?: 'notification' | 'alarm';
};

export type DayTask = {
    id: string;
    routineId?: string | null;
    title: string;
    date: string; // YYYY-MM-DD
    time?: { hour: number; minute: number };
    completed: boolean;
    createdAt: string;
    priority?: 'low' | 'medium' | 'high';
    estimatedMinutes?: number;
    metadata?: Record<string, any>;
    reminderTime?: { hour: number; minute: number };
    notificationType?: 'notification' | 'alarm';
};

type StoreState = {
    routines: Record<string, Routine>;
    tasks: Record<string, DayTask>;
    tasksByDate: Record<string, string[]>;
    endOfDayTime: { hour: number; minute: number };

    createRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
    updateRoutine: (id: string, updates: Partial<Routine>) => void;
    deleteRoutine: (id: string) => void;

    createTaskForDay: (task: Omit<DayTask, 'id' | 'createdAt' | 'completed'> & { id?: string }) => void;
    updateTask: (id: string, updates: Partial<DayTask>) => void;
    toggleTaskCompleted: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    generateTasksForDateFromRoutines: (date: string) => void;
    setEndOfDayTime: (time: { hour: number; minute: number }) => void;
    markAllTasksCompleted: (date: string) => void;
    markTasksCompleted: (taskIds: string[]) => void;
    movePendingTasksToNextDay: (date: string) => void;
};

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            routines: {},
            tasks: {},
            tasksByDate: {},
            endOfDayTime: { hour: 18, minute: 0 },

            createRoutine: (routineData) => {
                const id = uuidv4();
                const newRoutine: Routine = {
                    ...routineData,
                    id,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    routines: { ...state.routines, [id]: newRoutine },
                }));
            },

            updateRoutine: (id, updates) => {
                set((state) => {
                    const updatedRoutines = { ...state.routines, [id]: { ...state.routines[id], ...updates } };

                    // Propagate changes to uncompleted tasks linked to this routine
                    const updatedTasks = { ...state.tasks };
                    Object.keys(updatedTasks).forEach(taskId => {
                        const task = updatedTasks[taskId];
                        if (task.routineId === id && !task.completed) {
                            updatedTasks[taskId] = {
                                ...task,
                                title: updates.title || task.title,
                                time: updates.time || task.time,
                            };
                        }
                    });

                    return {
                        routines: updatedRoutines,
                        tasks: updatedTasks,
                    };
                });
            },

            deleteRoutine: (id) => {
                set((state) => {
                    const newRoutines = { ...state.routines };
                    delete newRoutines[id];

                    // Find all tasks associated with this routine
                    const tasksToDelete = Object.values(state.tasks).filter(t => t.routineId === id);
                    const taskIdsToDelete = tasksToDelete.map(t => t.id);

                    const newTasks = { ...state.tasks };
                    taskIdsToDelete.forEach(taskId => delete newTasks[taskId]);

                    const newTasksByDate = { ...state.tasksByDate };
                    Object.keys(newTasksByDate).forEach(date => {
                        newTasksByDate[date] = newTasksByDate[date].filter(taskId => !taskIdsToDelete.includes(taskId));
                    });

                    return { 
                        routines: newRoutines,
                        tasks: newTasks,
                        tasksByDate: newTasksByDate
                    };
                });
            },

            createTaskForDay: (taskData) => {
                const id = taskData.id || uuidv4();
                const newTask: DayTask = {
                    ...taskData,
                    id,
                    completed: false,
                    createdAt: new Date().toISOString(),
                };

                set((state) => {
                    const date = taskData.date;
                    const existingTasks = state.tasksByDate[date] || [];
                    return {
                        tasks: { ...state.tasks, [id]: newTask },
                        tasksByDate: { ...state.tasksByDate, [date]: [...existingTasks, id] },
                    };
                });
            },

            toggleTaskCompleted: (taskId) => {
                set((state) => {
                    const task = state.tasks[taskId];
                    if (!task) return state;
                    return {
                        tasks: { ...state.tasks, [taskId]: { ...task, completed: !task.completed } },
                    };
                });
            },

            updateTask: (id, updates) => {
                set((state) => ({
                    tasks: { ...state.tasks, [id]: { ...state.tasks[id], ...updates } },
                }));
            },

            deleteTask: (taskId) => {
                set((state) => {
                    const task = state.tasks[taskId];
                    if (!task) return state;

                    const newTasks = { ...state.tasks };
                    delete newTasks[taskId];

                    const newTasksByDate = { ...state.tasksByDate };
                    if (newTasksByDate[task.date]) {
                        newTasksByDate[task.date] = newTasksByDate[task.date].filter(id => id !== taskId);
                    }

                    return {
                        tasks: newTasks,
                        tasksByDate: newTasksByDate,
                    };
                });
            },

            generateTasksForDateFromRoutines: (date) => {
                const state = get();
                const dateObj = new Date(date);
                const dayOfWeek = dateObj.getDay(); // 0-6
                const dayOfMonth = dateObj.getDate(); // 1-31
                const month = dateObj.getMonth(); // 0-11

                const existingTaskIds = state.tasksByDate[date] || [];
                const existingRoutineIds = existingTaskIds
                    .map(id => state.tasks[id].routineId)
                    .filter(Boolean);

                const newTasks: DayTask[] = [];
                const newTaskIds: string[] = [];

                Object.values(state.routines).forEach(routine => {
                    if (existingRoutineIds.includes(routine.id)) return;
                    if (routine.startDate && new Date(routine.startDate) > dateObj) return;

                    if (!routine.recurrence) return;

                    // Check Occurrence Count (Store specific check for strict enforcement)
                    if (routine.recurrence.occurrenceCount) {
                        const tasksForRoutine = Object.values(state.tasks).filter(t => t.routineId === routine.id);
                        if (tasksForRoutine.length >= routine.recurrence.occurrenceCount) return;
                    }

                    if (doesRoutineOccurOnDate(routine, dateObj)) {
                        const id = uuidv4();
                        const newTask: DayTask = {
                            id,
                            routineId: routine.id,
                            title: routine.title,
                            date: date,
                            time: routine.time,
                            completed: false,
                            createdAt: new Date().toISOString(),
                            notificationType: routine.notificationType,
                        };
                        newTasks.push(newTask);
                        newTaskIds.push(id);

                        // Schedule notification/alarm
                        if (routine.time) {
                            scheduleTaskNotification(
                                id,
                                routine.title,
                                date,
                                routine.time,
                                routine.notificationType
                            );
                        }
                    }
                });

                if (newTasks.length > 0) {
                    set((state) => {
                        const updatedTasks = { ...state.tasks };
                        newTasks.forEach(t => updatedTasks[t.id] = t);

                        return {
                            tasks: updatedTasks,
                            tasksByDate: {
                                ...state.tasksByDate,
                                [date]: [...(state.tasksByDate[date] || []), ...newTaskIds],
                            },
                        };
                    });
                }
            },

            setEndOfDayTime: (time) => set({ endOfDayTime: time }),

            markAllTasksCompleted: (date) => {
                set((state) => {
                    const taskIds = state.tasksByDate[date] || [];
                    if (taskIds.length === 0) return state;

                    const updatedTasks = { ...state.tasks };
                    let hasChanges = false;

                    taskIds.forEach(id => {
                        if (updatedTasks[id] && !updatedTasks[id].completed) {
                            updatedTasks[id] = { ...updatedTasks[id], completed: true };
                            hasChanges = true;
                        }
                    });

                    if (!hasChanges) return state;

                    return { tasks: updatedTasks };
                });
            },

            markTasksCompleted: (taskIds) => {
                set((state) => {
                    if (taskIds.length === 0) return state;

                    const updatedTasks = { ...state.tasks };
                    let hasChanges = false;

                    taskIds.forEach(id => {
                        if (updatedTasks[id] && !updatedTasks[id].completed) {
                            updatedTasks[id] = { ...updatedTasks[id], completed: true };
                            hasChanges = true;
                        }
                    });

                    if (!hasChanges) return state;

                    return { tasks: updatedTasks };
                });
            },

            movePendingTasksToNextDay: (date) => {
                set((state) => {
                    const taskIds = state.tasksByDate[date] || [];
                    if (taskIds.length === 0) return state;

                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    const nextDateStr = nextDate.toISOString().split('T')[0];

                    const updatedTasks = { ...state.tasks };
                    const updatedTasksByDate = { ...state.tasksByDate };
                    const movedTaskIds: string[] = [];

                    taskIds.forEach(id => {
                        const task = updatedTasks[id];
                        if (task && !task.completed && !task.routineId) { // Only move non-routine tasks? Or all? User said "pending task". Usually routines are re-generated. Let's move manual tasks.
                            // Actually, if it's a routine task, it should probably just be marked missed or ignored, 
                            // as the next day will generate its own routine instance.
                            // But for now, let's move EVERYTHING that is pending, as the user might want to complete that specific instance.
                            // Wait, if I move a routine instance, it becomes a "manual" task on the next day effectively?
                            // Let's keep it simple: Move all pending tasks.
                            
                            updatedTasks[id] = { ...task, date: nextDateStr };
                            movedTaskIds.push(id);
                        }
                    });

                    if (movedTaskIds.length === 0) return state;

                    // Remove from old date
                    updatedTasksByDate[date] = updatedTasksByDate[date].filter(id => !movedTaskIds.includes(id));
                    
                    // Add to new date
                    updatedTasksByDate[nextDateStr] = [...(updatedTasksByDate[nextDateStr] || []), ...movedTaskIds];

                    return {
                        tasks: updatedTasks,
                        tasksByDate: updatedTasksByDate,
                    };
                });
            },
        }),
        {
            name: 'daytoday-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
