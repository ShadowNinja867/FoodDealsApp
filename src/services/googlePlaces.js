/**
 * Places search goes through your Food Deals API server (single Google key on the backend).
 * Configure EXPO_PUBLIC_API_BASE_URL (see server/README.txt).
 */

import { apiPostJson, isFoodDealsApiConfigured } from './foodDealsApi';

/** True when the app knows where to call for Places + deals sync. */
export function hasPlacesApiKey() {
  return isFoodDealsApiConfigured();
}

export { isFoodDealsApiConfigured };

/**
 * @param {string} chainTitle
 * @param {string} displayName
 */
export function placeNameMatchesChain(chainTitle, displayName) {
  const c = normalizeBrand(chainTitle);
  const n = normalizeBrand(displayName);
  if (!c || !n) return false;
  return n.includes(c) || c.includes(n);
}

function normalizeBrand(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * @param {string} input
 * @param {{ latitude: number, longitude: number }} location
 * @param {AbortSignal} [signal]
 */
export async function autocompleteRestaurants(input, location, signal) {
  const json = await apiPostJson(
    '/api/places/autocomplete',
    { input: String(input || ''), location },
    signal
  );
  const list = json?.suggestions;
  return Array.isArray(list) ? list : [];
}

/**
 * @param {string} chainTitle
 * @param {{ latitude: number, longitude: number }} location
 * @param {number} radiusMeters
 * @param {AbortSignal} [signal]
 */
export async function resolveBranchesForChain(chainTitle, location, radiusMeters, signal) {
  const json = await apiPostJson(
    '/api/places/branches',
    { chainTitle: String(chainTitle || ''), location, radiusMeters },
    signal
  );
  const list = json?.branches;
  return Array.isArray(list) ? list : [];
}

/**
 * @param {string} placeId
 * @param {number} lat
 * @param {number} lng
 */
export function googleMapsPlaceUrl(placeId, lat, lng) {
  const pid = typeof placeId === 'string' ? placeId : '';
  if (!pid || pid.startsWith('demo-') || pid.startsWith('local:')) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const rawId = pid.replace(/^places\//, '');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&query_place_id=${encodeURIComponent(rawId)}`;
}
