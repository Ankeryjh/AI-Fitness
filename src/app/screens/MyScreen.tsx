import React, {useMemo} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/RootNavigator';
import {formatDuration} from '../services/format';
import {getWorkoutSummary, useSessionStore} from '../store/sessionStore';

export const MyScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessions = useSessionStore(state => state.sessions);

  const latest = useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))[0],
    [sessions],
  );

  const latestSummary = latest ? getWorkoutSummary(latest) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.overline}>MY CENTER</Text>
        <Text style={styles.title}>我的</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>训练入口</Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('HistoryDetail', latest ? {sessionId: latest.id} : undefined)}>
            <Text style={styles.primaryBtnText}>查看历史训练</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('AIReport', latest ? {sessionId: latest.id} : undefined)}>
            <Text style={styles.secondaryBtnText}>查看 AI 报告</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>最近一次训练</Text>
          {latest && latestSummary ? (
            <>
              <Text style={styles.metaText}>{new Date(latest.startAt).toLocaleDateString('zh-CN')}</Text>
              <Text style={styles.metaText}>{`总组数 ${latestSummary.totalSets} 组`}</Text>
              <Text style={styles.metaText}>{`总时长 ${formatDuration(latestSummary.totalDurationSec)}`}</Text>
            </>
          ) : (
            <Text style={styles.metaText}>暂无训练记录</Text>
          )}
        </View>
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
    paddingTop: 8,
    gap: 14,
  },
  overline: {
    color: '#A2AAB6',
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  title: {
    marginTop: 2,
    color: '#090909',
    fontSize: 34,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EE',
    gap: 10,
  },
  cardTitle: {
    color: '#121A2A',
    fontSize: 18,
    fontWeight: '800',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8ECF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },
  metaText: {
    color: '#5C677A',
    fontSize: 14,
    fontWeight: '600',
  },
});
