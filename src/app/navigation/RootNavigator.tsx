import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {AIReportScreen} from '../screens/AIReportScreen';
import {GoalSetupScreen} from '../screens/GoalSetupScreen';
import {HistoryDetailScreen} from '../screens/HistoryDetailScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {RestFocusScreen} from '../screens/RestFocusScreen';
import {RestStatsScreen} from '../screens/RestStatsScreen';
import {RestTimerScreen} from '../screens/RestTimerScreen';
import {SessionScreen} from '../screens/SessionScreen';
import {WorkoutSummaryScreen} from '../screens/WorkoutSummaryScreen';
import {useOnboardingStore} from '../store/onboardingStore';
import {useSessionStore} from '../store/sessionStore';

export type RootStackParamList = {
  Login: undefined;
  GoalSetup: undefined;
  Home: undefined;
  Session: {sessionExerciseId?: string} | undefined;
  RestTimer: {sessionExerciseId: string; justCompletedSetIndex: number};
  RestFocus: {sessionExerciseId: string};
  RestStats: {sessionExerciseId: string};
  HistoryDetail: {sessionId?: string} | undefined;
  WorkoutSummary: {sessionId?: string} | undefined;
  AIReport: {sessionId?: string} | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  const isLoggedIn = useOnboardingStore(state => state.isLoggedIn);
  const hasCompletedGoalSetup = useOnboardingStore(state => state.hasCompletedGoalSetup);
  const startSessionAfterGoalSetup = useOnboardingStore(state => state.startSessionAfterGoalSetup);
  const clearStartSessionRequest = useOnboardingStore(state => state.clearStartSessionRequest);

  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const sessions = useSessionStore(state => state.sessions);

  const activeSession = activeSessionId
    ? sessions.find(session => session.id === activeSessionId)
    : undefined;
  const initialSessionExerciseId = activeSession?.items[0]?.id;
  const initialSessionParams =
    startSessionAfterGoalSetup && initialSessionExerciseId
      ? {sessionExerciseId: initialSessionExerciseId}
      : undefined;

  const routeKey = !isLoggedIn ? 'auth' : hasCompletedGoalSetup ? 'app' : 'goal-setup';
  const initialRouteName = !isLoggedIn
    ? 'Login'
    : hasCompletedGoalSetup
      ? startSessionAfterGoalSetup
        ? 'Session'
        : 'Home'
      : 'GoalSetup';

  React.useEffect(() => {
    if (hasCompletedGoalSetup && startSessionAfterGoalSetup) {
      clearStartSessionRequest();
    }
  }, [clearStartSessionRequest, hasCompletedGoalSetup, startSessionAfterGoalSetup]);

  return (
    <Stack.Navigator
      key={routeKey}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !hasCompletedGoalSetup ? (
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Session"
            component={SessionScreen}
            initialParams={initialSessionParams}
          />
          <Stack.Screen name="RestTimer" component={RestTimerScreen} />
          <Stack.Screen name="RestFocus" component={RestFocusScreen} />
          <Stack.Screen name="RestStats" component={RestStatsScreen} />
          <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
          <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
          <Stack.Screen name="AIReport" component={AIReportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
