import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedProps,
    withSpring,
    withTiming,
    runOnJS,
    useAnimatedReaction,
    cancelAnimation,
    Easing,
    useDerivedValue,
    interpolate
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import * as Haptics from 'expo-haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = -80;
const MAX_SWIPE = -120;
const HOLD_DURATION = 3000; // 3 seconds

interface SwipeableRoutineRowProps {
    children: React.ReactNode;
    onDelete: () => void;
}

export const SwipeableRoutineRow: React.FC<SwipeableRoutineRowProps> = ({ children, onDelete }) => {
    const translateX = useSharedValue(0);
    const progress = useSharedValue(0);
    const isDeleting = useSharedValue(false);
    const context = useSharedValue({ x: 0 });

    // Haptic feedback helper
    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const pan = Gesture.Pan()
        .onBegin(() => {
            context.value = { x: translateX.value };
        })
        .onUpdate((event) => {
            if (isDeleting.value) return;
            
            const newValue = event.translationX + context.value.x;
            // Limit swipe to left only, with some resistance past max
            if (newValue < MAX_SWIPE) {
                const extra = newValue - MAX_SWIPE;
                translateX.value = MAX_SWIPE + extra * 0.2;
            } else {
                translateX.value = Math.min(0, newValue);
            }
        })
        .onEnd(() => {
            if (isDeleting.value) return;

            // Always spring back on release
            translateX.value = withSpring(0);
            
            // Reset progress immediately on release
            cancelAnimation(progress);
            progress.value = withTiming(0);
        });

    // Monitor threshold crossing to start/stop timer
    useAnimatedReaction(
        () => translateX.value < DELETE_THRESHOLD,
        (isPastThreshold, previous) => {
            if (isDeleting.value) return;

            if (isPastThreshold && !previous) {
                // Started holding past threshold
                runOnJS(triggerHaptic)();
                progress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
            } else if (!isPastThreshold && previous) {
                // Moved back before completion
                cancelAnimation(progress);
                progress.value = withTiming(0);
            }
        }
    );

    // Monitor completion
    useAnimatedReaction(
        () => progress.value,
        (currentValue) => {
            if (currentValue >= 1 && !isDeleting.value) {
                isDeleting.value = true;
                runOnJS(triggerHaptic)();
                runOnJS(onDelete)();
            }
        }
    );

    const rStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const iconStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateX.value,
            [0, DELETE_THRESHOLD],
            [0.5, 1],
            'clamp'
        );
        return {
            transform: [{ scale }],
            opacity: interpolate(translateX.value, [-20, DELETE_THRESHOLD], [0, 1]),
        };
    });

    // SVG Circle props
    // SVG Circle props
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    
    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * (1 - progress.value),
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.deleteContainer}>
                <Animated.View style={[styles.iconContainer, iconStyle]}>
                    <Svg width={50} height={50} viewBox="0 0 50 50">
                        {/* Background Circle */}
                        <Circle
                            cx="25"
                            cy="25"
                            r={radius}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="3"
                            fill="transparent"
                        />
                        {/* Progress Circle */}
                        <AnimatedCircle
                            cx="25"
                            cy="25"
                            r={radius}
                            stroke={colors.danger}
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={circumference}
                            animatedProps={animatedProps}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="25, 25"
                        />
                    </Svg>
                    <View style={styles.trashIcon}>
                        <Ionicons name="trash" size={28} color={colors.danger} />
                    </View>
                </Animated.View>
            </View>

            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.cardWrapper, rStyle]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 0, // Handled by child
    },
    deleteContainer: {
        position: 'absolute',
        right: 20,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    iconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trashIcon: {
        position: 'absolute',
    },
    cardWrapper: {
        zIndex: 1,
    },
});
