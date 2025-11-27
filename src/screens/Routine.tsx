import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore, Routine } from '../store';
import { Header } from '../components/Header';
import { colors, spacing, typography, shadows } from '../theme';

export const RoutineScreen = () => {
    const { routines, createRoutine, deleteRoutine, updateRoutine } = useStore();
    const [isModalVisible, setModalVisible] = useState(false);

    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
    const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

    const handleCreate = () => {
        if (title.trim()) {
            const routineData = {
                title,
                time: { hour: selectedTime.getHours(), minute: selectedTime.getMinutes() },
                recurrence: {
                    type: recurrenceType,
                    weekdays: recurrenceType === 'weekly' ? selectedWeekdays : undefined,
                    dayOfMonth: (recurrenceType === 'monthly' || recurrenceType === 'yearly') ? selectedDayOfMonth : undefined,
                    monthOfYear: recurrenceType === 'yearly' ? selectedMonth : undefined,
                },
            };

            if (editingRoutineId) {
                updateRoutine(editingRoutineId, routineData);
            } else {
                createRoutine(routineData);
            }
            resetForm();
            setModalVisible(false);
        }
    };

    const handleEdit = (routine: Routine) => {
        setTitle(routine.title);
        setRecurrenceType(routine.recurrence.type);

        const time = new Date();
        time.setHours(routine.time.hour);
        time.setMinutes(routine.time.minute);
        setSelectedTime(time);

        setSelectedWeekdays(routine.recurrence.weekdays || []);
        setSelectedDayOfMonth(routine.recurrence.dayOfMonth || new Date().getDate());
        setSelectedMonth(routine.recurrence.monthOfYear || new Date().getMonth());

        setEditingRoutineId(routine.id);
        setModalVisible(true);
    };

    const resetForm = () => {
        setTitle('');
        setRecurrenceType('daily');
        setSelectedTime(new Date());
        setSelectedWeekdays([]);
        setSelectedDayOfMonth(new Date().getDate());
        setSelectedMonth(new Date().getMonth());
        setEditingRoutineId(null);
    };

    const toggleWeekday = (day: number) => {
        if (selectedWeekdays.includes(day)) {
            setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
        } else {
            setSelectedWeekdays([...selectedWeekdays, day]);
        }
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
                <Ionicons name="trash-outline" size={24} color="white" />
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
                    </View>
                ) : (
                    routineList.map(routine => (
                        <Swipeable
                            key={routine.id}
                            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, routine.id)}
                            onSwipeableRightOpen={() => deleteRoutine(routine.id)}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onLongPress={() => handleLongPress(routine)}
                                style={styles.card}
                            >
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{routine.title}</Text>
                                    <Text style={styles.cardSubtitle}>
                                        {routine.recurrence.type.charAt(0).toUpperCase() + routine.recurrence.type.slice(1)} • {formatTime(routine.time.hour, routine.time.minute)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    ))
                )}
            </ScrollView>

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContainer}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.handle} />
                        <Text style={styles.modalHeader}>{editingRoutineId ? 'Edit Routine' : 'New Routine'}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Routine Title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Time:</Text>
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                display="spinner"
                                is24Hour={false}
                                locale="en-US"
                                onChange={(event, date) => date && setSelectedTime(date)}
                                style={{ alignSelf: 'flex-start', width: 120 }}
                            />
                        </View>

                        <View style={styles.recurrenceSelector}>
                            <Text style={styles.label}>Recurrence:</Text>
                            <View style={styles.radioGroup}>
                                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.radio, recurrenceType === type && styles.radioSelected]}
                                        onPress={() => setRecurrenceType(type)}
                                    >
                                        <Text style={[styles.radioText, recurrenceType === type && styles.radioTextSelected]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {recurrenceType === 'weekly' && (
                            <View style={styles.weekdaySelector}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.weekdayBtn, selectedWeekdays.includes(index) && styles.weekdayBtnSelected]}
                                        onPress={() => toggleWeekday(index)}
                                    >
                                        <Text style={[styles.weekdayText, selectedWeekdays.includes(index) && styles.weekdayTextSelected]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => { resetForm(); setModalVisible(false); }} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
                                <Text style={styles.createText}>{editingRoutineId ? 'Save Changes' : 'Create Routine'}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.l,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.m,
        marginBottom: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.small,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    cardSubtitle: {
        ...typography.caption,
        marginTop: 2,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.bodySmall,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: spacing.l,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.l,
    },
    modalHeader: {
        ...typography.h2,
        marginBottom: spacing.l,
    },
    input: {
        backgroundColor: colors.background,
        padding: spacing.m,
        borderRadius: 12,
        marginBottom: spacing.m,
        fontSize: 16,
    },
    formGroup: {
        marginBottom: spacing.m,
    },
    recurrenceSelector: {
        marginBottom: spacing.l,
    },
    label: {
        ...typography.bodySmall,
        marginBottom: spacing.s,
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    radio: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    radioSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    radioText: {
        color: colors.text,
    },
    radioTextSelected: {
        color: 'white',
    },
    weekdaySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
    },
    weekdayBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayBtnSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    weekdayText: {
        color: colors.text,
        fontSize: 12,
    },
    weekdayTextSelected: {
        color: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.m,
        marginTop: spacing.m,
    },
    cancelButton: {
        padding: spacing.m,
    },
    cancelText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderRadius: 12,
    },
    createText: {
        color: 'white',
        fontWeight: '600',
    },
    deleteAction: {
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        marginBottom: spacing.m,
        borderRadius: 12,
        marginLeft: spacing.s,
    },
});
