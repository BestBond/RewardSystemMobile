import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RewardsHomeScreen } from '../screens/rewards/RewardsHomeScreen';
import type { RewardsStackParamList } from './types';

const Stack = createNativeStackNavigator<RewardsStackParamList>();

export function RewardsNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RewardsHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}>
      <Stack.Screen name="RewardsHome" component={RewardsHomeScreen} />
    </Stack.Navigator>
  );
}
