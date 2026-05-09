import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AddQr,
  DoubleTick,
  HomeActive,
  HomeInactive,
  ProfileActive,
  ProfileInactive,
  Users,
} from '../assets/svgs';
import type { AdminTabParamList } from './types';
import { tabBarTokens } from '../theme/tabBarTokens';

const activeColor = tabBarTokens.activeColor;
const inactiveColor = tabBarTokens.inactiveColor;
const iconSize = 24;

function CheckApprovalsGlyph({ focused }: { focused: boolean }) {
  const c = focused ? activeColor : inactiveColor;
  return <DoubleTick width={iconSize} height={iconSize} color={c} />;
}

function ScanCenterGlyph({ focused }: { focused: boolean }) {
  return (
    <View
      style={[
        styles.scanOuter,
        focused && styles.scanOuterActive,
      ]}>
      <AddQr width={28} height={28} />
    </View>
  );
}

function TabIcon({
  name,
  focused,
}: {
  name: 'home' | 'users' | 'scan' | 'approvals' | 'profile';
  focused: boolean;
}) {
  switch (name) {
    case 'home':
      return focused ? (
        <HomeActive width={iconSize} height={iconSize} />
      ) : (
        <HomeInactive width={iconSize} height={iconSize} />
      );
    case 'users':
      return (
        <Users
          width={iconSize}
          height={iconSize}
          color={focused ? activeColor : inactiveColor}
        />
      );
    case 'scan':
      return <ScanCenterGlyph focused={focused} />;
    case 'approvals':
      return <CheckApprovalsGlyph focused={focused} />;
    case 'profile':
      return focused ? (
        <ProfileActive width={iconSize} height={iconSize} />
      ) : (
        <ProfileInactive width={iconSize} height={iconSize} />
      );
  }
}

export function AdminTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  const go = (name: keyof AdminTabParamList) => {
    navigation.navigate(name);
  };

  const tab = (
    routeName: keyof AdminTabParamList,
    label: string,
    icon: 'home' | 'users' | 'scan' | 'approvals' | 'profile',
    isScan?: boolean,
  ) => {
    const focused = activeRoute === routeName;
    return (
      <Pressable
        key={routeName}
        style={[styles.tabItem, isScan && styles.tabItemScan]}
        onPress={() => go(routeName)}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}>
        <TabIcon name={icon} focused={focused} />
        {!isScan ? (
          <Text
            style={[
              styles.tabLabel,
              { color: focused ? activeColor : inactiveColor },
              focused && styles.tabLabelActive,
            ]}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const tabConfig: Record<
    keyof AdminTabParamList,
    { label: string; icon: 'home' | 'users' | 'scan' | 'approvals' | 'profile'; isScan?: boolean }
  > = {
    AdminHome: { label: 'Home', icon: 'home' },
    AdminUsers: { label: 'Users', icon: 'users' },
    AdminScan: { label: 'Scan', icon: 'scan', isScan: true },
    AdminApprovals: { label: 'Approvals', icon: 'approvals' },
    AdminProfile: { label: 'Profile', icon: 'profile' },
  };

  return (
    <View
      style={[
        styles.bar,
        styles.barShadow,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}>
      <View style={styles.row}>
        {state.routes.map(r => {
          const cfg = tabConfig[r.name as keyof AdminTabParamList];
          if (!cfg) return null;
          return tab(
            r.name as keyof AdminTabParamList,
            cfg.label,
            cfg.icon,
            cfg.isScan,
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: tabBarTokens.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tabBarTokens.borderColor,
    paddingTop: 6,
  },
  barShadow: tabBarTokens.shadow,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: tabBarTokens.rowPaddingHorizontal,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tabBarTokens.itemPaddingVertical,
  },
  tabItemScan: {
    marginTop: tabBarTokens.floatingOffsetY,
  },
  tabLabel: {
    fontSize: tabBarTokens.labelSize,
    fontWeight: tabBarTokens.labelWeight,
    marginTop: 4,
  },
  tabLabelActive: {
    fontWeight: tabBarTokens.labelActiveWeight,
  },
  scanOuter: {
    width: tabBarTokens.floatingSize,
    height: tabBarTokens.floatingSize,
    borderRadius: tabBarTokens.floatingRadius,
    backgroundColor: tabBarTokens.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...tabBarTokens.floatingShadow,
  },
  scanOuterActive: {
    transform: [{ scale: 1.02 }],
  },
});
