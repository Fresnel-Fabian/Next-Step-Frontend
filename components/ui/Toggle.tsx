import { Pressable, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle = ({ value, onValueChange, disabled }: ToggleProps) => {
  const translateX = useRef(new Animated.Value(value ? 24 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [value]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.track,
        value ? styles.trackActive : styles.trackInactive,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX }] },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  trackActive: {
    backgroundColor: '#2563EB',
  },
  trackInactive: {
    backgroundColor: '#E5E7EB',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});