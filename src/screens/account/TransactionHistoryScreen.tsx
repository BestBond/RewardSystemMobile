import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
  ChevronDownSmall,
  IconGiftOrange,
  TxTicketOrange,
} from '../../assets/svgs';
import { getMyProfile } from '../../api/users';
import {
  getMyTransactions,
  type PointsTransactionType,
} from '../../api/transactions';
import { getMyGiftTier, type GiftTier } from '../../api/rewards';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors as themeColors } from '../../theme/colors';
import {
  activityIconFromType,
  activitySubtitle,
  formatPointsDelta,
} from '../../utils/activityFormat';
import { formatPointsCompact } from '../../utils/formatPointsCompact';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';

type Nav = NativeStackNavigationProp<
  ProfileStackParamList,
  'TransactionHistory'
>;

const text = '#1A1C1E';
const muted = '#74777F';
const green = '#16A34A';
const debit = '#EA580C';
const orange = themeColors.primaryOrange;
const earnedBg = '#FFF5ED';
const spentBg = '#EEF3F7';

const PAGE = 20;
const CONTRACTOR_THRESHOLD = 120_000;

function giftTierLabel(tier: GiftTier): string {
  return tier === 'CONTRACTOR' ? 'Contractor' : 'Worker';
}

const PERIOD_OPTIONS = [
  { id: 'THIS_MONTH' as const, label: 'This Month' },
  { id: 'ALL' as const, label: 'All Time' },
];

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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterAnchorRef = useRef<View>(null);
  const [filterMenuLayout, setFilterMenuLayout] = useState({
    x: 17,
    y: 0,
    width: 0,
    height: 55,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [giftTier, setGiftTier] = useState<GiftTier>('WORKER');
  const [contractorThreshold, setContractorThreshold] =
    useState(CONTRACTOR_THRESHOLD);
  const [tierProgress, setTierProgress] = useState(0);
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
      const [profile, tierInfo, tx] = await Promise.all([
        getMyProfile(),
        getMyGiftTier().catch(() => null),
        getMyTransactions({ period, limit: PAGE, offset: 0 }),
      ]);
      const pts = Number(profile.loyaltyPoints ?? 0);
      setBalance(Number.isFinite(pts) ? pts : 0);
      const threshold =
        tierInfo?.contractorThreshold ?? CONTRACTOR_THRESHOLD;
      const tier = tierInfo?.giftTier ?? 'WORKER';
      setContractorThreshold(threshold);
      setGiftTier(tier);
      if (tier === 'CONTRACTOR') {
        setTierProgress(100);
      } else {
        setTierProgress(Math.min(100, (pts / threshold) * 100));
      }
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

  useRefreshOnFocusAndForeground(() => {
    loadInitial().catch(() => {});
  });

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

  const ptsToContractor = Math.max(0, contractorThreshold - balance);

  const filterLabel =
    PERIOD_OPTIONS.find(o => o.id === period)?.label ?? 'This Month';

  const selectPeriod = (next: 'THIS_MONTH' | 'ALL') => {
    setPeriod(next);
    setFilterMenuOpen(false);
  };

  const openFilterMenu = () => {
    filterAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setFilterMenuLayout({ x, y, width, height });
      setFilterMenuOpen(true);
    });
  };

  const toggleFilterMenu = () => {
    if (filterMenuOpen) {
      setFilterMenuOpen(false);
      return;
    }
    openFilterMenu();
  };

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="txBgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(249,133,53,1)" stopOpacity="1" />
            <Stop offset="1" stopColor="rgb(255, 248, 241)" stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#txBgGrad)" />
      </Svg>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
        >
          <BackArrowLeft width={22} height={22} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Transaction History
        </Text>
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
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.err}>{error}</Text> : null}

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: earnedBg }]}>
              <Text style={styles.summaryLabel}>TOTAL POINTS EARNED</Text>
              <Text style={styles.summaryValue}>
                {totalEarned.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardRight]}>
              <Text style={[styles.summaryLabel, styles.summaryLabelRight]}>
                TOTAL POINTS SPENT
              </Text>
              <Text style={styles.summaryValue}>
                {totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${tierProgress}%` }]}
            />
          </View>
          <View style={styles.tierRow}>
            <Text style={styles.tierName}>
              {giftTierLabel(giftTier)} Tier
            </Text>
            {giftTier === 'WORKER' ? (
              <Text style={styles.tierHint}>
                Contractor{'\n'}
                {ptsToContractor > 0
                  ? `${ptsToContractor.toLocaleString()} pts to ${formatPointsCompact(contractorThreshold)}`
                  : `${formatPointsCompact(contractorThreshold)} pts`}
              </Text>
            ) : null}
          </View>


          <View style={styles.filterRow} ref={filterAnchorRef} collapsable={false}>
            <Pressable
              style={({ pressed }) => [
                styles.filterPill,
                pressed && styles.pressed,
              ]}
              onPress={toggleFilterMenu}
              accessibilityRole="button"
              accessibilityLabel={`Filter period, ${filterLabel}`}
              accessibilityState={{ expanded: filterMenuOpen }}
            >
              <View style={styles.filterPillLeft}>
                <Text style={styles.filterShow}>SHOW: </Text>
                <Text style={styles.filterBold}>{filterLabel}</Text>
              </View>
              <View
                style={[
                  styles.filterChevron,
                  filterMenuOpen && styles.filterChevronOpen,
                ]}>
                <ChevronDownSmall width={14} height={14} />
              </View>
            </Pressable>
          </View>

          <Modal
            visible={filterMenuOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setFilterMenuOpen(false)}>
            <Pressable
              style={styles.filterModalOverlay}
              onPress={() => setFilterMenuOpen(false)}
              accessibilityLabel="Close filter menu"
            />
            <View
              pointerEvents="box-none"
              style={[
                styles.filterMenuHost,
                {
                  top: filterMenuLayout.y + filterMenuLayout.height,
                  left: filterMenuLayout.x,
                  width: filterMenuLayout.width,
                },
              ]}>
              <View style={styles.filterMenu}>
                {PERIOD_OPTIONS.map(option => {
                  const selected = period === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={({ pressed }) => [
                        styles.filterMenuItem,
                        selected && styles.filterMenuItemSelected,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => selectPeriod(option.id)}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected }}>
                      <Text
                        style={[
                          styles.filterMenuItemText,
                          selected && styles.filterMenuItemTextSelected,
                        ]}>
                        {option.label}
                      </Text>
                      {selected ? (
                        <Text style={styles.filterMenuCheck}>✓</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Modal>

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
                    ]}
                  >
                    {row.pointsMain}
                  </Text>
                  <Text
                    style={[
                      styles.txPtsLabel,
                      { color: row.positive ? green : debit },
                    ]}
                  >
                    {row.pointsLabel}
                  </Text>
                </View>
              </View>
            ))
          )}

          {hasMore ? (
            <Pressable
              style={({ pressed }) => [
                styles.loadMore,
                pressed && styles.pressed,
              ]}
              disabled={loadingMore}
              onPress={() => loadMore().catch(() => {})}
            >
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 52,
  },
  backBtn: {
    width: 28,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: text,
    marginLeft: 2,
  },
  scroll: {
    paddingHorizontal: 17,
    paddingTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    ...cardShadow,
  },
  summaryCardRight: {
    backgroundColor: spentBg,
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: muted,
  },
  summaryLabelRight: {
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 33,
    lineHeight: 28,
    fontWeight: '600',
    color: text,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '900',
    color: text,
    flex: 1,
    marginRight: 8,
  },
  tierHint: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: text,
    textAlign: 'right',
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1A1C1E',
  },
  filterRow: {
    marginBottom: 21,
  },
  filterModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  filterMenuHost: {
    position: 'absolute',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    height: 55,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    ...cardShadow,
  },
  filterPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterChevron: {
    marginLeft: 8,
  },
  filterChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  filterMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    ...cardShadow,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  filterMenuItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  filterMenuItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: text,
  },
  filterMenuItemTextSelected: {
    color: orange,
    fontWeight: '800',
  },
  filterMenuCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: orange,
  },
  filterShow: {
    fontSize: 14,
    color: muted,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filterBold: {
    fontSize: 16,
    fontWeight: '800',
    color: text,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: text,
    marginBottom: 13,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    minHeight: 62,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    ...cardShadow,
  },
  txIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txMid: {
    flex: 1,
    paddingRight: 6,
  },
  txTitle: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '900',
    color: text,
  },
  txSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 11,
    color: muted,
    fontWeight: '600',
  },
  txPts: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  txPtsMain: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '900',
  },
  txPtsLabel: {
    fontSize: 12,
    lineHeight: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  loadMore: {
    alignSelf: 'center',
    marginTop: 7,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...cardShadow,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: orange,
  },
  pressed: { opacity: 0.92 },
});
  