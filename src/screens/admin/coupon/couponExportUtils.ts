import { Platform, Share } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import { API_BASE_URL } from '../../../api/config';
import {
  COUPON_EXPORT_POLL_MS,
  COUPON_EXPORT_SYNC_MAX,
  getBatchExportDownloadLink,
  getBatchExportJobStatus,
  startBatchExportJob,
  type ExportJobStatus,
} from '../../../api/couponExport';
import { getAccessToken } from '../../../api/storage';
import { isApiError } from '../../../api/client';

export function formatExportFileSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function exportOverlayTitle(status: ExportJobStatus | null): string {
  if (!status) return 'Preparing export…';
  if (status.phase === 'zipping') return 'Packaging ZIP file…';
  if (status.phase === 'downloading') return 'Downloading ZIP…';
  if (status.ready || status.phase === 'ready') return 'Preparing download…';
  if (status.progressPct > 0) return 'Generating coupon PDFs…';
  return 'Starting export…';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isExportTooLargeError(err: unknown): boolean {
  if (isApiError(err) && err.status === 400) {
    const body = err.body;
    if (body && typeof body === 'object' && 'code' in body) {
      if ((body as { code?: string }).code === 'EXPORT_TOO_LARGE') return true;
    }
    const nested = body as { message?: { code?: string; message?: string } | string };
    if (
      nested?.message &&
      typeof nested.message === 'object' &&
      nested.message.code === 'EXPORT_TOO_LARGE'
    ) {
      return true;
    }
    const msg = err.message.toLowerCase();
    return msg.includes('async export') || msg.includes('export_too_large');
  }
  if (err instanceof Error && /download failed \(400\)/i.test(err.message)) {
    return true;
  }
  return false;
}

export async function exportErrorMessage(
  err: unknown,
  isZip = false,
): Promise<string> {
  if (isApiError(err)) {
    if (err.status === 0) {
      return isZip
        ? 'Connection lost during export. Tap Download again — progress is saved and export will resume.'
        : 'Connection lost. Wait a moment and try again.';
    }
    if (err.status === 400 && isExportTooLargeError(err)) {
      return 'This batch is too large for a single PDF. Use Download ZIP.';
    }
    if (err.message && err.message !== '[object Object]') {
      return err.message;
    }
  }
  const msg = String((err as Error)?.message ?? err);
  if (/timeout|timed out/i.test(msg)) {
    return isZip
      ? 'Export timed out. Tap Download again — export will resume from the last checkpoint.'
      : 'PDF generation timed out. Try Download ZIP for large batches.';
  }
  return msg || 'Export failed';
}

async function pollExportJobUntilReady(
  batchId: string,
  jobId: string,
  onProgress: (status: ExportJobStatus) => void,
): Promise<ExportJobStatus> {
  for (;;) {
    const status = await getBatchExportJobStatus(batchId, jobId);
    onProgress(status);
    if (status.ready) return status;
    if (status.failed) {
      throw new Error(status.error ?? 'Export failed on the server');
    }
    await sleep(COUPON_EXPORT_POLL_MS);
  }
}

async function downloadToFile(params: {
  fromUrl: string;
  toFile: string;
  headers?: Record<string, string>;
}): Promise<void> {
  const parent = params.toFile.replace(/\/[^/]+$/, '');
  if (parent) {
    await RNFS.mkdir(parent).catch(() => {});
  }
  const existing = await RNFS.exists(params.toFile);
  if (existing) {
    await RNFS.unlink(params.toFile).catch(() => {});
  }

  const result = await RNFS.downloadFile({
    fromUrl: params.fromUrl,
    toFile: params.toFile,
    headers: params.headers,
    background: Platform.OS === 'ios',
    discretionary: Platform.OS === 'ios',
  }).promise;

  if (result.statusCode && result.statusCode >= 400) {
    throw new Error(`Download failed (${result.statusCode})`);
  }
}

export async function shareLocalExportFile(params: {
  filePath: string;
  batchId: string;
  mime: 'application/pdf' | 'application/zip';
}): Promise<void> {
  const { filePath, batchId, mime } = params;
  if (Platform.OS === 'android') {
    if (mime === 'application/pdf') {
      await ReactNativeBlobUtil.android.actionViewIntent(filePath, mime);
      return;
    }
    await Share.share({
      title: `Coupon batch ${batchId}`,
      message: `Coupon batch ${batchId}`,
      url: `file://${filePath}`,
    });
    return;
  }

  await Share.share({
    title: `Coupon batch ${batchId}`,
    url: `file://${filePath}`,
  });
}

export async function downloadSyncBatchPdf(batchId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const docDir = RNFS.DocumentDirectoryPath;
  if (!docDir) {
    throw new Error(
      'File module is not linked. Rebuild the app after pod install.',
    );
  }

  const fromUrl = `${API_BASE_URL}/coupons/batches/${encodeURIComponent(
    batchId,
  )}/export.pdf`;
  const toFile = `${docDir}/coupon-batch-${batchId}.pdf`;

  await downloadToFile({
    fromUrl,
    toFile,
    headers: { Authorization: `Bearer ${token}` },
  });

  return toFile;
}

export async function runAsyncBatchExport(params: {
  batchId: string;
  totalCoupons: number;
  onProgress: (status: ExportJobStatus) => void;
}): Promise<{ filePath: string; fileSizeBytes: number }> {
  const { batchId, totalCoupons, onProgress } = params;
  const start = await startBatchExportJob(batchId);
  const jobId = start.jobId;
  if (!jobId) throw new Error('Export job could not be started');

  onProgress({
    ...start,
    phase: 'generating',
    progressPct: start.progressPct ?? 0,
    processedCoupons: start.processedCoupons ?? 0,
    totalCoupons,
    ready: false,
    failed: false,
  });

  const finalStatus = await pollExportJobUntilReady(batchId, jobId, onProgress);

  onProgress({
    ...finalStatus,
    phase: 'downloading',
    progressPct: 100,
    totalCoupons,
  });

  const link = await getBatchExportDownloadLink(batchId, jobId);
  const downloadUrl = `${API_BASE_URL.replace(/\/$/, '')}${link.path}`;

  const docDir = RNFS.DocumentDirectoryPath;
  if (!docDir) {
    throw new Error(
      'File module is not linked. Rebuild the app after pod install.',
    );
  }

  const toFile = `${docDir}/coupon-batch-${batchId}.zip`;
  await downloadToFile({ fromUrl: downloadUrl, toFile });

  return { filePath: toFile, fileSizeBytes: link.fileSizeBytes };
}

export function shouldUseAsyncExport(
  totalCoupons: number,
  useAsyncExport?: boolean,
): boolean {
  if (useAsyncExport != null) return useAsyncExport;
  return totalCoupons > COUPON_EXPORT_SYNC_MAX;
}
