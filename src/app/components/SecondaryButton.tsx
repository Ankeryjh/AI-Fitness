import React from 'react';
import {Pressable, StyleSheet, Text, ViewStyle} from 'react-native';

import {colors, radii, sizes} from '../theme/tokens';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SecondaryButton = ({
  label,
  onPress,
  disabled,
  style,
}: SecondaryButtonProps): React.JSX.Element => {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.base, pressed && styles.pressed, disabled && styles.disabled, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
