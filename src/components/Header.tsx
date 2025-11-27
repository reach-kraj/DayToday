import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface HeaderProps {
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightElement }) => {
    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightElement && <View style={styles.right}>{rightElement}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        ...typography.h1,
        color: '#5e27bce0',
    },
    subtitle: {
        ...typography.bodySmall,
        marginTop: 4,
    },
    right: {
        justifyContent: 'center',
    },
});
