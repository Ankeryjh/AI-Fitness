import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {GoalType, useOnboardingStore} from '../store/onboardingStore';
import {useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;
type ActionModalMode = 'current' | 'next';

interface TrainingPreset {
  exerciseName: string;
  targetWeight: number;
  targetReps: number;
  totalSets: number;
}

const presets: Record<GoalType, TrainingPreset> = {
  chest: {exerciseName: '杠铃卧推', targetWeight: 60, targetReps: 10, totalSets: 4},
  back: {exerciseName: '高位下拉', targetWeight: 55, targetReps: 10, totalSets: 4},
  legs: {exerciseName: '杠铃深蹲', targetWeight: 80, targetReps: 8, totalSets: 4},
  shoulders: {exerciseName: '哑铃推举', targetWeight: 22, targetReps: 12, totalSets: 4},
  arms: {exerciseName: '杠铃弯举', targetWeight: 30, targetReps: 12, totalSets: 4},
  core: {exerciseName: '负重卷腹', targetWeight: 20, targetReps: 15, totalSets: 4},
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const parseTargetSets = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return clamp(Math.round(parsed), 1, 30);
};

const parseWeightInput = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const normalizeWeight = (value: number): number => clamp(Math.round(value * 2) / 2, 1, 500);

const formatWeightDisplay = (value: number): string => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
};

const getMetricValueStyle = (value: number): {fontSize: number; lineHeight: number} => {
  const digitCount = Math.abs(Math.round(value)).toString().length;
  if (digitCount >= 4) {
    return {fontSize: 62, lineHeight: 66};
  }
  if (digitCount === 3) {
    return {fontSize: 78, lineHeight: 82};
  }
  return {fontSize: 96, lineHeight: 96};
};

export const SessionScreen = ({navigation, route}: Props): React.JSX.Element => {
  const goalType = useOnboardingStore(state => state.goalSetup.goalType);
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const completeSet = useSessionStore(state => state.completeSet);
  const endActiveSession = useSessionStore(state => state.endActiveSession);
  const addExerciseToActiveSession = useSessionStore(state => state.addExerciseToActiveSession);
  const updateSessionExerciseName = useSessionStore(state => state.updateSessionExerciseName);
  const updateSessionExerciseTargetSets = useSessionStore(
    state => state.updateSessionExerciseTargetSets,
  );

  const preset = presets[goalType];

  const activeSession = useMemo(
    () => sessions.find(session => session.id === activeSessionId),
    [activeSessionId, sessions],
  );

  const sessionExercise = useMemo(() => {
    if (!activeSession) {
      return undefined;
    }
    if (route.params?.sessionExerciseId) {
      const matched = activeSession.items.find(item => item.id === route.params?.sessionExerciseId);
      if (matched) {
        return matched;
      }
    }
    return activeSession.items[0];
  }, [activeSession, route.params?.sessionExerciseId]);

  const exercise = useMemo(
    () => exercises.find(item => item.id === sessionExercise?.exerciseId),
    [exercises, sessionExercise?.exerciseId],
  );

  const [weight, setWeight] = useState(normalizeWeight(preset.targetWeight));
  const [reps, setReps] = useState(preset.targetReps);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionModalMode, setActionModalMode] = useState<ActionModalMode>('current');
  const [actionNameInput, setActionNameInput] = useState('');
  const [actionSetsInput, setActionSetsInput] = useState('4');
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInputText, setWeightInputText] = useState('');

  const weightFx = useRef(new Animated.Value(0)).current;
  const repsFx = useRef(new Animated.Value(0)).current;
  const [weightFxText, setWeightFxText] = useState('');
  const [repsFxText, setRepsFxText] = useState('');

  useEffect(() => {
    const lastSet = sessionExercise?.sets[sessionExercise.sets.length - 1];
    if (lastSet) {
      setWeight(normalizeWeight(lastSet.weight ?? preset.targetWeight));
      setReps(Math.round(lastSet.reps ?? preset.targetReps));
      return;
    }
    setWeight(normalizeWeight(preset.targetWeight));
    setReps(preset.targetReps);
  }, [preset.targetReps, preset.targetWeight, sessionExercise]);

  useEffect(() => {
    if (!sessionExercise) {
      return;
    }

    const fallbackName = exercise?.name ?? preset.exerciseName;
    setActionNameInput(sessionExercise.customName ?? fallbackName);
    setActionSetsInput(String(sessionExercise.targetSets ?? preset.totalSets));

    if (sessionExercise.customName === undefined || typeof sessionExercise.targetSets !== 'number') {
      setActionModalMode('current');
      setActionModalVisible(true);
    }
  }, [exercise?.name, preset.exerciseName, preset.totalSets, sessionExercise]);

  if (!activeSession || !sessionExercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>当前没有进行中的训练</Text>
          <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.emptyButtonText}>返回个人中心</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const completedSets = sessionExercise.sets.length;
  const totalSets = clamp(sessionExercise.targetSets ?? preset.totalSets, 1, 30);
  const currentSet = clamp(completedSets + 1, 1, totalSets);
  const progress = clamp(completedSets / totalSets, 0, 1);
  const isActionFinished = completedSets >= totalSets;

  const displayName = sessionExercise.customName?.trim() ?? '';
  const showCustomName = displayName.length > 0;
  const currentExerciseIndex = activeSession.items.findIndex(item => item.id === sessionExercise.id) + 1;

  const triggerFx = (value: Animated.Value, setText: (text: string) => void, text: string) => {
    setText(text);
    value.stopAnimation();
    value.setValue(0);
    Animated.timing(value, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  };

  const onCompleteCurrentSet = async () => {
    try {
      await completeSet({
        sessionExerciseId: sessionExercise.id,
        weight,
        reps,
        endedAtMs: Date.now(),
      });
      navigation.navigate('RestTimer', {
        sessionExerciseId: sessionExercise.id,
        justCompletedSetIndex: currentSet,
      });
    } catch (error) {
      console.warn('[session] failed to complete set', error);
    }
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
  };

  const onSaveCurrentExerciseConfig = async () => {
    const fallbackName = exercise?.name ?? preset.exerciseName;
    const normalizedName = actionNameInput.trim();
    const parsedTargetSets = parseTargetSets(actionSetsInput) ?? preset.totalSets;
    const minAllowedSets = Math.max(completedSets, 1);

    try {
      await updateSessionExerciseName({
        sessionExerciseId: sessionExercise.id,
        customName: normalizedName || fallbackName,
      });
      await updateSessionExerciseTargetSets({
        sessionExerciseId: sessionExercise.id,
        targetSets: Math.max(parsedTargetSets, minAllowedSets),
      });
      closeActionModal();
    } catch (error) {
      console.warn('[session] failed to update exercise config', error);
    }
  };

  const onAddNextExercise = async () => {
    const nextName = actionNameInput.trim();
    const targetSetsInput = parseTargetSets(actionSetsInput);
    if (!nextName || !targetSetsInput) {
      return;
    }

    const nextRestSec = sessionExercise.restSecOverride ?? exercise?.defaultRestSec ?? 90;
    let nextSessionExerciseId: string | null = null;
    try {
      nextSessionExerciseId = await addExerciseToActiveSession(
        nextName,
        nextRestSec,
        nextRestSec,
        targetSetsInput,
      );
    } catch (error) {
      console.warn('[session] failed to add next exercise', error);
      return;
    }

    if (!nextSessionExerciseId) {
      return;
    }

    try {
      await updateSessionExerciseName({
        sessionExerciseId: nextSessionExerciseId,
        customName: nextName,
      });
    } catch (error) {
      console.warn('[session] failed to update next exercise name', error);
    }

    closeActionModal();
    navigation.setParams({sessionExerciseId: nextSessionExerciseId});
  };

  const onOpenNextExerciseModal = () => {
    setActionModalMode('next');
    setActionNameInput('');
    setActionSetsInput('4');
    setActionModalVisible(true);
  };

  const onFinishWorkout = async () => {
    const sessionId = activeSession.id;
    try {
      await endActiveSession();
      navigation.navigate('WorkoutSummary', {sessionId});
    } catch (error) {
      console.warn('[session] failed to end session', error);
    }
  };

  const restCount = sessionExercise.sets.filter(record => typeof record.restActualSec === 'number').length;
  const metricValueStyle = getMetricValueStyle(weight);
  const parsedWeightInput = parseWeightInput(weightInputText);
  const canConfirmWeightInput = parsedWeightInput !== null;

  const openWeightInputModal = () => {
    setWeightInputText(formatWeightDisplay(weight));
    setWeightModalVisible(true);
  };

  const closeWeightInputModal = () => {
    setWeightModalVisible(false);
  };

  const onConfirmWeightInput = () => {
    if (parsedWeightInput === null) {
      return;
    }
    setWeight(normalizeWeight(parsedWeightInput));
    closeWeightInputModal();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>正在训练</Text>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {showCustomName ? displayName : exercise?.name ?? preset.exerciseName}
            </Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Text style={styles.more}>•••</Text>
          </Pressable>
        </View>

        <View style={styles.progressHead}>
          <View>
            <Text style={styles.progressLabel}>当前进度</Text>
            <Text style={styles.exerciseMeta}>{`动作 ${currentExerciseIndex}/${activeSession.items.length}`}</Text>
          </View>
          <Text style={styles.progressValue}>
            <Text style={styles.progressValueStrong}>{completedSets}</Text>
            <Text style={styles.progressValueLight}>{` / ${totalSets} 组`}</Text>
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
        </View>

        <View style={styles.contentCenter}>
          {showCustomName ? (
            <Text
              style={styles.exerciseNameZh}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.34}>
              {displayName}
            </Text>
          ) : (
            <View style={styles.exerciseNamePlaceholder} />
          )}

          <View style={styles.metricRow}>
            <View style={styles.metricBlock}>
              <Pressable onPress={openWeightInputModal} style={styles.metricValueTapArea}>
                <Text
                  style={[styles.metricValue, metricValueStyle]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}>
                  {formatWeightDisplay(weight)}
                </Text>
              </Pressable>
              <Text style={styles.metricUnit}>KG</Text>
              <Text style={styles.metricDesc}>目标重量（点击输入）</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{reps}</Text>
              <Text style={styles.metricUnit}>REPS</Text>
              <Text style={styles.metricDesc}>目标次数</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomActions}>
          {!isActionFinished ? (
            <>
              <Pressable style={styles.mainButton} onPress={() => void onCompleteCurrentSet()}>
                <Text style={styles.mainButtonText}>✓  完成本组</Text>
              </Pressable>
              <View style={styles.adjustRow}>
                <Animated.Text
                  pointerEvents="none"
                  style={[
                    styles.adjustFxText,
                    {
                      opacity: weightFx.interpolate({inputRange: [0, 0.2, 1], outputRange: [0, 1, 0]}),
                      transform: [
                        {
                          translateY: weightFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, -14],
                          }),
                        },
                        {
                          scale: weightFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1.1],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {weightFxText}
                </Animated.Text>
                <Pressable
                  style={styles.adjustPill}
                  onPress={() => {
                    setWeight(value => normalizeWeight(value - 2.5));
                    triggerFx(weightFx, setWeightFxText, '-2.5kg');
                  }}>
                  <Text style={styles.adjustPillText}>-2.5kg</Text>
                </Pressable>
                <Text style={styles.adjustHint}>调整重量 / 次数</Text>
                <Pressable
                  style={styles.adjustPill}
                  onPress={() => {
                    setWeight(value => normalizeWeight(value + 2.5));
                    triggerFx(weightFx, setWeightFxText, '+2.5kg');
                  }}>
                  <Text style={styles.adjustPillText}>+2.5kg</Text>
                </Pressable>
              </View>
              <View style={styles.adjustRowSecondary}>
                <Animated.Text
                  pointerEvents="none"
                  style={[
                    styles.adjustFxTextSmall,
                    {
                      opacity: repsFx.interpolate({inputRange: [0, 0.2, 1], outputRange: [0, 1, 0]}),
                      transform: [
                        {
                          translateY: repsFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, -10],
                          }),
                        },
                        {
                          scale: repsFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1.1],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {repsFxText}
                </Animated.Text>
                <Pressable
                  style={styles.adjustPillSmall}
                  onPress={() => {
                    setReps(value => clamp(value - 1, 1, 50));
                    triggerFx(repsFx, setRepsFxText, '---');
                  }}>
                  <Text style={styles.adjustPillTextSmall}>-1</Text>
                </Pressable>
                <Pressable
                  style={styles.adjustPillSmall}
                  onPress={() => {
                    setReps(value => clamp(value + 1, 1, 50));
                    triggerFx(repsFx, setRepsFxText, '+++');
                  }}>
                  <Text style={styles.adjustPillTextSmall}>+1</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable style={styles.mainButton} onPress={onOpenNextExerciseModal}>
                <Text style={styles.mainButtonTextSmall}>填写下一个动作  →</Text>
              </Pressable>
              <Pressable style={styles.ghostButton} onPress={() => void onFinishWorkout()}>
                <Text style={styles.ghostButtonText}>本次训练完成</Text>
              </Pressable>
              <Pressable
                style={styles.statsEntry}
                onPress={() =>
                  navigation.navigate('RestStats', {
                    sessionExerciseId: sessionExercise.id,
                  })
                }>
                <Text style={styles.statsEntryText}>{`已记录休息 ${restCount} 组`}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <Modal transparent visible={actionModalVisible} animationType="fade">
        <View style={styles.nameModalBackdrop}>
          <View style={styles.nameModalCard}>
            <Text style={styles.nameModalTitle}>
              {actionModalMode === 'current' ? '设置当前动作信息' : '填写下一个动作'}
            </Text>

            <Text style={styles.modalFieldLabel}>动作名称</Text>
            <TextInput
              value={actionNameInput}
              onChangeText={setActionNameInput}
              style={styles.nameInput}
              placeholder="例如：高位下拉 / 卧推"
              placeholderTextColor="#B5BCC8"
            />

            <Text style={styles.modalFieldLabel}>目标组数</Text>
            <TextInput
              value={actionSetsInput}
              onChangeText={setActionSetsInput}
              style={styles.nameInput}
              keyboardType="number-pad"
              placeholder="例如：4"
              placeholderTextColor="#B5BCC8"
            />

            <View style={styles.nameModalActions}>
              <Pressable style={styles.nameModalGhost} onPress={closeActionModal}>
                <Text style={styles.nameModalGhostText}>取消</Text>
              </Pressable>
              <Pressable
                style={styles.nameModalConfirm}
                onPress={
                  actionModalMode === 'current'
                    ? () => void onSaveCurrentExerciseConfig()
                    : () => void onAddNextExercise()
                }>
                <Text style={styles.nameModalConfirmText}>
                  {actionModalMode === 'current' ? '开始训练' : '添加动作'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={weightModalVisible} animationType="fade" onRequestClose={closeWeightInputModal}>
        <View style={styles.nameModalBackdrop}>
          <View style={styles.nameModalCard}>
            <Text style={styles.nameModalTitle}>输入目标重量</Text>

            <Text style={styles.modalFieldLabel}>重量（KG）</Text>
            <TextInput
              value={weightInputText}
              onChangeText={setWeightInputText}
              style={styles.nameInput}
              keyboardType="decimal-pad"
              placeholder="例如：110 或 62.5"
              placeholderTextColor="#B5BCC8"
            />

            <View style={styles.nameModalActions}>
              <Pressable style={styles.nameModalGhost} onPress={closeWeightInputModal}>
                <Text style={styles.nameModalGhostText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.nameModalConfirm, !canConfirmWeightInput && styles.nameModalConfirmDisabled]}
                disabled={!canConfirmWeightInput}
                onPress={onConfirmWeightInput}>
                <Text style={styles.nameModalConfirmText}>应用重量</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyTitle: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
  },
  emptyButton: {
    borderRadius: 16,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    width: '100%',
    textAlign: 'center',
  },
  progressHead: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#9BA3B1',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseMeta: {
    marginTop: 4,
    color: '#B0B7C4',
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: '#B7BECA',
    fontSize: 42,
    fontWeight: '700',
  },
  progressValueStrong: {
    color: '#090909',
    fontWeight: '900',
  },
  progressValueLight: {
    color: '#B7BECA',
    fontSize: 20,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 12,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#E7E9EE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0A0A0A',
  },
  contentCenter: {
    marginTop: 72,
    alignItems: 'center',
  },
  exerciseNameZh: {
    color: '#090909',
    fontSize: 66,
    lineHeight: 72,
    fontWeight: '900',
    letterSpacing: 0.3,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  metricRow: {
    marginTop: 52,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#090909',
    fontSize: 96,
    lineHeight: 96,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  metricValueTapArea: {
    width: '100%',
    alignItems: 'center',
  },
  metricUnit: {
    marginTop: -8,
    color: '#9BA4B2',
    fontSize: 18,
    fontWeight: '800',
  },
  metricDesc: {
    marginTop: 22,
    color: '#C1C7D1',
    fontSize: 15,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 120,
    backgroundColor: '#E4E7EC',
    marginHorizontal: 18,
    transform: [{rotate: '8deg'}],
  },
  bottomActions: {
    marginTop: 'auto',
    paddingBottom: 14,
  },
  mainButton: {
    height: 82,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  mainButtonTextSmall: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ghostButton: {
    marginTop: 12,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E9EDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: '#1C2637',
    fontSize: 18,
    fontWeight: '800',
  },
  adjustRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  adjustHint: {
    color: '#A6AEBB',
    fontSize: 16,
    fontWeight: '700',
  },
  adjustPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E9EDF3',
  },
  adjustPillText: {
    color: '#465163',
    fontSize: 16,
    fontWeight: '800',
  },
  adjustRowSecondary: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    position: 'relative',
  },
  adjustPillSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
  },
  adjustPillTextSmall: {
    color: '#5A6576',
    fontSize: 15,
    fontWeight: '800',
  },
  adjustFxText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -18,
    textAlign: 'center',
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },
  adjustFxTextSmall: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -14,
    textAlign: 'center',
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  exerciseNamePlaceholder: {
    height: 68,
  },
  nameModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nameModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  nameModalTitle: {
    color: '#0B0B0B',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalFieldLabel: {
    marginTop: 12,
    color: '#6D7685',
    fontSize: 14,
    fontWeight: '700',
  },
  nameInput: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DDE6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0B0B0B',
  },
  nameModalActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  nameModalGhost: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameModalGhostText: {
    color: '#4B5361',
    fontSize: 15,
    fontWeight: '700',
  },
  nameModalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameModalConfirmDisabled: {
    backgroundColor: '#8892A1',
  },
  nameModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsEntry: {
    marginTop: 14,
    alignItems: 'center',
  },
  statsEntryText: {
    color: '#9FA8B5',
    fontSize: 15,
    fontWeight: '700',
  },
});
