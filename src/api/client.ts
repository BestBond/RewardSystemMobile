import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { getAccessToken } from './storage';

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
  if (/pin.*6|must match.*\{6\}/i.test(t)) {
    return 'Enter a valid 6-digit PIN.';
  }
  if (/otp expired|otp not found|invalid otp/i.test(t)) {
    return 'OTP expired or invalid. Request a new code.';
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
  if (/workers can redeem only slab rewards/i.test(t)) {
    return 'You can redeem only slab rewards: 5,000, 10,000, or 25,000 points.';
  }
  if (/current password is incorrect/i.test(t)) {
    return 'Current password is incorrect.';
  }
  if (/new password must be different/i.test(t)) {
    return 'New password should be different from current password.';
  }
  if (/cannot get\s*\/admin\/dashboard/i.test(t)) {
    return (
      'This API does not expose the admin dashboard (404). Another process on port 3000 may be an old build — stop it, then from reward-system-backend run: npm run build && npm run start:prod'
    );
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

async function buildHeaders(extra?: Record<string, string>) {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

function altLocalhostBase(baseUrl: string) {
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
    // Android emulator: 10.0.2.2 = host; 127.0.0.1 works if `adb reverse tcp:3000 tcp:3000`
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

function networkErrorUserMessage(detail: string): string {
  const hint =
    detail.includes('Network request failed') || detail.includes('Failed to connect')
      ? ' Start the Nest API (port 3000, listen on all interfaces, e.g. 0.0.0.0). On a phone, the app uses your Mac/PC LAN IP — same Wi‑Fi as the device.'
      : '';
  return `Network error (${API_BASE_URL}) — ${detail}.${hint}`;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    // Visible in Metro console to debug connectivity issues.
    console.log(`[API] POST ${API_BASE_URL}${path}`);
    res = await fetchWithLocalFallback(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: await buildHeaders(),
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
    throw new ApiError(messageFromErrorBody(json), res.status, json);
  }
  return json as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    console.log(`[API] GET ${API_BASE_URL}${path}`);
    res = await fetchWithLocalFallback(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: await buildHeaders(),
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error GET ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    throw new ApiError(messageFromErrorBody(json), res.status, json);
  }
  return json as T;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    console.log(`[API] PUT ${API_BASE_URL}${path}`);
    res = await fetchWithLocalFallback(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: await buildHeaders(),
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
    throw new ApiError(messageFromErrorBody(json), res.status, json);
  }
  return json as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  let res: Response;
  try {
    console.log(`[API] DELETE ${API_BASE_URL}${path}`);
    res = await fetchWithLocalFallback(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });
  } catch (e) {
    const detail = String((e as Error)?.message ?? e);
    console.warn(`[API] Network error DELETE ${API_BASE_URL}${path}`, detail);
    throw new ApiError(networkErrorUserMessage(detail), 0, detail);
  }
  const text = await res.text();
  const json = safeJsonParse(text);
  if (!res.ok) {
    throw new ApiError(messageFromErrorBody(json), res.status, json);
  }
  return json as T;
}

