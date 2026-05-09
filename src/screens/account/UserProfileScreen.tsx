import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackArrowLeft,
  ChevronRight,
  IconGiftOrange,
  IconHeadsetOrange,
  IconReceiptDocOrange,
  LogOutDoor,
  MapPinOrange,
} from '../../assets/svgs';
import { getAuthMe, getMyProfile, type MyProfile } from '../../api/users';
import { redirectStaffToAdminShellIfNeeded } from '../../auth/staffShellRedirect';
import { clearAuthSession } from '../../api/storage';
import { navigateToProfileEdit, resetToLogin } from '../../navigation/rootNavigation';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';
import { MENU_SUBTITLES } from './accountFigmaData';
import packageJson from '../../../package.json';

const APP_VERSION = packageJson.version;

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'UserProfile'>;

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function roleLabel(p: MyProfile): string {
  const pro = p.profession?.trim();
  if (pro) return pro;
  return 'Dealer';
}

export function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, me] = await Promise.all([
        getMyProfile(),
        getAuthMe()
          .then(r => r.user)
          .catch(() => null),
      ]);
      if (redirectStaffToAdminShellIfNeeded(p, me)) return;
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().catch(() => {});
    }, [load]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <Pressable
            style={styles.backBtn}
            hitSlop={12}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <BackArrowLeft width={24} height={24} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryOrange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <Pressable
              style={styles.editBtn}
              onPress={() => navigateToProfileEdit()}
              hitSlop={8}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>
                  {initials(profile?.fullName ?? null)}
                </Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name}>
                  {profile?.fullName?.trim() || 'Member'}
                </Text>
                <View style={styles.roleRow}>
                  <MapPinOrange width={18} height={18} />
                  <Text style={styles.role}>{profile ? roleLabel(profile) : '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>LOYALTY POINTS</Text>
              <Text style={styles.statValue}>
                {(profile?.loyaltyPoints ?? 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MEMBER SINCE</Text>
              <Text style={styles.statValue}>
                {profile?.memberSinceYear != null
                  ? String(profile.memberSinceYear)
                  : '—'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('GiftDeliveryStatus')}>
            <IconGiftOrange width={24} height={24} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Gift Delivery Status</Text>
              <Text style={styles.menuSub}>{MENU_SUBTITLES.gift}</Text>
            </View>
            <ChevronRight strokeColor="#64748B" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('TransactionHistory')}>
            <IconReceiptDocOrange width={24} height={24} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Transaction History</Text>
              <Text style={styles.menuSub}>{MENU_SUBTITLES.tx}</Text>
            </View>
            <ChevronRight strokeColor="#64748B" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('CustomerSupport')}>
            <IconHeadsetOrange width={24} height={24} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Help / Contact Support</Text>
              <Text style={styles.menuSub}>{MENU_SUBTITLES.help}</Text>
            </View>
            <ChevronRight strokeColor="#64748B" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            onPress={async () => {
              await clearAuthSession();
              resetToLogin();
            }}>
            <LogOutDoor width={22} height={22} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Text style={styles.version}>APP VERSION {APP_VERSION}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: figma.consumerHomeBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 4,
    fontSize: 19,
    fontWeight: '800',
    color: figma.textBody,
  },
  scroll: {
    paddingHorizontal: figma.spaceGutter,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: figma.radiusScreenCard,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: figma.borderSoft,
    ...figma.shadowSoft,
  },
  editBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
  },
  editText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryOrange,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: figma.textBody,
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: figma.textBody,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  role: {
    fontSize: 15,
    fontWeight: '700',
    color: figma.roleAccent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.badgeTint,
    borderRadius: figma.radiusScreenCard,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: figma.borderSoft,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: figma.textMuted,
  },
  statValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
    color: figma.textBody,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: figma.radiusScreenCard,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: figma.borderSoft,
    ...figma.shadowSoft,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: figma.textBody,
  },
  menuSub: {
    marginTop: 4,
    fontSize: 13,
    color: figma.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: figma.radiusLargeButton,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: figma.borderSoft,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: figma.textBody,
  },
  version: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#B0B4BC',
  },
  pressed: { opacity: 0.92 },
});
