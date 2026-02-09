import React from 'react';
import {Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {colors, radii, sizes} from '../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PrimaryButton = ({
  label,
  onPress,
  disabled,
  danger,
  style,
}: PrimaryButtonProps): React.JSX.Element => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, {duration: 80});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {stiffness: 350, damping: 22});
      }}
      style={[
        styles.base,
        {backgroundColor: danger ? colors.danger : colors.textPrimary},
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: sizes.buttonHeight,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
