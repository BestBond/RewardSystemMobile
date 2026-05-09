import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { rootNavigationRef } from './rootNavigation';
import { MainTabNavigator } from './MainTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { AdminProfileSetupScreen } from '../screens/AdminProfileSetupScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthLandingScreen } from '../screens/AuthLandingScreen';
import { CustomerAuthScreen } from '../screens/CustomerAuthScreen';
import { AdminLoginScreen } from '../screens/AdminLoginScreen';
import { OpsAdminSignUpScreen } from '../screens/OpsAdminSignUpScreen';
import { PendingApprovalScreen } from '../screens/PendingApprovalScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer ref={rootNavigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
        <Stack.Screen name="CustomerAuth" component={CustomerAuthScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="OpsAdminSignUp" component={OpsAdminSignUpScreen} />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="AdminProfileSetup" component={AdminProfileSetupScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
