import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../components/AdminHeader';
import type { AdminCouponStackParamList } from '../../../navigation/types';
import { adminUi } from '../../../theme/adminUi';
import { CheckCircle, Download, Pdf } from '../../../assets/svgs';
import { API_BASE_URL } from '../../../api/config';
import { getAccessToken } from '../../../api/storage';

type Nav = NativeStackNavigationProp<
  AdminCouponStackParamList,
  'AdminCouponExport'
>;
type R = RouteProp<AdminCouponStackParamList, 'AdminCouponExport'>;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

export function AdminCouponExportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { batchId, createdAtLabel, totalCoupons, totalPts, slabPts } = params;
  const [downloading, setDownloading] = useState(false);

  const onViewPdf = () => {
    if (!batchId || !batchId.trim()) {
      Alert.alert(
        'View failed',
        'Batch id is missing. Please regenerate the batch and try again.',
        [{ text: 'OK' }],
      );
      return;
    }
    navigation.navigate('AdminCouponPdfViewer', { batchId });
  };

  const onDownload = () => {
    if (downloading) return;
    if (!batchId || !batchId.trim()) {
      Alert.alert(
        'Export failed',
        'Batch id is missing. Please regenerate the batch and try again.',
        [{ text: 'OK' }],
      );
      return;
    }
    setDownloading(true);
    (async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // Lazy-load to avoid iOS crash when native module isn't linked yet.
      let RNFS: typeof import('react-native-fs');
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        RNFS = require('react-native-fs');
      } catch {
        throw new Error(
          'File module not available. Run iOS pods install and rebuild the app.',
        );
      }
      const docDir = (RNFS as unknown as { DocumentDirectoryPath?: string })
        .DocumentDirectoryPath;
      if (!docDir) {
        throw new Error(
          'File module is not linked (DocumentDirectoryPath missing). Run `cd ios && pod install`, then rebuild the iOS app.',
        );
      }

      const fromUrl = `${API_BASE_URL}/coupons/batches/${encodeURIComponent(
        batchId,
      )}/export.pdf`;
      const toFile = `${docDir}/coupon-batch-${batchId}.pdf`;

      const r = RNFS.downloadFile({
        fromUrl,
        toFile,
        headers: { Authorization: `Bearer ${token}` },
        background: true,
      });
      const result = await r.promise;
      if (result.statusCode && result.statusCode >= 400) {
        throw new Error(`Download failed (${result.statusCode})`);
      }

      await Share.share({
        title: `Coupon batch ${batchId}`,
        url: `file://${toFile}`,
      });
    })()
      .catch((e) => {
        const msg = String((e as Error)?.message ?? e);
        console.warn('[Export] PDF download failed', msg);
        Alert.alert('Export failed', msg, [{ text: 'OK' }]);
      })
      .finally(() => setDownloading(false));
  };

  const onDiscard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AdminCouponGenerate' }],
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Export Batch" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Export Coupon Batch</Text>

        <View style={styles.detailCard}>
          <View style={styles.watermark} pointerEvents="none">
            {/* If you want an exact watermark icon, share the SVG and I’ll swap it. */}
            <Pdf width={92} height={92} opacity={0.06} />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>BATCH ID</Text>
            <Text style={styles.detailVal}>#{batchId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>CREATION DATE</Text>
            <Text style={styles.detailVal}>{createdAtLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>TOTAL COUPONS</Text>
            <Text style={styles.detailVal}>{formatInt(totalCoupons)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>TOTAL VALUE</Text>
            <Text style={styles.detailValOrange}>
              {formatInt(totalPts)} Pts
            </Text>
          </View>
          <Text style={styles.slabHint}>
            Slab: {formatInt(slabPts)} pts per coupon
          </Text>
        </View>

        <Text style={styles.formatSectionLbl}>SELECT EXPORT FORMAT</Text>

        <View style={[styles.formatRow, styles.formatRowSelected]}>
          <View style={styles.formatIconWrap}>
            <Pdf width={22} height={22} />
          </View>
          <Text style={styles.formatTitle}>PDF (Print Ready)</Text>
          <View style={styles.checkWrap}>
            <CheckCircle width={22} height={22} />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.secondaryBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="View batch PDF in app"
          onPress={onViewPdf}>
          <Text style={styles.secondaryBtnText}>View PDF</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            downloading && styles.primaryBtnDisabled,
            pressed && styles.primaryBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Download exported coupon batch"
          disabled={downloading}
          onPress={onDownload}>
          <Download width={20} height={20} />
          <Text style={styles.primaryBtnText}>
            {downloading ? 'Downloading…' : 'Download'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onDiscard}
          style={styles.discardWrap}
          accessibilityRole="button"
          accessibilityLabel="Cancel and discard export">
          <Text style={styles.discard}>Cancel/Discard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: adminUi.navyAlt,
    marginBottom: 18,
  },
  detailCard: {
    borderRadius: 28,
    backgroundColor: adminUi.cardBg,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 26,
    ...adminUi.shadowCard,
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  detailRow: { marginBottom: 14 },
  detailLbl: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: adminUi.labelMuted,
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 17,
    fontWeight: '800',
    color: adminUi.navyAlt,
  },
  detailValOrange: {
    fontSize: 28,
    fontWeight: '900',
    color: adminUi.accentOrange,
  },
  slabHint: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 4,
  },
  formatSectionLbl: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: adminUi.labelMuted,
    marginBottom: 12,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: adminUi.engageBadgeBg,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatRowSelected: {
    borderColor: adminUi.accentOrange,
    backgroundColor: '#FFF7ED',
  },
  formatRowPressed: { opacity: 0.92 },
  formatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminUi.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  formatTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: adminUi.navyAlt,
  },
  checkWrap: { marginLeft: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    marginTop: 26,
    ...adminUi.shadowCta,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    marginTop: 14,
    backgroundColor: adminUi.white,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  secondaryBtnPressed: { opacity: 0.9 },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.navyAlt,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    color: adminUi.white,
    fontSize: 17,
    fontWeight: '800',
  },
  discardWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  discard: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.accentOrange,
  },
});
