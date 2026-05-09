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
import {
  BackArrowLeft,
  LockClosed,
  RewardsActive,
  TrendArrowUp,
} from '../../assets/svgs';
import {
  getWorkerRedemptionSlabs,
  listRewards,
  type RewardDto,
} from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import type { MainTabParamList, RewardsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';
import { RewardImageBlock } from './RewardImageBlock';
import { balanceCaption } from './rewardPointsUtils';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RewardsStackParamList, 'RewardsHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type PointFilterId = 'all' | `slab-${number}`;

export function RewardsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<PointFilterId>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [slabs, setSlabs] = useState<number[]>([]);
  const [allRewards, setAllRewards] = useState<RewardDto[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profile, rewards, slabValues] = await Promise.all([
        getMyProfile(),
        listRewards(),
        getWorkerRedemptionSlabs(),
      ]);
      setBalance(profile.loyaltyPoints ?? 0);
      setSlabs(
        [...new Set((slabValues ?? []).filter((x) => Number.isFinite(x) && x > 0))].sort(
          (a, b) => a - b,
        ),
      );
      setAllRewards(rewards);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load rewards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().catch(() => {});
  }, [load]);

  const caption = useMemo(
    () => balanceCaption(balance, allRewards),
    [balance, allRewards],
  );
  const visibleRewards = useMemo(() => {
    if (filter === 'all') return allRewards;
    const pts = Number(filter.replace('slab-', ''));
    if (!Number.isFinite(pts)) return allRewards;
    return allRewards.filter((r) => r.pointsCost === pts);
  }, [allRewards, filter]);
  const filterOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'All' },
      ...slabs.map((s) => ({ id: `slab-${s}` as const, label: `${s.toLocaleString()} Pts` })),
    ],
    [slabs],
  );

  const goCheckout = (rewardId: string) => {
    navigation.navigate('Cart', {
      screen: 'RewardCheckout',
      params: { rewardId },
    });
  };

  return (
    <View
      style={[styles.root, { paddingTop: insets.top, backgroundColor: figma.screenMuted }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {navigation.canGoBack() ? (
            <Pressable
              hitSlop={12}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back">
              <BackArrowLeft width={22} height={22} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <View style={styles.ptsPill}>
            <RewardsActive width={16} height={16} />
            <Text style={styles.ptsPillText}>
              {balance.toLocaleString()} Pts
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryOrange} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => load().catch(() => {})}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceGradient} pointerEvents="none" />
            <Text style={styles.yourBalance}>YOUR BALANCE</Text>
            <View style={styles.balanceNums}>
              <Text style={styles.balanceBig}>
                {balance.toLocaleString()}
              </Text>
              <Text style={styles.balancePtsSuffix}> PTS</Text>
            </View>
            <Text style={styles.balanceCaption}>{caption}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.viewHistoryBtn,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                navigation.navigate('Profile', {
                  screen: 'TransactionHistory',
                })
              }>
              <Text style={styles.viewHistoryText}>View History</Text>
              <TrendArrowUp width={16} height={16} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {filterOptions.map(tab => {
              const selected = filter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  style={[
                    styles.filterChip,
                    selected
                      ? {
                          backgroundColor: colors.navyAlt,
                          borderColor: colors.navyAlt,
                        }
                      : styles.filterChipOutline,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      selected && styles.filterChipTextOnDark,
                    ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {visibleRewards.length === 0 ? (
            <Text style={styles.emptyFilter}>No rewards in this range.</Text>
          ) : (
            visibleRewards.map(reward => {
              const unlocked = balance >= reward.pointsCost;
              const progress = Math.min(
                1,
                balance / Math.max(1, reward.pointsCost),
              );

              return (
                <View
                  key={reward.id}
                  style={[styles.rewardCard, !unlocked && styles.lockedCard]}>
                  {unlocked ? (
                    <>
                      <View style={styles.rewardImageBlock}>
                        <View style={styles.unlockedBadge}>
                          <Text style={styles.unlockedBadgeText}>UNLOCKED</Text>
                        </View>
                        <View style={styles.imgPad}>
                          <RewardImageBlock imageUrl={reward.imageUrl} />
                        </View>
                      </View>
                      <View style={styles.rewardBody}>
                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        <Text style={styles.rewardDesc}>
                          {reward.description ?? ''}
                        </Text>
                        <View style={styles.rewardFooter}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceNum}>
                              {reward.pointsCost.toLocaleString()}
                            </Text>
                            <Text style={styles.pricePts}> PTS</Text>
                          </View>
                          <Pressable
                            style={({ pressed }) => [
                              styles.selectBtn,
                              pressed && styles.pressed,
                            ]}
                            onPress={() => goCheckout(reward.id)}>
                            <Text style={styles.selectBtnText}>Select</Text>
                          </Pressable>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.lockedImageWrap}>
                        <RewardImageBlock imageUrl={reward.imageUrl} />
                        <View style={styles.lockedOverlay} />
                        <View style={styles.lockIconWrap}>
                          <LockClosed width={36} height={36} />
                        </View>
                      </View>
                      <View style={styles.rewardBody}>
                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        <Text style={styles.rewardDesc}>
                          {reward.description ?? ''}
                        </Text>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${progress * 100}%` },
                            ]}
                          />
                        </View>
                        <View style={styles.lockedFooter}>
                          <Text style={styles.requiresPts}>
                            Requires {reward.pointsCost.toLocaleString()} Pts
                          </Text>
                          <View style={styles.lockedPill}>
                            <Text style={styles.lockedPillText}>Locked</Text>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errText: { color: colors.mutedGray, textAlign: 'center' },
  retry: { marginTop: 12 },
  retryText: { color: colors.primaryOrange, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: figma.screenMuted,
  },
  headerSide: {
    width: 88,
    justifyContent: 'center',
  },
  headerSideRight: { alignItems: 'flex-end' },
  headerSpacer: { width: 22 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  ptsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.badgeTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ptsPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderInput,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primaryOrange,
    opacity: 0.07,
    borderTopRightRadius: 120,
  },
  yourBalance: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.labelGray,
  },
  balanceNums: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  balanceBig: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  balancePtsSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.lightGray,
  },
  balanceCaption: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedGray,
  },
  viewHistoryBtn: {
    alignSelf: 'center',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewHistoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryOrange,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 18,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
  },
  filterChipOutline: {
    backgroundColor: colors.white,
    borderColor: colors.borderGray,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyAlt,
  },
  filterChipTextOnDark: {
    color: colors.white,
  },
  rewardCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  lockedCard: {
    marginTop: 0,
  },
  rewardImageBlock: {
    backgroundColor: '#ECECEC',
    padding: 12,
    position: 'relative',
  },
  imgPad: { marginTop: 4 },
  unlockedBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 2,
    backgroundColor: '#FFE8D6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unlockedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryOrange,
    letterSpacing: 0.3,
  },
  rewardBody: {
    padding: 16,
  },
  rewardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  rewardDesc: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedGray,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  pricePts: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  selectBtn: {
    backgroundColor: colors.primaryOrange,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 96,
    alignItems: 'center',
  },
  selectBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  lockedImageWrap: {
    height: 148,
    borderRadius: 16,
    margin: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  lockIconWrap: {
    zIndex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primaryOrange,
  },
  lockedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  requiresPts: {
    fontSize: 13,
    color: colors.mutedGray,
    fontWeight: '500',
  },
  lockedPill: {
    backgroundColor: '#E8EEF6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
  },
  lockedPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyFilter: {
    textAlign: 'center',
    color: colors.mutedGray,
    marginTop: 24,
    fontSize: 15,
  },
  pressed: { opacity: 0.92 },
});
