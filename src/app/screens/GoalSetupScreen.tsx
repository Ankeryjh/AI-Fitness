import React, {useMemo, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {GoalType, useOnboardingStore} from '../store/onboardingStore';

interface GoalItem {
  type: GoalType;
  titleZh: string;
  titleEn: string;
  icon: string;
}

const goalOptions: GoalItem[] = [
  {type: 'chest', titleZh: '胸部', titleEn: 'CHEST', icon: '✖'},
  {type: 'back', titleZh: '背部', titleEn: 'BACK', icon: 'T'},
  {type: 'legs', titleZh: '腿部', titleEn: 'LEGS', icon: '⟂'},
  {type: 'shoulders', titleZh: '肩部', titleEn: 'SHOULDERS', icon: 'Y'},
  {type: 'arms', titleZh: '手臂', titleEn: 'ARMS', icon: '⤫'},
  {type: 'core', titleZh: '核心', titleEn: 'CORE', icon: '◎'},
];

export const GoalSetupScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const logout = useOnboardingStore(state => state.logout);
  const storedGoalType = useOnboardingStore(state => state.goalSetup.goalType);
  const completeGoalSetup = useOnboardingStore(state => state.completeGoalSetup);

  const [goalType, setGoalType] = useState<GoalType>(
    goalOptions.some(option => option.type === storedGoalType) ? storedGoalType : 'chest',
  );

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

        <View style={styles.goalList}>
          {goalOptions.map(option => {
            const selected = option.type === goalType;

            return (
              <Pressable
                key={option.type}
                onPress={() => setGoalType(option.type)}
                style={styles.goalRow}>
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  <Text style={[styles.iconText, selected && styles.iconTextSelected]}>{option.icon}</Text>
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

        <View style={styles.footer}>
          <Pressable style={styles.ctaButton} onPress={onStartTraining}>
            <Text style={styles.ctaText}>开始今日训练  →</Text>
          </Pressable>

          <Text style={styles.lastWorkout}>◷  上次训练: 2天前 ({selectedGoal.titleZh})</Text>
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 4,
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
  iconText: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
  iconTextSelected: {
    color: '#FFFFFF',
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
    marginTop: 'auto',
    paddingTop: 22,
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
