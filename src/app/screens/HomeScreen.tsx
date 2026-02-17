import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatDuration} from '../services/format';
import {GoalType, useOnboardingStore} from '../store/onboardingStore';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface GoalPreset {
  exerciseName: string;
  restSec: number;
}

const goalPresets: Record<GoalType, GoalPreset> = {
  chest: {exerciseName: '杠铃卧推', restSec: 90},
  back: {exerciseName: '高位下拉', restSec: 90},
  legs: {exerciseName: '深蹲', restSec: 120},
  shoulders: {exerciseName: '哑铃推举', restSec: 90},
  arms: {exerciseName: '杠铃弯举', restSec: 75},
  core: {exerciseName: '卷腹', restSec: 60},
};

export const HomeScreen = ({navigation}: Props): React.JSX.Element => {
  const goalType = useOnboardingStore(state => state.goalSetup.goalType);
  const userName = useOnboardingStore(state => state.email || 'athlete@fitrest.io');
  const logout = useOnboardingStore(state => state.logout);

  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const sessions = useSessionStore(state => state.sessions);
  const createSession = useSessionStore(state => state.createSession);
  const addExerciseToActiveSession = useSessionStore(state => state.addExerciseToActiveSession);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt)),
    [sessions],
  );

  const totalVolume = useMemo(
    () =>
      sortedSessions
        .flatMap(session => session.items.flatMap(item => item.sets))
        .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0),
    [sortedSessions],
  );

  const last7SessionVolumes = useMemo(
    () =>
      sortedSessions.slice(0, 7).map(session =>
        session.items
          .flatMap(item => item.sets)
          .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0),
      ),
    [sortedSessions],
  );

  const maxVolume = Math.max(...last7SessionVolumes, 1);

  const onStartTraining = () => {
    const preset = goalPresets[goalType];

    let nextSessionExerciseId: string | null = null;

    const currentActiveSession = sessions.find(session => session.id === activeSessionId);
    if (currentActiveSession?.items[0]) {
      nextSessionExerciseId = currentActiveSession.items[0].id;
    } else {
      if (!activeSessionId) {
        createSession();
      }
      nextSessionExerciseId = addExerciseToActiveSession(
        preset.exerciseName,
        preset.restSec,
        preset.restSec,
        4,
      );
      if (!nextSessionExerciseId) {
        const retryActiveSessionId = useSessionStore.getState().activeSessionId;
        if (!retryActiveSessionId) {
          createSession();
        }
        nextSessionExerciseId = useSessionStore
          .getState()
          .addExerciseToActiveSession(preset.exerciseName, preset.restSec, preset.restSec, 4);
      }
    }

    navigation.navigate('Session', {sessionExerciseId: nextSessionExerciseId ?? undefined});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.overline}>PERSONAL CENTER</Text>
            <Text style={styles.title}>训练档案</Text>
          </View>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>退出</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>账号</Text>
          <Text style={styles.profileValue}>{userName}</Text>
          <Text style={styles.profileMeta}>{`累计容量 ${Math.round(totalVolume)} KG · 目标 ${
            goalType.toUpperCase()
          }`}</Text>
        </View>

        <Pressable style={styles.mainCta} onPress={onStartTraining}>
          <Text style={styles.mainCtaText}>开始今日训练  →</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>力量增长趋势（最近 7 次）</Text>
          <View style={styles.chartRow}>
            {last7SessionVolumes.length === 0 ? (
              <Text style={styles.empty}>暂无训练数据</Text>
            ) : (
              last7SessionVolumes.map((value, index) => (
                <View key={`${value}_${index}`} style={styles.barWrap}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {height: `${Math.max(8, (value / maxVolume) * 100)}%`}]} />
                  </View>
                  <Text style={styles.barLabel}>{`${index + 1}`}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>历史训练</Text>
            <Pressable onPress={() => navigation.navigate('HistoryDetail')}>
              <Text style={styles.link}>查看全部</Text>
            </Pressable>
          </View>
          {sortedSessions.slice(0, 4).map(session => {
            const summary = getWorkoutSummary(session);
            return (
              <Pressable
                key={session.id}
                style={styles.historyRow}
                onPress={() => navigation.navigate('HistoryDetail', {sessionId: session.id})}>
                <View>
                  <Text style={styles.historyTitle}>{new Date(session.startAt).toLocaleDateString()}</Text>
                  <Text style={styles.historyMeta}>{`${summary.totalSets} 组 · 休息均值 ${summary.averageRestSec}s`}</Text>
                </View>
                <Text style={styles.historyDuration}>{formatDuration(summary.totalDurationSec)}</Text>
              </Pressable>
            );
          })}
          {sortedSessions.length === 0 ? <Text style={styles.empty}>还没有历史训练</Text> : null}
        </View>

        <Pressable style={styles.secondaryCta} onPress={() => navigation.navigate('AIReport')}>
          <Text style={styles.secondaryCtaText}>AI 深度分析报告</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overline: {
    fontSize: 11,
    color: '#A2AAB6',
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  title: {
    marginTop: 2,
    color: '#090909',
    fontSize: 34,
    fontWeight: '900',
  },
  logout: {
    color: '#8A94A5',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 18,
  },
  profileLabel: {
    color: '#9FA9B7',
    fontSize: 12,
    marginBottom: 6,
  },
  profileValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileMeta: {
    marginTop: 10,
    color: '#D1D7E1',
    fontSize: 13,
  },
  mainCta: {
    height: 68,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 7,
  },
  mainCtaText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EE',
  },
  sectionTitle: {
    color: '#141A25',
    fontSize: 17,
    fontWeight: '700',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  link: {
    color: '#8C95A5',
    fontSize: 13,
    fontWeight: '600',
  },
  chartRow: {
    marginTop: 14,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    width: '100%',
    minHeight: 72,
    maxHeight: 100,
    backgroundColor: '#ECEFF4',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
  },
  barLabel: {
    color: '#9AA3B1',
    fontSize: 11,
    fontWeight: '600',
  },
  historyRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E6ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyTitle: {
    color: '#0F1727',
    fontSize: 15,
    fontWeight: '700',
  },
  historyMeta: {
    marginTop: 2,
    color: '#8D96A5',
    fontSize: 12,
    fontWeight: '500',
  },
  historyDuration: {
    color: '#2A303D',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryCta: {
    marginTop: 4,
    backgroundColor: '#E8ECF2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  secondaryCtaText: {
    color: '#202939',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    color: '#97A0AE',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 12,
  },
});
