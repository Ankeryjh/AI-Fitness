import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {HistoryDetailScreen} from '../screens/HistoryDetailScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {RestFocusScreen} from '../screens/RestFocusScreen';
import {SessionScreen} from '../screens/SessionScreen';

export type RootStackParamList = {
  Home: undefined;
  Session: undefined;
  RestFocus: {sessionExerciseId: string};
  HistoryDetail: {sessionId?: string} | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen name="RestFocus" component={RestFocusScreen} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
    </Stack.Navigator>
  );
};
