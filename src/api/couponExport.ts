import { apiGet, apiPost } from './client';

export const COUPON_EXPORT_SYNC_MAX = 300;
export const COUPON_EXPORT_POLL_MS = 2_000;

export type BatchExportMeta = {
  batchId: string;
  totalCoupons: number;
  syncMax: number;
  useAsyncExport: boolean;
};

export type ExportJobStatus = {
  jobId: string;
  status: string;
  phase?: string;
  progressPct: number;
  processedCoupons: number;
  totalCoupons: number;
  fileSizeBytes?: number | null;
  ready: boolean;
  failed: boolean;
  error?: string | null;
};

export type ExportDownloadLink = {
  path: string;
  fileSizeBytes: number;
  expiresInSeconds: number;
};

export async function getBatchExportMeta(batchId: string): Promise<BatchExportMeta> {
  return apiGet<BatchExportMeta>(
    `/coupons/batches/${encodeURIComponent(batchId.trim())}/export/meta`,
  );
}

export async function startBatchExportJob(batchId: string): Promise<ExportJobStatus> {
  return apiPost<ExportJobStatus>(
    `/coupons/batches/${encodeURIComponent(batchId.trim())}/export/async`,
    {},
  );
}

export async function getBatchExportJobStatus(
  batchId: string,
  jobId: string,
): Promise<ExportJobStatus> {
  return apiGet<ExportJobStatus>(
    `/coupons/batches/${encodeURIComponent(batchId.trim())}/export/jobs/${encodeURIComponent(jobId)}`,
  );
}

export async function getBatchExportDownloadLink(
  batchId: string,
  jobId: string,
): Promise<ExportDownloadLink> {
  return apiGet<ExportDownloadLink>(
    `/coupons/batches/${encodeURIComponent(batchId.trim())}/export/jobs/${encodeURIComponent(jobId)}/download-link`,
  );
}
