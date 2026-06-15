import { API_BASE_URL, PROD_API_BASE_URL } from '../api/config';

const COUPON_CODE_PATTERN = /^[0-9A-F]{12}$/;

/** URL opened when a coupon QR is scanned with the phone camera. */
export function buildCouponQrUrl(
  code: string,
  baseUrl = __DEV__ ? API_BASE_URL : PROD_API_BASE_URL,
): string {
  const normalized = code.trim().toUpperCase();
  if (!COUPON_CODE_PATTERN.test(normalized)) {
    return code.trim();
  }
  return `${baseUrl.replace(/\/$/, '')}/c/${normalized}`;
}

/** Extract redeemable coupon code from a scan (URL or bare code). */
export function normalizeScannedCouponInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.length) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/c\/([0-9A-F]{12})$/i);
      if (match) return match[1].toUpperCase();
    } catch {
      /* fall through */
    }
  }

  const bare = trimmed.match(/^([0-9A-F]{12})$/i);
  if (bare) return bare[1].toUpperCase();

  return trimmed.toUpperCase();
}

export function isCouponScanDeepLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.length) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'bestbond:' && parsed.host === 'scan') {
      return true;
    }
    const isCouponPath = /^\/c\/[0-9A-F]{12}$/i.test(parsed.pathname);
    if (!isCouponPath) return false;

    if (
      parsed.protocol === 'https:' &&
      parsed.host === 'api.bestbond.in'
    ) {
      return true;
    }

    // Local dev: camera opens http://<lan-ip>:3001/c/CODE in the browser.
    if (__DEV__ && parsed.protocol === 'http:') {
      const devBase = API_BASE_URL.replace(/\/$/, '');
      return trimmed.startsWith(`${devBase}/c/`);
    }
  } catch {
    return false;
  }

  return false;
}
