import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../theme/tokens';
import {SessionExercise, SetRecord} from '../types/models';

interface ExerciseCardRowProps {
  exerciseName: string;
  sessionExercise: SessionExercise;
  onPress: () => void;
}

const formatLastSet = (lastSet: SetRecord | undefined): string => {
  if (!lastSet) {
    return 'No sets logged';
  }

  const weight = typeof lastSet.weight === 'number' ? `${lastSet.weight}kg` : '--kg';
  const reps = typeof lastSet.reps === 'number' ? `${lastSet.reps}` : '--';

  return `Last ${weight} x ${reps}`;
};

export const ExerciseCardRow = ({
  exerciseName,
  sessionExercise,
  onPress,
}: ExerciseCardRowProps): React.JSX.Element => {
  const nextSet = sessionExercise.sets.length + 1;
  const lastSet = sessionExercise.sets[sessionExercise.sets.length - 1];

  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.title}>{exerciseName}</Text>
      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{`Next Set #${nextSet}`}</Text>
        <Text style={styles.meta}>{formatLastSet(lastSet)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
