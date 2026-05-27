import { Platform } from 'react-native';
import { resetAuthAfterSessionExpired } from '../navigation/rootNavigation';
import { API_BASE_URL, isProductionApiBaseUrl } from './config';
import { clearAuthSession, getAccessToken } from './storage';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    
  }
}

/** Reliable in RN/Hermes where `instanceof` can miss duplicate class identities. */
export function isApiError(e: unknown): e is ApiError {
  if (e instanceof ApiError) return true;
  if (!e || typeof e !== 'object') return false;
  const o = e as { status?: unknown; message?: unknown };
  return typeof o.status === 'number' && typeof o.message === 'string';
}

/** NestJS ValidationPipe / HttpException bodies often use `message: string | string[]`. */
function messageFromErrorBody(json: unknown): string {
  if (!json || typeof json !== 'object') return 'Request failed';
  const msg = (json as { message?: unknown }).message;
  if (Array.isArray(msg)) {
    const parts = msg.filter((x): x is string => typeof x === 'string');
    return parts.length ? parts.join(' ') : 'Request failed';
  }
  if (typeof msg === 'string' && msg.length > 0) return msg;
  return 'Request failed';
}

/** Maps regex-heavy server copy to short UI text. */
export function userFacingApiMessage(text: string): string {
  const t = text.trim();
  if (/phone.*10|must match.*\{10\}/i.test(t)) {
    return 'Enter a valid 10-digit mobile number.';
  }
  // Before generic passcode rules — API duplicate-phone copy includes "passcode".
  if (
    /mobile number is already registered|already registered.*log in|phone already exists/i.test(
      t,
    )
  ) {
    return 'A user already exists with this mobile number. Log in with your passcode instead.';
  }
  if (/passcode|pin.*6|must match.*\{6\}/i.test(t)) {
    return 'Enter a valid 6-digit passcode.';
  }
  if (/invalid passcode|passcode not configured/i.test(t)) {
    return 'Invalid passcode. Check your digits and try again.';
  }
  if (/not approved for management onboarding/i.test(t)) {
    return 'Your mobile number is not approved for management onboarding.';
  }
  if (/management account not found/i.test(t)) {
    return 'No management account found for this mobile number.';
  }
  if (/coupon not found/i.test(t)) {
    return 'Invalid coupon code.';
  }
  if (/expired/i.test(t) && /coupon/i.test(t)) {
    return 'This coupon has expired.';
  }
  if (/already used|inactive|redeemed/i.test(t)) {
    return 'This coupon was already used.';
  }
  if (/insufficient points/i.test(t)) {
    return 'Not enough points for this reward.';
  }
  if (/dealers cannot redeem directly/i.test(t)) {
    return 'Dealers cannot redeem directly. Please contact your shop/admin.';
  }
  if (/contractor tier.*points balance/i.test(t)) {
    return 'This gift is available only at Contractor tier (120,000+ points balance).';
  }
  if (/worker tier.*below/i.test(t)) {
    return 'This gift is available only at Contractor tier (120,000+ points balance).';
  }
  if (/current password is incorrect/i.test(t)) {
    return 'Current password is incorrect.';
  }
  if (/current passcode is incorrect/i.test(t)) {
    return 'Current passcode is incorrect.';
  }
  if (/new passcode must be different/i.test(t)) {
    return 'New passcode should be different from your current passcode.';
  }
  if (/passcode and confirmation do not match/i.test(t)) {
    return 'New passcode and confirmation do not match.';
  }
  if (/new password must be different/i.test(t)) {
    return 'New password should be different from current password.';
  }
  if (/cannot get\s*\/admin\/dashboard/i.test(t)) {
    return (
      'This API does not expose the admin dashboard (404). Another process on port 3000 may be an old build — stop it, then from reward-system-backend run: npm run build && npm run start:prod'
    );
  }
  if (/password is required for super admin/i.test(t)) {
    return 'Choose Super Admin at the top, then enter your account password (8+ characters).';
  }
  if (/^invalid password\.?$/i.test(t.trim())) {
    return 'Incorrect password. Try again.';
  }
  if (
    /cannot reach|network error|use_prod_api|adb reverse|api\.bestbond/i.test(
      t,
    )
  ) {
    return friendlyNetworkErrorMessage(t);
  }
  if (/internal server error/i.test(t)) {
    return 'Something went wrong on our side. Please try again in a few minutes.';
  }
  if (/service unavailable/i.test(t)) {
    return 'The service is temporarily unavailable. Please try again later.';
  }
  if (/request failed/i.test(t) && t.length < 40) {
    return 'Something went wrong. Please try again.';
  }
  return t;
}

function safeJsonParse(text: string) {
  try {
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return text;
  }
}

type RequestAuth = { headers: Record<string, string>; hadAccessToken: boolean };

async function buildRequestAuth(extra?: Record<string, string>): Promise<RequestAuth> {
  const token = await getAccessToken();
  return {
    hadAccessToken: Boolean(token),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra ?? {}),
    },
  };
}

async function throwIfNotOk(
  res: Response,
  json: unknown,
  hadAccessToken: boolean,
): Promise<never> {
  if (res.status === 401 && hadAccessToken) {
    await clearAuthSession();
    resetAuthAfterSessionExpired();
  }
  throw new ApiError(messageFromErrorBody(json), res.status, json);
}

function altLocalhostBase(baseUrl: string) {
  if (!baseUrl.startsWith('http://')) return null;
  if (baseUrl.includes('localhost')) return baseUrl.replace('localhost', '127.0.0.1');
  if (baseUrl.includes('127.0.0.1')) return baseUrl.replace('127.0.0.1', 'localhost');
  return null;
}

/** Same path on another host (for emulator ↔ adb reverse fallbacks). */
function samePathOnHost(fullUrl: string, host: string): string | null {
  try {
    const u = new URL(fullUrl);
    const port = u.port ? `:${u.port}` : '';
    return `${u.protocol}//${host}${port}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

function alternateUrlsForFailedFetch(fullUrl: string): string[] {
  const out: string[] = [];
  try {
    const u = new URL(fullUrl);
    // Android emulator: 10.0.2.2 = host; 127.0.0.1 works if `adb reverse tcp:3001 tcp:3001`
    if (Platform.OS === 'android' && u.hostname === '10.0.2.2') {
      const one = samePathOnHost(fullUrl, '127.0.0.1');
      if (one) out.push(one);
    }
  } catch {
    /* ignore */
  }
  return out;
}

async function fetchWithLocalFallback(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const tried = new Set<string>();
  const tryFetch = async (u: string): Promise<Response> => {
    tried.add(u);
    return fetch(u, init);
  };

  try {
    return await tryFetch(url);
  } catch (first) {
    const altBase = altLocalhostBase(API_BASE_URL);
    if (altBase) {
      const altUrl = url.replace(API_BASE_URL, altBase);
      if (!tried.has(altUrl)) {
        try {
          console.warn(`[API] Retry with ${altBase}`);
          return await tryFetch(altUrl);
        } catch {
          /* continue */
        }
      }
    }

    for (const alt of alternateUrlsForFailedFetch(url)) {
      if (tried.has(alt)) continue;
      try {
        console.warn(`[API] Retry URL ${alt}`);
        return await tryFetch(alt);
      } catch {
        /* try next */
      }
    }

    throw first;
  }
}

function isRetryableNetworkError(e: unknown): boolean {
  const detail = String((e as Error)?.message ?? e).toLowerCase();
  return (
    detail.includes('network request failed') ||
    detail.includes('failed to connect') ||
    detail.includes('unable to resolve host') ||
    detail.includes('timed out') ||
    detail.includes('timeout') ||
    detail.includes('connection') ||
    detail.includes('ssl') ||
    detail.includes('certificate')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Short, user-safe copy — never expose URLs or dev config. */
export function friendlyNetworkErrorMessage(detail: string): string {
  const d = detail.toLowerCase();
  if (
    d.includes('unable to resolve host') ||
    d.includes('no address associated')
  ) {
    return 'Unable to reach BestBond. Check your internet or try switching between Wi‑Fi and mobile data.';
  }
  if (d.includes('timeout') || d.includes('timed out')) {
    return 'The connection timed out. Please try again.';
  }
  if (
    d.includes('ssl') ||
    d.includes('certificate') ||
    d.includes('handshake')
  ) {
    return 'Secure connection failed. Check your device date and time, then try again.';
  }
  return 'Unable to connect. Please check your internet connection and try again.';
}

function networkErrorUserMessage(detail: string): string {
  if (__DEV__) {
    console.warn(`[API] Network failure (${API_BASE_URL}):`, detail);
    const isConn = isRetryableNetworkError({ message: detail });
    if (!isProductionApiBaseUrl() && isConn) {
      return `${friendlyNetworkErrorMessage(detail)} (Dev: start local API on port 3001 or set USE_PROD_API_IN_DEV in config.)`;
    }
  }
  return friendlyNetworkErrorMessage(detail);
}

const PROD_FETCH_ATTEMPTS = 3;
const PROD_FETCH_RETRY_MS = 700;

async function fetchWithRetries(url: string, init: RequestInit): Promise<Response> {
  const attempts = isProductionApiBaseUrl() ? PROD_FETCH_ATTEMPTS : 1;
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fetchWithLocalFallback(url, init);
    } catch (e) {
      lastErr = e;
      if (i < attempts && isRetryableNetworkError(e)) {
        if (__DEV__) {
          console.warn(`[API] Retry ${i + 1}/${attempts} after network error`);
        }
        await delay(PROD_FETCH_RETRY_MS * i);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  const auth = await buildRequestAuth();
  try {
    // Visible in Metro console to debug connectivity issues.
    console.log(`[API] POST ${API_BASE_URL}${path}`);
    res = await fetchWithRetries(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...auth.headers,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error POST ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    await throwIfNotOk(res, json, auth.hadAccessToken);
  }
  return json as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  const auth = await buildRequestAuth();
  try {
    console.log(`[API] GET ${API_BASE_URL}${path}`);
    res = await fetchWithRetries(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...auth.headers,
      },
      cache: 'no-store',
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error GET ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    await throwIfNotOk(res, json, auth.hadAccessToken);
  }
  return json as T;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  const auth = await buildRequestAuth();
  try {
    console.log(`[API] PUT ${API_BASE_URL}${path}`);
    res = await fetchWithRetries(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: auth.headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error PUT ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    await throwIfNotOk(res, json, auth.hadAccessToken);
  }
  return json as T;
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  const auth = await buildRequestAuth();
  try {
    console.log(`[API] DELETE ${API_BASE_URL}${path}`);
    res = await fetchWithRetries(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: auth.headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error DELETE ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    await throwIfNotOk(res, json, auth.hadAccessToken);
  }
  return json as T;
}

