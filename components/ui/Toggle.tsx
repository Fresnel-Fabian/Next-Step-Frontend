import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle = ({ value, onValueChange, disabled }: ToggleProps) => {
  const translateX = useRef(new Animated.Value(value ? 22 : 0)).current;
  const trackColor = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 22 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
      Animated.timing(trackColor, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const bg = trackColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#2563EB'],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.hitSlop, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hitSlop: {
    padding: 4, // extra tap area without affecting visual size
  },
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.4,
  },
});