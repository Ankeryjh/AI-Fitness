import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatDuration} from '../services/format';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AIReport'>;

const calcTrend = (values: number[]): string => {
  if (values.length < 2) {
    return '数据不足，继续记录可获得趋势判断。';
  }
  const latest = values[0];
  const previous = values[1];
  if (latest > previous * 1.05) {
    return '力量输出呈上升趋势，建议下次主动作增加 2.5kg。';
  }
  if (latest < previous * 0.95) {
    return '当前疲劳偏高，建议下次保持重量并减少 1 组容量。';
  }
  return '表现稳定，建议维持当前计划并优化动作节奏。';
};

export const AIReportScreen = ({navigation, route}: Props): React.JSX.Element => {
  const sessions = useSessionStore(state => state.sessions);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt)),
    [sessions],
  );

  const targetSession =
    sortedSessions.find(session => session.id === route.params?.sessionId) ?? sortedSessions[0];

  const summary = targetSession ? getWorkoutSummary(targetSession) : null;
  const recentVolumes = sortedSessions.slice(0, 5).map(session =>
    session.items
      .flatMap(item => item.sets)
      .reduce((sum, setRecord) => sum + (setRecord.weight ?? 0) * (setRecord.reps ?? 0), 0),
  );

  const trendText = calcTrend(recentVolumes);
  const averageRest = summary?.averageRestSec ?? 0;
  const recoverySuggestion =
    averageRest > 130
      ? '组间休息偏长，建议先提高动作效率，再适度压缩到 90~120 秒。'
      : '组间恢复节奏合理，可维持当前休息策略。';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>AI DEEP REPORT</Text>
            <Text style={styles.headerTitle}>AI 深度分析报告</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>本次训练画像</Text>
          <Text style={styles.heroValue}>{summary ? formatDuration(summary.totalDurationSec) : '--'}</Text>
          <Text style={styles.heroSub}>{`完成 ${summary?.totalSets ?? 0} 组 · 平均休息 ${averageRest}s`}</Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>重量调整建议</Text>
          <Text style={styles.sectionBody}>{trendText}</Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>恢复建议</Text>
          <Text style={styles.sectionBody}>{recoverySuggestion}</Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>下次训练计划</Text>
          <Text style={styles.sectionBody}>
            下次训练建议保持 4 组主动作，前两组按当前重量完成，后两组尝试小幅进阶，并在训练后 30 分钟内补充蛋白质。
          </Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.sectionTitle}>近 5 次训练容量</Text>
          <View style={styles.volumeRow}>
            {recentVolumes.length === 0 ? (
              <Text style={styles.empty}>暂无记录</Text>
            ) : (
              recentVolumes.map((volume, index) => (
                <View key={`${volume}_${index}`} style={styles.volumeBadge}>
                  <Text style={styles.volumeBadgeLabel}>{`#${index + 1}`}</Text>
                  <Text style={styles.volumeBadgeValue}>{Math.round(volume)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Pressable style={styles.blackButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.blackButtonText}>返回个人中心</Text>
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
    gap: 12,
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
  heroCard: {
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: '#000000',
    padding: 18,
  },
  heroLabel: {
    color: '#A6B0BF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroValue: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 56,
    lineHeight: 56,
    fontWeight: '900',
  },
  heroSub: {
    marginTop: 8,
    color: '#CED6E1',
    fontSize: 15,
    fontWeight: '600',
  },
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E6ED',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  sectionTitle: {
    color: '#0F1726',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionBody: {
    color: '#596578',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  volumeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  volumeBadge: {
    minWidth: 70,
    borderRadius: 12,
    backgroundColor: '#EEF1F5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  volumeBadgeLabel: {
    color: '#7F8998',
    fontSize: 12,
    fontWeight: '700',
  },
  volumeBadgeValue: {
    marginTop: 3,
    color: '#1A2435',
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: '#98A2AF',
    fontSize: 13,
    fontWeight: '500',
  },
  blackButton: {
    marginTop: 10,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
