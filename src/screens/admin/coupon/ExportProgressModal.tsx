import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ExportJobStatus } from '../../../api/couponExport';
import { adminUi } from '../../../theme/adminUi';
import {
  exportOverlayTitle,
  formatExportFileSize,
} from './couponExportUtils';

type ExportProgressModalProps = {
  visible: boolean;
  status: ExportJobStatus | null;
  totalCoupons: number;
};

export function ExportProgressModal({
  visible,
  status,
  totalCoupons,
}: ExportProgressModalProps) {
  const pct = Math.min(100, Math.max(0, Math.round(status?.progressPct ?? 0)));
  const title = exportOverlayTitle(status);
  const processed = status?.processedCoupons ?? 0;
  const total = status?.totalCoupons ?? totalCoupons;
  const fileSizeBytes = status?.fileSizeBytes ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={adminUi.accentOrange} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {status?.phase === 'downloading' && fileSizeBytes
              ? `${formatExportFileSize(fileSizeBytes)} — saving to your device`
              : `${processed.toLocaleString()} / ${total.toLocaleString()} coupons`}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>
          <Text style={styles.hint}>
            Keep the app open. Large batches can take several minutes — tap
            Download again if interrupted and export will resume.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 38, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: adminUi.white,
    padding: 24,
    alignItems: 'center',
    ...adminUi.shadowCard,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.navyAlt,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: adminUi.labelMuted,
    textAlign: 'center',
  },
  track: {
    marginTop: 18,
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: adminUi.accentOrange,
  },
  pct: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '800',
    color: adminUi.accentOrange,
  },
  hint: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: adminUi.labelMuted,
    textAlign: 'center',
  },
});
