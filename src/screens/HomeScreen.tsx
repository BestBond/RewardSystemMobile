import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CartInactive,
  RewardsActive,
  RewardsInactive,
  ScannerWhite,
} from '../assets/svgs';
import { AppCard, AppChip } from '../components/ui';
import { getAuthMe, getMyProfile } from '../api/users';
import { redirectStaffToAdminShellIfNeeded } from '../auth/staffShellRedirect';
import { getMyTransactions } from '../api/transactions';
import type { MainTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { loyaltyTierFromPoints } from '../utils/loyaltyTier';
import {
  activityIconFromType,
  activitySubtitle,
  formatPointsDelta,
} from '../utils/activityFormat';

type HomeTabNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

type ActivityIconName = 'cart' | 'rewardsEarn' | 'rewardsRedeem';

function ActivityRowIcon({ name }: { name: ActivityIconName }) {
  const w = 22;
  const h = 22;
  switch (name) {
    case 'cart':
      return <CartInactive width={w} height={h} />;
    case 'rewardsEarn':
      return <RewardsInactive width={w} height={h} />;
    case 'rewardsRedeem':
      return <RewardsActive width={w} height={h} />;
  }
}

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function displayName(fullName: string | null): string {
  const t = fullName?.trim();
  if (t) return t.split(/\s+/)[0] ?? t;
  return 'Member';
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeTabNav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [userLabel, setUserLabel] = useState('Member');
  const [tierLabel, setTierLabel] = useState('Bronze Member Tier');
  const [tierProgress, setTierProgress] = useState(0);
  const [ptsToNext, setPtsToNext] = useState(0);
  const [activities, setActivities] = useState<
    {
      id: string;
      title: string;
      sub: string;
      points: string;
      positive: boolean;
      icon: ActivityIconName;
    }[]
  >([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [profile, tx, me] = await Promise.all([
        getMyProfile(),
        getMyTransactions({ period: 'ALL', limit: 5 }),
        getAuthMe()
          .then(r => r.user)
          .catch(() => null),
      ]);
      if (redirectStaffToAdminShellIfNeeded(profile, me)) return;
      const pts = profile.loyaltyPoints ?? 0;
      setBalance(pts);
      setUserLabel(displayName(profile.fullName));
      const tier = loyaltyTierFromPoints(pts);
      setTierLabel(tier.tierLabel);
      setTierProgress(tier.progress);
      setPtsToNext(tier.pointsToNextReward);

      setActivities(
        tx.transactions.map(t => {
          const { text, positive } = formatPointsDelta(t.pointsDelta);
          return {
            id: t.id,
            title: t.title,
            sub: activitySubtitle(t.site, t.createdAt),
            points: text,
            positive,
            icon: activityIconFromType(t.type, t.pointsDelta),
          };
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load home. Pull to retry.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false).catch(() => {});
    }, [load]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primaryOrange}
          />
        }>
        {loading && !refreshing ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color={colors.primaryOrange} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : null}

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greetingLabel()}</Text>
            <Text style={styles.userName}>{userLabel}</Text>
          </View>
          <View style={styles.ptsBadge}>
            <RewardsActive width={20} height={20} />
            <AppChip
              text={`${balance.toLocaleString()} Pts`}
              variant="accent"
              style={styles.pointsChip}
            />
          </View>
        </View>

        <AppCard style={styles.balanceCard} variant="elevated">
          <Text style={styles.cardLabel}>CURRENT BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceNum}>{balance.toLocaleString()}</Text>
            <Text style={styles.balancePts}>PTS</Text>
          </View>
          <View style={styles.tierRow}>
            <Text style={styles.tierLeft}>{tierLabel}</Text>
            <Text style={styles.tierRight}>
              {ptsToNext.toLocaleString()} pts to next reward
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${tierProgress * 100}%` }]}
            />
          </View>
        </AppCard>

        <Pressable
          style={({ pressed }) => [styles.scanCta, pressed && styles.scanCtaPressed]}
          onPress={() => navigation.navigate('Scan')}>
          <ScannerWhite width={24} height={24} />
          <Text style={styles.scanCtaText}>Scan Coupon</Text>
        </Pressable>

        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <Pressable
            hitSlop={12}
            onPress={() =>
              navigation.navigate('Rewards', { screen: 'RewardsHome' })
            }>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={styles.bannerError}>{error}</Text>
        ) : null}

        {activities.length === 0 && !loading && !error ? (
          <Text style={styles.emptyActivity}>
            No activity yet. Scan a coupon to earn points.
          </Text>
        ) : null}

        {activities.map(item => (
          <AppCard key={item.id} style={styles.activityCard} compact variant="elevated">
            <View style={styles.activityIcon}>
              <ActivityRowIcon name={item.icon} />
            </View>
            <View style={styles.activityBody}>
              <Text style={styles.activityItemTitle}>{item.title}</Text>
              <Text style={styles.activitySub}>{item.sub}</Text>
            </View>
            <Text
              style={[
                styles.activityPts,
                item.positive ? styles.ptsPos : styles.ptsNeg,
              ]}>
              {item.points}
            </Text>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: figma.consumerHomeBg,
  },
  scroll: {
    paddingHorizontal: figma.spaceGutter,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedGray,
  },
  bannerError: {
    fontSize: 13,
    color: '#D14343',
    marginBottom: 12,
  },
  emptyActivity: {
    fontSize: 14,
    color: colors.mutedGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  greeting: {
    fontSize: 15,
    color: colors.subtitleGray,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navyAlt,
    marginTop: 4,
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsChip: { paddingVertical: 5, paddingHorizontal: 10 },
  balanceCard: {
    marginTop: 20,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.labelGray,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  balanceNum: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  balancePts: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.lightGray,
    marginLeft: 8,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  tierLeft: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyAlt,
    flex: 1,
    marginRight: 8,
  },
  tierRight: {
    fontSize: 12,
    color: colors.mutedGray,
    maxWidth: '48%',
    textAlign: 'right',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryOrange,
    borderRadius: 4,
  },
  scanCta: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primaryOrange,
    paddingVertical: 16,
    borderRadius: figma.radiusLargeButton,
    ...figma.shadowCta,
  },
  scanCtaPressed: { opacity: 0.94 },
  scanCtaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  viewAll: {
    fontSize: 14,
    color: colors.mutedGray,
    fontWeight: '500',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityBody: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  activitySub: {
    fontSize: 12,
    color: colors.mutedGray,
    marginTop: 4,
  },
  activityPts: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  ptsPos: { color: colors.pointsGreen },
  ptsNeg: { color: colors.pointsDebit },
});
