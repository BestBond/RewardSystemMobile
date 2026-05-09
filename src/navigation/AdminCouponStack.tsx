import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminCouponGenerateScreen } from '../screens/admin/coupon/AdminCouponGenerateScreen';
import { AdminCouponPreviewScreen } from '../screens/admin/coupon/AdminCouponPreviewScreen';
import { AdminCouponExportScreen } from '../screens/admin/coupon/AdminCouponExportScreen';
import { AdminCouponPdfViewerScreen } from '../screens/admin/coupon/AdminCouponPdfViewerScreen';
import type { AdminCouponStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminCouponStackParamList>();

export function AdminCouponStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminCouponGenerate"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen
        name="AdminCouponGenerate"
        component={AdminCouponGenerateScreen}
      />
      <Stack.Screen
        name="AdminCouponPreview"
        component={AdminCouponPreviewScreen}
      />
      <Stack.Screen
        name="AdminCouponExport"
        component={AdminCouponExportScreen}
      />
      <Stack.Screen
        name="AdminCouponPdfViewer"
        component={AdminCouponPdfViewerScreen}
      />
    </Stack.Navigator>
  );
}
