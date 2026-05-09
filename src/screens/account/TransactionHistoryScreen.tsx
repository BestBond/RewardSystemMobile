import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
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
  ChevronDownSmall,
  IconGiftOrange,
  TxTicketOrange,
} from '../../assets/svgs';
import { getMyProfile } from '../../api/users';
import { getMyTransactions, type PointsTransactionType } from '../../api/transactions';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors as themeColors } from '../../theme/colors';
import { loyaltyTierFromPoints } from '../../utils/loyaltyTier';
import { formatPointsCompact } from '../../utils/formatPointsCompact';
import {
  activityIconFromType,
  activitySubtitle,
  formatPointsDelta,
} from '../../utils/activityFormat';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'TransactionHistory'>;

const bg = '#F5F6F8';
const text = '#1A1C1E';
const muted = '#74777F';
const green = '#16A34A';
const debit = '#EA580C';
const orange = themeColors.primaryOrange;
const earnedBg = '#FFF4E8';
const spentBg = '#EEF3F8';

const PAGE = 20;

function TxRowIcon({
  type,
  delta,
}: {
  type: PointsTransactionType;
  delta: number;
}) {
  const name = activityIconFromType(type, delta);
  if (name === 'rewardsRedeem') {
    return <IconGiftOrange width={22} height={22} />;
  }
  return <TxTicketOrange width={22} height={22} />;
}

export function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [rows, setRows] = useState<
    {
      id: string;
      type: PointsTransactionType;
      pointsDelta: number;
      title: string;
      sub: string;
      pointsMain: string;
      pointsLabel: string;
      positive: boolean;
    }[]
  >([]);

  const mapTx = useCallback(
    (
      list: {
        id: string;
        type: PointsTransactionType;
        title: string;
        site: string | null;
        pointsDelta: number;
        createdAt: string;
      }[],
    ) =>
      list.map(t => {
        const { text: ptsText, positive } = formatPointsDelta(t.pointsDelta);
        const [main, ...rest] = ptsText.split(/\s+/);
        return {
          id: t.id,
          type: t.type,
          pointsDelta: t.pointsDelta,
          title: t.title,
          sub: activitySubtitle(t.site, t.createdAt),
          pointsMain: main ?? ptsText,
          pointsLabel: rest.join(' ') || 'POINTS',
          positive,
        };
      }),
    [],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, tx] = await Promise.all([
        getMyProfile(),
        getMyTransactions({ period, limit: PAGE, offset: 0 }),
      ]);
      setBalance(profile.loyaltyPoints ?? 0);
      setTotalEarned(tx.totalPointsEarned);
      setTotalSpent(tx.totalPointsSpent);
      setHasMore(Boolean(tx.hasMore));
      setRows(mapTx(tx.transactions));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [mapTx, period]);

  useEffect(() => {
    loadInitial().catch(() => {});
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const tx = await getMyTransactions({
        period,
        limit: PAGE,
        offset: rows.length,
      });
      setHasMore(Boolean(tx.hasMore));
      setRows(prev => [...prev, ...mapTx(tx.transactions)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, mapTx, period, rows.length]);

  const tier = loyaltyTierFromPoints(balance);

  const filterLabel = period === 'THIS_MONTH' ? 'This Month' : 'All Time';

  const cyclePeriod = () => {
    setPeriod(p => (p === 'THIS_MONTH' ? 'ALL' : 'THIS_MONTH'));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerSlot}>
          <Pressable
            hitSlop={12}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <BackArrowLeft width={24} height={24} />
          </Pressable>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Transaction History
        </Text>
        <View style={[styles.headerSlot, styles.headerSlotRight]}>
          <Pressable
            hitSlop={12}
            onPress={() => loadInitial()}
            accessibilityRole="button"
            accessibilityLabel="Refresh">
            <Text style={styles.refreshIcon}>{'\u27F3'}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          {error ? <Text style={styles.err}>{error}</Text> : null}

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: earnedBg }]}>
              <Text style={styles.summaryLabel}>TOTAL POINTS EARNED</Text>
              <Text style={styles.summaryValue}>
                {totalEarned.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: spentBg }]}>
              <Text style={styles.summaryLabel}>SPENT</Text>
              <Text style={styles.summaryValue}>
                -{formatPointsCompact(totalSpent)}
              </Text>
            </View>
          </View>

          <View style={styles.tierRow}>
            <Text style={styles.tierName}>{tier.tierLabel}</Text>
            <Text style={styles.tierHint} numberOfLines={1}>
              {tier.pointsToNextReward.toLocaleString()} pts to next reward
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${tier.progress * 100}%` }]}
            />
          </View>

          <View style={styles.filterRow}>
            <Pressable
              style={({ pressed }) => [styles.filterPill, pressed && styles.pressed]}
              onPress={cyclePeriod}>
              <Text style={styles.filterShow}>SHOW: </Text>
              <Text style={styles.filterBold}>{filterLabel}</Text>
              <ChevronDownSmall width={14} height={14} />
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {rows.length === 0 ? (
            <Text style={styles.empty}>No transactions in this period.</Text>
          ) : (
            rows.map(row => (
              <View key={row.id} style={styles.txCard}>
                <View style={styles.txIconWrap}>
                  <TxRowIcon type={row.type} delta={row.pointsDelta} />
                </View>
                <View style={styles.txMid}>
                  <Text style={styles.txTitle}>{row.title}</Text>
                  <Text style={styles.txSub}>{row.sub}</Text>
                </View>
                <View style={styles.txPts}>
                  <Text
                    style={[
                      styles.txPtsMain,
                      { color: row.positive ? green : debit },
                    ]}>
                    {row.pointsMain}
                  </Text>
                  <Text
                    style={[
                      styles.txPtsLabel,
                      { color: row.positive ? green : debit },
                    ]}>
                    {row.pointsLabel}
                  </Text>
                </View>
              </View>
            ))
          )}

          {hasMore ? (
            <Pressable
              style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
              disabled={loadingMore}
              onPress={() => loadMore().catch(() => {})}>
              {loadingMore ? (
                <ActivityIndicator color={orange} />
              ) : (
                <Text style={styles.loadMoreText}>LOAD MORE HISTORY</Text>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const cardShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }
    : { elevation: 2 };

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: {
    color: '#B91C1C',
    marginBottom: 12,
    textAlign: 'center',
  },
  empty: {
    color: muted,
    textAlign: 'center',
    marginVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 48,
  },
  headerSlot: {
    width: 44,
    justifyContent: 'center',
  },
  headerSlotRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: text,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: muted,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
    color: text,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 15,
    fontWeight: '700',
    color: text,
    flex: 1,
    marginRight: 8,
  },
  tierHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    maxWidth: '48%',
    textAlign: 'right',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1A1C1E',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    padding: 10,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  filterShow: {
    fontSize: 13,
    color: muted,
    fontWeight: '500',
  },
  filterBold: {
    fontSize: 13,
    fontWeight: '800',
    color: text,
    marginRight: 4,
  },
  filterIconBtn: { display: 'none' },
  refreshIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: text,
    marginBottom: 12,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    ...cardShadow,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMid: {
    flex: 1,
    paddingRight: 8,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: text,
  },
  txSub: {
    marginTop: 4,
    fontSize: 12,
    color: muted,
  },
  txPts: {
    alignItems: 'flex-end',
  },
  txPtsMain: {
    fontSize: 17,
    fontWeight: '800',
  },
  txPtsLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadMore: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: '#E8EAEF',
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: orange,
  },
  pressed: { opacity: 0.92 },
});
