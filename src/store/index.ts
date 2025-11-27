import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export type Routine = {
    id: string;
    title: string;
    time: { hour: number; minute: number };
    recurrence: {
        type: 'daily' | 'weekly' | 'monthly' | 'yearly';
        weekdays?: number[]; // 0-6 (Sunday-Saturday)
        dayOfMonth?: number; // 1-31
        monthOfYear?: number; // 0-11
    };
    createdAt: string;
    startDate?: string;
    tags?: string[];
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
};

type StoreState = {
    routines: Record<string, Routine>;
    tasks: Record<string, DayTask>;
    tasksByDate: Record<string, string[]>;
    endOfDayTime: { hour: number; minute: number };

    createRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
    updateRoutine: (id: string, updates: Partial<Routine>) => void;
    deleteRoutine: (id: string) => void;

    createTaskForDay: (task: Omit<DayTask, 'id' | 'createdAt' | 'completed'>) => void;
    updateTask: (id: string, updates: Partial<DayTask>) => void;
    toggleTaskCompleted: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    generateTasksForDateFromRoutines: (date: string) => void;
    setEndOfDayTime: (time: { hour: number; minute: number }) => void;
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
                    return { routines: newRoutines };
                });
            },

            createTaskForDay: (taskData) => {
                const id = uuidv4();
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

                    let shouldCreate = false;
                    const { type, weekdays, dayOfMonth: rDay, monthOfYear: rMonth } = routine.recurrence;

                    if (type === 'daily') {
                        shouldCreate = true;
                    } else if (type === 'weekly') {
                        // Default to Mon-Fri if no weekdays specified, otherwise check list
                        if (!weekdays || weekdays.length === 0) {
                            if (dayOfWeek >= 1 && dayOfWeek <= 5) shouldCreate = true;
                        } else {
                            if (weekdays.includes(dayOfWeek)) shouldCreate = true;
                        }
                    } else if (type === 'monthly') {
                        const targetDay = rDay || new Date(routine.createdAt).getDate();
                        if (dayOfMonth === targetDay) shouldCreate = true;
                    } else if (type === 'yearly') {
                        const targetDay = rDay || new Date(routine.createdAt).getDate();
                        const targetMonth = rMonth !== undefined ? rMonth : new Date(routine.createdAt).getMonth();
                        if (dayOfMonth === targetDay && month === targetMonth) shouldCreate = true;
                    }

                    if (shouldCreate) {
                        const id = uuidv4();
                        const newTask: DayTask = {
                            id,
                            routineId: routine.id,
                            title: routine.title,
                            date: date,
                            time: routine.time,
                            completed: false,
                            createdAt: new Date().toISOString(),
                        };
                        newTasks.push(newTask);
                        newTaskIds.push(id);
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
        }),
        {
            name: 'daytoday-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
