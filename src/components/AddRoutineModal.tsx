import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, Routine } from '../store';
import { colors, spacing, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';

interface AddRoutineModalProps {
    visible: boolean;
    onClose: () => void;
    editingRoutineId?: string | null;
}

export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({ visible, onClose, editingRoutineId }) => {
    const { createRoutine, updateRoutine, routines } = useStore();

    const [title, setTitle] = useState('');
    const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
    const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [notificationType, setNotificationType] = useState<'notification' | 'alarm'>('notification');

    useEffect(() => {
        if (editingRoutineId && routines[editingRoutineId]) {
            const routine = routines[editingRoutineId];
            setTitle(routine.title);
            setRecurrenceType(routine.recurrence.type);
            const time = new Date();
            time.setHours(routine.time.hour);
            time.setMinutes(routine.time.minute);
            setSelectedTime(time);
            setSelectedWeekdays(routine.recurrence.weekdays || []);
            setSelectedDayOfMonth(routine.recurrence.dayOfMonth || new Date().getDate());
            setSelectedMonth(routine.recurrence.monthOfYear || new Date().getMonth());
            setNotificationType(routine.notificationType || 'notification');
        } else {
            resetForm();
        }
    }, [editingRoutineId, routines, visible]);

    const resetForm = () => {
        setTitle('');
        setRecurrenceType('daily');
        setSelectedTime(new Date());
        setSelectedWeekdays([]);
        setSelectedDayOfMonth(new Date().getDate());
        setSelectedMonth(new Date().getMonth());
        setNotificationType('notification');
    };

    const handleCreate = async () => {
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
                notificationType,
            };

            if (editingRoutineId) {
                updateRoutine(editingRoutineId, routineData);
            } else {
                createRoutine(routineData);
            }

            // Schedule Notification or Alarm
            if (Platform.OS === 'android' && notificationType === 'alarm') {
                const extra: any = {
                    'android.intent.extra.alarm.HOUR': selectedTime.getHours(),
                    'android.intent.extra.alarm.MINUTES': selectedTime.getMinutes(),
                    'android.intent.extra.alarm.MESSAGE': title,
                    'android.intent.extra.alarm.SKIP_UI': true,
                };

                if (recurrenceType === 'weekly' && selectedWeekdays.length > 0) {
                    // Map 0-6 (Sun-Sat) to 1-7 (Sun-Sat) for Android Alarm
                    const days = selectedWeekdays.map(d => d + 1);
                    extra['android.intent.extra.alarm.DAYS'] = days; 
                }

                await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', { extra });
            } else {
                // Schedule Expo Notification
                const channelId = notificationType === 'alarm' ? 'alarms' : 'reminders';
                const priority = notificationType === 'alarm' 
                    ? Notifications.AndroidNotificationPriority.MAX 
                    : Notifications.AndroidNotificationPriority.HIGH;

                const contentBase = {
                    title: "Routine Reminder",
                    body: title,
                    sound: true,
                    priority,
                    channelId,
                    data: { routineId: editingRoutineId || undefined }, // Optional tracking
                } as any;

                const triggerBase = {
                    hour: selectedTime.getHours(),
                    minute: selectedTime.getMinutes(),
                    repeats: true,
                };

                if (recurrenceType === 'daily') {
                    await Notifications.scheduleNotificationAsync({
                        content: contentBase,
                        trigger: triggerBase as any,
                    });
                } else if (recurrenceType === 'weekly') {
                    for (const day of selectedWeekdays) {
                        await Notifications.scheduleNotificationAsync({
                            content: contentBase,
                            trigger: { ...triggerBase, weekday: day + 1 } as any, // Expo uses 1-7 (Sun-Sat)
                        });
                    }
                } else if (recurrenceType === 'monthly') {
                    await Notifications.scheduleNotificationAsync({
                        content: contentBase,
                        trigger: { ...triggerBase, day: selectedDayOfMonth } as any,
                    });
                } else if (recurrenceType === 'yearly') {
                    await Notifications.scheduleNotificationAsync({
                        content: contentBase,
                        trigger: { ...triggerBase, month: selectedMonth, day: selectedDayOfMonth } as any,
                    });
                }
            }

            resetForm();
            onClose();
        }
    };

    const toggleWeekday = (day: number) => {
        if (selectedWeekdays.includes(day)) {
            setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
        } else {
            setSelectedWeekdays([...selectedWeekdays, day]);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
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
                        <View style={styles.notificationTypeContainer}>
                            <TouchableOpacity 
                                style={[styles.typeButton, notificationType === 'notification' && styles.typeButtonActive]}
                                onPress={() => setNotificationType('notification')}
                            >
                                <Ionicons name="notifications-outline" size={16} color={notificationType === 'notification' ? 'white' : colors.textSecondary} />
                                <Text style={[styles.typeText, notificationType === 'notification' && styles.typeTextActive]}>Notify</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.typeButton, notificationType === 'alarm' && styles.typeButtonActive]}
                                onPress={() => setNotificationType('alarm')}
                            >
                                <Ionicons name="alarm-outline" size={16} color={notificationType === 'alarm' ? 'white' : colors.textSecondary} />
                                <Text style={[styles.typeText, notificationType === 'alarm' && styles.typeTextActive]}>Alarm</Text>
                            </TouchableOpacity>
                        </View>
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
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
                            <Text style={styles.createText}>{editingRoutineId ? 'Save Changes' : 'Create Routine'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    notificationTypeContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        padding: 4,
        borderRadius: 12,
        marginTop: spacing.s,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    typeTextActive: {
        color: 'white',
    },
});
