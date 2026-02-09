import React, {useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';
import {formatDateTime, formatDuration} from '../services/format';
import {colors, radii, spacing} from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

export const HistoryDetailScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);

  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt)),
    [sessions],
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    route.params?.sessionId ?? orderedSessions[0]?.id ?? null,
  );

  const selectedSession = useMemo(
    () => orderedSessions.find(session => session.id === selectedSessionId) ?? orderedSessions[0],
    [orderedSessions, selectedSessionId],
  );

  const summary = selectedSession ? getWorkoutSummary(selectedSession) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>History</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionTitle}>Sessions</Text>
        <View style={styles.card}>
          {orderedSessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet</Text>
          ) : (
            orderedSessions.map(session => {
              const isActive = session.id === selectedSession?.id;
              const itemSummary = getWorkoutSummary(session);

              return (
                <Pressable
                  key={session.id}
                  onPress={() => setSelectedSessionId(session.id)}
                  style={[styles.sessionRow, isActive && styles.selectedRow]}>
                  <View>
                    <Text style={styles.sessionDate}>{formatDateTime(session.startAt)}</Text>
                    <Text style={styles.sessionMeta}>{`${itemSummary.totalSets} sets`}</Text>
                  </View>
                  <Text style={styles.sessionMeta}>{formatDuration(itemSummary.totalDurationSec)}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {selectedSession && summary ? (
          <>
            <Text style={styles.sectionTitle}>Workout Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{`Total Duration: ${formatDuration(summary.totalDurationSec)}`}</Text>
              <Text style={styles.summaryText}>{`Total Sets: ${summary.totalSets}`}</Text>
              <Text style={styles.summaryText}>{`Average Rest: ${summary.averageRestSec}s`}</Text>
            </View>

            <Text style={styles.sectionTitle}>Exercises</Text>
            {selectedSession.items.map(item => {
              const name = exercises.find(exercise => exercise.id === item.exerciseId)?.name ?? 'Exercise';

              return (
                <View key={item.id} style={styles.exerciseCard}>
                  <Text style={styles.exerciseName}>{name}</Text>
                  {item.sets.length === 0 ? (
                    <Text style={styles.emptyText}>No sets</Text>
                  ) : (
                    item.sets.map(setRecord => {
                      const weight =
                        typeof setRecord.weight === 'number' ? `${setRecord.weight}kg` : '--kg';
                      const reps = typeof setRecord.reps === 'number' ? `${setRecord.reps}` : '--';
                      const rest =
                        typeof setRecord.restActualSec === 'number'
                          ? `${setRecord.restActualSec}s`
                          : '--';

                      return (
                        <View key={setRecord.id} style={styles.setRow}>
                          <Text style={styles.setText}>{`#${setRecord.index}  ${weight} x ${reps}`}</Text>
                          <Text style={styles.setText}>{`Rest ${rest}`}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
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
  },
  content: {
    paddingHorizontal: spacing.pageX,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  back: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  sessionRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedRow: {
    backgroundColor: '#EBEBEB',
  },
  sessionDate: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  setText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    padding: spacing.md,
  },
});
