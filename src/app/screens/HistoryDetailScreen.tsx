import React, {useMemo, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatDuration} from '../services/format';
import {getSessionTitle} from '../services/sessionMeta';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';
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

  const selectedVolume =
    selectedSession?.items
      .flatMap(item => item.sets)
      .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0) ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>返回</Text>
          </Pressable>
          <Text style={styles.title}>训练历史</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionTitle}>历史记录</Text>
        <View style={styles.card}>
          {orderedSessions.length === 0 ? (
            <Text style={styles.emptyText}>暂无历史训练</Text>
          ) : (
            orderedSessions.map(session => {
              const isActive = session.id === selectedSession?.id;
              const itemSummary = getWorkoutSummary(session);
              const sessionVolume = session.items
                .flatMap(item => item.sets)
                .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0);
              const dateText = new Date(session.startAt).toLocaleDateString('zh-CN');
              const sessionTitle = getSessionTitle(session, exercises);

              return (
                <Pressable
                  key={session.id}
                  onPress={() => setSelectedSessionId(session.id)}
                  style={[styles.sessionRow, isActive && styles.selectedRow]}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionDate}>{`${sessionTitle} · ${dateText}`}</Text>
                    <Text style={styles.sessionMeta}>{`容量 ${Math.round(sessionVolume)}kg · ${itemSummary.totalSets}组`}</Text>
                  </View>
                  <Text style={styles.sessionMeta}>{formatDuration(itemSummary.totalDurationSec)}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {selectedSession && summary ? (
          <>
            <Text style={styles.sectionTitle}>训练总结</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{`训练部位：${getSessionTitle(selectedSession, exercises)}`}</Text>
              <Text style={styles.summaryText}>{`训练日期：${new Date(selectedSession.startAt).toLocaleDateString('zh-CN')}`}</Text>
              <Text style={styles.summaryText}>{`总容量：${Math.round(selectedVolume)}kg`}</Text>
              <Text style={styles.summaryText}>{`总组数：${summary.totalSets}组`}</Text>
              <Text style={styles.summaryText}>{`平均休息：${summary.averageRestSec}秒`}</Text>
            </View>

            <Text style={styles.sectionTitle}>动作明细</Text>
            {selectedSession.items.map(item => {
              const fallbackName = exercises.find(exercise => exercise.id === item.exerciseId)?.name ?? '未命名动作';
              const name = item.customName?.trim() || fallbackName;
              const actionVolume = item.sets.reduce(
                (sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0),
                0,
              );

              return (
                <View key={item.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{name}</Text>
                    <Text style={styles.exerciseMeta}>{`${item.sets.length}组 · ${Math.round(actionVolume)}kg`}</Text>
                  </View>
                  {item.sets.length === 0 ? (
                    <Text style={styles.emptyText}>无组数记录</Text>
                  ) : (
                    item.sets.map(setRecord => {
                      const weight =
                        typeof setRecord.weight === 'number' ? `${Number(setRecord.weight.toFixed(2))}kg` : '--kg';
                      const reps = typeof setRecord.reps === 'number' ? `${setRecord.reps}` : '--';
                      const rest =
                        typeof setRecord.restActualSec === 'number'
                          ? `${setRecord.restActualSec}秒`
                          : '--';

                      return (
                        <View key={setRecord.id} style={styles.setRow}>
                          <Text style={styles.setText}>{`第${setRecord.index}组  ${weight} × ${reps}`}</Text>
                          <Text style={styles.setText}>{`休息 ${rest}`}</Text>
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
    gap: spacing.sm,
  },
  selectedRow: {
    backgroundColor: '#EBEBEB',
  },
  sessionLeft: {
    flex: 1,
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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
