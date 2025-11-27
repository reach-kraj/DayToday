import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { colors, spacing, typography, shadows } from '../theme';
import * as Notifications from 'expo-notifications';

export const AccountScreen = () => {
    const { endOfDayTime, setEndOfDayTime } = useStore();

    const handleNotificationTest = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Notification",
                body: "This is a test notification from DayToday.",
            },
            trigger: null,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Account" />

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Settings</Text>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowTitle}>End of Day Notification</Text>
                            <Text style={styles.rowSubtitle}>
                                Receive a summary at {endOfDayTime.hour.toString().padStart(2, '0')}:{endOfDayTime.minute.toString().padStart(2, '0')}
                            </Text>
                        </View>
                        {/* Simple mock toggle for now, time picker would go here */}
                        <Switch value={true} onValueChange={() => { }} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Data</Text>
                    <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Export', 'Data export feature coming soon.')}>
                        <Text style={styles.buttonText}>Export Data</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Debug</Text>
                    <TouchableOpacity style={styles.button} onPress={handleNotificationTest}>
                        <Text style={styles.buttonText}>Test Notification</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>DayToday v1.0.0</Text>
                </View>
            </View>
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
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        ...typography.h3,
        marginBottom: spacing.m,
        color: colors.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 12,
        ...shadows.small,
    },
    rowTitle: {
        ...typography.body,
        fontWeight: '500',
    },
    rowSubtitle: {
        ...typography.caption,
        marginTop: 2,
    },
    button: {
        backgroundColor: colors.surface,
        padding: spacing.m,
        borderRadius: 12,
        alignItems: 'center',
        ...shadows.small,
        marginBottom: spacing.s,
    },
    buttonText: {
        color: colors.text,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    version: {
        ...typography.caption,
    },
});
