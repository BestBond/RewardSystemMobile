import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminApprovalsStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import {
  listAdminRedemptions,
  type AdminRedemptionListItem,
} from '../../api/adminRedemptions';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { getAuthMe } from '../../api/users';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { canManageAllRedemptionChannels } from './adminRole';
type Nav = NativeStackNavigationProp<
  AdminApprovalsStackParamList,
  'AdminApprovalsList'
>;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function ApprovalSeparator() {
  return <View style={styles.sep12} />;
}

function ApprovalListRow({
  item,
  onOpen,
  showChannel,
}: {
  item: AdminRedemptionListItem & { pendingLabel: string };
  onOpen: () => void;
  showChannel: boolean;
}) {
  const channelTag =
    showChannel && item.channel === 'CUSTOMER_APP'
      ? 'App'
      : showChannel && item.channel === 'DEALER_STORE'
        ? 'In-store'
        : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open request ${item.code}`}
      onPress={onOpen}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.reqId}>#{item.code}</Text>
          {channelTag ? (
            <View style={styles.channelPill}>
              <Text style={styles.channelPillTxt}>{channelTag}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.pts}>{formatInt(item.points)} PTS</Text>
      </View>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.requester}>{item.requester}</Text>
      <View style={styles.cardFoot}>
        {item.duplicate ? (
          <View style={styles.dupRow}>
            <View style={styles.dupIcon}>
              <Text style={styles.dupIconTxt}>!</Text>
            </View>
            <Text style={styles.dupTxt}>Duplicate Request Detected</Text>
          </View>
        ) : (
          <View style={styles.pendingRow}>
            <View style={styles.orangeDot} />
            <Text style={styles.pendingTxt}>{item.pendingLabel}</Text>
            <Pressable
              onPress={onOpen}
              accessibilityRole="button"
              accessibilityLabel={`Review request ${item.code}`}
              hitSlop={8}>
              <Text style={styles.review}>Review {'>'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function hoursAgoLabel(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (!Number.isFinite(t)) return '—';
  const h = Math.max(0, Math.round((Date.now() - t) / (60 * 60 * 1000)));
  if (h <= 0) return 'Just now';
  if (h === 1) return '1h ago';
  return `${h}h ago`;
}

export function AdminApprovalsListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [listChannel, setListChannel] = useState<'ALL' | 'DEALER_STORE' | null>(
    null,
  );
  const [flagged, setFlagged] = useState(false);
  const [sort, setSort] = useState<'HIGH_VALUE' | 'NEWEST'>('HIGH_VALUE');
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminRedemptionListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [queueStatus, setQueueStatus] = useState<'PROCESSING' | 'SHIPPED'>(
    'PROCESSING',
  );
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const take = 20;

  const showChannelPill = listChannel === 'ALL';

  const viewItems = useMemo(
    () =>
      items.map(i => ({
        ...i,
        pendingLabel:
          queueStatus === 'PROCESSING'
            ? `Pending review (${hoursAgoLabel(i.createdAt)})`
            : `In dispatch (${hoursAgoLabel(i.createdAt)})`,
      })),
    [items, queueStatus],
  );

  useEffect(() => {
    getAuthMe()
      .then(({ user }) => {
        setListChannel(
          user && canManageAllRedemptionChannels(user)
            ? 'ALL'
            : 'DEALER_STORE',
        );
      })
      .catch(() => setListChannel('DEALER_STORE'));
  }, []);

  const loadReset = useCallback(
    async (
      flaggedValue: boolean,
      statusOverride?: 'PROCESSING' | 'SHIPPED',
    ) => {
      if (!listChannel) return;
      const status = statusOverride ?? queueStatus;
      setLoading(true);
      setError(null);
      try {
        const res = await listAdminRedemptions({
          status,
          sort,
          take,
          offset: 0,
          flagged: flaggedValue,
          channel: listChannel,
        });
        setTotal(res.total);
        setHasMore(res.hasMore);
        setItems(res.items);
      } catch (e) {
        if (isApiError(e)) setError(userFacingApiMessage(e.message));
        else setError('Could not load approvals.');
      } finally {
        setLoading(false);
      }
    },
    [listChannel, queueStatus, sort],
  );

  const loadMore = useCallback(async () => {
    if (!listChannel || loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listAdminRedemptions({
        status: queueStatus,
        sort,
        take,
        offset: items.length,
        flagged,
        channel: listChannel,
      });
      setTotal(res.total);
      setHasMore(res.hasMore);
      setItems(prev => [...prev, ...res.items]);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not load approvals.');
    } finally {
      setLoadingMore(false);
    }
  }, [
    flagged,
    hasMore,
    items.length,
    listChannel,
    loading,
    loadingMore,
    queueStatus,
    sort,
  ]);

  useRefreshOnFocusAndForeground(() => {
    if (!listChannel) return;
    loadReset(flagged).catch(() => {});
  });

  useEffect(() => {
    if (!listChannel) return;
    loadReset(flagged).catch(() => {});
    // Intentionally only when queue scope is known; other filters call loadReset directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listChannel]);

  const sortLabel = sort === 'NEWEST' ? 'Newest' : 'High Value';

  if (listChannel === null) {
    return (
      <View style={[styles.root, styles.bootWrap, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={adminUi.accentOrange} />
        <Text style={styles.bootTxt}>Loading approval queue…</Text>
      </View>
    );
  }

  const fullQueue = listChannel === 'ALL';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.pageTitle}>
        {fullQueue ? 'Reward redemptions' : 'Dealer redemptions'}
      </Text>
      <Text style={styles.hero}>
        {queueStatus === 'PROCESSING'
          ? 'Approval queue'
          : 'Dispatch & delivery'}
      </Text>
      <Text style={styles.heroSub}>
        {queueStatus === 'PROCESSING'
          ? fullQueue
            ? 'Contractor / painter app requests and dealer store redemptions appear here for review before dispatch.'
            : 'Dealer store redemptions are debited at the counter, then reviewed here before dispatch.'
          : fullQueue
            ? 'Approved rewards: app shipments and dealer handoffs.'
            : 'Approved rewards awaiting physical handoff to dealers.'}
      </Text>

      <View style={styles.queueTabs}>
        <Pressable
          style={[
            styles.queueTab,
            queueStatus === 'PROCESSING' && styles.queueTabOn,
          ]}
          onPress={() => {
            setQueueStatus('PROCESSING');
            setItems([]);
            loadReset(flagged, 'PROCESSING').catch(() => {});
          }}>
          <Text
            style={[
              styles.queueTabTxt,
              queueStatus === 'PROCESSING' && styles.queueTabTxtOn,
            ]}>
            Pending review
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.queueTab,
            queueStatus === 'SHIPPED' && styles.queueTabOn,
          ]}
          onPress={() => {
            setQueueStatus('SHIPPED');
            setItems([]);
            loadReset(flagged, 'SHIPPED').catch(() => {});
          }}>
          <Text
            style={[
              styles.queueTabTxt,
              queueStatus === 'SHIPPED' && styles.queueTabTxtOn,
            ]}>
            Out for delivery
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.recordBtn, pressed && { opacity: 0.92 }]}
        onPress={() => navigation.navigate('AdminRecordDealerRedemption')}>
        <Text style={styles.recordBtnTxt}>＋ Record dealer redemption</Text>
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable
          hitSlop={10}
          style={({ pressed }) => [
            styles.sortBox,
            pressed && { opacity: 0.95 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Change sort order"
          onPress={() => setSortOpen(true)}>
          <Text style={styles.sortLbl}>Sort By</Text>
          <Text style={styles.sortVal}>
            {sortLabel} {'\u25BE'}
          </Text>
        </Pressable>
        <View style={styles.flagRow}>
          <Text style={styles.flagLbl}>Flagged Requests</Text>
          <Switch
            value={flagged}
            onValueChange={(v) => {
              setFlagged(v);
              setItems([]);
              loadReset(v).catch(() => {});
            }}
            trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
            thumbColor={flagged ? adminUi.accentOrange : '#f4f3f4'}
          />
        </View>
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={adminUi.accentOrange} />
        </View>
      ) : null}

      <FlatList
        data={viewItems}
        keyExtractor={i => i.id}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              loadReset(flagged)
                .catch(() => {})
                .finally(() => setPullRefreshing(false));
            }}
            tintColor={adminUi.accentOrange}
            colors={[adminUi.accentOrange]}
          />
        }
        renderItem={({ item }) => (
          <ApprovalListRow
            item={item}
            showChannel={showChannelPill}
            onOpen={() =>
              navigation.navigate('AdminApprovalDetail', {
                requestId: item.id,
              })
            }
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 28 + insets.bottom },
        ]}
        ItemSeparatorComponent={ApprovalSeparator}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={[styles.loadMore, (!hasMore || loadingMore) && styles.loadMoreDisabled]}
              disabled={!hasMore || loadingMore}
              accessibilityRole="button"
              accessibilityLabel="Load more approval requests"
              onPress={() => {
                loadMore().catch(() => {});
              }}>
              {loadingMore ? (
                <ActivityIndicator color={adminUi.sectionTitle} />
              ) : (
                <Text style={styles.loadMoreTxt}>LOAD MORE REQUESTS</Text>
              )}
            </Pressable>
            <Text style={styles.footerHint}>
              Showing {items.length} of {total ?? items.length}{' '}
              {queueStatus === 'PROCESSING'
                ? fullQueue
                  ? 'pending requests.'
                  : 'pending dealer redemptions.'
                : 'rewards out for delivery.'}
            </Text>
          </View>
        }
      />

      <Modal visible={sortOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          accessibilityRole="button"
          accessibilityLabel="Close sort menu"
          onPress={() => setSortOpen(false)}>
          <Pressable
            style={styles.sortMenu}
            accessibilityRole="menu"
            onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sortMenuTitle}>Sort By</Text>
            <Pressable
              style={({ pressed }) => [
                styles.sortOption,
                sort === 'HIGH_VALUE' && styles.sortOptionOn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sort by High Value"
              onPress={() => {
                setSort('HIGH_VALUE');
                setSortOpen(false);
                setItems([]);
                loadReset(flagged).catch(() => {});
              }}>
              <Text style={styles.sortOptionTxt}>High Value</Text>
              {sort === 'HIGH_VALUE' ? (
                <Text style={styles.sortCheck}>✓</Text>
              ) : null}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.sortOption,
                sort === 'NEWEST' && styles.sortOptionOn,
                pressed && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sort by Newest"
              onPress={() => {
                setSort('NEWEST');
                setSortOpen(false);
                setItems([]);
                loadReset(flagged).catch(() => {});
              }}>
              <Text style={styles.sortOptionTxt}>Newest</Text>
              {sort === 'NEWEST' ? (
                <Text style={styles.sortCheck}>✓</Text>
              ) : null}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  bootWrap: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  bootTxt: { fontSize: 14, fontWeight: '600', color: adminUi.labelMuted },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  hero: {
    fontSize: 26,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    paddingHorizontal: 20,
  },
  heroSub: {
    fontSize: 14,
    color: adminUi.labelMuted,
    paddingHorizontal: 20,
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 12,
  },
  queueTabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  queueTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    backgroundColor: adminUi.cardBg,
    alignItems: 'center',
  },
  queueTabOn: {
    borderColor: adminUi.accentOrange,
    backgroundColor: 'rgba(253, 186, 116, 0.15)',
  },
  queueTabTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: adminUi.labelMuted,
  },
  queueTabTxtOn: { color: adminUi.sectionTitle },
  recordBtn: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: adminUi.sectionTitle,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recordBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  toolbar: {
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 12,
  },
  sortBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminUi.engageBadgeBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  sortLbl: { fontSize: 13, color: adminUi.labelMuted, fontWeight: '600' },
  sortVal: { fontSize: 14, fontWeight: '700', color: adminUi.sectionTitle },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flagLbl: { fontSize: 14, fontWeight: '600', color: adminUi.sectionTitle },
  err: {
    paddingHorizontal: 20,
    marginBottom: 10,
    color: adminUi.pointsDebit,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: { paddingVertical: 16, alignItems: 'center' },
  list: { paddingHorizontal: 20 },
  card: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTopLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  channelPill: {
    backgroundColor: 'rgba(253, 186, 116, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  channelPillTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    letterSpacing: 0.3,
  },
  reqId: {
    fontSize: 12,
    fontWeight: '800',
    color: adminUi.labelMuted,
    letterSpacing: 0.5,
  },
  pts: {
    fontSize: 15,
    fontWeight: '800',
    color: adminUi.accentOrange,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  requester: {
    fontSize: 14,
    color: adminUi.labelMuted,
    marginTop: 4,
  },
  cardFoot: { marginTop: 12 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminUi.accentOrange,
  },
  pendingTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: adminUi.labelMuted,
  },
  review: {
    fontSize: 14,
    fontWeight: '800',
    color: adminUi.accentOrange,
  },
  dupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dupIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dupIconTxt: {
    color: adminUi.pointsDebit,
    fontWeight: '900',
    fontSize: 14,
  },
  dupTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: adminUi.pointsDebit,
  },
  footer: { marginTop: 20, alignItems: 'center' },
  loadMore: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loadMoreDisabled: { opacity: 0.6 },
  loadMoreTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    letterSpacing: 0.6,
  },
  footerHint: {
    marginTop: 12,
    fontSize: 12,
    color: adminUi.labelMuted,
    textAlign: 'center',
  },
  sep12: { height: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.20)',
    paddingHorizontal: 20,
    paddingTop: 130,
  },
  sortMenu: {
    backgroundColor: adminUi.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  sortMenuTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: adminUi.offWhite,
    marginBottom: 10,
  },
  sortOptionOn: {
    borderColor: 'rgba(242, 101, 34, 0.35)',
    backgroundColor: 'rgba(242, 101, 34, 0.10)',
  },
  sortOptionTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  sortCheck: {
    fontSize: 14,
    fontWeight: '900',
    color: adminUi.accentOrange,
  },
});
