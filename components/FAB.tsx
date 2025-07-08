import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle
} from 'react-native';
import { Plus } from 'lucide-react-native';

interface FABProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function FAB({ onPress, style }: FABProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.3)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ scale: scaleAnim }],
          shadowOpacity: shadowOpacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});