import { Platform } from 'react-native';

type SourceCodeModule = { getConstants: () => { scriptURL: string } };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const NativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode')
  .default as SourceCodeModule;

/** Production API (admin + mobile release builds). */
export const PROD_API_BASE_URL = 'https://api.bestbond.in';

/**
 * Dev builds: when true, use PROD_API_BASE_URL (same as admin.bestbond.in).
 * When false, use local Nest on port 3000 (emulator: 10.0.2.2).
 */
const USE_PROD_API_IN_DEV = false;

/**
 * Only used when USE_PROD_API_IN_DEV is false.
 * Set to your Mac LAN IP (e.g. `ipconfig getifaddr en0`) for a physical device on Wi‑Fi.
 * Leave null to derive host from the Metro bundle URL.
 */
const DEV_API_HOST_OVERRIDE: string | null = null;

const DEV_API_PORT = 3000;

function getMetroHost(): string | null {
  if (DEV_API_HOST_OVERRIDE?.trim()) {
    return DEV_API_HOST_OVERRIDE.trim();
  }
  try {
    const scriptURL = NativeSourceCode.getConstants().scriptURL;
    if (typeof scriptURL !== 'string' || scriptURL.length === 0) return null;
    const u = new URL(scriptURL);
    return u.hostname || null;
  } catch {
    return null;
  }
}

function computeLocalDevApiBaseUrl(): string {
  const metroHost = getMetroHost();

  if (metroHost && metroHost !== '0.0.0.0') {
    if (
      Platform.OS === 'android' &&
      (metroHost === 'localhost' || metroHost === '127.0.0.1')
    ) {
      return `http://10.0.2.2:${DEV_API_PORT}`;
    }
    return `http://${metroHost}:${DEV_API_PORT}`;
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${DEV_API_PORT}`;
  return `http://localhost:${DEV_API_PORT}`;
}

function computeApiBaseUrl(): string {
  if (!__DEV__) {
    return PROD_API_BASE_URL;
  }
  if (USE_PROD_API_IN_DEV) {
    return PROD_API_BASE_URL;
  }
  return computeLocalDevApiBaseUrl();
}

export const API_BASE_URL = computeApiBaseUrl();
// export const API_BASE_URL = 'https://api.bestbond.in'

export function isProductionApiBaseUrl(): boolean {
  return API_BASE_URL.startsWith('https://api.bestbond.in');
}
