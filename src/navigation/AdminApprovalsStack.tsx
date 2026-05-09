import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminApprovalsListScreen } from '../screens/admin/AdminApprovalsListScreen';
import { AdminApprovalDetailScreen } from '../screens/admin/AdminApprovalDetailScreen';
import type { AdminApprovalsStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminApprovalsStackParamList>();

export function AdminApprovalsStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminApprovalsList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen
        name="AdminApprovalsList"
        component={AdminApprovalsListScreen}
      />
      <Stack.Screen
        name="AdminApprovalDetail"
        component={AdminApprovalDetailScreen}
      />
    </Stack.Navigator>
  );
}
