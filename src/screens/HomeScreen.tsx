import { useNavigation } from '@react-navigation/native';
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
import Svg, { Defs, LinearGradient as SvgLinear, Rect, Stop, RadialGradient, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CardStar,
  CartInactive,
  RewardsActive,
  RewardsInactive,
  ScannerWhite,
} from '../assets/svgs';
import { AppCard, AppChip } from '../components/ui';
import { WalletExpiryNotice } from '../components/WalletExpiryNotice';
import { getAuthMe, getMyProfile } from '../api/users';
import { redirectStaffToAdminShellIfNeeded } from '../auth/staffShellRedirect';
import { getMyTransactions } from '../api/transactions';
import {
  getMyGiftTier,
  listRewards,
  type GiftTier,
  type RewardDto,
} from '../api/rewards';
import type { MainTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { formatPtsMoreNeeded } from '../utils/formatPointsCompact';
import { RewardImageBlock } from './rewards/RewardImageBlock';
import {
  activityIconFromType,
  activitySubtitle,
  formatPointsDelta,
} from '../utils/activityFormat';
import { useRefreshOnFocusAndForeground } from '../hooks/useRefreshOnFocusAndForeground';
import GreaterThanIcon from '../assets/svgs/GreaterThanIcon';

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

const CONTRACTOR_THRESHOLD = 120_000;

function giftTierLabel(tier: GiftTier): string {
  return tier === 'CONTRACTOR' ? 'Contractor' : 'Worker';
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
  const [pointsExpireInDays, setPointsExpireInDays] = useState<number | null>(
    null,
  );
  const [userLabel, setUserLabel] = useState('Member');
  const [giftTier, setGiftTier] = useState<GiftTier>('WORKER');
  const [contractorThreshold, setContractorThreshold] =
    useState(CONTRACTOR_THRESHOLD);
  const [tierProgress, setTierProgress] = useState(0);
  const [ptsToNext, setPtsToNext] = useState(0);
  const [recommendedRewards, setRecommendedRewards] = useState<RewardDto[]>(
    [],
  );
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
      const [profile, tx, me, tierInfo, rewards] = await Promise.all([
        getMyProfile(),
        getMyTransactions({ period: 'ALL', limit: 5 }),
        getAuthMe()
          .then(r => r.user)
          .catch(() => null),
        getMyGiftTier().catch(() => null),
        listRewards().catch(() => [] as RewardDto[]),
      ]);
      if (redirectStaffToAdminShellIfNeeded(profile, me)) return;
      const pts = profile.loyaltyPoints ?? 0;
      setBalance(pts);
      setPointsExpireInDays(profile.pointsExpireInDays ?? null);
      setUserLabel(displayName(profile.fullName));

      const tier = tierInfo?.giftTier ?? 'WORKER';
      const threshold =
        tierInfo?.contractorThreshold ?? CONTRACTOR_THRESHOLD;
      setContractorThreshold(threshold);
      setGiftTier(tier);
      if (tier === 'CONTRACTOR') {
        setTierProgress(100);
        setPtsToNext(0);
      } else {
        const toContractor = Math.max(0, threshold - pts);
        setPtsToNext(toContractor);
        setTierProgress(Math.min(100, (pts / threshold) * 100));
      }

      const sorted = [...rewards].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.pointsCost - b.pointsCost,
      );
      setRecommendedRewards(sorted.slice(0, 3));

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

  useRefreshOnFocusAndForeground(() => load(false));

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
      <View style={styles.headerOverlay} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 12,
            paddingBottom: 100 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primaryOrange}
            progressViewOffset={insets.top}
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
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="View transaction history"
            onPress={() =>
              navigation.navigate('Profile', { screen: 'TransactionHistory' })
            }
            style={({ pressed }) => [
              styles.ptsBadge,
              pressed && styles.scanCtaPressed,
            ]}>
            <CardStar width={16} height={16} />
            <AppChip
              text={`${balance.toLocaleString()} Pts`}
              variant="accent"
              style={styles.pointsChip}
            />
          </Pressable>
        </View>

        <AppCard style={styles.balanceCard} variant="elevated">
            <Svg style={styles.balanceAccentSvg} width={160} height={160} viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice">
              <Defs>
                <RadialGradient id="accentGradR" cx="1.75" cy="1.25" rx="0.6" ry="0.6">
                  <Stop offset="0" stopColor={colors.scanLine} stopOpacity="1" />
                  <Stop offset="1" stopColor={colors.scanLine} stopOpacity="1" />
                </RadialGradient>
              </Defs>
              <Circle cx="120" cy="50" r="80" fill="url(#accentGradR)" />
              <Circle cx="106" cy="34" r="24" fill={colors.scanLine} />
            </Svg>
          <Text style={styles.cardLabel}>CURRENT BALANCE</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceNum}>{balance.toLocaleString()}</Text>
              <Text style={styles.balancePts}>PTS</Text>
            </View>
          </View>
          <View style={styles.tierLabelsRow}>
            <Text style={styles.tierLabelSmall}>
              CURRENT TIER:{' '}
              <Text style={styles.tierLabel}>{giftTierLabel(giftTier)}</Text>
            </Text>
            {giftTier === 'WORKER' ? (
              <Text style={styles.tierLabelSmallRight}>
                NEXT:{' '}
                <Text
                  style={[styles.tierLabel, { color: colors.primaryOrange }]}>
                  Contractor
                </Text>
              </Text>
            ) : null}
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${tierProgress}%` }]}
            />
          </View>
          {giftTier === 'WORKER' ? (
            <View style={styles.balanceRight}>
              <Text style={styles.tierRightSmall}>
                {formatPtsMoreNeeded(ptsToNext)}
              </Text>
            </View>
          ) : null}
          <WalletExpiryNotice expireInDays={pointsExpireInDays} />
        </AppCard>

        <Pressable
          style={({ pressed }) => [styles.scanCta, pressed && styles.scanCtaPressed]}
          onPress={() => navigation.navigate('Scan')}>
          <ScannerWhite width={24} height={24} />
          <Text style={styles.scanCtaText}>Scan Coupon</Text>
        </Pressable>

        <View style={styles.recommendedHeader}>
          <Text style={styles.recommendedTitle}>Recommended</Text>
          <Pressable onPress={() => navigation.navigate('Rewards')} hitSlop={8}>
            <Text style={styles.recommendedView}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.recommendedList}>
          {recommendedRewards.length === 0 && !loading ? (
            <Text style={styles.emptyReco}>
              No gifts in catalog yet. Open Rewards to browse.
            </Text>
          ) : null}
          {recommendedRewards.map(item => (
            <Pressable
              key={item.id}
              onPress={() =>
                navigation.navigate('Cart', {
                  screen: 'RewardCheckout',
                  params: { rewardId: item.id },
                })
              }>
              <AppCard style={styles.recoCard} compact>
                <View style={styles.recoLeft}>
                  <RewardImageBlock
                    imageUrl={item.imageUrl}
                    padded={false}
                    style={styles.recoImageFill}
                  />
                </View>
                <View style={styles.recoBody}>
                  <Text style={styles.recoTitle}>{item.title}</Text>
                  <Text style={styles.recoPts}>
                    {item.pointsCost.toLocaleString()} pts
                  </Text>
                </View>
                <View style={styles.recoChevron}>
                  <GreaterThanIcon />
                </View>
              </AppCard>
            </Pressable>
          ))}
        </View>

        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <Pressable
            hitSlop={12}
            onPress={() =>
              navigation.navigate('Profile', { screen: 'TransactionHistory' })
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
    backgroundColor: 'transparent',
    height: '100%',
    position: 'relative',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    zIndex: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: colors.navy,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navyAlt,
    marginTop: 2,
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsChip: { paddingVertical: 5, paddingHorizontal: 10 },
  scroll: {
    paddingHorizontal: figma.spaceGutter,
    backgroundColor: 'transparent',
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
  balanceCard: {
    marginTop: 20,
    padding: 25,
    borderRadius: 48,
    backgroundColor: colors.white,
    ...figma.shadowActionCard,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceAccentSvg: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    zIndex: 0,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.mutedGray,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  balanceNum: {
    fontSize: figma.typeScale.displayLg,
    fontWeight: '900',
    color: colors.navyAlt,
  },
  balancePts: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.mutedGray,
    marginLeft: 6,
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
  tierLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  tierLabelSmall: { fontSize: 12, fontWeight: '500', color: colors.mutedGray },
  tierLabel: { fontSize: 13, fontWeight: '600', color: colors.navyAlt },
  tierLabelSmallRight: { fontSize: 12, fontWeight: '500', color: colors.mutedGray },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.progressTrack,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.splashOrange,
    borderRadius: 4,
  },
  scanCta: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.splashOrange,
    paddingVertical: 12,
    borderRadius: figma.radiusLargeButton,
    paddingHorizontal: 40,
    alignSelf: 'stretch',
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
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    flex: 1,
  },
  balanceRight: { alignItems: 'flex-end' },
  tierRightSmall: { fontSize: 12, color: colors.mutedGray, marginTop: 4 },
  recommendedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  recommendedTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  recommendedView: { fontSize: 13, color: colors.navy, fontWeight: '500' },
  recommendedList: { marginBottom: 6 },
  emptyReco: {
    fontSize: 14,
    color: colors.navy,
    opacity: 0.7,
    marginBottom: 12,
  },
  recoCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12, borderRadius: 28, backgroundColor: colors.white, ...figma.shadowSoft },
  recoLeft: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 5,
    overflow: 'hidden',
  },
  recoImageFill: { width: '100%', height: '100%' },
  recoBody: { flex: 1 },
  recoTitle: { fontSize: 16, fontWeight: '800', color: colors.navyAlt },
  recoPts: { fontSize: 14, color: colors.primaryOrange, marginTop: 3 , fontWeight:'600' },
  recoChevron: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.scanLine, alignItems: 'center', justifyContent: 'center' },
  recoChevronText: { color: colors.borderGray, fontSize: 16, fontWeight: '800' },
})
