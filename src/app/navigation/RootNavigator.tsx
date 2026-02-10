import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {GoalSetupScreen} from '../screens/GoalSetupScreen';
import {HistoryDetailScreen} from '../screens/HistoryDetailScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {RestFocusScreen} from '../screens/RestFocusScreen';
import {SessionScreen} from '../screens/SessionScreen';
import {useOnboardingStore} from '../store/onboardingStore';

export type RootStackParamList = {
  Login: undefined;
  GoalSetup: undefined;
  Home: undefined;
  Session: undefined;
  RestFocus: {sessionExerciseId: string};
  HistoryDetail: {sessionId?: string} | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  const isLoggedIn = useOnboardingStore(state => state.isLoggedIn);
  const hasCompletedGoalSetup = useOnboardingStore(state => state.hasCompletedGoalSetup);

  const routeKey = !isLoggedIn ? 'auth' : hasCompletedGoalSetup ? 'app' : 'goal-setup';

  return (
    <Stack.Navigator
      key={routeKey}
      initialRouteName={!isLoggedIn ? 'Login' : hasCompletedGoalSetup ? 'Home' : 'GoalSetup'}
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
          <Stack.Screen name="Session" component={SessionScreen} />
          <Stack.Screen name="RestFocus" component={RestFocusScreen} />
          <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
