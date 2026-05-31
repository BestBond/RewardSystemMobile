import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { AdminTabBar } from './AdminTabBar';
import { AdminHomeStack } from './AdminHomeStack';
import { AdminUsersStack } from './AdminUsersStack';
import { AdminApprovalsStack } from './AdminApprovalsStack';
import { AdminProfileStack } from './AdminProfileStack';
import { AdminCouponStack } from './AdminCouponStack';
import type { AdminTabParamList } from './types';
import { getAuthMe } from '../api/users';
import { adminUi } from '../theme/adminUi';
import { isOperationalOnly, isSuperAdmin } from '../screens/admin/adminRole';

const Tab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabBarOuter(props: BottomTabBarProps) {
  return <AdminTabBar {...props} />;
}

export function AdminTabNavigator() {
  const [loading, setLoading] = useState(true);
  const [roleSnap, setRoleSnap] = useState<{ roles?: string[]; permissions?: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthMe()
      .then(res => {
        if (cancelled) return;
        setRoleSnap(res.user ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setRoleSnap(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      getAuthMe()
        .then(res => setRoleSnap(res.user ?? null))
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: adminUi.screenBg,
        }}>
        <ActivityIndicator color={adminUi.accentOrange} />
      </View>
    );
  }

  const superAdmin = isSuperAdmin(roleSnap);
  const operationalOnly = isOperationalOnly(roleSnap);
  const showUsers = superAdmin;
  const showCoupon = superAdmin;
  const showApprovals = superAdmin || operationalOnly;

  return (
    <Tab.Navigator
      tabBar={AdminTabBarOuter}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      initialRouteName="AdminHome">
      <Tab.Screen name="AdminHome" component={AdminHomeStack} />
      {showUsers ? <Tab.Screen name="AdminUsers" component={AdminUsersStack} /> : null}
      {showCoupon ? <Tab.Screen name="AdminScan" component={AdminCouponStack} /> : null}
      {showApprovals ? <Tab.Screen name="AdminApprovals" component={AdminApprovalsStack} /> : null}
      <Tab.Screen name="AdminProfile" component={AdminProfileStack} />
    </Tab.Navigator>
  );
}
