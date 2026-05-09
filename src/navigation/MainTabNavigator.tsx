import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { MainTabBar } from '../components/MainTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { CartNavigator } from './CartNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { RewardsNavigator } from './RewardsNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabBarOuter(props: BottomTabBarProps) {
  return <MainTabBar {...props} />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={MainTabBarOuter}
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarHideOnKeyboard: true,
      }}
      initialRouteName="Home">
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartNavigator} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Rewards" component={RewardsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
