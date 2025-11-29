import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export const AnimatedBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <View style={styles.container}>
            {/* Base Gradient - Subtle Grey */}
            <LinearGradient
                colors={[colors.appBackgroundStart, colors.appBackgroundEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            
            <Image 
                source={require('../../assets/noise_texture.png')}
                style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}
                resizeMode="repeat"
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
