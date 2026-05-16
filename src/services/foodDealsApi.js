import Constants from 'expo-constants';

/**
 * Public base URL of the Food Deals API (no secrets). Set EXPO_PUBLIC_API_BASE_URL or local.keys.json apiBaseUrl.
 */
export function getApiBaseUrl() {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  const a =
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL?.trim?.()) ||
    '';
  return a.replace(/\/$/, '');
}

export function isFoodDealsApiConfigured() {
  return getApiBaseUrl().length > 0;
}

/**
 * @param {string} path e.g. "/api/places/branches"
 * @param {object} body
 * @param {AbortSignal} [signal]
 */
export async function apiPostJson(path, body, signal) {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set. Run the Food Deals API server and set the app base URL.');
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || res.statusText || 'Request failed';
    throw new Error(typeof msg === 'string' ? msg : 'Request failed');
  }
  return json;
}
