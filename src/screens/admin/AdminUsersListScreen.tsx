import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminUsersStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import { listAdminUsers, type AdminUserListItem } from '../../api/adminUsers';
import { isApiError, userFacingApiMessage } from '../../api/client';

type Nav = NativeStackNavigationProp<AdminUsersStackParamList, 'AdminUsersList'>;

const FILTERS = ['All', 'Contractor', 'Painter', 'Dealer'] as const;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function UserListSeparator() {
  return <View style={styles.sep} />;
}

function AdminUserRow({
  item,
  onPress,
}: {
  item: AdminUserListItem & { avatarColor: string; roleLabel: string };
  onPress: () => void;
}) {
  const suspended = item.status === 'SUSPENDED';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        suspended && styles.rowSuspended,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name} profile`}
      onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: suspended ? '#F3F4F6' : item.avatarColor }]}>
        <Text style={[styles.avatarTxt, suspended && { color: adminUi.labelMuted }]}>
          {item.name
            .split(/\s+/)
            .map(p => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowRole}>{item.roleLabel}</Text>
        {suspended ? (
          <View style={styles.suspendedBadge}>
            <Text style={styles.suspendedBadgeTxt}>Suspended</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.balance, suspended && { color: adminUi.labelMuted }]}>
          {formatInt(item.walletBalance)}
        </Text>
        <Text style={styles.balanceLbl}>WALLET BALANCE</Text>
      </View>
    </Pressable>
  );
}

export function AdminUsersListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [q, setQ] = useState('');
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]>('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const take = 20;

  const professionParam = filter === 'All' ? undefined : filter;

  const load = useCallback(
    async (mode: 'reset' | 'more') => {
      if (mode === 'more') {
        if (loadingMore || loading || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const offset = mode === 'more' ? items.length : 0;
        const res = await listAdminUsers({
          q,
          profession: professionParam,
          take,
          offset,
        });
        setTotal(res.total);
        setHasMore(res.hasMore);
        setItems(prev => (mode === 'more' ? [...prev, ...res.items] : res.items));
      } catch (e) {
        if (isApiError(e)) setError(userFacingApiMessage(e.message));
        else setError('Could not load users.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasMore, items.length, loading, loadingMore, professionParam, q],
  );

  useFocusEffect(
    useCallback(() => {
      load('reset').catch(() => {});
    }, [load]),
  );

  const rows = useMemo(() => {
    const palette = ['#E0E7FF', '#DCFCE7', '#FFE4E6', '#E0F2FE', '#FEF3C7'];
    const safe = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h;
    };
    return items.map(u => ({
      ...u,
      avatarColor: palette[safe(u.id) % palette.length] ?? '#E5E7EB',
      roleLabel: u.profession ?? '—',
    }));
  }, [items]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.pageTitle}>User Management</Text>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>{'\u2315'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name or Mobile Number"
          placeholderTextColor={adminUi.mutedGray}
          value={q}
          onChangeText={t => {
            setQ(t);
            // Light debounce feel without adding timers: refresh on typing end via focus reload.
            // Also allow user to hit keyboard search by auto-refreshing after short idle.
            setTimeout(() => load('reset').catch(() => {}), 150);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.pills}>
        {FILTERS.map(f => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => {
                setFilter(f);
                setTimeout(() => load('reset').catch(() => {}), 0);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${f}`}
              style={[styles.pill, on && styles.pillOn]}>
              <Text style={[styles.pillTxt, on && styles.pillTxtOn]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={adminUi.accentOrange} />
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <AdminUserRow
            item={item}
            onPress={() =>
              navigation.navigate('AdminUserDetail', { userId: item.id })
            }
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 24 + insets.bottom },
        ]}
        ItemSeparatorComponent={UserListSeparator}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={[styles.loadMore, (!hasMore || loadingMore) && styles.loadMoreDisabled]}
              disabled={!hasMore || loadingMore}
              accessibilityRole="button"
              accessibilityLabel="Load more users"
              onPress={() => load('more').catch(() => {})}>
              {loadingMore ? (
                <ActivityIndicator color={adminUi.sectionTitle} />
              ) : (
                <Text style={styles.loadMoreTxt}>LOAD MORE USERS</Text>
              )}
            </Pressable>
            <Text style={styles.footerHint}>
              Showing {items.length} of {total ?? items.length} users.
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
    fontSize: 22,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: adminUi.engageBadgeBg,
    borderRadius: adminUi.radiusPill,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  searchIcon: {
    fontSize: 16,
    color: adminUi.labelMuted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: adminUi.sectionTitle,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminUi.radiusPill,
    backgroundColor: adminUi.engageBadgeBg,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  pillOn: {
    backgroundColor: adminUi.sectionTitle,
  },
  pillTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: adminUi.labelMuted,
  },
  pillTxtOn: {
    color: adminUi.white,
  },
  list: { paddingHorizontal: 20 },
  sep: { height: 10 },
  err: {
    paddingHorizontal: 20,
    marginBottom: 10,
    color: adminUi.pointsDebit,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: { paddingVertical: 14, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  rowPressed: { opacity: 0.92 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontWeight: '800', color: adminUi.navyAlt, fontSize: 14 },
  rowMid: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 16, fontWeight: '800', color: adminUi.sectionTitle },
  rowRole: { fontSize: 13, color: adminUi.labelMuted, marginTop: 2 },
  rowSuspended: {
    opacity: 0.7,
    borderColor: '#FECACA',
    backgroundColor: '#FFF9F9',
  },
  suspendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  suspendedBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: adminUi.suspendAccent,
    letterSpacing: 0.3,
  },
  rowRight: { alignItems: 'flex-end' },
  balance: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.accentOrange,
  },
  balanceLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: adminUi.labelMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  footer: { marginTop: 18, alignItems: 'center' },
  loadMore: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 220,
    alignItems: 'center',
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
});
