import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinear, Rect, Stop } from 'react-native-svg';
import {
  BackArrowLeft,
  BestBondMan,
  ChevronRight,
  IconGiftOrange,
  IconHeadsetOrange,
  IconReceiptDocOrange,
  IconTermsAlertOrange,
  LogOutDoor,
  UserAvatar,
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
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { loyaltyTierFromPoints } from '../../utils/loyaltyTier';

const APP_VERSION = packageJson.version;

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'UserProfile'>;

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

  useRefreshOnFocusAndForeground(() => {
    setLoading(true);
    load().catch(() => { });
  });

  const tierInfo = useMemo(() => {
    return loyaltyTierFromPoints(profile?.loyaltyPoints ?? 0);
  }, [profile?.loyaltyPoints]);

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(249,133,53,1)" stopOpacity="1" />
            <Stop offset="1" stopColor="rgb(255, 248, 241)" stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackArrowLeft width={24} height={24} />
        </Pressable>
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 40 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>

          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <UserAvatar width={90} height={90} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{profile?.fullName?.trim() || ''}</Text>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => navigateToProfileEdit()}
                  hitSlop={8}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.tierSection}>
              <View style={styles.tierLabels}>
                <Text style={styles.tierLabelSmall}>CURRENT TIER: <Text style={styles.tierLabelBold}>Worker</Text></Text>
                <Text style={styles.tierLabelSmall}>NEXT: <Text style={styles.tierLabelOrange}>Contractor</Text></Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${3 / 5 * 100}%` }]} />
              </View>
              <Text style={styles.nextPtsText}>1,20,000 pts</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>LOYALTY POINTS</Text>
              <Text style={styles.statValue}>
                {(profile?.loyaltyPoints ?? 5000).toLocaleString()}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MEMBER SINCE</Text>
              <Text style={styles.statValue}>
                {profile?.memberSinceYear ?? '2021'}
              </Text>
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => navigation.navigate('GiftDeliveryStatus')}>
              <View style={styles.menuIconWrap}>
                <IconGiftOrange width={22} height={22} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Gift Delivery Status</Text>
                <Text style={styles.menuSub}>{MENU_SUBTITLES.gift}</Text>
              </View>
              <ChevronRight width={20} height={20} color="#1A1C1E" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TransactionHistory')}>
              <View style={styles.menuIconWrap}>
                <IconReceiptDocOrange width={22} height={22} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Transaction History</Text>
                <Text style={styles.menuSub}>{MENU_SUBTITLES.tx}</Text>
              </View>
              <ChevronRight width={20} height={20} color="#1A1C1E" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => navigation.navigate('CustomerSupport')}>
              <View style={styles.menuIconWrap}>
                <IconHeadsetOrange width={22} height={22} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Help / Contact Support</Text>
                <Text style={styles.menuSub}>{MENU_SUBTITLES.help}</Text>
              </View>
              <ChevronRight width={20} height={20} color="#1A1C1E" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => navigation.navigate('TermsPrivacyHub')}>
              <View style={styles.menuIconWrap}>
                <IconTermsAlertOrange width={22} height={22} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Terms & Privacy Policies</Text>
                <Text style={styles.menuSub}>{MENU_SUBTITLES.legal}</Text>
              </View>
              <ChevronRight width={20} height={20} color="#1A1C1E" />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            onPress={async () => {
              await clearAuthSession();
              resetToLogin();
            }}>
            <LogOutDoor width={20} height={20} color="#1A1C1E" />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.version}>APP VERSION {APP_VERSION}</Text>
            <Text style={styles.developer}>
              Developed by <Text style={styles.developerAccent}>Nuvate</Text>
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 48,
    padding: 24,
    marginBottom: 20,
    ...figma.shadowSoft,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1C1E',
    lineHeight: 38,
    flex: 1,
    marginRight: 10,
  },
  editBtn: {
    paddingTop: 4,
  },
  editText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryOrange,
  },
  tierSection: {
    marginTop: 24,
  },
  tierLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tierLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.labelGray,
  },
  tierLabelBold: {
    color: '#1A1C1E',
    fontWeight: '800',
  },
  tierLabelOrange: {
    color: colors.primaryOrange,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryOrange,
    borderRadius: 4,
  },
  nextPtsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.labelGray,
    textAlign: 'right',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EFF2F7',
    borderRadius: 36,
    padding: 20,
    paddingVertical: 24,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.labelGray,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A1C1E',
    marginTop: 12,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 40,
    padding: 16,
    paddingVertical: 18,
    ...figma.shadowSoft,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  menuSub: {
    fontSize: 13,
    color: colors.mutedGray,
    marginTop: 2,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 30,
    paddingVertical: 16,
    gap: 10,
    ...figma.shadowSoft,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  footerRow: {
    alignItems: 'center',
    gap: 8,
  },
  version: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B0B4BC',
    letterSpacing: 0.8,
  },
  developer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  developerAccent: {
    color: colors.primaryOrange,
  },
  pressed: { opacity: 0.8 },
});
