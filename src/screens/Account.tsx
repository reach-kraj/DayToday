import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { colors, spacing, typography, shadows } from '../theme';
import * as Notifications from 'expo-notifications';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AboutModal } from '../components/AboutModal';
import DateTimePicker from '@react-native-community/datetimepicker';

export const AccountScreen = () => {
    const { endOfDayTime, setEndOfDayTime } = useStore();
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        // Register notification category for End of Day
        Notifications.setNotificationCategoryAsync('END_OF_DAY_CATEGORY', [
            {
                identifier: 'MARK_ALL_COMPLETED',
                buttonTitle: 'Mark all as completed',
                options: {
                    isDestructive: false,
                    isAuthenticationRequired: false,
                },
            },
        ]);
    }, []);

    const scheduleEndOfDayNotification = async (hour: number, minute: number) => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "End of Day Review",
                body: "You have pending tasks! Tap to review.",
                categoryIdentifier: 'END_OF_DAY_CATEGORY',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { type: 'END_OF_DAY' },
                channelId: 'end_of_day',
            } as any,
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: hour,
                minute: minute,
                repeats: true,
            },
        });
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
            if (selectedDate) {
                const hour = selectedDate.getHours();
                const minute = selectedDate.getMinutes();
                setEndOfDayTime({ hour, minute });
                scheduleEndOfDayNotification(hour, minute);
            }
        } else {
            // iOS
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const confirmIOSDate = () => {
        const hour = tempDate.getHours();
        const minute = tempDate.getMinutes();
        setEndOfDayTime({ hour, minute });
        scheduleEndOfDayNotification(hour, minute);
        setShowTimePicker(false);
    };

    const openTimePicker = () => {
        setTempDate(new Date(new Date().setHours(endOfDayTime.hour, endOfDayTime.minute)));
        setShowTimePicker(true);
    };

    const renderCard = (title: string, subtitle?: string, rightElement?: React.ReactNode, onPress?: () => void) => (
        <View style={styles.cardContainer}>
            <TouchableOpacity 
                activeOpacity={onPress ? 0.7 : 1} 
                onPress={onPress}
                style={styles.card}
                disabled={!onPress}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{title}</Text>
                        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
                    </View>
                    {rightElement}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <AnimatedBackground>
            <SafeAreaView style={styles.container}>
                <Header title="Account" />

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Settings</Text>
                        {renderCard(
                            "End of Day Reminder",
                            `Receive a summary at ${(() => {
                                const h = endOfDayTime.hour;
                                const m = endOfDayTime.minute;
                                const period = h >= 12 ? 'PM' : 'AM';
                                const h12 = h % 12 || 12;
                                return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
                            })()}`,
                            <Ionicons name="time-outline" size={24} color="white" />,
                            openTimePicker
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Support</Text>
                        {renderCard(
                            "About Us",
                            "Learn more about DayToday",
                            <Ionicons name="information-circle-outline" size={24} color="white" />,
                            () => setShowAboutModal(true)
                        )}
                        {renderCard(
                            "Donate",
                            "Support the development",
                            <Ionicons name="heart-outline" size={24} color="white" />,
                            () => Alert.alert('Donate', 'Support us to keep DayToday ad-free!')
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.version}>DayToday v1.0.0</Text>
                    </View>
                </ScrollView>

                <AboutModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} />

                {showTimePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={new Date(new Date().setHours(endOfDayTime.hour, endOfDayTime.minute))}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={handleTimeChange}
                    />
                )}

                {Platform.OS === 'ios' && (
                    <Modal
                        transparent={true}
                        visible={showTimePicker}
                        animationType="slide"
                        onRequestClose={() => setShowTimePicker(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Text style={styles.modalButton}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={confirmIOSDate}>
                                        <Text style={[styles.modalButton, styles.modalButtonDone]}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={handleTimeChange}
                                    textColor="black"
                                />
                            </View>
                        </View>
                    </Modal>
                )}
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
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        ...typography.h3,
        marginBottom: spacing.m,
        color: colors.primary,
        marginLeft: spacing.xs,
    },
    cardContainer: {
        marginBottom: spacing.m,
        ...shadows.medium,
    },
    card: {
        backgroundColor: colors.primary,
        borderRadius: 16,
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
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    cardSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    version: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.5)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalButton: {
        fontSize: 16,
        color: colors.primary,
    },
    modalButtonDone: {
        fontWeight: '600',
    },
});
