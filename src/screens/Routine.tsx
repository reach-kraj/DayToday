import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableRoutineRow } from '../components/SwipeableRoutineRow';
import { useStore, Routine } from '../store';
import { Header } from '../components/Header';
import { colors, spacing, typography, shadows } from '../theme';
import { AddRoutineModal } from '../components/AddRoutineModal';
import { RoutineTimelineCard } from '../components/RoutineTimelineCard';
import { LinearGradient } from 'expo-linear-gradient';

import { useRoute, RouteProp } from '@react-navigation/native';

type RoutineScreenRouteProp = RouteProp<{
    Routines: { openCalendarId?: string; filter?: string };
}, 'Routines'>;

export const RoutineScreen = () => {
    const route = useRoute<RoutineScreenRouteProp>();
    const { routines, tasks, tasksByDate, deleteRoutine, generateTasksForDateFromRoutines } = useStore();
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'today' | 'all'>('today');
    const [openRoutineId, setOpenRoutineId] = useState<string | null>(null);

    const handleEdit = (routineId: string) => {
        setEditingRoutineId(routineId);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingRoutineId(null);
    };

    React.useEffect(() => {
        if (route.params?.filter) {
            // Map specific recurrence types to 'all' if not 'today'
            const incomingFilter = route.params.filter;
            setFilter(incomingFilter === 'today' ? 'today' : 'all');
        }
        if (route.params?.openCalendarId) {
            setOpenRoutineId(route.params.openCalendarId);
        }
    }, [route.params]);

    React.useEffect(() => {
        if (filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            generateTasksForDateFromRoutines(today);
        }
    }, [filter, generateTasksForDateFromRoutines]);

    const getFilteredRoutines = () => {
        if (filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            const todaysTaskIds = tasksByDate[today] || [];
            return todaysTaskIds
                .map(id => tasks[id])
                .filter(t => t && t.routineId)
                .map(t => routines[t.routineId!]) // Map to Routine object
                .filter(Boolean);
        }
        
        return Object.values(routines);
    };

    const filteredRoutines = getFilteredRoutines().sort((a, b) => {
         if (!a.time || !b.time) return 0;
         return (a.time.hour * 60 + a.time.minute) - (b.time.hour * 60 + b.time.minute);
    });



    const handleLongPress = (routineId: string) => {
        Alert.alert(
            'Routine Options',
            'Choose an action',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => handleEdit(routineId) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteRoutine(routineId)
                },
            ]
        );
    };

    const FilterTab = ({ type, label }: { type: typeof filter, label: string }) => (
        <TouchableOpacity 
            style={[styles.filterTab, filter === type && styles.filterTabSelected]}
            onPress={() => setFilter(type)}
        >
            <Text style={[styles.filterText, filter === type && styles.filterTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <AnimatedBackground>
            <SafeAreaView style={styles.container}>
                <Header
                    title="Routines"
                    rightElement={
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                            <Text style={styles.addButtonText}>+ New</Text>
                        </TouchableOpacity>
                    }
                />

                <View style={styles.filterContainer}>
                    <FilterTab type="today" label="Today" />
                    <FilterTab type="all" label="All Routines" />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {filteredRoutines.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No {filter} routines found.</Text>
                            <Image 
                                source={require('../../assets/routine_empty_state.png')} 
                                style={styles.emptyImage}
                            />
                        </View>
                    ) : (
                        filteredRoutines.map(routine => (
                            <View key={routine.id} style={styles.cardContainer}>
                                <SwipeableRoutineRow onDelete={() => deleteRoutine(routine.id)}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onLongPress={() => handleLongPress(routine.id)}
                                    >
                                        <RoutineTimelineCard 
                                            item={routine} 
                                            style={{ marginBottom: 0 }} 
                                            isCalendarOpen={openRoutineId === routine.id}
                                            onCalendarPress={() => setOpenRoutineId(prev => prev === routine.id ? null : routine.id)}
                                        />
                                    </TouchableOpacity>
                                </SwipeableRoutineRow>
                            </View>
                        ))
                    )}
                </ScrollView>

                <AddRoutineModal
                    visible={isModalVisible}
                    onClose={handleCloseModal}
                    editingRoutineId={editingRoutineId}
                />
            </SafeAreaView>
        </AnimatedBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        padding: spacing.l,
        paddingBottom: 100,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.m,
        gap: 8,
        justifyContent: 'flex-start',
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    filterTabSelected: {
        backgroundColor: colors.primary,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    filterText: {
        fontSize: 12, // Slightly smaller font to fit
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    filterTextSelected: {
        color: 'white',
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    cardContainer: {
        marginBottom: spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08, // Very soft opacity
        shadowRadius: 24, // Large radius for diffusion
        elevation: 3, // Lower elevation
    },
    card: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        marginBottom: 0,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderTopColor: 'rgba(255,255,255,0.7)',
        borderLeftColor: 'rgba(255,255,255,0.7)',
    },
    cardContent: {
        flex: 1,
        marginRight: spacing.m,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    cardSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.bodySmall,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    emptyImage: {
        width: 380,
        height: 380,
        resizeMode: 'contain',
        marginTop: spacing.l,
    },

});
