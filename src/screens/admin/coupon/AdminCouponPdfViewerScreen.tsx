import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../components/AdminHeader';
import type { AdminCouponStackParamList } from '../../../navigation/types';
import { adminUi } from '../../../theme/adminUi';
import { API_BASE_URL } from '../../../api/config';
import { getAccessToken } from '../../../api/storage';

type Nav = NativeStackNavigationProp<
  AdminCouponStackParamList,
  'AdminCouponPdfViewer'
>;
type R = RouteProp<AdminCouponStackParamList, 'AdminCouponPdfViewer'>;

export function AdminCouponPdfViewerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const insets = useSafeAreaInsets();
  const { batchId } = params;

  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingToken(true);
    getAccessToken()
      .then((t) => {
        if (cancelled) return;
        setToken(t ?? null);
        setLoadErr(t ? null : 'Not authenticated.');
      })
      .catch((e) => {
        if (cancelled) return;
        setToken(null);
        setLoadErr(String((e as Error)?.message ?? e));
      })
      .finally(() => {
        if (!cancelled) setLoadingToken(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pdfUrl = useMemo(() => {
    return `${API_BASE_URL}/coupons/batches/${encodeURIComponent(
      batchId,
    )}/export.pdf`;
  }, [batchId]);

  const onBack = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <AdminHeader title="Batch PDF" onBack={onBack} />
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
        {loadingToken ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.hint}>Preparing viewer…</Text>
          </View>
        ) : loadErr || !token ? (
          <View style={styles.center}>
            <Text style={styles.errTitle}>Could not open PDF</Text>
            <Text style={styles.errMsg}>{loadErr ?? 'Missing access token.'}</Text>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            source={{
              uri: pdfUrl,
              headers: { Authorization: `Bearer ${token}` },
            }}
            style={styles.web}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.hint}>Loading PDF…</Text>
              </View>
            )}
            onError={(e) => {
              setLoadErr(e.nativeEvent?.description ?? 'Failed to load PDF.');
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  body: { flex: 1 },
  web: { flex: 1, backgroundColor: adminUi.screenBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  hint: { marginTop: 10, fontSize: 13, color: adminUi.labelMuted, fontWeight: '600' },
  errTitle: { fontSize: 16, fontWeight: '800', color: adminUi.navyAlt },
  errMsg: {
    marginTop: 8,
    fontSize: 13,
    color: adminUi.labelMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: adminUi.accentOrange,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  backBtnText: { color: adminUi.white, fontWeight: '800' },
});

