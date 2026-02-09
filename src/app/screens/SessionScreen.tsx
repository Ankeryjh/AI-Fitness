import React, {useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {ExerciseCardRow} from '../components/ExerciseCardRow';
import {PrimaryButton} from '../components/PrimaryButton';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useSessionStore} from '../store/sessionStore';
import {useSettingsStore} from '../store/settingsStore';
import {colors, radii, spacing} from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export const SessionScreen = ({navigation}: Props): React.JSX.Element => {
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const endActiveSession = useSessionStore(state => state.endActiveSession);
  const addExerciseToActiveSession = useSessionStore(state => state.addExerciseToActiveSession);
  const defaultRestSec = useSettingsStore(state => state.defaultRestSec);

  const [exerciseName, setExerciseName] = useState('');

  const activeSession = useMemo(
    () => sessions.find(session => session.id === activeSessionId),
    [activeSessionId, sessions],
  );

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active session</Text>
          <PrimaryButton label="Back Home" onPress={() => navigation.navigate('Home')} />
        </View>
      </SafeAreaView>
    );
  }

  const onAddExercise = () => {
    const nextId = addExerciseToActiveSession(exerciseName, defaultRestSec);
    if (nextId) {
      setExerciseName('');
      navigation.navigate('RestFocus', {sessionExerciseId: nextId});
    }
  };

  const onEndSession = () => {
    endActiveSession();
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>New Session</Text>
          <Pressable onPress={onEndSession}>
            <Text style={styles.endBtn}>End</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {activeSession.items.map(item => {
            const exerciseNameText =
              exercises.find(exercise => exercise.id === item.exerciseId)?.name ?? 'Exercise';

            return (
              <ExerciseCardRow
                key={item.id}
                exerciseName={exerciseNameText}
                sessionExercise={item}
                onPress={() => navigation.navigate('RestFocus', {sessionExerciseId: item.id})}
              />
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="Exercise name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <PrimaryButton label="Add Exercise" onPress={onAddExercise} disabled={!exerciseName.trim()} />
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
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  endBtn: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
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
