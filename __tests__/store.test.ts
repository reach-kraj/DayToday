import { useStore } from '../src/store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-' + Math.random()),
}));

// Mock react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({}));

describe('Store Logic', () => {
    beforeEach(() => {
        useStore.setState({
            routines: {},
            tasks: {},
            tasksByDate: {},
        });
    });

    it('creates a routine', () => {
        const { createRoutine } = useStore.getState();
        createRoutine({
            title: 'Test Routine',
            time: { hour: 9, minute: 0 },
            recurrence: { type: 'daily' },
        });

        const state = useStore.getState();
        const routineList = Object.values(state.routines);
        expect(routineList).toHaveLength(1);
        expect(routineList[0].title).toBe('Test Routine');
    });

    it('generates tasks from routines', () => {
        const { createRoutine, generateTasksForDateFromRoutines } = useStore.getState();

        // Create a daily routine
        createRoutine({
            title: 'Daily Habit',
            time: { hour: 9, minute: 0 },
            recurrence: { type: 'daily' },
        });

        // Generate for today
        const today = '2023-10-27';
        generateTasksForDateFromRoutines(today);

        const state = useStore.getState();
        const tasks = state.tasksByDate[today];

        expect(tasks).toBeDefined();
        expect(tasks).toHaveLength(1);

        const task = state.tasks[tasks[0]];
        expect(task.title).toBe('Daily Habit');
        expect(task.date).toBe(today);
    });
});
