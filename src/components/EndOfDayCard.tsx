import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Pressable, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

const { width, height } = Dimensions.get('window');

const cardImages = [
    require('../../assets/pending_task/pending_card1.png'),
    require('../../assets/pending_task/pending_card2.png'),
];

interface TaskItem {
    id: string;
    title: string;
    time?: string;
}

interface EndOfDayCardProps {
    visible: boolean;
    onClose: () => void;
    pendingTasks: TaskItem[];
    onMarkAllComplete: () => void;
    onMoveRemainingToNextDay: (completedTaskIds: string[]) => void;
}

export const EndOfDayCard = ({ visible, onClose, pendingTasks, onMarkAllComplete, onMoveRemainingToNextDay }: EndOfDayCardProps) => {
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);

    // Reset selection when card opens
    React.useEffect(() => {
        if (visible) {
            setSelectedTaskIds([]);
        }
    }, [visible]);

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTaskIds(prev => {
            if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
            } else {
                return [...prev, taskId];
            }
        });
    };

    const randomImage = React.useMemo(() => {
        if (!visible) return cardImages[0];
        return cardImages[Math.floor(Math.random() * cardImages.length)];
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                
                <View style={styles.cardWrapper}>
                    {/* Card Background with Frosted Glass effect */}
                    <BlurView intensity={80} tint="light" style={styles.blurBackground}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.8)', '#FFFFFF']}
                            locations={[0, 0.4, 1]}
                            style={StyleSheet.absoluteFill}
                        />
                    </BlurView>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>

                        {/* Header */}
                        <Text style={styles.headerTitle}>End of Day Review</Text>
                        
                        <Text style={styles.subTitle}>
                            You have <Text style={{fontWeight: '700', color: colors.primary}}>{pendingTasks.length}</Text> pending tasks
                        </Text>

                        {/* Task List */}
                        <View style={styles.listContainer}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                                {pendingTasks.map((task, index) => {
                                    const isSelected = selectedTaskIds.includes(task.id);
                                    return (
                                        <TouchableOpacity 
                                            key={task.id} 
                                            style={styles.taskItem}
                                            onPress={() => toggleTaskSelection(task.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                                {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                            </View>
                                            <View style={{flex: 1}}>
                                                <Text style={[styles.taskTitle, isSelected && styles.taskTitleSelected]} numberOfLines={1}>
                                                    {task.title}
                                                </Text>
                                                {task.time && <Text style={styles.taskTime}>{task.time}</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Image */}
                        <View style={styles.imageContainer}>
                            <Image source={randomImage} style={styles.image} resizeMode="contain" />
                        </View>

                        {/* Separator */}
                        <View style={styles.separator} />

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <Pressable 
                                style={({ pressed }) => [
                                    styles.button, 
                                    styles.completeButton,
                                    pressed && { transform: [{ scale: 0.98 }] }
                                ]} 
                                onPress={onMarkAllComplete}
                            >
                                {({ pressed }) => (
                                    <>
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={styles.buttonText}>Mark all as completed</Text>
                                        {pressed && (
                                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                                        )}
                                    </>
                                )}
                            </Pressable>

                            <Pressable 
                                style={({ pressed }) => [
                                    styles.button, 
                                    styles.moveButton,
                                    pressed && { transform: [{ scale: 0.98 }] }
                                ]} 
                                onPress={() => onMoveRemainingToNextDay(selectedTaskIds)}
                            >
                                {({ pressed }) => (
                                    <>
                                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                            {selectedTaskIds.length > 0 
                                                ? `Complete ${selectedTaskIds.length} & Move Rest` 
                                                : "Move All to Next Day"}
                                        </Text>
                                        {pressed && (
                                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                                        )}
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 20,
    },
    cardWrapper: {
        width: width * 0.9,
        maxHeight: height * 0.85,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    blurBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        padding: 24,
        paddingTop: 28,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D1F55',
        marginBottom: 4,
    },
    subTitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    listContainer: {
        maxHeight: 150,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },
    listContent: {
        gap: 12,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    taskTitleSelected: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    taskTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    imageContainer: {
        height: 200,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0, 
    },
    image: {
        width: '100%',
        height: '100%',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 20,
        width: '100%',
    },
    buttonContainer: {
        flexDirection: 'column',
        gap: 12,
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    completeButton: {
        backgroundColor: colors.primary,
    },
    moveButton: {
        backgroundColor: '#F59E0B', // Amber/Orange for moving
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
});
