import React, {useEffect, useMemo, useState} from 'react';
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

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatClockFixed} from '../services/format';
import {useRestStore} from '../store/restStore';
import {useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RestFocus'>;
type FocusTab = 'record' | 'knowledge';

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

const knowledgeArticles = [
  {
    title: '增肌核心原则：机械张力优先',
    summary:
      '稳定进步来自“渐进超负荷”。在动作标准前提下，每 1~2 周提升总容量，优先增加重量，再补充组数。',
  },
  {
    title: '训练后补给窗口',
    summary:
      '建议在训练后 1 小时内摄入蛋白质 25~40g，并搭配碳水帮助恢复糖原。若晚间训练，补给仍需完成。',
  },
  {
    title: '休息长度与表现关系',
    summary:
      '大重量复合动作休息 90~180 秒更有利于维持组间输出；孤立动作可缩短至 45~90 秒提高密度。',
  },
];

export const RestFocusScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessionExerciseId = route.params.sessionExerciseId;

  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const updateSetRecord = useSessionStore(state => state.updateSetRecord);
  const startNextSet = useSessionStore(state => state.startNextSet);

  const restState = useRestStore(state => state.restState);
  const getRemainingMs = useRestStore(state => state.getRemainingMs);
  const markDoneIfNeeded = useRestStore(state => state.markDoneIfNeeded);
  const resetToIdle = useRestStore(state => state.resetToIdle);
  const activeSessionExerciseId = useRestStore(state => state.activeSessionExerciseId);

  const [tab, setTab] = useState<FocusTab>('record');
  const [nowMs, setNowMs] = useState(Date.now());
  const [analysisVisible, setAnalysisVisible] = useState(false);

  const snapshot = useMemo(() => {
    for (const session of sessions) {
      const item = session.items.find(entry => entry.id === sessionExerciseId);
      if (!item) {
        continue;
      }
      return {
        item,
        exercise: exercises.find(entry => entry.id === item.exerciseId),
      };
    }
    return null;
  }, [exercises, sessionExerciseId, sessions]);

  const latestSet = snapshot?.item.sets[snapshot.item.sets.length - 1];
  const displayName =
    snapshot?.item.customName?.trim() || snapshot?.exercise?.name || '胸部训练';

  const [weightInput, setWeightInput] = useState(latestSet?.weight?.toString() ?? '');
  const [repsInput, setRepsInput] = useState(latestSet?.reps?.toString() ?? '');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      markDoneIfNeeded(now);
    }, 250);
    return () => clearInterval(timer);
  }, [markDoneIfNeeded]);

  useEffect(() => {
    setWeightInput(latestSet?.weight?.toString() ?? '');
    setRepsInput(latestSet?.reps?.toString() ?? '');
  }, [latestSet?.id, latestSet?.reps, latestSet?.weight]);

  if (!snapshot || !latestSet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>没有可记录的休息数据</Text>
          <Pressable style={styles.blackButton} onPress={() => navigation.navigate('Session')}>
            <Text style={styles.blackButtonText}>返回训练中</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isTimerCurrent = activeSessionExerciseId === sessionExerciseId && restState !== 'IDLE';
  const remainingSec = isTimerCurrent ? Math.max(0, Math.ceil(getRemainingMs(nowMs) / 1000)) : 0;
  const timerDone = isTimerCurrent && restState === 'DONE';
  const setCount = snapshot.item.sets.length;

  const onSaveRecord = async () => {
    try {
      await updateSetRecord({
        sessionExerciseId,
        setId: latestSet.id,
        weight: parseNumber(weightInput),
        reps: parseNumber(repsInput),
        rpe: latestSet.rpe,
        note: latestSet.note,
      });
      setAnalysisVisible(true);
    } catch (error) {
      console.warn('[rest-focus] failed to save set record', error);
    }
  };

  const onStartNextSet = async () => {
    try {
      await startNextSet({sessionExerciseId, startedAtMs: Date.now()});
      await resetToIdle();
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      navigation.navigate('Session', {sessionExerciseId});
    } catch (error) {
      console.warn('[rest-focus] failed to start next set', error);
    }
  };

  const aiTip = useMemo(() => {
    const weight = parseNumber(weightInput) ?? 0;
    const reps = parseNumber(repsInput) ?? 0;

    if (reps >= 12) {
      return `本组完成度很高。建议下组尝试 ${Math.max(2, Math.round(weight * 0.05))}kg 渐进增加。`;
    }
    if (reps <= 6) {
      return '动作接近力竭，建议休息延长 15~30 秒，维持动作质量。';
    }
    return '当前表现稳定，保持重量，下一组争取多 1 次重复。';
  }, [repsInput, weightInput]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>CURRENT SESSION</Text>
            <Text style={styles.headerTitle}>{displayName}</Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Text style={styles.more}>•••</Text>
          </Pressable>
        </View>

        <View style={styles.topMeta}>
          <View>
            <Text style={styles.metaLabel}>当前组数</Text>
            <Text style={styles.metaMain}>
              <Text style={styles.metaMainStrong}>{`SET ${String(setCount).padStart(2, '0')}`}</Text>
              <Text style={styles.metaMainLight}> / 05</Text>
            </Text>
          </View>
          <View style={styles.timerPill}>
            <Text style={styles.timerPillText}>{`⏱  ${formatClockFixed(remainingSec)}`}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.segmentWrap}>
          <Pressable onPress={() => setTab('record')} style={[styles.segment, tab === 'record' && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === 'record' && styles.segmentTextActive]}>休息记录</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('knowledge')}
            style={[styles.segment, tab === 'knowledge' && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === 'knowledge' && styles.segmentTextActive]}>休息科普</Text>
          </Pressable>
        </View>

        {tab === 'record' ? (
          <>
            <Text style={styles.fieldLabel}>训练动作</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{displayName}</Text>
            </View>

            <View style={styles.dataRow}>
              <View style={styles.dataBox}>
                <Text style={styles.fieldLabel}>重量</Text>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  style={styles.bigInput}
                  keyboardType="decimal-pad"
                  placeholder="80"
                  placeholderTextColor="#C0C7D2"
                />
                <Text style={styles.unit}>KG</Text>
              </View>
              <View style={styles.dataBox}>
                <Text style={styles.fieldLabel}>次数</Text>
                <TextInput
                  value={repsInput}
                  onChangeText={setRepsInput}
                  style={styles.bigInput}
                  keyboardType="number-pad"
                  placeholder="8"
                  placeholderTextColor="#C0C7D2"
                />
                <Text style={styles.unit}>REPS</Text>
              </View>
            </View>

            <Pressable style={styles.blackButton} onPress={() => void onSaveRecord()}>
              <Text style={styles.blackButtonText}>✦  AI 分析表现</Text>
            </Pressable>

            {analysisVisible ? (
              <View style={styles.aiCard}>
                <Text style={styles.aiTitle}>实时分析</Text>
                <Text style={styles.aiText}>{aiTip}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>历史记录</Text>
            {snapshot.item.sets
              .slice()
              .reverse()
              .map(record => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyBadgeText}>{String(record.index).padStart(2, '0')}</Text>
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historySet}>{`${record.weight ?? '--'} KG × ${record.reps ?? '--'}`}</Text>
                    <Text style={styles.historySub}>
                      {record.index === 1 ? 'WARMUP' : `REST ${record.restActualSec ?? '--'}s`}
                    </Text>
                  </View>
                </View>
              ))}

            <Pressable
              style={styles.lightButton}
              onPress={() => navigation.navigate('RestStats', {sessionExerciseId})}>
              <Text style={styles.lightButtonText}>查看已休息组数统计</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.knowledgeWrap}>
            <Text style={styles.sectionTitle}>硬核干货</Text>
            {knowledgeArticles.map(article => (
              <View key={article.title} style={styles.articleCard}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary}>{article.summary}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.blackButton, !timerDone && styles.blackButtonDisabled]}
          onPress={() => void onStartNextSet()}
          disabled={!timerDone}>
          <Text style={styles.blackButtonText}>{timerDone ? '开始下一组  →' : '等待倒计时结束...'}</Text>
        </Pressable>

        <View style={styles.homeIndicator} />
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
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    marginTop: 4,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#111111',
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
  },
  more: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  overline: {
    color: '#9DA5B3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  headerTitle: {
    marginTop: 2,
    color: '#090909',
    fontSize: 18,
    fontWeight: '800',
  },
  topMeta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#9BA3B1',
    fontSize: 14,
    fontWeight: '700',
  },
  metaMain: {
    marginTop: 4,
  },
  metaMainStrong: {
    color: '#090909',
    fontSize: 60,
    lineHeight: 62,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  metaMainLight: {
    color: '#BCC3CE',
    fontSize: 24,
    fontWeight: '700',
  },
  timerPill: {
    minWidth: 128,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  timerPillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  divider: {
    marginTop: 10,
    marginBottom: 6,
    height: 1,
    backgroundColor: '#E1E5EC',
  },
  segmentWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  segmentText: {
    color: '#7C8798',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    color: '#9CA5B3',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    borderRadius: 0,
    minHeight: 82,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F6F8',
  },
  fieldValue: {
    color: '#090909',
    fontSize: 26,
    fontWeight: '900',
  },
  dataRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 14,
  },
  dataBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    padding: 12,
    minHeight: 126,
  },
  bigInput: {
    marginTop: 8,
    color: '#090909',
    fontSize: 44,
    fontWeight: '900',
    padding: 0,
  },
  unit: {
    alignSelf: 'flex-end',
    color: '#9DA5B3',
    fontSize: 13,
    fontWeight: '800',
  },
  blackButton: {
    marginTop: 10,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackButtonDisabled: {
    opacity: 0.5,
  },
  blackButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE1EA',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  aiTitle: {
    color: '#111A2A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  aiText: {
    color: '#576378',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 14,
    color: '#121924',
    fontSize: 18,
    fontWeight: '800',
  },
  historyItem: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  historyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  historyBody: {
    flex: 1,
  },
  historySet: {
    color: '#0A0A0A',
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  historySub: {
    marginTop: 2,
    color: '#9AA2AF',
    fontSize: 13,
    fontWeight: '700',
  },
  lightButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  lightButtonText: {
    color: '#7D8798',
    fontSize: 14,
    fontWeight: '700',
  },
  knowledgeWrap: {
    marginTop: 4,
  },
  articleCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E6ED',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  articleTitle: {
    color: '#0F1625',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  articleSummary: {
    color: '#556173',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  homeIndicator: {
    alignSelf: 'center',
    width: 130,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
});
