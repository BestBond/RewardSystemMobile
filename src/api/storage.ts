import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const PHONE_KEY = 'auth.phone';
const COUNTRY_CODE_KEY = 'auth.countryCode';

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string | null) {
  if (!token) return AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  return AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function getSavedPhone() {
  const [countryCode, phone] = await Promise.all([
    AsyncStorage.getItem(COUNTRY_CODE_KEY),
    AsyncStorage.getItem(PHONE_KEY),
  ]);
  return { countryCode: countryCode ?? '+91', phone: phone ?? '' };
}

export async function setSavedPhone(params: { countryCode: string; phone: string }) {
  await Promise.all([
    AsyncStorage.setItem(COUNTRY_CODE_KEY, params.countryCode),
    AsyncStorage.setItem(PHONE_KEY, params.phone),
  ]);
}

/** Clears JWT only (keeps saved phone for PIN login). */
export async function clearAuthSession() {
  await setAccessToken(null);
}

