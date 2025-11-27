import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (title: string) => void;
    initialTitle?: string;
    isEditing?: boolean;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onAdd, initialTitle = '', isEditing = false }) => {
    const [title, setTitle] = useState(initialTitle);

    React.useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle, visible]);

    const handleAdd = () => {
        if (title.trim()) {
            onAdd(title);
            setTitle('');
            onClose();
        }
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
                                    onSubmitEditing={handleAdd}
                                />

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
        marginBottom: spacing.l,
        fontSize: 17,
        color: colors.text,
        borderWidth: 1,
        borderColor: 'transparent',
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
