import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminUsersListScreen } from '../screens/admin/AdminUsersListScreen';
import { AdminUserDetailScreen } from '../screens/admin/AdminUserDetailScreen';
import { AdminUserTransactionsScreen } from '../screens/admin/AdminUserTransactionsScreen';
import { AdminOpsApprovalsScreen } from '../screens/admin/AdminOpsApprovalsScreen';
import type { AdminUsersStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminUsersStackParamList>();

export function AdminUsersStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminUsersList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen name="AdminUsersList" component={AdminUsersListScreen} />
      <Stack.Screen name="AdminOpsApprovals" component={AdminOpsApprovalsScreen} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
      <Stack.Screen name="AdminUserTransactions" component={AdminUserTransactionsScreen} />
    </Stack.Navigator>
  );
}
