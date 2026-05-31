import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SuperAdminDashboardScreen } from '../screens/admin/SuperAdminDashboardScreen';
import { AdminGiftCatalogScreen } from '../screens/admin/AdminGiftCatalogScreen';
import { AdminOpsApprovalsScreen } from '../screens/admin/AdminOpsApprovalsScreen';
import type { AdminHomeStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminHomeStackParamList>();

export function AdminHomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen name="AdminDashboard" component={SuperAdminDashboardScreen} />
      <Stack.Screen name="AdminGiftCatalog" component={AdminGiftCatalogScreen} />
      <Stack.Screen name="AdminOpsApprovals" component={AdminOpsApprovalsScreen} />
    </Stack.Navigator>
  );
}
