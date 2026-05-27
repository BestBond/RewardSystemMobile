import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CustomerSupportScreen } from '../screens/account/CustomerSupportScreen';
import { DeliveryStatusScreen } from '../screens/account/DeliveryStatusScreen';
import { GiftDeliveryStatusScreen } from '../screens/account/GiftDeliveryStatusScreen';
import { TransactionHistoryScreen } from '../screens/account/TransactionHistoryScreen';
import { LegalDocumentScreen } from '../screens/account/LegalDocumentScreen';
import { TermsPrivacyHubScreen } from '../screens/account/TermsPrivacyHubScreen';
import { DeleteAccountScreen } from '../screens/account/DeleteAccountScreen';
import { ResetPasscodeScreen } from '../screens/account/ResetPasscodeScreen';
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
      <Stack.Screen name="ResetPasscode" component={ResetPasscodeScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
      <Stack.Screen name="GiftDeliveryStatus" component={GiftDeliveryStatusScreen} />
      <Stack.Screen name="DeliveryStatus" component={DeliveryStatusScreen} />
      <Stack.Screen name="TermsPrivacyHub" component={TermsPrivacyHubScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    </Stack.Navigator>
  );
}
