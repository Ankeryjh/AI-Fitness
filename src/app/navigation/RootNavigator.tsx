import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {AppTabIcon} from '../components/AppTabIcon';
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

type AppTabParamList = {
  TrainingTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

const AppTabs = (): React.JSX.Element => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        height: 62,
        paddingTop: 8,
        paddingBottom: 8,
        borderTopColor: '#E4E7EE',
        backgroundColor: '#FFFFFF',
      },
      tabBarLabelStyle: {
        fontSize: 13,
        fontWeight: '700',
      },
      tabBarActiveTintColor: '#111111',
      tabBarInactiveTintColor: '#8B95A4',
    }}>
    <Tab.Screen
      name="TrainingTab"
      component={GoalSetupScreen}
      options={{
        tabBarLabel: '训练',
        tabBarIcon: ({color, size}) => <AppTabIcon name="training" color={color} size={size} />,
      }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={HomeScreen}
      options={{
        tabBarLabel: '个人',
        tabBarIcon: ({color, size}) => <AppTabIcon name="profile" color={color} size={size} />,
      }}
    />
  </Tab.Navigator>
);

export const RootNavigator = (): React.JSX.Element => {
  const isLoggedIn = useOnboardingStore(state => state.isLoggedIn);
  const routeKey = !isLoggedIn ? 'auth' : 'app';
  const initialRouteName = !isLoggedIn ? 'Login' : 'Home';

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
      ) : (
        <>
          <Stack.Screen name="Home" component={AppTabs} />
          <Stack.Screen name="Session" component={SessionScreen} />
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
