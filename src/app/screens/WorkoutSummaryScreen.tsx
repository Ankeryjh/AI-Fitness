import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatDuration} from '../services/format';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSummary'>;

export const WorkoutSummaryScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);

  const targetSession = useMemo(() => {
    if (route.params?.sessionId) {
      return sessions.find(session => session.id === route.params?.sessionId);
    }
    return [...sessions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))[0];
  }, [route.params?.sessionId, sessions]);

  const summary = targetSession ? getWorkoutSummary(targetSession) : null;
  const totalVolume = useMemo(
    () =>
      targetSession?.items
        .flatMap(item => item.sets)
        .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0) ?? 0,
    [targetSession],
  );

  const exerciseLogs = useMemo(() => {
    if (!targetSession) {
      return [];
    }

    return targetSession.items.map(item => {
      const exercise = exercises.find(entry => entry.id === item.exerciseId);
      const displayName = item.customName?.trim() || exercise?.name || '未命名动作';
      const volume = item.sets.reduce(
        (sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0),
        0,
      );

      return {
        id: item.id,
        name: displayName,
        setCount: item.sets.length,
        volume,
        setRows: item.sets.map(setRecord => ({
          id: setRecord.id,
          index: setRecord.index,
          weightText:
            typeof setRecord.weight === 'number' ? `${Number(setRecord.weight.toFixed(2))}kg` : '--kg',
          repsText: typeof setRecord.reps === 'number' ? `${setRecord.reps}` : '--',
        })),
      };
    });
  }, [exercises, targetSession]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.overline}>TRAINING CHECK-IN</Text>
          <Text style={styles.title}>训练结束打卡</Text>
        </View>

        <View style={styles.logCard}>
          <Text style={styles.logTitle}>本次训练记录</Text>
          {exerciseLogs.length === 0 ? (
            <Text style={styles.emptyText}>暂无训练动作记录</Text>
          ) : (
            exerciseLogs.map(entry => (
              <View key={entry.id} style={styles.exerciseLogBlock}>
                <View style={styles.exerciseLogHeader}>
                  <Text style={styles.exerciseLogName}>{entry.name}</Text>
                  <Text style={styles.exerciseLogMeta}>{`${entry.setCount} 组 · ${Math.round(entry.volume)}kg`}</Text>
                </View>
                {entry.setRows.length === 0 ? (
                  <Text style={styles.exerciseLogEmpty}>未记录组数据</Text>
                ) : (
                  entry.setRows.map(setRow => (
                    <View key={setRow.id} style={styles.setRow}>
                      <Text style={styles.setRowIndex}>{`第${setRow.index}组`}</Text>
                      <Text style={styles.setRowValue}>{`${setRow.weightText} × ${setRow.repsText}`}</Text>
                    </View>
                  ))
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.posterCard}>
          <Text style={styles.posterDate}>{new Date(targetSession?.startAt ?? Date.now()).toLocaleDateString()}</Text>
          <Text style={styles.posterName}>汇总信息</Text>
          <View style={styles.posterDivider} />
          <View style={styles.posterRow}>
            <Text style={styles.posterLabel}>总容量</Text>
            <Text style={styles.posterValue}>{`${Math.round(totalVolume)} KG`}</Text>
          </View>
          <View style={styles.posterRow}>
            <Text style={styles.posterLabel}>总组数</Text>
            <Text style={styles.posterValue}>{summary ? `${summary.totalSets} 组` : '--'}</Text>
          </View>
          <View style={styles.posterRow}>
            <Text style={styles.posterLabel}>总时长</Text>
            <Text style={styles.posterValue}>{summary ? formatDuration(summary.totalDurationSec) : '--'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>打卡结果</Text>
          <Text style={styles.infoText}>训练已自动归档到历史，力量增长趋势已更新。继续保持节奏，下一次训练建议同部位 48 小时后进行。</Text>
        </View>

        <Pressable style={styles.blackButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.blackButtonText}>返回个人中心</Text>
        </Pressable>

        <Pressable style={styles.lightButton} onPress={() => navigation.navigate('AIReport', {sessionId: targetSession?.id})}>
          <Text style={styles.lightButtonText}>查看 AI 深度分析</Text>
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
  },
  header: {
    marginTop: 16,
    alignItems: 'center',
  },
  overline: {
    color: '#9FA7B5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    marginTop: 4,
    color: '#090909',
    fontSize: 36,
    fontWeight: '900',
  },
  logCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E3E7EE',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  logTitle: {
    color: '#101827',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 10,
    color: '#7A8494',
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseLogBlock: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    gap: 6,
  },
  exerciseLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseLogName: {
    flex: 1,
    color: '#0D1422',
    fontSize: 17,
    fontWeight: '800',
  },
  exerciseLogMeta: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseLogEmpty: {
    color: '#7D8696',
    fontSize: 14,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setRowIndex: {
    color: '#6C7789',
    fontSize: 14,
    fontWeight: '700',
  },
  setRowValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  posterCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#0A0A0A',
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 7,
  },
  posterDate: {
    color: '#A8B1BF',
    fontSize: 13,
    fontWeight: '600',
  },
  posterName: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  posterDivider: {
    marginTop: 14,
    marginBottom: 8,
    height: 1,
    backgroundColor: '#232B38',
  },
  posterRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterLabel: {
    color: '#A6B0BF',
    fontSize: 16,
    fontWeight: '600',
  },
  posterValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3E7EE',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  infoTitle: {
    color: '#0F1726',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: {
    color: '#5E6A7C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  blackButton: {
    marginTop: 20,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  lightButton: {
    marginTop: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E7EBF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightButtonText: {
    color: '#1C2533',
    fontSize: 16,
    fontWeight: '700',
  },
});
