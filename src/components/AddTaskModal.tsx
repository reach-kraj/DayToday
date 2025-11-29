import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../theme';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (task: { title: string; date: string; time?: { hour: number; minute: number }; notificationType?: 'notification' | 'alarm' }) => void;
    initialTitle?: string;
    initialDate?: string;
    initialTime?: { hour: number; minute: number };
    initialNotificationType?: 'notification' | 'alarm';
    isEditing?: boolean;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
    visible, 
    onClose, 
    onAdd, 
    initialTitle = '', 
    initialDate, 
    initialTime,
    initialNotificationType = 'notification',
    isEditing = false 
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : new Date());
    
    // Initialize time from props
    const getInitialTimeDate = () => {
        if (!initialTime) return null;
        const d = new Date();
        d.setHours(initialTime.hour);
        d.setMinutes(initialTime.minute);
        return d;
    };

    const [selectedTime, setSelectedTime] = useState<Date | null>(getInitialTimeDate());
    const [notificationType, setNotificationType] = useState<'notification' | 'alarm'>(initialNotificationType);
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        setTitle(initialTitle);
        if (visible) {
            setSelectedDate(initialDate ? new Date(initialDate) : new Date());
            
            if (initialTime) {
                const d = new Date();
                d.setHours(initialTime.hour);
                d.setMinutes(initialTime.minute);
                setSelectedTime(d);
            } else {
                setSelectedTime(null);
            }
            
            setNotificationType(initialNotificationType);
        }
    }, [initialTitle, initialDate, initialTime, initialNotificationType, visible]);

    const handleAdd = () => {
        if (title.trim()) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const timeData = selectedTime ? {
                hour: selectedTime.getHours(),
                minute: selectedTime.getMinutes()
            } : undefined;

            onAdd({
                title,
                date: dateStr,
                time: timeData,
                notificationType: selectedTime ? notificationType : undefined
            });
            setTitle('');
            onClose();
        }
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setSelectedDate(date);
    };

    const onTimeChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (date) setSelectedTime(date);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardView}
                        >
                            <View style={styles.container}>
                                <View style={styles.handle} />
                                <Text style={styles.header}>{isEditing ? 'Edit Task' : 'New Task'}</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="What needs to be done?"
                                    placeholderTextColor={colors.textSecondary}
                                    value={title}
                                    onChangeText={setTitle}
                                    autoFocus
                                    returnKeyType="done"
                                />

                                <View style={styles.optionsContainer}>
                                    {/* Date Picker */}
                                    <TouchableOpacity style={styles.optionRow} onPress={() => setShowDatePicker(true)}>
                                        <View style={styles.optionLabel}>
                                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                            <Text style={styles.optionText}>Date</Text>
                                        </View>
                                        <Text style={styles.optionValue}>{selectedDate.toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                    
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={selectedDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                            onChange={onDateChange}
                                            minimumDate={new Date()}
                                            style={Platform.OS === 'ios' ? { height: 300 } : undefined}
                                        />
                                    )}

                                    {/* Time Picker */}
                                    <TouchableOpacity style={styles.optionRow} onPress={() => setShowTimePicker(true)}>
                                        <View style={styles.optionLabel}>
                                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                                            <Text style={styles.optionText}>Reminder</Text>
                                        </View>
                                        <Text style={styles.optionValue}>
                                            {selectedTime ? selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'None'}
                                        </Text>
                                    </TouchableOpacity>

                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={selectedTime || new Date()}
                                            mode="time"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            is24Hour={false}
                                            onChange={onTimeChange}
                                            locale="en-US"
                                        />
                                    )}

                                    {/* Notification Type (Only if time is selected) */}
                                    {selectedTime && (
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
                                    )}
                                </View>

                                <View style={styles.buttons}>
                                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleAdd} style={[styles.addButton, !title.trim() && styles.disabledButton]} disabled={!title.trim()}>
                                        <Text style={styles.addText}>{isEditing ? 'Save' : 'Add Task'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.l,
        paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.l,
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
        marginBottom: spacing.m,
    },
    header: {
        ...typography.h3,
        marginBottom: spacing.m,
        textAlign: 'center',
    },
    input: {
        backgroundColor: colors.background,
        padding: spacing.m,
        borderRadius: 16,
        marginBottom: spacing.m,
        fontSize: 17,
        color: colors.text,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionsContainer: {
        marginBottom: spacing.l,
        gap: spacing.s,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.xs,
    },
    optionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    optionText: {
        ...typography.body,
        color: colors.text,
    },
    optionValue: {
        ...typography.body,
        color: colors.primary,
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
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.m,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.m,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: colors.background,
    },
    cancelText: {
        ...typography.bodyBold,
        color: colors.textSecondary,
    },
    addButton: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 16,
        alignItems: 'center',
        ...shadows.small,
    },
    disabledButton: {
        backgroundColor: colors.border,
        opacity: 0.7,
    },
    addText: {
        ...typography.bodyBold,
        color: 'white',
    },
});
