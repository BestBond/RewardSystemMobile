import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import {
  BackArrowLeft,
  HeaderShoppingBag,
  LockClosed,
  RewardsActive,
} from '../../assets/svgs';
import { listRewards, type RewardDto } from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import type { CartStackParamList, MainTabParamList } from '../../navigation/types';
import { RewardImageBlock } from '../rewards/RewardImageBlock';
import {
  nextRewardCostThreshold,
} from '../rewards/rewardPointsUtils';
import { colors } from '../../theme/colors';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const screenBg = '#F2F2F7';
const navy = '#1A2B48';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'CartHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function CartHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<RewardDto[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profile, list] = await Promise.all([
        getMyProfile(),
        listRewards(),
      ]);
      setBalance(profile.loyaltyPoints ?? 0);
      setRewards(list);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load');
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

  const recommended = useMemo(() => {
    const sorted = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
    return sorted[0] ?? null;
  }, [rewards]);

  const nextTarget = useMemo(
    () => nextRewardCostThreshold(rewards, balance),
    [rewards, balance],
  );

  const progress = useMemo(() => {
    if (!nextTarget || nextTarget <= 0) return 1;
    return Math.min(1, balance / nextTarget);
  }, [balance, nextTarget]);

  const unlocked = recommended && balance >= recommended.pointsCost;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: screenBg }]}>
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
        <Text style={styles.headerTitle}>Cart</Text>
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
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIconWrap}>
              <HeaderShoppingBag width={72} height={72} opacity={0.35} />
            </View>
            <Text style={styles.emptyTitle}>Your Cart Is empty</Text>
          </View>

          {recommended ? (
            <>
              <Text style={styles.recLabel}>RECOMMENDED FOR YOU</Text>
              <View style={styles.rewardCard}>
                <View style={styles.rewardImageBlock}>
                  {!unlocked ? (
                    <View style={styles.lockedImageWrap}>
                      <RewardImageBlock imageUrl={recommended.imageUrl} />
                      <View style={styles.lockedOverlay} />
                      <View style={styles.lockIconWrap}>
                        <LockClosed width={36} height={36} />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.padImg}>
                      <View style={styles.unlockedBadge}>
                        <Text style={styles.unlockedBadgeText}>UNLOCKED</Text>
                      </View>
                      <RewardImageBlock imageUrl={recommended.imageUrl} />
                    </View>
                  )}
                </View>
                <View style={styles.rewardBody}>
                  <Text style={styles.rewardTitle}>{recommended.title}</Text>
                  <Text style={styles.rewardDesc}>
                    {recommended.description ?? ''}
                  </Text>
                  {unlocked ? (
                    <View style={styles.rewardFooter}>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceNum}>
                          {recommended.pointsCost.toLocaleString()}
                        </Text>
                        <Text style={styles.pricePts}> PTS</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.selectBtn,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          navigation.navigate('RewardCheckout', {
                            rewardId: recommended.id,
                          })
                        }>
                        <Text style={styles.selectBtnText}>Select</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.requiresPts}>
                        Requires {recommended.pointsCost.toLocaleString()} Pts
                      </Text>
                      <View style={styles.lockedFooter}>
                        <View style={styles.lockedPill}>
                          <Text style={styles.lockedPillText}>Locked</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {!unlocked && nextTarget ? (
                <View style={styles.nextRow}>
                  <Text style={styles.nextLeft}>Next reward</Text>
                  <Text style={styles.nextRight}>
                    {balance.toLocaleString()} pts
                  </Text>
                </View>
              ) : null}
              {!unlocked && nextTarget ? (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.exploreBtn,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('Rewards', { screen: 'RewardsHome' })
            }>
            <Text style={styles.exploreText}>Explore More</Text>
          </Pressable>
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
    backgroundColor: screenBg,
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
    color: navy,
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
    color: navy,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIconWrap: { opacity: 0.45 },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  recLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: colors.labelGray,
    marginBottom: 10,
  },
  rewardCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  rewardImageBlock: { backgroundColor: '#ECECEC' },
  padImg: { padding: 12, position: 'relative' },
  unlockedBadge: {
    position: 'absolute',
    top: 22,
    left: 22,
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
  lockedImageWrap: {
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  lockIconWrap: {
    position: 'absolute',
    zIndex: 1,
  },
  rewardBody: { padding: 16 },
  rewardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: navy,
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
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceNum: {
    fontSize: 20,
    fontWeight: '800',
    color: navy,
  },
  pricePts: {
    fontSize: 14,
    fontWeight: '700',
    color: navy,
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
  requiresPts: {
    marginTop: 12,
    fontSize: 13,
    color: colors.mutedGray,
    fontWeight: '500',
  },
  lockedFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
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
  nextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  nextLeft: { fontSize: 13, fontWeight: '600', color: navy },
  nextRight: { fontSize: 13, fontWeight: '600', color: colors.mutedGray },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primaryOrange,
  },
  exploreBtn: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  exploreText: {
    fontSize: 16,
    fontWeight: '700',
    color: navy,
  },
  pressed: { opacity: 0.92 },
});
