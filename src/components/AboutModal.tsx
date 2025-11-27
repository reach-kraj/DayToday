import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking, Image, Platform } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface AboutModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const contacts = [
        {
            family: 'Ionicons',
            icon: 'mail-outline',
            label: 'Email',
            value: 'reach.kraj28@gmail.com',
            url: 'mailto:reach.kraj28@gmail.com',
            color: '#EA4335'
        },
        {
            family: 'Ionicons',
            icon: 'logo-instagram',
            label: 'Instagram',
            value: '@k_raj28',
            url: 'https://instagram.com/k_raj28',
            color: '#E4405F'
        },
        {
            family: 'FontAwesome6',
            icon: 'x-twitter',
            label: 'X (Twitter)',
            value: '@K_raj28',
            url: 'https://x.com/K_raj28',
            color: '#EA4335'
        }
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.modalContainer}
                    onPress={e => e.stopPropagation()}
                >
                    <View style={styles.handle} />
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>About Us</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.productInfo}>
                            <LinearGradient
                                colors={[colors.primary, '#8B5CF6']}
                                style={styles.logoPlaceholder}
                            >
                                <Text style={styles.logoText}>D</Text>
                            </LinearGradient>
                            <Text style={styles.appName}>DayToday</Text>
                            <Text style={styles.productBy}>A product of Kraj (Individual)</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Contact & Follow Us</Text>

                        <View style={styles.contactsContainer}>
                            {contacts.map((contact, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.contactRow}
                                    onPress={() => openLink(contact.url)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: contact.color + '20' }]}>
                                        {contact.family === 'FontAwesome6' ? (
                                            <FontAwesome6 name={contact.icon as any} size={20} color={contact.color} />
                                        ) : (
                                            <Ionicons name={contact.icon as any} size={22} color={contact.color} />
                                        )}
                                    </View>
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>{contact.label}</Text>
                                        <Text style={styles.contactValue}>{contact.value}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Thank you for using DayToday!</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        ...shadows.medium,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    title: {
        ...typography.h3,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: spacing.l,
    },
    productInfo: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
        ...shadows.small,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    productBy: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.m,
        letterSpacing: 0.5,
    },
    contactsContainer: {
        backgroundColor: colors.background,
        borderRadius: 16,
        overflow: 'hidden',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
});
