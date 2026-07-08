import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
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
import {
  getBatchExportMeta,
  type BatchExportMeta,
  type ExportJobStatus,
} from '../../../api/couponExport';
import { ExportProgressModal } from './ExportProgressModal';
import {
  downloadSyncBatchPdf,
  exportErrorMessage,
  exportOverlayTitle,
  formatExportFileSize,
  isExportTooLargeError,
  runAsyncBatchExport,
  shareLocalExportFile,
  shouldUseAsyncExport,
} from './couponExportUtils';

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
  const [exportStatus, setExportStatus] = useState<ExportJobStatus | null>(
    null,
  );
  const [batchMeta, setBatchMeta] = useState<BatchExportMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const couponCount = batchMeta?.totalCoupons ?? totalCoupons;
  const isLargeBatch = shouldUseAsyncExport(
    couponCount,
    batchMeta?.useAsyncExport,
  );

  useEffect(() => {
    const id = batchId?.trim();
    if (!id) {
      setMetaLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const meta = await getBatchExportMeta(id);
        if (!cancelled) setBatchMeta(meta);
      } catch {
        /* fall back to route params */
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const onViewPdf = () => {
    if (!batchId || !batchId.trim()) {
      Alert.alert(
        'View failed',
        'Batch id is missing. Please regenerate the batch and try again.',
        [{ text: 'OK' }],
      );
      return;
    }
    if (isLargeBatch) {
      Alert.alert(
        'Large batch',
        'Full PDF preview is only available for batches up to 300 coupons. Use Download ZIP to export this batch.',
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
    setExportStatus(null);

    void (async () => {
      let meta = batchMeta;
      if (!meta) {
        try {
          meta = await getBatchExportMeta(batchId);
          setBatchMeta(meta);
        } catch {
          meta = {
            batchId,
            totalCoupons,
            syncMax: 300,
            useAsyncExport: totalCoupons > 300,
          };
        }
      }

      const count = meta.totalCoupons;
      const useAsync = shouldUseAsyncExport(count, meta.useAsyncExport);

      try {
        if (useAsync) {
          const { filePath, fileSizeBytes } = await runAsyncBatchExport({
            batchId,
            totalCoupons: count,
            onProgress: setExportStatus,
          });
          await shareLocalExportFile({
            filePath,
            batchId,
            mime: 'application/zip',
          });
          Alert.alert(
            'Download ready',
            `Saved ${formatExportFileSize(fileSizeBytes)} (${count.toLocaleString()} coupons). Use Files or Share to access the ZIP.`,
          );
          return;
        }

        try {
          const filePath = await downloadSyncBatchPdf(batchId);
          await shareLocalExportFile({
            filePath,
            batchId,
            mime: 'application/pdf',
          });
          Alert.alert('Success', 'Coupon batch downloaded.');
        } catch (syncErr) {
          if (isExportTooLargeError(syncErr)) {
            const { filePath, fileSizeBytes } = await runAsyncBatchExport({
              batchId,
              totalCoupons: count || totalCoupons,
              onProgress: setExportStatus,
            });
            await shareLocalExportFile({
              filePath,
              batchId,
              mime: 'application/zip',
            });
            Alert.alert(
              'Download ready',
              `Saved ${formatExportFileSize(fileSizeBytes)} (${(count || totalCoupons).toLocaleString()} coupons).`,
            );
            return;
          }
          throw syncErr;
        }
      } catch (error) {
        const text = await exportErrorMessage(error, useAsync);
        Alert.alert('Export failed', text, [{ text: 'OK' }]);
      } finally {
        setDownloading(false);
        setExportStatus(null);
      }
    })();
  };

  const onDiscard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AdminCouponGenerate' }],
    });
  };

  const downloadButtonLabel = downloading
    ? exportOverlayTitle(exportStatus)
    : isLargeBatch
      ? 'Download ZIP'
      : 'Download';

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
            <Text style={styles.detailVal}>
              {metaLoading ? '…' : formatInt(couponCount)}
            </Text>
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

        {isLargeBatch ? (
          <Text style={styles.largeBatchHint}>
            Large batches export as a ZIP in the background. Keep the app open
            — if interrupted, tap Download ZIP again to resume.
          </Text>
        ) : null}

        <Text style={styles.formatSectionLbl}>SELECT EXPORT FORMAT</Text>

        <View style={[styles.formatRow, styles.formatRowSelected]}>
          <View style={styles.formatIconWrap}>
            <Pdf width={22} height={22} />
          </View>
          <Text style={styles.formatTitle}>
            {isLargeBatch ? 'ZIP (Multiple PDFs)' : 'PDF (Print Ready)'}
          </Text>
          <View style={styles.checkWrap}>
            <CheckCircle width={22} height={22} />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.secondaryBtnPressed,
            isLargeBatch && styles.secondaryBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="View batch PDF in app"
          disabled={isLargeBatch || metaLoading}
          onPress={onViewPdf}>
          <Text style={styles.secondaryBtnText}>
            {isLargeBatch ? 'View PDF (small batches only)' : 'View PDF'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            downloading && styles.primaryBtnDisabled,
            pressed && styles.primaryBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Download exported coupon batch"
          disabled={downloading || metaLoading}
          onPress={onDownload}>
          <Download width={20} height={20} />
          <Text style={styles.primaryBtnText}>{downloadButtonLabel}</Text>
        </Pressable>

        <Pressable
          onPress={onDiscard}
          style={styles.discardWrap}
          accessibilityRole="button"
          accessibilityLabel="Cancel and discard export">
          <Text style={styles.discard}>Cancel/Discard</Text>
        </Pressable>
      </ScrollView>

      <ExportProgressModal
        visible={downloading && isLargeBatch}
        status={exportStatus}
        totalCoupons={couponCount}
      />
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
  largeBatchHint: {
    fontSize: 13,
    lineHeight: 19,
    color: adminUi.labelMuted,
    marginTop: -12,
    marginBottom: 18,
    textAlign: 'center',
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
  secondaryBtnDisabled: { opacity: 0.5 },
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
