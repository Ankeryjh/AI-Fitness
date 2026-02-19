import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {TimerRing} from '../components/TimerRing';
import {RootStackParamList} from '../navigation/RootNavigator';
import {formatClockFixed} from '../services/format';
import {useRestStore} from '../store/restStore';
import {useSessionStore} from '../store/sessionStore';
import {useSettingsStore} from '../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RestTimer'>;

const quickOptions = [60, 90, 120, 180, 300];
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const RestTimerScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessionExerciseId = route.params.sessionExerciseId;
  const justCompletedSetIndex = route.params.justCompletedSetIndex;

  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const startNextSet = useSessionStore(state => state.startNextSet);

  const soundEnabled = useSettingsStore(state => state.soundEnabled);
  const vibrationEnabled = useSettingsStore(state => state.vibrationEnabled);
  const defaultRestSec = useSettingsStore(state => state.defaultRestSec);

  const restState = useRestStore(state => state.restState);
  const restDurationSec = useRestStore(state => state.restDurationSec);
  const activeSessionExerciseId = useRestStore(state => state.activeSessionExerciseId);
  const startRest = useRestStore(state => state.startRest);
  const markDoneIfNeeded = useRestStore(state => state.markDoneIfNeeded);
  const getRemainingMs = useRestStore(state => state.getRemainingMs);
  const resetToIdle = useRestStore(state => state.resetToIdle);

  const [selectedRestSec, setSelectedRestSec] = useState(defaultRestSec);
  const [nowMs, setNowMs] = useState(Date.now());
  const doneHandledRef = useRef(false);

  const snapshot = useMemo(() => {
    for (const session of sessions) {
      const item = session.items.find(entry => entry.id === sessionExerciseId);
      if (!item) {
        continue;
      }
      const exercise = exercises.find(entry => entry.id === item.exerciseId);
      return {session, item, exercise};
    }
    return null;
  }, [exercises, sessionExerciseId, sessions]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      markDoneIfNeeded(now);
    }, 250);
    return () => clearInterval(timer);
  }, [markDoneIfNeeded]);

  if (!snapshot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>训练不存在，请返回重新开始</Text>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Session')}>
            <Text style={styles.actionButtonText}>返回训练</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCurrentExerciseTimer = activeSessionExerciseId === sessionExerciseId;
  const hasStarted = isCurrentExerciseTimer && restState !== 'IDLE';
  const totalSets = clamp(snapshot.item.targetSets ?? 4, 1, 30);
  const currentSet = clamp(justCompletedSetIndex, 1, totalSets);
  const isExerciseFinished = currentSet >= totalSets;
  const remainingMs = hasStarted ? getRemainingMs(nowMs) : selectedRestSec * 1000;
  const displaySec = Math.max(0, Math.ceil(remainingMs / 1000));
  const displayName = snapshot.item.customName?.trim() || snapshot.exercise?.name || '训练动作';
  const ringProgress = hasStarted
    ? clamp(1 - Math.max(remainingMs, 0) / Math.max(1, restDurationSec * 1000), 0, 1)
    : 0;

  const completeRestAndReturn = async () => {
    if (!isExerciseFinished) {
      await startNextSet({sessionExerciseId, startedAtMs: Date.now()});
    }
    await resetToIdle();
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Session', {sessionExerciseId});
  };

  useEffect(() => {
    if (!hasStarted || restState !== 'DONE' || doneHandledRef.current) {
      return;
    }
    doneHandledRef.current = true;
    void completeRestAndReturn().catch(error => {
      console.warn('[rest-timer] failed to auto-complete rest', error);
    });
  }, [hasStarted, restState, sessionExerciseId, startNextSet, resetToIdle, navigation, isExerciseFinished]);

  useEffect(() => {
    if (restState === 'IDLE') {
      doneHandledRef.current = false;
    }
  }, [restState]);

  const onStartRest = async () => {
    if (hasStarted) {
      return;
    }
    await startRest({
      durationSec: selectedRestSec,
      sessionExerciseId,
      exerciseName: displayName || 'Exercise',
      soundEnabled,
      vibrationEnabled,
    });
  };

  const onSkipRest = async () => {
    doneHandledRef.current = true;
    try {
      await completeRestAndReturn();
    } catch (error) {
      console.warn('[rest-timer] failed to skip rest', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>当前训练</Text>
            <Text style={styles.headerTitle}>{displayName}</Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Text style={styles.more}>•••</Text>
          </Pressable>
        </View>

        <Text style={styles.groupMeta}>当前组数</Text>
        <Text style={styles.groupText}>
          <Text style={styles.groupStrong}>{`第 ${String(currentSet).padStart(2, '0')} 组`}</Text>
          <Text style={styles.groupLight}>{` / ${String(totalSets).padStart(2, '0')}`}</Text>
        </Text>

        {hasStarted ? (
          <>
            <View style={styles.ringWrap}>
              <TimerRing size={276} strokeWidth={14} progress={ringProgress} done={restState === 'DONE'} />
              <View style={styles.ringCenter}>
                <Text style={styles.timerText}>{formatClockFixed(displaySec)}</Text>
                <Text style={styles.ringHint}>
                  {isExerciseFinished ? '本动作已完成，倒计时后返回选择下一动作' : '休息结束将自动开始下一组'}
                </Text>
              </View>
            </View>

            <Pressable style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
              <Text style={styles.actionButtonText}>休息中...</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.optionLabel}>选择休息时长</Text>
            <View style={styles.optionsGrid}>
              {quickOptions.map(option => {
                const selected = option === selectedRestSec;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionPill, selected && styles.optionPillActive]}
                    onPress={() => setSelectedRestSec(option)}>
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>{`${option}秒`}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.actionButton} onPress={onStartRest}>
              <Text style={styles.actionButtonText}>▶  开始休息</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => void onSkipRest()} style={styles.skipButton}>
          <Text style={styles.skipText}>{hasStarted ? '跳过休息，立即继续' : '跳过休息'}</Text>
        </Pressable>

        <View style={styles.homeIndicator} />
      </View>
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
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  header: {
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
  groupMeta: {
    marginTop: 24,
    textAlign: 'center',
    color: '#8F97A5',
    fontSize: 14,
    fontWeight: '700',
  },
  groupText: {
    marginTop: 8,
    textAlign: 'center',
  },
  groupStrong: {
    color: '#090909',
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  groupLight: {
    color: '#BDC4CF',
    fontSize: 22,
    fontWeight: '700',
  },
  ringWrap: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timerText: {
    textAlign: 'center',
    color: '#0A0A0A',
    fontSize: 72,
    lineHeight: 76,
    fontWeight: '900',
    letterSpacing: -1,
  },
  ringHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9EA6B3',
    fontSize: 14,
    fontWeight: '700',
  },
  optionLabel: {
    marginTop: 54,
    textAlign: 'center',
    color: '#9EA6B3',
    fontSize: 16,
    fontWeight: '700',
  },
  optionsGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionPill: {
    minWidth: 106,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#D1D6DF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F5F6F8',
  },
  optionPillActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  optionText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  actionButton: {
    marginTop: 54,
    height: 86,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 7,
  },
  actionButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  skipButton: {
    marginTop: 22,
    alignItems: 'center',
  },
  skipText: {
    color: '#A6AFBC',
    fontSize: 17,
    fontWeight: '700',
  },
  homeIndicator: {
    alignSelf: 'center',
    width: 130,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginTop: 'auto',
    marginBottom: 8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
});
