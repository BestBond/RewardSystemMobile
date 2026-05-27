import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  ChatExternalOrange,
  LogOutDoor,
  LockClosed,
} from '../../assets/svgs';
import { clearAuthSession } from '../../api/storage';
import { getAuthMe, getMyProfile } from '../../api/users';
import type { AdminProfileStackParamList } from '../../navigation/types';
import { resetToLogin } from '../../navigation/rootNavigation';
import { adminUi } from '../../theme/adminUi';
import packageJson from '../../../package.json';
import { isOperationalOnly } from './adminRole';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';

type Nav = NativeStackNavigationProp<
  AdminProfileStackParamList,
  'AdminProfileHome'
>;

const APP_VERSION = packageJson.version;

export function AdminProfileHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('Admin');
  const [email, setEmail] = useState('');
  const [operationalOnly, setOperationalOnly] = useState(false);

  useRefreshOnFocusAndForeground(() => {
    getMyProfile()
      .then(p => {
        setName(p.fullName?.trim() || p.email.split('@')[0] || 'Admin');
        setEmail(p.email);
      })
      .catch(() => {});
    getAuthMe()
      .then(r => setOperationalOnly(isOperationalOnly(r.user ?? null)))
      .catch(() => setOperationalOnly(false));
  });

  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onLogout = async () => {
    await clearAuthSession();
    resetToLogin();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.pageTitle}>User Profile</Text>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 28 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, adminUi.shadowCard]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>
              {operationalOnly ? 'OPERATIONAL ADMIN' : 'SUPER ADMIN'}
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLbl}>EMP-ID</Text>
            <Text style={styles.metaVal}>99284-SA</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLbl}>EMAIL</Text>
            <Text style={styles.metaVal} numberOfLines={2}>
              {email || 'admin.central@nexus-corp.com'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.menuCard, pressed && { opacity: 0.95 }]}
          accessibilityRole="button"
          accessibilityLabel="Reset passcode"
          onPress={() => navigation.navigate('AdminResetPasscode')}>
          <View style={styles.menuIcon}>
            <LockClosed width={22} height={22} />
          </View>
          <View style={styles.menuMid}>
            <Text style={styles.menuTitle}>Reset Passcode</Text>
            <Text style={styles.menuSub}>Change your 6-digit login passcode</Text>
          </View>
          <ChevronRight width={20} height={20} strokeColor="#94A3B8" />
        </Pressable>

        {!operationalOnly ? (
          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && { opacity: 0.95 }]}
            accessibilityRole="button"
            accessibilityLabel="Open security and preferences"
            onPress={() => navigation.navigate('AdminSecurityPreferences')}>
            <View style={styles.menuIcon}>
              <LockClosed width={22} height={22} />
            </View>
            <View style={styles.menuMid}>
              <Text style={styles.menuTitle}>Security & Preferences</Text>
              <Text style={styles.menuSub}>Account password (Super Admin)</Text>
            </View>
            <ChevronRight width={20} height={20} strokeColor="#94A3B8" />
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.menuCard, pressed && { opacity: 0.95 }]}
          accessibilityRole="button"
          accessibilityLabel="Open system notifications"
          onPress={() => navigation.navigate('AdminSystemNotification')}>
          <View style={styles.menuIcon}>
            <ChatExternalOrange width={24} height={24} />
          </View>
          <View style={styles.menuMid}>
            <Text style={styles.menuTitle}>System Notification</Text>
            <Text style={styles.menuSub}>Critical alerts and notifications</Text>
          </View>
          <ChevronRight width={20} height={20} strokeColor="#94A3B8" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.95 }]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={() => {
            onLogout().catch(() => {});
          }}>
          <LogOutDoor width={22} height={22} />
          <Text style={styles.logoutTxt}>Log Out</Text>
        </Pressable>

        <Text style={styles.ver}>APP VERSION {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  pageTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scroll: { paddingHorizontal: 20 },
  card: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: adminUi.navyAlt },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: adminUi.accentOrange,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: adminUi.radiusPill,
    marginTop: 10,
  },
  badgeTxt: {
    color: adminUi.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metaBlock: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  metaLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.4,
  },
  metaVal: {
    fontSize: 14,
    fontWeight: '600',
    color: adminUi.sectionTitle,
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: adminUi.engageBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuMid: { flex: 1 },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  menuSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 2,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: adminUi.radiusPill,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    backgroundColor: adminUi.white,
  },
  logoutTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  ver: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 11,
    fontWeight: '600',
    color: adminUi.mutedGray,
    letterSpacing: 0.5,
  },
});
