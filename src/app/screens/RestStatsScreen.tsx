import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatClockFixed} from '../services/format';
import {useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RestStats'>;

export const RestStatsScreen = ({navigation, route}: Props): React.JSX.Element => {
  const {sessionExerciseId} = route.params;
  const sessions = useSessionStore(state => state.sessions);
  const exercises = useSessionStore(state => state.exercises);

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

  const displayName =
    snapshot?.item.customName?.trim() || snapshot?.exercise?.name || '';

  if (!snapshot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>休息记录为空</Text>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Session')}>
            <Text style={styles.actionButtonText}>返回训练</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const restEntries = snapshot.item.sets
    .filter(setRecord => typeof setRecord.restActualSec === 'number')
    .map(setRecord => ({
      index: setRecord.index,
      restSec: setRecord.restActualSec as number,
      at: setRecord.nextSetStartAt ?? setRecord.setEndAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => b.index - a.index);

  const totalRestSec = restEntries.reduce((sum, entry) => sum + entry.restSec, 0);
  const averageRestSec = restEntries.length > 0 ? Math.round(totalRestSec / restEntries.length) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>CURRENT SESSION</Text>
            <Text style={styles.headerTitle}>已休息组数统计</Text>
          </View>
          <Pressable style={styles.iconButton}>
            <Text style={styles.iconShare}>↗</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>总休息时长</Text>
          <Text style={styles.summaryValue}>
            <Text style={styles.summaryStrong}>{String(Math.floor(totalRestSec / 60)).padStart(2, '0')}</Text>
            <Text style={styles.summaryUnit}>分 </Text>
            <Text style={styles.summaryStrong}>{String(totalRestSec % 60).padStart(2, '0')}</Text>
            <Text style={styles.summaryUnit}>秒</Text>
          </Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryFoot}>
            <Text style={styles.summaryFootLabel}>平均每组休息</Text>
            <Text style={styles.summaryFootValue}>{formatClockFixed(averageRestSec)}</Text>
          </View>
        </View>

        <View style={styles.recordHead}>
          <Text style={styles.recordTitle}>休息记录</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{`${restEntries.length} 组`}</Text>
          </View>
        </View>

        <View style={styles.timeline}>
          {restEntries.map((entry, idx) => {
            const isFirst = idx === 0;
            const tag =
              entry.restSec >= averageRestSec + 20
                ? `+${entry.restSec - averageRestSec}s 额外休息`
                : entry.restSec <= averageRestSec - 15
                  ? `${averageRestSec - entry.restSec}s 快速切换`
                  : '完美达标';

            const tagColor =
              tag === '完美达标' ? '#00A45A' : tag.includes('额外') ? '#7A869B' : '#4E647F';

            return (
              <View key={`${entry.index}_${entry.at}`} style={styles.timelineItem}>
                <View style={styles.timelineAxis}>
                  <View style={[styles.dot, isFirst && styles.dotActive]} />
                  {idx < restEntries.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.timelineBody}>
                  <View style={styles.timelineTop}>
                    <Text style={styles.groupName}>{`第 ${entry.index} 组`}</Text>
                    <Text style={styles.clock}>{new Date(entry.at).toLocaleTimeString()}</Text>
                  </View>
                  <View style={styles.restCard}>
                    <View>
                      <Text style={styles.restLabel}>时长</Text>
                      <Text style={styles.restValue}>{formatClockFixed(entry.restSec)}</Text>
                    </View>
                    <Text style={[styles.restTag, {color: tagColor}]}>{tag}</Text>
                  </View>
                    
                </View>
              </View>
            );
          })}
        </View>

        <Pressable style={styles.moreHistory}>
          <Text style={styles.moreHistoryText}>查看更多历史记录  ˅</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('Session', {sessionExerciseId})}>
          <Text style={styles.actionButtonText}>{`继续训练 ${displayName}  →`}</Text>
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
    marginTop: 4,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#111111',
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
  },
  iconShare: {
    color: '#111111',
    fontSize: 20,
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
  summaryCard: {
    marginTop: 14,
    borderRadius: 26,
    backgroundColor: '#000000',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  summaryLabel: {
    color: '#A6B0BF',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    marginTop: 8,
  },
  summaryStrong: {
    color: '#FFFFFF',
    fontSize: 66,
    lineHeight: 66,
    fontWeight: '900',
  },
  summaryUnit: {
    color: '#D2D9E4',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryDivider: {
    marginTop: 8,
    height: 1,
    backgroundColor: '#222A38',
  },
  summaryFoot: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryFootLabel: {
    color: '#AAB4C3',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryFootValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  recordHead: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTitle: {
    color: '#090909',
    fontSize: 30,
    fontWeight: '900',
  },
  badge: {
    minWidth: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E7EAF0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  badgeText: {
    color: '#4A576A',
    fontSize: 20,
    fontWeight: '800',
  },
  timeline: {
    marginTop: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 122,
  },
  timelineAxis: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C5CCD7',
    marginTop: 14,
  },
  dotActive: {
    backgroundColor: '#0A0A0A',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E4EA',
    marginTop: 6,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 8,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    color: '#2C3748',
    fontSize: 22,
    fontWeight: '900',
  },
  clock: {
    color: '#98A2B2',
    fontSize: 15,
    fontWeight: '600',
  },
  restCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E5EC',
    padding: 14,
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restLabel: {
    color: '#99A2AF',
    fontSize: 14,
    fontWeight: '500',
  },
  restValue: {
    marginTop: 2,
    color: '#141F31',
    fontSize: 42,
    fontWeight: '900',
  },
  restTag: {
    fontSize: 14,
    fontWeight: '700',
  },
  moreHistory: {
    marginTop: 14,
    alignItems: 'center',
  },
  moreHistoryText: {
    color: '#8E98A8',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: 18,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  emptyTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
});
