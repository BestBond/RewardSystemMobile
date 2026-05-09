import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CustomerSupportScreen } from '../screens/account/CustomerSupportScreen';
import { DeliveryStatusScreen } from '../screens/account/DeliveryStatusScreen';
import { GiftDeliveryStatusScreen } from '../screens/account/GiftDeliveryStatusScreen';
import { TransactionHistoryScreen } from '../screens/account/TransactionHistoryScreen';
import { UserProfileScreen } from '../screens/account/UserProfileScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="UserProfile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5F6F8' },
      }}>
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
      <Stack.Screen name="GiftDeliveryStatus" component={GiftDeliveryStatusScreen} />
      <Stack.Screen name="DeliveryStatus" component={DeliveryStatusScreen} />
    </Stack.Navigator>
  );
}
