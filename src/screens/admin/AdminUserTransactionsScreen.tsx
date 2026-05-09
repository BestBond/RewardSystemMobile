import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowLeft, IconGiftOrange, TxTicketOrange } from '../../assets/svgs';
import {
  getAdminUserTransactions,
  type AdminUserTx,
  type AdminUserTransactionsResponse,
} from '../../api/adminUsers';
import { isApiError, userFacingApiMessage } from '../../api/client';
import type { AdminUsersStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';

type Props = NativeStackScreenProps<AdminUsersStackParamList, 'AdminUserTransactions'>;
type Nav = NativeStackNavigationProp<AdminUsersStackParamList>;

const PAGE = 20;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function TxRowIcon({ type, delta }: { type: AdminUserTx['type']; delta: number }) {
  if (type === 'REWARD_REDEEM') return <IconGiftOrange width={20} height={20} />;
  return <TxTicketOrange width={20} height={20} />;
}

function TxRow({ item }: { item: AdminUserTx }) {
  const pos = item.pointsDelta > 0;
  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}>
        <TxRowIcon type={item.type} delta={item.pointsDelta} />
      </View>
      <View style={styles.txMid}>
        <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.txSub}>
          {formatDate(item.createdAt)}
          {item.site ? ` • ${item.site}` : ''}
        </Text>
      </View>
      <Text style={[styles.txPts, pos ? styles.txPos : styles.txNeg]}>
        {pos ? '+' : ''}{formatInt(item.pointsDelta)} PTS
      </Text>
    </View>
  );
}

export function AdminUserTransactionsScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const { userId } = params;

  const [period, setPeriod] = useState<'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminUserTransactionsResponse | null>(null);
  const [txRows, setTxRows] = useState<AdminUserTx[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (mode: 'reset' | 'more') => {
      if (mode === 'more') {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const offset = mode === 'more' ? txRows.length : 0;
        const res = await getAdminUserTransactions(userId, {
          period, limit: PAGE, offset,
        });
        setData(res);
        setHasMore(res.hasMore);
        setTxRows(prev => mode === 'more' ? [...prev, ...res.transactions] : res.transactions);
      } catch (e) {
        if (isApiError(e)) setError(userFacingApiMessage(e.message));
        else setError('Could not load ledger.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasMore, loadingMore, period, txRows.length, userId],
  );

  useEffect(() => {
    load('reset').catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const displayName = data?.user.displayName ?? '…';
  const profession = data?.user.profession ?? null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <BackArrowLeft width={22} height={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={txRows}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]}
        ListHeaderComponent={
          <>
            {/* User mini-header */}
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>
                  {displayName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userText}>
                <Text style={styles.userName}>{displayName}</Text>
                {profession ? <Text style={styles.userProf}>{profession}</Text> : null}
              </View>
              <View style={styles.statusDot} />
            </View>

            {/* Balance card */}
            <View style={styles.balCard}>
              <Text style={styles.balLbl}>Total Points Balance</Text>
              <Text style={styles.balVal}>{data ? formatInt(data.totalBalance) : '—'}</Text>
              {data ? (
                <Text style={styles.balTrend}>
                  Earned: +{formatInt(data.totalPointsEarned)} • Spent: -{formatInt(data.totalPointsSpent)}
                </Text>
              ) : null}
            </View>

            {/* Monthly scans */}
            <View style={styles.scansRow}>
              <Text style={styles.scansLbl}>Monthly Scans</Text>
              <Text style={styles.scansVal}>{data ? formatInt(data.monthlyScans) : '—'}</Text>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {/* Period filter */}
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>SHOW</Text>
              {(['THIS_MONTH', 'ALL'] as const).map(p => (
                <Pressable
                  key={p}
                  style={[styles.periodChip, period === p && styles.periodChipOn]}
                  onPress={() => setPeriod(p)}>
                  <Text style={[styles.periodChipTxt, period === p && styles.periodChipTxtOn]}>
                    {p === 'THIS_MONTH' ? 'This Month' : 'All Time'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator color={adminUi.accentOrange} />
              </View>
            ) : null}

            {error ? <Text style={styles.err}>{error}</Text> : null}

            {!loading && txRows.length === 0 && !error ? (
              <Text style={styles.empty}>No transactions for this period.</Text>
            ) : null}

            {!loading && !error && txRows.length > 0 ? (
              <Text style={styles.countHint}>
                Showing {txRows.length} transaction{txRows.length !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => <TxRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListFooterComponent={
          hasMore ? (
            <Pressable
              style={[styles.loadMore, loadingMore && { opacity: 0.6 }]}
              disabled={loadingMore}
              onPress={() => load('more').catch(() => {})}>
              {loadingMore ? (
                <ActivityIndicator color={adminUi.sectionTitle} />
              ) : (
                <Text style={styles.loadMoreTxt}>LOAD MORE</Text>
              )}
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: adminUi.screenBg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  list: { paddingHorizontal: 20 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTxt: { fontSize: 17, fontWeight: '800', color: adminUi.navyAlt },
  userText: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: adminUi.sectionTitle },
  userProf: { fontSize: 14, color: adminUi.roleAccent, fontWeight: '600', marginTop: 2 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminUi.successGreen,
    marginLeft: 8,
  },
  balCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: adminUi.radiusLg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,132,65,0.2)',
  },
  balLbl: { fontSize: 12, fontWeight: '700', color: adminUi.labelMuted },
  balVal: { fontSize: 30, fontWeight: '800', color: adminUi.sectionTitle, marginTop: 6 },
  balTrend: { fontSize: 13, color: adminUi.labelMuted, marginTop: 6, fontWeight: '600' },
  scansRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusMd,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  scansLbl: { fontSize: 14, fontWeight: '700', color: adminUi.labelMuted },
  scansVal: { fontSize: 20, fontWeight: '800', color: adminUi.sectionTitle },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  periodLabel: { fontSize: 12, fontWeight: '700', color: adminUi.labelMuted },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: adminUi.radiusPill,
    backgroundColor: adminUi.engageBadgeBg,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  periodChipOn: { backgroundColor: adminUi.sectionTitle, borderColor: adminUi.sectionTitle },
  periodChipTxt: { fontSize: 13, fontWeight: '600', color: adminUi.labelMuted },
  periodChipTxtOn: { color: adminUi.white },
  loader: { paddingVertical: 14, alignItems: 'center' },
  err: { color: adminUi.pointsDebit, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  empty: { color: adminUi.labelMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  countHint: { fontSize: 12, color: adminUi.labelMuted, marginBottom: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusMd,
    padding: 14,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: adminUi.engageBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMid: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '700', color: adminUi.sectionTitle },
  txSub: { fontSize: 12, color: adminUi.labelMuted, marginTop: 3 },
  txPts: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
  txPos: { color: adminUi.successGreen },
  txNeg: { color: adminUi.pointsDebit },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminUi.borderSoft,
    marginLeft: 54,
  },
  loadMore: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    letterSpacing: 0.6,
  },
});
