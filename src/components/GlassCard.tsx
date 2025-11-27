import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, glassCard } from '../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, gradient = false }) => {
    if (gradient) {
        return (
            <View style={[styles.container, style]}>
                <LinearGradient
                    colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradientContainer, style]}
                >
                    {children}
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={[styles.glassContainer, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        ...shadows.glass,
    },
    gradientContainer: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.borderGlass,
    },
    glassContainer: {
        ...glassCard,
        padding: 20,
    },
});
