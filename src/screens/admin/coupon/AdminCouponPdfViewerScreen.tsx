import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
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

const B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Hermes/RN often has no global `btoa`; avoid ReferenceError when saving PDF bytes. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    result += B64[bytes[i]! >> 2];
    result += B64[((bytes[i]! & 0x03) << 4) | (bytes[i + 1]! >> 4)];
    result += B64[((bytes[i + 1]! & 0x0f) << 2) | (bytes[i + 2]! >> 6)];
    result += B64[bytes[i + 2]! & 0x3f];
  }
  if (i === bytes.length - 1) {
    result += B64[bytes[i]! >> 2];
    result += B64[(bytes[i]! & 0x03) << 4];
    result += '==';
  } else if (i === bytes.length - 2) {
    result += B64[bytes[i]! >> 2];
    result += B64[((bytes[i]! & 0x03) << 4) | (bytes[i + 1]! >> 4)];
    result += B64[(bytes[i + 1]! & 0x0f) << 2];
    result += '=';
  }
  return result;
}

async function openLocalPdfFile(absPath: string): Promise<void> {
  if (Platform.OS === 'android') {
    // Omit chooser title: createChooser() drops FLAG_ACTIVITY_NEW_TASK, which
    // startActivity(applicationContext) requires on Android.
    await ReactNativeBlobUtil.android.actionViewIntent(absPath, 'application/pdf');
  } else {
    await ReactNativeBlobUtil.ios.presentPreview(absPath);
  }
}

export function AdminCouponPdfViewerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const insets = useSafeAreaInsets();
  const { batchId } = params;

  const [phase, setPhase] = useState<'loading' | 'opened' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const loadAndOpen = useCallback(async () => {
    setPhase('loading');
    setErrMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const pdfUrl = `${API_BASE_URL}/coupons/batches/${encodeURIComponent(
        batchId,
      )}/export.pdf`;
      const res = await fetch(pdfUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? 'Session expired. Sign in again.'
            : `Server returned ${res.status} (PDF export may be unavailable).`,
        );
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength === 0) {
        throw new Error('Empty PDF response.');
      }
      const b64 = arrayBufferToBase64(buf);
      const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/coupon-batch-${batchId}.pdf`;
      await ReactNativeBlobUtil.fs.writeFile(path, b64, 'base64');
      await openLocalPdfFile(path);
      setPhase('opened');
    } catch (e) {
      setErrMsg(String((e as Error)?.message ?? e));
      setPhase('error');
    }
  }, [batchId]);

  useEffect(() => {
    loadAndOpen().catch(() => {});
  }, [loadAndOpen]);

  const onBack = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <AdminHeader title="Batch PDF" onBack={onBack} />
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
        {phase === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={adminUi.accentOrange} />
            <Text style={styles.hint}>Preparing PDF…</Text>
            <Text style={styles.subHint}>
              {Platform.OS === 'android'
                ? 'Will open in your PDF viewer (Android cannot show secured PDFs inside the browser).'
                : 'Opening preview…'}
            </Text>
          </View>
        ) : phase === 'opened' ? (
          <View style={styles.center}>
            <Text style={styles.okTitle}>PDF opened</Text>
            <Text style={styles.hint}>
              Use your PDF app to print or share. Tap Back when you are done.
            </Text>
            <Pressable
              onPress={() => loadAndOpen().catch(() => {})}
              style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Open again</Text>
            </Pressable>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.errTitle}>Could not open PDF</Text>
            <Text style={styles.errMsg}>{errMsg ?? 'Unknown error.'}</Text>
            <Pressable
              onPress={() => loadAndOpen().catch(() => {})}
              style={styles.backBtn}>
              <Text style={styles.backBtnText}>Retry</Text>
            </Pressable>
            <Pressable onPress={onBack} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: adminUi.labelMuted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  subHint: {
    marginTop: 10,
    fontSize: 12,
    color: adminUi.labelMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  okTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.navyAlt,
    textAlign: 'center',
  },
  errTitle: { fontSize: 16, fontWeight: '800', color: adminUi.navyAlt },
  errMsg: {
    marginTop: 8,
    fontSize: 13,
    color: adminUi.labelMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: adminUi.accentOrange,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  backBtnText: { color: adminUi.white, fontWeight: '800' },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  secondaryBtnText: {
    color: adminUi.accentOrange,
    fontWeight: '800',
    fontSize: 15,
  },
});
