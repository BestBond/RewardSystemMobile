import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CartHomeScreen } from '../screens/cart/CartHomeScreen';
import { RewardCheckoutScreen } from '../screens/rewards/RewardCheckoutScreen';
import { RewardSuccessScreen } from '../screens/rewards/RewardSuccessScreen';
import type { CartStackParamList } from './types';

const Stack = createNativeStackNavigator<CartStackParamList>();

export function CartNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CartHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}>
      <Stack.Screen name="CartHome" component={CartHomeScreen} />
      <Stack.Screen name="RewardCheckout" component={RewardCheckoutScreen} />
      <Stack.Screen
        name="RewardSuccess"
        component={RewardSuccessScreen}
        options={{
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
