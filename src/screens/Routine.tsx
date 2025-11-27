import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore, Routine } from '../store';
import { Header } from '../components/Header';
import { colors, spacing, typography, shadows } from '../theme';
import { AddRoutineModal } from '../components/AddRoutineModal';
import { LinearGradient } from 'expo-linear-gradient';

export const RoutineScreen = () => {
    const { routines, deleteRoutine } = useStore();
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

    const handleEdit = (routine: Routine) => {
        setEditingRoutineId(routine.id);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingRoutineId(null);
    };

    const routineList = Object.values(routines);

    const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const minuteStr = minute.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    };

    const renderRightActions = (progress: any, dragX: any, id: string) => {
        return (
            <View style={styles.deleteAction}>
                <Ionicons name="trash-outline" size={20} color="white" />
            </View>
        );
    };

    const handleLongPress = (routine: Routine) => {
        Alert.alert(
            'Routine Options',
            'Choose an action',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => handleEdit(routine) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteRoutine(routine.id)
                },
            ]
        );
    };

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

                <ScrollView contentContainerStyle={styles.content}>
                    {routineList.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No routines yet. Create one to automate your habits.</Text>
                            <Image 
                                source={require('../../assets/routine_empty_state.png')} 
                                style={styles.emptyImage}
                            />
                        </View>
                    ) : (
                        routineList.map(routine => (
                            <View key={routine.id} style={styles.cardContainer}>
                                <Swipeable
                                    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, routine.id)}
                                    onSwipeableRightOpen={() => deleteRoutine(routine.id)}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onLongPress={() => handleLongPress(routine)}
                                        style={styles.card}
                                    >
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.cardGradient}
                                        >
                                            <View style={styles.cardContent}>
                                                <Text style={styles.cardTitle}>{routine.title}</Text>
                                                <Text style={styles.cardSubtitle}>
                                                    {routine.recurrence.type.charAt(0).toUpperCase() + routine.recurrence.type.slice(1)}
                                                </Text>
                                            </View>
                                            <View style={styles.timeContainer}>
                                                <Text style={styles.timeText}>
                                                    {formatTime(routine.time.hour, routine.time.minute)}
                                                </Text>
                                                {routine.notificationType && (
                                                    <Ionicons 
                                                        name={routine.notificationType === 'alarm' ? 'alarm-outline' : 'notifications-outline'} 
                                                        size={20} 
                                                        color="rgba(255,255,255,0.9)" 
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                )}
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Swipeable>
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
        ...shadows.medium,
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
    deleteAction: {
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 16,
        marginLeft: spacing.s,
    },
});
