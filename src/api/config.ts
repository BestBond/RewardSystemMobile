import { Platform } from 'react-native';

type SourceCodeModule = { getConstants: () => { scriptURL: string } };

// Same implementation RN uses for `getDevServer()` — works on physical devices (LAN IP in script URL).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode')
  .default as SourceCodeModule;

/**
 * Optional manual override when script URL host cannot be read (unusual dev setups).
 * Example: your Mac’s Wi‑Fi IP from `ipconfig getifaddr en0` — `192.168.1.42`
 */
const DEV_API_HOST_OVERRIDE: string | null = '10.149.73.173';
/**
 * Dev base URLs.
 * - Physical device: hostname comes from the Metro bundle URL (same LAN as your machine).
 * - iOS simulator: localhost * - Android emulator: 10.0.2.2
 */
function getMetroHost(): string | null {
  if (DEV_API_HOST_OVERRIDE?.trim()) {
    return DEV_API_HOST_OVERRIDE.trim();
  }
  try {
    const scriptURL = NativeSourceCode.getConstants().scriptURL;
    if (typeof scriptURL !== 'string' || scriptURL.length === 0) return null;
    const u = new URL(scriptURL);
    const host = u.hostname;
    return host || null;
  } catch {
    return null;
  }
}

function computeApiBaseUrl(): string {
  // Production / release builds
  if (!__DEV__) {
    return 'https://api.bestbond.in';
  }

  const metroHost = getMetroHost();

  if (__DEV__ && metroHost && metroHost !== '0.0.0.0') {
    // Android emulators cannot use 'localhost' to reach the host machine.
    if (Platform.OS === 'android' && (metroHost === 'localhost' || metroHost === '127.0.0.1')) {
      return 'http://10.0.2.2:3000';
    }
    return `http://${metroHost}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  // iOS simulator / fallback — never use 0.0.0.0 (invalid as a client URL on device).
  return 'http://localhost:3000';
}

export const API_BASE_URL = computeApiBaseUrl();

// export const API_BASE_URL = 'https://api.bestbond.in';

