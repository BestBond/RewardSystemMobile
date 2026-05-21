import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  BackArrowLeft,
  BoxAdd,
  CardStar,
  LockClosed,
} from '../../assets/svgs';
import { listRewards, type RewardDto } from '../../api/rewards';
import { RewardImageBlock } from '../rewards/RewardImageBlock';
import { getMyProfile } from '../../api/users';
import type {
  CartStackParamList,
  MainTabParamList,
} from '../../navigation/types';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { goBackInApp } from '../../navigation/goBackInApp';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AppChip } from '../../components/ui';

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
      const pts = Number(profile.loyaltyPoints ?? 0);
      setBalance(Number.isFinite(pts) ? pts : 0);
      setRewards(list);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useRefreshOnFocusAndForeground(() => {
    setLoading(true);
    load().catch(() => {});
  });

  const recommendedList = useMemo(() => {
    return rewards.slice(0, 5);
  }, [rewards]);

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
          hitSlop={12}
          onPress={() => goBackInApp(navigation)}
          style={styles.backBtn}
        >
          <BackArrowLeft width={24} height={24} />
          <Text style={styles.headerTitle}>Checkout</Text>
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
            pressed && styles.ptsBadgePressed,
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
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable
            style={styles.retry}
            onPress={() => load().catch(() => {})}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 40 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <BoxAdd
                width={80}
                height={80}
                fill={colors.white}
                opacity={0.6}
              />
            </View>
            <Text style={styles.emptyTitle}>Your Cart Is</Text>
            <Text style={styles.emptyTitleLarge}>empty</Text>
          </View>

          <View style={styles.recSection}>
            <Text style={styles.recLabel}>RECOMMENDED FOR YOU</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recList}
            >
              {recommendedList.map(item => {
                const isUnlocked =
                  item.eligible ?? balance >= item.pointsCost;
                const progress = Math.min(balance / item.pointsCost, 1);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      navigation.navigate('RewardCheckout', {
                        rewardId: item.id,
                      })
                    }
                    style={({ pressed }) => [
                      styles.recCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.cardImageContainer}>
                      <RewardImageBlock
                        imageUrl={item.imageUrl}
                        resizeMode="contain"
                      />
                      {!isUnlocked && (
                        <View style={styles.lockOverlay}>
                          <View >
                            <LockClosed
                              width={40}
                              height={52}
                              color={colors.navy}
                            />
                          </View>
                        </View>
                      )}
                    </View>

                    {/* CONTENT */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.title}</Text>

                      <Text style={styles.cardDesc} numberOfLines={3}>
                        {item.description}
                      </Text>

                      {/* PROGRESS */}
                      
                      {!isUnlocked && (
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${progress * 100}%`,
                              },
                            ]}
                          />
                        </View>
                      )}

                      {/* FOOTER */}
                      <View style={styles.cardFooter}>
                        <Text style={styles.requiresText}>
                          Requires {item.pointsCost.toLocaleString()} Pts
                        </Text>

                        {isUnlocked ? (
                          <Pressable
                            style={styles.selectBtn}
                            onPress={() =>
                              navigation.navigate('RewardCheckout', {
                                rewardId: item.id,
                              })
                            }
                          >
                            <Text style={styles.selectText}>Select</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.lockedBtn}>
                            <Text style={styles.lockedBtnText}>Locked</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.exploreBtn,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('Rewards', { screen: 'RewardsHome' })
            }
          >
            <Text style={styles.exploreText}>Explore More</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
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
  ptsBadgePressed: { opacity: 0.9 },
  pointsChip: { paddingVertical: 5, paddingHorizontal: 10 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: 20,
  },
  emptyContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  emptyIconWrap: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
    opacity: 0.6,
    lineHeight: 56,
  },
  emptyTitleLarge: {
    fontSize: 50,
    fontWeight: '900',
    color: colors.white,
    opacity: 0.6,
    lineHeight: 72,
    marginTop: -5,
  },

  recSection: {
    marginTop: 40,
  },

  recLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 18,
    letterSpacing: 1,
  },

  recList: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 10,
  },

  recCard: {
    width: 285,
    backgroundColor: '#F3F4F8',
    borderRadius: 34,
    padding: 0,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  cardImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F6FA',
    position: 'relative',
  },

  lockOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    zIndex: 100,
  },

  lockIcon: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
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

  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 22,
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 999,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  exploreBtn: {
    marginTop: 30,
    marginHorizontal: 24,
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    ...figma.shadowSoft,
  },
  exploreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  pressed: {
    opacity: 0.8,
  },
  errText: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 20,
  },
  retry: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: colors.primaryOrange,
    fontWeight: '700',
  },
});
