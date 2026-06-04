import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
  RadialGradient,
  Circle,
} from 'react-native-svg';
import {
  BackArrowLeft,
  CardStar,
  IconGiftOrange,
  TrendArrowUp,
} from '../../assets/svgs';
import {
  getMyGiftTier,
  listRewards,
  type GiftTier,
  type RewardDto,
} from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import { RewardImageBlock } from './RewardImageBlock';
import type {
  MainTabParamList,
  RewardsStackParamList,
} from '../../navigation/types';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';
import { formatPtsMoreNeeded } from '../../utils/formatPointsCompact';
import {
  canRedeemGiftTier,
  CONTRACTOR_TIER_THRESHOLD,
} from '../../utils/giftTierRedeem';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { goBackInApp } from '../../navigation/goBackInApp';
import { AppCard, AppChip } from '../../components/ui';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RewardsStackParamList, 'RewardsHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type TierFilterId = 'all' | GiftTier;

const CONTRACTOR_THRESHOLD = 120_000;

function giftTierLabel(tier: GiftTier): string {
  return tier === 'CONTRACTOR' ? 'Contractor' : 'Worker';
}

function lockHint(
  reward: RewardDto,
  balance: number,
  userTier: GiftTier,
): string | null {
  if (
    reward.giftTier &&
    !canRedeemGiftTier(userTier, reward.giftTier)
  ) {
    return `Contractor tier required (${CONTRACTOR_TIER_THRESHOLD.toLocaleString()}+ pts)`;
  }
  if (balance < reward.pointsCost) {
    return 'Not enough points yet';
  }
  return null;
}

export function RewardsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<TierFilterId>('all');
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [_rewardsError, setRewardsError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [allRewards, setAllRewards] = useState<RewardDto[]>([]);
  const [giftTier, setGiftTier] = useState<GiftTier>('WORKER');
  const [contractorThreshold, setContractorThreshold] = useState(
    CONTRACTOR_THRESHOLD,
  );
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRewardsError(null);
    try {
      const profile = await getMyProfile();
      const pts = Number(profile.loyaltyPoints ?? 0);
      setBalance(Number.isFinite(pts) ? pts : 0);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load profile');
      setLoading(false);
      return;
    }

    try {
      const [rewards, tierInfo] = await Promise.all([
        listRewards(),
        getMyGiftTier(),
      ]);
      setGiftTier(tierInfo.giftTier);
      setContractorThreshold(
        tierInfo.contractorThreshold ?? CONTRACTOR_THRESHOLD,
      );
      setAllRewards(rewards);
    } catch (e) {
      setRewardsError((e as Error)?.message ?? 'Could not load rewards');
      setAllRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useRefreshOnFocusAndForeground(() => {
    setLoading(true);
    load().catch(() => {});
  });

  const visibleRewards = useMemo(() => {
    if (filter === 'all') return allRewards;
    return allRewards.filter(r => r.giftTier === filter);
  }, [allRewards, filter]);

  useEffect(() => {
    if (
      selectedRewardId &&
      !visibleRewards.some(r => r.id === selectedRewardId)
    ) {
      setSelectedRewardId(null);
    }
  }, [selectedRewardId, visibleRewards]);

  const pointsToContractor = Math.max(0, contractorThreshold - balance);
  const tierProgress =
    giftTier === 'CONTRACTOR'
      ? 1
      : Math.min(1, balance / contractorThreshold);

  const filterOptions: Array<{ id: TierFilterId; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'WORKER', label: 'Worker' },
    { id: 'CONTRACTOR', label: 'Contractor' },
  ];

  const openRewardDetail = useCallback(
    (rewardId: string) => {
      setSelectedRewardId(rewardId);
      navigation.navigate('Cart', {
        screen: 'RewardCheckout',
        params: { rewardId },
      });
    },
    [navigation],
  );

  const confirmSelectedReward = useCallback(() => {
    const rewardId =
      selectedRewardId ??
      visibleRewards.find(
        r =>
          r.eligible ??
          (balance >= r.pointsCost &&
            (r.giftTier == null || canRedeemGiftTier(giftTier, r.giftTier)) &&
            (r.tierRedeemable ?? true)),
      )?.id ??
      visibleRewards[0]?.id;

    if (rewardId) {
      openRewardDetail(rewardId);
    }
  }, [balance, giftTier, openRewardDetail, selectedRewardId, visibleRewards]);

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

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => goBackInApp(navigation)}
          style={styles.backBtn}
        >
          <BackArrowLeft width={24} height={24} />
          <Text style={styles.headerTitle}>Rewards</Text>
        </Pressable>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="View transaction history"
          onPress={() =>
            navigation.navigate('Profile', { screen: 'TransactionHistory' })
          }
          style={({ pressed }) => [
            styles.ptsBadge,
            pressed && styles.pressed,
          ]}>
          <CardStar width={16} height={16} />
          <AppChip
            text={`${balance.toLocaleString()} Pts`}
            variant="accent"
            style={styles.pointsChip}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 200 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <AppCard style={styles.balanceCard} variant="elevated">
            <Svg
              style={styles.balanceAccentSvg}
              width={160}
              height={160}
              viewBox="0 0 160 160"
              preserveAspectRatio="xMidYMid slice"
            >
              <Defs>
                <RadialGradient
                  id="accentGradR"
                  cx="1.75"
                  cy="1.25"
                  rx="0.6"
                  ry="0.6"
                >
                  <Stop
                    offset="0"
                    stopColor={colors.scanLine}
                    stopOpacity="1"
                  />
                  <Stop
                    offset="1"
                    stopColor={colors.scanLine}
                    stopOpacity="1"
                  />
                </RadialGradient>
              </Defs>
              <Circle cx="120" cy="50" r="80" fill="url(#accentGradR)" />
              <Circle cx="106" cy="34" r="24" fill={colors.scanLine} />
            </Svg>
            <Text style={styles.yourBalance}>YOUR BALANCE</Text>
            <View style={styles.balanceNums}>
              <Text style={styles.balanceBig}>{balance.toLocaleString()}</Text>
              <Text style={styles.balancePtsSuffix}> PTS</Text>
            </View>
            <Text style={styles.balanceCaption}>
              {giftTier === 'CONTRACTOR'
                ? 'You have unlocked Contractor tier gifts. Keep earning to redeem premium rewards.'
                : `You're ${pointsToContractor.toLocaleString()} points away from Contractor tier gifts.`}
            </Text>

            <View style={styles.tierLabelsRow}>
              <Text style={styles.tierLabelSmall}>
                CURRENT TIER:{' '}
                <Text style={styles.tierLabel}>{giftTierLabel(giftTier)}</Text>
              </Text>
              {giftTier === 'WORKER' ? (
                <Text style={styles.tierLabelSmallRight}>
                  NEXT:{' '}
                  <Text
                    style={[styles.tierLabel, { color: colors.primaryOrange }]}
                  >
                    Contractor
                  </Text>
                </Text>
              ) : null}
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${tierProgress * 100}%` },
                ]}
              />
            </View>
            {giftTier === 'WORKER' ? (
              <View style={styles.progressBottom}>
                <Text style={styles.nextPtsText}>
                  {formatPtsMoreNeeded(pointsToContractor)}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.viewHistoryBtn,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                navigation.navigate('Profile', { screen: 'TransactionHistory' })
              }
            >
              <Text style={styles.viewHistoryText}>View History</Text>
              <TrendArrowUp width={16} height={16} />
            </Pressable>
          </AppCard>

          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filterOptions.map(tab => {
                const selected = filter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setFilter(tab.id)}
                    style={[
                      styles.filterChip,
                      selected
                        ? styles.filterChipActive
                        : styles.filterChipInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {visibleRewards.length > 0 ? (
            <Text style={styles.catalogCount}>
              {visibleRewards.length}{' '}
              {visibleRewards.length === 1 ? 'gift' : 'gifts'}
              {filter === 'all'
                ? ''
                : ` · ${filter === 'WORKER' ? 'Worker' : 'Contractor'} tier`}
            </Text>
          ) : null}

          <View style={styles.rewardList}>
            {visibleRewards.length === 0 ? (
              <View style={styles.emptyRewards}>
                <Text style={styles.emptyRewardsText}>
                  No gifts in this category.
                </Text>
              </View>
            ) : (
              visibleRewards.map(item => {
              const isRedeemable =
                item.eligible ??
                (balance >= item.pointsCost &&
                  (item.giftTier == null ||
                    canRedeemGiftTier(giftTier, item.giftTier)) &&
                  (item.tierRedeemable ?? true));
              const progress = Math.min(balance / item.pointsCost, 1);
              const hint = lockHint(item, balance, giftTier);

              const isSelected = selectedRewardId === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.rewardCard,
                    isSelected && styles.rewardCardSelected,
                  ]}
                >
                  <Pressable
                    onPress={() =>
                      setSelectedRewardId(prev =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    style={({ pressed }) => [
                      styles.rewardCardPressable,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.title}, ${item.pointsCost.toLocaleString()} points`}
                  >
                    <View style={styles.cardImageContainer}>
                      <RewardImageBlock
                        key={`img-${item.id}`}
                        imageUrl={item.imageUrl}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDesc} numberOfLines={3}>
                        {item.description ||
                          'Professional grade tool for your construction needs.'}
                      </Text>

                      {!isRedeemable && item.tierRedeemable !== false ? (
                        <View style={styles.cardProgressTrack}>
                          <View
                            style={[
                              styles.cardProgressFill,
                              { width: `${progress * 100}%` },
                            ]}
                          />
                        </View>
                      ) : null}

                      {hint ? (
                        <Text style={styles.lockHintText}>{hint}</Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <Text style={styles.requiresText}>
                          Requires {item.pointsCost.toLocaleString()} Pts
                        </Text>

                        {isRedeemable ? (
                          <View
                            style={
                              isSelected
                                ? styles.selectedBtn
                                : styles.selectBtn
                            }
                          >
                            <Text
                              style={
                                isSelected
                                  ? styles.selectedText
                                  : styles.selectText
                              }>
                              {isSelected ? 'Selected' : 'Select'}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.lockedBtn}>
                            <Text style={styles.lockedBtnText}>Locked</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })
            )}
          </View>
        </ScrollView>
      )}

      <View
        style={[styles.stickyFooter, { paddingBottom: insets.bottom + 10 }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.pressed,
          ]}
          onPress={confirmSelectedReward}
        >
          <Text style={styles.confirmText}>Confirm Reward</Text>
          <IconGiftOrange width={20} height={20} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    ...figma.shadowSoft,
  },
  pointsChip: { paddingVertical: 5, paddingHorizontal: 10 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: 20,
  },
  balanceCard: {
    marginHorizontal: 10,
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
  yourBalance: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.labelGray,
  },
  balanceNums: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  balanceBig: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.navyAlt,
  },
  balancePtsSuffix: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.mutedGray,
    marginLeft: 4,
  },
  balanceCaption: {
    fontSize: 18,
    color: colors.mutedGray,
    lineHeight: 25,
    marginTop: 20,
    fontWeight: '300',
  },
  tierLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  tierLabelSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedGray,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  tierLabelSmallRight: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedGray,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.progressTrack,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.splashOrange,
    borderRadius: 4,
  },
  progressBottom: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  nextPtsText: {
    fontSize: 12,
    color: colors.mutedGray,
    fontWeight: '500',
  },
  viewHistoryBtn: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 34,
    paddingVertical: 10,
    paddingBottom: 11,
    borderRadius: 30,
    width: '100%',
  },
  viewHistoryText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryOrange,
  },
  filterContainer: {
    marginTop: 30,
  },
  filterRow: {
    paddingHorizontal: 10,
    gap: 8,
    paddingBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 30,
    backgroundColor: colors.white,
    ...figma.shadowSoft,
  },
  filterChipActive: {
    backgroundColor: colors.navyAlt,
  },
  filterChipInactive: {
    backgroundColor: colors.white,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  catalogCount: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyAlt,
    opacity: 0.75,
  },
  rewardList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  emptyRewards: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyRewardsText: {
    color: colors.navyAlt,
    fontSize: 15,
    fontWeight: '600',
  },
  rewardCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: 34,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  rewardCardSelected: {
    borderColor: colors.primaryOrange,
  },
  rewardCardPressable: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F5F6FA',
  },

  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 22,
  },
  cardProgressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 22,
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 999,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  lockHintText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryOrange,
    fontWeight: '600',
    marginBottom: 8,
  },
  requiresText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
    fontWeight: '600',
    marginRight: 12,
  },

  lockedBtn: {
    backgroundColor: '#DDE1E8',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 104,
    alignItems: 'center',
  },

  lockedBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },

  selectBtn: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 104,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },

  selectText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '800',
  },

  selectedBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 104,
    alignItems: 'center',
  },

  selectedText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '800',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  confirmBtn: {
    backgroundColor: colors.primaryOrange,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...figma.shadowCta,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
