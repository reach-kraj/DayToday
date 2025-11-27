import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder, Text } from 'react-native';
import { RoutineTimelineCard } from './RoutineTimelineCard';
import { DayTask } from '../store';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface RoutineStackProps {
    routines: DayTask[];
}

export const RoutineStack: React.FC<RoutineStackProps> = ({ routines }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    forceSwipe('left');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    const forceSwipe = (direction: 'right' | 'left') => {
        const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(() => onSwipeComplete());
    };

    const onSwipeComplete = () => {
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prev => (prev + 1) % routines.length);
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
        }).start();
    };

    if (!routines.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No routines for today.</Text>
            </View>
        );
    }

    const renderCards = () => {
        if (!routines.length) return null;

        const cards = [];
        const safeIndex = currentIndex % routines.length;

        // We render 3 cards: Bottom (i+2), Middle (i+1), Top (i)
        // Reverse order for zIndex (Top last)

        // 3. Bottom Card (Index i+2)
        if (routines.length > 2) {
            const index3 = (safeIndex + 2) % routines.length;
            const routine3 = routines[index3];

            // Interpolate based on swipe
            const scale3 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [0.95, 0.9, 0.95],
                extrapolate: 'clamp'
            });
            const translateY3 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [10, 20, 10],
                extrapolate: 'clamp'
            });
            const opacity3 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [0.8, 0.6, 0.8],
                extrapolate: 'clamp'
            });

            cards.push(
                <Animated.View key={`bottom-${routine3.id}`} style={[styles.cardContainer, {
                    transform: [{ scale: scale3 }, { translateY: translateY3 }],
                    opacity: opacity3,
                    zIndex: 1
                }]}>
                    <RoutineTimelineCard routine={routine3} />
                </Animated.View>
            );
        }

        // 2. Middle Card (Index i+1)
        if (routines.length > 1) {
            const index2 = (safeIndex + 1) % routines.length;
            const routine2 = routines[index2];

            const scale2 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [1, 0.95, 1],
                extrapolate: 'clamp'
            });
            const translateY2 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [0, 10, 0],
                extrapolate: 'clamp'
            });
            const opacity2 = position.x.interpolate({
                inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
                outputRange: [1, 0.8, 1],
                extrapolate: 'clamp'
            });

            cards.push(
                <Animated.View key={`mid-${routine2.id}`} style={[styles.cardContainer, {
                    transform: [{ scale: scale2 }, { translateY: translateY2 }],
                    opacity: opacity2,
                    zIndex: 2
                }]}>
                    <RoutineTimelineCard routine={routine2} />
                </Animated.View>
            );
        }

        // 1. Top Card (Index i)
        const routine1 = routines[safeIndex];
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: ['-30deg', '0deg', '30deg'],
            extrapolate: 'clamp'
        });
        // Optional: Fade out slightly as it leaves
        const opacity1 = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp'
        });

        cards.push(
            <Animated.View
                key={`top-${routine1.id}`}
                style={[
                    styles.cardContainer,
                    {
                        transform: [
                            { translateX: position.x },
                            { translateY: position.y },
                            { rotate: rotate }
                        ],
                        opacity: opacity1,
                        zIndex: 3
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <RoutineTimelineCard routine={routine1} />
            </Animated.View>
        );

        return cards;
    };

    return (
        <View style={styles.container}>
            {renderCards()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        width: '100%',
    },
    cardContainer: {
        width: '100%',
        position: 'absolute',
    },
    nextCard: {
        transform: [{ scale: 0.95 }, { translateY: 10 }],
        opacity: 0.8,
        zIndex: 0,
    },
    emptyContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    }
});
