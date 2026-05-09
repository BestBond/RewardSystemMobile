import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { isOperationalOnly } from './adminRole';

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
}: {
  item: AdminRedemptionListItem & { pendingLabel: string };
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open request ${item.code}`}
      onPress={onOpen}>
      <View style={styles.cardTop}>
        <Text style={styles.reqId}>#{item.code}</Text>
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
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminRedemptionListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [operationalOnly, setOperationalOnly] = useState(false);

  const take = 20;

  const viewItems = useMemo(
    () =>
      items.map(i => ({
        ...i,
        pendingLabel: `Pending Review (${hoursAgoLabel(i.createdAt)})`,
      })),
    [items],
  );

  const loadReset = useCallback(
    async (flaggedValue: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const me = await getAuthMe().catch(() => ({ user: null }));
        const opOnly = isOperationalOnly(me.user ?? null);
        setOperationalOnly(opOnly);
        const res = await listAdminRedemptions({
          status: opOnly ? 'SHIPPED' : 'PROCESSING',
          sort: 'HIGH_VALUE',
          take,
          offset: 0,
          flagged: flaggedValue,
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
    [],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const me = await getAuthMe().catch(() => ({ user: null }));
      const opOnly = isOperationalOnly(me.user ?? null);
      setOperationalOnly(opOnly);
      const res = await listAdminRedemptions({
        status: opOnly ? 'SHIPPED' : 'PROCESSING',
        sort: 'HIGH_VALUE',
        take,
        offset: items.length,
        flagged,
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
  }, [flagged, hasMore, items.length, loading, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      loadReset(flagged).catch(() => {});
    }, [flagged, loadReset]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.pageTitle}>
        {operationalOnly ? 'Dispatch Request List' : 'Approval Request List'}
      </Text>
      <Text style={styles.hero}>
        {operationalOnly ? 'Dispatch & Delivery Queue' : 'Pending Approvals'}
      </Text>
      <Text style={styles.heroSub}>
        {operationalOnly
          ? 'Process approved rewards and coordinate dispatch status updates.'
          : 'Review and authorise high-value rewards for the loyalty program ecosystem.'}
      </Text>

      <View style={styles.toolbar}>
        <View style={styles.sortBox}>
          <Text style={styles.sortLbl}>Sort By</Text>
          <Text style={styles.sortVal}>High Value {'\u25BE'}</Text>
        </View>
        <View style={styles.flagRow}>
          <Text style={styles.flagLbl}>Flagged Requests</Text>
          <Switch
            value={flagged}
            onValueChange={(v) => {
              setFlagged(v);
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
        renderItem={({ item }) => (
          <ApprovalListRow
            item={item}
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
              Showing {items.length} of {total ?? items.length} pending high-ticket
              {operationalOnly ? ' dispatch requests.' : ' requests.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
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
    marginBottom: 16,
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
    marginBottom: 8,
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
});
