import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

const { width } = Dimensions.get('window');

const cardImages = [
    require('../../assets/task_card/task_card1.png'),
    require('../../assets/task_card/task_card2.png'),
    require('../../assets/task_card/task_card3.png'),
];

interface TaskNotificationCardProps {
    visible: boolean;
    onClose: () => void;
    taskTitle: string;
    taskTime: string;
    onComplete: () => void;
    onSkip: () => void;
}

export const TaskNotificationCard = ({ visible, onClose, taskTitle, taskTime, onComplete, onSkip }: TaskNotificationCardProps) => {
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
                        <Text style={styles.headerTitle}>Task</Text>
                        
                        {/* Task Name */}
                        <Text style={styles.taskName} numberOfLines={2}>{taskTitle}</Text>
                        
                        {/* Time */}
                        <Text style={styles.timeText}>{taskTime}</Text>

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
                                onPress={onComplete}
                            >
                                {({ pressed }) => (
                                    <>
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={styles.buttonText}>Mark as completed</Text>
                                        {pressed && (
                                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
                                        )}
                                    </>
                                )}
                            </Pressable>

                            <Pressable 
                                style={({ pressed }) => [
                                    styles.button, 
                                    styles.skipButton,
                                    pressed && { transform: [{ scale: 0.98 }] }
                                ]} 
                                onPress={onSkip}
                            >
                                {({ pressed }) => (
                                    <>
                                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Skip</Text>
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
        fontSize: 16,
        fontWeight: '700',
        color: '#6B46C1', // Purple color from the mockup
        marginBottom: 8,
    },
    taskName: {
        fontSize: 40,
        fontWeight: '800',
        color: '#2D1F55', // Dark purple/black
        marginBottom: 4,
        lineHeight: 44,
    },
    timeText: {
        fontSize: 18,
        color: '#6B7280', // Darker gray for better visibility
        marginBottom: 20,
    },
    imageContainer: {
        height: 350,
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
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    completeButton: {
        backgroundColor: colors.primary,
        overflow: 'hidden', // Ensure gradient respects border radius
    },
    skipButton: {
        backgroundColor: '#9CA3AF', // Grey
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },
});
