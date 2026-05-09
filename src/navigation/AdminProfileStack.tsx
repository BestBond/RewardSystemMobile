import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminProfileHomeScreen } from '../screens/admin/AdminProfileHomeScreen';
import { AdminSecurityScreen } from '../screens/admin/AdminSecurityScreen';
import { AdminSystemNotificationScreen } from '../screens/admin/AdminSystemNotificationScreen';
import type { AdminProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminProfileStackParamList>();

export function AdminProfileStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminProfileHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen
        name="AdminProfileHome"
        component={AdminProfileHomeScreen}
      />
      <Stack.Screen
        name="AdminSecurityPreferences"
        component={AdminSecurityScreen}
      />
      <Stack.Screen
        name="AdminSystemNotification"
        component={AdminSystemNotificationScreen}
      />
    </Stack.Navigator>
  );
}
