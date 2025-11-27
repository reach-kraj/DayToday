import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export const AnimatedBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 10000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const colorStart = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [colors.backgroundGradientStart, '#f093fb', colors.backgroundGradientStart],
    });

    const colorEnd = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [colors.backgroundGradientEnd, '#f5576c', colors.backgroundGradientEnd],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={[colorStart as any, colorEnd as any]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
