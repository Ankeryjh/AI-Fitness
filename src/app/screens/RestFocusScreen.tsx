import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {SecondaryButton} from '../components/SecondaryButton';
import {SetLogRow} from '../components/SetLogRow';
import {TimerRing} from '../components/TimerRing';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useRestStore} from '../store/restStore';
import {useSessionStore} from '../store/sessionStore';
import {useSettingsStore} from '../store/settingsStore';
import {formatClock} from '../services/format';
import {colors, radii, sizes, spacing} from '../theme/tokens';
import {PrimaryButton} from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'RestFocus'>;

const parseOptionalNumber = (text: string): number | undefined => {
  if (!text.trim()) {
    return undefined;
  }
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

export const RestFocusScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessionExerciseId = route.params.sessionExerciseId;
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const completeSet = useSessionStore(state => state.completeSet);
  const startNextSet = useSessionStore(state => state.startNextSet);

  const defaultRestSec = useSettingsStore(state => state.defaultRestSec);
  const stepSec = useSettingsStore(state => state.stepSec);
  const soundEnabled = useSettingsStore(state => state.soundEnabled);
  const vibrationEnabled = useSettingsStore(state => state.vibrationEnabled);

  const restState = useRestStore(state => state.restState);
  const restDurationSec = useRestStore(state => state.restDurationSec);
  const activeSessionExerciseId = useRestStore(state => state.activeSessionExerciseId);
  const startRest = useRestStore(state => state.startRest);
  const pauseRest = useRestStore(state => state.pauseRest);
  const resumeRest = useRestStore(state => state.resumeRest);
  const addTime = useRestStore(state => state.addTime);
  const markDoneIfNeeded = useRestStore(state => state.markDoneIfNeeded);
  const getRemainingMs = useRestStore(state => state.getRemainingMs);
  const resetToIdle = useRestStore(state => state.resetToIdle);

  const snapshot = useMemo(() => {
    for (const session of sessions) {
      const item = session.items.find(ex => ex.id === sessionExerciseId);
      if (!item) {
        continue;
      }

      return {
        item,
        exercise: exercises.find(exercise => exercise.id === item.exerciseId),
      };
    }
    return null;
  }, [exercises, sessionExerciseId, sessions]);

  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());

  const pulseScale = useSharedValue(1);
  const numberScale = useSharedValue(1);
  const previousStateRef = useRef(restState);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{scale: pulseScale.value}],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{scale: numberScale.value}],
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      useRestStore.getState().markDoneIfNeeded(now);
    }, 250);

    return () => clearInterval(timer);
  }, [markDoneIfNeeded]);

  useEffect(() => {
    const prev = previousStateRef.current;

    if (
      activeSessionExerciseId === sessionExerciseId &&
      restState === 'DONE' &&
      prev !== 'DONE'
    ) {
      pulseScale.value = withSequence(
        withTiming(1.03, {duration: 130}),
        withTiming(1, {duration: 130}),
      );
      if (vibrationEnabled) {
        Vibration.vibrate(120);
      }
    }

    previousStateRef.current = restState;
  }, [activeSessionExerciseId, pulseScale, restState, sessionExerciseId, vibrationEnabled]);

  if (!snapshot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Exercise not found</Text>
          <PrimaryButton label="Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const isActiveTimerForThisExercise = activeSessionExerciseId === sessionExerciseId;
  const timerState = isActiveTimerForThisExercise ? restState : 'IDLE';
  const blockedByOtherTimer =
    activeSessionExerciseId !== null &&
    activeSessionExerciseId !== sessionExerciseId &&
    restState !== 'IDLE';

  const exerciseName = snapshot.exercise?.name ?? 'Exercise';
  const sets = snapshot.item.sets;
  const lastSet = sets[sets.length - 1];

  const configuredDurationSec =
    snapshot.item.restSecOverride ?? snapshot.exercise?.defaultRestSec ?? defaultRestSec;

  const totalMs = (isActiveTimerForThisExercise ? restDurationSec : configuredDurationSec) * 1000;
  const remainingMs = isActiveTimerForThisExercise ? getRemainingMs(nowMs) : configuredDurationSec * 1000;

  const progress =
    timerState === 'IDLE' ? 0 : Math.max(0, Math.min(1, (totalMs - Math.max(0, remainingMs)) / totalMs));

  const displayTimerText =
    remainingMs >= 0
      ? formatClock(Math.ceil(remainingMs / 1000))
      : `+${Math.abs(Math.floor(remainingMs / 1000))}s`;

  const onCompleteSet = async () => {
    const now = Date.now();

    completeSet({
      sessionExerciseId,
      endedAtMs: now,
      weight: parseOptionalNumber(weightInput),
      reps: parseOptionalNumber(repsInput),
    });

    await startRest({
      durationSec: configuredDurationSec,
      sessionExerciseId,
      exerciseName,
      soundEnabled,
      vibrationEnabled,
    });
  };

  const onStartNextSet = async () => {
    startNextSet({
      sessionExerciseId,
      startedAtMs: Date.now(),
    });

    await resetToIdle();
  };

  const onAddTime = () => {
    addTime(stepSec);
    numberScale.value = withSequence(
      withTiming(1.05, {duration: 80}),
      withTiming(1, {duration: 80}),
    );
  };

  const setLabel = `Set ${sets.length + (timerState === 'IDLE' ? 1 : 0)}`;
  const lastSetMeta = lastSet
    ? `Last ${lastSet.weight ?? '--'}kg x ${lastSet.reps ?? '--'}`
    : 'Last --';

  const pauseLabel = timerState === 'PAUSED' ? 'Resume' : 'Pause';
  const pauseDisabled = timerState === 'IDLE' || timerState === 'DONE' || blockedByOtherTimer;
  const mainLabel = timerState === 'IDLE' ? 'Complete Set' : 'Start Next Set';

  const onMainPress = timerState === 'IDLE' ? onCompleteSet : onStartNextSet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.exerciseTitle}>{exerciseName}</Text>
            <Text style={styles.headerMeta}>{`${setLabel} / ${lastSetMeta}`}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {blockedByOtherTimer ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Another exercise timer is running. Finish it first.</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.ringWrapper, pulseStyle]}>
          <TimerRing progress={progress} done={timerState === 'DONE'} />
          <Animated.Text
            style={[
              styles.timerText,
              timerState === 'DONE' && styles.timerDone,
              numberStyle,
            ]}>
            {displayTimerText}
          </Animated.Text>
        </Animated.View>

        <View style={styles.inputRow}>
          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder="Weight (kg)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={repsInput}
            onChangeText={setRepsInput}
            placeholder="Reps"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.controls}>
          <SecondaryButton
            label={`+${stepSec}s`}
            onPress={onAddTime}
            disabled={timerState === 'IDLE' || blockedByOtherTimer}
            style={styles.sideButton}
          />

          <PrimaryButton
            label={mainLabel}
            onPress={onMainPress}
            disabled={blockedByOtherTimer}
            style={styles.mainButton}
          />

          <SecondaryButton
            label={pauseLabel}
            onPress={timerState === 'PAUSED' ? resumeRest : pauseRest}
            disabled={pauseDisabled}
            style={styles.sideButton}
          />
        </View>

        <View style={styles.logSection}>
          <Text style={styles.logTitle}>Recent Sets</Text>
          {sets.length === 0 ? (
            <Text style={styles.emptyLog}>No set records yet</Text>
          ) : (
            sets
              .slice(-3)
              .reverse()
              .map(record => <SetLogRow key={record.id} setRecord={record} />)
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  exerciseTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  headerMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  banner: {
    marginTop: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  ringWrapper: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },
  timerText: {
    position: 'absolute',
    fontSize: sizes.timerNumber,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timerDone: {
    color: colors.danger,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sideButton: {
    flex: 1,
    minHeight: 56,
  },
  mainButton: {
    flex: 2,
  },
  logSection: {
    marginTop: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  logTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyLog: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.pageX,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
});
