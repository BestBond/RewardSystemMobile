jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/navigation/rootNavigation', () => ({
  resetAuthAfterSessionExpired: jest.fn(),
  rootNavigationRef: { isReady: () => false },
}));
jest.mock('react-native-blob-util', () => ({
  fs: { dirs: { CacheDir: '/tmp' } },
  android: { actionViewIntent: jest.fn() },
  ios: { presentPreview: jest.fn() },
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  downloadFile: jest.fn(),
  mkdir: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

import { ApiError } from '../src/api/client';
import type { ExportJobStatus } from '../src/api/couponExport';
import { COUPON_EXPORT_SYNC_MAX } from '../src/api/couponExport';
import {
  formatExportFileSize,
  exportOverlayTitle,
  isExportTooLargeError,
  shouldUseAsyncExport,
} from '../src/screens/admin/coupon/couponExportUtils';

describe('couponExportUtils', () => {
  describe('shouldUseAsyncExport', () => {
    it('uses async when coupon count exceeds sync max', () => {
      expect(shouldUseAsyncExport(COUPON_EXPORT_SYNC_MAX + 1)).toBe(true);
      expect(shouldUseAsyncExport(500)).toBe(true);
    });

    it('uses sync PDF for batches at or below sync max', () => {
      expect(shouldUseAsyncExport(COUPON_EXPORT_SYNC_MAX)).toBe(false);
      expect(shouldUseAsyncExport(50)).toBe(false);
    });

    it('respects explicit useAsyncExport from API meta', () => {
      expect(shouldUseAsyncExport(50, true)).toBe(true);
      expect(shouldUseAsyncExport(500, false)).toBe(false);
    });
  });

  describe('isExportTooLargeError', () => {
    it('detects EXPORT_TOO_LARGE code in ApiError body', () => {
      const err = new ApiError('Request failed', 400, {
        message: {
          message: 'Use async export',
          code: 'EXPORT_TOO_LARGE',
        },
      });
      expect(isExportTooLargeError(err)).toBe(true);
    });

    it('detects async export message text', () => {
      const err = new ApiError(
        'This batch has 500 coupons. Use async export (ZIP) for batches over 300.',
        400,
        {},
      );
      expect(isExportTooLargeError(err)).toBe(true);
    });

    it('detects RNFS 400 download failure', () => {
      expect(isExportTooLargeError(new Error('Download failed (400)'))).toBe(
        true,
      );
    });

    it('returns false for unrelated errors', () => {
      expect(isExportTooLargeError(new ApiError('Not found', 404, {}))).toBe(
        false,
      );
    });
  });

  describe('formatExportFileSize', () => {
    it('formats KB, MB, and GB', () => {
      expect(formatExportFileSize(512)).toBe('512 B');
      expect(formatExportFileSize(2048)).toBe('2.0 KB');
      expect(formatExportFileSize(5_000_000)).toBe('5.0 MB');
    });
  });

  describe('exportOverlayTitle', () => {
    it('returns phase-specific titles', () => {
      expect(exportOverlayTitle(null)).toBe('Preparing export…');
      expect(
        exportOverlayTitle({
          jobId: 'j1',
          status: 'processing',
          phase: 'zipping',
          progressPct: 90,
          processedCoupons: 280,
          totalCoupons: 301,
          ready: false,
          failed: false,
        } as ExportJobStatus),
      ).toBe('Packaging ZIP file…');
    });
  });
});
