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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminUsersStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import {
  approveOperationalAdmin,
  listPendingOperationalAdmins,
  type PendingOperationalAdmin,
} from '../../api/adminOperationalAdminApprovals';
import { isApiError, userFacingApiMessage } from '../../api/client';

type Nav = NativeStackNavigationProp<AdminUsersStackParamList, 'AdminOpsApprovals'>;

function Separator() {
  return <View style={{ height: 10 }} />;
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminOpsApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PendingOperationalAdmin[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const take = 20;

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
        const res = await listPendingOperationalAdmins({ take, offset });
        setTotal(res.total);
        setHasMore(res.hasMore);
        setItems((prev) => (mode === 'more' ? [...prev, ...res.items] : res.items));
      } catch (e) {
        if (isApiError(e)) setError(userFacingApiMessage(e.message));
        else setError('Could not load approval requests.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasMore, items.length, loading, loadingMore],
  );

  useFocusEffect(
    useCallback(() => {
      load('reset').catch(() => {});
    }, [load]),
  );

  const rows = useMemo(
    () =>
      items.map((u) => ({
        ...u,
        title: u.fullName?.trim() || u.email.split('@')[0] || 'Ops Admin',
        subtitle: `${u.phone ?? '—'} • Requested ${fmtWhen(u.createdAt)}`,
      })),
    [items],
  );

  const onApprove = async (id: string) => {
    if (approvingId) return;
    setApprovingId(id);
    setError(null);
    try {
      await approveOperationalAdmin(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setTotal((t) => (t == null ? t : Math.max(0, t - 1)));
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not approve this request.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}>
          <Text style={styles.backTxt}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.title}>Ops Admin Approvals</Text>
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={adminUi.accentOrange} />
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 24 + insets.bottom },
        ]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySub}>
                Ops Admin signup requests will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const approving = approvingId === item.id;
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.sub}>{item.subtitle}</Text>
              </View>
              <Pressable
                onPress={() => onApprove(item.id)}
                disabled={approvingId != null}
                style={({ pressed }) => [
                  styles.approveBtn,
                  pressed && approvingId == null && { opacity: 0.92 },
                  approving && { opacity: 0.7 },
                ]}>
                {approving ? (
                  <ActivityIndicator color={adminUi.white} />
                ) : (
                  <Text style={styles.approveTxt}>Approve</Text>
                )}
              </Pressable>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={[styles.loadMore, (!hasMore || loadingMore) && { opacity: 0.6 }]}
              disabled={!hasMore || loadingMore}
              onPress={() => load('more').catch(() => {})}>
              {loadingMore ? (
                <ActivityIndicator color={adminUi.sectionTitle} />
              ) : (
                <Text style={styles.loadMoreTxt}>LOAD MORE</Text>
              )}
            </Pressable>
            <Text style={styles.footerHint}>
              Showing {items.length} of {total ?? items.length} requests.
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: { width: 42, height: 42, justifyContent: 'center' },
  backTxt: { fontSize: 18, color: adminUi.sectionTitle, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '900', color: adminUi.sectionTitle },
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  name: { fontSize: 16, fontWeight: '900', color: adminUi.sectionTitle },
  sub: { marginTop: 3, fontSize: 12, color: adminUi.labelMuted, lineHeight: 16 },
  approveBtn: {
    marginLeft: 12,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  approveTxt: { color: adminUi.white, fontWeight: '900', fontSize: 12, letterSpacing: 0.4 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: adminUi.sectionTitle },
  emptySub: { marginTop: 6, fontSize: 13, color: adminUi.labelMuted, textAlign: 'center' },
  footer: { marginTop: 18, alignItems: 'center' },
  loadMore: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 220,
    alignItems: 'center',
    backgroundColor: adminUi.cardBg,
  },
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

