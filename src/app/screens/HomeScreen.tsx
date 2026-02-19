import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {getSessionTitle, getFocusLabel} from '../services/sessionMeta';
import {formatDuration} from '../services/format';
import {GoalType, useOnboardingStore} from '../store/onboardingStore';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';
import {useSettingsStore} from '../store/settingsStore';

interface GoalPreset {
  exerciseName: string;
  restSec: number;
}

interface HeatmapCell {
  date: Date;
  inYear: boolean;
  trained: boolean;
}

const goalPresets: Record<GoalType, GoalPreset> = {
  chest: {exerciseName: '杠铃卧推', restSec: 90},
  back: {exerciseName: '高位下拉', restSec: 90},
  legs: {exerciseName: '深蹲', restSec: 120},
  shoulders: {exerciseName: '哑铃推举', restSec: 90},
  arms: {exerciseName: '杠铃弯举', restSec: 75},
  core: {exerciseName: '卷腹', restSec: 60},
};

const pad = (value: number): string => String(value).padStart(2, '0');
const toDateKey = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

export const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goalType = useOnboardingStore(state => state.goalSetup.goalType);
  const userName = useOnboardingStore(state => state.email || 'athlete@fitrest.io');
  const logout = useOnboardingStore(state => state.logout);

  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const createSession = useSessionStore(state => state.createSession);
  const addExerciseToActiveSession = useSessionStore(state => state.addExerciseToActiveSession);
  const clearAllSessions = useSessionStore(state => state.clearAll);
  const resetSettings = useSettingsStore(state => state.resetToDefault);

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

  const checkinData = useMemo(() => {
    const displayYear = new Date().getFullYear();
    const firstDay = new Date(displayYear, 0, 1);
    const lastDay = new Date(displayYear, 11, 31);

    const trainedDateSet = new Set(
      sortedSessions
        .map(session => new Date(session.startAt))
        .filter(date => date.getFullYear() === displayYear)
        .map(date => toDateKey(date)),
    );

    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / (24 * 3600 * 1000)) + 1;
    const weekCount = Math.ceil(totalDays / 7);

    const weeks: HeatmapCell[][] = [];
    const monthLabels: string[] = [];

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      const weekCells: HeatmapCell[] = [];

      const weekFirst = new Date(gridStart);
      weekFirst.setDate(gridStart.getDate() + weekIndex * 7);

      const labelDate = new Date(weekFirst);
      labelDate.setDate(weekFirst.getDate() + (1 - weekFirst.getDay() + 7) % 7);
      const showLabel =
        labelDate.getFullYear() === displayYear && labelDate.getDate() <= 7 && weekIndex < weekCount - 1;
      monthLabels.push(showLabel ? `${labelDate.getMonth() + 1}月` : '');

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);

        const inYear = date >= firstDay && date <= lastDay;
        weekCells.push({
          date,
          inYear,
          trained: inYear ? trainedDateSet.has(toDateKey(date)) : false,
        });
      }

      weeks.push(weekCells);
    }

    return {
      year: displayYear,
      checkedDays: trainedDateSet.size,
      weeks,
      monthLabels,
    };
  }, [sortedSessions]);

  const onStartTraining = async () => {
    const preset = goalPresets[goalType];

    let nextSessionExerciseId: string | null = null;

    try {
      const currentActiveSession = sessions.find(session => session.id === activeSessionId);
      if (currentActiveSession?.items[0]) {
        nextSessionExerciseId = currentActiveSession.items[0].id;
      } else {
        if (!activeSessionId) {
          await createSession(goalType);
        }

        nextSessionExerciseId = await addExerciseToActiveSession(
          preset.exerciseName,
          preset.restSec,
          preset.restSec,
          4,
        );

        if (!nextSessionExerciseId) {
          const retryActiveSessionId = useSessionStore.getState().activeSessionId;
          if (!retryActiveSessionId) {
            await createSession(goalType);
          }
          nextSessionExerciseId = await useSessionStore
            .getState()
            .addExerciseToActiveSession(preset.exerciseName, preset.restSec, preset.restSec, 4);
        }
      }
    } catch (error) {
      console.warn('[home] failed to start training', error);
      return;
    }

    navigation.navigate('Session', {sessionExerciseId: nextSessionExerciseId ?? undefined});
  };

  const onLogoutPress = () => {
    clearAllSessions();
    resetSettings();
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.overline}>PERSONAL CENTER</Text>
            <Text style={styles.title}>训练档案</Text>
          </View>
          <Pressable onPress={onLogoutPress}>
            <Text style={styles.logout}>退出</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>账号</Text>
          <Text style={styles.profileValue}>{userName}</Text>
          <Text style={styles.profileMeta}>{`累计容量 ${Math.round(totalVolume)} KG · 目标 ${getFocusLabel(goalType)}`}</Text>
        </View>

        <Pressable style={styles.mainCta} onPress={() => void onStartTraining()}>
          <Text style={styles.mainCtaText}>开始今日训练  →</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{`训练打卡（${checkinData.year}）`}</Text>
          <Text style={styles.checkinSub}>{`${checkinData.year} 年已打卡 ${checkinData.checkedDays} 天`}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatmapScrollContent}>
            <View>
              <View style={styles.monthRow}>
                {checkinData.monthLabels.map((label, index) => (
                  <View key={`${label}_${index}`} style={styles.monthCell}>
                    <Text style={styles.monthText}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.heatmapGrid}>
                {checkinData.weeks.map((week, weekIndex) => (
                  <View key={`week_${weekIndex}`} style={styles.weekColumn}>
                    {week.map(day => (
                      <View
                        key={`${toDateKey(day.date)}_${day.date.getDay()}`}
                        style={[
                          styles.heatCell,
                          day.inYear ? styles.heatCellInYear : styles.heatCellOutYear,
                          day.trained ? styles.heatCellTrained : null,
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
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
            const sessionVolume = session.items
              .flatMap(item => item.sets)
              .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0);
            const sessionTitle = getSessionTitle(session, exercises);
            const dateText = new Date(session.startAt).toLocaleDateString('zh-CN');

            return (
              <Pressable
                key={session.id}
                style={styles.historyRow}
                onPress={() => navigation.navigate('HistoryDetail', {sessionId: session.id})}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTitle}>{`${sessionTitle} · ${dateText}`}</Text>
                  <Text style={styles.historyMeta}>{`容量 ${Math.round(sessionVolume)}kg · ${summary.totalSets}组`}</Text>
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
  checkinSub: {
    marginTop: 6,
    color: '#8A94A5',
    fontSize: 13,
    fontWeight: '600',
  },
  heatmapScrollContent: {
    marginTop: 12,
    paddingRight: 8,
  },
  monthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthCell: {
    width: 13,
    marginRight: 3,
    alignItems: 'center',
  },
  monthText: {
    color: '#9AA3B1',
    fontSize: 9,
    fontWeight: '600',
  },
  heatmapGrid: {
    flexDirection: 'row',
  },
  weekColumn: {
    gap: 3,
    marginRight: 3,
  },
  heatCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatCellInYear: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE4EC',
  },
  heatCellOutYear: {
    opacity: 0,
  },
  heatCellTrained: {
    backgroundColor: '#21A453',
    borderColor: '#21A453',
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
  historyRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E6ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyLeft: {
    flex: 1,
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
