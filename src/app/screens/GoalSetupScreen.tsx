import React, {useMemo, useState} from 'react';
import {Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {MuscleSymbolIcon, MuscleSymbolName} from '../components/MuscleSymbolIcon';
import {GoalType, useOnboardingStore} from '../store/onboardingStore';
import {useSessionStore} from '../store/sessionStore';

interface GoalItem {
  type: GoalType;
  titleZh: string;
  titleEn: string;
  iconSymbol: MuscleSymbolName;
}

const goalOptions: GoalItem[] = [
  {type: 'chest', titleZh: '胸部', titleEn: 'CHEST', iconSymbol: 'fitness_center'},
  {type: 'back', titleZh: '背部', titleEn: 'BACK', iconSymbol: 'accessibility_new'},
  {type: 'legs', titleZh: '腿部', titleEn: 'LEGS', iconSymbol: 'directions_run'},
  {type: 'shoulders', titleZh: '肩部', titleEn: 'SHOULDERS', iconSymbol: 'sports_gymnastics'},
  {type: 'arms', titleZh: '手臂', titleEn: 'ARMS', iconSymbol: 'do_not_step'},
  {type: 'core', titleZh: '核心', titleEn: 'CORE', iconSymbol: 'self_improvement'},
];

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

export const GoalSetupScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const logout = useOnboardingStore(state => state.logout);
  const storedGoalType = useOnboardingStore(state => state.goalSetup.goalType);
  const completeGoalSetup = useOnboardingStore(state => state.completeGoalSetup);
  const requestStartSession = useOnboardingStore(state => state.requestStartSession);

  const sessions = useSessionStore(state => state.sessions);
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const createSession = useSessionStore(state => state.createSession);
  const addExerciseToActiveSession = useSessionStore(state => state.addExerciseToActiveSession);

  const [goalType, setGoalType] = useState<GoalType>(
    goalOptions.some(option => option.type === storedGoalType) ? storedGoalType : 'chest',
  );
  const [confirmVisible, setConfirmVisible] = useState(false);

  const selectedGoal = useMemo(
    () => goalOptions.find(option => option.type === goalType) ?? goalOptions[0],
    [goalType],
  );

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    logout();
  };

  const onStartTraining = () => {
    setConfirmVisible(true);
  };

  const startTrainingSession = () => {
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

    if (nextSessionExerciseId) {
      requestStartSession();
    }
    completeGoalSetup({goalType});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerButton} onPress={onBack}>
            <Text style={styles.headerArrow}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerOverline}>WORKOUT SETUP</Text>
            <Text style={styles.headerTitle}>新的训练</Text>
          </View>

          <Pressable style={styles.headerButton}>
            <Text style={styles.headerGear}>⚙︎</Text>
          </Pressable>
        </View>

        <Text style={styles.mainTitle}>今日目标</Text>
        <Text style={styles.mainSubtitle}>选择你要训练的肌群</Text>

        <ScrollView
          style={styles.goalScroll}
          contentContainerStyle={styles.goalScrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.goalList}>
            {goalOptions.map(option => {
              const selected = option.type === goalType;

              return (
                <Pressable
                  key={option.type}
                  onPress={() => setGoalType(option.type)}
                  style={styles.goalRow}>
                  <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                    <MuscleSymbolIcon
                      symbol={option.iconSymbol}
                      color={selected ? '#FFFFFF' : '#111111'}
                      size={28}
                    />
                  </View>

                  <View style={styles.goalTextBlock}>
                    <Text style={styles.goalZh}>{option.titleZh}</Text>
                    <Text style={styles.goalEn}>{option.titleEn}</Text>
                  </View>

                  <View style={selected ? styles.radioActive : styles.radioIdle}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.ctaButton} onPress={onStartTraining}>
            <Text style={styles.ctaText}>开始今日训练  →</Text>
          </Pressable>

          <Text style={styles.lastWorkout}>◷  上次训练: 2天前 ({selectedGoal.titleZh})</Text>
          <View style={styles.homeIndicator} />
        </View>
      </View>

      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>开始训练？</Text>
            <Text style={styles.modalSubtitle}>{`目标肌群：${selectedGoal.titleZh}`}</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>再想想</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={() => {
                  setConfirmVisible(false);
                  startTrainingSession();
                }}>
                <Text style={styles.modalConfirmText}>开始训练</Text>
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
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  goalScroll: {
    flex: 1,
  },
  goalScrollContent: {
    paddingBottom: 8,
  },
  headerRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerArrow: {
    color: '#0B0B0B',
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerOverline: {
    color: '#A2AAB6',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#0B0B0B',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  headerGear: {
    color: '#0B0B0B',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '600',
  },
  mainTitle: {
    marginTop: 36,
    color: '#090909',
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
  },
  mainSubtitle: {
    marginTop: 8,
    color: '#8E95A3',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  goalList: {
    marginTop: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DEE2E9',
  },
  goalRow: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DEE2E9',
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#D6DBE4',
    backgroundColor: '#EFF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconWrapSelected: {
    backgroundColor: '#090909',
    borderColor: '#090909',
  },
  goalTextBlock: {
    flex: 1,
  },
  goalZh: {
    color: '#090909',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  goalEn: {
    marginTop: 2,
    color: '#9199A7',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  radioIdle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD1DB',
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    paddingTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalTitle: {
    color: '#0B0B0B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 8,
    color: '#8C93A1',
    fontSize: 14,
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#EEF1F5',
  },
  modalConfirm: {
    backgroundColor: '#0A0A0A',
  },
  modalCancelText: {
    color: '#4B5361',
    fontSize: 15,
    fontWeight: '700',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaButton: {
    height: 70,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  lastWorkout: {
    marginTop: 18,
    textAlign: 'center',
    color: '#9AA2AF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  homeIndicator: {
    alignSelf: 'center',
    width: 140,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E4EA',
    marginTop: 28,
    marginBottom: 8,
  },
});
