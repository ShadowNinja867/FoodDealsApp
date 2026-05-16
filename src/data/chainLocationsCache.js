import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineDistanceMeters } from '../utils/geo';

const STORAGE_KEY = '@fooddealsapp/chain_locations_v1';

/** @returns {Promise<Record<string, { centerLat: number, centerLng: number, savedAt: number, branches: Array<object> }>>} */
async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

/**
 * Reuse branch list if we already fetched this chain near this area recently.
 * @param {string} chainSlug from slugChain()
 * @param {number} userLat
 * @param {number} userLng
 * @param {number} maxAgeMs
 * @param {number} maxCenterShiftMeters — user moved “same city” if under this
 * @returns {Promise<Array<{ id: string, name: string, address: string, latitude: number, longitude: number }> | null>}
 */
export async function getCachedBranchesForArea(chainSlug, userLat, userLng, maxAgeMs, maxCenterShiftMeters) {
  const all = await readAll();
  const entry = all[chainSlug];
  if (!entry || !Array.isArray(entry.branches) || entry.branches.length === 0) return null;
  if (Date.now() - entry.savedAt > maxAgeMs) return null;
  const d = haversineDistanceMeters(
    { latitude: userLat, longitude: userLng },
    { latitude: entry.centerLat, longitude: entry.centerLng }
  );
  if (d > maxCenterShiftMeters) return null;
  return entry.branches;
}

/**
 * @param {string} chainSlug
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array<{ id: string, name: string, address: string, latitude: number, longitude: number }>} branches
 */
export async function saveBranchesCache(chainSlug, userLat, userLng, branches) {
  const all = await readAll();
  all[chainSlug] = {
    centerLat: userLat,
    centerLng: userLng,
    savedAt: Date.now(),
    branches,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
